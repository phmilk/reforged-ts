// The build's last step: expands every `{@includeCode}` of the emitted
// declarations into a fenced block holding the included code, so a Map
// project author hovering a symbol in the editor reads the example rather
// than the tag. TypeDoc resolves the tag for the docs site from the sources,
// which keep it; this reads the same forms TypeDoc reads (a whole file, one
// or more `#regions`, `:line` ranges), the path relative to the source file
// holding the comment. An include whose file, region or lines do not exist
// fails the build. Exit code 0 when every declaration file was expanded, 1
// on an include that cannot be, 2 on arguments.
import { readFileSync, statSync } from "node:fs";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, extname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

export interface Output {
  stdout: (text: string) => void;
  stderr: (text: string) => void;
}

export const PROCESS_OUTPUT: Output = {
  stdout: (text) => process.stdout.write(text),
  stderr: (text) => process.stderr.write(text),
};

/** An include that cannot be expanded; the message names its file and line. */
export class IncludeCodeError extends Error {
  override name = "IncludeCodeError";
}

/** One `{@includeCode target}` tag; the target is group 1. */
const TAG = /\{@includeCode(?:\s+([^}]*))?\}/g;

/** A line inside a multi-line doc comment: its prefix, as `     * `. */
const COMMENT_LINE = /^\s*\*(?!\/) ?/;

/** A titled `@example` tag line: the prefix is group 1, the title group 2. */
const TITLED_EXAMPLE = /^(\s*\* ?)@example\s+(\S.*?)\s*$/;

/** A line ending the body of a tag: the next block tag or the comment end. */
const BODY_END = /^\s*(?:\*\s*@|\*\/)/;

/**
 * TypeDoc's region markers for TypeScript, `// #region name` and
 * `// #endregion name`: the name is required on both, the marker lines are
 * left out.
 */
const REGION_MARKERS: Readonly<
  Record<string, (name: string) => [start: RegExp, end: RegExp]>
> = {
  ts: (name) => [
    new RegExp(`// *#region  *${name} *\n`, "g"),
    new RegExp(`// *#endregion  *${name} *\n`, "g"),
  ],
};

/**
 * Expands the includes of every declaration file under `declarationsDir`,
 * in place, each against the source file it was emitted from (the same path
 * under `sourcesDir`, `.ts` for `.d.ts`). Returns the files that held one,
 * relative to `declarationsDir` and slash-separated, sorted.
 */
export async function expandDeclarations(
  declarationsDir: string,
  sourcesDir: string,
): Promise<string[]> {
  const files = (await readdir(declarationsDir, { recursive: true }))
    .map((file) => file.split("\\").join("/"))
    .filter((file) => file.endsWith(".d.ts"))
    .sort();
  const expanded: string[] = [];
  for (const file of files) {
    const path = join(declarationsDir, file);
    const text = await readFile(path, "utf8");
    if (!text.includes("@includeCode")) continue;
    const source = join(sourcesDir, file.replace(/\.d\.ts$/, ".ts"));
    await writeFile(path, expandIncludeCode(text, dirname(source), file));
    expanded.push(file);
  }
  return expanded;
}

/**
 * Replaces each `{@includeCode}` of a declaration file's doc comments with
 * a fenced block of the included code, every line carrying the comment's
 * prefix. The title of an `@example` whose body holds an include moves to
 * the next line: TypeScript cuts each line after `@example <title>` up to
 * the title's column, which would drop the code's indentation in the hover.
 * `sourceDir` is the folder the include paths resolve against; `label`
 * names the file in errors.
 */
export function expandIncludeCode(
  text: string,
  sourceDir: string,
  label: string,
): string {
  const newline = text.includes("\r\n") ? "\r\n" : "\n";
  return text
    .split(/\r?\n/)
    .flatMap((line, index, lines) => {
      const titled = TITLED_EXAMPLE.exec(line);
      if (titled !== null && includesCode(lines, index + 1)) {
        const [, prefix = "", title = ""] = titled;
        return [prefix + "@example", prefix + title];
      }
      if (!line.includes("@includeCode")) return [line];
      const where = `${label}:${String(index + 1)}`;
      const prefix = COMMENT_LINE.exec(line)?.[0];
      if (prefix === undefined) {
        throw new IncludeCodeError(
          `${where}: {@includeCode} must stand on a line of a multi-line doc comment`,
        );
      }
      // split with a capturing group alternates text and tag targets.
      const parts = line.slice(prefix.length).split(TAG);
      return parts.flatMap((part, position) => {
        if (position % 2 === 1) {
          return fencedBlock(includedCode(part, sourceDir, where), prefix);
        }
        if (part.includes("@includeCode")) {
          throw new IncludeCodeError(
            `${where}: a malformed {@includeCode} tag: ${part.trim()}`,
          );
        }
        return part.trim() === "" ? [] : [prefix + part.trim()];
      });
    })
    .join(newline);
}

/** Whether the tag body starting at line `from` holds an `{@includeCode}`. */
function includesCode(lines: readonly string[], from: number): boolean {
  for (const line of lines.slice(from)) {
    if (BODY_END.test(line)) return false;
    if (line.includes("@includeCode")) return true;
  }
  return false;
}

interface IncludedCode {
  /** The fence's language: the included file's extension. */
  language: string;
  code: string;
}

