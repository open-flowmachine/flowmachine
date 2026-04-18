# STRUCTURE — Layering, Imports, Worked Example

## Layering invariants

| Layer              | May import                                                      | May NOT import                                                                           |
| ------------------ | --------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `kernel/`          | Nothing outside `kernel/`                                       | Any context, any framework, DB, HTTP, env reads                                          |
| `domain/`          | Other `domain/` files, `kernel/`                                | Anything in `port/`, `use-case/`, `adapter/`; any framework, DB, HTTP, env reads         |
| `port/inbound/`    | `domain/` types, `kernel/`                                      | `adapter/`, `use-case/`                                                                  |
| `port/outbound/`   | `domain/` types, `kernel/`                                      | `adapter/`, `use-case/`                                                                  |
| `use-case/`        | `domain/`, `port/inbound`, `port/outbound`, `kernel/`           | `adapter/` (inbound or outbound)                                                         |
| `adapter/inbound`  | `port/inbound` (to invoke it), `domain/` types, `kernel/`       | `use-case/` directly, `adapter/outbound`                                                 |
| `adapter/outbound` | `port/outbound` (to implement it), `domain/` types, `kernel/`   | `use-case/`, `adapter/inbound`, other contexts' internals                                |
| cross-context      | Another context's `port/inbound/` + public `domain/` types only | Another context's `use-case/`, `port/outbound/`, `adapter/`, or internal `domain/` files |

Rule of thumb: if you need to ask "can I import this," draw the arrow. If it points _toward_ the domain, it's allowed. Otherwise invert via a port.

## Import-direction matrix

```
adapter/inbound  ──▶  port/inbound  ──▶  use-case  ──▶  domain  ◀──  kernel
                                             │                       (leaf, imported by all)
                                             ▼
                                      port/outbound  ◀──  adapter/outbound
```

Every arrow above is the _only_ allowed direction. A missing arrow means "no import path exists."

## Worked example — `identity/` bounded context with a create-user action

```
kernel/
  id.ts
  time.ts

identity/
  domain/
    user.ts
  port/
    inbound/
      create-user.port.ts
    outbound/
      user-repo.port.ts
  use-case/
    create-user.use-case.ts
  adapter/
    inbound/
      user-http.adapter.ts
    outbound/
      user-mongo.adapter.ts
```

```typescript
// kernel/id.ts — generic branded-id primitive shared by every context.
// Parametric brands can't be expressed with `z.<type>().brand<"Name">()`;
// a manual brand + the `as unknown as T` escape hatch is the accepted form.
export type Id<Brand extends string> = string & { readonly __brand: Brand };
export const newId = <Brand extends string>(): Id<Brand> =>
  crypto.randomUUID() as unknown as Id<Brand>;
```

```typescript
// identity/domain/user.ts — a readonly state record + pure command functions.
// Full aggregate shape (commands, events, errors) → `architecture-ddd` → FP.md.
export type User = { readonly id: UserId; readonly email: Email };
export const create: /* ... */ = /* ... */;
```

```typescript
// identity/port/inbound/create-user.port.ts — what callers of the context may invoke.
import type { Result } from "neverthrow";
import type { User } from "../../domain/user";

export type CreateUserInput = { readonly email: string };
export type CreateUserError = "emailTaken" | "invalidEmail";
export type CreateUserPort = (
  input: CreateUserInput,
) => Promise<Result<User, CreateUserError>>;
```

```typescript
// port/outbound/user-repo.port.ts — what the use-case needs from infra.
import type { User } from "../../domain/user";

export type UserRepoPort = {
  readonly findByEmail: (email: string) => Promise<User | undefined>;
  readonly add: (user: User) => Promise<void>;
};
```

