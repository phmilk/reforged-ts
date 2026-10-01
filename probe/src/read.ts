/**
 * `probe:read`, and the reader the package's other scripts import: finds a
 * Probe's Result file in the game's `CustomMapData` folder, undoes the
 * game's `Preload` wrapper, joins the continuation lines, parses the lines,
 * decodes their values and classifies the Probe run
 * against the runId of the Probe's last build. Read-only: it reads the file,
 * and on Windows the process list, and writes or stops nothing.
 */
import { AuthorError } from "./errors.js";
import { GAME_IMAGE_NAME } from "./game.js";
import type { Machine } from "./machine.js";
import { checkProbeName } from "./probes.js";
import { readState } from "./state.js";
import { customMapDataFolder, pathsOf } from "./user-folder.js";

/**
 * How a Probe run ended, as far as its Result file tells. A run whose file
 * ends with its last checkpoint is `incomplete`; on Windows, the process
 * list refines it to `running` or `crashed`.
 */
export type RunState =
  "finished" | "incomplete" | "running" | "crashed" | "not-started";

/**
 * The exit code of `probe:read` for each state: `incomplete`, `running`
 * and `crashed` share 2.
 */
export const EXIT_CODES: Readonly<Record<RunState, number>> = {
  finished: 0,
  incomplete: 2,
  running: 2,
  crashed: 2,
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
  /**
   * The label of the file's last `PENDING` line, the step a crash stopped
   * in; undefined when there is none, and unless the run is the expected
   * one.
   */
  pending?: string;
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
 * `finished` when it ends with `END status=ok`; when it ends with
 * `CHECKPOINT`, `running` or `crashed` on Windows, as a process of
 * `Warcraft III.exe` runs or not, and `incomplete` elsewhere, with the
 * label of the last `PENDING` line. Of a file of another run, only the
 * BEGIN line is parsed. A bad name, a Probe never built or a file the game
 * did not write is an AuthorError. Reads only: the file, the Probe's state
 * file and, for a run that ends with a checkpoint on Windows, the process
 * list.
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

  // Only the BEGIN line is parsed before the runId is compared: the rest of
  // a file of another run, maybe written by an older runner, is not read.
  const texts = joinContinuationLines(unwrapPreloadFile(text));
  const first = texts.at(0);
  const begin = first === undefined ? undefined : parseResultLine(first);
  const runId = begin?.kind === "BEGIN" ? field(begin, "run") : undefined;
  if (begin === undefined || runId === undefined) {
    throw new AuthorError(`${file} does not start with a BEGIN line.`);
  }
  if (runId !== state.runId) {
    return { ...run, runId, state: "not-started", records: [] };
  }
  const lines = [begin, ...texts.slice(1).map(parseResultLine)];
  const records = lines.filter((line) => !RESERVED_KINDS.includes(line.kind));
  const last = lines.at(-1);
  if (last?.kind === "END" && field(last, "status") === "ok") {
    return { ...run, runId, state: "finished", records };
  }
  if (last?.kind === "CHECKPOINT") {
    const pendingLine = lines.findLast((line) => line.kind === "PENDING");
    const pending = pendingLine && field(pendingLine, "label");
    return {
      ...run,
      runId,
      state: incompleteState(context.machine),
      records,
      ...(pending !== undefined && { pending }),
    };
  }
  throw new AuthorError(
    `${file} ends with ${quote(last ? formatLine(last) : "")}, which this reader does not classify yet.`,
  );
}

/**
 * The state of a run whose Result file ends with a checkpoint: on Windows,
 * `running` while a process of the game's image runs, else `crashed`;
 * elsewhere `incomplete`, as no process is looked for there.
 */