/** Reads what one tag includes, as TypeDoc does. */
function includedCode(
  target: string | undefined,
  sourceDir: string,
  where: string,
): IncludedCode {
  const spec = target?.trim() ?? "";
  if (spec === "") {
    throw new IncludeCodeError(`${where}: {@includeCode} names no file`);
  }
  let filename = spec;
  let regions: string | undefined;
  let lines: string | undefined;
  if (spec.includes("#")) {
    [filename = "", regions] = spec.split("#");
  } else if (spec.includes(":")) {
    [filename = "", lines] = spec.split(":");
  }
  const file = resolve(sourceDir, filename);
  if (!isFile(file)) {
    throw new IncludeCodeError(
      `${where}: {@includeCode ${spec}} resolved to ${file}, which does not exist`,
    );
  }
  const text = readFileSync(file, "utf8").replaceAll("\r\n", "\n");
  const language = extname(file).slice(1);
  const code =
    regions !== undefined
      ? regionsOf(text, language, regions, `${where}: {@includeCode ${spec}}`)
      : lines !== undefined
        ? linesOf(text, lines, `${where}: {@includeCode ${spec}}`)
        : text;
  return { language, code };
}

function isFile(path: string): boolean {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
}

/** The named regions, comma-separated, each dedented, concatenated. */
function regionsOf(
  text: string,
  language: string,
  names: string,
  tag: string,
): string {
  const markers = REGION_MARKERS[language];
  if (markers === undefined) {
    throw new IncludeCodeError(
      `${tag}: regions of .${language} files are not supported`,
    );
  }
  return names
    .split(",")
    .map((name) => name.trim())
    .map((name) => {
      const [startMarker, endMarker] = markers(escapeRegExp(name));
      const starts = text.match(startMarker) ?? [];
      const ends = text.match(endMarker) ?? [];
      const [start] = starts;
      const [end] = ends;
      if (start === undefined || end === undefined) {
        throw new IncludeCodeError(
          `${tag}: region ${name} ${start === undefined ? "was not found" : "is not closed"}`,
        );
      }
      if (starts.length > 1 || ends.length > 1) {
        throw new IncludeCodeError(
          `${tag}: region ${name} is marked more than once`,
        );
      }
      return dedent(
        text.slice(text.indexOf(start) + start.length, text.indexOf(end)),
      );
    })
    .map((region) => region + "\n")
    .join("");
}

/** The lines, 1-based: `3-6`, `3,5`, or both, as `3-6,9`. */
function linesOf(text: string, ranges: string, tag: string): string {
  const lines = text.split(/\r\n|\r|\n/);
  return ranges
    .split(",")
    .map((range) => {
      const match = /^\s*(\d+)(?:\s*-\s*(\d+))?\s*$/.exec(range);
      const first = Number(match?.[1]);
      const last = match?.[2] === undefined ? first : Number(match[2]);
      if (match === null || first < 1 || first > last) {
        throw new IncludeCodeError(`${tag}: ${range} is not a line range`);
      }
      if (last > lines.length) {
        throw new IncludeCodeError(
          `${tag}: asks for line ${String(last)} of a file of ${String(lines.length)} lines`,
        );
      }
      return lines.slice(first - 1, last).join("\n") + "\n";
    })
    .join("");
}

/** Drops the leading and trailing blank lines and the common indentation. */
function dedent(text: string): string {
  const lines = text.split("\n");
  while (lines.length > 0 && lines[0]?.trim() === "") lines.shift();
  while (lines.length > 0 && lines.at(-1)?.trim() === "") lines.pop();
  const indent = Math.min(
    ...lines
      .filter((line) => line.trim() !== "")
      .map((line) => line.search(/\S/)),
  );
  return lines.map((line) => line.slice(indent)).join("\n");
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
}

/**
 * The code as a fenced block, one comment line per line of code. The fence
 * is longer than any run of backticks in the code, and a backslash goes
 * between the two characters of each comment end in the code, so neither the
 * block nor the comment ends early.
 */
function fencedBlock(
  { language, code }: IncludedCode,
  prefix: string,
): string[] {
  const body = code.trimEnd().split("\n");
  const longestRun = Math.max(
    2,
    ...(code.match(/`+/g) ?? []).map((run) => run.length),
  );
  const fence = "`".repeat(longestRun + 1);
  return [
    fence + language,
    ...body.map((line) => line.replaceAll("*/", "*\\/")),
    fence,
  ].map((line) => (line === "" ? prefix.trimEnd() : prefix + line));
}

export async function main(
  args: readonly string[],
  output: Output,
): Promise<number> {
  const [declarationsDir, sourcesDir, ...rest] = args;
  if (
    declarationsDir === undefined ||
    sourcesDir === undefined ||
    rest.length > 0
  ) {
    output.stderr(
      "Usage: include-code.mts <declarations folder> <sources folder>\n",
    );
    return 2;
  }
  try {
    const expanded = await expandDeclarations(declarationsDir, sourcesDir);
    output.stdout(
      `include-code: {@includeCode} expanded in ${String(expanded.length)} declaration files.\n`,
    );
    return 0;
  } catch (error) {
    if (!(error instanceof IncludeCodeError)) throw error;
    output.stderr(`include-code: ${error.message}\n`);
    return 1;
  }
}

const script = process.argv.at(1);
if (
  script !== undefined &&
  pathToFileURL(resolve(script)).href === import.meta.url
) {
  process.exitCode = await main(process.argv.slice(2), PROCESS_OUTPUT);
}
