# Agentic Coding Sessions — 3 Proposals

## Context

Flow Machine needs agentic coding sessions where users can start AI-powered coding tasks and interact with the agent (reply to questions). The agent backends are **Claude Code** and **OpenAI Codex**, running inside **Daytona** sandboxed dev environments. The service already has AI Agent entities, an SDLC workflow orchestrator (Inngest + workflow-kit) with placeholder `code` action handler, and `@daytonaio/sdk` installed but unused.

## Shared Domain Model (All Proposals)

### New Entities

**CodingSessionEntity** (`core/domain/coding-session/entity.ts`)
- Props: `aiAgentId`, `projectId`, `sandboxId` (Daytona workspace), `provider` (`"claude-code" | "codex"`), `status` (`"provisioning" | "active" | "waiting_for_user" | "completed" | "failed"`), `title`, `systemPrompt`
- Methods: `markActive()`, `markWaitingForUser()`, `markCompleted()`, `markFailed()`

**CodingSessionMessageEntity** (`core/domain/coding-session/message/entity.ts`)
- Props: `sessionId`, `role` (`"user" | "agent"`), `content`, `toolUse` (optional), `status` (`"pending" | "streaming" | "complete" | "error"`)

### New Port Interfaces
- `CodingSessionCrudRepository` / `CodingSessionCrudService`
- `CodingSessionMessageCrudRepository` / `CodingSessionMessageCrudService`
- `SandboxService` (`core/infra/sandbox/service.ts`) — abstraction over Daytona: `create()`, `destroy()`, `exec(command)`
- `AgentRunnerService` (`core/infra/agent-runner/service.ts`) — abstraction over Claude Code / Codex execution

### New Infrastructure
- `DaytonaSandboxService` (`infra/daytona/service.ts`) — implements `SandboxService` using `@daytonaio/sdk`
- `ClaudeCodeRunnerService` / `CodexRunnerService` — implement `AgentRunnerService`
- MongoDB collections: `coding_session`, `coding_session_message`

---

## Proposal A: Inngest Polling Architecture

**Approach**: Agent runs as a durable Inngest function. Uses `waitForEvent` for human-in-the-loop replies. Frontend polls for messages.

### Session Start
1. `POST /api/v1/coding-session` creates entity, sends Inngest event `coding-session.start`
2. Inngest function provisions Daytona sandbox via `step.run("provision-sandbox")`
3. Runs `claude --print --output-format json` (or Codex CLI) inside sandbox via `SandboxService.exec()`

### Conversation Loop (inside Inngest function)
1. `step.run("execute-agent-turn")` — run agent, parse output, store messages in MongoDB
2. If agent asks a question → set session status to `waiting_for_user`, call `step.waitForEvent("coding-session.user-reply", { timeout: "1h", match: "data.sessionId" })`
3. When user reply event arrives → loop back to step 1

### User Replies
- `POST /api/v1/coding-session/:id/message` — validates session is `waiting_for_user`, stores message, sends Inngest event `coding-session.user-reply`

### Real-Time Communication
- Polling: `GET /api/v1/coding-session/:id/message?after=<messageId>` every 2-3s
- Session status in `GET /api/v1/coding-session/:id`

### SDLC Integration
- The `code` action handler in `action-definition-service.ts` creates a coding session and uses `waitForEvent` for completion

### Pros
- No new transport protocols — reuses existing Inngest infrastructure
- Inngest handles retries, timeouts, durability out of the box
- `waitForEvent` is purpose-built for human-in-the-loop
- Simplest frontend (just polling)

### Cons
- 2-3s polling latency
- No streaming of agent output mid-turn (only visible after turn completes)
- Higher database read load from polling

---

## Proposal B: SSE Streaming Architecture

**Approach**: Server-Sent Events for real-time streaming of agent output. MongoDB change streams push updates. Inngest handles only job dispatch, not the conversation loop.

### Session Start
1. `POST /api/v1/coding-session` creates entity, returns session ID
2. Client opens SSE connection: `GET /api/v1/coding-session/:id/stream`
3. Inngest function `coding-session.provision` creates Daytona sandbox, starts agent

### Agent Execution
- A worker process (in `worker.ts`) manages agent turns
- Runs `claude --print --output-format stream-json` inside Daytona sandbox
- Parses streaming chunks, inserts partial messages into MongoDB with `status: "streaming"`
- SSE endpoint uses MongoDB change stream on `coding_session_message` collection to push updates to client

### User Replies
- `POST /api/v1/coding-session/:id/message` stores user message, triggers next agent turn
- SSE connection stays open — client sees the agent's streaming response

### Real-Time Communication
```
// Elysia SSE via generator pattern
.get("/:id/stream", async function* ({ params }) {
  const changeStream = messageCollection.watch([
    { $match: { "fullDocument.sessionId": params.id } }
  ]);
  for await (const change of changeStream) {
    yield { data: JSON.stringify(change.fullDocument) };
  }
})
```

