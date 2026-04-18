# STRUCTURE — Layering, Imports, Worked Example

## Layering invariants

| Layer              | May import                                           | May NOT import                                              |
| ------------------ | ---------------------------------------------------- | ----------------------------------------------------------- |
| `kernel/`          | Nothing outside `kernel/`                            | Any context, any framework, DB, HTTP, env reads             |
| `domain/`          | Other `domain/` files, `kernel/`                     | Anything in `port/`, `use-case/`, `adapter/`; any framework, DB, HTTP, env reads |
| `port/inbound/`    | `domain/` types, `kernel/`                           | `adapter/`, `use-case/`                                     |
| `port/outbound/`   | `domain/` types, `kernel/`                           | `adapter/`, `use-case/`                                     |
| `use-case/`        | `domain/`, `port/inbound`, `port/outbound`, `kernel/`| `adapter/` (inbound or outbound)                            |
| `adapter/inbound`  | `port/inbound` (to invoke it), `domain/` types, `kernel/` | `use-case/` directly, `adapter/outbound`               |
| `adapter/outbound` | `port/outbound` (to implement it), `domain/` types, `kernel/` | `use-case/`, `adapter/inbound`, other contexts' internals |
| `index.ts`         | Re-exports `port/inbound` + `domain/` public types   | Never re-exports `adapter/` or `use-case/`                  |

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
  index.ts
```

```typescript
// kernel/id.ts — branded id primitive shared by every context.
export type Id<Brand extends string> = string & { readonly __brand: Brand };
export const newId = <Brand extends string>(): Id<Brand> =>
  crypto.randomUUID() as Id<Brand>;
```

```typescript
// identity/domain/user.ts — pure shapes and rules.
import type { Id } from "@/kernel/id";
export type UserId = Id<"UserId">;
export type User = { readonly id: UserId; readonly email: string };
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
import type { User, UserId } from "../../domain/user";

export type UserRepoPort = {
  readonly findByEmail: (email: string) => Promise<User | undefined>;
  readonly insert: (user: User) => Promise<void>;
  readonly nextId: () => UserId;
};
```

```typescript
// use-case/create-user.use-case.ts — orchestrates domain + outbound ports.
import { err, ok } from "neverthrow";
import type { CreateUserPort } from "../port/inbound/create-user.port";
import type { UserRepoPort } from "../port/outbound/user-repo.port";

export const createUserUseCase =
  (repo: UserRepoPort): CreateUserPort =>
  async ({ email }) => {
    if (!email.includes("@")) return err("invalidEmail");
    if (await repo.findByEmail(email)) return err("emailTaken");
    const user = { id: repo.nextId(), email };
    await repo.insert(user);
    return ok(user);
  };
```

```typescript
// adapter/inbound/user-http.adapter.ts — invokes the driving port.
import type { CreateUserPort } from "../../port/inbound/create-user.port";

export const userHttpAdapter = (createUser: CreateUserPort) => ({
  post: async (body: { email: string }) => (await createUser(body)).match(
    (user) => ({ status: 201, body: user }),
    (e) => ({ status: 400, body: { error: e } }),
  ),
});
```

```typescript
// adapter/outbound/user-mongo.adapter.ts — implements the driven port.
import { newId } from "@/kernel/id";
import type { UserRepoPort } from "../../port/outbound/user-repo.port";

export const userMongoAdapter = (/* db handle */): UserRepoPort => ({
  findByEmail: async (_email) => { /* ... */ return undefined; },
  insert: async (_user) => { /* ... */ },
  nextId: () => newId<"UserId">(),
});
```

```typescript
// identity/index.ts — public surface of the context.
export type { User, UserId } from "./domain/user";
export type { CreateUserPort, CreateUserInput, CreateUserError } from "./port/inbound/create-user.port";
```

## Composition root

Adapters are wired to ports **at the app entry** (e.g. `app/service/src/main.ts`), never inside the context:

```typescript
import { createUserUseCase } from "@/identity/use-case/create-user.use-case";
import { userMongoAdapter } from "@/identity/adapter/outbound/user-mongo.adapter";
import { userHttpAdapter } from "@/identity/adapter/inbound/user-http.adapter";

const userRepo = userMongoAdapter(db);
const createUser = createUserUseCase(userRepo);
const userRoute = userHttpAdapter(createUser);
```

The composition root is the **only** place that reaches past another context's `index.ts`.

## Cross-context rule

- Context A calls context B **only** through `<b>/index.ts`.
- If B's barrel doesn't expose what A needs, the fix is "widen the barrel," not "reach in."
- If A needs B's outbound adapter behavior, model it as a new port in A and inject B's use-case as the implementation at the composition root.

## Kernel — scope and boundaries

`kernel/` lives at the top level (alongside the contexts) and holds primitives every context may need:

- Branded-id helpers (`Id<Brand>`, `newId`).
- Clock / time port + a default `systemClock` impl — every use case that reads time takes a `Clock`, never `Date.now()`.
- `Result` helpers that compose on top of `neverthrow`.
- Pure functional utilities that are genuinely generic (not "business generic").

Rules:

- Kernel imports from nothing but other kernel files. If it needs a context, it's not kernel.
- Adding to kernel requires at least two context call sites. Otherwise it belongs in the context that owns it.
- Kernel never holds business concepts (no `Money`, no `Organization`). Those live in the context that owns them and are re-exported via that context's `index.ts`.

## What NOT to put in `domain/`

- Framework decorators or base classes (Elysia handlers, Next route helpers).
- `zod` schemas that mirror transport shape — those belong next to the adapter that parses them.
- Database driver types (`ObjectId`, `Collection<T>`).
- `process.env` reads, `Date.now()`, random id generation — inject via ports (or use `kernel/` primitives) so the domain stays pure and testable.
