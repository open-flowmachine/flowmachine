# Service (Backend) Architecture

Elysia backend API on Bun runtime (port 8000). Follows Hexagonal / Ports and Adapters architecture.

## Commands

```bash
bun run dev              # Start dev server (port 8000)
bun run build            # Build for production
bun run start            # Start production server
bun run test             # Run tests
bun run check-types      # Type check
```

## Directory Structure (Refactored)

```
src/
├── api.ts                # Elysia app entry point, mounts all routers
├── worker.ts             # Background worker entry point (currently a stub)
├── reset.d.ts            # @total-typescript/ts-reset global type augmentation
├── common/               # Shared primitives (no deps on other layers)
│   ├── config/config.ts  # Zod-validated config singleton from process.env
│   ├── ctx/              # MongoCtx + TenantCtx schemas and factories
│   ├── domain/           # Entity, TenantAwareEntity, EntityId, Tenant, syncSchema
│   ├── err/              # Err class + errDetails registry (6 codes)
│   ├── http/             # httpEnvelope, httpErrorHandler plugin
│   ├── log/log.ts        # Pino logger singleton
│   ├── mongo/            # mongoClient singleton, mongoModel utilities, mongoIndex
│   └── schema/codec.ts   # stringToDateCodec (Zod v4 codec)
├── core/                 # Domain layer (depends only on common/)
│   ├── domain/           # Entities + port interfaces (per-aggregate)
│   │   ├── iam/          # user/, member/, session/ (Better Auth managed)
│   │   ├── ai-agent/     # entity, crud-service, crud-repository
│   │   ├── credential/   # entity, crud-service, crud-repository
│   │   ├── document/     # entity, crud-service, crud-repository
│   │   ├── git-repository/
│   │   ├── project/
│   │   └── workflow/     # definition/, definition/action/, engine/, function/
│   └── feature/          # Cross-cutting service interfaces
│       ├── auth/service.ts    # AuthService interface
│       ├── email/service.ts   # EmailService interface
│       └── workflow/const.ts  # SDLC_WORKFLOW_FUNCTION_ID, SDLC_WORKFLOW_INIT_EVENT
├── app/                  # Application layer (implements core service interfaces)
│   ├── domain/           # BasicCrudService implementations (6 aggregates)
│   │   ├── ai-agent/basic-crud-service.ts
│   │   ├── credential/basic-crud-service.ts
│   │   ├── document/basic-crud-service.ts
│   │   ├── git-repository/basic-crud-service.ts
│   │   ├── project/basic-crud-service.ts
│   │   └── workflow/definition/basic-crud-service.ts
│   └── feature/
│       └── workflow/sdlc/
│           ├── action-definition-service.ts  # Stub: Research/Plan/Code actions
│           └── function-factory.ts           # Orchestrates Inngest workflow
├── infra/                # Infrastructure adapters (implements core repo/service interfaces)
│   ├── better-auth/      # BetterAuthClientFactory, BetterAuthService
│   ├── inngest/          # InngestClientFactory, InngestFunctionFactory, workflow/engine-factory
│   ├── mongo/            # 6 MongoDB crud repositories (per-aggregate)
│   │   ├── ai-agent/, credential/, document/
│   │   ├── git-repository/, project/, workflow/definition/
│   └── resend/           # ResendEmailService
├── api/                  # HTTP layer (Elysia routers + plugins)
│   ├── plugin/
│   │   ├── http-auth-guard-factory.ts   # Resolves tenant from session
│   │   └── http-request-ctx-factory.ts  # MongoDB ctx + transaction lifecycle
│   └── module/           # Per-resource routers
│       ├── health/
│       ├── auth/
│       ├── inngest/
│       ├── ai-agent/v1/
│       ├── credential/v1/
│       ├── document/v1/
│       ├── git-repository/v1/
│       ├── project/v1/
│       ├── workflow/definition/v1/
│       └── workflow/action/v1/
└── di/                   # Dependency injection (manual constructor injection)
    ├── shared.ts         # Root: ResendEmailService → BetterAuthClientFactory → BetterAuthService → HttpAuthGuardFactory
    ├── ai-agent-api.ts
    ├── credential-api.ts
    ├── document-api.ts
    ├── git-repository-api.ts
    ├── project-api.ts
    ├── workflow-definition-api.ts
    ├── workflow-definition-action-api.ts
    ├── auth-api.ts
    └── inngest-api.ts
```

## Layer Dependency Rules

```
di/     → api/ + app/ + infra/ + core/ + common/
api/    → core/ + common/  (never infra/ or app/)
app/    → core/ + common/  (never infra/ or api/)
infra/  → core/ + common/  (never app/ or api/)
core/   → common/ only
common/ → (no internal deps)
```

## Entity Pattern

Base classes in `common/domain/`:

- `Entity<T>` — id (UUIDv7), props: T, createdAt, updatedAt, update(partial) via es-toolkit merge
- `TenantAwareEntity<T>` extends Entity — adds tenant: { id: EntityId, type: "organization" | "user" }

Factory methods:

- `Entity.makeNew(tenant, props)` — generates new UUIDv7 id
- `Entity.makeExisting(id, createdAt, updatedAt, tenant, props)` — rehydration from DB

IAM entities (User, Member, Session) only have `makeExisting` — managed by Better Auth.

## Port/Contract Pattern

Every service and repository in `core/` defined as:

1. A companion Zod input schema object (e.g., `documentCrudServiceInputSchema`)
2. A TypeScript interface using `z.infer<>` for parameter types
3. All methods return `Promise<Result<T, Err>>` via neverthrow

Context composed from mongo + tenant schemas:

