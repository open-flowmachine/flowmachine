---
name: conventions-naming
description: Apply when creating or renaming folders, files, variables, functions, classes, types, enum replacements, or constants, or when reviewing casing in a diff. Defines the casing rules for the entire codebase.
---

# Naming Conventions

> TypeScript type design (illegal states, branded types, escape hatches) → `conventions-typescript`. Test-file layout (sibling, no `__tests__/`, no `.spec.`).

| Target                                    | Casing                                           | Example                          |
| ----------------------------------------- | ------------------------------------------------ | -------------------------------- |
| Folder / file (incl. `.ts` / `.tsx`)      | `kebab-case`                                     | `user-profile/`, `user-card.tsx` |
| Test file                                 | `kebab-case.test.ts(x)`                          | `user-card.test.tsx`             |
| Variable / function                       | `camelCase`                                      | `currentUser`, `getUserById`     |
| Boolean (variable / field / function)     | `camelCase` with `is` / `has` / `should` / `can` | `isVerified`, `hasAccess`        |
| Class / type / interface                  | `PascalCase`                                     | `UserService`, `UserProfile`     |
| Generic type parameter                    | `PascalCase`, `T`-prefixed when named            | `T`, `TEntity`                   |
| Enum replacement                          | value `camelCase` **plural**, type `PascalCase`  | `statuses` / `Status`            |
| Module-level const (primitive, immutable) | `SCREAMING_SNAKE_CASE`                           | `MAX_RETRIES`                    |
| Module-level const (non-primitive)        | `camelCase`                                      | `eventHandlers`, `defaultConfig` |
| Environment variable                      | `SCREAMING_SNAKE_CASE`                           | `STRIPE_WEBHOOK_SECRET`          |

## Rules

- Acronyms — only the first letter is uppercase: `parseUrl`, `UserId`, `HttpCode`. Not `parseURL` / `UserID` / `HTTPCode`. Keeps identifiers grep-friendly.
- Native `enum` is banned (→ `conventions-typescript`). Replace with `as const` + derived union; value **plural** (a collection), type **singular** (one member):
  - String-literal → array: `const statuses = ["idle", "ready"] as const; type Status = (typeof statuses)[number]`
  - Complex values → object: `const httpCodes = { ok: 200, notFound: 404 } as const; type HttpCode = (typeof httpCodes)[keyof typeof httpCodes]`
- In-function `const` stays `camelCase` — `SCREAMING_SNAKE_CASE` is module-level primitives only.
- Booleans take a predicate prefix so call sites self-document: `if (user.isVerified)`, not `if (user.verified)`.
- Event handlers split by role: the **prop** is `on*` (`onSubmit`), the **implementation** is `handle*` (`handleSubmit`). Keeps prop-vs-handler grep-distinguishable.
- Don't abbreviate beyond well-known short forms (`id`, `url`, `db`, `ctx`, `req`, `res`, `props`, `ref`). Loop indices and lambda args (`i`, `x`) are exempt.

## Namespacing

- Namespace via **folders**, not the TS `namespace` keyword. Folder path = namespace (`user/profile/avatar.ts`).
- Wildcard import alias is `PascalCase` — `import * as UserService from "@/user/service"`.
- Barrel `index.ts` re-exports preserve each symbol's casing — no renaming on re-export.
