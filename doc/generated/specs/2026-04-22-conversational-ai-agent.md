# Conversational AI Agent Specification

## Executive Summary

Extend Flow Machine's agentic loop into a **persistent, conversational Claude Code agent** that end users can message via HTTP. Each `AiAgent` is a long-running conversation. Sending a message spawns a Daytona sandbox, resumes a Claude Code session from a persistent volume, executes the turn with Claude Code's native tools (Bash / Read / Edit / Write / Grep / etc.), streams progress to the client over SSE, then tears the sandbox down and idles until the next message.

## Problem Statement

The current `agenticLoopAction` (`app/platform-service/src/feature/workflow/action/workflow-action-agentic-loop.ts`) is plumbing without an agent: it provisions a Daytona sandbox, runs `pwd`, and destroys the sandbox. There is no LLM, no tools, no way for a user to actually ask the agent to do anything, and no persistence between runs.

End users need to be able to have **ongoing, multi-turn conversations** with a Claude Code-grade agent running in an isolated Daytona sandbox, and keep that conversation alive across days without paying for idle compute.

## Success Criteria

1. An authenticated user can `POST` a message to their `AiAgentRun` and, within one round-trip, receive a 202 with a message id.
2. Opening the SSE stream for that `AiAgentRun` yields live events: tool uses, tool results, and assistant message deltas, in Claude Code's native granularity.
3. Sending a second message **hours or days later** resumes the Claude Code session exactly where it left off — conversation history, working directory state, and Claude's context are intact via the persistent volume.
4. Between messages, no Daytona sandbox is running and no compute is being billed beyond volume storage.
5. A user sending a second message while the first is still in progress receives `409 Conflict` rather than interleaving turns.
6. An `AiAgentRun` that has received no messages for 7 days is automatically terminated and its volume destroyed.
7. If a turn fails (Claude CLI crash, sandbox error, network loss), Inngest retries transparently; on retry exhaustion the run enters an `errored` state surfaced to the client.

## User Personas

**End user of Flow Machine** (internal or external operator) — technical, comfortable with code, drives the agent through a messaging UI backed by the HTTP API. They expect Claude Code-grade code fluency: the agent should natively read/edit files, run shell commands, use git, grep, etc. They do **not** expect to hand-roll tool definitions or prompts.

## User Journey

1. User creates an `AiAgent` via `POST /api/v1/ai-agent` with `{ name, model, projects[] }`. No sandbox or volume is created.
2. User creates a run via `POST /api/v1/ai-agent/:aiAgentId/run` (body `{}`). Service creates an `AiAgentRun` in status `provisioning`, emits `ai-agent.run.started` Inngest event, and responds `202 { runId }`. Inngest function boots, provisions the Daytona persistent volume, transitions the run to `idle`, and enters `step.waitForEvent`.
3. Client opens `GET /api/v1/ai-agent/:aiAgentId/run/:runId/events` (SSE) to receive lifecycle + rich tool events.
4. User sends the first message via `POST /api/v1/ai-agent/:aiAgentId/run/:runId/message` with `{ content }`. Service persists an `AiAgentRunMessage` (role: `user`), transitions the run to `processing`, emits `ai-agent.run.message-received`, and responds `202 { messageId }`.
5. Inngest function unblocks, provisions an ephemeral sandbox with the volume mounted at `~/.claude`, pulls unread messages from Mongo, and runs `claude --bare -p "<content>" --output-format stream-json --allowedTools "*"`.
   - For the **first turn** there is no `--resume`; the CLI assigns a new session id, which the service records on the `AiAgentRun`.
   - Each stream-json event is parsed and (a) forwarded to subscribed SSE clients and (b) persisted as `AiAgentRunMessage` rows with appropriate role (`assistant`, `tool_use`, `tool_result`).
6. When the turn completes, the function stops the sandbox (volume is retained), updates the run to `idle`, and re-enters `step.waitForEvent('ai-agent.run.message-received', { match: 'data.aiAgentRunId' })` to idle until the next message arrives or until the 7-day timeout fires.
7. User sends another message hours later. HTTP persists it and emits the event. The Inngest function unblocks, re-provisions a new sandbox with the same volume, and runs `claude --bare --resume <sessionId> -p "<content>" --output-format stream-json` — Claude Code restores the full session from the volume.
8. User eventually calls `POST /api/v1/ai-agent/:aiAgentId/run/:runId/stop` (or the 7-day timer expires). The function destroys any running sandbox and the volume, marks the run `stopped`, and exits. A future run requires a new `POST /api/v1/ai-agent/:aiAgentId/run`.

