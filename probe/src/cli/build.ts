/**
 * `probe:build [<probe> ...] [--game-data-set <set>] [--game-data-version
 * <version>] [--melee-map]`: builds each Probe named, or every Probe of `probe/probes/`
 * when none is, its staged map declaring the Game data the options set, and
 * prints where each was staged with the runId it bakes. Stops at the first
 * failure. Exit codes: 0 built; 1 a failure, an author error printed on
 * one line.
 */
import { parseArgs } from "node:util";
import { buildProbe, builtMessage } from "../build.js";
import { AuthorError } from "../errors.js";
import { GAME_DATA_ARGS, gameDataOf } from "../game-data.js";
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
    const { positionals, values } = parseCommandLine(args);
    const gameData = gameDataOf(values);
    const probes =
      positionals.length > 0 ? positionals : listProbes(context.folders.probes);
    for (const probe of probes) {
      const build = buildProbe(probe, context.folders, { gameData });
      output.stdout(`${builtMessage(build)}\n`);
    }
    return 0;
  } catch (error) {
    output.stderr(failure("probe:build", error));
    return 1;
  }
}

/** The Probes and the Game data options; an unknown option is an AuthorError. */
function parseCommandLine(args: readonly string[]) {
  try {
    return parseArgs({
      args: [...args],
      options: {
        ...GAME_DATA_ARGS,
      },
      strict: true,
      allowPositionals: true,
    });
  } catch (error) {
    throw new AuthorError(
      error instanceof Error ? error.message : String(error),
    );
  }
}

if (invokedDirectly(import.meta.url)) {
  process.exitCode = main(process.argv.slice(2), PROCESS_OUTPUT);
}
