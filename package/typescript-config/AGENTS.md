# AGENTS.md — TypeScript Config

Shared TypeScript configurations extended by all apps and packages. Read the [root AGENTS.md](../../AGENTS.md) first.

## Configs

| File                 | Extends | For                                                                            |
| -------------------- | ------- | ------------------------------------------------------------------------------ |
| `base.json`          | —       | Foundation. Strict, `bundler` resolution, `noUncheckedIndexedAccess`, no emit. |
| `app-bun.json`       | base    | Bun apps (platform-service).                                                   |
| `app-nextjs.json`    | base    | Next.js apps (platform-web). Adds `jsx: preserve`, Next plugin, `allowJs`.     |
| `library-bun.json`   | base    | Bun packages.                                                                  |
| `library-react.json` | base    | React packages. Adds `jsx: react-jsx`.                                         |

## When modifying

- Add new options to `base.json` only if they apply to **every** consumer.
- App-specific overrides go in the app's own `tsconfig.json`, not here.
- Never relax strictness in `base.json`. If an app needs looser rules, override in its local `tsconfig.json`.
