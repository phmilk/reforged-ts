// The docs site's Mermaid diagrams (#676, ADR 0019). `markdown.mermaid` and
// @docusaurus/theme-mermaid in config.ts turn a `mermaid` block of a page
// into the theme's Mermaid component, which draws it in the browser in the
// colour mode being read, with the Mermaid theme `themeConfig.mermaid.theme`
// names for it; so the built HTML holds no picture of it, and its page's
// JavaScript holds the block as the `value` of a `mermaid` element. Without
// them, the block is a code block of the page. This plugin checks the build
// for both: every block of a docs page, of every docs version, reaches the
// build's JavaScript as a `mermaid` element, the theme's component is in
// the build and its config names a light and a dark theme, and no page of a
// docs version shows a `mermaid` block as code.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Plugin } from "@docusaurus/types";
import { TYPINGS_FOLDER } from "./reference";
import { fencedBlocks, normalizeNewlines } from "./scripts/markdown.mts";

/** The class Docusaurus gives a code block of the language `mermaid`. */
const MERMAID_AS_CODE = /\blanguage-mermaid\b/;

/** The class of the theme's Mermaid component, its stable name. */
const MERMAID_COMPONENT = "docusaurus-mermaid-container";

/**
 * A `mermaid` element of a page's compiled MDX, minified:
 * `(0,i.jsx)(t.mermaid,{value:"flowchart LR\n..."})`; the group is the
 * quote of the string literal that follows.
 */
