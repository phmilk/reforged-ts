/**
 * `probe:run`: one Probe run end to end, by the agent (#360). Finds the
 * game, builds the Probe, starts the game on its staged map folder, posts the
 * key "Press any key to continue" waits for once the run's `BEGIN` line is
 * on disk, again until the Probe writes past it, follows the Result file, ends the game once the file ends or
 * stalls, and reads the run as `probe:read` does. A human steps in only to
 * log in to Battle.net, when no `BEGIN` comes. Native Windows only.
 */
import fs from "node:fs";
import path from "node:path";
import { buildProbe, builtMessage } from "./build.js";
import { AuthorError } from "./errors.js";
import type { ProbeFolders } from "./folders.js";
import {
  GAME_IMAGE_NAME,
  readClientBuild,
  resolveGameExecutable,
  type GameOptions,
} from "./game.js";
import { readPatch } from "./manifest.js";
import type { GameProcess, Machine, SpawnCommand } from "./machine.js";
import {
  field,
  formatValue,
  joinContinuationLines,
  parseResultLine,
  readProbeRun,
  resultFile,
  unwrapPreloadFile,
  type ProbeRun,
  type ResultLine,
} from "./read.js";

/**
 * Confirmed in game on 3.0.0.24268 (#32): `-launch` skips the menus, `-editor`
 * reuses the saved login (without it 3.0 asks for one), and the game loads an
 * unpacked map folder given to `-loadfile`.
 */
export const LAUNCH_ARGS: readonly string[] = [
  "-launch",
  "-editor",
  "-windowmode",
  "windowed",
];

/** The command that opens the game on `mapFolder`: `<exe> -loadfile <folder> -launch -editor -windowmode windowed`. */
export function launchCommand(
  executable: string,
  mapFolder: string,
): SpawnCommand {
  return {
    command: executable,
    args: ["-loadfile", mapFolder, ...LAUNCH_ARGS],
  };
}

/** The timeouts of a Probe run, in seconds. */
export interface RunTimeouts {
  /** From the start to the run's `BEGIN` line, after which the window is captured and a human awaited. */
  begin: number;
  /** The Result file unchanged this long while the game runs: the run has stalled, and the game is ended. */
  stall: number;
}

export const DEFAULT_TIMEOUTS: RunTimeouts = { begin: 60, stall: 120 };

/**
 * How long the command waits for a human after the begin timeout, in
 * seconds: the time to log in to Battle.net.
 */
export const HUMAN_WAIT_SECONDS = 15 * 60;

/** How often the Result file and the game's process are looked at, in milliseconds. */
export const POLL_MILLISECONDS = 500;

/**
 * How often the space key is posted again, in milliseconds, while the
 * Result file holds only what `BEGIN` wrote: a key may come before the
 * screen that waits for it.
 */
export const KEY_REPEAT_MILLISECONDS = 2000;

/** How long the command waits for the game's process to go once ended, in milliseconds. */
export const END_WAIT_MILLISECONDS = 10_000;

/** Where `probe:run` builds, the machine it runs the game on, and what it reports to. */
export interface RunContext {
  folders: ProbeFolders;
  machine: Machine;
  /** The folder a relative `--game-executable` resolves against. */
  root: string;
  /** Each progress line, without its newline. */
  progress: (line: string) => void;
  /** Stops the run: the command ends the game and reads the run. */
  signal?: AbortSignal;
}

/** The capture of the Probe's game window named `name`: `.probe/<probe>/<name>.png`. */
export function captureFile(
  folders: ProbeFolders,
  probe: string,
  name: string,
): string {
  return path.join(folders.state, probe, `${name}.png`);
}

/**
 * Runs `probe` end to end, as the module's comment says, and gives the
 * run as `probe:read` reads it once the game is gone. Off native Windows,
 * with `Warcraft III.exe` already running (the reader looks the game up by
 * image name), with no game found, a client whose `.build.info` names
 * another Build than the Patch of the Typings, or a build that fails, it
 * starts nothing and raises an AuthorError. The build keeps the client's
 * Build in the Probe's state file, for the report. Once the game has
 * started, every way out ends it, the command's own failure included.
 */
export async function runProbe(
  probe: string,
  options: GameOptions,
  timeouts: RunTimeouts,
  context: RunContext,
): Promise<ProbeRun> {
  const { machine, folders, progress } = context;
  if (machine.platform !== "win32") {
    throw new AuthorError(
      "probe:run runs on native Windows only: it starts the game and posts a key to its window. Run it from a Windows shell, not WSL.",
    );
  }
  if (machine.isRunning(GAME_IMAGE_NAME)) {
    throw new AuthorError(
      `${GAME_IMAGE_NAME} is running already: close it first. probe:run ends only the game it starts, and the reader would take that game for the run's.`,
    );
  }
  const executable = resolveGameExecutable(options, context.root, machine);
  const client = readClientBuild(executable, machine);
  const patch = readPatch(folders.manifest);
  if (client.build !== patch) {
    throw new AuthorError(
      `The game client is on Build ${client.build} (${client.file}), not on ${patch}, the Patch of the Typings: a run would test another Build than the one the Typings declare. Update the game through the Battle.net app when it is behind; when it is ahead, the run of ${patch} is skipped.`,
    );
  }
  const build = buildProbe(probe, folders, undefined, client.build);
  progress(builtMessage(build));

  const startedAt = machine.now();
  const seconds = () =>
    `${String(Math.round((machine.now() - startedAt) / 1000))}s`;
  const game = await machine.startGame(
    launchCommand(executable, build.stagingFolder),
  );
  progress(`started pid=${String(game.pid)}`);

  let why = "after a failure of the command";
  try {
    why = await follow(probe, build.runId, timeouts, context, game, seconds);
  } finally {
    if (game.exited()) {
      progress(`the game exited by itself at ${seconds()}`);
    } else {
      machine.endProcess(game.pid);
      await waitForExit(machine, game);
      progress(`killed pid=${String(game.pid)} at ${seconds()} ${why}`);
    }
  }
  return readProbeRun(probe, { machine, stateFolder: folders.state });
}

