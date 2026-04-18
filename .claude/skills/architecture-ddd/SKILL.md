---
name: architecture-ddd
description: Apply when modeling domain logic inside a feature core — designing aggregates, value objects, domain events, repositories, factories, specifications, or splitting bounded contexts and subdomains. Defines DDD strategic + tactical patterns and the hybrid (class aggregate + FP behavior) approach. Excludes folder layout (architecture-hexagonal) and casing (conventions-naming).
---

# Domain-Driven Design — Strategic + Tactical + Hybrid

> **The One Rule** — _The model is the language; the language is the model._

Every name in the code must come from the ubiquitous language of its bounded context. If you can't say it to a domain expert, don't write it.

Scope: how to model the domain inside a feature's `domain/` folder. Folder/file layout → `architecture-hexagonal`. Casing → `conventions-naming`. Branded types, `Result<T, E>`, discriminated unions → `conventions-typescript`.

## Principle & thinking

- **Model-driven design.** The code is the model. No "domain" diagram that diverges from `core/`.
- **Ubiquitous language per bounded context.** One vocabulary, agreed with experts. The same word can legitimately mean different things in different contexts (`User` in auth ≠ `User` in billing) — that's why contexts exist.
- **Aggregate = consistency boundary.** One transaction touches one aggregate. Cross-aggregate consistency is eventual, mediated by domain events.
- **Behavior with the data it protects.** Methods (or functions) live next to the state they enforce invariants on. Anemic data + service-layer logic is the failure mode this skill exists to prevent.
- **Domain events are first-class outputs.** Commands return `{ state, events }`, not `void`. Events are the contract between aggregates and between contexts.
- **Domain is infra-free.** No DB, HTTP, clock, or `crypto` calls inside `domain/`. Inject what you need as command inputs. Cross-link `architecture-hexagonal` for the dependency rule.
- **Small over clever.** Smaller aggregates, fewer abstractions. Reach for Specification/Domain Service only after exhausting placement on the aggregate itself.

## Hybrid approach (one-line summary)

The aggregate is a **class** that owns identity, encapsulates state, and buffers events. Behavior is **pure FP functions** of shape `(state, command) => Result<{ state, events }, DomainError>` that the class delegates to. Class is the shell; FP is the core inside the domain. Full shape in `HYBRID.md`.

## References

| Topic                                                                                      | Reference                                            |
| ------------------------------------------------------------------------------------------ | ---------------------------------------------------- |
| Bounded contexts, subdomains, context maps, ubiquitous language                            | [references/STRATEGIC.md](./references/STRATEGIC.md) |
| Entity, value object, aggregate, repository, domain event, service, factory, specification | [references/TACTICAL.md](./references/TACTICAL.md)   |
| Aggregate-as-class + FP behavior, command shape, event emission                            | [references/HYBRID.md](./references/HYBRID.md)       |
| File/identifier casing                                                                     | `conventions-naming`                                 |
| Branded types, `Result<T, E>`, discriminated unions                                        | `conventions-typescript`                             |
| Where DDD code lives in the feature tree (`domain/`, ports, adapters)                      | `architecture-hexagonal`                             |
