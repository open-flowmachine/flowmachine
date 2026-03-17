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

## Architecture

The web app follows a clean architecture with four distinct layers: Core, Infrastructure, Action, and Presentation.

### Layer Responsibilities

**Core Layer** (`core/`)

- `domain/[feature]/entity.ts`: Zod domain schemas and type exports
- `domain/[feature]/service.ts`: Display services (date formatting, display names)
- `domain/shared.ts`: Base schemas (`baseDomainSchema`, `tenantAwareBaseDomainSchema`)
- `port/[feature]/service-port.ts`: Input validation schemas for CRUD operations
- `http/http-schema.ts`: HttpEnvelope schema and `okHttpEnvelope()` factory
- `http/http-client.ts`: HttpClient type alias (Axios)
- Domain services are factory functions: `make*DomainService({ entity }) => ({ getDisplayName(), getCreatedAt() })`

**Infrastructure Layer** (`infra/`)

- `http-client/shared/make-server-http-client.ts`: Creates per-request Axios instance with cookie forwarding from `next/headers`
- `http-client/shared/http-envelope-schema.ts`: HTTP response DTO base schemas and envelope wrapper
- `http-client/[feature]/*-http-client.ts`: HTTP clients calling upstream Elysia service with DTO validation
- `http-client/[feature]/*-http-client-dto.ts`: Request/response DTO Zod schemas
- `http-client/[feature]/*-codec.ts`: DTO↔Domain codecs using `z.codec`
- `config/config.ts`: App configuration (env, version, service base URL)

**Action Layer** (`action/`)

- Server actions (`"use server"`) for each CRUD operation per feature
- `action/[feature]/list-*.ts`, `get-*.ts`, `create-*.ts`, `update-*.ts`, `delete-*.ts`
- Each action creates a request-scoped HTTP client, calls infra, decodes response to domain type
- Server actions return domain types directly (not HTTP envelopes)
- Callable from both server components and client components (via React Query)

**Presentation Layer** (`presentation/`)

- `hook/[feature]/`: TanStack Query hooks (`useList*`, `useGet*`, `useCreate*`, `useUpdate*`, `useDelete*`) that call server actions
- `feature/`: Feature modules with table pages, create/edit forms, and detail views
- `component/ui/`: shadcn/ui components
- `component/extended-ui/`: Custom components (DataTable, JsonEditorTextarea)
- `component/platform/`: Layout components (sidebar, page template)
- `component/global-provider.tsx`: AuthUIProvider + QueryClientProvider + Toaster
- `lib/auth/`: Better Auth client with emailOTP + organization plugins
- `lib/query/`: TanStack QueryClient (retry: 0) and query key factories

### Data Flow

**Read (hybrid server + client):**
Server Component Page → `await listProjects()` (server action) → passes `initialData` to client component → `useListProjects({ initialData })` (React Query, refetches client-side)

**Write (client-side via server actions):**
Feature Component → `useCreateProject()` (React Query mutation) → `createProject()` (server action) → `makeServerHttpClient()` → Elysia service

**Server action internals:**
`makeServerHttpClient()` (cookie forwarding) → `make*HttpClient({ httpClient })` → Elysia HTTP call → DTO validation → `codec.decode()` → Domain type

### Key Patterns

- **Server actions** for all data operations: `"use server"` functions in `action/[feature]/`
- **Cookie forwarding**: `makeServerHttpClient()` reads cookies from `next/headers` and forwards to Elysia
- **Request-scoped HTTP clients**: Created per server action invocation (not module-level singletons)
- **Factory functions** for DI: `make*HttpClient({ httpClient })`
- **Query key factories**: `makeList*QueryKey()`, `makeGet*QueryKey(id)` in `presentation/lib/query/query-key.ts`
- **Hybrid reads**: Server components pre-fetch data via server actions, pass as `initialData` to client components with React Query
- **Confirmable actions**: `useConfirmableAction()` hook for two-step delete confirmations (idle → confirmation → inProgress)
- **Form conventions**: `new-*-form.ts` + `new-*-form-schema.ts` + `use-new-*-form.ts` per feature, using `react-hook-form` with `standardSchemaResolver`

### Features

| Feature | Actions | List Page | Detail Page |
|---------|---------|-----------|-------------|
| Project | list, get, create, update, delete, sync | `/platform/project` | `/platform/project/[id]` |
| Credential | list, get, create, update, delete | `/platform/credential` | `/platform/credential/[id]` |
| AI Agent | list, get, create, update, delete | `/platform/ai-agent` | `/platform/ai-agent/[id]` |
| Git Repository | list, get, create, update, delete | `/platform/git-repository` | `/platform/git-repository/[id]` |
| Workflow Definition | list, get, create, update, delete | `/platform/workflow` | `/platform/workflow/[id]` |
| Workflow Action Definition | list (read-only) | - | - |

## Key Libraries

- `next` - Web framework (App Router)
- `react` - UI library (v19)
- `better-auth` + `@daveyplate/better-auth-ui` - Authentication with email OTP and organizations
- `@tanstack/react-query` - Server state management and caching
- `react-hook-form` + `@hookform/resolvers` - Form state with Zod schema validation
- `zod/v4` - Schema validation (note the `/v4` import)
- `axios` - HTTP client
- `shadcn/ui` + `tailwindcss` v4 - UI components and styling
- `lucide-react` - Icons
- `date-fns` - Date formatting in domain services
- `es-toolkit` - Utility functions
- `sonner` - Toast notifications
- `next-themes` - Dark mode support
- `@xyflow/react` - Graph/flow editor for workflow builder
- `@lexical/react` - Rich text / JSON editor
