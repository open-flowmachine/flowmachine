# Logging Pattern — Implementation Plan

Scope: `app/platform-service/src`. Goal: predictable, single-source logging.

## Guiding rules (recap)

- Logger lives in `vendor/pino/`, accessed via a logger bound at the request/job boundary.
- **Routers and features log lifecycle (`info`/`warn`); modules and vendors stay silent.**
- Errors are logged exactly once — at the HTTP boundary (`router-error-handler`) or the Inngest boundary middleware.
- Pino is configured with JSON in prod, `pino-pretty` in dev, `silent` in test; redaction is centralized in vendor config.
- Modules continue to accept only `{ ctx: TenantAware, payload | id }`. The logger does **not** flow into modules — it would only invite policy violations.

## Step 1 — Harden the vendor

**File:** `src/vendor/pino/pino-log.ts` (rewrite)

- Configure level by `NODE_ENV` (`silent` test, `debug` dev, `info` prod).
- `base: { service: "platform-service" }`.
- `redact.paths`: `password`, `token`, `apiKey`, `secret`, `authorization`, `cookie`, `credential`, `credentials.*`, plus `req.headers.authorization|cookie`.
- `transport: pino-pretty` only when `!isProd && !isTest`.
- Keep `baseLog` as the single export.

**Add devDependency:** `pino-pretty` (catalog).

## Step 2 — Two child-logger factories

**New file:** `src/vendor/pino/pino-log-http.ts`

```ts
const makeHttpLog = (input: {
  requestId: string;
  userId?: string;
  tenantId?: string;
}) => baseLog.child({ kind: "http", ...input });
export { makeHttpLog };
```

**New file:** `src/vendor/pino/pino-log-inngest.ts`

```ts
const makeInngestLog = (input: {
  runId: string;
  eventName: string;
  attempt: number;
}) => baseLog.child({ kind: "inngest", ...input });
export { makeInngestLog };
```

Both export only named functions following the `make*` factory convention.

## Step 3 — Elysia logger plugin (HTTP boundary)

**New file:** `src/router/router-logger.ts`

A small Elysia plugin with `.derive` (request scope) that:

1. Reads/creates `requestId` from `x-request-id` header (uuidv7 fallback).
2. Reads `userId` / `tenantId` from `router-auth-guard` if present (already on Elysia store after auth).
3. Builds `const log = makeHttpLog({ requestId, userId, tenantId })`.
4. Exposes both `log` (request-scoped) and a `bindModuleLog(module, op)` helper used by route handlers.
5. Sets `set.headers["x-request-id"]` for client correlation.

Wire it into `src/index.ts` before any feature router so handlers see `log` on context.

## Step 4 — Update `router-error-handler`

**File:** `src/router/router-error-handler.ts`

- Pull `log` off Elysia context (from Step 3) and fall back to `baseLog.child({ module })` if missing (e.g., error before derive ran).
- Switch `log.error({ error })` → `log.error({ err: error, path: new URL(request.url).pathname }, "request failed")` so pino's `err` serializer activates.
- No behavior change to the error envelope.

## Step 5 — Inngest boundary middleware

**File:** `src/vendor/inngest/inngest-client.ts`

Attach an Inngest middleware that:

1. On `onFunctionRun`, builds `log = makeInngestLog({ runId: ctx.runId, eventName: ctx.event.name, attempt: ctx.attempt })`.
2. Injects `log` into the function context (`ctx.log` via `transformInput`).
3. `onFunctionRun.transformOutput` (or `afterExecution`): if the handler threw or returned an `Err`, log once at `error`. This is the **single** error-log site for background work.

Lifecycle `info` logs ("starting", "completed") happen inside each feature function using `ctx.log`.

## Step 6 — Replace the three `console.*` calls

| File | Change |
| --- | --- |
| `src/feature/workflow/workflow-function.ts:40` | `console.error("Invalid event data:", validationResult.error)` → `ctx.log.warn({ err: validationResult.error }, "invalid event data")` then `return`. |
| `src/feature/workflow/workflow-function.ts:94` | `console.log("Starting workflow execution with input:", input)` → `ctx.log.info({ workflowDefinitionId, aiAgentId }, "starting workflow execution")` (scalar IDs only — no full input). |
| `src/feature/workflow/workflow-action-definition.ts:9` | Action handler receives Inngest input; use the middleware-injected logger: `input.ctx.log.info({ kind: "code-review-request" }, "executing action")`. |

## Step 7 — Lint enforcement

**File:** `app/platform-service/oxlint.config.ts` (or root if applicable)

- Enable `no-console` for `src/**`, with an exception scoped to `src/vendor/pino/**` only.
- Add a CI check to fail on raw `console.` introductions.

## Step 8 — Document the pattern

**New file:** `src/vendor/pino/AGENTS.md` — short doc covering:

- Allowed log levels and what each is for.
- The "modules silent, boundary logs errors" rule.
- The redact list as source of truth (add new sensitive keys here, not at call sites).
- Required fields per log line (`module`, `op`) and how they are bound via child loggers.

Add a short "Logging" section to `app/platform-service/AGENTS.md` pointing to the above.

## Step 9 — Migrate two reference call sites

Pick two well-trafficked routers to demonstrate the pattern for reviewers:

- `src/router/project/v1/router-project-v1.ts` — wrap each handler with `const log = ctx.log.child({ module: "project-v1-router", op: "create" })` and add `info` lifecycle logs.
- `src/feature/workflow/workflow-function.ts` — same treatment so the Inngest path has a worked example.

No other routers/features migrate in this PR; teams adopt incrementally.

## Step 10 — Verification

```bash
bun run lint        # no-console blocks new violations
bun run fmt:check
bun run test
bun run build
```

Manual:

- `curl -i http://localhost:8000/health` returns `x-request-id` header.
- A forced 500 produces exactly one JSON `error`-level line containing `err.stack`, `requestId`, `path`.
- An Inngest run prints `info` start/finish + at most one `error` on failure, all carrying `runId`/`eventName`.

## Out of scope (follow-ups)

- Shipping logs to a platform (Loki/Datadog) — pattern is platform-agnostic; transport added later.
- Sampling for high-volume endpoints.
- Request body logging at `debug` level (would require an explicit allowlist).
