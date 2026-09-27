// The docs site's files for AI agents (#40): for each docs version, Next and
// every cut one, an `llms.txt` that links a Markdown copy of each of its
// pages, and an `llms-full.txt` that holds them all; once more for the
// Typings' reference, which is not versioned. docusaurus-plugin-llms writes
// them. Its own `versions: "auto"` places the files and their links for a
// site whose versions sit at the site root, not under a `baseUrl` and the
// docs route (/reforged-ts/docs/<version>), so this plugin runs it once per
// target instead, with the target's routes alone, and checks what it wrote:
// the plugin logs its failures and never fails the build.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { LoadContext, Plugin, PluginConfig } from "@docusaurus/types";
import llmsPlugin from "docusaurus-plugin-llms";
import { TYPINGS_FOLDER } from "./reference";
import { TYPINGS_ROUTE_BASE } from "./typedoc/typings.mts";

/** One set of LLM files: a docs version, or the Typings' reference. */
export interface LlmsTarget {
  /** The version the files name: `Next`, a cut version's label, or none. */
  readonly label?: string;
  /** Its docs folder, relative to the site folder. */
  readonly folder: string;
  /**
   * Its route without the site's `baseUrl` (`docs/next`), where its files
   * are served: `<route>/llms.txt`, `<route>/llms-full.txt`, and each page
   * at its own route followed by `.md`.
   */
  readonly route: string;
  readonly title: string;
  /** The line under the title; the site's tagline when not given. */
  readonly description?: string;
  /** The text that opens `llms.txt`. */
  readonly intro: string;
}

const SITE_URL = "https://phmilk.github.io/reforged-ts";

/** The URL of the `llms.txt` of the docs version served at `/docs/<path>`. */
export function llmsUrl(path: string): string {
  return `${SITE_URL}/docs/${path}/llms.txt`;
}

const TYPINGS_LLMS = `${SITE_URL}/${TYPINGS_ROUTE_BASE}/llms.txt`;

/**
 * The LLM files the site writes: Next, then each cut version, newest first,
 * then the Typings' reference.
 */
export function llmsTargets(cut: readonly string[]): LlmsTarget[] {
  const version = (label: string, folder: string, path: string) => ({
    label,
    folder,
    route: `docs/${path}`,
    title: "reforged-ts",
    intro:
      `The documentation of reforged-ts, docs version ${label}: TypeScript for Warcraft III maps, compiled to Lua. ` +
      "Each link is one page as Markdown; llms-full.txt, next to this file, holds every page in one file. " +
      `The reference of the Typings (reforged-types) is not versioned and has its own: ${TYPINGS_LLMS}.`,
  });
  return [
    version("Next", "docs", "next"),
    ...cut.map((label) =>
      version(label, `versioned_docs/version-${label}`, label),
    ),
    {
      folder: TYPINGS_FOLDER,
      route: TYPINGS_ROUTE_BASE,
      title: "reforged-types",
      description:
        "The declarations of the Warcraft III Natives for TypeScript, one reference per Game version.",
      intro:
        "The reference of the Typings (reforged-types), the declarations of the Warcraft III Natives: a page per Native, Blizzard.j function and global of each Game version, as Markdown. " +
        `The documentation of the library has an llms.txt per docs version: ${llmsUrl("<version>")}, where <version> is next or a library major.minor.`,
    },
  ];
}

/** The two files of `target` in the build folder `outDir`. */
function targetFiles(outDir: string, target: LlmsTarget): string[] {
  return ["llms.txt", "llms-full.txt"].map((name) =>
    join(outDir, target.route, name),
  );
}

/** The page URLs an `llms.txt` links, one per line: `- [Title](url): …`. */
function pageLinks(index: string): string[] {
  return [
    ...readFileSync(index, "utf8").matchAll(/^- \[.*?\]\((\S+?)\)/gm),
  ].map(([, url = ""]) => url);
}

/** Where the build folder `outDir` holds the file at `url`. */
function fileOf(outDir: string, siteUrl: string, url: string): string {
  return join(outDir, decodeURI(url.slice(siteUrl.length)));
}

