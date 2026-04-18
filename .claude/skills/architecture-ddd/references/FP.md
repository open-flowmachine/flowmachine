# FP — Aggregate as State + Pure Commands

> **The shape** — `(state, command) => Result<{ state, events }, DomainError>`.

No classes. No `this`. No instance mutation. No event buffers. An aggregate is a readonly state record plus a sibling namespace of pure command functions. The use case composes them.

## Aggregate module shape

One file per aggregate (e.g. `domain/user.ts`). Exports the state type, event type, error types, and one exported function per command.

```typescript
// domain/user.ts
import { err, ok, type Result } from "neverthrow";
import type { Id } from "@/kernel/id";

export type UserId = Id<"UserId">;

export type User = {
  readonly id: UserId;
  readonly email: Email;
  readonly status: UserStatus;
};

type BaseUserEvent = {
  type: "userRegistered" | "emailChanged";
  userId: UserId;
};
type UserRegistered = BaseUserEvent & { type: "userRegistered"; email: Email };
type EmailChanged = BaseUserEvent & { type: "emailChanged"; email: Email };
export type UserEvent = UserRegistered | EmailChanged;

export type CreateUserError = "invalidEmail";
export type ChangeEmailError = "invalidEmail" | "sameEmail";

export const create = (input: {
  id: UserId;
  email: string;
}): Result<{ state: User; events: UserEvent[] }, CreateUserError> =>
  makeEmail(input.email).map((email) => {
    const state: User = { id: input.id, email, status: "active" };
    const events: UserEvent[] = [
      { type: "userRegistered", userId: input.id, email },
    ];
    return { state, events };
  });

export const changeEmail = (
  state: User,
  cmd: { newEmail: string },
): Result<{ state: User; events: UserEvent[] }, ChangeEmailError> =>
  makeEmail(cmd.newEmail).andThen((email) => {
    if (email === state.email) return err("sameEmail");
    const next: User = { ...state, email };
    const events: UserEvent[] = [
      { type: "emailChanged", userId: state.id, email },
    ];
    return ok({ state: next, events });
  });
```

Callers import the module as a namespace:

```typescript
import * as User from "@/identity/domain/user";

User.create({ id, email });
User.changeEmail(state, { newEmail });
```

## Rules

1. **Fixed command shape.** `(state, command) => Result<{ state, events }, DomainError>`. Never `void`. Never throws.
2. **State is a plain readonly record.** No methods. No hidden fields. No class.
3. **No I/O, no globals, no `this`.** No `Date.now()`, `crypto.randomUUID()`, `fetch`. Pass non-determinism in via the command (`now: Date`, `id: UserId`).
4. **Fresh state out.** Spread / structural construction; no in-place mutation.
5. **Events returned, not buffered.** Each command returns `{ state, events }`. The use case accumulates and publishes.
6. **Equality by `state.id`.** Compare the id field — no helper method needed.
7. **`DomainError` is a discriminated union** — see `conventions-typescript` → `references/UNIONS.md`.

## Use-case wiring

The use case (in `use-case/` per `architecture-hexagonal`) loads state, calls commands, saves, publishes:

```typescript
import * as User from "../domain/user";

export const changeUserEmail: ChangeEmailUseCase =
  ({ userRepo, eventBus }) =>
  async (input) => {
    const loaded = await userRepo.findById(input.userId);
    if (loaded.isErr()) return err(loaded.error);

    const changed = User.changeEmail(loaded.value, {
      newEmail: input.newEmail,
    });
    if (changed.isErr()) return err(changed.error);

    const { state, events } = changed.value;
    await userRepo.save(state);
    await eventBus.publish(events);
    return ok();
  };
```

Chain multiple commands by threading `state` through and concatenating `events` arrays:

```typescript
const created = User.create({ id, email });
if (created.isErr()) return err(created.error);

const renamed = User.changeEmail(created.value.state, { newEmail });
if (renamed.isErr()) return err(renamed.error);

const finalState = renamed.value.state;
const events = [...created.value.events, ...renamed.value.events];

await userRepo.save(finalState);
await eventBus.publish(events);
```

Each command sees the previous command's fresh state; events accumulate and are published once after the save commits.

## Factories, domain services, specifications

- **Factory** — a plain function (usually just `create`) on the aggregate module. A standalone factory file only when construction needs collaborators from other aggregates.
- **Domain service** — a named exported function in `domain/`. Takes aggregate states in, returns `Result<{ ...states, events }, E>`. No classes.
- **Specification** — a named exported function returning `boolean` (or composed via `and` / `or` / `not` helpers). Pure, stateless, reused.

## Banned

- **Classes in `domain/`.** No aggregate classes, no `UserManager`, no static factories on classes.
- **Methods on state records.** `user.changeEmail(...)` is forbidden; call `User.changeEmail(user, ...)`.
- **Throwing from commands.** Commands return `Result`. Exceptions are for unrecoverable bugs only.
- **Reading time or randomness inside a command.** Pass it in via the command argument.
- **In-place updates.** `state.email = ...` or `Object.assign(state, ...)` — always return a new state.
- **Event buffers.** No `pullEvents()`, no hidden event arrays. Return events from every command.
