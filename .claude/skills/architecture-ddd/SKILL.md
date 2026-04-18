---
name: architecture-ddd
description: Apply when modeling domain logic inside a feature's `domain/` folder — designing aggregates, value objects, domain events, integration events, repositories, factories, specifications, or splitting bounded contexts and subdomains. Trigger whenever a user is placing behaviour inside a feature, asking where a rule or validation should live, designing events, deciding how two contexts talk (outbox, integration events, ACL), or asking about entities vs value objects — even if they don't say "DDD" or "aggregate". Defines DDD strategic + tactical patterns, the outbox-based integration default, and the full-FP aggregate approach (readonly state + pure command functions). Excludes folder layout (architecture-hexagonal) and casing (conventions-naming).
---

# Domain-Driven Design — Strategic + Tactical + FP

> **The One Rule** — _The model is the language; the language is the model._

Every name in the code must come from the ubiquitous language of its bounded context. If you can't say it to a domain expert, don't write it.

Scope: how to model the domain inside a feature's `domain/` folder. Folder/file layout → `architecture-hexagonal`. Casing → `conventions-naming`. Branded types, `Result<T, E>`, discriminated unions → `conventions-typescript`.

## Principle & thinking

- **Model-driven design.** The code is the model. No "domain" diagram that diverges from `domain/`.
- **Ubiquitous language per bounded context.** One vocabulary, agreed with experts. The same word can legitimately mean different things in different contexts (`User` in auth ≠ `User` in billing) — that's why contexts exist.
- **Aggregate = consistency boundary.** One transaction touches one aggregate. Cross-aggregate consistency is eventual, mediated by domain events.
- **Behavior with the data it protects.** Methods (or functions) live next to the state they enforce invariants on. Anemic data + service-layer logic is the failure mode this skill exists to prevent.
- **Domain events are first-class outputs.** Commands return `{ state, events }`, not `void`. Domain events are the contract between aggregates _within_ a context.
- **Cross-context = integration events via outbox (default).** Between contexts, publish _integration events_ (versioned, stable, minimal) written to an `outbox` collection in the same transaction as the state change; a relay worker forwards them to the bus. Consumers are idempotent. No direct publish, no shared transactions, no synchronous state-mutating RPC across contexts.
- **Domain is infra-free.** No injected runtime dependencies inside `domain/` — no DB handles, HTTP clients, clocks, or `crypto` calls. Inject what you need as command inputs. Compile-time libraries are fine: `zod` (required for smart constructors), `neverthrow` (required for `Result`), `es-toolkit`. Cross-link `architecture-hexagonal` for the full dependency rule.
- **Small over clever.** Smaller aggregates, fewer abstractions. Reach for Specification/Domain Service only after exhausting placement on the aggregate itself.

## References

| Topic                                                                                       | Reference                                            |
| ------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| Bounded contexts, subdomains, context maps, ubiquitous language, integration events, outbox | [references/STRATEGIC.md](./references/STRATEGIC.md) |
| Entity, value object, aggregate, repository, domain event, service, factory, specification  | [references/TACTICAL.md](./references/TACTICAL.md)   |
| Full-FP aggregate shape, command shape, event emission                                      | [references/FP.md](./references/FP.md)               |
| File/identifier casing                                                                      | `conventions-naming`                                 |
| Branded types, `Result<T, E>`, discriminated unions                                         | `conventions-typescript`                             |
| Where DDD code lives in the feature tree (`domain/`, ports, adapters)                       | `architecture-hexagonal`                             |
