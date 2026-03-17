# Proposal A: Inngest Polling Architecture — Detailed Implementation Plan

All file paths below are relative to `app/service/src/`.

---

## Phase 1: Domain Layer (Entities + Ports)

### Step 1.1: CodingSession Entity

**Create `core/domain/coding-session/entity.ts`**

```typescript
import { UTCDate } from "@date-fns/utc";
import z from "zod";
import { type EntityId, entityIdSchema, newEntityId } from "@/core/domain/entity";
import { type Tenant, TenantAwareEntity } from "@/core/domain/tenant-aware-entity";

const codingSessionProviders = ["claude-code", "codex"] as const;

const codingSessionStatuses = [
  "provisioning",
  "active",
  "waiting_for_user",
  "completed",
  "failed",
] as const;

const codingSessionEntityProps = z.object({
  aiAgentId: entityIdSchema,
  projectId: entityIdSchema,
  sandboxId: z.string().nullable(),
  provider: z.enum(codingSessionProviders),
  status: z.enum(codingSessionStatuses),
  title: z.string().min(1).max(512),
  systemPrompt: z.string().max(10000).optional(),
});
type CodingSessionEntityProps = z.output<typeof codingSessionEntityProps>;

class CodingSessionEntity extends TenantAwareEntity<CodingSessionEntityProps> {
  static makeNew(tenant: Tenant, props: CodingSessionEntityProps) {
    return new CodingSessionEntity(newEntityId(), tenant, props);
  }

  static makeExisting(
    id: EntityId, createdAt: Date, updatedAt: Date,
    tenant: Tenant, props: CodingSessionEntityProps,
  ) {
    return new CodingSessionEntity(id, tenant, props, { createdAt, updatedAt });
  }

  markActive(sandboxId: string) {
    this.props.status = "active";
    this.props.sandboxId = sandboxId;
    this.updatedAt = new UTCDate();
  }

  markWaitingForUser() {
    this.props.status = "waiting_for_user";
    this.updatedAt = new UTCDate();
  }

  markCompleted() {
    this.props.status = "completed";
    this.updatedAt = new UTCDate();
  }

  markFailed() {
    this.props.status = "failed";
    this.updatedAt = new UTCDate();
  }
}
```

**Pattern reference**: `core/domain/ai-agent/entity.ts` — same TenantAwareEntity extension, makeNew/makeExisting factories, zod props schema, mutation methods that update `this.updatedAt`.

### Step 1.2: CodingSessionMessage Entity

**Create `core/domain/coding-session/message/entity.ts`**

```typescript
const codingSessionMessageRoles = ["user", "agent"] as const;
const codingSessionMessageStatuses = ["pending", "complete", "error"] as const;

const toolUseSchema = z.object({
  name: z.string(),
  input: z.record(z.string(), z.unknown()).optional(),
  output: z.string().optional(),
});

const codingSessionMessageEntityProps = z.object({
  sessionId: entityIdSchema,
  role: z.enum(codingSessionMessageRoles),
  content: z.string(),
  toolUse: toolUseSchema.array().optional(),
  status: z.enum(codingSessionMessageStatuses),
});
type CodingSessionMessageEntityProps = z.output<typeof codingSessionMessageEntityProps>;

class CodingSessionMessageEntity extends TenantAwareEntity<CodingSessionMessageEntityProps> {
  static makeNew(tenant: Tenant, props: CodingSessionMessageEntityProps) { ... }
  static makeExisting(...) { ... }
}
```

### Step 1.3: CodingSession CRUD Repository Port

**Create `core/domain/coding-session/crud-repository.ts`**

Follow `core/domain/ai-agent/crud-repository.ts` pattern exactly:
- `ctxSchema` = mongoCtxSchema + tenantCtxSchema
- Methods: `insert`, `findOne`, `findMany` (with optional `projectId` and `aiAgentId` filters), `update`, `delete`
- All return `Result<T, Err>`

### Step 1.4: CodingSession CRUD Service Port

**Create `core/domain/coding-session/crud-service.ts`**

Follow `core/domain/ai-agent/crud-service.ts` pattern:
- `create` payload: `aiAgentId`, `projectId`, `provider`, `title`, `systemPrompt?`
- `get` payload: `id`
- `list` with optional filter: `projectId`, `aiAgentId`, `status`
- `update` payload: all props optional + id
- `delete` payload: `id`

