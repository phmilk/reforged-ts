/**
 * The Studio's diffs (#834): the working state's files against the saved
 * state's (the unsaved changes), or against the files at `HEAD` (the
 * changes since the last commit), each Object data file in the text of
 * `reforged-map`'s `textconv` function, the one `git diff` shows with the
 * `textconv` driver, and `war3map.wts` and the locales' tables in their own
 * text; the hunks are `git diff`'s, three lines of context.
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { objectDataText } from "reforged-map";
import type { FileDiff } from "./api-types.js";

/** The lines of context around a change, as `git diff` gives. */
const CONTEXT = 3;

/** A text file of the map folder: a `.wts` string table, read as UTF-8 text. */
const TEXT_FILE = /\.wts$/i;

/** One line of an edit script: kept, removed or added. */
interface Line {
  readonly op: " " | "-" | "+";
  readonly text: string;
}

/**
 * The text a file of the map folder is compared in: an Object data file's
 * through `objectDataText`, a string table's as UTF-8, any other file's as
 * `objectDataText` prints a file it cannot read, a hex dump.
 *
 * @param file - The file's path in the map folder, with `/`.
 * @param bytes - Its bytes.
 * @returns Its text.
 */
export function textOf(file: string, bytes: Uint8Array): string {
  if (TEXT_FILE.test(file)) return new TextDecoder("utf-8").decode(bytes);
  return objectDataText(bytes, file);
}

/** The lines of a text, without the empty one after its last line break. */
function linesOf(text: string | undefined): string[] {
  if (text === undefined || text === "") return [];
  const lines = text.split(/\r?\n/);
  if (lines.at(-1) === "") lines.pop();
  return lines;
}

/**
 * The shortest edit script from `a` to `b`, by Myers' algorithm: the
 * lines kept, removed and added, in order. Each round keeps only the
 * diagonals it reached, so a small change to a long file stays small.
 */
function editScript(a: readonly string[], b: readonly string[]): Line[] {
  const n = a.length;
  const m = b.length;
  if (n === 0) return b.map((text) => ({ op: "+", text }));
  if (m === 0) return a.map((text) => ({ op: "-", text }));
  const max = n + m;
  // v[k] is the furthest x on diagonal k; trace[d] keeps the v of round d.
  let v = new Map<number, number>([[1, 0]]);
  const trace: Map<number, number>[] = [];
  let found = false;
  for (let d = 0; d <= max && !found; d++) {
    trace.push(v);
    const next = new Map(v);
    for (let k = -d; k <= d; k += 2) {
      const down =
        k === -d ||
        (k !== d && (next.get(k - 1) ?? -1) < (next.get(k + 1) ?? -1));
      let x = down ? (next.get(k + 1) ?? 0) : (next.get(k - 1) ?? 0) + 1;
      let y = x - k;
      while (x < n && y < m && a[x] === b[y]) {
        x++;
        y++;
      }
      next.set(k, x);
      if (x >= n && y >= m) {
        found = true;
        break;
      }
    }
    v = next;
  }
  const lines: Line[] = [];
  let x = n;
  let y = m;
  for (let d = trace.length - 1; d >= 0; d--) {
    const round = trace[d] ?? new Map<number, number>();
    const k = x - y;
    const down =
      k === -d ||
      (k !== d && (round.get(k - 1) ?? -1) < (round.get(k + 1) ?? -1));
    const previousK = down ? k + 1 : k - 1;
    const previousX = round.get(previousK) ?? 0;
    const previousY = previousX - previousK;
    while (x > previousX && y > previousY) {
      lines.push({ op: " ", text: a[x - 1] ?? "" });
      x--;
      y--;
    }
    if (d > 0) {
      if (x === previousX) {
        lines.push({ op: "+", text: b[y - 1] ?? "" });
        y--;
      } else {
        lines.push({ op: "-", text: a[x - 1] ?? "" });
        x--;
      }
    }
  }
  return lines.reverse();
}

/** A hunk's range in a file, as its header gives it: `12,4`, `0,0` before the first line. */
function range(start: number, count: number): string {
  const from = count === 0 ? start - 1 : start;
  return count === 1 ? String(from) : `${String(from)},${String(count)}`;
}

/**
 * The unified diff of two versions of a text, as `git diff` prints it:
 * the `---` and `+++` lines, then hunks of the changed lines with
 * {@link CONTEXT} lines around them. Empty when the texts have the same
 * lines.
 *
 * @param file - The file's path, which the `---` and `+++` lines name.
 * @param before - The text before; undefined when the file did not exist.
 * @param after - The text after; undefined when the file does not exist.
 * @returns The diff, each line ending with a line break.
 */
