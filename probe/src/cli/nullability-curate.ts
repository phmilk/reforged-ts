/**
 * `probe:nullability-curate <probe>`: applies the verdicts of the
 * Nullability sweep's Slice `<probe>`, from the Probe's last run, to the
 * Overlay, `packages/reforged-types/overlay/`, for its group's curation
 * pull request, and prints what it did to each entry. It writes local
 * files only, never the sweep report. Exit codes: 0 applied; 1 a failure,
 * an author error printed on its lines (a `mismatch`, one line per Native).
 */
import { OVERLAY_FOLDER, PROBE_FOLDERS, VENDOR_FOLDER } from "../folders.js";
import { systemMachine } from "../machine.js";
import {
  curateOverlay,
  type CuratedEntry,
  type Curation,
} from "../nullability/curate.js";
import type { SliceContext } from "../nullability/report.js";
import {
  failure,
  invokedDirectly,
  PROCESS_OUTPUT,
  type Output,
} from "./common.js";

const USAGE = "Usage: probe:nullability-curate <probe>\n";

/** The machine and the files the command reads and writes. */
export type Context = SliceContext;

export function main(
  args: readonly string[],
  output: Output,
  context: Context = {
    machine: systemMachine,
    stateFolder: PROBE_FOLDERS.state,
    overlayFolder: OVERLAY_FOLDER,
    vendorFolder: VENDOR_FOLDER,
  },
): number {
  if (args.length !== 1) {
    output.stderr(USAGE);
    return 1;
  }
  const [probe] = args;
  try {
    output.stdout(summary(curateOverlay(probe, context)));
    return 0;
  } catch (error) {
    output.stderr(failure("probe:nullability-curate", error));
    return 1;
  }
}

/** What the command did to one entry, for its line. */
function entryLine({ native, verdict, narrowed, notes }: CuratedEntry): string {
  const done = [
    ...(narrowed ? ["returns.nullable narrowed to false"] : []),
    ...(notes.kind === "written" ? ["notes written"] : []),
    ...(notes.kind === "kept"
      ? [`notes kept; proposed for the review: ${notes.proposed}`]
      : []),
    ...(notes.kind === "review" ? ["notes left for review"] : []),
  ];
  return `${native} (${verdict}): ${done.length === 0 ? "unchanged" : done.join("; ")}`;
}

/**
 * What the command prints: the run it applied and how many entries it
 * wrote, then one line per Native.
 */
function summary({ slice, entries }: Curation): string {
  const written = entries.filter(
    ({ narrowed, notes }) => narrowed || notes.kind === "written",
  ).length;
  return [
    `Applied Probe ${slice.probe}, run ${slice.runId} on ${slice.patch}, to the Overlay: ${String(written)} of ${String(entries.length)} entries written.`,
    ...entries.map(entryLine),
  ]
    .map((line) => `${line}\n`)
    .join("");
}

if (invokedDirectly(import.meta.url)) {
  process.exitCode = main(process.argv.slice(2), PROCESS_OUTPUT);
}
