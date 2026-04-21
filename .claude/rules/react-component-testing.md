---
paths:
  - "app/**/*.test.tsx"
---

# React component testing

Stack: Vitest + `@testing-library/react` + `@testing-library/user-event` + MSW. Tests live next to the component as `*.test.tsx`.

## Skeleton

```tsx
import { screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { expect, test, vi } from "vitest";

import type { Project } from "@/module/project/project-type";

import { makeProjectMswHandler } from "@/test/msw/msw-project-handler";
import { mswServer } from "@/test/msw/msw-server";
import { testRender } from "@/test/test-render";

import { EditableProjectDetailsPage } from "./editable-project-details-page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/platform/project/...",
}));

const projectHandler = makeProjectMswHandler();

const PROJECT: Project = {
  /* fixed fixture */
};
```

## Rules

- Render with `testRender`, never `render` directly.
- Mock `next/navigation` at module scope. Hoist `const mockPush = vi.fn()` when asserting `push`.
- Fixtures: typed `const` above tests. UUIDv7 IDs, ISO timestamps.
- Use `test`, not `it`. Flat — no `describe`.
- Name: `"{Component}: given ..., when ..., then ..."`.
- Body: `// given`, `// when`, `// then`, separated by blank lines.
- Each test is self-contained. Extract repeats into module-level helpers.

## MSW

- Instantiate handlers once at module scope.
- Per test: create handler → `mswServer.use(handler)` → `testRender(...)` → `handler.resolveRequest()`.
- Success: `{ data }`. Failure: `{ status: 500, code: "error", message: "error" }`.
- `test-setup.ts` resets handlers — don't reset manually.
- Add missing handlers via `makeBaseMswHandler`; don't inline `http.get(...)`.

## Queries

Priority: `getByRole` (with `name`) → `getByLabelText` / `getByPlaceholderText` / `getByText` / `getByDisplayValue` → `getByAltText` / `getByTitle` → `getByTestId` (last resort).

- `findBy*` after async boundaries, `getBy*` / `queryBy*` after.
- `queryBy*` only for negative assertions.
- Matchers: `.toBeVisible()`, `.toHaveValue()`, `.toHaveAttribute()`, `.toHaveTextContent()`, `.toBeDisabled()`, `.toBeNull()`.
- Interactions via `userEvent`. Never `fireEvent`.

## Patterns

- **Loading state**: assert the loading label before calling `resolveRequest()`.
- **Clipboard**: stub `navigator.clipboard` in `given`, restore in `afterEach`.
- **Router redirect**: `await waitFor(() => expect(mockPush).toHaveBeenCalledWith(...))`.
- **Dialog close**: `await waitForElementToBeRemoved(() => screen.queryByText("Delete project"))`.
