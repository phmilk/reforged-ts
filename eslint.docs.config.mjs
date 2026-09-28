// The lint of the library's doc comments, at warn (#43): the main
// configuration plus the rules that list what the doc comments lack. They
// stay out of eslint.config.mjs while the documentation pass runs, since
// `pnpm lint` allows no warning; the docs audit runs this file. The gate
// switch moves `docComments` into eslint.config.mjs at error and deletes
// this file.
//
//   pnpm exec eslint -c eslint.docs.config.mjs packages/reforged-ts/src
import { defineConfig } from "eslint/config";
import jsdoc from "eslint-plugin-jsdoc";
import tsdoc from "eslint-plugin-tsdoc";

import config from "./eslint.config.mjs";

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
 * The doc comment rules, at warn. The tag vocabulary is the workspace's
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
    "tsdoc/syntax": "warn",
    // Every exported declaration, with the members of an exported enum or
    // interface, and every public member of a class. The fixers of this rule
    // and the next are off: an empty comment or a `@param` without its
    // hyphen and text is no fix, so `--fix` fixes the tag order alone.
    "jsdoc/require-jsdoc": [
      "warn",
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
      "warn",
      {
        contexts: DOCUMENTED_FUNCTIONS,
        checkDestructured: false,
        enableFixer: false,
      },
    ],
    // Getters included; a function returning nothing needs no `@returns`.
    "jsdoc/require-returns": ["warn", { contexts: DOCUMENTED_FUNCTIONS }],
    // The order of #43; the block tags it does not name (`@bug`, `@see`)
    // come after `@deprecated`, before the modifiers. One group: no blank
    // line is required between tags.
    "jsdoc/sort-tags": [
      "warn",
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

export default defineConfig(config, {
  files: ["packages/reforged-ts/src/**/*.ts"],
  ...docComments,
});
