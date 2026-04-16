# Core Service AGENT.md

Backend API service using Elysia framework with Bun runtime, organised as Clean Architecture + DDD + Hexagonal layers. This service is the successor to `app/platform-service`; it owns the same business domain but with explicit aggregate boundaries, domain events, and ports/adapters.

## Commands

```bash
bun run dev              # Start dev server (port 8000)
bun run build            # Build for production
bun run start            # Start production server
bun run test             # Run tests (bun test)
bun run check-types      # Type check
bun run lint             # Run oxlint
```

## Naming Convention

- **Directories** — bare domain/bounded-context name, no prefix: `project/`, `credential/`, `workflow-definition/`.
- **Files** — prefixed with their parent directory: `project.ts`, `project-id.ts`, `project-events.ts`, `project-repository.ts`.

## Architecture

### Dependency Rule

Dependencies always point inward:

```
infra → application → domain
infra → shared
application → shared
domain → shared
```

- **`domain/`** — innermost layer. Imports only from `domain/shared/` and the same aggregate folder. Must not import from `application/`, `infra/`, or `vendor/`. No side effects on import (no SDK clients, no env reads, no I/O).
- **`application/`** — orchestrates domain aggregates. Imports from `domain/` and `shared/`. Defines **ports** (interfaces) for I/O concerns — repositories, external services, event publishers, clocks, id generators. Must not import from `infra/` or `vendor/`.
- **`infra/`** (future) — concrete adapters for ports declared in `application/`: Mongo repositories, Inngest client, Jira/Linear HTTP clients, Daytona sandbox SDK, signature verifiers, clocks. Imports from `application/`, `domain/`, `shared/`, and `vendor/`.
- **`router/`** (future) — maps HTTP requests to use-case invocations and translates `ApplicationError` → HTTP. Imports from `application/`, `shared/`, `infra/` (for wiring only), and `vendor/`.
- **`shared/`** — pure, leaf: types, branded IDs, tenant, metadata, neverthrow re-exports, error bases. No SDKs, no side effects.
- **`vendor/`** (future) — thin wrappers around external SDKs. Only `infra/` and `router/` import from `vendor/`. Never from `domain/` or `application/`.

### Cross-aggregate rule inside `domain/`

Aggregate folders never import each other's internals. Cross-aggregate references are by **branded ID only** (e.g. `GitRepository` holds a `CredentialId`, not a `Credential`). Use cases at the `application/` layer load related aggregates via their repository ports.

### Error Layering

- `domain/shared/errors.ts` defines `DomainError` subclasses. Semantic (`ProjectIntegrationMissingError`, `CycleDetectedError`), HTTP-agnostic. Each carries a `category` (`"not-found" | "invariant-violated" | "conflict" | "invalid-transition" | "infrastructure-failure"`). Aggregate methods **`throw`** `DomainError` on invariant violations.
- `application/shared/errors.ts` defines `ApplicationError` carrying an `ErrCode` enum (`notFound | conflict | badRequest | unprocessableEntity | unauthorized | forbidden | unknown`). Use cases return `Result<T, ApplicationError>` via `neverthrow`. `mapDomainError()` translates `DomainError.category` → `ErrCode`.
- HTTP status mapping belongs to the future `router/` layer and consumes only `ApplicationError`.

### Aggregate Conventions

- Aggregate roots extend `AggregateRoot<TId>` from `domain/shared/aggregate-root.ts`. They carry `id`, `tenant`, `metadata` (`createdAt`, `updatedAt`, `version`), and an in-memory event buffer pulled via `pullDomainEvents()`.
- Construction via static factories: `Aggregate.create({ id, tenant, …, now })` for new instances and `Aggregate.fromPersistence({ id, tenant, metadata, state })` for reconstitution. Constructors are `protected`.
- State is held in a private `#state` field; every mutation calls `this.touch(now)` (bumps `updatedAt` + `version`) and `this.raise(event)`.
- Value objects are plain readonly TypeScript types; aggregates are classes.
- IDs are branded strings per aggregate (e.g. `ProjectId`, `CredentialId`) — import the branded type from `domain/<aggregate>/<aggregate>-id.ts`.

### Aggregates (7)

| Aggregate | Folder | Key ID | External refs |
|---|---|---|---|
| `Credential` | `domain/credential/` | `CredentialId` | — |
| `Project` | `domain/project/` | `ProjectId` | `CredentialId` |
| `ProjectIssueFieldDefinition` | `domain/project-issue-field/` | `ProjectIssueFieldDefinitionId` | `ProjectId` |
| `AiAgent` | `domain/ai-agent/` | `AiAgentId` | `ProjectId[]` |
| `GitRepository` | `domain/git-repository/` | `GitRepositoryId` | `CredentialId`, `ProjectId[]` |
| `WorkflowDefinition` | `domain/workflow-definition/` | `WorkflowDefinitionId` | `ProjectId[]` |
| `WorkflowExecution` | `domain/workflow-execution/` | `WorkflowExecutionId` | `WorkflowDefinitionId` |

### Application Layer

- Driver ports (use cases): `I<Name>UseCase { execute(command): Promise<Result<Output, ApplicationError>> }`. Each aggregate folder under `application/` has a `<name>-use-cases.ts` file exporting command types and use-case interfaces.
- Driven ports (SPI): `application/shared/` houses cross-cutting ports — `UnitOfWorkPort`, `DomainEventPublisherPort`, `IntegrationEventPublisherPort`, `WebhookSignatureVerifierPort`, `ClockPort`, `IdGeneratorPort`. Aggregate-specific driven ports (`ExternalIssueTrackerPort`, `SandboxProviderPort`) live under the relevant orchestration folder (`application/project-sync/`).
- **No factories in `application/`** — `application/` defines types only. Concrete wiring belongs in `infra/`.
