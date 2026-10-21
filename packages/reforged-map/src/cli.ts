#!/usr/bin/env node
// The package's command, `reforged-map`. Its one subcommand, `textconv
// <file>`, is git's textconv driver of Object data: it prints the text of
// one Object data file (src/object-data-text.ts) to standard output. A file
// whose bytes it cannot read prints the reason and a hex dump and exits 0,
// since a failing textconv aborts `git diff`. It imports the reader only,
// never the generators or reforged-builtins: git runs it once per file.

import fs from "node:fs";
import process from "node:process";
import { objectDataText } from "./object-data-text.js";

const USAGE = "Usage: reforged-map textconv <file>";

const args = process.argv.slice(2);
const [command, file] = args;
if (args.length !== 2 || command !== "textconv") {
  process.stderr.write(`${USAGE}\n`);
  process.exitCode = 2;
} else {
  let bytes: Uint8Array | undefined;
  try {
    bytes = fs.readFileSync(file);
  } catch (error) {
    process.stderr.write(
      `reforged-map textconv: cannot open ${file}: ${error instanceof Error ? error.message : String(error)}\n`,
    );
    process.exitCode = 1;
  }
  if (bytes !== undefined) process.stdout.write(objectDataText(bytes, file));
}
