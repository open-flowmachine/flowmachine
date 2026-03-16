# AGENT.md

This file provides guidance to AI agent when working with code in this repository.

## Project Overview

Flow Machine is an AI Software Engineer platform. This is a Turborepo monorepo with two main applications and shared packages, built with Bun runtime.

## Development Commands

```bash
# Install dependencies
bun install

# Run all apps in development mode
bun run dev

# Type checking
bun run check-types

# Linting and formatting
bun run lint
bun run format

# Testing (no tests exist yet; service uses bun test, web has no test runner)
bun run test

# Start MongoDB and Inngest (required for local development)
docker compose up -d

# Run command on a specific app (use --filter from project root)
bun run check-types --filter ./app/service
bun run lint --filter ./app/web

# Run command on all apps
bun run check-types --filter "./app/*"
```

## Monorepo Structure

- `app/service` - Elysia backend API (port 8000). See [app/service/AGENT.md](app/service/AGENT.md)
- `app/web` - Next.js frontend (port 3000). See [app/web/AGENT.md](app/web/AGENT.md)
- `package/eslint-config` - Shared ESLint configuration (base + Next.js)
- `package/typescript-config` - Shared TypeScript configuration (base + Next.js + react-library)

## Import Aliases

Both apps use `@/` as the import alias for their `src/` directory.

## Environment Variables

All environment variables must be defined in `turbo.json` globalEnv:

**Application:**

- `APP_ENV` - Environment (production/staging)
- `APP_VERSION` - Version string

**Authentication (Better Auth):**

- `BETTER_AUTH_SECRET` - Secret for JWT signing
- `BETTER_AUTH_URL` - Backend URL (http://localhost:8000)
- `BETTER_AUTH_TRUSTED_ORIGINS` - Comma-separated trusted origins

**Database (MongoDB):**

- `DATABASE_URL` - MongoDB connection string
- `DATABASE_NAME` - Database name

**Third-party Services:**

- `AUTUMN_SECRET_KEY` - Autumn billing secret key
- `DAYTONA_API_KEY` - Daytona SDK key
- `INNGEST_DEV`, `INNGEST_BASE_URL` - Inngest configuration
- `INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY` - Inngest auth keys
- `RESEND_API_KEY`, `EMAIL_FROM_ADDRESS` - Email service

## Code Style

- Import order: third-party modules, then `@/` aliases, then relative imports (enforced by `@trivago/prettier-plugin-sort-imports`)
- Tailwind class sorting via `prettier-plugin-tailwindcss`
- Use `es-toolkit` for utility functions
- Use `zod` (v4) for schema validation (imported as `zod/v4`)
- Use `neverthrow` for Result types in error handling
- ESLint with `eslint-plugin-turbo` for undeclared env var warnings
- Strict TypeScript with `noUncheckedIndexedAccess`

## Authentication

Uses **Better Auth** with:

- Email OTP authentication (passwordless, no password-based auth)
- Organization management for multi-tenancy
- Cookie-based sessions (HttpOnly, cross-origin supported)
- UUIDv7 for ID generation

## Database

Uses **MongoDB 8** (Docker) with native driver v7 (not Mongoose). Local development runs via Docker Compose (port 27017).

## CI/CD

GitHub Actions workflow (`.github/workflows/ci.yml`):

- **build_artifact** - Builds web and service apps on every push
- **build_image** - Creates Docker images on tags and main branch
- **upload_image** - Pushes to Amazon ECR

No test step in CI/CD. No pre-commit hooks (Husky/lint-staged not configured).

## Key Technologies

- **Runtime:** Bun 1.3.5
- **Build:** Turborepo 2.7.2
- **Backend:** Elysia 1.4.x
- **Frontend:** Next.js 16, React 19
- **Styling:** Tailwind CSS v4, shadcn/ui
- **Auth:** Better Auth 1.4.x
- **Background Jobs:** Inngest 3.x + @inngest/workflow-kit
- **Email:** Resend
- **Logging:** Pino
