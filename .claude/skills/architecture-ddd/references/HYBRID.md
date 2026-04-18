# HYBRID — Aggregate as Class + FP Behavior

The signature decision of this skill. One style across the codebase: **class shell, functional core inside the domain.**

## Why hybrid

- A class gives the aggregate **identity, encapsulation, an event buffer, and natural method-call ergonomics** for command/invariant code at the call site.
- Pure functions give the **behavior**: they're testable without instantiation, composable, easy to reason about, and impossible to accidentally couple to I/O.
- Choosing one style end-to-end avoids the costly mixed-paradigm drift where similar aggregates look completely different.

## Aggregate-as-class shape

```typescript
import { Result, ok, err } from "neverthrow";
import * as UserBehavior from "./user-behavior";

type UserState = {
  readonly id: UserId;
  readonly email: Email;
  readonly status: UserStatus;
};

type CreateUserError = "invalid_email";
type ChangeEmailError = "invalid_email" | "same_email";

class User {
  private state: UserState;
  private events: UserEvent[] = [];

  private constructor(state: UserState) {
    this.state = state;
  }

  static create(input: {
    id: UserId;
    email: string;
  }): Result<User, CreateUserError> {
    return UserBehavior.create(input).map(({ state, events }) => {
      const user = new User(state);
      user.events.push(...events);
      return user;
    });
  }

  changeEmail(newEmail: string): Result<void, ChangeEmailError> {
    return UserBehavior.changeEmail(this.state, { newEmail }).map(
      ({ state, events }) => {
        this.state = state;
        this.events.push(...events);
      },
    );
  }

  get id(): UserId {
    return this.state.id;
  }

  pullEvents(): ReadonlyArray<UserEvent> {
    const drained = this.events;
    this.events = [];
    return drained;
  }

  equals(other: User): boolean {
    return this.state.id === other.state.id;
  }
}
```

Rules:

1. **Constructor is `private`.** Construction goes through `static create(...)` (or a factory function for cross-aggregate construction) and returns `Result`.
2. **`state` is private.** No getters that hand out the whole state object. Expose narrow read accessors only when callers genuinely need them (typically just `id`).
3. **One public method per command.** Each delegates to its sibling pure function and applies the returned `state` + `events`.
4. **Events buffered, not published.** The aggregate stores events; the use case calls `pullEvents()` after persistence and hands them to an outbound port (event bus, Inngest, etc.).
5. **Equality by `id`.**

## Pure behavior module shape

Sibling file (e.g. `user.ts` aggregate, `user-behavior.ts` pure functions). File casing per `conventions-naming` — no PascalCase filenames.

```typescript
// user-behavior.ts
import { Result, ok, err } from "neverthrow";

export const create = (input: {
  id: UserId;
  email: string;
}): Result<{ state: UserState; events: UserEvent[] }, "invalid_email"> =>
  makeEmail(input.email).map((email) => {
    const state: UserState = { id: input.id, email, status: "active" };
    const events: UserEvent[] = [{ type: "userRegistered", userId: input.id, email }];
    return { state, events };
  });

export const changeEmail = (
  state: UserState,
  cmd: { newEmail: string },
): Result<{ state: UserState; events: UserEvent[] }, "invalid_email" | "same_email"> =>
  makeEmail(cmd.newEmail).andThen((email) => {
    if (email === state.email) return err("same_email");
    const next: UserState = { ...state, email };
    const events: UserEvent[] = [{ type: "emailChanged", userId: state.id, email }];
    return ok({ state: next, events });
  });
```

Rules:

1. **Shape is fixed:** `(state, command) => Result<{ state, events }, DomainError>`. Never `void`. Never throws.
2. **No `this`, no I/O, no globals.** No `Date.now()`, no `crypto.randomUUID()`, no `fetch`. Anything non-deterministic is passed in via `command` (e.g. `now: Date`, `id: UserId`).
3. **Returned `state` is a fresh object** (use spread / structural construction). No in-place mutation.
4. **`DomainError` is a discriminated union** of tag strings or typed error objects — see `conventions-typescript` → `references/UNIONS.md` _Errors as values_.

## Use-case wiring

The use case (in `use-case/` per `architecture-hexagonal`) is where the class and the outside world meet:

```typescript
const changeUserEmail: ChangeEmailUseCase =
  ({ userRepo, eventBus }) =>
  async (input) => {
    const userResult = await userRepo.findById(input.userId);
    if (userResult.isErr()) return err(userResult.error);
    const user = userResult.value;

    const changed = user.changeEmail(input.newEmail);
    if (changed.isErr()) return err(changed.error);

    await userRepo.add(user);
    await eventBus.publish(user.pullEvents());
    return ok();
  };
```

The use case orchestrates; it never reaches into aggregate state directly.

## Domain events

- Discriminated union per aggregate — see `conventions-typescript` → `references/UNIONS.md`.
- Past tense, in ubiquitous language (`UserRegistered`, not `RegisterUser`).
- Carry only what consumers need; never the full aggregate snapshot.
- Emitted by the pure behavior, buffered by the class, published by the use case **after** persistence succeeds.

## What stays a class vs what stays a function

| Stays a class                                       | Stays a function                                                     |
| --------------------------------------------------- | -------------------------------------------------------------------- |
| Aggregate root                                      | Value-object smart constructors (return `Result`)                    |
| Entities owned by an aggregate                      | All command behavior (`(state, cmd) => Result<{ state, events }, E>`) |
|                                                     | Domain services                                                      |
|                                                     | Factories that need collaborators                                    |
|                                                     | Specifications                                                       |

If you find yourself writing `class FooService { … }` with no state — it's a domain service; make it a function.

## Banned in this hybrid

- **Setters on aggregates.** No `setEmail`, no `set status`. State changes only through commands.
- **Public mutable state.** No `public readonly state` either — `readonly` doesn't deep-freeze, and exposing the shape welds callers to it.
- **Throwing from aggregate methods.** Commands return `Result<void, DomainError>` (or `Result<T, …>`). Exceptions are reserved for unrecoverable bugs.
- **Static "manager" classes.** `UserManager`, `OrderProcessor` — those are domain services. Write them as functions.
- **Inheritance between aggregates.** Use composition. An `AdminUser extends User` hierarchy is a refactor waiting to happen.
- **Calling `pullEvents()` from inside the aggregate.** Only the use case drains events.
- **Construction via `new` outside the aggregate's own file.** Always `Aggregate.create(...)` or a factory.
