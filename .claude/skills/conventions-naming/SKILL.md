---
name: conventions-naming
description: Apply when creating or renaming folders, files, variables, functions, classes, types, enums, or constants. Defines the casing rules for the entire codebase.
---

# Naming Conventions

> For TypeScript type design (illegal states, enum replacement, branded types, escape hatches) → `conventions-typescript`.

| Target                                       | Casing                       | Example                            |
| -------------------------------------------- | ---------------------------- | ---------------------------------- |
| Folder                                       | `kebab-case`                 | `user-profile/`                    |
| File (all, incl. `.ts` / `.tsx`)             | `kebab-case`                 | `user-card.tsx`, `auth-service.ts` |
| Variable                                     | `camelCase`                  | `currentUser`                      |
| Function                                     | `camelCase`                  | `getUserById`                      |
| Class                                        | `PascalCase`                 | `UserService`                      |
| Type / Interface                             | `PascalCase`                 | `UserProfile`                      |
| `as const` array (string-literal enum)       | `camelCase`                  | `statuses`, `["idle", "ready"]`    |
| `as const` object (complex-value enum)       | `camelCase` object + members | `httpCodes.ok`, `roles.admin`      |
| Derived union type (paired with the value)   | `PascalCase`                 | `type Status = …`                  |
| Module-level constant (primitive, immutable) | `SCREAMING_SNAKE_CASE`       | `MAX_RETRIES`                      |
| Module-level constant (non-primitive)        | `camelCase`                  | `handlers`, `status`               |

## Rules

- Files and folders: `kebab-case`, always. React components included (`user-card.tsx`, not `UserCard.tsx`).
- Variables and functions: `camelCase`.
- Classes, types, and interfaces: `PascalCase`.
- Native `enum` is banned (see `conventions-typescript`). Replace with an `as const` value + derived union. Value side is `camelCase`; derived type is `PascalCase`.
  - String-literal enum → `as const` **array**: `const statuses = ["idle", "ready"] as const; type Status = (typeof statuses)[number]`.
  - Complex-value enum (numbers, objects, functions, …) → `as const` **object**: `const httpCodes = { ok: 200, notFound: 404 } as const; type HttpCode = (typeof httpCodes)[keyof typeof httpCodes]`.
- Module-level primitive constants: `SCREAMING_SNAKE_CASE`. Non-primitive module-level constants (objects, arrays, maps): `camelCase`. In-function `const` locals stay `camelCase`.

## Namespacing

- Namespace via **folders**, not the TypeScript `namespace` keyword.
- Folder path = namespace path; each segment stays `kebab-case` (e.g. `user/profile/avatar.ts` → conceptually `user.profile.avatar`).
- Namespace import aliases: `PascalCase` (treat the module as a container).
  - `import * as UserService from "@/user/service"`
- Barrel re-exports (`index.ts`) keep each symbol's own casing — no renaming on re-export.
