---
name: conventions-typescript
description: Enforce the strictest TypeScript type system across the monorepo. Triggers on any TypeScript edit, type design question, tsconfig/oxlint change, or review of `.ts`/`.tsx` code. Covers tsconfig flags, discriminated-union shape, generics/inference, anti-patterns (`any`, `enum`, unsafe casts), and Oxlint enforcement.
---

# TypeScript Conventions

> **The One Rule** — _Make illegal states unrepresentable; never escape the type system._

**Type-safe code catches most bugs at compile time.** Every rule here exists to move a class of runtime error into the compiler's job.

Scope: type-safety only. Naming → `conventions-naming`. `interface` vs `type` → out of scope.

| Topic                                                | Reference                                                    |
| ---------------------------------------------------- | ------------------------------------------------------------ |
| `tsconfig` strict flags + Oxlint rules (enforcement) | [references/CONFIG.md](./references/CONFIG.md)               |
| Discriminated unions, narrowing, type guards         | [references/UNIONS.md](./references/UNIONS.md)               |
| Generics, inference, `satisfies`, utility types      | [references/GENERICS.md](./references/GENERICS.md)           |
| Anti-patterns, boundary parsing, escape hatches      | [references/ANTI-PATTERNS.md](./references/ANTI-PATTERNS.md) |
