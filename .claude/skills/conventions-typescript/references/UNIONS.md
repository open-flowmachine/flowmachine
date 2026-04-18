# UNIONS — Discriminated Unions, Narrowing, Type Guards

Discriminated unions model _all_ the states a value can be in. Paired with exhaustiveness checks, they let the compiler prove no state is forgotten.

## Canonical shape

**Base type + named per-variant types + final union.** Never inline anonymous unions.

```typescript
type BaseRequestState = {
  status: "idle" | "loading" | "success" | "error";
  data?: User | undefined;
  error?: Error | undefined;
};

type IdleRequestState = BaseRequestState & {
  status: "idle";
  data?: undefined;
  error?: undefined;
};
type LoadingRequestState = BaseRequestState & {
  status: "loading";
  data?: undefined;
  error?: undefined;
};
type SuccessRequestState = BaseRequestState & {
  status: "success";
  data: User;
  error?: undefined;
};
type ErrorRequestState = BaseRequestState & {
  status: "error";
  data?: undefined;
  error: Error;
};

type RequestState =
  | IdleRequestState
  | LoadingRequestState
  | SuccessRequestState
  | ErrorRequestState;
```

Rules:

1. `Base{Name}` lists every discriminant literal and every co-varying optional field.
2. Each variant pins the discriminant, sets its required fields, and marks absent fields `?: undefined`. With `exactOptionalPropertyTypes`, this blocks construction with the wrong shape.
3. Final union composes the named variants. Each variant is independently referenceable in narrowed signatures and predicates.

## Narrowing

Prefer discriminant narrowing over other forms. All listed forms are safe under strict mode:

| Form            | Example                           | Use when                                      |
| --------------- | --------------------------------- | --------------------------------------------- |
| Discriminant    | `if (s.status === "success")`     | Discriminated unions (the default).           |
| `typeof`        | `if (typeof x === "string")`      | Primitive unions.                             |
| `in` operator   | `if ("data" in s)`                | Unions without a shared literal discriminant. |
| `instanceof`    | `if (err instanceof DomainError)` | Class hierarchies only.                       |
| `Array.isArray` | `if (Array.isArray(x))`           | `unknown` / tuple vs scalar.                  |

## Type-predicate guards

Use a named predicate (`x is T`) when narrowing logic is reused or when the check is non-trivial:

```typescript
const isSuccess = (s: RequestState): s is SuccessRequestState =>
  s.status === "success";

if (isSuccess(state)) {
  state.data; // User
}
```

Predicates must match their runtime check. A lying predicate silently breaks type safety.

## Exhaustiveness via `never`

Every `switch` over a discriminated union ends with a `never` fallback. Adding a new variant becomes a compile error — not a missed case at runtime.

```typescript
const render = (s: RequestState): string => {
  switch (s.status) {
    case "idle":
      return "—";
    case "loading":
      return "…";
    case "success":
      return s.data.name;
    case "error":
      return s.error.message;
    default: {
      const _exhaustive: never = s;
      return _exhaustive;
    }
  }
};
```

Oxlint `typescript/switch-exhaustiveness-check` enforces this without the boilerplate, but keep the `never` fallback for `if/else` chains it can't see.

## Assertion functions at boundaries

For invariants that must hold past a point (parsed input, DB row shape), use `asserts`:

```typescript
function assertUser(x: unknown): asserts x is User {
  if (!isUser(x)) throw new Error("not a User");
}
```

Prefer `zod` at real system boundaries — see ANTI-PATTERNS.md → _Boundary parsing_. Use `asserts` for internal invariants only.

## Errors as values — `neverthrow`

Fallible operations return a `Result<T, E>`, not a thrown exception. `Result` is a discriminated union (`Ok<T>` | `Err<E>`) — the compiler forces the caller to handle both sides.

```typescript
import { Result, ok, err } from "neverthrow";

type AuthError = "not_found" | "wrong_password";

const login = (email: string, pwd: string): Result<User, AuthError> => {
  const user = findUser(email);
  if (!user) return err("not_found");
  if (!verify(pwd, user.hash)) return err("wrong_password");
  return ok(user);
};

login(email, pwd).match(
  (user) => render(user),
  (e) => renderError(e),
);
```

Rules:

- Public/exported functions that can fail return `Result<T, E>`. Don't mix thrown exceptions with `Result` in the same layer.
- `E` is a discriminated union of tag strings or typed error objects — never `Error` / `unknown`. The caller must be able to branch on `e`.
- Compose with `.map` / `.mapErr` / `.andThen`; unwrap only at the outermost layer (HTTP handler, CLI entry, job runner).
- Exceptions remain valid for _unrecoverable_ bugs (invariant violations, OOM). If the caller has a meaningful branch, it's a `Result`.
