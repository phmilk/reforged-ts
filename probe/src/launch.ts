/**
 * `probe:launch`: finds the game, builds the Probe, then starts the game
 * detached on the staged map folder. Finding the game comes first, so a
 * missing game fails before a build it could not run. Under WSL the game,
 * a Windows program, gets a copy of the staged folder on the Windows side.
 */
import fs from "node:fs";
import path from "node:path";
import { buildProbe, type BuildResult } from "./build.js";
import type { ProbeFolders } from "./folders.js";
import {
  resolveGameLaunch,
  type GameLaunch,
  type GameOptions,
} from "./game.js";
import type { Machine, SpawnCommand, Wsl } from "./machine.js";

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

/**
 * The command that opens the game on `mapFolder` (absolute):
 * `<exe> -loadfile <folder> -launch -editor -windowmode windowed`.
 * With a Wine path the executable becomes Wine's first argument, the folder a
 * `Z:` path (Wine maps `Z:` to `/`) and the prefix goes in `WINEPREFIX`.
 */
export function launchCommand(
  game: GameLaunch,
  mapFolder: string,
): SpawnCommand {
  if (game.winePath === undefined) {
    return {
      command: game.executable,
      args: ["-loadfile", mapFolder, ...LAUNCH_ARGS],
      env: {},
    };
  }
  return {
    command: game.winePath,
    args: [
      game.executable,
      "-loadfile",
      `Z:${mapFolder.split(path.sep).join("/")}`,
      ...LAUNCH_ARGS,
    ],
    env: game.winePrefix === undefined ? {} : { WINEPREFIX: game.winePrefix },
  };
}

/** Where `probe:launch` builds, the machine it starts the game on, and the folder its paths are relative to. */
export interface LaunchContext {
  folders: ProbeFolders;
  machine: Machine;
  /** The folder a relative `--game-executable` or `--wine-prefix` resolves against. */
  root: string;
}

export interface LaunchResult extends BuildResult {
  game: GameLaunch;
  /** The folder the game was given with `-loadfile`: the staged folder, or under WSL its Windows-side copy, as a Windows path. */
  mapFolder: string;
}

/** The folder under the Windows `%TEMP%` that holds each Probe's copy under WSL. */
export const WSL_COPY_FOLDER = "reforged-ts-probe";

/**
 * Copies the staged map folder to `%TEMP%\reforged-ts-probe\<probe>\` on the
 * Windows side, the Probe's folder emptied first, and gives the copy's
 * Windows path: a Windows program cannot open the staged folder's WSL path.
 */
export function copyForWindows(
  wsl: Wsl,
  probe: string,
  stagingFolder: string,
): string {
  const probeFolder = path.win32.join(wsl.tempFolder(), WSL_COPY_FOLDER, probe);
  const copy = path.win32.join(probeFolder, path.basename(stagingFolder));
  const probeFolderHere = wsl.toWsl(probeFolder);
  fs.rmSync(probeFolderHere, { recursive: true, force: true });
  fs.mkdirSync(probeFolderHere, { recursive: true });
  fs.cpSync(
    stagingFolder,
    path.posix.join(probeFolderHere, path.basename(stagingFolder)),
    { recursive: true },
  );
  return copy;
}

/**
 * Finds the game, builds `probe`, and starts the game detached on its staged
 * map folder, or under WSL on its Windows-side copy (`copyForWindows`);
 * returns once the game has started, never waiting for it.
 */
export async function launchProbe(
  probe: string,
  options: GameOptions,
  context: LaunchContext,
): Promise<LaunchResult> {
  const { machine } = context;
  const game = resolveGameLaunch(options, context.root, machine);
  const build = buildProbe(probe, context.folders);
  const mapFolder =
    machine.wsl === undefined
      ? build.stagingFolder
      : copyForWindows(machine.wsl, probe, build.stagingFolder);
  await machine.spawnDetached(launchCommand(game, mapFolder));
  return { ...build, game, mapFolder };
}
