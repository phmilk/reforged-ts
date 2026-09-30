// The Probe runner's in-game module: the entry of every Probe's bundle. It
// wraps the editor's `main` to start a 0-second timer, calls the Probe's
// `run(p)` from it under `xpcall`, and writes the Result file,
// `reforged-ts\probes\<probe>.txt` under CustomMapData, through the Preload
// Natives. It calls Natives only, never the library, so a Probe checks the
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

/**
 * Adds the record's line, numbered after the last one. Raises an error, and
 * adds nothing, when the kind or a key is not a safe name (`recordLine`).
 */
function addLine(
  kind: string,
  fields: Readonly<Record<string, FieldValue>>,
): void {
  const seq = lineCount + 1;
  const parts = splitLine(recordLine(seq, kind, fields), seq);
  lineCount = seq;
  for (const part of parts) {
    preloadLines.push(part);
  }
}

/** Writes every line so far to the Result file, replacing what it held. */
function writeResultFile(): void {
  PreloadGenClear();
  PreloadGenStart();
  for (const line of preloadLines) {
    Preload(line);
  }
  PreloadGenEnd(RESULT_FILE);
}

function show(text: string, seconds: number): void {
  DisplayTimedTextToPlayer(GetLocalPlayer(), 0, 0, seconds, text);
}

const p: ProbeContext = {
  record: (kind, fields) => {
    addLine(kind, fields);
    recordCount++;
  },
};

function start(): void {
  addLine("BEGIN", { probe: PROBE, run: RUN_ID });
  const [ok, error] = xpcall(
    () => {
      runProbe(p);
    },
    (message: unknown) => tostring(message),
  );
  if (!ok) {
    show(`Probe ${PROBE} failed: ${error}`, END_MESSAGE_SECONDS);
    return;
  }
  addLine("END", { status: "ok" });
  writeResultFile();
  show(
    `Probe ${PROBE} finished: ${String(recordCount)} record${recordCount === 1 ? "" : "s"}. Close the game.`,
    END_MESSAGE_SECONDS,
  );
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
