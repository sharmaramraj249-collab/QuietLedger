import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", "coverage", "contracts/managed", "backend/alembic"] },
  { extends: [js.configs.recommended, ...tseslint.configs.recommended], languageOptions: { globals: { ...globals.browser, ...globals.node } } },
  reactHooks.configs["recommended-latest"],
  reactRefresh.configs.vite,
);
