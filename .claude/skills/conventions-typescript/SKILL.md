---
name: conventions-typescript
description: Enforce the strictest TypeScript type system across the monorepo. Use whenever editing `.ts`/`.tsx`, designing types/discriminated unions, writing `zod` schemas or `neverthrow` Results, using `satisfies` or branded types, reviewing TS diffs, or touching `tsconfig`/`oxlint.config.ts`. Covers strict flags, discriminated-union shape, generics + `satisfies`, branded types, and banned patterns (`any`, native `enum`, `as T`, `x!`).
---

# TypeScript Conventions

> **The One Rule** — _Make illegal states unrepresentable; never escape the type system._

Every rule here exists to move a class of runtime error into the compiler's job.

Scope: type-safety only. Naming → `conventions-naming`. Prefer `type` throughout; reserve `interface` for declaration merging.

| Topic                                                | Reference                                                    |
| ---------------------------------------------------- | ------------------------------------------------------------ |
| `tsconfig` strict flags + Oxlint rules (enforcement) | [references/CONFIG.md](./references/CONFIG.md)               |
| Discriminated unions, narrowing, type guards         | [references/UNIONS.md](./references/UNIONS.md)               |
| Generics, inference, `satisfies`, utility types      | [references/GENERICS.md](./references/GENERICS.md)           |
| Anti-patterns, boundary parsing, escape hatches      | [references/ANTI-PATTERNS.md](./references/ANTI-PATTERNS.md) |