/**
 * What is wrong with the files of `target` in the build folder `outDir`:
 * a missing file, no page, or a link of `llms.txt` to no Markdown copy of
 * one of the target's `routes` (with the site's `baseUrl`), one line each;
 * none when they are right.
 */
export function llmsProblems(
  outDir: string,
  siteUrl: string,
  routes: ReadonlySet<string>,
  target: LlmsTarget,
): string[] {
  const files = targetFiles(outDir, target);
  const missing = files.filter((file) => !existsSync(file));
  if (missing.length > 0) return missing.map((file) => `${file} is missing.`);
  const [index = ""] = files;
  const { origin } = new URL(siteUrl);
  const links = pageLinks(index);
  if (links.length === 0) return [`${index} links no page.`];
  return links
    .filter(
      (url) =>
        !url.endsWith(".md") ||
        !routes.has(url.slice(origin.length, -".md".length)) ||
        !existsSync(fileOf(outDir, siteUrl, url)),
    )
    .map(
      (url) =>
        `${index} links ${url}, which is not the Markdown copy of a page of /${target.route}.`,
    );
}

/** An MDX comment, which the plugin copies as text, and the lines after it. */
const MDX_COMMENT = /\{\/\*[\s\S]*?\*\/\}\n*/g;

/** Removes the MDX comments from the files of `target`, pages included. */
function tidy(outDir: string, siteUrl: string, target: LlmsTarget): void {
  const files = targetFiles(outDir, target);
  const pages = pageLinks(files[0] ?? "").map((url) =>
    fileOf(outDir, siteUrl, url),
  );
  for (const file of [...files, ...pages]) {
    const text = readFileSync(file, "utf8");
    const tidied = text.replace(MDX_COMMENT, "");
    if (tidied !== text) writeFileSync(file, tidied);
  }
}

/** The docusaurus-plugin-llms options of `target`. */
function pluginOptions(target: LlmsTarget) {
  return {
    docsDir: [{ path: target.folder, routeBasePath: target.route }],
    title: target.title,
    ...(target.description === undefined
      ? {}
      : { description: target.description }),
    ...(target.label === undefined ? {} : { version: target.label }),
    rootContent: target.intro,
    llmsTxtFilename: `${target.route}/llms.txt`,
    llmsFullTxtFilename: `${target.route}/llms-full.txt`,
    generateMarkdownFiles: true,
    // The partials a page imports are inlined; the import lines are noise.
    excludeImports: true,
    // Partials, and the folders of partials, as Docusaurus skips them.
    ignoreFiles: ["_*"],
  };
}

/** The site plugin: docusaurus-plugin-llms once per target, then the check. */
function llmsFiles(
  context: LoadContext,
  targets: readonly LlmsTarget[],
): Plugin {
  const { url, baseUrl } = context.siteConfig;
  const siteUrl = `${url}${baseUrl}`.replace(/\/$/, "");
  return {
    name: "reforged-llms",
    async postBuild(props) {
      const problems: string[] = [];
      for (const target of targets) {
        const prefix = `${baseUrl}${target.route}`;
        const routes = props.routesPaths.filter(
          (route) => route === prefix || route.startsWith(`${prefix}/`),
        );
        await llmsPlugin(context, pluginOptions(target)).postBuild?.({
          ...props,
          content: undefined,
          routesPaths: routes,
        });
        const found = llmsProblems(
          props.outDir,
          siteUrl,
          new Set(routes),
          target,
        );
        if (found.length === 0) tidy(props.outDir, siteUrl, target);
        problems.push(...found);
      }
      if (problems.length > 0) {
        throw new Error(
          `docusaurus-plugin-llms wrote wrong LLM files:\n${problems.map((line) => `- ${line}`).join("\n")}`,
        );
      }
    },
  };
}

/** The site's LLM files for the cut versions `cut`, as a plugin entry. */
export function llmsFilesPlugin(cut: readonly string[]): PluginConfig {
  return (context: LoadContext) => llmsFiles(context, llmsTargets(cut));
}
