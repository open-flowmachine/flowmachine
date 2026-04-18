---
name: architecture-hexagonal
description: Apply whenever creating, moving, renaming, or reviewing code inside a bounded context — new contexts, new adapters, new ports, new use cases, or diffs that cross context folders. Trigger also when laying out backend/domain code, wiring infra to logic, or deciding what belongs where. Defines the bounded-context-first hexagonal layout and role-suffixed naming for the monorepo. Excludes DDD tactical patterns (→ architecture-ddd), casing (→ conventions-naming), and type shape (→ conventions-typescript).
---

# Hexagonal Architecture — Bounded-Context First

> **The One Rule** — _The domain depends on nothing; everything depends on the domain._

## Principle & thinking

- **Domain-first.** The domain is the entry point of design and the anchor of every context. You model the domain before you choose a framework, a database, or a route shape.
- **Bounded-context first, not layer-first.** One folder per bounded context (`identity/`, `billing/`, `workflow/`), not one folder per technical layer (`controllers/`, `services/`). A context owns its language, its model, and its ports.
- **Dependency rule.** Imports flow `adapter → port → use-case → domain`. Never the reverse. The domain has no **injected** runtime dependencies; compile-time libraries (`zod`, `neverthrow`, `es-toolkit`) are allowed — see `architecture-ddd` → TACTICAL.md.
- **Ports owned by the domain, adapters by infra.** A port is an interface the domain _asks for_; an adapter is the implementation the composition root _provides_.
- **Driving vs driven — always split.** `inbound/` (HTTP, CLI, worker) and `outbound/` (DB, email, external API) live in separate subfolders so the direction of control is visible at a glance.

## Canonical tree

Every bounded context has exactly these folders (monorepo-layout decisions like where the root lives are orthogonal):

```
kernel/                          # shared primitives; infra-free
<bounded-context>/
  domain/                        # pure logic, zero infra imports
  port/{inbound,outbound}/       # *.port.ts
  use-case/                      # *.use-case.ts
  adapter/{inbound,outbound}/    # *.adapter.ts
```

One bounded context = one hexagon. Naming the context is itself a design decision (the _ubiquitous language_ for its domain) — see `architecture-ddd`. Avoid technical names (`api/`, `backend/`) and generic buckets (`common/`, `shared/`). Full tree, kernel scope, and cross-context rules → [references/STRUCTURE.md](./references/STRUCTURE.md).

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
| Full suffix table, role edge cases, anti-patterns                 | [references/NAMING.md](./references/NAMING.md)       |
| DI pattern per layer, composition root, test wiring               | [references/DI.md](./references/DI.md)               |
| Layer testing seams, in-memory fakes, test file placement         | [references/TESTING.md](./references/TESTING.md)     |
| Modeling inside `domain/` (aggregates, value objects, events)     | `architecture-ddd`                                   |
| File/identifier casing                                            | `conventions-naming`                                 |
| Port shapes, `Result<T, E>`, branded types                        | `conventions-typescript`                             |