```typescript
// use-case/create-user.use-case.ts — orchestrates domain + outbound ports.
// Orchestration only — validation, construction, and events are produced by
// the aggregate's pure commands (see `architecture-ddd` → TACTICAL.md / FP.md).
import { err, ok } from "neverthrow";
import { newId } from "@/kernel/id";
import * as User from "../domain/user";
import type { CreateUserPort } from "../port/inbound/create-user.port";
import type { UserRepoPort } from "../port/outbound/user-repo.port";

export const createUserUseCase =
  (repo: UserRepoPort): CreateUserPort =>
  async ({ email }) => {
    if (await repo.findByEmail(email)) return err("emailTaken");
    const created = User.create({ id: newId<"UserId">(), email });
    if (created.isErr()) return err(created.error);
    const { state, events } = created.value;
    await repo.add(state);
    return ok(state);
  };
```

```typescript
// adapter/inbound/user-http.adapter.ts — invokes the driving port.
import type { CreateUserPort } from "../../port/inbound/create-user.port";

export const userHttpAdapter = (createUser: CreateUserPort) => ({
  post: async (body: { email: string }) =>
    (await createUser(body)).match(
      (user) => ({ status: 201, body: user }),
      (e) => ({ status: 400, body: { error: e } }),
    ),
});
```

```typescript
// adapter/outbound/user-mongo.adapter.ts — implements the driven port.
import type { UserRepoPort } from "../../port/outbound/user-repo.port";

export const userMongoAdapter = (/* db handle */): UserRepoPort => ({
  findByEmail: async (_email) => {
    /* ... */ return undefined;
  },
  add: async (_user) => {
    /* ... */
  },
});
```

## Composition root

Adapters are wired to ports **at the app entry** (the `main.ts` / `index.ts` that boots the app), never inside the context. The `@/` alias used below resolves to wherever the composition root's TS path alias points — typically the app's `src/` root. The import paths matter only in that they cross from the composition root into a context's `use-case/` and `adapter/` folders; that crossing is allowed **only** here.

```typescript
import { createUserUseCase } from "@/identity/use-case/create-user.use-case";
import { userMongoAdapter } from "@/identity/adapter/outbound/user-mongo.adapter";
import { userHttpAdapter } from "@/identity/adapter/inbound/user-http.adapter";

const userRepo = userMongoAdapter(db);
const createUser = createUserUseCase(userRepo);
const userRoute = userHttpAdapter(createUser);
```

The composition root is the **only** place that imports another context's `use-case/` and `adapter/` directly — everywhere else, cross-context access is limited to `port/inbound/` and public `domain/` types.

## Cross-context rule

- Context A imports from context B only via `<b>/port/inbound/*.port.ts` or public types in `<b>/domain/`.
- Importing `<b>/use-case/`, `<b>/port/outbound/`, `<b>/adapter/`, or internal `<b>/domain/` files from A is a review block.
- If A needs behavior that B's inbound ports don't expose, add a new `*.port.ts` in B rather than reaching past it.
- State changes across contexts go through integration events, not direct calls — see `architecture-ddd` → STRATEGIC.md for the policy and `references/DI.md` for the wiring.

## Kernel — scope and boundaries

`kernel/` lives at the top level (alongside the contexts) and holds primitives every context may need:

- Branded-id helpers (`Id<Brand>`, `newId`).
- Clock / time port + a default `systemClock` impl — every use case that reads time takes a `Clock`, never `Date.now()`.
- `Result` helpers that compose on top of `neverthrow`.
- Pure functional utilities that are genuinely generic (not "business generic").

Rules:

- Kernel imports from nothing but other kernel files. If it needs a context, it's not kernel.
- Adding to kernel requires at least two context call sites. Otherwise it belongs in the context that owns it.
- Kernel never holds business concepts (no `Money`, no `Organization`). Those live in the context that owns them and are accessed via that context's `domain/` types or `port/inbound/`.

## What NOT to put in `domain/`

- Framework decorators or base classes (Elysia handlers, Next route helpers).
- `zod` schemas that mirror _transport_ shape (HTTP bodies, DB documents, queue payloads) — those belong next to the adapter that parses them. `zod` _is_ allowed in `domain/` for smart constructors of value objects and branded primitives — see `architecture-ddd` → TACTICAL.md.
- Database driver types (`ObjectId`, `Collection<T>`).
- `process.env` reads, `Date.now()`, random id generation — inject via ports (or use `kernel/` primitives) so the domain stays pure and testable.