## Functional Requirements

### Must Have (P0)

- **AiAgent config management** — create / get / update / list endpoints already exist for `AiAgent`; update the `model` enum to canonical IDs (`claude-opus-4-7`, `claude-sonnet-4-6`, `claude-haiku-4-5`), dropping the `anthropic/` vendor prefix. Acceptance: passing any of the three IDs succeeds; the old prefixed IDs are rejected.
- **`AiAgentRun` model** — new Mongo model: `{ id, tenant, aiAgentId, status: 'provisioning' | 'idle' | 'processing' | 'stopped' | 'errored', sessionId: string | null, sandbox: WorkflowExecutionSandbox (reused shape), startedAt, endedAt, lastMessageAt }`. Acceptance: status transitions are enforced; a single `AiAgent` has at most one non-terminal `AiAgentRun`.
- **`AiAgentRunMessage` model** — new Mongo model: `{ id, tenant, aiAgentRunId, role: 'user' | 'assistant' | 'tool_use' | 'tool_result' | 'system', content: string, toolName?: string, toolInput?: Json, toolResult?: Json, createdAt }`. `aiAgentId` is intentionally omitted — reachable via the parent run. Messages are append-only. Acceptance: every user-sent message and every parsed Claude stream-json event produces an `AiAgentRunMessage`.
- **POST create run endpoint** — `POST /api/v1/ai-agent/:aiAgentId/run` with body `{}`. Rejects with `409` if a non-terminal run already exists for this agent. Otherwise creates the `AiAgentRun` in `provisioning`, emits `ai-agent.run.started`, returns `202 { runId }`. Acceptance: covered by router-level integration test.
- **POST message endpoint** — `POST /api/v1/ai-agent/:aiAgentId/run/:runId/message` with `{ content: string }`. Rejects `409` if the run is `processing`. Rejects `404` if the run does not belong to the agent or is terminal (`stopped` / `errored`). Otherwise persists the `AiAgentRunMessage`, transitions the run to `processing`, emits `ai-agent.run.message-received`, returns `202 { messageId }`. Acceptance: covered by router-level integration test.
- **SSE events endpoint** — `GET /api/v1/ai-agent/:aiAgentId/run/:runId/events` returns `text/event-stream`. Emits:
  - `run.provisioning` / `run.idle` / `run.processing` / `run.errored` / `run.stopped`
  - `turn.started { messageId }` / `turn.finished { messageId }`
  - `message.appended { messageId, role, content, toolName?, ... }` — one per `AiAgentRunMessage` created during the turn
  - `error { code, message }`
  - Heartbeat comment every 15s to keep proxies alive.

  Acceptance: a client that connects mid-turn receives all subsequent events until the run goes `idle`; a client that connects while `idle` gets the next `run.processing` + stream.

- **Stop endpoint** — `POST /api/v1/ai-agent/:aiAgentId/run/:runId/stop`. Emits an `ai-agent.run.stop-requested` Inngest event. The function handles it (also during `waitForEvent` via a race), destroys the sandbox and volume, marks the run `stopped`. Returns `202`. Acceptance: calling stop during a processing turn cancels it and cleans up.
- **Idle auto-termination** — `step.waitForEvent` is raced with a 7-day timer. On timer expiry, the function destroys volume + sandbox and marks the run `stopped` with reason `idle_timeout`. Acceptance: configurable via env var (`AI_AGENT_RUN_IDLE_TIMEOUT_DAYS`, default `7`).
- **Claude Code CLI execution** — The Inngest step that runs the agent turn uses the Daytona `process.executeCommand` API to invoke `claude --bare [--resume <id>] -p "<content>" --output-format stream-json --allowedTools "*"`. Anthropic API key is injected via environment variable into the sandbox (sourced from `ANTHROPIC_API_KEY` on the service). Acceptance: sandbox image (or install-on-boot script) includes Claude Code CLI; turn executes end-to-end against a real Claude model.
- **Sandbox + volume lifecycle** — First turn creates a Daytona persistent volume. Every turn creates a fresh sandbox with the volume mounted at `~/.claude`. Turn finishes → sandbox stopped (not just idled). Acceptance: between turns, `daytonaClient.list()` shows no running sandbox for the run; volume remains.
- **Tenant scoping** — All new endpoints require a Better Auth session and scope queries by tenant (matching existing router pattern). Acceptance: cross-tenant access returns 404.
- **409 on concurrent send** — A second POST message while the run is `processing` returns `409 Conflict` with a body explaining the state.
- **Inngest retry + errored surfacing** — `step.run` for the Claude turn uses Inngest's default retry policy (3 attempts). On final failure, transition run to `errored`, persist an `AiAgentRunMessage` with role `system` capturing the error, and emit `run.errored` SSE event. Acceptance: a deliberately-broken sandbox step causes the run to become `errored` with a surfaced error message.

