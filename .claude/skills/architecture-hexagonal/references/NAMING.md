# NAMING — Hexagonal role suffixes & edge cases

Base casing rules live in `conventions-naming`. This file only covers what hex adds.

## Suffix table (authoritative)

| Role                | File suffix    | Type name suffix |
| ------------------- | -------------- | ---------------- |
| Domain entity/value | _(none)_       | _(none)_         |
| Driving port        | `.port.ts`     | `Port`           |
| Driven port         | `.port.ts`     | `Port`           |
| Use case            | `.use-case.ts` | `UseCase`        |
| Inbound adapter     | `.adapter.ts`  | `Adapter`        |
| Outbound adapter    | `.adapter.ts`  | `Adapter`        |
| Kernel primitive    | _(none)_       | _(none)_         |

Ports in `port/inbound/` and `port/outbound/` share a suffix because the folder already disambiguates direction. The type suffix (`Port`) pairs with a sentence-readable name: `CreateUserPort` reads as "the port for create-user."

## Edge cases

- **One file per action.** Each use case / driving port / inbound adapter is its own file. No `user-service.ts` aggregating five actions.
- **Port granularity.** One port per _capability_ the domain needs — not one port per adapter, and not one mega-port per context. `UserRepoPort` with three methods is fine; `UserRepoPort` with twenty is a seam you're missing.
- **Vendor-scoped adapters.** Name outbound adapters by vendor + capability so a future swap is obvious: `resend-email.adapter.ts`, `stripe-billing.adapter.ts`, `daytona-sandbox.adapter.ts`. Not `email.adapter.ts` — the whole point of the port is that email has one name and many implementations.
- **Inbound adapters.** Name by subject + transport: `user-http.adapter.ts`, `user-cli.adapter.ts`, `user-inngest.adapter.ts`.
- **Port has one use-case?** Still split. `port/inbound/` defines the _contract_; `use-case/` defines the _implementation_. Keeping them in separate folders means a grep for `.port.ts` finds every contract boundary without false positives.
- **Multiple outbound ports, one adapter.** Fine — a single `user-mongo.adapter.ts` may export a factory returning an object that satisfies several `*.port.ts` types. The adapter filename reflects the infra, not the ports.
- **Kernel files.** Named by primitive, no suffix (`id.ts`, `time.ts`, `result.ts`). If the primitive _is_ a port (e.g. `Clock`), the type ends in `Port` but the file does not — kernel files are standalone utilities, not context boundaries.
- **Tests.** Sibling `*.test.ts` (see `conventions-naming`). Test `domain/` and `use-case/` directly with in-memory adapters. Test outbound adapters via contract tests that drive the port from both the real and the fake implementation.
- **Barrel contents.** `index.ts` exports only: domain public types + `port/inbound/*` types. Never use-cases, never adapters, never domain internals.

## Anti-patterns to reject in review

| Rejected                                                     | Why                                                   |
| ------------------------------------------------------------ | ----------------------------------------------------- |
| `service.ts`, `manager.ts`, `helper.ts`, `util.ts` in a context | Hides intent; every file already has a role suffix. |
| `interfaces/` or `types/` folders                            | Ports already capture contracts; types co-locate with their owner. |
| Top-level `controllers/`, `repositories/`, `services/`       | That's layer-first, not bounded-context-first.        |
| Top-level `feature/` wrapper folder                          | Contexts are the root; one context = one hexagon.     |
| Technical top-level names (`api/`, `backend/`, `common/`, `shared/`) | Top-level names must be bounded contexts in the ubiquitous language. |
| `in/` or `out/` folder names                                 | Use full `inbound/` / `outbound/` — grep-friendly and unambiguous. |
| `core/` folder name                                          | Use `domain/` — domain-first is the mental model.     |
| `use-case/` importing an `adapter/outbound/` directly        | Must go through `port/outbound/`. The composition root wires it. |
| `adapter/inbound/` importing `adapter/outbound/`             | Adapters never talk to each other; they talk through ports + use-cases. |
| Business types in `kernel/` (`Money`, `Organization`, …)     | Kernel is infra-free primitives only. Business lives in the owning context. |
| `kernel/` importing from a bounded context                   | Kernel is a leaf — nothing in it may know a context exists. |
| Deep import `<context-a>/use-case/...` from context B        | Must go through `<context-a>/index.ts`.               |
| Port type without `Port` suffix, use-case without `UseCase` suffix | Breaks grep-ability and makes role invisible at call site. |
| `any` / `enum` / `as T` / `x!` anywhere in hex code          | See `conventions-typescript`.                         |
