# Service AGENT.md

Backend API service using Elysia framework with Bun runtime.

## Commands

```bash
bun run dev              # Start dev server (port 8000)
bun run dev:worker       # Start worker process
bun run build            # Build for production
bun run start            # Start production server
bun run start:worker     # Start production worker
bun run test             # Run tests (bun test, no tests yet)
bun run check-types      # Type check
bun run lint             # Run ESLint
```

## Architecture

The service follows Clean Architecture with four layers: API, Application, Core (domain + infrastructure ports), and Infrastructure (implementations).

### Layer Responsibilities

**API Layer** (`api/`)

- Route modules: Elysia routers with request/response handling
- Plugins: Auth guard, error handler, request context (MongoDB transactions)
- Each module is a `*HttpRouterFactory` class receiving services via constructor

**Application Layer** (`app/`)

- `domain/`: `*BasicCrudService` classes implementing CRUD service ports
- `feature/`: Complex workflow orchestration (e.g., SDLC workflow)
- Services receive repository dependencies via constructor injection

**Core Layer** (`core/`)

- `domain/`: Entity classes + port interfaces (repository & service contracts)
- `feature/`: Feature service port interfaces (auth, email)
- `infra/`: Infrastructure port interfaces (config, logger, durable functions)

**Infrastructure Layer** (`infra/`)

- Concrete implementations of all port interfaces
- MongoDB repositories, Better Auth, Resend, Inngest, Pino

**DI Layer** (`di/`)

- Wires repositories → services → routers
- `shared.ts` creates core singletons (MongoClient, BetterAuth, plugins)
- One file per API module (e.g., `project-api.ts`)

## Key Libraries

- `elysia` - Web framework
- `better-auth` - Authentication with email OTP and organizations
- `mongodb` - MongoDB native driver (v7)
- `zod/v4` - Schema validation (note the `/v4` import)
- `neverthrow` - Result types for error handling (`ok`, `err`, `Result`, `ResultAsync`)
- `inngest` + `@inngest/workflow-kit` - Background jobs and workflow engine
- `resend` - Email service
- `es-toolkit` - Utility functions
- `pino` - Logging
- `@date-fns/utc` - UTC date utilities
