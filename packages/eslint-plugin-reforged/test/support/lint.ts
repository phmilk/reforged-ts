// The Map project path: lint a snippet as fixture-project/file.ts with the
// plugin's recommended config spread after a type-information config, exactly
// as a Map project's eslint.config.mjs does. For what the RuleTester cannot
// show: severities, `reforged/` escape directives, the config itself.
import { Linter } from "eslint";
import { parser } from "typescript-eslint";

import plugin from "../../src/index.js";
import { fixtureFile, fixtureProjectRoot } from "./fixture-project.js";

const linter = new Linter({ configType: "flat" });

const config: Linter.Config[] = [
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: fixtureProjectRoot,
      },
    },
    // A disable directive that silences nothing is an error, so an escape
    // that passes is one that matched its rule.
    linterOptions: { reportUnusedDisableDirectives: "error" },
  },
  ...(plugin.configs.recommended as Linter.Config[]),
];

/** The messages ESLint reports for `code` linted as the fixture's file.ts. */
export function lintWithRecommended(code: string): Linter.LintMessage[] {
  return linter.verify(code, config, fixtureFile("file.ts"));
}