### Should Have (P1)

- **Run history endpoint** — `GET /api/v1/ai-agent/:aiAgentId/run` returns the list of `AiAgentRun`s for this agent (for users who want to see prior sessions). `GET /api/v1/ai-agent/:aiAgentId/run/:runId` returns a single run.
- **Message history endpoint** — `GET /api/v1/ai-agent/:aiAgentId/run/:runId/message` returns paged `AiAgentRunMessage`s for replay / UI hydration before SSE subscribes.
- **Retry-from-errored** — `POST /api/v1/ai-agent/:aiAgentId/run/:runId/retry` on an errored run replays the last user message (in the same run). If the user wants a fresh run after an error, they `POST /api/v1/ai-agent/:aiAgentId/run` instead.

### Nice to Have (P2)

- **Sandbox image pre-bake** — Custom Daytona image with Claude Code CLI + common dev tooling preinstalled (vs install-on-boot), to reduce first-turn latency.
- **Per-AiAgent Anthropic API key** — Store a per-agent API key so tenants can BYO keys.
- **Cost tracking** — Track per-turn token usage (from Claude stream-json `usage` events) on `AiAgentRunMessage`.
- **Codebase mounting** — The v1-out-of-scope item. Attach a git repo to an `AiAgent` and auto-clone it on sandbox provision.

## Technical Architecture

### Data Model

**Updated: `AiAgent`** (`app/platform-service/src/module/ai-agent/ai-agent-model.ts`)

```ts
const aiModels = [
  "claude-opus-4-7",
  "claude-sonnet-4-6",
  "claude-haiku-4-5",
] as const;
type AiModel = (typeof aiModels)[number];

type AiAgent = Model<{
  name: string;
  model: AiModel;
  projects: { id: Id }[];
}>;
```

**New: `AiAgentRun`** (`app/platform-service/src/module/ai-agent-run/ai-agent-run-model.ts`)

```ts
type AiAgentRunStatus =
  | "provisioning"
  | "idle"
  | "processing"
  | "errored"
  | "stopped";

type AiAgentRun = Model<{
  aiAgentId: Id;
  status: AiAgentRunStatus;
  sessionId: string | null; // Claude Code session id (set after first turn)
  sandbox: WorkflowExecutionSandbox | null; // reuse existing shape
  startedAt: Date;
  lastMessageAt: Date | null;
  endedAt: Date | null;
  endedReason: "user_stop" | "idle_timeout" | "error" | null;
}>;
```

**New: `AiAgentRunMessage`** (`app/platform-service/src/module/ai-agent-run-message/ai-agent-run-message-model.ts`)

```ts
type AiAgentRunMessageRole =
  | "user"
  | "assistant"
  | "tool_use"
  | "tool_result"
  | "system";

type AiAgentRunMessage = Model<{
  aiAgentRunId: Id;
  role: AiAgentRunMessageRole;
  content: string;
  toolName: string | null;
  toolInput: Record<string, unknown> | null;
  toolResult: Record<string, unknown> | null;
}>;
```

Note: `aiAgentId` is intentionally **not** on the message — reachable via the parent `AiAgentRun`. All three follow existing naming and layering conventions (module dir = bare domain; files prefixed with dir namespace; service uses `make*` factory; repositories per model).

### System Components

- **Router layer** (`router/ai-agent/v1/`) — Adds nested routes under the `AiAgent` resource:
  - `POST   /ai-agent/:aiAgentId/run`                            — create a run
  - `GET    /ai-agent/:aiAgentId/run`                            — list runs (P1)
  - `GET    /ai-agent/:aiAgentId/run/:runId`                     — get one run (P1)
  - `POST   /ai-agent/:aiAgentId/run/:runId/stop`                — stop a run
  - `POST   /ai-agent/:aiAgentId/run/:runId/retry`               — retry an errored run (P1)
  - `GET    /ai-agent/:aiAgentId/run/:runId/events`              — SSE event stream
  - `POST   /ai-agent/:aiAgentId/run/:runId/message`             — send a message
  - `GET    /ai-agent/:aiAgentId/run/:runId/message`             — list messages (P1)

  Mirrors existing DTO + test patterns.