### Step 1.5: CodingSessionMessage CRUD Repository Port

**Create `core/domain/coding-session/message/crud-repository.ts`**

Same pattern. `findMany` filter: required `sessionId`, optional `afterId` (for cursor-based polling).

### Step 1.6: CodingSessionMessage CRUD Service Port

**Create `core/domain/coding-session/message/crud-service.ts`**

- `create` payload: `sessionId`, `role`, `content`, `toolUse?`
- `list` with filter: `sessionId` (required), `afterId?` (optional cursor)
- `get`, `delete`

---

## Phase 2: Infrastructure Ports (Sandbox + Agent Runner)

### Step 2.1: Sandbox Service Port

**Create `core/infra/sandbox/service.ts`**

```typescript
import type { Result } from "neverthrow";
import type { Err } from "@/common/err/err";

interface SandboxInfo {
  sandboxId: string;
}

interface SandboxService {
  create(input: {
    gitRepoUrl: string;
    branch?: string;
  }): Promise<Result<SandboxInfo, Err>>;

  exec(input: {
    sandboxId: string;
    command: string[];
    env?: Record<string, string>;
  }): Promise<Result<{ stdout: string; stderr: string; exitCode: number }, Err>>;

  destroy(input: {
    sandboxId: string;
  }): Promise<Result<void, Err>>;
}
```

### Step 2.2: Agent Runner Service Port

**Create `core/infra/agent-runner/service.ts`**

```typescript
interface AgentRunResult {
  messages: Array<{
    role: "agent";
    content: string;
    toolUse?: Array<{ name: string; input?: Record<string, unknown>; output?: string }>;
  }>;
  isWaitingForUser: boolean;
  isComplete: boolean;
}

interface AgentRunnerService {
  run(input: {
    sandboxId: string;
    provider: "claude-code" | "codex";
    prompt: string;
    systemPrompt?: string;
    conversationHistory?: Array<{ role: string; content: string }>;
  }): Promise<Result<AgentRunResult, Err>>;
}
```

---

## Phase 3: Infrastructure Implementations

### Step 3.1: Daytona Sandbox Service

**Create `infra/daytona/client-factory.ts`**

```typescript
import { Daytona } from "@daytonaio/sdk";
import type { ConfigService } from "@/core/infra/config/service";

class DaytonaClientFactory {
  #configService: ConfigService;
  constructor(configService: ConfigService) { this.#configService = configService; }
  make() {
    return new Daytona({ apiKey: this.#configService.get("daytona.apiKey") });
  }
}
```

**Create `infra/daytona/sandbox-service.ts`**

Implements `SandboxService`:
- `create()`: uses `daytona.create({ language: "typescript", ... })` or workspace creation API
- `exec()`: uses the Daytona SDK process/exec API on the workspace
- `destroy()`: uses `daytona.remove(workspace)`

All methods wrapped in try-catch returning `Result<T, Err>`.

### Step 3.2: Agent Runner Implementations

**Create `infra/agent-runner/claude-code-runner.ts`**

Implements `AgentRunnerService` for `claude-code` provider:
- Uses `SandboxService.exec()` to run: `claude --print --output-format json -p "<prompt>"` inside the sandbox
- Parses JSON output into `AgentRunResult`
- Detects questions/waiting state from output structure

**Create `infra/agent-runner/codex-runner.ts`**

Implements `AgentRunnerService` for `codex` provider:
- Uses `SandboxService.exec()` to run the Codex CLI
- Parses output into `AgentRunResult`

### Step 3.3: MongoDB Repositories

**Create `infra/mongo/coding-session/model.ts`**
```typescript
type CodingSessionMongoModel = TenantAwareMongoModel<CodingSessionEntityProps>;
```

**Create `infra/mongo/coding-session/crud-repository.ts`**

Follow `infra/mongo/ai-agent/crud-repository.ts` exactly:
- Collection name: `"coding-session"`
- `#getCollection()` with `tenantAwareCollectionIndexes` + additional index on `{ "projectId": 1 }` and `{ "aiAgentId": 1 }`
- `#toDomain()` hydrates `CodingSessionEntity.makeExisting()`
- `findMany` builds query with optional filters for `projectId`, `aiAgentId`, `status`

