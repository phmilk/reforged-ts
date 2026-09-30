/**
 * `probe:launch <probe> [--game-executable <file>] [--wine-path <wine>]
 * [--wine-prefix <folder>]`: run by the human, never by the agent. Finds the
 * game, builds the Probe, starts the game detached on it and prints the
 * human's part of the Probe run. Exit codes: 0 started; 1 a failure, an
 * author error printed on one line.
 */
import { parseArgs } from "node:util";
import { PROBE_FOLDERS, WORKSPACE_FOLDER } from "../folders.js";
import { builtMessage } from "../build.js";
import { OPTION_FLAGS, type GameOptions } from "../game.js";
import { launchProbe, type LaunchContext } from "../launch.js";
import { systemMachine } from "../machine.js";
import {
  failure,
  invokedDirectly,
  PROCESS_OUTPUT,
  type Output,
} from "./common.js";

const USAGE = `Usage: probe:launch <probe> [${OPTION_FLAGS.gameExecutable} <file>] [${OPTION_FLAGS.winePath} <wine>] [${OPTION_FLAGS.winePrefix} <folder>]\n`;

/** Where the command builds, the machine it starts the game on, and the workspace its paths are relative to. */
export type Context = LaunchContext;

export async function main(
  args: readonly string[],
  output: Output,
  context: Context = {
    folders: PROBE_FOLDERS,
    machine: systemMachine,
    root: WORKSPACE_FOLDER,
  },
): Promise<number> {
  const parsed = parseCommandLine(args);
  if (parsed === undefined) {
    output.stderr(USAGE);
    return 1;
  }
  const { probe, options } = parsed;
  try {
    const launched = await launchProbe(probe, options, context);
    output.stdout(
      [
        builtMessage(launched),
        `Started ${launched.game.executable} on it.`,
        "",
        "Now:",
        `1. Wait until the game shows "Probe ${probe} finished" (or "Probe ${probe} failed").`,
        "2. Close the game.",
        '3. Say "done", or "crashed" if the game crashed or froze before that message.',
        "",
      ].join("\n"),
    );
    return 0;
  } catch (error) {
    output.stderr(failure("probe:launch", error));
    return 1;
  }
}

/** The game options, each named by its flag without the leading `--`. */
const FIELDS = Object.keys(OPTION_FLAGS) as (keyof GameOptions)[];
const optionName = (field: keyof GameOptions) =>
  OPTION_FLAGS[field].slice("--".length);

/** The Probe and the game options; undefined for arguments the usage does not allow. */
function parseCommandLine(
  args: readonly string[],
): { probe: string; options: GameOptions } | undefined {
  let parsed;
  try {
    parsed = parseArgs({
      args: [...args],
      options: Object.fromEntries(
        FIELDS.map((field) => [optionName(field), { type: "string" as const }]),
      ),
      strict: true,
      allowPositionals: true,
    });
  } catch {
    return undefined;
  }
  const { positionals } = parsed;
  const values = parsed.values as Record<string, string | undefined>;
  if (positionals.length !== 1) return undefined;
  return {
    probe: positionals[0],
    options: Object.fromEntries(
      FIELDS.map((field) => [field, values[optionName(field)]]),
    ),
  };
}

if (invokedDirectly(import.meta.url)) {
  process.exitCode = await main(process.argv.slice(2), PROCESS_OUTPUT);
}
