// The collector (#40, #179): writes the generated parts of the docs tree from
// their sources of truth elsewhere in the repository, through one declarative
// list of sources (sources.mts). A source reads the repository and returns
// pages and files; the collector checks that its sources exist, rewrites the
// links of its pages, adds their front matter and "generated from" note, and
// replaces what the previous run wrote. Nothing it writes is edited in place:
// every output is git-ignored, and each run removes what the last one wrote.
import { mkdir, rm, stat, writeFile } from "node:fs/promises";
import { dirname, join, posix } from "node:path";
import { rewriteLinks } from "./markdown.mts";

/** The repository the GitHub links point at, on its default branch. */
export const REPOSITORY = "https://github.com/phmilk/reforged-ts";
const BRANCH = "master";

/** One source of truth the collector copies into the docs tree. */
export interface Source {
  /** What the source is, as reports name it: "the glossary". */
  readonly name: string;
  /**
   * The `/`-separated repository path the source reads, file or folder,
   * checked before `collect` runs. Absent for a source made from what the
   * others find (an index), which always runs.
   */
  readonly from?: string;
  /**
   * Why `from` may legitimately not exist yet ("Changesets writes it at the
   * package's first release"). A missing source with a reason is skipped
   * and reported; one without fails the collector.
   */
  readonly absent?: string;
  /**
   * The docs tree paths, files or folders, the source owns: every page and
   * file it writes is one of them or inside one. The collector removes them
   * before each run, and `.gitignore` must ignore them (a test holds it).
   */
  readonly outputs: readonly string[];
  /** Reads the source from the repository at `root`. */
  collect(root: string): Promise<Collected>;
}

/** What one source writes into the docs tree. */
export interface Collected {
  readonly pages?: readonly Page[];
  /** Files written as they are: category metadata, partials, data. */
  readonly files?: readonly DataFile[];
}

/** A Markdown page of the docs tree, made from repository files. */
export interface Page {
  /** The `/`-separated path under the docs tree. */
  readonly path: string;
  /**
   * The repository files or folders the page is made from, as its note
   * names them. The first one is where the body's links are relative to, as
   * GitHub reads them (`/` is the repository root): a page made from one
   * file is that file's copy, and a link to it or to the folder of an index
   * page lands on the page.
   */
  readonly from: readonly string[];
  readonly title: string;
  readonly position: number;
  readonly sidebarLabel?: string;
  /** The URL path relative to the page's folder, when not its file name. */
  readonly slug?: string;
  /** Markdown, without a first-level heading: the title is the page's. */
  readonly body: string;
}

/** A file of the docs tree written byte for byte. */
export interface DataFile {
  /** The `/`-separated path under the docs tree. */
  readonly path: string;
  readonly text: string;
}

/** What a run of the collector did, source by source. */
export interface Report {
  readonly collected: readonly {
    readonly source: string;
    readonly paths: readonly string[];
  }[];
  readonly skipped: readonly {
    readonly source: string;
    readonly reason: string;
  }[];
}

/**
 * A source that cannot be collected: required and missing, or read and
 * found wrong. The collector gathers them all before failing.
 */
export class SourceError extends Error {
  override name = "SourceError";
}

/** The collector failed: `problems` name each source and what is wrong. */
export class CollectError extends Error {
  override name = "CollectError";
  readonly problems: readonly string[];
  constructor(problems: readonly string[]) {
    super(
      `docs:collect failed:\n${problems.map((problem) => `- [ ] ${problem}`).join("\n")}`,
    );
    this.problems = problems;
  }
}

export interface CollectOptions {
  /** The repository root. */
  readonly root: string;
  /** The docs tree the sources write into. */
  readonly docs: string;
  readonly sources: readonly Source[];
}

/**
 * Collects every source into the docs tree. Every source is read before
 * anything is written; when one fails, the tree is left as it was and a
 * CollectError names each failure. Otherwise every source's outputs are
 * removed, then the pages and files are written.
 */
export async function collect(options: CollectOptions): Promise<Report> {
  const { root, docs, sources } = options;
  const problems: string[] = [];
  const written: { source: Source; collected: Collected }[] = [];
  const skipped: { source: string; reason: string }[] = [];

  for (const source of sources) {
    if (source.from !== undefined && !(await exists(join(root, source.from)))) {
      if (source.absent === undefined) {
        problems.push(`${source.name}: \`${source.from}\` does not exist.`);
      } else {
        skipped.push({ source: source.name, reason: source.absent });
      }
      continue;
    }
    try {
      written.push({ source, collected: await source.collect(root) });
    } catch (error) {
      if (!(error instanceof SourceError)) throw error;
      problems.push(`${source.name}: ${error.message}`);
    }
  }
  problems.push(...ownership(written));
  if (problems.length > 0) throw new CollectError(problems);

  const links = await linkTargets(root, written);
  for (const output of sources.flatMap((source) => source.outputs)) {
    await rm(join(docs, output), { recursive: true, force: true });
  }
  const collected = [];
  for (const { source, collected: result } of written) {
    const paths: string[] = [];
    for (const page of result.pages ?? []) {
      await writeText(docs, page.path, render(page, links));
      paths.push(page.path);
    }
    for (const file of result.files ?? []) {
      await writeText(docs, file.path, file.text);
      paths.push(file.path);
    }
    collected.push({ source: source.name, paths });
  }
  return { collected, skipped };
}

/**
 * A problem for each path written outside its source's outputs or by two
 * sources: either would survive the next run or be overwritten silently.
 */
