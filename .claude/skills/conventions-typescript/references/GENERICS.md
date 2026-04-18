# GENERICS — Generics, Inference, `satisfies`

Good generic code is read, not written. The compiler should infer most types; your job is to set the constraints so inference produces something useful.

## Core rules

| Rule                       | Do                                              | Don't                                |
| -------------------------- | ----------------------------------------------- | ------------------------------------ |
| Prefer inference           | Annotate exported/public API return types only. | Annotate every local.                |
| Constrain every generic    | `T extends X`.                                  | `<T>` unbounded, or `T = any`.       |
| Use `satisfies` over `: T` | Validate without widening.                      | Annotate and lose the literal.       |
| Let call sites drive `<T>` | `parse(input)` — TS deduces `T`.                | `parse<User>(input)` when deducible. |

## Constraints

An unbounded generic (`<T>`) is `unknown` in disguise. Constrain it so the body can actually use the value:

```typescript
const pick = <T extends object, K extends keyof T>(obj: T, key: K): T[K] =>
  obj[key];

// Call site infers both params — no explicit <T, K>.
pick({ id: 1, name: "a" }, "id"); // number
```

Avoid `T = any` defaults — they erase type safety silently. If a generic is optional, default to a concrete type or `never`.

## `satisfies` vs `: T` vs `as T`

```typescript
// : T widens the value — routes.user.path becomes `string`.
const routes: Record<string, { path: string }> = {
  user: { path: "/u/:id" },
};

// satisfies checks conformance, keeps the literal.
const routes = {
  user: { path: "/u/:id" },
} satisfies Record<string, { path: string }>;
// routes.user.path: "/u/:id"

// as T disables the check entirely — do not use. See ANTI-PATTERNS.md.
```

Rule: reach for `satisfies` when a literal object must conform to a type but you need to preserve precise keys/values downstream (config, routes, discriminator maps).

## Deriving types from values

Source of truth is the value. Derive the type:

```typescript
const Status = { Idle: "idle", Ready: "ready" } as const;
type Status = (typeof Status)[keyof typeof Status]; // "idle" | "ready"

const handlers = {
  click: (e: MouseEvent) => {},
  key: (e: KeyboardEvent) => {},
} satisfies Record<string, (e: Event) => void>;
type EventName = keyof typeof handlers; // "click" | "key"
```

This pattern replaces native `enum` (see ANTI-PATTERNS.md) and keeps the value + type in lockstep.

## Utility types

Prefer these standard utilities over hand-rolling equivalents:

| Utility          | Use for                                  |
| ---------------- | ---------------------------------------- |
| `Pick<T, K>`     | Keep a subset of keys.                   |
| `Omit<T, K>`     | Drop a subset of keys.                   |
| `Partial<T>`     | All fields optional (updates, patches).  |
| `Required<T>`    | All fields required (strip optionality). |
| `Readonly<T>`    | Freeze a type at the type level.         |
| `Record<K, V>`   | Keyed map.                               |
| `NonNullable<T>` | Strip `null` / `undefined`.              |
| `ReturnType<F>`  | Type of `F`'s return value.              |
| `Parameters<F>`  | Tuple of `F`'s parameters.               |
| `Awaited<T>`     | Unwrap a `Promise<T>`.                   |

## Function generics — when to annotate return types

- **Exported function**: annotate return type. The signature is API; inference drift breaks callers silently.
- **Local/internal function**: let return type infer.
- **Generic factory returning a narrowed type**: annotate only if inference widens — otherwise let the compiler tell the caller the precise shape.
