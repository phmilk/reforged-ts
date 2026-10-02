// The Probe runner's in-game module: the entry of every Probe's bundle. It
// wraps the editor's `main` to start a 0-second timer, calls the Probe's
// `run(p)` from it under `xpcall`, ends the run when `run` returns or
// throws, or, after `p.hold()`, when the Probe calls `p.finish()`, and
// writes the Result file,
// `reforged-ts\probes\<probe>.txt` under CustomMapData, through the Preload
// Natives: a full rewrite at each checkpoint the Probe asks for, and one at
// the end. It calls Natives only, never the library, so a Probe checks the
// library without the library writing its results.

import { run } from "@probe/current";
import { recordLine, splitLine } from "./encoding";
import type { FieldValue, ProbeContext } from "./probe";

/** The Probe's `run`, which may leave `p` out: checked against what the runner passes. */
const runProbe: (p: ProbeContext) => void = run;

// Replaced in the bundle by probe:build (src/build.ts, PLACEHOLDERS) with the
// Probe's name and the build's runId. Each literal must appear here once.
const PROBE = "$PROBE_NAME$";
const RUN_ID = "$PROBE_RUN_ID$";

/** The Result file, under CustomMapData. */
const RESULT_FILE = `reforged-ts\\probes\\${PROBE}.txt`;

/** How long the message at the end stays on screen, in seconds. */
const END_MESSAGE_SECONDS = 3600;

/** How long the progress message of a checkpoint stays on screen, in seconds. */
const CHECKPOINT_MESSAGE_SECONDS = 10;

/**
 * The strings the runner gives `Preload`, so far: each line
 * `<seq> <kind> <key>=<value> ...`, split into continuation lines when
 * longer than 200 bytes.
 */
const preloadLines: string[] = [];

/** The number of lines so far, the runner's and the Probe's. */
let lineCount = 0;

/** The number of the Probe's own records so far. */
let recordCount = 0;

/** The number of checkpoints so far. */
let checkpointCount = 0;

/**
 * The strings `Preload` is given for the record, numbered after the last
 * line: its line, split into continuation lines when longer than 200 bytes.
 * Raises an error when the kind or a key is not a safe name (`recordLine`).
 */
function nextLineParts(
  kind: string,
  fields: Readonly<Record<string, FieldValue>>,
): string[] {
  return splitLine(recordLine(lineCount + 1, kind, fields));
}

/**
 * Adds the record's line, numbered after the last one. Raises an error, and
 * adds nothing, when the kind or a key is not a safe name (`recordLine`).
 */
function addLine(
  kind: string,
  fields: Readonly<Record<string, FieldValue>>,
): void {
  const parts = nextLineParts(kind, fields);
  lineCount++;
  for (const part of parts) {
    preloadLines.push(part);
  }
}

/**
 * Writes every line so far to the Result file, replacing what it held,
 * then `last`, the strings of the line that ends this rewrite:
 * `PreloadGenClear`, `PreloadGenStart`, one `Preload` per string and
 * `PreloadGenEnd`.
 */
function writeResultFile(last: readonly string[]): void {
  PreloadGenClear();
  PreloadGenStart();
  for (const line of preloadLines) {
    Preload(line);
  }
  for (const line of last) {
    Preload(line);
  }
  PreloadGenEnd(RESULT_FILE);
}

/** The count of records as the messages on screen give it. */
function records(count: number): string {
  return `${String(count)} record${count === 1 ? "" : "s"}`;
}

function show(text: string, seconds: number): void {
  DisplayTimedTextToPlayer(GetLocalPlayer(), 0, 0, seconds, text);
}

/** Whether the Probe called `p.hold()`: `END` then waits for `p.finish()`. */
let held = false;

/** Whether `END` is written: the Probe run has ended. */
let ended = false;

/** Adds `END status=<status>` and writes the Result file with every line so far. */
function end(status: "ok" | "failed"): void {
  addLine("END", { status });
  ended = true;
  writeResultFile([]);
}

/** Ends the run with `END status=ok`, unless it has ended, and says so on screen. */
function finish(): void {
  if (ended) return;
  end("ok");
  show(
    `Probe ${PROBE} finished: ${records(recordCount)}. Close the game.`,
    END_MESSAGE_SECONDS,
  );
}

/**
 * Ends the run with `ERROR message=<message>`, then `END status=failed`,
 * and says so on screen. When the run has ended already (`finish()`, then
 * a throw), the Result file stays as it is and only the screen shows the
 * error.
 */
function fail(message: string): void {
  if (!ended) {
    addLine("ERROR", { message });
    end("failed");
  }
  show(
    `Probe ${PROBE} failed after ${records(recordCount)}. Close the game.\n${message}`,
    END_MESSAGE_SECONDS,
  );
}

/** An Error thrown from TypeScript: a table with a name and a message. */
interface ThrownError {
  name?: unknown;
  message?: unknown;
}

/**
 * The message of what `run` threw, as `xpcall`'s handler receives it. An
 * Error thrown from TypeScript is a table whose `__tostring`, from
 * typescript-to-lua's library, reads the `debug` library, which the game
 * does not have: it gives `<name>: <message>` as that `__tostring` does,
 * without calling it. Anything else gives what `tostring` gives, or a
 * description when `tostring` itself fails.
 */
function errorMessage(thrown: unknown): string {
  if (type(thrown) === "table") {
    const { name, message } = thrown as ThrownError;
    if (typeof name === "string" && typeof message === "string") {
      return message === "" ? name : `${name}: ${message}`;
    }
  }
  const [ok, text] = pcall(tostring, thrown);
  return ok ? text : `a ${type(thrown)} whose tostring failed`;
}

/**
 * Raises an error once the run has ended: a line added then, or a
 * checkpoint, would rewrite the Result file without its `END` line.
 */
function checkNotEnded(what: string): void {
  if (ended) {
    error(`Probe ${PROBE} has ended: it takes no more ${what}.`, 0);
  }
}

const p: ProbeContext = {
  record: (kind, fields) => {
    checkNotEnded("records");
    addLine(kind, fields);
    recordCount++;
  },
  pending: (label) => {
    checkNotEnded("pending steps");
    addLine("PENDING", { label });
  },
  checkpoint: () => {
    checkNotEnded("checkpoints");
    // The CHECKPOINT line ends this rewrite only: the next rewrite numbers
    // its next line with the same seq, and ends with its own last line.
    writeResultFile(nextLineParts("CHECKPOINT", {}));
    checkpointCount++;
    show(
      `Probe ${PROBE}: checkpoint ${String(checkpointCount)}, ${records(recordCount)} so far.`,
      CHECKPOINT_MESSAGE_SECONDS,
    );
  },
  hold: () => {
    held = true;
  },
  finish,
};

function start(): void {
  addLine("BEGIN", { probe: PROBE, run: RUN_ID });
  const [ok, message] = xpcall(() => {
    runProbe(p);
  }, errorMessage);
  if (!ok) {
    fail(message);
  } else if (!held) {
    finish();
  }
}

// The editor's script defines `main` before the bundle runs; Natives wait for
// it. The timer fires once the map is initialised.
const globals = _G as unknown as { main?: () => void };
const editorMain = globals.main;
globals.main = () => {
  editorMain?.();
  const timer = CreateTimer();
  TimerStart(timer, 0, false, () => {
    DestroyTimer(timer);
    start();
  });
};