```typescript
const ctxSchema = z.object({
  ...mongoCtxSchema.shape, // { mongoDb: Db, mongoClientSession?: ClientSession }
  ...tenantCtxSchema.shape, // { tenant: { id: EntityId, type: "organization"|"user" } }
});
```

## Port-to-Adapter Mapping

| Core Interface (Port)            | Infra Implementation (Adapter)        |
| -------------------------------- | ------------------------------------- |
| DocumentCrudRepository           | DocumentMongoCrudRepository           |
| ProjectCrudRepository            | ProjectMongoCrudRepository            |
| AiAgentCrudRepository            | AiAgentMongoCrudRepository            |
| CredentialCrudRepository         | CredentialMongoCrudRepository         |
| GitRepositoryCrudRepository      | GitRepositoryMongoCrudRepository      |
| WorkflowDefinitionCrudRepository | WorkflowDefinitionMongoCrudRepository |
| AuthService                      | BetterAuthService                     |
| EmailService                     | ResendEmailService                    |
| WorkflowFunctionFactory          | InngestFunctionFactory                |
| WorkflowEngineFactory            | InngestWorkflowEngineFactory          |

## App Layer Pattern (BasicCrudService)

All 6 domain services follow identical template:

- `create`: Entity.makeNew() → repository.insert()
- `get`: repository.findOne() → null check → ok(entity)
- `update`: repository.findOne() → entity.update(partial) → repository.update()
- `delete`: pass-through to repository
- `list`: pass-through to repository.findMany()

Constructor receives repository interface (core port), not concrete implementation.

## HTTP Layer Pattern

Each resource module has:

- `http-router-factory.ts` — Elysia router with CRUD routes
- `http-dto.ts` — Zod schemas for request body/params/response (derived from core schemas)

Routes use two scoped plugins:

1. `HttpRequestCtxFactory.make()` — creates MongoCtx, manages transaction (derive/onBeforeHandle/onAfterHandle/onError/onAfterResponse)
2. `HttpAuthGuardFactory.make()` — resolves tenant from Better Auth session cookie

All routes versioned at `/api/v1/<resource>`.

Response envelope: `{ status, code, message, data? }` via `okEnvelope()` / `errEnvelope()`.

## DI Pattern

Manual constructor injection, no IoC container:

```
di/shared.ts:     ResendEmailService → BetterAuthClientFactory → BetterAuthService → HttpAuthGuardFactory
di/<domain>.ts:   MongoCrudRepository → BasicCrudService → V1HttpRouterFactory(authGuard, ctxFactory, service)
```

## Error Handling

- `Err` class (extends Error) with typed codes: unknown(500), unauthorized(401), forbidden(403), notFound(404), conflict(409), badRequest(400)
- `Err.code("notFound")` — create from known code
- `Err.from(error)` — normalize any thrown value
- All service/repo methods return `Result<T, Err>` — no exceptions in domain/app layers
- Auth guard throws `Err` at HTTP boundary — caught by global error handler plugin
- Result propagation uses imperative style: `if (result.isErr()) return err(result.error)`

## MongoDB Patterns

- Global singleton: `mongoClient = new MongoClient(config.database.url)`
- Per-request context: `makeMongoCtx()` creates Db + ClientSession
- Transaction lifecycle managed by HttpRequestCtxFactory (start/commit/abort/end)
- Full document replacement on update (`replaceOne`, not `$set`)
- All queries filter by `{ tenant: ctx.tenant }` for multi-tenant isolation
- Model ↔ Entity: `tenantAwareEntityToMongoModel()` / `#toDomain()` per repository
- Shared compound index: `{ "tenant.id": 1, "tenant.type": 1 }` on all tenant-aware collections

## Authentication (Better Auth)

- Email OTP authentication (passwordless)
- Organization management for multi-tenancy
- Cookie-based sessions (HttpOnly)
- Auth guard resolves two tenant modes:
  - `type: "user"` (individual, id = userId)
  - `type: "organization"` (org context, id = organizationId)
- No fine-grained RBAC at API layer — authorization is purely tenant-scoped

## External Services

| Service     | Infra Class                                           | Purpose                                                   |
| ----------- | ----------------------------------------------------- | --------------------------------------------------------- |
| MongoDB 8   | native driver                                         | Primary database                                          |
| Better Auth | BetterAuthService                                     | Authentication + organizations                            |
| Inngest     | InngestFunctionFactory + InngestWorkflowEngineFactory | Workflow engine (DAG execution via @inngest/workflow-kit) |
| Resend      | ResendEmailService                                    | Email (OTP, invitations)                                  |
| Daytona     | (not yet implemented)                                 | SDK sandboxes                                             |

## Workflow Sub-Domain

- `WorkflowDefinitionEntity`: DAG blueprint with actions[] (id, kind, name, inputs?) + edges[] (from, to)
- `WorkflowActionDefinitionEntity`: Runtime handler per action kind (global, not tenant-scoped)
- `WorkflowSdlcActionDefinitionCrudService`: Static stub with Research/Plan/Code actions (empty handlers)
- `WorkflowSdlcFunctionFactory`: Orchestrates Inngest function creation from engine + action definitions
- Engine loader fetches workflow definition from MongoDB at runtime

## Key Libraries

- `elysia` 1.4.x — Web framework
- `better-auth` — Authentication
- `mongodb` — Native driver
- `zod/v4` — Schema validation (note: config.ts uses `zod/v4`, others use `zod`)
- `neverthrow` — Result types
- `resend` — Email
- `inngest` + `@inngest/workflow-kit` — Background job + workflow engine
- `es-toolkit` — Utilities
- `pino` — Logging
- `@date-fns/utc` — UTC date handling (UTCDate)
- `@total-typescript/ts-reset` — TypeScript type improvements (via reset.d.ts)
