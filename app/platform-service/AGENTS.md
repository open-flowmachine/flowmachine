# AGENTS.md — Platform Service

Elysia API on port 8000. Read the [root AGENTS.md](../../AGENTS.md) first.

## Commands

```bash
bun run dev              # Start (bun --watch, port 8000)
bun run build            # Production build (bun build)
bun run start            # Start production
bun run fmt              # Format (oxfmt)
bun run fmt:check        # Check formatting (oxfmt)
bun run lint             # oxlint (node plugin)
bun run test             # bun test (env mock via bunfig.toml)
```

## Dependency rule

```
index → router → feature → module → vendor / shared
```

| Layer   | Directory      | May import from                 | Responsibility                                                                                                                                      |
| ------- | -------------- | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| shared  | `src/shared/`  | —                               | Pure types, constants, utilities. No SDK, no side effects.                                                                                          |
| vendor  | `src/vendor/`  | —                               | Thin wrappers around one external dep each. Maps errors to `Err` type.                                                                              |
| module  | `src/module/`  | module, shared, vendor          | Domain logic. model + repository + service + service.test per entity. Services return `neverthrow` Results, receive `{ ctx, payload/id }`. No HTTP. |
| feature | `src/feature/` | feature, module, shared, vendor | Cross-module orchestration, Inngest functions, workflow engine.                                                                                     |
| router  | `src/router/`  | feature, module, shared, vendor | Elysia handlers + Zod DTOs. Never touches repositories directly. Routes versioned (`*/v1/`) except auth, health, inngest.                           |

## Conventions

- **Naming**: dirs use bare domain name (`project/`), files prefix with parent dir (`project-model.ts`).
- **Exports**: multiple functions → `make*` factory (only named export). Single value → export directly.

```ts
// Multiple
const create = () => {
  /* ... */
};
const makeFooService = () => ({ create });
export { makeFooService };

// Single
const fooClient = new FooSDK({ apiKey });
export { fooClient };
```
