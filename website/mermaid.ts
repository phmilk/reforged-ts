// The docs site's Mermaid diagrams (#676, ADR 0019). `markdown.mermaid` and
// @docusaurus/theme-mermaid in config.ts turn a `mermaid` block of a page
// into a diagram, drawn in the browser in the colour mode being read, so the
// built HTML holds no picture of it; without them, the block is a code block
// of the page. This plugin checks the build for that: no page of a docs
// version, Next and every cut one, shows a `mermaid` block as code.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Plugin } from "@docusaurus/types";

/** The class Docusaurus gives a code block of the language `mermaid`. */
const MERMAID_AS_CODE = /\blanguage-mermaid\b/;

/**
 * The pages of the docs versions in the build folder `outDir` that show a
 * `mermaid` block as code, one line each, by their path in the folder; none
 * when every block is a diagram. The Typings' reference, generated, holds
 * no block and is not read.
 */
export function mermaidProblems(outDir: string): string[] {
  const docs = join(outDir, "docs");
  if (!existsSync(docs)) return [];
  return readdirSync(docs, { recursive: true, encoding: "utf8" })
    .map((path) => `docs/${path.replaceAll("\\", "/")}`)
    .filter((path) => path.endsWith(".html"))
    .filter((path) =>
      MERMAID_AS_CODE.test(readFileSync(join(outDir, path), "utf8")),
    )
    .sort()
    .map((path) => `${path} shows a mermaid block as code.`);
}

/** The site plugin of {@link mermaidProblems}: fails the build on any. */
export function mermaidCheckPlugin(): Plugin {
  return {
    name: "reforged-mermaid-check",
    postBuild({ outDir }) {
      const problems = mermaidProblems(outDir);
      if (problems.length > 0) {
        return Promise.reject(
          new Error(
            `A mermaid block is not a diagram: is Mermaid on in config.ts?\n${problems.map((line) => `- ${line}`).join("\n")}`,
          ),
        );
      }
      return Promise.resolve();
    },
  };
}
