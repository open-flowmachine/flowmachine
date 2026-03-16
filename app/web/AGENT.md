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

The web app follows a layered hexagonal architecture with four distinct layers: domain, backend, frontend, and shared lib.

### Layer Responsibilities

**Domain Layer** (`domain/`)

- `entity/`: Zod domain schemas (`*-domain-schema.ts`) and display services (`*-domain-service.ts`)
- `port/`: Input validation schemas for CRUD operations (`*-service-port.ts`)
- `shared-schema.ts`: Base schemas (`baseDomainSchema`, `tenantAwareBaseDomainSchema`)
- Domain services are factory functions: `make*DomainService({ entity }) => ({ getDisplayName(), getCreatedAt() })`

**Backend Layer** (`backend/`)

- `http-client/`: HTTP clients calling upstream Elysia service with DTO validation
- `http-route-handler/`: Next.js API route handlers + DTO↔Domain codecs (`z.codec`)
- `di.ts`: Wires HTTP clients → route handlers, exports all handlers
- Each feature has `*-http-client.ts`, `*-http-client-dto.ts`, `*-route-handler.ts`, `*-route-handler-codec.ts`

**Frontend Layer** (`frontend/`)

- `http-client/`: Client-side API wrappers calling `/api/v1/*` with domain schema parsing
- `hook/`: TanStack Query hooks (`useList*`, `useGet*`, `useCreate*`, `useUpdate*`, `useDelete*`)
- `feature/`: Feature modules with table pages, create/edit forms, and detail views
- `component/ui/`: shadcn/ui components
- `component/extended-ui/`: Custom components (DataTable, JsonEditorTextarea)
- `component/platform/`: Layout components (sidebar, page template)
- `component/global-provider.tsx`: AuthUIProvider + QueryClientProvider + Toaster
- `lib/auth/`: Better Auth client with emailOTP + organization plugins
- `lib/query/`: TanStack QueryClient (retry: 0) and query key factories

**Shared Lib** (`lib/`)

- `config.ts`: App configuration (env, version, service base URL)
- `http/`: HttpClient type alias (Axios), HttpEnvelope schema, `okHttpEnvelope()` factory

### CRUD Data Flow

Domain schema → Port validation → Backend HTTP client (DTO) → Route handler (codec decode) → Frontend HTTP client → React Query hook → Feature component

### Key Patterns

- **Factory functions** for DI: `make*HttpClient({ httpClient })`, `make*RouteHandler({ *HttpClient })`
- **Query key factories**: `makeList*QueryKey()`, `makeGet*QueryKey(id)` in `lib/query/query-key.ts`
- **Confirmable actions**: `useConfirmableAction()` hook for two-step delete confirmations (idle → confirmation → inProgress)
- **Form conventions**: `new-*-form.ts` + `new-*-form-schema.ts` + `use-new-*-form.ts` per feature, using `react-hook-form` with `standardSchemaResolver`

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
