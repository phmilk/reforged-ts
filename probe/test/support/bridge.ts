// The bridge between the writer and the reader: each fixture holds the lines
// of a Probe's Result file: the hello Probe's as its run finishes and as its
// second checkpoint leaves it, and the failing Probe's. The Lua tests assert
// that the writer produces exactly these lines; the Node tests wrap them as
// the game writes them to disk and assert that the reader decodes them back.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

/**
 * A bridge fixture: the hello Probe's Result file as the finished run leaves
 * it, or as the last checkpoint does, or the failing Probe's.
 */
export type BridgeFixture = "finished" | "checkpoint" | "failed";

/** The fixtures: one Result file line per line. */
export const BRIDGE_FIXTURES: Readonly<Record<BridgeFixture, string>> = {
  finished: fileURLToPath(
    new URL("../fixtures/bridge/hello.txt", import.meta.url),
  ),
  checkpoint: fileURLToPath(
    new URL("../fixtures/bridge/hello-checkpoint.txt", import.meta.url),
  ),
  failed: fileURLToPath(
    new URL("../fixtures/bridge/failing.txt", import.meta.url),
  ),
};

/** The Probe the `finished` and `checkpoint` fixtures are the Result file of. */
export const BRIDGE_PROBE = "hello";

/**
 * The failing Probe, whose Result file is the `failed` fixture: a run that
 * throws, so ends with `ERROR` and `END status=failed`.
 */
export const FAILING_PROBE = "failing";

/** The runId in the fixtures' `BEGIN` line, which the Lua test's build bakes. */
export const BRIDGE_RUN_ID = "bridge";

/**
 * The manifest the Lua test's build reads, whose `patch`, 3.0.0.12345, is
 * the Patch in the fixtures' `BEGIN` line: not the Typings' own, so a new
 * Patch changes no fixture.
 */
export const BRIDGE_MANIFEST = fileURLToPath(
  new URL("../fixtures/bridge/manifest.json", import.meta.url),
);

/** The lines of a fixture, the finished run's by default, in order. */
export function bridgeLines(fixture: BridgeFixture = "finished"): string[] {
  const lines = readFileSync(BRIDGE_FIXTURES[fixture], "utf8").split("\n");
  return lines.at(-1) === "" ? lines.slice(0, -1) : lines;
}

/**
 * The file the game writes for these `Preload` strings, byte for byte as
 * measured on 3.0.0 (#298, section 2.2): a fixed JASS function, one
 * `\tcall Preload( "<string>" )\r\n` per string with each `\` doubled, and
 * the wrapper's bare LFs where the game writes them.
 */
export function preloadFile(strings: readonly string[]): string {
  return [
    "function PreloadFiles takes nothing returns nothing\n",
    "\r\n",
    "\tcall PreloadStart()\r\n",
    ...strings.map(
      (text) => `\tcall Preload( "${text.replaceAll("\\", "\\\\")}" )\r\n`,
    ),
    "\tcall PreloadEnd( 0.0 )\r\n",
    "\n",
    "endfunction\n",
    "\n",
    "\r\n",
  ].join("");
}