**Create `infra/mongo/coding-session/message/model.ts`**
```typescript
type CodingSessionMessageMongoModel = TenantAwareMongoModel<CodingSessionMessageEntityProps>;
```

**Create `infra/mongo/coding-session/message/crud-repository.ts`**

Same pattern:
- Collection name: `"coding-session-message"`
- Index on `{ sessionId: 1 }` for efficient message queries
- `findMany` with required `sessionId` filter, optional `afterId` cursor:
  ```typescript
  if (input.filter.afterId) {
    query._id = { $gt: input.filter.afterId };
  }
  ```
- Results sorted by `{ _id: 1 }` (UUIDv7 = chronological order)

---

## Phase 4: Application Layer

### Step 4.1: CodingSession BasicCrudService

**Create `app/domain/coding-session/basic-crud-service.ts`**

Follow `app/domain/ai-agent/basic-crud-service.ts` pattern:
- Constructor takes `CodingSessionCrudRepository`
- `create()`: builds entity with `status: "provisioning"`, `sandboxId: null`, calls `makeNew()` + `insert()`
- `get()`: findOne + null check → notFound error
- `list()`: passthrough to repository
- `update()`: findOne + null check + `entity.update()` + save
- `delete()`: passthrough

### Step 4.2: CodingSessionMessage BasicCrudService

**Create `app/domain/coding-session/message/basic-crud-service.ts`**

Same pattern with `CodingSessionMessageCrudRepository`.

### Step 4.3: CodingSession Feature Service

**Create `app/feature/coding-session/basic-service.ts`**

This is the orchestration layer (like `ProjectSyncBasicService`).

**Create `core/feature/coding-session/service.ts`** (port interface first)

```typescript
const codingSessionServiceInputSchema = {
  start: z.object({
    ctx: ctxSchema,
    payload: z.object({
      aiAgentId: entityIdSchema,
      projectId: entityIdSchema,
      provider: z.enum(codingSessionProviders),
      title: z.string().min(1).max(512),
      systemPrompt: z.string().max(10000).optional(),
      initialPrompt: z.string().min(1),
    }),
  }),

  reply: z.object({
    ctx: ctxSchema,
    payload: z.object({
      sessionId: entityIdSchema,
      content: z.string().min(1),
    }),
  }),
};

interface CodingSessionService {
  start(input: ...): Promise<Result<CodingSessionEntity, Err>>;
  reply(input: ...): Promise<Result<void, Err>>;
}
```

**Implementation `app/feature/coding-session/basic-service.ts`:**

```typescript
class CodingSessionBasicService implements CodingSessionService {
  #codingSessionCrudService: CodingSessionCrudService;
  #codingSessionMessageCrudService: CodingSessionMessageCrudService;
  #inngestClient: Inngest;

  constructor(
    codingSessionCrudService, codingSessionMessageCrudService, inngestClient,
  ) { ... }

  async start(input) {
    // 1. Create session entity (status: "provisioning")
    const session = await this.#codingSessionCrudService.create({ ... });

    // 2. Create initial user message
    await this.#codingSessionMessageCrudService.create({
      ctx, payload: {
        sessionId: session.id,
        role: "user",
        content: input.payload.initialPrompt,
        status: "complete",
      }
    });

    // 3. Send Inngest event to start the session
    await this.#inngestClient.send({
      name: CODING_SESSION_START_EVENT,
      data: {
        sessionId: session.id,
        tenant: ctx.tenant,
      },
    });

    return ok(session);
  }

  async reply(input) {
    // 1. Get session, validate status is "waiting_for_user"
    const session = await this.#codingSessionCrudService.get({ ... });
    if (session.props.status !== "waiting_for_user") {
      return err(Err.code("badRequest", { message: "Session is not waiting for user input" }));
    }

    // 2. Store user message
    await this.#codingSessionMessageCrudService.create({
      ctx, payload: {
        sessionId: input.payload.sessionId,
        role: "user",
        content: input.payload.content,
        status: "complete",
      }
    });

    // 3. Send Inngest event to resume the session
    await this.#inngestClient.send({
      name: CODING_SESSION_USER_REPLY_EVENT,
      data: {
        sessionId: input.payload.sessionId,
        tenant: ctx.tenant,
      },
    });

    return ok();
  }
}
```

---

## Phase 5: Inngest Orchestration

