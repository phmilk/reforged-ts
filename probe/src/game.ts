/**
 * Where the game is: `--game-executable`, else `WC3_EXECUTABLE`, else the
 * well-known install locations, through the injected machine. What
 * `probe:launch` needs before it builds; `probe:build` never looks.
 */
import path from "node:path";
import { AuthorError } from "./errors.js";
import type { Machine } from "./machine.js";

/** What the command line may set: the Template's configuration fields of the same names. */
export interface GameOptions {
  /**
   * The game's executable, relative to the root. With `winePath` set, a
   * path Wine understands (e.g. a `C:\...` path inside the prefix).
   */
  gameExecutable?: string;
  /** Launches the game through Wine (`wine`, or a path to it). The map folder is then given as a `Z:` path. */
  winePath?: string;
  /** `WINEPREFIX` for the Wine launch, relative to the root. Default: Wine's own. */
  winePrefix?: string;
}

/** The command-line option of each field. */
export const OPTION_FLAGS: Readonly<Record<keyof GameOptions, string>> = {
  gameExecutable: "--game-executable",
  winePath: "--wine-path",
  winePrefix: "--wine-prefix",
};

/** Names the game's executable when it is somewhere the well-known locations do not cover; relative to the root. */
export const EXECUTABLE_ENV = "WC3_EXECUTABLE";

/**
 * The file name of the game's Windows executable: the image name its
 * process runs under, which `probe:read` looks for in the process list.
 */
export const GAME_IMAGE_NAME = "Warcraft III.exe";

/**
 * The default install locations of the game, looked at in order. NOT verified
 * against a real 3.0 install: they follow the Battle.net layout since 1.32
 * (`_retail_\x86_64` on Windows; on macOS the inner binary of the `.app`,
 * since the bundle folder itself cannot be executed), as other templates and
 * WurstScript use it.
 */
export function wellKnownExecutables(
  platform: NodeJS.Platform,
  env: Machine["env"],
): string[] {
  if (platform === "win32") {
    const programFolders = [
      env["ProgramFiles(x86)"] ?? "C:\\Program Files (x86)",
      env.ProgramFiles ?? "C:\\Program Files",
    ];
    return [...new Set(programFolders)].map((folder) =>
      path.win32.join(
        folder,
        "Warcraft III",
        "_retail_",
        "x86_64",
        GAME_IMAGE_NAME,
      ),
    );
  }
  if (platform === "darwin") {
    return [
      "/Applications/Warcraft III/_retail_/x86_64/Warcraft III.app/Contents/MacOS/Warcraft III",
    ];
  }
  return [];
}

/** How `probe:launch` starts the game. */
export interface GameLaunch {
  /** The game's executable (absolute, or as given for Wine). */
  executable: string;
  winePath?: string;
  /** Absolute. */
  winePrefix?: string;
}

/**
 * Finds the game: `gameExecutable` if set, else the `WC3_EXECUTABLE`
 * environment variable, else the first existing well-known location. Both
 * resolve against `root`, as the Template's did against the folder its
 * scripts run in, since `pnpm --dir probe` runs this one in `probe/`. Nothing
 * found is an AuthorError naming `WC3_EXECUTABLE`.
 */
export function resolveGameLaunch(
  options: GameOptions,
  root: string,
  machine: Pick<Machine, "platform" | "env" | "exists">,
): GameLaunch {
  const optionalString = (field: keyof GameOptions) => {
    const value = options[field];
    if (value === "") {
      throw new AuthorError(`${OPTION_FLAGS[field]} must not be empty.`);
    }
    return value;
  };
  const winePath = optionalString("winePath");
  const winePrefix = optionalString("winePrefix");
  const override = optionalString("gameExecutable");
  const wine = {
    ...(winePath !== undefined && { winePath }),
    ...(winePrefix !== undefined && {
      winePrefix: path.resolve(root, winePrefix),
    }),
  };

  if (override !== undefined) {
    // Through Wine the path is the Windows side's (`C:\...`): nothing to check here.
    if (winePath !== undefined) return { executable: override, ...wine };
    const executable = path.resolve(root, override);
    if (!machine.exists(executable)) {
      throw new AuthorError(
        `${OPTION_FLAGS.gameExecutable} is set to "${override}", which does not exist.`,
      );
    }
    return { executable, ...wine };
  }

  const fromEnv = machine.env[EXECUTABLE_ENV];
  const candidates = [
    ...(fromEnv ? [path.resolve(root, fromEnv)] : []),
    ...wellKnownExecutables(machine.platform, machine.env),
  ];
  const executable = candidates.find((file) => machine.exists(file));
  if (executable === undefined) {
    const looked =
      candidates.length > 0
        ? ` Looked at: ${candidates.map((c) => `"${c}"`).join(", ")}.`
        : "";
    throw new AuthorError(
      `Warcraft III was not found. Set the ${EXECUTABLE_ENV} environment variable (or pass ${OPTION_FLAGS.gameExecutable}) to the game's executable.${looked}`,
    );
  }
  return { executable, ...wine };
}
