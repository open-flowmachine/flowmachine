# ANTI-PATTERNS — Unsafe types, enums, casts, boundaries

Each anti-pattern below moves a bug from compile time to runtime. Every row has an enforcement hook in [CONFIG.md](./CONFIG.md).

## The table

| Anti-pattern                          | Use instead                                         | Enforced by                                             |
| ------------------------------------- | --------------------------------------------------- | ------------------------------------------------------- |
| `any`                                 | `unknown` + narrow                                  | `typescript/no-explicit-any`, `typescript/no-unsafe-*`  |
| Native `enum`                         | `as const` object + derived union                   | Oxlint `typescript/no-enum` (or `no-restricted-syntax`) |
| `x as T`                              | type guard / `satisfies` / `zod` parse              | `typescript/consistent-type-assertions`                 |
| `x!` non-null assertion               | narrow with guard or redesign the type              | `typescript/no-non-null-assertion`                      |
| `obj[key]` assumed defined            | `noUncheckedIndexedAccess`; handle `T \| undefined` | `tsconfig`                                              |
| `string` / `number` IDs, emails, URLs | branded types                                       | convention                                              |
| Mutable shared state                  | `readonly` fields, `ReadonlyArray<T>`               | convention                                              |
| Unused cast (`x as X` when `x: X`)    | delete it                                           | `typescript/no-unnecessary-type-assertion`              |

## `any` → `unknown`

`any` disables every check the type system provides. `unknown` forces you to narrow before use:

```typescript
const parseJson = (raw: string): unknown => JSON.parse(raw);

const data = parseJson(input);
if (typeof data === "object" && data !== null && "id" in data) {
  // data narrowed
}
```

In practice, narrow with `zod` at boundaries — see below.

## Native `enum` → `as const` + derived union

Native `enum` produces runtime JS objects with surprising bidirectional mappings (numeric enums) and generates code. `as const` + derived union is purely structural. Pick the shape by what the members carry:

**String-literal enum → `as const` array.** No key/value duplication, trivial `(typeof x)[number]` derivation:

```typescript
// No
enum Status {
  Idle,
  Ready,
}

// Yes
const statuses = ["idle", "ready"] as const;
type Status = (typeof statuses)[number]; // "idle" | "ready"
```

**Complex-value enum → `as const` object.** Use when members map to numbers, objects, tuples, or functions:

```typescript
const httpCodes = { ok: 200, notFound: 404 } as const;
type HttpCode = (typeof httpCodes)[keyof typeof httpCodes]; // 200 | 404
```

Casing: value side (`statuses`, `httpCodes`, members) is `camelCase`; the derived type is `PascalCase`. The derived union is directly usable as a discriminant in unions (see UNIONS.md).

## `as T` → narrow or parse

A cast is the compiler trusting you. Every cast in the codebase is a runtime bug waiting for the shape to drift. Replacements, in priority order:

1. **Schema parse** — external/untrusted data → `zod.parse(raw)` returns the typed value.
2. **Type guard** — structural check returning `x is T`.
3. **`satisfies`** — value is already the right shape; just prove conformance.
4. **Redesign** — if nothing above works, the type model is wrong.

Allowed: `as const` (widens nothing), and `as unknown as T` as a last-resort escape hatch (see below).

## `x!` → narrow or redesign

`x!` says "trust me, not null." If the compiler can't see it, neither can the next reader. Almost always solvable:

```typescript
// No
const user = users.find((u) => u.id === id)!;

// Yes
const user = users.find((u) => u.id === id);
if (!user) throw new NotFoundError(id);
// user: User
```

If the API frequently forces `!`, the signature is wrong — consider `NonEmptyArray<T>`, `Result<T, E>`, or a different shape.

## Unchecked index access

With `noUncheckedIndexedAccess`, `arr[i]` is `T | undefined` and `record[key]` is `V | undefined`. Always handle `undefined` — or convert to a safer API (`Map.get` already returns `V | undefined`; `Array.at(i)` is explicit).

## Branded types for primitives

Plain `string` / `number` for domain identity invites mix-ups (`userId` passed as `orgId`). Brand at construction:

```typescript
type Email = string & { readonly __brand: "Email" };
const makeEmail = (raw: string): Email => {
  if (!/^[^@\s]+@[^@\s]+$/.test(raw)) throw new Error("invalid");
  return raw as Email; // sole cast, co-located with the validator
};
```

The cast inside a smart constructor is the only place `as` is acceptable — because the validator _is_ the proof.

## Boundary parsing

Untrusted data — env vars, HTTP bodies, DB documents, message queues, third-party APIs — **must** pass through a `zod/v4` schema before entering typed code. No `as` on boundary data. The schema is the bridge from `unknown` to a branded domain type.

```typescript
import { z } from "zod/v4";

const UserDto = z.object({ id: z.uuid(), email: z.email() });
type UserDto = z.infer<typeof UserDto>;

const user = UserDto.parse(await res.json()); // typed after this line
```

## Escape hatches

When a cast is genuinely unavoidable (FFI, third-party `any`, TypeScript compiler blind spot):

```typescript
// Reason: library types DX as `unknown`; we know it's Widget from the docs.
const widget = result as unknown as Widget;
```

Rules: always `as unknown as T`, always co-located with a one-line comment naming the reason, never the bare `as T` form. If you reach for an escape hatch more than once a month, the underlying type is wrong — fix the type, not the call site.