### Step 5.1: Constants

**Create `orchestrator/coding-session/constant.ts`**

```typescript
export const CODING_SESSION_FUNCTION_ID = "coding-session.run";
export const CODING_SESSION_START_EVENT = "coding-session.start";
export const CODING_SESSION_USER_REPLY_EVENT = "coding-session.user-reply";
```

### Step 5.2: Inngest Function Factory

**Create `orchestrator/coding-session/function-factory.ts`**

```typescript
class CodingSessionFunctionFactory {
  #inngest: Inngest;
  #codingSessionCrudService: CodingSessionCrudService;
  #codingSessionMessageCrudService: CodingSessionMessageCrudService;
  #sandboxService: SandboxService;
  #agentRunnerService: AgentRunnerService;
  #gitRepositoryCrudService: GitRepositoryCrudService;

  constructor(...) { ... }

  make() {
    return this.#inngest.createFunction(
      { id: CODING_SESSION_FUNCTION_ID },
      { event: CODING_SESSION_START_EVENT },
      async ({ event, step }) => {
        const { sessionId, tenant } = event.data;

        // Step 1: Get session and git repository info
        const session = await step.run("get-session", async () => {
          const result = await this.#codingSessionCrudService.get({
            ctx: { tenant },
            payload: { id: sessionId },
          });
          if (result.isErr()) throw result.error;
          return result.value;
        });

        // Step 2: Provision sandbox
        const sandboxInfo = await step.run("provision-sandbox", async () => {
          // Look up git repo URL from the project
          const gitRepos = await this.#gitRepositoryCrudService.list({
            ctx: { tenant },
            filter: { projectId: session.props.projectId },
          });
          if (gitRepos.isErr()) throw gitRepos.error;
          const gitRepo = gitRepos.value[0];

          const createResult = await this.#sandboxService.create({
            gitRepoUrl: gitRepo?.props.url ?? "",
            branch: gitRepo?.props.config?.defaultBranch,
          });
          if (createResult.isErr()) throw createResult.error;

          // Update session to active
          session.markActive(createResult.value.sandboxId);
          const updateResult = await this.#codingSessionCrudService.update({
            ctx: { tenant },
            payload: { id: sessionId, status: "active", sandboxId: createResult.value.sandboxId },
          });
          if (updateResult.isErr()) throw updateResult.error;

          return createResult.value;
        });

        // Step 3: Agent conversation loop
        let isComplete = false;
        let turnCount = 0;
        const maxTurns = 50;

        while (!isComplete && turnCount < maxTurns) {
          turnCount++;

          // Execute agent turn
          const agentResult = await step.run(`agent-turn-${turnCount}`, async () => {
            // Fetch conversation history
            const messagesResult = await this.#codingSessionMessageCrudService.list({
              ctx: { tenant },
              filter: { sessionId },
            });
            if (messagesResult.isErr()) throw messagesResult.error;

            const history = messagesResult.value.map(m => ({
              role: m.props.role,
              content: m.props.content,
            }));

            // Run agent
            const runResult = await this.#agentRunnerService.run({
              sandboxId: sandboxInfo.sandboxId,
              provider: session.props.provider,
              prompt: history[history.length - 1]?.content ?? "",
              systemPrompt: session.props.systemPrompt,
              conversationHistory: history,
            });
            if (runResult.isErr()) throw runResult.error;

            // Store agent messages
            for (const msg of runResult.value.messages) {
              await this.#codingSessionMessageCrudService.create({
                ctx: { tenant },
                payload: {
                  sessionId,
                  role: "agent",
                  content: msg.content,
                  toolUse: msg.toolUse,
                  status: "complete",
                },
              });
            }

            return runResult.value;
          });

          if (agentResult.isComplete) {
            isComplete = true;
            await step.run("mark-completed", async () => {
              await this.#codingSessionCrudService.update({
                ctx: { tenant },
                payload: { id: sessionId, status: "completed" },
              });
            });
          } else if (agentResult.isWaitingForUser) {
            // Mark session as waiting
            await step.run(`mark-waiting-${turnCount}`, async () => {
              await this.#codingSessionCrudService.update({
                ctx: { tenant },
                payload: { id: sessionId, status: "waiting_for_user" },
              });
            });

            // Wait for user reply (timeout: 1 hour)
            await step.waitForEvent(`wait-for-reply-${turnCount}`, {
              event: CODING_SESSION_USER_REPLY_EVENT,
              timeout: "1h",
              match: "data.sessionId",
            });

            // Mark session as active again
            await step.run(`mark-active-${turnCount}`, async () => {
              await this.#codingSessionCrudService.update({
                ctx: { tenant },
                payload: { id: sessionId, status: "active" },
              });
            });
          }
        }

        // Cleanup: destroy sandbox
        await step.run("destroy-sandbox", async () => {
          await this.#sandboxService.destroy({
            sandboxId: sandboxInfo.sandboxId,
          });
        });
      },
    );
  }
}
```