- **Module layer** — Three modules:
  - `module/ai-agent/` (existing, no extensions needed — runtime logic moves to `AiAgentRun`).
  - `module/ai-agent-run/` — `makeAiAgentRunService` for lifecycle transitions, tenant-scoped queries.
  - `module/ai-agent-run-message/` — `makeAiAgentRunMessageService` for append + list.
- **Feature layer** — New `feature/ai-agent-conversation/`:
  - `ai-agent-conversation-function.ts` — the Inngest function orchestrator.
  - `ai-agent-conversation-turn.ts` — executes one Claude turn (spawns sandbox, invokes CLI, parses stream-json, appends messages, tears down sandbox).
  - `ai-agent-conversation-event.ts` — SSE pub/sub (in-process for single-service deployment; extractable later).
  - `ai-agent-conversation-constant.ts` — event names (`AI_AGENT_RUN_STARTED_EVENT`, `AI_AGENT_RUN_MESSAGE_RECEIVED_EVENT`, `AI_AGENT_RUN_STOP_REQUESTED_EVENT`).
- **Vendor layer** — New `vendor/anthropic/` wrapper if we ever need the Messages API directly (not required for v1; Claude Code CLI handles the API calls). `vendor/daytona` gains a persistent-volume helper.

### Integrations

- **Daytona** — Sandboxes + persistent volumes. Volume lifecycle tied 1:1 to `AiAgentRun`. Sandboxes are ephemeral per turn.
- **Inngest** — `step.waitForEvent` for message and stop signals, raced against a `step.sleep` for the idle timeout. Each turn's Claude CLI call is a single `step.run` (well within Inngest's 2h step limit).
- **Anthropic** — Via the `claude` CLI inside the sandbox. Requires `ANTHROPIC_API_KEY` env var injected at sandbox-provision time. Add to `turbo.json` globalEnv.
- **MongoDB** — Two new collections: `ai_agent_runs`, `ai_agent_run_messages`, plus updates to existing `ai_agents`.

### Inngest Function Shape

```
function ai-agent-conversation-run (triggered by: ai-agent.run.started)
  ├── step.run("provision-volume")                 [once, at run start]
  ├── loop:
  │   ├── waitForEvent(ai-agent.run.message-received | ai-agent.run.stop-requested, 7 days)
  │   ├── if timedOut or stop-requested → step.run("terminate") → return
  │   ├── step.run("provision-sandbox")            [mounts volume, injects ANTHROPIC_API_KEY]
  │   ├── step.run("claude-turn")                  [claude --bare [--resume …] -p … --output-format stream-json]
  │   │      └── streams parsed events via ai-agent-conversation-event bus
  │   ├── step.run("teardown-sandbox")
  │   └── (loop back to waitForEvent)
  └── step.run("cleanup")                          [destroys volume]
```

### Security Model

- **AuthN** — Better Auth session cookies (existing pattern).
- **AuthZ** — Tenant scoping on every query. `aiAgentId` ownership verified against the authenticated tenant before any mutation or subscription.
- **Blast radius** — Claude Code runs with `--allowedTools "*"` but inside an ephemeral Daytona sandbox isolated from the service. Volume contains only `~/.claude/projects/…` — conversation history and scratchpad, no credentials.
- **Secrets** — `ANTHROPIC_API_KEY` injected as env var into the sandbox at provision time (not committed to volume). Key never leaves the service → Daytona boundary.

## Non-Functional Requirements

- **Performance**
  - First-token latency on a cold turn (sandbox provisioning + CLI startup): target < 60s.
  - First-token latency on a warm turn (volume exists, CLI caches in image): target < 20s.
  - SSE event latency from CLI emit → client receive: < 500ms p95.
- **Scalability** — One Inngest function instance per active `AiAgentRun`. Inngest handles concurrency; Daytona concurrency bounded by account quota. No in-memory session state on the service — all state in Mongo + volume.
- **Reliability** — Inngest default retry (3 attempts) on `step.run` for `claude-turn`, `provision-sandbox`, `teardown-sandbox`. Idempotency: teardown and cleanup steps are idempotent against Daytona.
- **Durability** — Conversation state survives worker failure via volume + Mongo. Worst case on mid-turn crash: the step retries, `--resume` restores Claude's session, the user may see duplicated tool-use events (acceptable).

