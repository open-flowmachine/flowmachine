import { defineConfig } from "oxlint";

import baseConfig from "../../oxlint.config.ts";

export default defineConfig({
  extends: [baseConfig],
  plugins: ["node"],

  categories: {
    correctness: "error",
    suspicious: "error",
    pedantic: "warn",
    perf: "warn",
    style: "off",
    restriction: "off",
    nursery: "off",
  },

  rules: {
    "typescript/no-explicit-any": "error",
    "typescript/no-non-null-assertion": "error",
    "typescript/no-unnecessary-type-assertion": "error",
    "typescript/ban-ts-comment": "error",
    "typescript/no-unsafe-assignment": "error",
    "typescript/no-unsafe-call": "error",
    "typescript/no-unsafe-member-access": "error",
    "typescript/no-unsafe-return": "error",
    "typescript/no-unsafe-argument": "error",

    "typescript/switch-exhaustiveness-check": "error",
    "typescript/strict-boolean-expressions": "error",
    "typescript/use-unknown-in-catch-callback-variable": "error",

    "typescript/no-floating-promises": "error",
    "typescript/no-misused-promises": "error",
    "typescript/await-thenable": "error",
    "typescript/require-await": "warn",
    "typescript/return-await": "error",
    "typescript/promise-function-async": "warn",

    "typescript/prefer-readonly": "warn",
    "typescript/consistent-type-exports": "error",
    "typescript/consistent-type-imports": "error",
    "typescript/no-import-type-side-effects": "error",

    "typescript/prefer-nullish-coalescing": "warn",
    "typescript/prefer-optional-chain": "warn",
    "typescript/no-redundant-type-constituents": "warn",

    "typescript/prefer-readonly-parameter-types": "off",
    "typescript/no-unsafe-type-assertion": "warn",
    "eslint/max-classes-per-file": "off",

    "eslint/eqeqeq": "error",
    "eslint/no-var": "error",
    "eslint/prefer-const": "error",
    "eslint/no-throw-literal": "error",

    "import/no-cycle": "error",
    "import/no-self-import": "error",
    "import/no-duplicates": "error",
  },

  overrides: [
    {
      files: ["*.test.ts"],
      rules: {
        "typescript/no-floating-promises": "allow",
        "typescript/no-unsafe-assignment": "allow",
        "typescript/no-unsafe-member-access": "allow",
        "typescript/no-explicit-any": "allow",
      },
    },
  ],
});
