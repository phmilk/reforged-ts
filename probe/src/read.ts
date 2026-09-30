/**
 * `probe:read`, and the reader the package's other scripts import: finds a
 * Probe's Result file in the game's `CustomMapData` folder, undoes the
 * game's `Preload` wrapper, joins the continuation lines, parses the lines,
 * decodes their values and classifies the Probe run
 * against the runId of the Probe's last build. Read-only.
 */
import { AuthorError } from "./errors.js";
import type { Machine } from "./machine.js";
import { checkProbeName } from "./probes.js";
import { readState } from "./state.js";
import { customMapDataFolder, pathsOf } from "./user-folder.js";

/** How a Probe run ended, as far as its Result file tells. */
export type RunState = "finished" | "not-started";

/** The exit code of `probe:read` for each state. */
export const EXIT_CODES: Readonly<Record<RunState, number>> = {
  finished: 0,
  "not-started": 3,
};

/** The kinds the runner writes; a Probe's own records use any other kind. */
export const RESERVED_KINDS: readonly string[] = [
  "BEGIN",
  "PENDING",
  "ERROR",
  "CHECKPOINT",
  "END",
];

/** One line of a Result file, `<seq> <kind> <key>=<value> ...`, its continuation lines joined. */
export interface ResultLine {
  seq: number;
  kind: string;
  /** The fields, in the order written, each value decoded. */
  fields: readonly (readonly [key: string, value: string])[];
}

/** A Probe run, as its Result file and the Probe's last build tell it. */
export interface ProbeRun {
  probe: string;
  state: RunState;
  /** The Result file, found or not. */
  file: string;
  /** The runId of the Probe's last build. */
  expectedRunId: string;
  /** The runId of the Result file; undefined when there is no file. */
  runId?: string;
  /** The Probe's own records, in order; empty unless the run is the expected one. */
  records: readonly ResultLine[];
}

/** Where `readProbeRun` looks. */
export interface ReadContext {
  machine: Machine;
  /** The folder of the Probes' state files. */
  stateFolder: string;
}

/**
 * Reads the Probe run of `probe`: `not-started` when there is no Result
 * file, or when it holds another run than the Probe's last build;
 * `finished` when it ends with `END status=ok`. A bad name, a Probe never
 * built or a file the game did not write is an AuthorError.
 */
export function readProbeRun(probe: string, context: ReadContext): ProbeRun {
  checkProbeName(probe);
  const state = readState(context.machine, context.stateFolder, probe);
  if (state === undefined) {
    throw new AuthorError(
      `Probe ${probe} has no build to compare the Result file with: run \`pnpm probe:build ${probe}\` first.`,
    );
  }
  const file = resultFile(context.machine, probe);
  const run = { probe, file, expectedRunId: state.runId };
  const text = context.machine.readFile(file);
  if (text === undefined) {
    return { ...run, state: "not-started", records: [] };
  }

  const lines = joinContinuationLines(unwrapPreloadFile(text)).map(
    parseResultLine,
  );
  const begin = lines.at(0);
  const runId = begin?.kind === "BEGIN" ? field(begin, "run") : undefined;
  if (runId === undefined) {
    throw new AuthorError(`${file} does not start with a BEGIN line.`);
  }
  if (runId !== state.runId) {
    return { ...run, runId, state: "not-started", records: [] };
  }
  const last = lines.at(-1);
  if (last?.kind !== "END" || field(last, "status") !== "ok") {
    throw new AuthorError(
      `${file} ends with ${quote(last ? formatLine(last) : "")}, which this reader does not classify yet.`,
    );
  }
  return {
    ...run,
    runId,
    state: "finished",
    records: lines.filter((line) => !RESERVED_KINDS.includes(line.kind)),
  };
}

/** The Result file of `probe`: `reforged-ts\probes\<probe>.txt` in `CustomMapData`. */
export function resultFile(machine: Machine, probe: string): string {
  return pathsOf(machine).join(
    customMapDataFolder(machine),
    "reforged-ts",
    "probes",
    `${probe}.txt`,
  );
}

const HEADER = "function PreloadFiles takes nothing returns nothing";
const PRELOAD_LINE = /^\tcall Preload\( "(.*)" \)$/;

/**
 * The strings `Preload` was given, in order, from the file the game wrote:
 * a fixed JASS function with one `\tcall Preload( "<string>" )` line per
 * string, each `\` doubled (#298, section 2.2). The wrapper's other lines
 * and its `PreloadEnd` value are ignored.
 */
export function unwrapPreloadFile(text: string): string[] {
  const lines = text.split(/\r?\n/);
  if (lines[0] !== HEADER) {
    throw new AuthorError(
      `This is not a file the game's Preload wrote: it does not start with "${HEADER}".`,
    );
  }
  return lines.flatMap((line) => {
    const match = PRELOAD_LINE.exec(line);
    return match ? [match[1].replaceAll("\\\\", "\\")] : [];
  });
}

const CONTINUATION_LINE = /^([1-9][0-9]*)\+ (.*)$/s;

/**
 * The Result file's lines with each continuation line, `<seq>+ <bytes>`,
 * appended to the line before it, which must be the line `<seq>`. The
 * writer splits a line longer than 200 bytes this way before any decoding,
 * so the bytes are joined as they are, a split `%XX` included.
 */
