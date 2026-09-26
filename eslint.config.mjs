// One flat configuration lints and formats every package of the workspace
// (ADR 0002). `eslint --fix` formats through Prettier, so a save in the editor
// and a run in CI produce the same file. No rule is disabled here: a tolerated
// finding is disabled inline, on its line, naming the build step that clears it.
import eslint from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import importPlugin from "eslint-plugin-import-x";
import prettierRecommended from "eslint-plugin-prettier/recommended";
import tseslint from "typescript-eslint";

export default defineConfig(
  globalIgnores([
    // Build outputs.
    "**/dist/**",
    "packages/reforged-types/build/**",
    "release/build/**",
    "website/build/**",
    "website/.docusaurus/**",
    "website/docs/api/reforged-ts/**",
    "website/docs/api/typings/*/**",
    "packages/reforged-test/lua/**",
    "packages/reforged-ts/dist-test/**",
    // What tools own: the vendored Patch files and the generated Typings.
    "packages/reforged-types/vendor/**",
    "packages/reforged-types/3.0.0/**",
    "packages/reforged-types/3.0.0.d.ts",
    // Lua is not linted.
    "**/*.lua",
    // Agent worktrees and local state.
    ".claude/**",
  ]),
  {
    linterOptions: { reportUnusedDisableDirectives: "error" },
  },
  eslint.configs.recommended,
  // Every TypeScript file belongs to one tsconfig; the project service finds
  // it (see tsconfig.json at the root for the ones not named tsconfig.json).
  {
    files: ["**/*.{ts,tsx,mts,cts}"],
    extends: [
      tseslint.configs.strictTypeChecked,
      tseslint.configs.stylisticTypeChecked,
      importPlugin.flatConfigs.recommended,
      importPlugin.flatConfigs.typescript,
    ],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Not in the recommended set; a new import cycle is reported the day it
      // is written.
      "import-x/no-cycle": "error",
    },
  },
  // The library's declaration fixtures import `reforged-ts` as a Map project
  // does; their tsconfig maps it to the sources for the import resolver, which
  // otherwise reads the root tsconfig.json.
  {
    files: ["packages/reforged-ts/test/node/fixtures/declarations/**/*.ts"],
    settings: {
      "import-x/resolver": {
        typescript: {
          project:
            "packages/reforged-ts/test/node/fixtures/declarations/tsconfig.json",
        },
      },
    },
  },
  // The examples the doc comments include import `reforged-ts` as a Map
  // project does, through the same kind of mapping.
  {
    files: ["packages/reforged-ts/examples/**/*.ts"],
    settings: {
      "import-x/resolver": {
        typescript: {
          project: "packages/reforged-ts/examples/tsconfig.json",
        },
      },
    },
  },
  // The docs site's components import Docusaurus' client modules by the
  // aliases its bundler maps (`@docusaurus/useDocusaurusContext`, `@theme/*`),
  // which @docusaurus/module-type-aliases declares but no file resolves, and
  // the site's own files by `@site/*`, the path of the site's tsconfig.
  {
    files: ["website/src/**/*.{ts,tsx}"],
    settings: {
      "import-x/resolver": {
        typescript: { project: "website/tsconfig.json" },
      },
    },
    rules: {
      "import-x/no-unresolved": [
        "error",
        { ignore: ["^@docusaurus/", "^@theme(-original)?/"] },
      ],
    },
  },
  // Last: Prettier formats, and eslint-config-prettier turns off the rules
  // that would fight it.
  prettierRecommended,
);