**Key Inngest patterns used:**
- `step.run()` for durable, retryable steps
- `step.waitForEvent()` for human-in-the-loop (matched on `data.sessionId`)
- Loop with max turns to prevent infinite execution
- Sandbox cleanup in final step

---

## Phase 6: API Layer

### Step 6.1: HTTP DTOs

**Create `api/module/coding-session/v1/http-dto.ts`**

Follow `api/module/ai-agent/v1/http-dto.ts` pattern:

```typescript
// Response DTO
const codingSessionResponseDtoSchema = z.object({
  id: entityIdSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
  tenant: tenantSchema,
  aiAgentId: codingSessionEntityProps.shape.aiAgentId,
  projectId: codingSessionEntityProps.shape.projectId,
  sandboxId: codingSessionEntityProps.shape.sandboxId,
  provider: codingSessionEntityProps.shape.provider,
  status: codingSessionEntityProps.shape.status,
  title: codingSessionEntityProps.shape.title,
});

const codingSessionMessageResponseDtoSchema = z.object({
  id: entityIdSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
  sessionId: codingSessionMessageEntityProps.shape.sessionId,
  role: codingSessionMessageEntityProps.shape.role,
  content: codingSessionMessageEntityProps.shape.content,
  toolUse: codingSessionMessageEntityProps.shape.toolUse,
  status: codingSessionMessageEntityProps.shape.status,
});

// Request DTOs
const postCodingSessionRequestBodyDtoSchema = z.object({
  aiAgentId: entityIdSchema,
  projectId: entityIdSchema,
  provider: codingSessionEntityProps.shape.provider,
  title: z.string().min(1).max(512),
  systemPrompt: z.string().max(10000).optional(),
  initialPrompt: z.string().min(1),
});

const postCodingSessionMessageRequestBodyDtoSchema = z.object({
  content: z.string().min(1),
});

const getCodingSessionMessagesQueryDtoSchema = z.object({
  after: entityIdSchema.optional(),
});

const codingSessionParamsDtoSchema = z.object({
  id: entityIdSchema,
});
```

### Step 6.2: HTTP Router

**Create `api/module/coding-session/v1/http-router-factory.ts`**

Follow `api/module/ai-agent/v1/http-router-factory.ts` pattern:

```typescript
class CodingSessionV1HttpRouterFactory {
  #httpAuthGuardFactory: HttpAuthGuardFactory;
  #httpRequestCtxFactory: HttpRequestCtxFactory;
  #codingSessionCrudService: CodingSessionCrudService;
  #codingSessionMessageCrudService: CodingSessionMessageCrudService;
  #codingSessionService: CodingSessionService;

  constructor(...) { ... }

  make() {
    return new Elysia({ name: CodingSessionV1HttpRouterFactory.name })
      .use(this.#httpRequestCtxFactory.make())
      .use(this.#httpAuthGuardFactory.make())
      .group("/api/v1/coding-session", (r) =>
        r
          // POST / — Start a new coding session
          .post("", async ({ body, ctx, tenant }) => {
            const result = await this.#codingSessionService.start({
              ctx: { ...ctx, tenant },
              payload: body,
            });
            if (result.isErr()) return errEnvelope(result.error);
            return okEnvelope({ data: this.#toSessionDto(result.value) });
          }, { body: postCodingSessionRequestBodyDtoSchema })

          // GET / — List coding sessions
          .get("", async ({ ctx, tenant, query }) => {
            const result = await this.#codingSessionCrudService.list({
              ctx: { ...ctx, tenant },
              filter: query.projectId ? { projectId: query.projectId } : undefined,
            });
            if (result.isErr()) return errEnvelope(result.error);
            return okEnvelope({ data: result.value.map(this.#toSessionDto) });
          })

          // GET /:id — Get a coding session
          .get("/:id", async ({ ctx, tenant, params }) => {
            const result = await this.#codingSessionCrudService.get({
              ctx: { ...ctx, tenant },
              payload: { id: params.id },
            });
            if (result.isErr()) return errEnvelope(result.error);
            return okEnvelope({ data: this.#toSessionDto(result.value) });
          }, { params: codingSessionParamsDtoSchema })

          // GET /:id/message — List messages (polling endpoint)
          .get("/:id/message", async ({ ctx, tenant, params, query }) => {
            const result = await this.#codingSessionMessageCrudService.list({
              ctx: { ...ctx, tenant },
              filter: { sessionId: params.id, afterId: query.after },
            });
            if (result.isErr()) return errEnvelope(result.error);
            return okEnvelope({ data: result.value.map(this.#toMessageDto) });
          }, {
            params: codingSessionParamsDtoSchema,
            query: getCodingSessionMessagesQueryDtoSchema,
          })

          // POST /:id/message — Send a user reply
          .post("/:id/message", async ({ body, ctx, tenant, params }) => {
            const result = await this.#codingSessionService.reply({
              ctx: { ...ctx, tenant },
              payload: { sessionId: params.id, content: body.content },
            });
            if (result.isErr()) return errEnvelope(result.error);
            return okEnvelope();
          }, {
            params: codingSessionParamsDtoSchema,
            body: postCodingSessionMessageRequestBodyDtoSchema,
          })

          // DELETE /:id — Delete a coding session
          .delete("/:id", async ({ ctx, tenant, params }) => {
            const result = await this.#codingSessionCrudService.delete({
              ctx: { ...ctx, tenant },
              payload: { id: params.id },
            });
            if (result.isErr()) return errEnvelope(result.error);
            return okEnvelope();
          }, { params: codingSessionParamsDtoSchema })
      );
  }

  #toSessionDto(entity: CodingSessionEntity) {
    return {
      id: entity.id,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      tenant: entity.tenant,
      aiAgentId: entity.props.aiAgentId,
      projectId: entity.props.projectId,
      sandboxId: entity.props.sandboxId,
      provider: entity.props.provider,
      status: entity.props.status,
      title: entity.props.title,
    } as const satisfies CodingSessionResponseDto;
  }

  #toMessageDto(entity: CodingSessionMessageEntity) {
    return {
      id: entity.id,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      sessionId: entity.props.sessionId,
      role: entity.props.role,
      content: entity.props.content,
      toolUse: entity.props.toolUse,
      status: entity.props.status,
    } as const satisfies CodingSessionMessageResponseDto;
  }
}
```

---

## Phase 7: Dependency Injection Wiring

### Step 7.1: Modify `di/infra.ts`

Add after existing repository instantiations:

```typescript
import { DaytonaClientFactory } from "@/infra/daytona/client-factory";
import { DaytonaSandboxService } from "@/infra/daytona/sandbox-service";
import { ClaudeCodeRunnerService } from "@/infra/agent-runner/claude-code-runner";
import { CodingSessionMongoCrudRepository } from "@/infra/mongo/coding-session/crud-repository";
import { CodingSessionMessageMongoCrudRepository } from "@/infra/mongo/coding-session/message/crud-repository";

const daytonaClientFactory = new DaytonaClientFactory(envConfigService);
const daytonaClient = daytonaClientFactory.make();
const daytonaSandboxService = new DaytonaSandboxService(daytonaClient, logger);

const claudeCodeRunnerService = new ClaudeCodeRunnerService(daytonaSandboxService);

const codingSessionMongoCrudRepository = new CodingSessionMongoCrudRepository(
  envConfigService, mongoClient, logger,
);
const codingSessionMessageMongoCrudRepository = new CodingSessionMessageMongoCrudRepository(
  envConfigService, mongoClient, logger,
);
```

Export all new singletons.

### Step 7.2: Modify `di/app.ts`

