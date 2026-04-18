---
name: architecture-hexagonal
description: Apply whenever creating, moving, renaming, or reviewing code inside a bounded context — new contexts, new adapters, new ports, new use cases, or diffs that cross context folders. Trigger even when the user doesn't say "hexagonal" or "ports and adapters" but is clearly laying out backend/domain code, wiring infra to logic, or deciding what belongs where. Defines the bounded-context-first hexagonal layout and role-suffixed naming for the monorepo. Excludes DDD tactical patterns (→ architecture-ddd), casing (→ conventions-naming), and type shape (→ conventions-typescript).
---

# Hexagonal Architecture — Bounded-Context First

> **The One Rule** — _The domain depends on nothing; everything depends on the domain._

Scope: layout, layering, and role-suffixed naming. Casing → `conventions-naming`. Type shape (ports, Results, branded types) → `conventions-typescript`. How to model the contents of `domain/` (aggregates, value objects, repositories as collections, domain events) → `architecture-ddd` — we borrow only the word "domain" here to name the pure-logic layer.

## Principle & thinking

- **Domain-first.** The domain is the entry point of design and the anchor of every context. You model the domain before you choose a framework, a database, or a route shape.
- **Bounded-context first, not layer-first.** One folder per bounded context (`identity/`, `billing/`, `workflow/`), not one folder per technical layer (`controllers/`, `services/`). A context owns its language, its model, and its ports.
- **Dependency rule.** Imports flow `adapter → port → use-case → domain`. Never the reverse. The domain must be runnable with zero infra imports.
- **Ports are owned by the domain, adapters by infra.** A port is an interface the domain _asks for_. An adapter is the implementation the composition root _provides_.
- **Driving vs driven — always split.** `inbound/` (HTTP, CLI, worker) and `outbound/` (DB, email, external API) live in separate subfolders so the direction of control is visible at a glance.
- **Public surface is `port/inbound/` + public `domain/` types.** Cross-context imports reach those two paths directly; anything else (`use-case/`, `port/outbound/`, `adapter/`, `domain/` internals) is a review block.
- **Shared kernel stays small.** A top-level `kernel/` holds cross-cutting primitives only — ids, time, result helpers, branded-type utilities. Not "generic business things."

## Canonical tree

This is the **logical layout** of one bounded context. Where these folders root inside a repo — a single app, multiple apps, a shared package — is a monorepo-layout decision, not a hex decision. Every context has exactly these folders with these names, and the import rules hold regardless of where the root sits.

```
kernel/                          # shared primitives — cross-context, infra-free
  id.ts                          # branded ids, uuid-v7 helper
  time.ts                        # clock port + default impl
  result.ts                      # Result helpers on top of neverthrow

<bounded-context>/               # e.g. identity/, billing/, workflow/
  domain/                        # pure logic; zero infra imports
    <entity>.ts                  # shapes + pure functions
    <policy>.ts                  # invariants, derived rules
  port/
    inbound/                     # driving ports (use-case contracts)
      <action>.port.ts
    outbound/                    # driven ports (infra contracts)
      <dependency>.port.ts
  use-case/                      # orchestrators implementing port/inbound
    <action>.use-case.ts
  adapter/
    inbound/                     # http, cli, worker, queue consumer
      <channel>.adapter.ts
    outbound/                    # db, http client, email, etc.
      <impl>.adapter.ts
```

One bounded context = one hexagon. Naming the context is itself a design decision (the _ubiquitous language_ for its domain) — see `architecture-ddd`. Avoid technical names (`api/`, `backend/`) and generic buckets (`common/`, `shared/`).

## Naming quick table

| Role     | File suffix    | Type suffix |
| -------- | -------------- | ----------- |
| Port     | `.port.ts`     | `Port`      |
| Use case | `.use-case.ts` | `UseCase`   |
| Adapter  | `.adapter.ts`  | `Adapter`   |

Domain and kernel files carry no role suffix — the folder already identifies them. Files are `kebab-case`, types `PascalCase` — casing rules live in `conventions-naming`. Full suffix table (incl. inbound vs outbound examples), role edge cases, and anti-patterns → [references/NAMING.md](./references/NAMING.md).

## Dependency injection

Factory functions with closure at every layer — ports in, port (or handler) out. No DI containers, no decorators, no classes, no service locators. Adapters are only constructed at the composition root. How this looks per layer (use-case, inbound adapter, outbound adapter, domain, cross-context, tests), plus the rules of thumb → [references/DI.md](./references/DI.md).

## References

| Topic                                                             | Reference                                            |
| ----------------------------------------------------------------- | ---------------------------------------------------- |
| Folder layout, import direction, worked example, composition root | [references/STRUCTURE.md](./references/STRUCTURE.md) |
| Full suffix table, role edge cases, testing seams, anti-patterns  | [references/NAMING.md](./references/NAMING.md)       |
| DI pattern per layer, composition root, test wiring               | [references/DI.md](./references/DI.md)               |
| Modeling inside `domain/` (aggregates, value objects, events)     | `architecture-ddd`                                   |
| File/identifier casing                                            | `conventions-naming`                                 |
| Port shapes, `Result<T, E>`, branded types                        | `conventions-typescript`                             |
