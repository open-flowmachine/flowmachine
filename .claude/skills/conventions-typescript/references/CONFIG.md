# CONFIG — `tsconfig` + Oxlint

Type safety is enforced in two layers:

- **`tsc`** — structural rules the compiler can prove.
- **Oxlint** — rules that need type info but aren't compiler errors (unsafe flow, unused results, missing guards).

## `tsconfig`

Base config: `package/typescript-config/base.json`. Apps extend via `app/*/tsconfig.json`. All flags below are mandatory.

```jsonc
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "noPropertyAccessFromIndexSignature": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
  },
}
```

| Flag                                       | Catches                                                                       |
| ------------------------------------------ | ----------------------------------------------------------------------------- |
| `strict`                                   | Meta-flag. Enables `strictNullChecks`, `noImplicitAny`, and 6 others.         |
| `noUncheckedIndexedAccess`                 | `arr[i]` / `obj[key]` typed as `T \| undefined`. Prevents silent `undefined`. |
| `exactOptionalPropertyTypes`               | `{ x?: number }` rejects `{ x: undefined }`. Forces intent.                   |
| `noImplicitOverride`                       | Subclass override without `override` keyword.                                 |
| `noFallthroughCasesInSwitch`               | Missing `break`/`return` in a `case`.                                         |
| `noPropertyAccessFromIndexSignature`       | `dict.foo` when only `dict[key]` is typed. Forces bracket access.             |
| `noUnusedLocals` / `noUnusedParameters`    | Dead code and stale refactors.                                                |
| `isolatedModules` + `verbatimModuleSyntax` | Every file must be compilable alone; imports preserved verbatim.              |

## Oxlint

Rules reference: https://oxc.rs/docs/guide/usage/linter/rules.html?sort=name&dir=asc&scope=typescript

Root config: `oxlint.config.ts`. Per-app overrides: `app/*/oxlint.config.ts`. The `typescript` plugin must be enabled and `options.typeAware` / `options.typeCheck` must be `true` — the `no-unsafe-*` family needs type info.

```ts
import { defineConfig } from "oxlint";

export default defineConfig({
  plugins: ["eslint", "import", "oxc", "promise", "typescript", "unicorn"],
  options: { typeAware: true, typeCheck: true },
});
```

| Rule                                       | Enforces                                                          |
| ------------------------------------------ | ----------------------------------------------------------------- |
| `typescript/no-explicit-any`               | Ban `any`. Use `unknown`.                                         |
| `typescript/no-unsafe-assignment`          | Block untyped values flowing into typed slots.                    |
| `typescript/no-unsafe-call`                | Block calling a value typed `any`.                                |
| `typescript/no-unsafe-member-access`       | Block `.x` on `any`.                                              |
| `typescript/no-unsafe-return`              | Block returning `any` from a typed function.                      |
| `typescript/no-unsafe-argument`            | Block passing `any` where a type is expected.                     |
| `typescript/no-non-null-assertion`         | Ban `x!`.                                                         |
| `typescript/consistent-type-assertions`    | Ban `x as T` (allow `as const`).                                  |
| `typescript/no-unnecessary-type-assertion` | Remove casts the compiler already knows are safe.                 |
| `typescript/prefer-as-const`               | `"x" as const` over `"x" as "x"`.                                 |
| `typescript/switch-exhaustiveness-check`   | Every discriminated-union switch must be exhaustive.              |
| `typescript/no-floating-promises`          | Every `Promise` is awaited or explicitly `void`-prefixed.         |
| `typescript/no-misused-promises`           | No `Promise` in a boolean condition or `void`-returning callback. |

All rules set to `error`. Do not downgrade to `warn`.

### Banning native `enum`

If the installed Oxlint version does not ship `typescript/no-enum`, ban via `no-restricted-syntax`:

```ts
rules: {
  "no-restricted-syntax": ["error", {
    selector: "TSEnumDeclaration",
    message: "Use `as const` object + derived union. See ANTI-PATTERNS.md.",
  }],
},
```