const MERMAID_ELEMENT = /\bmermaid\s*,\s*\{\s*value\s*:\s*(["'`])/g;

const ESCAPES: Record<string, string> = {
  n: "\n",
  r: "\r",
  t: "\t",
  b: "\b",
  f: "\f",
  v: "\v",
  0: "\0",
};

/**
 * The text of the JavaScript string literal whose quote is at `start` of
 * `code`; undefined when it does not close.
 */
function stringLiteral(code: string, start: number): string | undefined {
  const quote = code.charAt(start);
  let text = "";
  for (let at = start + 1; at < code.length; at += 1) {
    const char = code.charAt(at);
    if (char === quote) return text;
    if (char !== "\\") {
      text += char;
      continue;
    }
    at += 1;
    const next = code.charAt(at);
    // \xHH, \uHHHH or \u{H...}: the digits, and how many characters they take.
    const rest = code.slice(at + 1);
    const digits =
      next === "x"
        ? /^([0-9a-fA-F]{2})/.exec(rest)
        : next === "u"
          ? (/^\{([0-9a-fA-F]+)\}/.exec(rest) ?? /^([0-9a-fA-F]{4})/.exec(rest))
          : null;
    if (digits !== null) {
      text += String.fromCodePoint(parseInt(digits[1], 16));
      at += digits[0].length;
    } else if (next !== "\n") {
      // Any other escape; a line continuation, `\` then a newline, adds
      // nothing.
      text += ESCAPES[next] ?? next;
    }
  }
  return undefined;
}

/** The value of each `mermaid` element of the build's JavaScript. */
function mermaidValues(scripts: readonly string[]): Set<string> {
  const values = new Set<string>();
  for (const code of scripts) {
    for (const match of code.matchAll(MERMAID_ELEMENT)) {
      const value = stringLiteral(code, match.index + match[0].length - 1);
      if (value !== undefined) values.add(normalizeNewlines(value));
    }
  }
  return values;
}

/** The text of every JavaScript file of the build folder's assets. */
function buildScripts(outDir: string): string[] {
  const folder = join(outDir, "assets", "js");
  if (!existsSync(folder)) return [];
  return readdirSync(folder, { recursive: true, encoding: "utf8" })
    .filter((path) => path.endsWith(".js"))
    .map((path) => readFileSync(join(folder, path), "utf8"));
}

/** What the check reads of a build. */
export interface MermaidBuild {
  /** The build folder. */
  outDir: string;
  /** The source of each docs page, by its path (`@site/docs/...`). */
  sources: ReadonlyMap<string, string>;
  /** The site's theme config, as Docusaurus validated it. */
  themeConfig: unknown;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

/** The colour modes `themeConfig.mermaid.theme` names no Mermaid theme for. */
function missingThemes(themeConfig: unknown): string[] {
  const mermaid = isRecord(themeConfig) ? themeConfig.mermaid : undefined;
  const theme = isRecord(mermaid) ? mermaid.theme : undefined;
  return ["light", "dark"].filter((mode) => {
    const name = isRecord(theme) ? theme[mode] : undefined;
    return typeof name !== "string" || name === "";
  });
}

/** The pages of the docs versions in the build that show a block as code. */
function pagesShowingCode(outDir: string): string[] {
  const docs = join(outDir, "docs");
  if (!existsSync(docs)) return [];
  return readdirSync(docs, { recursive: true, encoding: "utf8" })
    .map((path) => `docs/${path.replaceAll("\\", "/")}`)
    .filter((path) => path.endsWith(".html"))
    .filter((path) =>
      MERMAID_AS_CODE.test(readFileSync(join(outDir, path), "utf8")),
    )
    .sort();
}

/**
 * What keeps the diagrams of `build` from being drawn, one line each: a
 * block of a source that reaches no `mermaid` element of the build's
 * JavaScript, a build without the theme's Mermaid component while a source
 * holds a block, a colour mode the theme config names no Mermaid theme for,
 * and a page of a docs version that shows a block as code. None when every
 * block is a diagram.
 */
export function mermaidProblems(build: MermaidBuild): string[] {
  const blocks = [...build.sources]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .flatMap(([source, markdown]) =>
      fencedBlocks(markdown, "mermaid").map((block) => ({ source, ...block })),
    );
  const scripts = blocks.length === 0 ? [] : buildScripts(build.outDir);
  const values = mermaidValues(scripts);
  const unreached = blocks
    .filter(({ body }) => !values.has(body))
    .map(
      ({ source, line, body }) =>
        `${source}: its mermaid block "${body.split("\n")[0] ?? ""}" (line ${String(line)}) reaches no Mermaid component of the build.`,
    );
  const component =
    blocks.length > 0 &&
    !scripts.some((code) => code.includes(MERMAID_COMPONENT))
      ? ["The build holds no Mermaid component of @docusaurus/theme-mermaid."]
      : [];
  return [
    ...unreached,
    ...component,
    ...missingThemes(build.themeConfig).map(
      (mode) => `themeConfig.mermaid.theme names no ${mode} Mermaid theme.`,
    ),
    ...pagesShowingCode(build.outDir).map(
      (path) => `${path} shows a mermaid block as code.`,
    ),
  ];
}

/**
 * The source of each page of the docs versions, by its path
 * (`@site/docs/...`), read from `siteDir`: the docs plugins' loaded
 * content. The Typings' reference, generated, holds no block and is not
 * read.
 */
function docsSources(
  plugins: readonly { name: string; content: unknown }[],
  siteDir: string,
): Map<string, string> {
  const sources = new Map<string, string>();
  for (const { name, content } of plugins) {
    if (name !== "docusaurus-plugin-content-docs" || !isRecord(content)) {
      continue;
    }
    const versions = Array.isArray(content.loadedVersions)
      ? (content.loadedVersions as unknown[])
      : [];
    for (const version of versions) {
      const docs =
        isRecord(version) && Array.isArray(version.docs)
          ? (version.docs as unknown[])
          : [];
      for (const doc of docs) {
        const source = isRecord(doc) ? doc.source : undefined;
        if (typeof source !== "string" || !source.startsWith("@site/")) {
          continue;
        }
        const path = source.slice("@site/".length);
        if (path.startsWith(`${TYPINGS_FOLDER}/`)) continue;
        sources.set(source, readFileSync(join(siteDir, path), "utf8"));
      }
    }
  }
  return sources;
}

/** The site plugin of {@link mermaidProblems}: fails the build on any. */
export function mermaidCheckPlugin(): Plugin {
  return {
    name: "reforged-mermaid-check",
    postBuild({ outDir, siteDir, siteConfig, plugins }) {
      const problems = mermaidProblems({
        outDir,
        sources: docsSources(plugins, siteDir),
        themeConfig: siteConfig.themeConfig,
      });
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
