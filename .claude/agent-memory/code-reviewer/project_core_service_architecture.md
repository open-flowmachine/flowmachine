---
name: Core Service Architecture Conventions
description: app/core-service is a new Clean Architecture / DDD / Hexagonal rewrite of platform-service; defines aggregate, port, error, and naming conventions used throughout
type: project
---

`app/core-service/` is a Bun + Elysia backend organised as Clean Architecture + DDD + Hexagonal layers. It is the successor to `app/platform-service` — same business domain, but with explicit aggregate boundaries, domain events, and ports/adapters.

**Why:** documented in `app/core-service/AGENTS.md` (the canonical source). The team is mid-build; `infra/`, `router/`, and `vendor/` layers are not yet implemented.

**How to apply:**
- Dep rule is enforced: `infra → application → domain`, `infra → shared`, `application → shared`, `domain → shared`. Flag any inward import violation.
- `domain/` aggregates never import each other's internals — only branded IDs across aggregate boundaries.
- Aggregates extend `AggregateRoot<TId, TEvent>`, expose `static create(...)` and `static fromPersistence(...)`, hold state in `#state`, and on every mutation call `this.touch(now)` + `this.raise(event)`.
- Domain methods **throw** `DomainError` subclasses on invariant violations. Use cases return `Result<T, ApplicationError>` via `neverthrow` and translate via `mapDomainError()` (`application/shared/errors.ts`).
- Application ports come in two flavours: driver ports (`I<Name>UseCase`) per aggregate, and driven ports (SPI: repositories, `ClockPort`, `IdGeneratorPort`, `UnitOfWorkPort`, publishers, verifiers).
- Seven aggregates: `Credential`, `Project`, `ProjectIssueFieldDefinition`, `AiAgent`, `GitRepository`, `WorkflowDefinition`, `WorkflowExecution`.
- File naming: directory bare (`project/`), files prefixed with directory (`project.ts`, `project-id.ts`, `project-events.ts`).
