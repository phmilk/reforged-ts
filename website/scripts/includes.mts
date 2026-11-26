// The include marker of the docs pages (#979): a line of a page that is
// `{@includeCode <file>[#region]}` and nothing else, outside a code block,
// stands for a fenced block of the code it names, read as the library's
// `{@includeCode}` reads it (a whole file, `#regions`, `:line` ranges), the
// path relative to the page. A guide shows a complete test this way, the
// very file a package compiles and runs, rather than a copy. The docs build
// expands each marker before MDX reads the page (`markdown.preprocessor` in
// config.ts), the LLM files expand the marker the plugin copied as text
// (llms.ts), and a Docs version's cut writes the code into the frozen page
// (version.mts), so that the version keeps the code it was cut with. A
// marker whose file or region does not exist fails each of them.
import { readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative, sep } from "node:path";
import {
  IncludeCodeError,
  includedCode,
} from "../../packages/reforged-ts/scripts/include-code-reader.mts";
import { forEachLine, normalizeNewlines } from "./markdown.mts";

/**
 * An include marker alone on its line, indented by up to three spaces or
 * inside a list item: the indentation is group 1, the target group 2.
 */
const MARKER = /^( *)\{@includeCode\s+([^\s}][^}]*?)\s*\}\s*$/;

/** Whether `text` may hold an include marker: a cheap test before reading it. */
export const mayInclude = (text: string): boolean =>
  text.includes("{@includeCode");

/**
 * The fenced block one marker stands for, its lines indented by `indent`:
 * the included file's extension is the language, and the fence is longer
 * than any run of backticks in the code.
 */
function fencedBlock(
  target: string,
  pageDir: string,
  where: string,
  indent: string,
): string[] {
  const { language, code } = includedCode(target, pageDir, where);
  const longestRun = Math.max(
    2,
    ...(code.match(/`+/g) ?? []).map((run) => run.length),
  );
  const fence = "`".repeat(longestRun + 1);
  return indented(
    [fence + language, ...code.trimEnd().split("\n"), fence],
    indent,
  );
}

/** `lines` each indented by `indent`, a blank line left blank. */
const indented = (lines: readonly string[], indent: string): string[] =>
  lines.map((line) => (line === "" ? "" : indent + line));

/** One include marker of a page. */
interface Marker {
  /** Its indentation. */
  readonly indent: string;
  /** The tag's text after `@includeCode`: `file.ts#region`. */
  readonly target: string;
  /** The marker's line without its indentation. */
  readonly text: string;
  /** Its line of the page, 1-based. */
  readonly line: number;
}

/**
 * The lines of `markdown` with each include marker outside a code block
 * replaced by what `replace` gives for it, or kept when it gives nothing.
 */
function mapMarkers(
  markdown: string,
  replace: (marker: Marker) => readonly string[] | undefined,
): string[] {
  const lines: string[] = [];
  let number = 0;
  forEachLine(normalizeNewlines(markdown), (line, inCode) => {
    number += 1;
    const found = inCode ? null : MARKER.exec(line);
    const [, indent = "", target = ""] = found ?? [];
    const replaced =
      found === null
        ? undefined
        : replace({ indent, target, text: line.trim(), line: number });
    lines.push(...(replaced ?? [line]));
  });
  return lines;
}

/**
 * `markdown` with each include marker replaced by the fenced block of the
 * code it names. `pageDir` is the folder the marker paths resolve against,
 * the page's own; `label` names the page in errors. A marker inside a code
 * block is code, left as it is. Throws an `IncludeCodeError` naming the
 * page and line of a marker whose file, region or lines do not exist.
 */
export function expandIncludes(
  markdown: string,
  pageDir: string,
  label: string,
): string {
  if (!mayInclude(markdown)) return markdown;
  return mapMarkers(markdown, ({ indent, target, line }) =>
    fencedBlock(target, pageDir, `${label}:${String(line)}`, indent),
  ).join("\n");
}

/** A Markdown page of a docs tree. */
const PAGE = /\.mdx?$/;

/** The pages of the docs tree `docs` that hold a marker, `/`-separated. */
async function pagesWithMarkers(docs: string): Promise<string[]> {
  const entries = await readdir(docs, { recursive: true, withFileTypes: true });
  const pages: string[] = [];
  for (const entry of entries) {
    if (!entry.isFile() || !PAGE.test(entry.name)) continue;
    const path = join(entry.parentPath, entry.name);
    if (mayInclude(await readFile(path, "utf8")))
      pages.push(relative(docs, path).split(sep).join("/"));
  }
  return pages.sort();
}

/**
 * Writes the code of each include marker into the pages of the frozen docs
 * tree `frozen`, each marker resolved against the same page of the docs tree
 * `source` it was copied from: the cut of a Docs version keeps the code of
 * its day, and a marker would resolve against another folder from the copy.
 * Returns the pages written, relative to `frozen` and `/`-separated.
 */
export async function freezeIncludes(
  frozen: string,
  source: string,
): Promise<string[]> {
  const written: string[] = [];
  for (const page of await pagesWithMarkers(frozen)) {
    const path = join(frozen, page);
    const text = await readFile(path, "utf8");
    const expanded = expandIncludes(
      text,
      dirname(join(source, page)),
      relative(dirname(frozen), path).split(sep).join("/"),
    );
    if (expanded === text) continue;
    await writeFile(path, expanded);
    written.push(page);
  }
  return written;
}

/**
 * The fenced block each include marker of the docs tree `docs` stands for,
 * by the marker's text without its indentation: the LLM files carry each
 * page's markers as text, under a path that is not the page's. Throws when
 * two pages give one marker text two different blocks, since the text alone
 * could no longer tell them apart.
 */
export async function includeBlocks(
  docs: string,
): Promise<Map<string, string>> {
  const blocks = new Map<string, string>();
  for (const page of await pagesWithMarkers(docs)) {
    const path = join(docs, page);
    mapMarkers(await readFile(path, "utf8"), ({ target, text, line }) => {
      const where = `${page}:${String(line)}`;
      const block = fencedBlock(target, dirname(path), where, "").join("\n");
      const known = blocks.get(text);
      if (known !== undefined && known !== block) {
        throw new IncludeCodeError(
          `${where}: ${text} includes other code than the same marker on another page: give one of them another path`,
        );
      }
      blocks.set(text, block);
      return undefined;
    });
  }
  return blocks;
}

/**
 * `markdown` with each include marker replaced by its block in `blocks`
 * (see `includeBlocks`), indented as the marker is. Returns the markers it
 * found no block for in `missing`.
 */
export function replaceIncludes(
  markdown: string,
  blocks: ReadonlyMap<string, string>,
): { text: string; missing: string[] } {
  const missing: string[] = [];
  const lines = mapMarkers(markdown, ({ indent, text }) => {
    const block = blocks.get(text);
    if (block === undefined) missing.push(text);
    return block === undefined
      ? undefined
      : indented(block.split("\n"), indent);
  });
  return { text: lines.join("\n"), missing };
}
