// The bridge between the writer and the reader: one fixture holds the lines
// of the hello Probe's Result file. The Lua test asserts that the writer
// produces exactly these lines; the Node test wraps them as the game writes
// them to disk and asserts that the reader decodes them back.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

/** The fixture: one Result file line per line. */
export const BRIDGE_FIXTURE = fileURLToPath(
  new URL("../fixtures/bridge/hello.txt", import.meta.url),
);

/** The Probe the fixture is the Result file of. */
export const BRIDGE_PROBE = "hello";

/** The runId in the fixture's `BEGIN` line, which the Lua test's build bakes. */
export const BRIDGE_RUN_ID = "bridge";

/** The fixture's lines, in order. */
export function bridgeLines(): string[] {
  const lines = readFileSync(BRIDGE_FIXTURE, "utf8").split("\n");
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
