// The RuleTester seam: typescript-eslint's RuleTester, wired to vitest, with
// type information from the fixture project. Every test case is linted as
// fixture-project/file.ts (its content replaced in memory), so Natives resolve
// into the installed reforged-types and Wrappers into the stub reforged-ts.
import { RuleTester } from "@typescript-eslint/rule-tester";
import { afterAll, describe, it } from "vitest";

import { fixtureFile, fixtureProjectRoot } from "./fixture-project.js";

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.describeSkip = describe.skip;
RuleTester.it = it;
RuleTester.itOnly = it.only;
RuleTester.itSkip = it.skip;

/** A RuleTester that lints against the fixture project. */
export function createRuleTester(): RuleTester {
  return new RuleTester({
    defaultFilenames: {
      ts: fixtureFile("file.ts"),
      tsx: fixtureFile("file.tsx"),
    },
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: fixtureProjectRoot,
      },
    },
  });
}
