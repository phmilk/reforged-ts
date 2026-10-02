/**
 * `probe:nullability-report <probe>`: writes the section of the Nullability
 * sweep's Slice `<probe>` into the sweep report,
 * `docs/research/nullability-sweep.md`, from the Probe's last run, and
 * prints what it wrote. Reads the Overlay and never writes it. Exit codes:
 * 0 written; 1 a failure, an author error printed on one line.
 */
import {
  NULLABILITY_REPORT,
  OVERLAY_FOLDER,
  PROBE_FOLDERS,
  TYPINGS_MANIFEST,
} from "../folders.js";
import { systemMachine } from "../machine.js";
import {
  writeNullabilityReport,
  type NullabilityReport,
  type NullabilityReportContext,
} from "../nullability/report.js";
import {
  failure,
  invokedDirectly,
  PROCESS_OUTPUT,
  type Output,
} from "./common.js";

const USAGE = "Usage: probe:nullability-report <probe>\n";

/** The machine and the files the command reads and writes, and its clock. */
export type Context = NullabilityReportContext;

export function main(
  args: readonly string[],
  output: Output,
  context: Context = {
    machine: systemMachine,
    stateFolder: PROBE_FOLDERS.state,
    overlayFolder: OVERLAY_FOLDER,
    manifestFile: TYPINGS_MANIFEST,
    reportFile: NULLABILITY_REPORT,
    clock: () => new Date(),
  },
): number {
  if (args.length !== 1) {
    output.stderr(USAGE);
    return 1;
  }
  const [probe] = args;
  try {
    output.stdout(summary(writeNullabilityReport(probe, context)));
    return 0;
  } catch (error) {
    output.stderr(failure("probe:nullability-report", error));
    return 1;
  }
}

/** What the command prints: the section it wrote, then one line per Native. */
function summary({ file, slice }: NullabilityReport): string {
  return [
    `Wrote the section of Probe ${slice.probe}, run ${slice.runId}, to ${file}:`,
    ...slice.natives.map(
      ({ native, verdict, comparison }) =>
        `${native}: ${verdict}, ${comparison}`,
    ),
  ]
    .map((line) => `${line}\n`)
    .join("");
}

if (invokedDirectly(import.meta.url)) {
  process.exitCode = main(process.argv.slice(2), PROCESS_OUTPUT);
}
