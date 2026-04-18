# STRATEGIC — Bounded Contexts, Subdomains, Context Maps

Strategic DDD decides _where the seams are_ before tactical DDD decides _what's inside_. Get the seams wrong and no amount of clean aggregates will save the design.

## Ubiquitous language

A shared vocabulary between engineers and domain experts, agreed inside a single bounded context.

- Every identifier in `domain/` (types, methods, events, value objects) must come from this vocabulary. No translation layer between expert speech and code.
- Update the language when the domain changes. Renames in code follow renames in conversation, not the other way around.
- Cross-context translation is the job of an Anti-Corruption Layer (see Context maps), not of an engineer's head.

## Subdomain classification

Drives investment level. Decide once per subdomain, revisit rarely.

| Subdomain    | Definition                                        | Investment                                         |
| ------------ | ------------------------------------------------- | -------------------------------------------------- |
| `core`       | Competitive advantage; reason the product exists. | Hand-modeled, full DDD treatment, best engineers.  |
| `supporting` | Necessary, not differentiating; custom but thin.  | Pragmatic implementation, fewer tactical patterns. |
| `generic`    | Solved problem; off-the-shelf or vendor.          | Buy/integrate. Wrap behind an ACL if it leaks.     |

If you cannot name a subdomain's classification, you don't yet understand the domain.

## Bounded context

The scope inside which one model and one ubiquitous language are consistent.

- **One model per context.** The same noun (`User`, `Order`, `Document`) can — and often should — exist as different types in different contexts.
- **One bounded context ≈ one feature folder** in the hexagonal layout. Two contexts in one folder is a smell; one context spread across folders is a worse smell.
- **Public surface is `port/inbound/` + public `domain/` types.** Nothing else is importable from another context — see `architecture-hexagonal` for the layering and review rules.
- **Context boundary = transaction boundary.** A use case spans one bounded context. Cross-context coordination uses **integration events published via the outbox pattern**, not shared transactions (see _Integration events & outbox_ below).

## Context map relationships

How two bounded contexts relate when they must integrate. Pick one consciously per integration.

| Relationship              | One-line definition                                                                                                 |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Shared Kernel             | Two contexts share a small, jointly-owned subset of the model. Use rarely; high coordination cost.                  |
| Customer / Supplier       | Downstream context's needs influence upstream's roadmap. Formal upstream/downstream priority.                       |
| Conformist                | Downstream adopts upstream's model verbatim. Cheapest; only when upstream's model fits.                             |
| **Anti-Corruption Layer** | Downstream translates upstream's model at the boundary into its own language. **Default for inbound integrations.** |
| Open Host Service         | Upstream publishes a stable protocol for many downstreams.                                                          |
| Published Language        | A formal, versioned shared schema (e.g. event schema, public DTO).                                                  |
| Separate Ways             | Don't integrate. Cheaper than a bad integration.                                                                    |

Default to **ACL** when consuming any external or upstream model — it keeps the inbound shape from polluting the local ubiquitous language. Default to **outbox + integration events** when publishing across a context boundary (see next section).

## Integration events & outbox

How cross-context communication actually happens. **Default mechanism: the outbox pattern emitting integration events.** No other mechanism unless justified in writing.

> **Wiring** (`EventBusPort`, relay adapter, subscriber adapter, composition root injection) lives in `architecture-hexagonal` → `references/DI.md`. This section covers only the policy.

- **Domain event vs integration event.**
  - _Domain event_ — internal to a context. Rich, free to evolve, consumed by the same context's use cases or projections. Never leaves the context.
  - _Integration event_ — crosses a context boundary. Part of the **Published Language**: versioned, stable, minimal payload, named in the publishing context's ubiquitous language. Breaking its schema is a breaking change for every subscriber.
- **Outbox pattern.** In the **same transaction** that commits the aggregate state change, append the integration event(s) to an `outbox` collection. A separate relay reads the outbox and publishes to the bus. This is the only way to make "state changed ↔ event published" atomic without distributed transactions.
- **At-least-once, not exactly-once.** Consumers must be idempotent (dedupe by event id). Assume duplicates and out-of-order delivery when designing subscribers.
- **Never publish from inside the domain.** The aggregate returns events in its `{ state, events }` result; the use case decides which are domain-internal and which promote to integration events, then writes the integration events to the outbox alongside the state change.
- **Inbound side = ACL.** Subscribers translate the foreign integration event into the local ubiquitous language at the boundary before invoking a use case. Never let a foreign event shape reach `domain/`.
- **When not to use it.** Synchronous request/reply across contexts is acceptable only for read queries where stale reads are unacceptable; even then, prefer a local projection fed by integration events. Never use shared DB writes.

## Anti-patterns

- **Leaking another context's model across the public surface.** Re-exporting a foreign aggregate or DTO from your context's `port/inbound/` or `domain/` welds two contexts together.
- **One giant context covering multiple subdomains.** "User-and-billing-and-notifications" is three contexts wearing a trench coat.
- **Technical-named contexts.** `utils`, `shared-business`, `common-domain` — none of these names exist in the ubiquitous language, so none of them are bounded contexts.
- **Translating in your head.** If a method takes an upstream type, you're missing an ACL.
