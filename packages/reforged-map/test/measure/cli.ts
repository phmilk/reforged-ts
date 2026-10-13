// `map:measure [--runs <n>]`: the check-time cost of the FourCC overloads of
// a map of 500 Custom units (./measure.ts), for 100 and 1,000 literal calls,
// printed. A measurement, not a gate. A bad argument exits 2.

import path from "node:path";
import { pathToFileURL } from "node:url";
import { removeTemporary } from "../support/map-folder.js";
import { formatMeasurement, measure } from "./measure.js";

/** Where the command writes. */
export interface Output {
  stdout: (text: string) => void;
  stderr: (text: string) => void;
}

const USAGE = "Usage: map:measure [--runs <n>]\n";

/** Runs the command on its arguments; returns its exit code. */
export function main(
  args: readonly string[],
  output: Output,
  objects = 500,
  calls: readonly number[] = [100, 1000],
): number {
  const rest = args[0] === "--" ? args.slice(1) : args;
  let runs = 7;
  if (rest.length > 0) {
    const value = Number(rest[1]);
    if (
      rest[0] !== "--runs" ||
      rest.length !== 2 ||
      !Number.isInteger(value) ||
      value < 1
    ) {
      output.stderr(USAGE);
      return 2;
    }
    runs = value;
  }
  try {
    output.stdout(formatMeasurement(measure({ objects, calls, runs })));
  } finally {
    removeTemporary();
  }
  return 0;
}

const script = process.argv.at(1);
if (
  script !== undefined &&
  pathToFileURL(path.resolve(script)).href === import.meta.url
) {
  process.exitCode = main(process.argv.slice(2), {
    stdout: (text) => process.stdout.write(text),
    stderr: (text) => process.stderr.write(text),
  });
}
