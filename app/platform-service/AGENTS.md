# Service AGENT.md

Backend API service using Elysia framework with Bun runtime.

## Commands

```bash
bun run dev              # Start dev server (port 8000)
bun run build            # Build for production
bun run start            # Start production server
bun run test             # Run tests (bun test, no tests yet)
bun run check-types      # Type check
bun run lint             # Run ESLint
```

## Naming Convention

- **Directories** — use the bare domain name, no namespace prefix: `project/`, `mongo/`, `model/`
- **Files** — prefix every file with its parent directory namespace: `project-model.ts`, `mongo-client.ts`, `model-id.ts`

## Architecture

### Dependency Rule

`index → router → feature → module → vendor / shared`

- `shared` and `vendor` are leaf layers — they do not import from `module`, `feature`, or `router`
- `shared` does not import from `vendor` (and vice versa)
- `module` may import from `module`, `shared`, and `vendor`
- `feature` may import from `feature`, `module`, `shared`, and `vendor`
- `router` may import from `feature`, `module`, `shared`, and `vendor`

### Layer Responsibilities

**Shared Layer** (`shared/`)

- Pure types, constants, and utility functions
- No SDK clients, no business logic, no side effects on import
- Safe to import from any other layer
- Contains: error types/codes, model types/factories, ID generation, tenant type, HTTP envelope

**Vendor Layer** (`vendor/`)

- 3rd-party SDK initialization, client singletons, and thin wrappers
- Each subfolder wraps exactly one external dependency
- Maps vendor-specific errors to the app's Err type
- No business logic, no shared type definitions
- Contains: better-auth, env, mongo, pino, resend

**Module Layer** (`module/`)

- Business logic organized by feature domain
- Each module folder contains: model type, repository instance, service functions, and service tests
- Services use `neverthrow` Result types and receive `{ ctx, payload/id }` inputs
- No HTTP handling, no DTOs, no route definitions
- May import from `module`, `shared`, and `vendor`

**Feature Layer** (`feature/`)

- Cross-module orchestration, background job definitions, and workflow engines
- Each subfolder groups related orchestration logic by domain (e.g. workflow engine, Inngest functions, sync services)
- Composes multiple module services to implement higher-level use cases
- Contains: Inngest function definitions, workflow engine/action definitions, cross-module sync services
- No HTTP handling, no route definitions
- May import from `feature`, `module`, `shared`, and `vendor`

**Router Layer** (`router/`)

- Elysia route handlers and Zod request/response DTOs
- Each subfolder mirrors a module
- Responsible for: request validation, calling module services, mapping Results to HTTP responses
- Never accesses repositories directly — always goes through module services
- May import from `module`, `shared`, and `vendor`

### Export Pattern

- **Multiple related functions** → bundle in a `make*` factory (the only named export); functions stay module-private

  ```ts
  const create = () => {
    /* ... */
  };
  const remove = () => {
    /* ... */
  };
  const makeFooService = () => ({ create, remove });
  export { makeFooService };
  ```

- **Single value** (singleton, schema, class, one function) → `export { name }` directly

  ```ts
  const fooClient = new FooSDK({ apiKey });
  export { fooClient };
  ```