```typescript
import { CodingSessionBasicCrudService } from "@/app/domain/coding-session/basic-crud-service";
import { CodingSessionMessageBasicCrudService } from "@/app/domain/coding-session/message/basic-crud-service";
import { CodingSessionBasicService } from "@/app/feature/coding-session/basic-service";

const codingSessionBasicCrudService = new CodingSessionBasicCrudService(
  codingSessionMongoCrudRepository,
);
const codingSessionMessageBasicCrudService = new CodingSessionMessageBasicCrudService(
  codingSessionMessageMongoCrudRepository,
);
const codingSessionBasicService = new CodingSessionBasicService(
  codingSessionBasicCrudService,
  codingSessionMessageBasicCrudService,
  inngestClient,
);
```

Export all.

### Step 7.3: Modify `di/orchestration.ts`

```typescript
import { CodingSessionFunctionFactory } from "@/orchestrator/coding-session/function-factory";

const codingSessionFunctionFactory = new CodingSessionFunctionFactory(
  inngestClient,
  codingSessionBasicCrudService,
  codingSessionMessageBasicCrudService,
  daytonaSandboxService,
  claudeCodeRunnerService,
  gitRepositoryBasicCrudService,
);

export { ..., codingSessionFunctionFactory };
```

### Step 7.4: Modify `di/api.ts`

```typescript
import { CodingSessionV1HttpRouterFactory } from "@/api/module/coding-session/v1/http-router-factory";

const codingSessionV1HttpRouterFactory = new CodingSessionV1HttpRouterFactory(
  httpAuthGuardFactory,
  httpRequestCtxFactory,
  codingSessionBasicCrudService,
  codingSessionMessageBasicCrudService,
  codingSessionBasicService,
);

// Update InngestHttpRouterFactory to include the new function:
const inngestHttpRouterFactory = new InngestHttpRouterFactory(inngestClient, [
  workflowSdlcFunctionFactory.make(),
  codingSessionFunctionFactory.make(),  // NEW
]);

export { ..., codingSessionV1HttpRouterFactory };
```

### Step 7.5: Modify `api.ts`

Add:
```typescript
import { codingSessionV1HttpRouterFactory } from "@/di/api";

// In the app chain:
.use(codingSessionV1HttpRouterFactory.make())
```

---

## Phase 8: SDLC Workflow Integration

### Step 8.1: Modify `orchestrator/workflow/sdlc/action-definition-service.ts`

Wire the `code` action handler to create a coding session:

```typescript
export class WorkflowSdlcActionDefinitionCrudService implements WorkflowActionDefinitionCrudService {
  #codingSessionService: CodingSessionService;
  #inngestClient: Inngest;

  constructor(codingSessionService: CodingSessionService, inngestClient: Inngest) {
    this.#codingSessionService = codingSessionService;
    this.#inngestClient = inngestClient;
  }

  async list() {
    return ok([
      WorkflowActionDefinitionEntity.makeNew({
        name: "Research",
        kind: "research",
        handler: async () => {},
      }),
      WorkflowActionDefinitionEntity.makeNew({
        name: "Plan",
        kind: "plan",
        handler: async () => {},
      }),
      WorkflowActionDefinitionEntity.makeNew({
        name: "Code",
        kind: "code",
        handler: async ({ event, step }) => {
          const { tenant } = event.data;
          // Create a coding session for automated execution
          const result = await this.#codingSessionService.start({
            ctx: { tenant },
            payload: {
              aiAgentId: event.data.aiAgentId,
              projectId: event.data.projectId,
              provider: "claude-code",
              title: `SDLC Workflow Code Task`,
              initialPrompt: event.data.codePrompt ?? "Implement the planned changes",
            },
          });
          if (result.isErr()) throw result.error;

          // Wait for the coding session to complete
          const completionEvent = await step.waitForEvent(
            "wait-for-coding-session-completion",
            {
              event: "coding-session.completed",
              timeout: "2h",
              match: "data.sessionId",
              if: `async.data.sessionId == '${result.value.id}'`,
            },
          );

          if (!completionEvent) {
            throw new Error("Coding session timed out");
          }
        },
      }),
    ]);
  }
}
```

This also requires sending a `coding-session.completed` event when the Inngest function finishes (add to the `mark-completed` step in the function factory).

### Step 8.2: Update DI for action definition service

Modify `di/app.ts`:
```typescript
const workflowActionDefinitionBasicCrudService =
  new WorkflowSdlcActionDefinitionCrudService(codingSessionBasicService, inngestClient);
```

---

## Phase 9: Environment & Config Updates

