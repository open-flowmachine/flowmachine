import { defineConfig } from "oxlint";

import baseConfig from "../../oxlint.config.ts";

export default defineConfig({
  extends: [baseConfig],
  plugins: ["node"],
  rules: {
    "no-console": "error",
  },
  overrides: [
    {
      files: ["src/vendor/pino/**"],
      rules: {
        "no-console": "allow",
      },
    },
  ],
});
