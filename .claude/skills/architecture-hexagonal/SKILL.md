---
name: architecture-hexagonal
description: Apply when creating a new bounded context, moving code between layers, adding an adapter, or reviewing a diff that touches context structure. Defines bounded-context-first hexagonal (ports & adapters) layout for the monorepo. Excludes DDD tactical patterns.
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
- **Public surface is the barrel.** Cross-context calls go through `<context>/index.ts`. Deep imports into another context are a review block.
- **Shared kernel stays small.** A top-level `kernel/` holds cross-cutting primitives only — ids, time, result helpers, branded-type utilities. Not "generic business things."

## Canonical tree

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
  index.ts                       # public barrel — exports port/inbound + domain types only
```

One bounded context = one hexagon. Naming the context is itself a design decision (the _ubiquitous language_ for its domain) — see `architecture-ddd`. Avoid technical names (`api/`, `backend/`) and generic buckets (`common/`, `shared/`).

## Naming quick table

| Role                | File suffix    | Type name suffix | Example file              | Example type        |
| ------------------- | -------------- | ---------------- | ------------------------- | ------------------- |
| Domain entity/value | _(none)_       | _(none)_         | `user.ts`                 | `User`              |
| Driving port        | `.port.ts`     | `Port`           | `create-user.port.ts`     | `CreateUserPort`    |
| Driven port         | `.port.ts`     | `Port`           | `user-repo.port.ts`       | `UserRepoPort`      |
| Use case            | `.use-case.ts` | `UseCase`        | `create-user.use-case.ts` | `CreateUserUseCase` |
| Inbound adapter     | `.adapter.ts`  | `Adapter`        | `user-http.adapter.ts`    | `UserHttpAdapter`   |
| Outbound adapter    | `.adapter.ts`  | `Adapter`        | `user-mongo.adapter.ts`   | `UserMongoAdapter`  |
| Kernel primitive    | _(none)_       | _(none)_         | `id.ts`, `time.ts`        | `Id`, `Clock`       |
| Barrel              | `index.ts`     | —                | `index.ts`                | —                   |

Casing follows `conventions-naming` (files `kebab-case`, types `PascalCase`). The suffixes above are the only hex-specific addition.

## References

| Topic                                           | Reference                                            |
| ----------------------------------------------- | ---------------------------------------------------- |
| Folder layout, import direction, worked example | [references/STRUCTURE.md](./references/STRUCTURE.md) |
| Naming edge cases, anti-patterns to reject      | [references/NAMING.md](./references/NAMING.md)       |
| Modeling inside `domain/` (aggregates, value objects, events) | `architecture-ddd`                     |
| File/identifier casing                          | `conventions-naming`                                 |
| Port shapes, `Result<T, E>`, branded types      | `conventions-typescript`                             |