## Out of Scope

- **Repo / codebase mounting** — v1 sandbox is empty. No git clone, no project template.
- **Workflow engine integration** — The existing `agenticLoopAction` in `feature/workflow/action/` is untouched by this spec. Conversational agents are a new, standalone Inngest function, not a workflow-kit action.
- **Streaming user input** — Messages are single-shot text. No file upload, no image input, no interrupt-mid-turn.
- **Multi-agent** — No agent-to-agent communication or nested agent spawning.
- **Web UI** — This spec covers the service only. Frontend work (chat UI in `app/platform-web`) is a separate spec.
- **Billing / usage limits** — No per-tenant concurrency caps or rate limits beyond Inngest/Daytona defaults.
- **BYO API key** — `ANTHROPIC_API_KEY` is global to the service.
- **Sandbox image** — Beyond "Claude Code CLI must be available", image selection and pre-baking is an implementation detail.

## Open Questions for Implementation

1. **Claude Code CLI install** — pre-bake into a custom Daytona image, or `npm install -g @anthropic-ai/claude-code` on each sandbox boot? Latency vs ops complexity tradeoff.
2. **SSE pub/sub** — in-process map for v1 is fine (single service instance). When the service scales horizontally, swap for Redis pub/sub or a message broker. Where to abstract the boundary?
3. **Stop during `waitForEvent`** — exact Inngest pattern for racing two event listeners or adding a poison-pill check. May need `step.waitForEvent` with two event filters or manual cancellation via `inngestClient.cancel`.
4. **Volume naming** — canonical naming scheme for Daytona volumes (`ai-agent-run-<uuid>`?).
5. **Re-entrancy on Inngest retry** — if the `claude-turn` step retries, the `--resume` is safe (Claude handles deduplication by session), but `message.appended` SSE events may fire twice. Decide whether to accept or to checkpoint parsed message ids.

## Appendix: Research Findings

### Agent runtime comparison

| Option                                       | Pros                                                                                    | Cons                                                                                            | Verdict                                       |
| -------------------------------------------- | --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | --------------------------------------------- |
| A: Anthropic SDK + custom loop               | Full step-level control, each tool call a durable step                                  | ~300 LOC of tool + state code; no native Claude Code fluency                                    | Rejected — user wants codebase-grade tools    |
| B1: Agent SDK in worker + MCP→Daytona        | Can use Agent SDK loop                                                                  | Must hand-write MCP server wrapping Daytona; session state stranded in worker when sandbox dies | Rejected — complexity without offsetting gain |
| B2: Agent SDK in long-lived Daytona process  | Full Agent SDK; session in sandbox                                                      | Requires always-on sandbox per agent (~$5–10/agent/month); custom session snapshot              | Rejected — cost                               |
| **C: Claude Code CLI in Daytona (headless)** | Native tools; `--resume` session restore; ephemeral sandboxes; ~10–100× cheaper than B2 | Session state on volume; slightly higher first-turn latency                                     | **Chosen**                                    |

### Inngest constraints (verified)

- Max `step.run` duration: 2h (serverless). A 10-minute Claude turn is safely within limits.
- On worker failure mid-step, Inngest retries the **whole step**; design `claude-turn` to tolerate re-execution via `--resume`.
- `step.waitForEvent` supports multi-day waits at no compute cost (durable).

### Claude Code CLI headless flags (verified)

- `claude --bare -p "<msg>" --output-format stream-json` — one turn, structured output.
- `--resume <session-id>` — continues a prior session. Session data lives under `~/.claude/projects/…` (typically < 100 KB).
- `--allowedTools "*"` — enable all built-in tools; safe inside sandbox isolation.
- `--model <id>` — selects Claude model; pass the `AiAgent.model` value.

### Model IDs (verified current as of 2026-04)

- `claude-opus-4-7` (default for complex agentic work)
- `claude-sonnet-4-6`
- `claude-haiku-4-5`

---

## Environment Variables to Add

Add to `turbo.json` globalEnv and `vendor/env/env.ts`:

- `ANTHROPIC_API_KEY` — Anthropic API key injected into sandboxes.
- `AI_AGENT_RUN_IDLE_TIMEOUT_DAYS` — default `7`. Auto-terminate runs idle for this long.
