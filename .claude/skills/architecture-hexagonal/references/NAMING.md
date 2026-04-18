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
- **Inbound ACL.** An inbound adapter that translates an external or upstream model into the local ubiquitous language is an Anti-Corruption Layer — see `architecture-ddd` → STRATEGIC.md. Keep the translation in the adapter; no foreign types cross into `domain/` or `port/`.
- **Port has one use-case?** Still split. `port/inbound/` defines the _contract_; `use-case/` defines the _implementation_. Keeping them in separate folders means a grep for `.port.ts` finds every contract boundary without false positives.
- **Multiple outbound ports, one adapter.** Fine — a single `user-mongo.adapter.ts` may export a factory returning an object that satisfies several `*.port.ts` types. The adapter filename reflects the infra, not the ports.
- **Kernel files.** Named by primitive, no suffix (`id.ts`, `time.ts`, `result.ts`). If the primitive _is_ a port (e.g. `Clock`), the type ends in `Port` but the file does not — kernel files are standalone utilities, not context boundaries.
- **No barrels.** Contexts do not have a root `index.ts`. The public surface is the set of files under `port/inbound/` and the public type exports in `domain/` — consumers import those paths directly.

## Testing seams

The payoff of hex is that each layer has a clean seam to test against. If you can't test a layer without reaching into another, the boundary is wrong.

- **`domain/` — test directly.** Pure functions, no mocks, no setup, no clock, no db. If a test of `domain/` wants a mock, the domain is leaking infra; move the leak out via a port.
- **`use-case/` — test against in-memory adapters.** The composition root wires the real adapters; tests wire fakes that implement the same `port/outbound/` type. Same contract, different implementation. This is the main unit of behaviour-level testing.
- **`adapter/outbound/` — contract tests.** Write one suite against the port and run it twice: once against the real adapter (hitting a real db / external service in integration), once against the in-memory fake. If both pass, the fake is faithful and the swap is safe.
- **`adapter/inbound/` — thin translation tests.** Assert only transport↔port mapping (HTTP body → port input; port result → HTTP response/status). Business behaviour under test belongs in the use-case's test, not duplicated here.
- **File placement.** Sibling `*.test.ts` next to the file under test. Casing rules → `conventions-naming`. No top-level `__tests__/` folder, no parallel `tests/` tree — colocation keeps the test and the code it guards visible together.
- **In-memory fakes live with the port they implement.** A `user-repo.port.ts` is paired with a `user-repo.in-memory.adapter.ts` under `adapter/outbound/` (or in a `*.test.ts` helper if only one test needs it). It's still an adapter — just one whose backing store is a `Map`.

## Anti-patterns to reject in review

| Rejected                                                                                                                                         | Why                                                                                                              |
| ------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| `service.ts`, `manager.ts`, `helper.ts`, `util.ts` in a context                                                                                  | Hides intent; every file already has a role suffix.                                                              |
| `interfaces/` or `types/` folders                                                                                                                | Ports already capture contracts; types co-locate with their owner.                                               |
| Top-level `controllers/`, `repositories/`, `services/`                                                                                           | That's layer-first, not bounded-context-first.                                                                   |
| Top-level `feature/` wrapper folder                                                                                                              | Contexts are the root; one context = one hexagon.                                                                |
| Technical top-level names (`api/`, `backend/`, `common/`, `shared/`)                                                                             | Top-level names must be bounded contexts in the ubiquitous language.                                             |
| `in/` or `out/` folder names                                                                                                                     | Use full `inbound/` / `outbound/` — grep-friendly and unambiguous.                                               |
| `core/` folder name                                                                                                                              | Use `domain/` — domain-first is the mental model.                                                                |
| `use-case/` importing an `adapter/outbound/` directly                                                                                            | Must go through `port/outbound/`. The composition root wires it.                                                 |
| `adapter/inbound/` importing `adapter/outbound/`                                                                                                 | Adapters never talk to each other; they talk through ports + use-cases.                                          |
| Business types in `kernel/` (`Money`, `Organization`, …)                                                                                         | Kernel is infra-free primitives only. Business lives in the owning context.                                      |
| `kernel/` importing from a bounded context                                                                                                       | Kernel is a leaf — nothing in it may know a context exists.                                                      |
| Cross-context import of `<context-a>/use-case/`, `<context-a>/port/outbound/`, `<context-a>/adapter/`, or an internal `<context-a>/domain/` file | Only `<context-a>/port/inbound/*.port.ts` and public `<context-a>/domain/` types are importable across contexts. |
| A root `index.ts` in any bounded context                                                                                                         | There are no barrels — consumers import `port/inbound/` and `domain/` paths directly.                            |
| `class` in `domain/` (aggregate, domain service, factory, specification)                                                                         | Aggregates are readonly state records + pure command functions — see `architecture-ddd` → FP.md.                 |
| Port type without `Port` suffix, use-case without `UseCase` suffix                                                                               | Breaks grep-ability and makes role invisible at call site.                                                       |
| `any` / `enum` / `as T` / `x!` anywhere in hex code                                                                                              | See `conventions-typescript`.                                                                                    |