export function unifiedDiff(
  file: string,
  before: string | undefined,
  after: string | undefined,
): string {
  const lines = editScript(linesOf(before), linesOf(after));
  if (lines.every((line) => line.op === " ")) return "";
  // The ranges of lines to show: each change with its context, merged.
  const shown: [number, number][] = [];
  lines.forEach((line, index) => {
    if (line.op === " ") return;
    const from = Math.max(0, index - CONTEXT);
    const to = Math.min(lines.length, index + CONTEXT + 1);
    const last = shown.at(-1);
    if (last !== undefined && from <= last[1]) last[1] = Math.max(last[1], to);
    else shown.push([from, to]);
  });
  let out = `--- ${before === undefined ? "/dev/null" : `a/${file}`}\n+++ ${after === undefined ? "/dev/null" : `b/${file}`}\n`;
  // The line numbers, from 1, of each script line in the old and new text.
  let oldLine = 1;
  let newLine = 1;
  let at = 0;
  for (const [from, to] of shown) {
    for (; at < from; at++) {
      const line = lines[at];
      if (line.op !== "+") oldLine++;
      if (line.op !== "-") newLine++;
    }
    const hunk = lines.slice(from, to);
    const oldCount = hunk.filter((line) => line.op !== "+").length;
    const newCount = hunk.filter((line) => line.op !== "-").length;
    out += `@@ -${range(oldLine, oldCount)} +${range(newLine, newCount)} @@\n`;
    for (const line of hunk) out += `${line.op}${line.text}\n`;
    oldLine += oldCount;
    newLine += newCount;
    at = to;
  }
  return out;
}

/** Whether two byte arrays hold the same bytes. */
function sameBytes(a: Uint8Array | undefined, b: Uint8Array | undefined) {
  if (a === undefined || b === undefined) return a === b;
  return Buffer.compare(a, b) === 0;
}

/**
 * The diff of each file that differs between two sets of a map folder's
 * files, sorted by path.
 *
 * @param before - A reader of the files before, by path in the map folder
 *   with `/`, which gives undefined for a file that did not exist.
 * @param after - The files after.
 * @param files - The paths to compare.
 * @returns Each file whose bytes differ, with its diff.
 */
export function diffFiles(
  before: (file: string) => Uint8Array | undefined,
  after: ReadonlyMap<string, Uint8Array>,
  files: readonly string[],
): FileDiff[] {
  const diffs: FileDiff[] = [];
  for (const file of [...new Set(files)].sort()) {
    const from = before(file);
    const to = after.get(file);
    if (sameBytes(from, to)) continue;
    const diff = unifiedDiff(
      file,
      from === undefined ? undefined : textOf(file, from),
      to === undefined ? undefined : textOf(file, to),
    );
    if (diff !== "") diffs.push({ file, diff });
  }
  return diffs;
}

/** The output of a git command run in a folder, as bytes; undefined when it fails. */
function git(
  folder: string,
  args: readonly string[],
  input?: string,
): Buffer | undefined {
  try {
    return execFileSync("git", ["-C", folder, ...args], {
      stdio: [input === undefined ? "ignore" : "pipe", "pipe", "ignore"],
      ...(input !== undefined && { input }),
      maxBuffer: 256 * 1024 * 1024,
    });
  } catch {
    return undefined;
  }
}

/**
 * The objects `git cat-file --batch` printed, in the order asked: each
 * one's bytes, undefined for one it reports missing.
 */
function batchObjects(output: Buffer, count: number): (Buffer | undefined)[] {
  const objects: (Buffer | undefined)[] = [];
  let at = 0;
  while (objects.length < count && at < output.length) {
    const end = output.indexOf(0x0a, at);
    if (end === -1) break;
    const header = output.subarray(at, end).toString("utf8").split(" ");
    at = end + 1;
    if (header.length !== 3) {
      objects.push(undefined);
      continue;
    }
    const size = Number(header[2]);
    objects.push(output.subarray(at, at + size));
    at += size + 1;
  }
  return objects;
}

/**
 * Some files of a map folder at `HEAD` of the git repository that holds it,
 * read in one `git cat-file --batch` as `git show HEAD:<path>` reads each;
 * undefined when the map folder is in no git repository, or git cannot be
 * run.
 *
 * @param mapFolder - The map folder, an absolute path.
 * @param files - The files to read, by path in the map folder with `/`.
 * @returns A reader of a file at `HEAD` by its path in the map folder,
 *   which gives undefined for a file `HEAD` does not hold.
 */
export function headFiles(
  mapFolder: string,
  files: readonly string[],
): ((file: string) => Uint8Array | undefined) | undefined {
  const top = git(mapFolder, ["rev-parse", "--show-toplevel"])
    ?.toString("utf8")
    .trim();
  if (top === undefined || top === "") return undefined;
  let prefix: string;
  try {
    prefix = path
      .relative(fs.realpathSync(top), fs.realpathSync(mapFolder))
      .split(path.sep)
      .join("/");
  } catch {
    return undefined;
  }
  const names = [...new Set(files)];
  const output =
    names.length === 0
      ? Buffer.alloc(0)
      : git(
          top,
          ["cat-file", "--batch"],
          names
            .map(
              (file) => `HEAD:${prefix === "" ? file : `${prefix}/${file}`}\n`,
            )
            .join(""),
        );
  // No HEAD yet (a repository without a commit) holds no file.
  const objects = batchObjects(output ?? Buffer.alloc(0), names.length);
  const byName = new Map(names.map((name, index) => [name, objects[index]]));
  return (file) => byName.get(file);
}
