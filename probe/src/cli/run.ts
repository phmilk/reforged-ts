/**
 * `probe:run <probe> [--game-executable <file>] [--begin-timeout <seconds>]
 * [--stall-timeout <seconds>]`: run by the agent, native Windows only. Runs
 * the Probe in the game end to end and blocks until the run ends, printing
 * one progress line per event, then exactly what `probe:read` prints for the
 * run. Exit codes are `probe:read`'s: 0 `finished`, 1 `failed`, 2 `crashed`
 * (a stall included), 3 `not-started` (no `BEGIN` came); 4 when the command
 * itself fails (a usage or author error, printed on one line, or a bug),
 * after ending the game if it had started. Ctrl+C, or a stop of the command,
 * ends the game and reads the run.
 */
import { parseArgs } from "node:util";
import { PROBE_FOLDERS, WORKSPACE_FOLDER } from "../folders.js";
import { OPTION_FLAGS } from "../game.js";
import { systemMachine } from "../machine.js";
import { EXIT_CODES, formatProbeRun } from "../read.js";
import { DEFAULT_TIMEOUTS, runProbe, type RunContext } from "../run.js";
import { FAILURE_EXIT_CODE } from "./read.js";
import {
  failure,
  invokedDirectly,
  PROCESS_OUTPUT,
  type Output,
} from "./common.js";

const USAGE = `Usage: probe:run <probe> [${OPTION_FLAGS.gameExecutable} <file>] [--begin-timeout <seconds>] [--stall-timeout <seconds>]\n`;

/** Where the command builds, the machine it runs the game on, and the workspace its paths are relative to. */
export type Context = Omit<RunContext, "progress">;

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
    return FAILURE_EXIT_CODE;
  }
  try {
    const run = await runProbe(
      parsed.probe,
      { gameExecutable: parsed.gameExecutable },
      { begin: parsed.beginTimeout, stall: parsed.stallTimeout },
      {
        ...context,
        progress: (line) => {
          output.stdout(`${line}\n`);
        },
      },
    );
    output.stdout(formatProbeRun(run));
    return EXIT_CODES[run.state];
  } catch (error) {
    output.stderr(failure("probe:run", error));
    return FAILURE_EXIT_CODE;
  }
}

interface CommandLine {
  probe: string;
  gameExecutable?: string;
  beginTimeout: number;
  stallTimeout: number;
}

/** A timeout in seconds: a positive number; undefined for anything else. */
function seconds(value: string | undefined, fallback: number) {
  if (value === undefined) return fallback;
  const number = Number(value);
  return value.trim() !== "" && Number.isFinite(number) && number > 0
    ? number
    : undefined;
}

/** The Probe, the game option and the timeouts; undefined for arguments the usage does not allow. */
function parseCommandLine(args: readonly string[]): CommandLine | undefined {
  let parsed;
  try {
    parsed = parseArgs({
      args: [...args],
      options: {
        "game-executable": { type: "string" },
        "begin-timeout": { type: "string" },
        "stall-timeout": { type: "string" },
      },
      strict: true,
      allowPositionals: true,
    });
  } catch {
    return undefined;
  }
  const { positionals, values } = parsed;
  const beginTimeout = seconds(values["begin-timeout"], DEFAULT_TIMEOUTS.begin);
  const stallTimeout = seconds(values["stall-timeout"], DEFAULT_TIMEOUTS.stall);
  if (
    positionals.length !== 1 ||
    beginTimeout === undefined ||
    stallTimeout === undefined
  ) {
    return undefined;
  }
  return {
    probe: positionals[0],
    ...(values["game-executable"] !== undefined && {
      gameExecutable: values["game-executable"],
    }),
    beginTimeout,
    stallTimeout,
  };
}

if (invokedDirectly(import.meta.url)) {
  // A stop ends the game the command started; the run is read all the same.
  const stop = new AbortController();
  for (const signal of ["SIGINT", "SIGTERM", "SIGBREAK", "SIGHUP"] as const) {
    process.on(signal, () => {
      stop.abort();
    });
  }
  process.exitCode = await main(process.argv.slice(2), PROCESS_OUTPUT, {
    folders: PROBE_FOLDERS,
    machine: systemMachine,
    root: WORKSPACE_FOLDER,
    signal: stop.signal,
  });
}
