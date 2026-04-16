import { defineConfig } from "oxlint";

export default defineConfig({
  plugins: [
    "eslint",
    "import",
    "jsdoc",
    "oxc",
    "promise",
    "typescript",
    "unicorn",
  ],
  options: {
    typeAware: true,
    typeCheck: true,
  },
});
