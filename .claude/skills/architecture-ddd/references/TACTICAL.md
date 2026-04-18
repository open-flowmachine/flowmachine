# TACTICAL — Building Blocks of the Domain Model

The vocabulary for what lives inside a bounded context's `domain/` folder. Each pattern is a tool with a narrow purpose — reach for the smallest one that fits.

> Type machinery (branded types, `Result<T, E>`, discriminated unions) → `conventions-typescript`. Folder placement → `architecture-hexagonal`. Class-vs-function split for these patterns → `HYBRID.md`.

## Value Object

Immutable, equality by value, no identity. Models a concept whose instances are interchangeable when their attributes match (`Email`, `Money`, `DateRange`).

- Branded type + smart constructor returning `Result<T, ValidationError>` — see `conventions-typescript` → `references/ANTI-PATTERNS.md` _Branded types_.
- Mutating "operations" return a **new** value object (`money.add(other) → Money`).
- No `id`. Two `Email`s with the same string are the same email.

```typescript
import { Result, ok, err } from "neverthrow";

type Email = string & { readonly __brand: "Email" };
type EmailError = "invalid_format";

const makeEmail = (raw: string): Result<Email, EmailError> =>
  /^[^@\s]+@[^@\s]+$/.test(raw) ? ok(raw as Email) : err("invalid_format");
```

**Reject:** value objects with `id`, with setters, or that throw instead of returning `Result`.

## Entity

Identity-bearing. Equality by `id`, not by attribute values. Lifecycle: created, mutated, eventually removed.

- Identity is itself a branded value object (`UserId`, `OrderId`) — never a bare `string`.
- An entity that is not the aggregate root is owned by one and reached only through it.

**Reject:** entities compared by structural equality, or shared between aggregates.

## Aggregate + Aggregate Root

A cluster of entities and value objects treated as one consistency boundary. The **root** is the only entity referenced from outside the aggregate.

- One transaction = one aggregate. Cross-aggregate updates go through domain events.
- Keep aggregates **small**. Two related aggregates with eventual consistency beat one huge aggregate with contention.
- Outside code holds only the root's `id`, never a reference to an inner entity.
- All invariants of the cluster are enforced by the root before state changes.

**Reject:** aggregates that load other aggregates by reference, transactions spanning two roots, or "god" aggregates that own most of the schema.

## Domain Event

A past-tense fact about something that happened in the domain. Immutable. Emitted by an aggregate, consumed by other aggregates, projections, or outbound adapters.

- Naming: past tense, in the ubiquitous language (`UserRegistered`, `OrderPlaced`, `InvoiceSettled`). Never `…Requested` or `…Command` — those are inputs, not events.
- Shape: discriminated union per aggregate — see `conventions-typescript` → `references/UNIONS.md`.
- Carry only what consumers need to react. Not the whole aggregate state.
- Emitted from pure behavior; published by the use case after the transaction commits.

```typescript
type BaseUserEvent = {
  type: "userRegistered" | "emailChanged";
  userId: UserId;
};
type UserRegistered = BaseUserEvent & { type: "userRegistered"; email: Email };
type EmailChanged = BaseUserEvent & { type: "emailChanged"; email: Email };
type UserEvent = UserRegistered | EmailChanged;
```

**Reject:** present-tense names, mutable event payloads, events that carry the full aggregate snapshot.

## Repository

A collection-like interface for **one aggregate type**. Looks like an in-memory collection from the domain's point of view; the implementation hides persistence.

- Lives as an outbound port; the adapter is in infra — see `architecture-hexagonal`.
- Methods read like a collection: `add`, `findById`, `remove`. No `update` (mutate the aggregate, then `add` / save).
- One repository per aggregate root. Never per entity, never per "screen."
- No query-builder leakage. Domain code never composes SQL/Mongo queries.

```typescript
type UserRepoPort = {
  readonly findById: (id: UserId) => Promise<Result<User, "not_found">>;
  readonly add: (user: User) => Promise<Result<void, "conflict">>;
  readonly remove: (id: UserId) => Promise<Result<void, "not_found">>;
};
```

**Reject:** repositories returning DTOs, repositories with `findByEmailAndStatusAndCreatedAfter`-style query soup, repositories that span multiple aggregate types.

## Domain Service

A pure function that expresses domain behavior involving **multiple aggregates** when the behavior naturally belongs to none of them.

- Stateless. No fields, no `this`. A function, not a class.
- Reach for it only after honestly trying to put the behavior on an aggregate.
- Lives in `domain/`, takes aggregates / value objects in, returns `Result` and events out.

**Reject:** "domain services" that wrap a single aggregate's method, or that hold state, or that touch infra.

## Factory

Encapsulates non-trivial construction of an aggregate or complex value object. Returns `Result<Aggregate, DomainError>`.

- Default location: `static create(...)` on the aggregate class — see `HYBRID.md`.
- Use a standalone factory function only when construction needs collaborators (other aggregates, policies) that don't belong on the aggregate.

**Reject:** `new Aggregate(...)` called from outside the aggregate's own file. Construction without validation.

## Specification

A named, reusable predicate over a domain object (`isEligibleForRefund`, `isOverdue`).

- Optional pattern. Use only when the predicate is **reused** or **composed** (`and`, `or`, `not`).
- A one-off boolean check stays inline on the aggregate method.
- Pure function; never holds state.

**Reject:** specifications that perform side effects, or one-off specifications used in a single place.

## Anti-pattern: the anemic model

Data classes with public getters/setters + a separate "service layer" containing the actual rules is **not DDD**, regardless of folder names. Behavior must live with the state it protects.

If your aggregate exposes the same fields its callers mutate, the invariants are not in the model — they are scattered across every caller, and every new caller is a new bug.
