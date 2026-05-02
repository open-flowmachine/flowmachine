# AGENTS.md

Flow Machine — AI Software Engineer platform. Turborepo monorepo, Bun only.

## Commands

```bash
bun install
docker compose up -d          # MongoDB + Inngest
bun run dev                   # All apps
bun run lint                  # oxlint
bun run fmt                  # Format (oxfmt)
bun run fmt:check            # Check formatting (oxfmt)
bun run test                  # turbo run test
bun run build
```

Filter: `bun run <cmd> --filter ./app/platform-{service,web}`

## Where things live

```
app/platform-service/    → Elysia API (port 8000)
app/platform-web/        → Next.js 16 (port 3000)
package/typescript-config/ → Shared TS config
```

Architecture details live in each app's own `AGENTS.md`.

## Conventions

- `bun` only — never npm, yarn, pnpm
- `es-toolkit` for utilities, not lodash
- `zod/v4` for schemas
- `uuidv7` for IDs
- oxfmt formats, oxlint lints — no prettier or eslint
- Strict TS, refer to `@package/typescript-config/base.json`
- Env vars must be declared in `turbo.json` → `globalEnv`
- Imports: third-party → `@/` → relative

## Boundaries

Never: commit `.env`, skip lint before commit, put framework code in `package/`, delete files to fix errors, force push.

## Done when

1. `bun run lint` exits 0
2. `bun run fmt:check` exits 0
3. `bun run test` exits 0
4. `bun run build` exits 0

## Stuck?

After 3 failed fix attempts: stop, paste the full error output, and ask.
Never weaken or delete a test to make it pass.
