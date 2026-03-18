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
