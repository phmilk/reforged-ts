// `map:measure [--runs <n>]`: the check-time cost of the FourCC overloads of
// a map of 500 Custom units (./measure.ts), for 100 and 1,000 literal calls,
// printed. A measurement, not a gate. A bad argument exits 2.

import { removeTemporary } from "../support/map-folder.js";
import { formatMeasurement, measure } from "./measure.js";

const USAGE = "Usage: map:measure [--runs <n>]\n";

const args = process.argv.slice(2);
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
    process.stderr.write(USAGE);
    process.exit(2);
  }
  runs = value;
}
try {
  process.stdout.write(
    formatMeasurement(measure({ objects: 500, calls: [100, 1000], runs })),
  );
} finally {
  removeTemporary();
}
