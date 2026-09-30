/**
 * `probe:launch`: finds the game, builds the Probe, then starts the game
 * detached on the staged map folder. Finding the game comes first, so a
 * missing game fails before a build it could not run.
 */
import path from "node:path";
import { buildProbe, type BuildResult } from "./build.js";
import type { ProbeFolders } from "./folders.js";
import {
  resolveGameLaunch,
  type GameLaunch,
  type GameOptions,
} from "./game.js";
import type { Machine, SpawnCommand } from "./machine.js";

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
}

/**
 * Finds the game, builds `probe`, and starts the game detached on its staged
 * map folder; returns once the game has started, never waiting for it.
 */
export async function launchProbe(
  probe: string,
  options: GameOptions,
  context: LaunchContext,
): Promise<LaunchResult> {
  const game = resolveGameLaunch(options, context.root, context.machine);
  const build = buildProbe(probe, context.folders);
  await context.machine.spawnDetached(launchCommand(game, build.stagingFolder));
  return { ...build, game };
}