function ownership(
  written: readonly { source: Source; collected: Collected }[],
): string[] {
  const problems: string[] = [];
  const writers = new Map<string, string>();
  for (const { source, collected } of written) {
    for (const { path } of [
      ...(collected.pages ?? []),
      ...(collected.files ?? []),
    ]) {
      if (!source.outputs.some((output) => within(path, output))) {
        problems.push(
          `${source.name}: \`${path}\` is not one of its outputs (${source.outputs.join(", ")}).`,
        );
      }
      const writer = writers.get(path);
      if (writer !== undefined) {
        problems.push(
          `${source.name}: \`${path}\` is written by ${writer} too.`,
        );
      }
      writers.set(path, source.name);
    }
  }
  return problems;
}

function within(path: string, output: string): boolean {
  return path === output || path.startsWith(`${output.replace(/\/$/, "")}/`);
}

/**
 * What a page's links can land on: each repository path a page is made from
 * alone (a copied file, the folder of an index) mapped to that page; and
 * which paths pages are made from are folders, for their GitHub URLs.
 */
interface LinkTargets {
  readonly pages: ReadonlyMap<string, string>;
  readonly folders: ReadonlySet<string>;
}

async function linkTargets(
  root: string,
  written: readonly { collected: Collected }[],
): Promise<LinkTargets> {
  const pages = new Map<string, string>();
  const folders = new Set<string>();
  for (const page of written.flatMap(
    ({ collected }) => collected.pages ?? [],
  )) {
    for (const from of page.from) {
      if (await isFolder(join(root, from))) folders.add(from);
    }
    const only = page.from.length === 1 ? page.from[0] : undefined;
    if (only !== undefined && !pages.has(only)) pages.set(only, page.path);
  }
  return { pages, folders };
}

/** The page's file: its front matter, its note, its body with links rewritten. */
function render(page: Page, links: LinkTargets): string {
  const base = page.from[0] ?? "";
  const baseUrl = githubUrl(base, links.folders.has(base) || base === "");
  const body = rewriteLinks(page.body, (destination) =>
    rewriteLink(destination, baseUrl, page.path, links),
  );
  const sources = page.from.map(
    (from) => `[\`${from}\`](${githubUrl(from, links.folders.has(from))})`,
  );
  // A copy is edited in its source; a page made from several files or from
  // a folder is edited nowhere.
  const only = page.from.length === 1 ? page.from[0] : undefined;
  const editUrl =
    only === undefined ||
    links.folders.has(only) ||
    links.pages.get(only) !== page.path
      ? "null"
      : githubUrl(only, false);
  const frontMatter = [
    "---",
    `# Generated by docs:collect from ${page.from.join(", ") || "the repository"}: edit the source, not this file.`,
    `title: ${JSON.stringify(page.title)}`,
    ...(page.sidebarLabel === undefined
      ? []
      : [`sidebar_label: ${JSON.stringify(page.sidebarLabel)}`]),
    `sidebar_position: ${String(page.position)}`,
    ...(page.slug === undefined ? [] : [`slug: ${JSON.stringify(page.slug)}`]),
    `custom_edit_url: ${editUrl}`,
    // Plain Markdown, as GitHub renders the source: `<` and `{` are text.
    "format: md",
    "---",
  ];
  const note = [
    ":::note[Generated page]",
    `This page is generated from ${sources.join(", ") || "the repository"} by \`docs:collect\`. Edit the source, not this page.`,
    ":::",
  ];
  return `${[...frontMatter, "", ...note, "", body.trim()].join("\n")}\n`;
}

/**
 * The destination a page's link gets: the relative path of the page made
 * from its target, anchor kept, when the target is collected; else the
 * target's GitHub URL. Absolute URLs and same-page anchors are kept.
 */
function rewriteLink(
  destination: string,
  baseUrl: string,
  pagePath: string,
  links: LinkTargets,
): string | undefined {
  if (/^[a-z][a-z\d+.-]*:|^\/\/|^#/i.test(destination)) return undefined;
  const repositoryUrl = new URL(`${REPOSITORY}/`);
  const url = destination.startsWith("/")
    ? new URL(destination.slice(1), `${REPOSITORY}/blob/${BRANCH}/`)
    : new URL(destination, baseUrl);
  const prefix = /^\/[^/]+\/[^/]+\/(?:blob|tree)\/[^/]+\/(.*)$/.exec(
    url.pathname,
  );
  if (url.origin !== repositoryUrl.origin || prefix?.[1] === undefined) {
    return url.href;
  }
  const target = decodeURIComponent(prefix[1]).replace(/\/$/, "");
  const page = links.pages.get(target);
  if (page !== undefined) {
    let relative = posix.relative(posix.dirname(pagePath), page);
    if (!relative.startsWith(".")) relative = `./${relative}`;
    return relative + url.hash;
  }
  // GitHub serves a folder's `blob` URL as its `tree` page.
  return url.href;
}

/** The GitHub page of a repository path; the repository's for "". */
function githubUrl(path: string, folder: boolean): string {
  if (path === "") return `${REPOSITORY}/tree/${BRANCH}/`;
  const encoded = path.split("/").map(encodeURIComponent).join("/");
  return `${REPOSITORY}/${folder ? "tree" : "blob"}/${BRANCH}/${encoded}${folder ? "/" : ""}`;
}

async function writeText(docs: string, path: string, text: string) {
  const target = join(docs, path);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, text);
}

async function exists(path: string): Promise<boolean> {
  return (await stat(path).catch(() => undefined)) !== undefined;
}

async function isFolder(path: string): Promise<boolean> {
  return (await stat(path).catch(() => undefined))?.isDirectory() ?? false;
}
