---
name: conventions-naming
description: Apply when creating or renaming folders, files, variables, functions, classes, types, enums, or constants. Defines the casing rules for the entire codebase.
---

# Naming Conventions

| Target                                       | Casing                 | Example                            |
| -------------------------------------------- | ---------------------- | ---------------------------------- |
| Folder                                       | `kebab-case`           | `user-profile/`                    |
| File (all, incl. `.ts` / `.tsx`)             | `kebab-case`           | `user-card.tsx`, `auth-service.ts` |
| Variable                                     | `camelCase`            | `currentUser`                      |
| Function                                     | `camelCase`            | `getUserById`                      |
| Class                                        | `PascalCase`           | `UserService`                      |
| Type / Interface                             | `PascalCase`           | `UserProfile`                      |
| Enum (type + members)                        | `PascalCase`           | `OrderStatus.Pending`              |
| Module-level constant (primitive, immutable) | `SCREAMING_SNAKE_CASE` | `MAX_RETRIES`                      |

## Rules

- Files and folders: `kebab-case`, always. React components included (`user-card.tsx`, not `UserCard.tsx`).
- Variables and functions: `camelCase`.
- Classes, types, interfaces, enums (and enum members): `PascalCase`.
- Module-level primitive constants: `SCREAMING_SNAKE_CASE`. In-function `const` locals stay `camelCase`.

## Namespacing

- Namespace via **folders**, not the TypeScript `namespace` keyword.
- Folder path = namespace path; each segment stays `kebab-case` (e.g. `user/profile/avatar.ts` → conceptually `user.profile.avatar`).
- Namespace import aliases: `PascalCase` (treat the module as a container).
  - `import * as UserService from "@/user/service"`
- Barrel re-exports (`index.ts`) keep each symbol's own casing — no renaming on re-export.