function incompleteState(machine: Machine): RunState {
  if (machine.platform !== "win32") return "incomplete";
  return machine.isRunning(GAME_IMAGE_NAME) ? "running" : "crashed";
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
 * The bytes the writer keeps as they are, as a regular expression character
 * class: printable ASCII without space, `=`, `%`, `"` or `\`. A kind or a
 * key is made of them only, a value of them and `ESCAPE`s.
 */
const KEPT = String.raw`[!#$&-<>-[\]-~]`;

/**
 * A `%XX` escape as the writer writes it: two uppercase hexadecimal digits,
 * of a byte it escapes (one outside printable ASCII, space, `"`, `%`, `=`
 * or `\`), never of a byte of `KEPT`.
 */
const ESCAPE = "%(?:[01][0-9A-F]|2[025]|3D|5C|7F|[89A-F][0-9A-F])";

/** A value as the writer encodes it: bytes of `KEPT` and `ESCAPE`s. */
const ENCODED_VALUE = new RegExp(`^(?:${KEPT}|${ESCAPE})*$`);

/** A kind or a key as the writer writes it: bytes of `KEPT`, not empty. */
const SAFE_NAME = new RegExp(`^${KEPT}+$`);

/**
 * The value the writer percent-encoded: each `%XX` back to its byte, then
 * the bytes read as UTF-8, where each byte outside a valid UTF-8 sequence
 * reads as its `%XX` escape, in uppercase, so no byte is lost. Undefined
 * when the value holds anything the writer does not write: a character it
 * always escapes, a `%` without two uppercase hexadecimal digits, or the
 * escape of a byte it keeps as it is.
 */
export function decodeValue(value: string): string | undefined {
  if (!ENCODED_VALUE.test(value)) return undefined;
  // What is left besides the escapes is ASCII, one byte per character.
  const bytes = value
    .split(/(%[0-9A-F]{2})/)
    .flatMap((part) =>
      part.startsWith("%")
        ? [Number.parseInt(part.slice(1), 16)]
        : [...Buffer.from(part, "ascii")],
    );
  return decodeUtf8(bytes);
}

type ByteRange = readonly [low: number, high: number];

/**
 * The well-formed UTF-8 sequences, as the Unicode Standard's table 3-7
 * lists them (no overlong form, no surrogate, nothing above U+10FFFF): the
 * range of the first byte, then the range of each byte after it.
 */
const UTF8_SEQUENCES: readonly (readonly [ByteRange, ...ByteRange[]])[] = [
  [[0x00, 0x7f]],
  [
    [0xc2, 0xdf],
    [0x80, 0xbf],
  ],
  [
    [0xe0, 0xe0],
    [0xa0, 0xbf],
    [0x80, 0xbf],
  ],
  [
    [0xe1, 0xec],
    [0x80, 0xbf],
    [0x80, 0xbf],
  ],
  [
    [0xed, 0xed],
    [0x80, 0x9f],
    [0x80, 0xbf],
  ],
  [
    [0xee, 0xef],
    [0x80, 0xbf],
    [0x80, 0xbf],
  ],
  [
    [0xf0, 0xf0],
    [0x90, 0xbf],
    [0x80, 0xbf],
    [0x80, 0xbf],
  ],
  [
    [0xf1, 0xf3],
    [0x80, 0xbf],
    [0x80, 0xbf],
    [0x80, 0xbf],
  ],
  [
    [0xf4, 0xf4],
    [0x80, 0x8f],
    [0x80, 0xbf],
    [0x80, 0xbf],
  ],
];

/** The length of the well-formed UTF-8 sequence at `index`, or 0 when none starts there. */
function utf8SequenceLength(bytes: readonly number[], index: number): number {
  const sequence = UTF8_SEQUENCES.find((ranges) =>
    ranges.every(([low, high], offset) => {
      const byte = bytes.at(index + offset);
      return byte !== undefined && byte >= low && byte <= high;
    }),
  );
  return sequence?.length ?? 0;
}

/**
 * The bytes as UTF-8 text, each byte outside a well-formed UTF-8 sequence
 * as its `%XX` escape, two uppercase hexadecimal digits.
 */
function decodeUtf8(bytes: readonly number[]): string {
  let text = "";
  let index = 0;
  while (index < bytes.length) {
    const length = utf8SequenceLength(bytes, index);
    if (length === 0) {
      const byte = bytes[index] ?? 0;
      text += `%${byte.toString(16).toUpperCase().padStart(2, "0")}`;
      index++;
    } else {
      text += Buffer.from(bytes.slice(index, index + length)).toString("utf8");
      index += length;
    }
  }
  return text;
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

/** What the status line says of each state a checkpoint leaves. */
const CHECKPOINT_STATES: Readonly<Partial<Record<RunState, string>>> = {
  incomplete: `the game's process is looked for on Windows only`,
  running: `${GAME_IMAGE_NAME} is running`,
  crashed: `${GAME_IMAGE_NAME} is not running`,
};

function statusLine(run: ProbeRun): string {
  const count = run.records.length;
  const records = `${String(count)} record${count === 1 ? "" : "s"}`;
  const game = CHECKPOINT_STATES[run.state];
  if (run.state === "finished") {
    return `finished: Probe ${run.probe}, run ${run.expectedRunId}, ${records}`;
  }
  if (game !== undefined) {
    const pending =
      run.pending === undefined
        ? "no pending step"
        : `pending step ${formatValue(run.pending)}`;
    return `${run.state}: Probe ${run.probe}, run ${run.expectedRunId}, ${records} to its last checkpoint, ${pending}; ${game}`;
  }
  return run.runId === undefined
    ? `not-started: no Result file at ${run.file}`
    : `not-started: the Result file is from run ${formatValue(run.runId)}, not from this build's run ${run.expectedRunId}`;
}
