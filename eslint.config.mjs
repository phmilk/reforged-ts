// One flat configuration lints and formats every package of the workspace
// (ADR 0002). `eslint --fix` formats through Prettier, so a save in the editor
// and a run in CI produce the same file. No rule is disabled or relaxed here
// but for the static namespaces' entry below: a tolerated finding is disabled
// inline, on its line, naming the build step that clears it.
import eslint from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import importPlugin from "eslint-plugin-import-x";
import jsdoc from "eslint-plugin-jsdoc";
import prettierRecommended from "eslint-plugin-prettier/recommended";
import tsdoc from "eslint-plugin-tsdoc";
import tseslint from "typescript-eslint";

// A class member a Map project sees: private and protected members are
// exempt, and constructors too (TypeDoc's `notDocumented` leaves them out).
const PUBLIC_MEMBER =
  ':not([accessibility="private"], [accessibility="protected"], [key.type="PrivateIdentifier"], [kind="constructor"])';

// The functions whose doc comment names every parameter and the return
// value: exported functions and the public methods and accessors of classes.
const DOCUMENTED_FUNCTIONS = [
  "ExportNamedDeclaration > FunctionDeclaration",
  "ExportDefaultDeclaration > FunctionDeclaration",
  "ExportNamedDeclaration > TSDeclareFunction",
  "ExportNamedDeclaration > VariableDeclaration > VariableDeclarator > ArrowFunctionExpression",
  "ExportNamedDeclaration > VariableDeclaration > VariableDeclarator > FunctionExpression",
  "ExportNamedDeclaration > TSInterfaceDeclaration TSMethodSignature",
  `MethodDefinition${PUBLIC_MEMBER} > FunctionExpression`,
  `MethodDefinition${PUBLIC_MEMBER} > TSEmptyBodyFunctionExpression`,
];

/**
 * The doc comment rules, at error (#43): an undocumented public member of
 * the library fails `pnpm lint`. The tag vocabulary is the workspace's
 * tsdoc.json, which tsdoc/syntax reads next to the program of the file (the
 * library's tsdoc.json extends it). It declares TypeDoc's `@includeCode`
 * too: given a project's tsdoc.json, TypeDoc knows the standard tags and
 * that file's alone. Of eslint-plugin-jsdoc, only the rules below: its
 * tag-name and type checks stay off, since TypeScript gives the types and
 * tsdoc/syntax the tags.
 */
export const docComments = {
  plugins: { jsdoc, tsdoc },
  settings: { jsdoc: { mode: "typescript" } },
  rules: {
    "tsdoc/syntax": "error",
    // Every exported declaration, with the members of an exported enum or
    // interface, and every public member of a class. The fixers of this rule
    // and the next are off: an empty comment or a `@param` without its
    // hyphen and text is no fix, so `--fix` fixes the tag order alone.
    "jsdoc/require-jsdoc": [
      "error",
      {
        enableFixer: false,
        publicOnly: true,
        require: {
          ClassDeclaration: true,
          FunctionDeclaration: true,
        },
        contexts: [
          "TSDeclareFunction",
          "TSEnumDeclaration",
          "TSEnumMember",
          "TSInterfaceDeclaration",
          "TSMethodSignature",
          "TSPropertySignature",
          "TSModuleDeclaration",
          "TSTypeAliasDeclaration",
          "ExportNamedDeclaration > VariableDeclaration",
          `MethodDefinition${PUBLIC_MEMBER} > FunctionExpression`,
          `PropertyDefinition${PUBLIC_MEMBER}`,
        ],
      },
    ],
    // A TSDoc `@param` names a parameter, never a property of one.
    "jsdoc/require-param": [
      "error",
      {
        contexts: DOCUMENTED_FUNCTIONS,
        checkDestructured: false,
        enableFixer: false,
      },
    ],
    // Getters included; a function returning nothing needs no `@returns`.
    "jsdoc/require-returns": ["error", { contexts: DOCUMENTED_FUNCTIONS }],
    // The order of #43; the block tags it does not name (`@bug`, `@see`)
    // come after `@deprecated`, before the modifiers. One group: no blank
    // line is required between tags.
    "jsdoc/sort-tags": [
      "error",
      {
        tagSequence: [
          {
            tags: [
              "remarks",
              "example",
              "typeParam",
              "param",
              "returns",
              "throws",
              "native",
              "patch",
              "since",
              "deprecated",
              "-other",
              "async",
              "internal",
            ],
          },
        ],
        reportTagGroupSpacing: false,
        reportIntraTagGroupSpacing: false,
      },
    ],
  },
};

export default defineConfig(
  globalIgnores([
    // Build outputs.
    "**/dist/**",
    "packages/reforged-types/build/**",
    "packages/reforged-builtins/build/**",
    "release/build/**",
    "website/build/**",
    "website/.docusaurus/**",
    "website/docs/api/reforged-ts/**",
    "website/typings/*/**",
    // The docs versions docs:version cuts: frozen copies of the docs tree.
    "website/versioned_docs/**",
    "wrapper-coverage/build/**",
    "probe/build/**",
    "probe/.probe/**",
    "packages/reforged-test/lua/**",
    "packages/reforged-ts/dist-test/**",
    "packages/reforged-ts/dist-examples/**",
    // What tools own: the vendored Patch files and the generated Typings.
    "packages/reforged-types/vendor/**",
    "packages/reforged-types/3.0.0/**",
    "packages/reforged-types/3.0.0.d.ts",
    // The Built-in objects' artefacts, emitted from each Game version's index.
    "packages/reforged-builtins/[0-9]*/**",
    "packages/reforged-builtins/[0-9]*.d.ts",
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
  // It keeps every program it opens until the process exits: `pnpm lint`
  // runs one process per group of packages (scripts/eslint.mjs, #377).
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
  // The library's static namespaces: classes of static members only, over
  // one facility of the whole game rather than one Handle (`Camera`, `File`,
  // `Input`, `Terrain`). They stay static classes, decided on #54: a Map
  // project calls `Camera.setPos` as in w3ts, and the coverage report counts
  // the Natives a class calls, never those of a TypeScript namespace or a
  // `const` object. The next static namespace (the tier-3 namespaces of 1.1)
  // adds its file to this list rather than an inline exception.
  {
    files: [
      "packages/reforged-ts/src/handles/camera.ts",
      "packages/reforged-ts/src/handles/input.ts",
      "packages/reforged-ts/src/handles/terrain.ts",
      "packages/reforged-ts/src/system/file.ts",
    ],
    rules: {
      "@typescript-eslint/no-extraneous-class": [
        "error",
        { allowStaticOnly: true },
      ],
    },
  },
  // The library's doc comments (#43, docs/documentation.md). The doc lint's
  // own fixtures, under test/node/fixtures/doc-lint, stay outside these
  // files: they hold deliberate findings.
  {
    files: ["packages/reforged-ts/src/**/*.ts"],
    ...docComments,
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
  // reforged-map's Map project fixtures import `reforged-ts` as a Map project
  // does, through the same kind of mapping.
  {
    files: ["packages/reforged-map/test/fixtures/map-project/**/*.ts"],
    settings: {
      "import-x/resolver": {
        typescript: {
          project:
            "packages/reforged-map/test/fixtures/map-project/tsconfig.json",
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
  // The Probes and the Probe runner's in-game module import `reforged-ts` and
  // the Probe being built (`@probe/current`) through the paths of their
  // typescript-to-lua project.
  {
    files: ["probe/game/**/*.ts", "probe/probes/**/*.ts"],
    settings: {
      "import-x/resolver": {
        typescript: { project: "probe/probes/tsconfig.json" },
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
