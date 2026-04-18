# TESTING — Layer seams, fakes, file placement

The payoff of hex is that each layer has a clean seam to test against. If you can't test a layer without reaching into another, the boundary is wrong.

## Layer seams

- **`domain/` — test directly.** Pure functions, no mocks, no setup, no clock, no DB. If a test of `domain/` wants a mock, the domain is leaking infra; move the leak out via a port.
- **`use-case/` — test against in-memory adapters.** The composition root wires the real adapters; tests wire fakes that implement the same `port/outbound/` type. Same contract, different implementation. This is the main unit of behaviour-level testing.
- **`adapter/outbound/` — contract tests.** Write one suite against the port and run it twice: once against the real adapter (hitting a real DB / external service in integration), once against the in-memory fake. If both pass, the fake is faithful and the swap is safe.
- **`adapter/inbound/` — thin translation tests.** Assert only transport↔port mapping (HTTP body → port input; port result → HTTP response/status). Business behaviour under test belongs in the use-case's test, not duplicated here.

## In-memory fakes

A `user-repo.port.ts` is paired with a `user-repo.in-memory.adapter.ts` under `adapter/outbound/` (or in a `*.test.ts` helper if only one test needs it). It's still an adapter — just one whose backing store is a `Map`.

## File placement

- Sibling `*.test.ts` / `*.test.tsx` next to the file under test (`user-card.tsx` → `user-card.test.tsx`).
- No top-level `__tests__/` folder, no parallel `tests/` tree — colocation keeps the test and the code it guards visible together.
- No `.spec.` suffix. Runner is `bun test`.
- File casing follows `conventions-naming`.
