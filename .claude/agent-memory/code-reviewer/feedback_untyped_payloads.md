---
name: Untyped Payload Boundaries
description: core-service uses `Record<string, unknown>` at several boundaries (webhooks, integration events, workflow snapshots); flag and recommend zod or typed generics
type: feedback
---

Recurring weak typing at boundaries in `app/core-service`:

- `application/webhook-ingestion/webhook-ingestion-use-cases.ts` — webhook command `payload: Readonly<Record<string, unknown>>` with no zod schema. Webhooks are untrusted input; this is the canonical place validation must live.
- `application/shared/integration-event-publisher-port.ts` — `IntegrationEvent.data: Readonly<Record<string, unknown>>`. Compare to the strongly-generic `DomainEvent<TName, TPayload>` in `domain/shared/domain-event.ts` — egress should be just as typed.
- `domain/workflow-execution/workflow-execution-value-objects.ts` — `WorkflowDefinitionSnapshot.raw: Readonly<Record<string, unknown>>`, produced by `WorkflowDefinition.toSnapshot()` and consumed by execution. The snapshot has a known shape (actions, edges, isActive, version) and should be typed as such.
- `domain/workflow-definition/workflow-definition-value-objects.ts` — `WorkflowAction.inputs?: Readonly<Record<string, unknown>>` should be a discriminated union on `kind`.

**Why:** project standard is `zod/v4` for schema validation and `neverthrow` for results (per root `CLAUDE.md`). The team is comfortable with discriminated unions (see `CredentialSecret`, all event unions) — they have not yet applied that rigor at I/O boundaries.

**How to apply:** when you see `Record<string, unknown>` (or `Record<string, any>`) crossing a boundary in this service, recommend either (a) a generic `T` parameter mirroring `DomainEvent<TName, TPayload>` for known-shape data, or (b) a zod schema validated at the boundary for untrusted input.
