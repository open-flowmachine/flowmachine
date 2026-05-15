# AGENTS.md — pino vendor

Single source of truth for logging in `platform-service`.

## Levels

- `error` — unhandled failures. Logged exactly **once**, at a boundary.
- `warn` — recoverable anomaly (bad input, retry, soft failure).
- `info` — lifecycle events at request/job boundaries ("starting X", "completed X").
- `debug` — verbose diagnostic detail. Off in prod.

## The rule

Modules and vendors stay **silent**. Only routers and features log lifecycle (`info`/`warn`). Errors are logged exactly once at the boundary:

- HTTP — `router-error-handler`
- Inngest — `loggerMiddleware` in `inngest-client.ts`

The logger does not flow into modules. Modules accept `{ ctx, payload | id }` only.

## Child loggers

Use the factories — never call `baseLog.child` ad-hoc:

- `makeHttpLog({ requestId, userId?, tenantId? })` — request scope.
- `makeInngestLog({ runId, eventName, attempt })` — Inngest run scope.

Within a route or feature, narrow further with `log.child({ module, op })`.

## Redaction

The redact list in `pino-log.ts` is the single source of truth. Add new sensitive keys there, not at call sites.

## Required fields

Every log line should carry `module` and `op`, bound via `log.child({ module, op })` at the entrypoint.
