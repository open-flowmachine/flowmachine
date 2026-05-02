# AGENTS.md — Platform Web

Next.js 16 + React 19 on port 3000 (App Router). Read the [root AGENTS.md](../../AGENTS.md) first.

## Commands

```bash
bun run dev              # Start (next dev, port 3000)
bun run build            # Production build (next build)
bun run start            # Start production
bun run fmt              # Format (oxfmt)
bun run fmt:check        # Check formatting (oxfmt)
bun run lint             # oxlint (nextjs plugin)
bun run test             # vitest
bun run test:watch       # vitest in watch mode
bun run shadcn:add       # Install shadcn/ui components
```

Tests: [Vitest](https://vitest.dev) + jsdom + `@testing-library/react` + [MSW](https://mswjs.io). Helpers in `src/test/`.

## Dependency rule

```
app → feature → module → hook / lib
         └──→ component → hook / lib
```

| Layer     | Directory        | May import from                       | Responsibility                                                                                           |
| --------- | ---------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| lib       | `src/lib/`       | —                                     | Pure types, schemas, client singletons. No React, no side effects.                                       |
| hook      | `src/hook/`      | —                                     | Reusable hooks. No imports from other app layers.                                                        |
| component | `src/component/` | component, hook, lib                  | Reusable UI. `ui/` = shadcn (base-nova, RSC, Lucide), `extended-ui/` = composites, `platform/` = layout. |
| module    | `src/module/`    | module, hook, lib                     | Domain logic per entity: types + HTTP client + display service + React Query hooks.                      |
| feature   | `src/feature/`   | feature, module, component, hook, lib | Pages, forms, tables. Three patterns: `*-table/`, `new-*/`, `editable-*-details/`.                       |
| app       | `src/app/`       | feature, component                    | Thin App Router pages. `/platform/{entity}` routes. Auth via `@daveyplate/better-auth-ui`.               |

## Conventions

- **Naming**: dirs = bare domain, files = parent-dir prefix (`credential-type.ts`). Hooks: `use-` prefix. Feature dirs: kebab-case (`new-credential/`).
- **Exports**: multiple → `make*` factory. Single → export directly.
- **Forms**: `*-form-schema.ts` (Zod v4) + `use-*-form.ts` (react-hook-form) + `*-form.tsx`.
- **Data**: Query key factories in `src/lib/query/query-key.ts`. Confirmable actions via `useConfirmableAction()`.
- **Pattern**: `make*HttpClient({ httpClient })`, `make*Service({ entity })`, `make*TableColumnDef(input)`.

```ts
// Multiple
const getName = () => {
  /* ... */
};
const makeCredentialService = (input: { credential: Credential }) => ({
  getName,
});
export { makeCredentialService };

// Single
const useListCredentials = () => {
  /* ... */
};
export { useListCredentials };
```
