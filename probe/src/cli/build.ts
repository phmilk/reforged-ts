/**
 * `probe:build [<probe> ...]`: builds each Probe named, or every Probe of
 * `probe/probes/` when none is, and prints where each was staged with the
 * runId it bakes. Stops at the first failure. Exit codes: 0 built; 1 a
 * failure, an author error printed on one line.
 */
import { buildProbe } from "../build.js";
import { PROBE_FOLDERS, type ProbeFolders } from "../folders.js";
import { listProbes } from "../probes.js";
import {
  failure,
  invokedDirectly,
  PROCESS_OUTPUT,
  type Output,
} from "./common.js";

/** Where the command reads and writes: the package's folders. */
export interface Context {
  folders: ProbeFolders;
}

export function main(
  args: readonly string[],
  output: Output,
  context: Context = { folders: PROBE_FOLDERS },
): number {
  try {
    const probes = args.length > 0 ? args : listProbes(context.folders.probes);
    for (const probe of probes) {
      const { runId, stagingFolder } = buildProbe(probe, context.folders);
      output.stdout(`Built Probe ${probe}, run ${runId}: ${stagingFolder}\n`);
    }
    return 0;
  } catch (error) {
    output.stderr(failure("probe:build", error));
    return 1;
  }
}

if (invokedDirectly(import.meta.url)) {
  process.exitCode = main(process.argv.slice(2), PROCESS_OUTPUT);
}