/**
 * Follows the run until it ends, its game exits or the command must end
 * it, and gives the reason the game is ended, as the `killed` line says it.
 */
async function follow(
  probe: string,
  runId: string,
  timeouts: RunTimeouts,
  context: RunContext,
  game: GameProcess,
  seconds: () => string,
): Promise<string> {
  const { machine, folders, progress, signal } = context;
  const file = resultFile(machine, probe);
  const startedAt = machine.now();
  const elapsed = () => (machine.now() - startedAt) / 1000;

  // Before BEGIN: no key is ever sent, so nothing is typed into the login.
  let captured = false;
  for (;;) {
    if (signal?.aborted) return "on a stop";
    if (game.exited()) return "";
    if (readRun(machine.readFile(file), runId) !== undefined) break;
    if (!captured && elapsed() >= timeouts.begin) {
      captured = true;
      progress(
        `waiting for a human: no BEGIN after ${String(timeouts.begin)}s, ${capture("no-begin")}. Waiting up to ${String(HUMAN_WAIT_SECONDS / 60)} min for a login; stop the command to end the game.`,
      );
    }
    if (elapsed() >= timeouts.begin + HUMAN_WAIT_SECONDS) {
      return `after ${String(HUMAN_WAIT_SECONDS / 60)} min waiting for a human`;
    }
    await machine.sleep(POLL_MILLISECONDS);
  }
  progress(`BEGIN at ${seconds()}`);

  const beginText = machine.readFile(file);
  let lastText = beginText;
  let changedAt = machine.now();
  let keys = 0;
  let keyAt = -Infinity;
  for (;;) {
    // Past the login, but "Press any key to continue" may not show yet: a
    // key posted during loading is lost (#361). So a key again every
    // KEY_REPEAT_MILLISECONDS, until the Probe writes past what BEGIN wrote.
    if (
      lastText === beginText &&
      machine.now() - keyAt >= KEY_REPEAT_MILLISECONDS &&
      machine.postKey(game.pid)
    ) {
      keyAt = machine.now();
      keys++;
      progress(`key sent${keys === 1 ? "" : " again"} at ${seconds()}`);
    }
    await machine.sleep(POLL_MILLISECONDS);
    if (signal?.aborted) return "on a stop";
    if (game.exited()) return "";
    const text = machine.readFile(file);
    const lines = text === lastText ? undefined : readRun(text, runId);
    if (lines !== undefined) {
      lastText = text;
      changedAt = machine.now();
      const last = lines.at(-1);
      if (last?.kind === "END") {
        progress(`END at ${seconds()} status=${field(last, "status") ?? ""}`);
        return "after END";
      }
      if (last?.kind === "CHECKPOINT") {
        progress(`checkpoint at ${seconds()}${pendingStep(lines)}`);
      }
    } else if ((machine.now() - changedAt) / 1000 >= timeouts.stall) {
      progress(
        `stalled: the Result file unchanged for ${String(timeouts.stall)}s, ${capture("stall")}`,
      );
      return `after a ${String(timeouts.stall)}s stall`;
    }
  }

  /** Captures the game window to `.probe/<probe>/<name>.png`, or says why it could not. */
  function capture(name: string): string {
    const png = captureFile(folders, probe, name);
    try {
      fs.mkdirSync(path.dirname(png), { recursive: true });
      machine.captureWindow(game.pid, png);
      return `capture at ${png}`;
    } catch (error) {
      return `no capture (${error instanceof Error ? error.message : String(error)})`;
    }
  }
}

/** `, pending <label>` for the last `PENDING` line, else nothing. */
function pendingStep(lines: readonly ResultLine[]): string {
  const pending = lines.findLast((line) => line.kind === "PENDING");
  const label = pending && field(pending, "label");
  return label === undefined ? "" : `, pending ${formatValue(label)}`;
}

/**
 * The lines of the Result file `text` when it is the run `runId`'s;
 * undefined when there is no file, it is another run's, or it cannot be
 * read yet (the game may be writing it): the reader at the end says what
 * a file that stays unreadable holds.
 */
function readRun(
  text: string | undefined,
  runId: string,
): ResultLine[] | undefined {
  if (text === undefined) return undefined;
  try {
    const lines = joinContinuationLines(unwrapPreloadFile(text));
    const first = lines.at(0);
    const begin = first === undefined ? undefined : parseResultLine(first);
    if (begin?.kind !== "BEGIN" || field(begin, "run") !== runId) {
      return undefined;
    }
    return [begin, ...lines.slice(1).map(parseResultLine)];
  } catch {
    return undefined;
  }
}

/** Waits until the ended game's process is gone, so the reader does not find it running. */
async function waitForExit(machine: Machine, game: GameProcess): Promise<void> {
  const deadline = machine.now() + END_WAIT_MILLISECONDS;
  while (!game.exited() && machine.now() < deadline) {
    await machine.sleep(POLL_MILLISECONDS / 2);
  }
}