### SDLC Integration
- The `code` action handler creates a coding session and polls for terminal status (`completed` / `failed`)

### Pros
- Real-time streaming of agent output (character-by-character possible)
- SSE works well through proxies/load balancers
- Unidirectional streaming matches the use case (user sends via POST, receives via SSE)

### Cons
- Requires MongoDB replica set for change streams (operational complexity)
- Worker process design is more complex than Inngest's built-in durability
- Long-lived SSE connections need careful resource management

---

## Proposal C: WebSocket Bidirectional Chat Architecture

**Approach**: Full bidirectional WebSocket connection for the session. The WS handler manages the entire lifecycle — starting agent, streaming output, receiving replies. Inngest only for sandbox provisioning/cleanup.

### Session Start
1. `POST /api/v1/coding-session` creates entity, provisions Daytona sandbox (via Inngest)
2. Client opens WebSocket: `ws://host/api/v1/coding-session/:id/ws`

### Agent Execution
- WebSocket handler holds a reference to the agent process in the Daytona sandbox
- Agent stdout is piped directly to WebSocket as `{ type: "agent_chunk", content }` messages
- When agent requests input → sends `{ type: "agent_question", content }`
- User sends `{ type: "user_reply", content }` over the WebSocket
- Messages persisted to MongoDB as they flow through (system of record, not transport)

### WebSocket Protocol
**Server → Client**: `session_ready`, `agent_chunk`, `agent_message`, `agent_question`, `session_ended`, `error`
**Client → Server**: `user_message`, `abort`, `ping`

### Sandbox Management
- Created on session start, destroyed on WebSocket close (with grace period)
- Cleanup Inngest cron job catches orphaned sandboxes

### SDLC Integration
- The `code` action handler creates a "headless" coding session (no WebSocket — orchestrator acts as the user programmatically)
- Supports both interactive (user via WS) and automated (orchestrator-driven) modes

### Pros
- Lowest latency, true bidirectional communication
- Native abort/cancel support
- Agent output streams directly to client
- Cleanest UX for interactive sessions

### Cons
- Stateful connections break horizontal scaling (needs sticky sessions or Redis pub/sub)
- More complex reconnection handling
- Server restart kills active sessions (mitigated by MongoDB conversation persistence)

---

## Comparison Matrix

| Dimension | A (Polling) | B (SSE) | C (WebSocket) |
|-----------|-------------|---------|----------------|
| Latency | 2-3s polling | Sub-second | Near-instant |
| Complexity | Lowest | Medium | Highest |
| Durability | Inngest built-in | Mixed (Inngest + worker) | Manual (in-memory + MongoDB) |
| Horizontal scaling | Works naturally | Works with replica set | Needs sticky sessions |
| Streaming output | No (turn-complete) | Yes | Yes |
| Abort/cancel | Difficult | Possible | Native |
| Existing pattern reuse | Highest | Medium | Lowest |
| New dependencies | None | MongoDB replica set | `@elysiajs/websocket` |
| SDLC integration | Seamless | Good | Good (headless mode) |

## Files to Create/Modify (All Proposals)

### New files (shared)
- `core/domain/coding-session/entity.ts`
- `core/domain/coding-session/crud-repository.ts`
- `core/domain/coding-session/crud-service.ts`
- `core/domain/coding-session/message/entity.ts`
- `core/domain/coding-session/message/crud-repository.ts`
- `core/domain/coding-session/message/crud-service.ts`
- `core/infra/sandbox/service.ts`
- `core/infra/agent-runner/service.ts`
- `app/domain/coding-session/basic-crud-service.ts`
- `app/domain/coding-session/message/basic-crud-service.ts`
- `app/feature/coding-session/basic-service.ts`
- `infra/daytona/service.ts` + `client-factory.ts`
- `infra/agent-runner/claude-code-runner.ts` + `codex-runner.ts`
- `infra/mongo/coding-session/model.ts` + `crud-repository.ts`
- `infra/mongo/coding-session/message/model.ts` + `crud-repository.ts`
- `api/module/coding-session/v1/http-router-factory.ts` + `http-dto.ts`

### Proposal-specific additions
- **A**: `orchestrator/coding-session/function-factory.ts` + `constant.ts`
- **B**: `api/module/coding-session/v1/sse-router-factory.ts`, `infra/mongo/coding-session/message/change-stream.ts`, modify `worker.ts`
- **C**: `api/module/coding-session/v1/ws-router-factory.ts` + `ws-protocol.ts`, `app/feature/coding-session/session-manager.ts`

### Files to modify
- `di/infra.ts` — add Daytona client, sandbox service, agent runner
- `di/app.ts` — add coding session services
- `di/api.ts` — add coding session router
- `di/orchestration.ts` — register new Inngest functions
- `api.ts` — mount coding session router
- `orchestrator/workflow/sdlc/action-definition-service.ts` — wire `code` handler
