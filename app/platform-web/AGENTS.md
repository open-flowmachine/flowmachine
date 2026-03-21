# Web AGENT.md

Next.js 16 frontend application with React 19 and App Router.

## Commands

```bash
bun run dev              # Start dev server (port 3000)
bun run build            # Build for production
bun run start            # Start production server
bun run lint             # Run ESLint
bun run check-types      # Type check
bun run shadcn:add       # Add shadcn/ui components
```

## Naming Convention

- **Directories** — use the bare domain name, no namespace prefix: `credential/`, `project/`, `ui/`
- **Files** — prefix every file with its parent directory namespace: `credential-type.ts`, `credential-service.ts`, `credential-http-client.ts`
- **React hooks** — `use-` prefix: `use-list-credentials.ts`, `use-confirmable-action.ts`
- **Feature directories** — descriptive kebab-case: `credentials-table/`, `new-credential/`, `editable-credential-details/`

## Architecture

### Dependency Rule

`app → feature → module → hook / lib`
`feature → component → hook / lib`

- `lib` and `hook` are leaf layers — they do not import from `module`, `feature`, `component`, or `app`
- `lib` does not import from `hook` (and vice versa)
- `component` may import from `component`, `hook`, and `lib`
- `module` may import from `module`, `hook`, and `lib`
- `feature` may import from `feature`, `module`, `component`, `hook`, and `lib`
- `app` may import from `feature` and `component`

### Layer Responsibilities

**Lib Layer** (`lib/`)

- Pure types, schemas, utility functions, and client singletons
- No React components, no business logic, no side effects on import
- Safe to import from any other layer
- Contains: base schemas (`Id`, `DateTime`, `Model<T>`), `HttpClient` type alias, `HttpEnvelope` schema, `QueryClient`, query key factories, Better Auth client, env initializer, `cn()` utility

**Hook Layer** (`hook/`)

- Reusable React hooks not tied to any domain module
- No imports from other app layers (only React and third-party libraries)
- Contains: `useProtectedHttpClient`, `useUnprotectedHttpClient`, `useConfirmableAction`, `useJsonEditor`, `useCopyToClipboard`, `useIsMobile`

**Module Layer** (`module/`)

- Business logic organized by domain entity
- Each module folder contains: entity types, HTTP client factory, display service factory, and React Query hooks
- May import from `module`, `hook`, and `lib`
- Contains: ai-agent, credential, git-repository, project, workflow

**Component Layer** (`component/`)

- Reusable UI components with no domain knowledge
- `ui/`: shadcn/ui base components
- `extended-ui/`: custom composites (DataTable, JsonEditorTextarea, Center, Logo, Pending)
- `platform/`: layout components (PlatformLayout, PlatformSidebar, PlatformPageTemplate)
- `global-provider.tsx`: root provider (AuthUI + QueryClient + Toaster)
- May import from `component`, `hook`, and `lib`

**Feature Layer** (`feature/`)

- Feature modules combining pages, forms, and table views
- Each feature folder groups related page, form, schema, and hook files
- Three patterns: table (`*-table/`), create (`new-*/`), edit (`editable-*-details/`)
- May import from `feature`, `module`, `component`, `hook`, and `lib`

**App Layer** (`app/`)

- Next.js App Router pages and layouts
- Thin wrappers that import and render feature components
- Routes: `/platform/{entity}` (list), `/platform/{entity}/new` (create), `/platform/{entity}/[id]` (detail/edit)
- Auth routes via Better Auth UI (`/auth/[path]`, `/account/[path]`, `/organization/[path]`)
- May import from `feature` and `component`

### Export Pattern

- **Multiple related functions** → bundle in a `make*` factory (the only named export); functions stay module-private

  ```ts
  const getName = () => {
    /* ... */
  };
  const getCreatedAt = () => {
    /* ... */
  };
  const makeCredentialService = (input: { credential: Credential }) => ({ getName, getCreatedAt });
  export { makeCredentialService };
  ```

- **Single value** (hook, component, schema, type) → `export { name }` directly

  ```ts
  const useListCredentials = () => {
    /* ... */
  };
  export { useListCredentials };
  ```

### Key Patterns

- **Factory functions** for DI: `make*HttpClient({ httpClient })`, `make*Service({ entity })`
- **Query key factories**: `makeList*QueryKey()`, `makeGet*QueryKey(id)` in `lib/query/query-key.ts`
- **Confirmable actions**: `useConfirmableAction()` hook for two-step delete (idle → confirmation → inProgress)
- **Form conventions**: `*-form-schema.ts` (Zod) + `use-*-form.ts` (react-hook-form + standardSchemaResolver) + `*-form.tsx` per feature
- **Column def factories**: `make*TableColumnDef(input)` for DataTable column definitions
- **Domain services**: `make*Service({ entity })` for display formatting (dates, labels, masked values)
