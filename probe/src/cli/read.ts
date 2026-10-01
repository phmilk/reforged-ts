/**
 * `probe:read <probe>`: prints the state of the Probe's last run on one line,
 * then its records, one per line. Read-only: it writes, starts and stops
 * nothing, and on Windows only reads the process list. Exit codes:
 * 0 `finished`, 1 `failed`, 2 `incomplete`, `running` or `crashed`,
 * 3 `not-started`; 4 when the command itself fails (a usage or author
 * error, printed on one line, or a bug), so a failure never reads as a
 * state.
 */
import { PROBE_FOLDERS } from "../folders.js";
import { systemMachine } from "../machine.js";
import {
  EXIT_CODES,
  formatProbeRun,
  readProbeRun,
  type ReadContext,
} from "../read.js";
import {
  failure,
  invokedDirectly,
  PROCESS_OUTPUT,
  type Output,
} from "./common.js";

const USAGE = "Usage: probe:read <probe>\n";

/** The exit code of a failure of the command itself. */
export const FAILURE_EXIT_CODE = 4;

/** The machine the command reads, and the folder of the state files. */
export type Context = ReadContext;

export function main(
  args: readonly string[],
  output: Output,
  context: Context = {
    machine: systemMachine,
    stateFolder: PROBE_FOLDERS.state,
  },
): number {
  if (args.length !== 1) {
    output.stderr(USAGE);
    return FAILURE_EXIT_CODE;
  }
  const [probe] = args;
  try {
    const run = readProbeRun(probe, context);
    output.stdout(formatProbeRun(run));
    return EXIT_CODES[run.state];
  } catch (error) {
    output.stderr(failure("probe:read", error));
    return FAILURE_EXIT_CODE;
  }
}

if (invokedDirectly(import.meta.url)) {
  process.exitCode = main(process.argv.slice(2), PROCESS_OUTPUT);
}