### Step 9.1: Add new env vars to `turbo.json` globalEnv

Add `DAYTONA_API_KEY` if not already present (it is — confirmed in config schema).

No new env vars needed beyond what's already defined for Daytona.

---

## File Creation Checklist

### New Files (22 files)

| # | File | Layer |
|---|------|-------|
| 1 | `core/domain/coding-session/entity.ts` | Domain |
| 2 | `core/domain/coding-session/crud-repository.ts` | Domain Port |
| 3 | `core/domain/coding-session/crud-service.ts` | Domain Port |
| 4 | `core/domain/coding-session/message/entity.ts` | Domain |
| 5 | `core/domain/coding-session/message/crud-repository.ts` | Domain Port |
| 6 | `core/domain/coding-session/message/crud-service.ts` | Domain Port |
| 7 | `core/infra/sandbox/service.ts` | Infra Port |
| 8 | `core/infra/agent-runner/service.ts` | Infra Port |
| 9 | `core/feature/coding-session/service.ts` | Feature Port |
| 10 | `app/domain/coding-session/basic-crud-service.ts` | Application |
| 11 | `app/domain/coding-session/message/basic-crud-service.ts` | Application |
| 12 | `app/feature/coding-session/basic-service.ts` | Application |
| 13 | `infra/daytona/client-factory.ts` | Infrastructure |
| 14 | `infra/daytona/sandbox-service.ts` | Infrastructure |
| 15 | `infra/agent-runner/claude-code-runner.ts` | Infrastructure |
| 16 | `infra/agent-runner/codex-runner.ts` | Infrastructure |
| 17 | `infra/mongo/coding-session/model.ts` | Infrastructure |
| 18 | `infra/mongo/coding-session/crud-repository.ts` | Infrastructure |
| 19 | `infra/mongo/coding-session/message/model.ts` | Infrastructure |
| 20 | `infra/mongo/coding-session/message/crud-repository.ts` | Infrastructure |
| 21 | `api/module/coding-session/v1/http-dto.ts` | API |
| 22 | `api/module/coding-session/v1/http-router-factory.ts` | API |
| 23 | `orchestrator/coding-session/constant.ts` | Orchestration |
| 24 | `orchestrator/coding-session/function-factory.ts` | Orchestration |

### Modified Files (6 files)

| # | File | Changes |
|---|------|---------|
| 1 | `di/infra.ts` | Add Daytona client/service, agent runner, coding session repos |
| 2 | `di/app.ts` | Add coding session CRUD services + feature service |
| 3 | `di/api.ts` | Add coding session router factory, register Inngest function |
| 4 | `di/orchestration.ts` | Add coding session function factory |
| 5 | `api.ts` | Mount coding session router |
| 6 | `orchestrator/workflow/sdlc/action-definition-service.ts` | Wire `code` handler |

---

## Implementation Order

1. **Phase 1** — Domain entities + ports (pure types, no deps)
2. **Phase 2** — Infrastructure ports (pure interfaces)
3. **Phase 3** — MongoDB repos + Daytona/agent runner implementations
4. **Phase 4** — Application services
5. **Phase 5** — Inngest function
6. **Phase 6** — API layer
7. **Phase 7** — DI wiring
8. **Phase 8** — SDLC integration
9. Run `bun run check-types` to verify

Each phase can be type-checked independently. Phases 1-2 have zero runtime dependencies.

---

## API Endpoints Summary

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/coding-session` | Start a new coding session |
| `GET` | `/api/v1/coding-session` | List coding sessions (optional `?projectId=`) |
| `GET` | `/api/v1/coding-session/:id` | Get a coding session |
| `GET` | `/api/v1/coding-session/:id/message` | List messages (polling, optional `?after=<id>`) |
| `POST` | `/api/v1/coding-session/:id/message` | Send a user reply |
| `DELETE` | `/api/v1/coding-session/:id` | Delete a coding session |

## Inngest Events

| Event | Trigger | Handler |
|-------|---------|---------|
| `coding-session.start` | Feature service `start()` | `CodingSessionFunctionFactory` — provisions sandbox, runs agent loop |
| `coding-session.user-reply` | Feature service `reply()` | Resumes `waitForEvent` in the agent loop |
| `coding-session.completed` | Inngest function completion step | Consumed by SDLC workflow `code` action handler |
