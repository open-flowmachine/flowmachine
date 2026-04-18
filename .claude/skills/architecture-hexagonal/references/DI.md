# DI — Dependency injection across the hexagon

Ports are what you depend on; adapters are what the composition root supplies. Every layer uses the same pattern: a factory function that takes the ports it needs and returns a port, an adapter, or a handler.

## Why

- Keeps `domain/` pure and `use-case/` unit-testable — no infra reaches in.
- Makes adapters swappable — Mongo ↔ Postgres ↔ in-memory without touching logic.
- Makes the dependency rule enforceable by grep — any non-root file that constructs an adapter is a review block.

## When

Anywhere a side effect or non-determinism appears: repos, clocks, id/uuid generators, email, HTTP, message buses, feature flags, env reads — and any cross-context call. Inside `domain/`, don't inject at all; take what you need as a plain argument.

## How — by layer

| Layer               | Receives                                  | Returns                                | Wired at          |
| ------------------- | ----------------------------------------- | -------------------------------------- | ----------------- |
| `domain/`           | Plain arguments (incl. kernel primitives) | Pure value / `Result`                  | —                 |
| `use-case/`         | Outbound ports + kernel ports             | Inbound port                           | Composition root  |
| `adapter/inbound/`  | Inbound port                              | Transport handler (route, CLI, worker) | Composition root  |
| `adapter/outbound/` | Infra handles (db client, SDK, api key)   | Outbound port                          | Composition root  |
| `kernel/`           | Nothing                                   | Primitive or kernel port (e.g. `ClockPort` + `systemClock` impl) | Imported directly |

Every box is a factory function — no classes, no DI containers, no decorators, no service locators.

### Use-case — ports in, inbound port out

```typescript
export const createUserUseCase =
  (repo: UserRepoPort, clock: ClockPort): CreateUserPort =>
  async (input) => {
    /* ... */
  };
```

### Inbound adapter — depends on the port, not the use-case

```typescript
export const userHttpAdapter = (createUser: CreateUserPort) => ({
  post: async (body) => (await createUser(body)).match(/* ... */),
});
```

The adapter has no idea whether `createUser` is the real use-case or a stub — that's the seam. An inbound adapter importing `*.use-case.ts` defeats the point.

### Outbound adapter — infra in, port out

```typescript
export const userMongoAdapter = (db: Db): UserRepoPort => ({
  findByEmail: async (email) => {
    /* ... */
  },
  add: async (user) => {
    /* ... */
  },
});
```

The infra handle (`db`, sdk client, api key) is itself constructed at the composition root and passed in — never reached for with a module-level singleton.

### Domain — no injection

The domain has no **injected** dependencies. Ports, clocks, DB handles, and HTTP clients are passed by the use case, not imported. Compile-time libraries are allowed — see `architecture-ddd` → TACTICAL.md for the `zod` smart-constructor rule.

```typescript
// good — id and now are plain arguments, provided by the use-case
export const create = (input: { id: UserId; now: Date; email: string }) => {
  /* ... */
};

// bad — domain importing a port, a clock, or anything with I/O
```

If a domain function needs time or an id, the use-case reads it from its injected port and passes the value in.

### Cross-context — wiring only

> **Policy** (outbox atomicity, integration vs domain events, at-least-once, idempotency, when sync is allowed) lives in `architecture-ddd` → `references/STRATEGIC.md`. This section covers only the wiring shape.

Bounded contexts don't import each other. They talk through:

- An **`EventBusPort`** (outbound) declared in the publishing context.
- A **relay adapter** that reads the outbox and forwards to the bus — lives in `adapter/outbound/` of the publishing context.
- A **subscriber adapter** in the reacting context's `adapter/inbound/` that receives the event and invokes its own `port/inbound/`.
- The bus implementation (e.g. `inngest-bus.adapter.ts`) is constructed **once** at the composition root and injected into every context that needs it.

```typescript
// A — use-case writes to outbox via eventBus port
const createUser = createUserUseCase(userRepo, eventBus);

// B — its own inbound subscriber adapter, wired to its own inbound port
const onUserRegistered = userRegisteredInngestAdapter(sendWelcome);
```

Neither context imports anything from the other — not use-cases, not inbound ports, not domain types. The event payload is the only contract.

### Composition root — the only crossing

```typescript
const db = await connect(env.DATABASE_URL);
const userRepo = userMongoAdapter(db);
const createUser = createUserUseCase(userRepo, systemClock);
const userRoute = userHttpAdapter(createUser);
```

Top-down: infra handles → outbound adapters → use-cases → inbound adapters. Any other location that constructs an adapter is a review block.

### Tests — same factories, fake adapters

```typescript
const createUser = createUserUseCase(userInMemoryAdapter(), fixedClock(now));
```

If a test has to mock an import, the DI wiring is wrong — pass a fake that implements the port instead.

## Rules of thumb

- Depend on the narrowest port you actually use; `UserRepoPort` with three methods beats a kitchen-sink `UserService`.
- One factory per file — no file exposes two DI seams.
- Five or six injections on a single factory signals a missing seam — split the use-case, or merge ports that always travel together.
- Never `new` infra, read `process.env`, call `Date.now()`, or generate ids outside adapters and the composition root. Inside logic, reach for a kernel primitive or a port.