export function joinContinuationLines(strings: readonly string[]): string[] {
  const lines: string[] = [];
  for (const text of strings) {
    const match = CONTINUATION_LINE.exec(text);
    if (!match) {
      lines.push(text);
      continue;
    }
    const previous = lines.at(-1);
    if (previous?.split(" ", 1)[0] !== match[1]) {
      throw new AuthorError(
        `The continuation line ${quote(text)} does not follow the line ${match[1]}.`,
      );
    }
    lines[lines.length - 1] = previous + match[2];
  }
  return lines;
}

/**
 * A value as the writer encodes it: `%XX` escapes and the bytes it keeps as
 * they are, printable ASCII without space, `=`, `%`, `"` or `\`.
 */
const ENCODED_VALUE = /^(?:[!#$&-<>-[\]-~]|%[0-9A-Fa-f]{2})*$/;

/**
 * A kind or a key as the writer writes it: printable ASCII without space,
 * `=`, `%`, `"` or `\`, not empty.
 */
const SAFE_NAME = /^[!#$&-<>-[\]-~]+$/;

/**
 * The value the writer percent-encoded: each `%XX` back to its byte, then
 * the bytes read as UTF-8, where a byte that is not UTF-8 reads as U+FFFD.
 * Undefined when a `%` is not followed by two hexadecimal digits, or when
 * the value holds a character the writer always escapes.
 */
export function decodeValue(value: string): string | undefined {
  if (!ENCODED_VALUE.test(value)) return undefined;
  // What is left besides the escapes is ASCII, one byte per character.
  const bytes = value
    .split(/(%[0-9A-Fa-f]{2})/)
    .flatMap((part) =>
      part.startsWith("%")
        ? [Number.parseInt(part.slice(1), 16)]
        : [...Buffer.from(part, "ascii")],
    );
  return Buffer.from(bytes).toString("utf8");
}

/**
 * Parses one Result file line, `<seq> <kind> <key>=<value> ...`, its
 * continuation lines joined, and decodes its values.
 */
export function parseResultLine(text: string): ResultLine {
  const [seq = "", kind = "", ...pairs] = text.split(" ");
  const fields = pairs.map((pair) => {
    // A pair without its `=`, without a key or with a bad value gets the
    // empty key refused below.
    const equals = pair.indexOf("=");
    if (equals < 1) return ["", pair] as const;
    const value = decodeValue(pair.slice(equals + 1));
    return value === undefined
      ? (["", pair] as const)
      : ([pair.slice(0, equals), value] as const);
  });
  if (
    !/^[1-9][0-9]*$/.test(seq) ||
    !SAFE_NAME.test(kind) ||
    fields.some(([key]) => !SAFE_NAME.test(key))
  ) {
    throw new AuthorError(`Not a Result file line: ${quote(text)}.`);
  }
  return { seq: Number(seq), kind, fields };
}

/** The value of the first field named `key`. */
export function field(line: ResultLine, key: string): string | undefined {
  return line.fields.find(([name]) => name === key)?.[1];
}

/**
 * A character that `probe:read` does not print as it is: a control or
 * format character, a line or paragraph separator, or a space other than
 * U+0020.
 */
const UNPRINTED = /[\p{Cc}\p{Cf}\p{Zl}\p{Zp}]|(?! )\p{Zs}/u;

/**
 * `text` as a JSON string, each character of `UNPRINTED` that JSON leaves
 * as it is escaped as `\uXXXX` too: one line, with no character a terminal
 * acts on, which `JSON.parse` gives back.
 */
export function quote(text: string): string {
  return JSON.stringify(text).replace(
    new RegExp(UNPRINTED.source, "gu"),
    (character) =>
      character
        .split("")
        .map((unit) => `\\u${unit.charCodeAt(0).toString(16).padStart(4, "0")}`)
        .join(""),
  );
}

/**
 * A value as `probe:read` prints it: as it is, or as a JSON string
 * (`quote`) when it is empty or holds a `"`, a space or a character of
 * `UNPRINTED`, so each record stays one line whose fields split on spaces.
 */
export function formatValue(value: string): string {
  return value === "" || /[ "]/.test(value) || UNPRINTED.test(value)
    ? quote(value)
    : value;
}

/**
 * A record as `probe:read` prints it: `<kind> <key>=<value> ...`, each value
 * as `formatValue` gives it.
 */
export function formatLine(line: ResultLine): string {
  return [
    line.kind,
    ...line.fields.map(([key, value]) => `${key}=${formatValue(value)}`),
  ].join(" ");
}

/** What `probe:read` prints: the status line, then one line per record. */
export function formatProbeRun(run: ProbeRun): string {
  return [statusLine(run), ...run.records.map(formatLine)]
    .map((line) => `${line}\n`)
    .join("");
}

function statusLine(run: ProbeRun): string {
  if (run.state === "finished") {
    const count = run.records.length;
    return `finished: Probe ${run.probe}, run ${run.expectedRunId}, ${String(count)} record${count === 1 ? "" : "s"}`;
  }
  return run.runId === undefined
    ? `not-started: no Result file at ${run.file}`
    : `not-started: the Result file is from run ${run.runId}, not from this build's run ${run.expectedRunId}`;
}
