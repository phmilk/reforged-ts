// The code samples of the hand-written docs pages in `docs:check` (#979):
// the strict build type-checks every TypeScript fence of the docs tree, as
// `test/snippets.test.mts` does in `pnpm test`, so the site's gate fails on a
// fence that does not compile. The checker is scripts/snippets.mts; it
// resolves the packages from the site's node_modules, built by `pnpm build`
// as docs:collect needs them.
import { join } from "node:path";
import type { Plugin } from "@docusaurus/types";
import {
  checkSnippets,
  docsSnippets,
  formatProblem,
} from "./scripts/snippets.mts";
import { SOURCES } from "./scripts/sources.mts";

/**
 * The pages of the docs tree whose fences are not checked: the collected
 * pages, copies of sources that hold wrong code on purpose (a lint rule's
 * incorrect examples), and the API section, the generated reference.
 */
export const UNCHECKED_PAGES: readonly string[] = [
  ...SOURCES.flatMap((source) => source.outputs),
  "api",
];

/**
 * The site plugin that fails the build on a fence of the docs tree of the
 * site folder `site` that does not type-check, naming each problem's page,
 * line and column. Only the docs tree of Next is read: a Docs version is
 * the frozen copy of a tree that passed.
 */
export function snippetsCheckPlugin(site: string): Plugin {
  return {
    name: "reforged-snippets-check",
    async loadContent() {
      const snippets = await docsSnippets(join(site, "docs"), UNCHECKED_PAGES);
      const problems = checkSnippets(snippets, { base: site });
      if (problems.length > 0) {
        throw new Error(
          `A code sample of the docs does not type-check:\n${problems.map((problem) => `- ${formatProblem(problem)}`).join("\n")}`,
        );
      }
    },
  };
}
