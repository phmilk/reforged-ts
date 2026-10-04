/**
 * `probe:nullability-report <probe>`: writes the section of the Nullability
 * sweep's Slice `<probe>` into the sweep report,
 * `docs/research/nullability-sweep.md`, from the Probe's last run, and
 * prints what it wrote, then, when the section it replaced was written
 * under another Build, each change from it, which the Patch adoption pull
 * request carries. Reads the Overlay and never writes it. Exit codes:
 * 0 written; 1 a failure, an author error printed on one line.
 */
import {
  NULLABILITY_REPORT,
  OVERLAY_FOLDER,
  PROBE_FOLDERS,
  VENDOR_FOLDER,
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

export async function main(
  args: readonly string[],
  output: Output,
  context: Context = {
    machine: systemMachine,
    stateFolder: PROBE_FOLDERS.state,
    overlayFolder: OVERLAY_FOLDER,
    vendorFolder: VENDOR_FOLDER,
    reportFile: NULLABILITY_REPORT,
    clock: () => new Date(),
  },
): Promise<number> {
  if (args.length !== 1) {
    output.stderr(USAGE);
    return 1;
  }
  const [probe] = args;
  try {
    output.stdout(summary(await writeNullabilityReport(probe, context)));
    return 0;
  } catch (error) {
    output.stderr(failure("probe:nullability-report", error));
    return 1;
  }
}

/**
 * What the command prints: the section it wrote, then one line per Native,
 * then one per parameter of call cases, with how its `nil` counts differ
 * from the always-true ones when they do; then, when the section replaced
 * one of another Build, each change from it, or that there is none.
 */
function summary({ file, slice, changes }: NullabilityReport): string {
  return [
    `Wrote the section of Probe ${slice.probe}, run ${slice.runId}, to ${file}:`,
    ...slice.natives.map(
      ({ native, verdict, comparison }) =>
        `${native}: ${verdict}, ${comparison}`,
    ),
    ...slice.params.map(
      ({ native, param, verdict, comparison, countDifference }) =>
        `${native} parameter ${param}: ${verdict}, ${comparison}${countDifference === undefined ? "" : `; count difference: ${countDifference}`}`,
    ),
    ...(changes === undefined
      ? []
      : changes.lines.length === 0
        ? [`No change from the section of Build ${changes.from}.`]
        : [
            `Changes from the section of Build ${changes.from}:`,
            ...changes.lines,
          ]),
  ]
    .map((line) => `${line}\n`)
    .join("");
}

if (invokedDirectly(import.meta.url)) {
  process.exitCode = await main(process.argv.slice(2), PROCESS_OUTPUT);
}
