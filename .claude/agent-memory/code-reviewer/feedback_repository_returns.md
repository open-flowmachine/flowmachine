---
name: Repository return type convention
description: Driven repository ports return Result<T, DomainError>, not Result<T, ApplicationError>; this is intentional and translated at the use-case boundary
type: feedback
---

In `app/core-service`, repository ports return `Promise<Result<T, DomainError>>` even though they live in `application/` (currently `domain/<aggregate>/<aggregate>-repository.ts`).

**Why:** The team chose to keep repository errors as `DomainError` (with category) so persistence-failure / not-found semantics survive across the boundary; use cases call `mapDomainError()` to convert to `ApplicationError`. This is documented in `app/core-service/AGENTS.md` "Error Layering" section.

**How to apply:** Don't flag this as a layering violation. Repository interfaces leaking `DomainError` is acceptable here. Only flag if a repository starts returning concrete Mongo types (Document, ObjectId) or persistence-library exceptions.
