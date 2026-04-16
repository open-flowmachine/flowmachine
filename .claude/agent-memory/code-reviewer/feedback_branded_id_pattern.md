---
name: Branded ID Pattern Weakness
description: All branded ID constructors in core-service are unchecked `as` casts; flag any code that constructs a branded ID from untrusted input
type: feedback
---

Every branded ID in `app/core-service/src/domain/**/<aggregate>-id.ts` is built via `(value: string): XId => value as XId`. The brand provides compile-time safety against mixing IDs but **zero runtime validation** — `""`, `"foo"`, a Mongo ObjectId, or a forged value all type as the brand.

**Why:** the team chose a lightweight pattern early; there is no `parseBrandedId` helper in `domain/shared/id.ts`. `noUncheckedIndexedAccess` and strict mode hide this, but the type system is lying.

**How to apply:**
- When reviewing code that constructs a branded ID from HTTP input, env vars, DB rows, webhook payloads, or any `unknown`/`string` from outside, flag it as a type-safety issue and recommend either:
  1. centralizing a `parseBrandedId<TBrand>(input: unknown, name: string): Result<TBrand, DomainError>` validator in `domain/shared/id.ts`, or
  2. parsing through a zod schema that brands the output.
- Inside the domain layer (e.g. one aggregate referencing another's ID after validation already happened), the cast is acceptable.
- Same critique applies to `TenantId` (`domain/shared/tenant.ts`).
