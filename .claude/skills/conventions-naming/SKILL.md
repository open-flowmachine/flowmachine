---
name: conventions-naming
description: Apply when creating or renaming folders, files, variables, functions, classes, types, enum replacements, or constants, or when reviewing casing in a diff. Defines the casing rules for the entire codebase.
---

# Naming Conventions

> For TypeScript type design (illegal states, enum replacement, branded types, escape hatches) → `conventions-typescript`.

| Target                                       | Casing                               | Example                                       |
| -------------------------------------------- | ------------------------------------ | --------------------------------------------- |
| Folder                                       | `kebab-case`                         | `user-profile/`                               |
| File (all, incl. `.ts` / `.tsx`)             | `kebab-case`                         | `user-card.tsx`, `auth-service.ts`            |
| Test file                                    | `kebab-case` + `.test.ts(x)`         | `user-card.test.tsx`                          |
| Variable                                     | `camelCase`                          | `currentUser`                                 |
| Function                                     | `camelCase`                          | `getUserById`                                 |
| Class                                        | `PascalCase`                         | `UserService`                                 |
| Type / Interface                             | `PascalCase`                         | `UserProfile`                                 |
| Enum replacement (see rules)                 | value `camelCase`, type `PascalCase` | `statuses` / `Status`; `httpCodes` / `HttpCode` |
| Module-level constant (primitive, immutable) | `SCREAMING_SNAKE_CASE`               | `MAX_RETRIES`                                 |
| Module-level constant (non-primitive)        | `camelCase`                          | `handlers`, `status`                          |

## Rules

- React component files follow the file rule — `user-card.tsx`, not `UserCard.tsx`.
- Compound file suffixes from `architecture-hexagonal` (`.port.ts`, `.use-case.ts`, `.adapter.ts`) are appended after the kebab-case stem; each dotted segment is its own kebab-case token (`create-user.use-case.ts`, `user-repo.port.ts`).
- Types coverage: branded types, domain events, integration events, and commands are all types → `PascalCase`. Test-file layout (sibling, no `__tests__/`, no `.spec.`) lives in `architecture-hexagonal` → TESTING.md.
- Acronyms in `PascalCase`/`camelCase`: only the first letter is uppercase (`UserId`, `HttpCode`, `parseUrl`, not `UserID`/`HTTPCode`/`parseURL`). Keeps identifiers readable and grep-friendly.
- Native `enum` is banned (see `conventions-typescript`). Replace with an `as const` value + derived union. Value side is `camelCase`; derived type is `PascalCase`.
  - String-literal enum → `as const` **array**: `const statuses = ["idle", "ready"] as const; type Status = (typeof statuses)[number]`.
  - Complex-value enum (numbers, objects, functions, …) → `as const` **object**: `const httpCodes = { ok: 200, notFound: 404 } as const; type HttpCode = (typeof httpCodes)[keyof typeof httpCodes]`.
- Module-level constants: primitives in `SCREAMING_SNAKE_CASE`, non-primitives (objects, arrays, maps) in `camelCase`. In-function `const` locals stay `camelCase`.

## Namespacing

- Namespace via **folders**, not the TypeScript `namespace` keyword.
- Folder path = namespace path; each segment stays `kebab-case` (e.g. `user/profile/avatar.ts` → conceptually `user.profile.avatar`).
- Namespace import aliases: `PascalCase` (treat the module as a container).
  - `import * as UserService from "@/user/service"`
- Barrel re-exports (`index.ts`) keep each symbol's own casing — no renaming on re-export.
