/**
 * Where the game is: `--game-executable`, else `WC3_EXECUTABLE`, else the
 * Battle.net install locations on Windows, through the injected machine.
 * What `probe:run` needs before it builds; `probe:build` never looks.
 */
import path from "node:path";
import { AuthorError } from "./errors.js";
import type { Machine } from "./machine.js";

/** What the command line may set: the Template's configuration field of the same name. */
export interface GameOptions {
  /** The game's executable, relative to the root. */
  gameExecutable?: string;
}

/** The command-line option of each field. */
export const OPTION_FLAGS: Readonly<Record<keyof GameOptions, string>> = {
  gameExecutable: "--game-executable",
};

/** Names the game's executable when it is somewhere the well-known locations do not cover; relative to the root. */
export const EXECUTABLE_ENV = "WC3_EXECUTABLE";

/**
 * The file name of the game's Windows executable: the image name its
 * process runs under, which `probe:read` looks for in the process list.
 */
export const GAME_IMAGE_NAME = "Warcraft III.exe";

/**
 * The default install locations of the game on Windows, looked at in order:
 * the Battle.net layout since 1.32 (`_retail_\x86_64`) under
 * `ProgramFiles(x86)`, then `ProgramFiles`, or their defaults. The first is
 * where the game was found on 3.0.0.24268. None elsewhere.
 */
export function wellKnownExecutables(
  platform: NodeJS.Platform,
  env: Machine["env"],
): string[] {
  if (platform !== "win32") return [];
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

/**
 * Finds the game's executable: `gameExecutable` if set, else the
 * `WC3_EXECUTABLE` environment variable, else the first existing well-known
 * location. Both resolve against `root`, as the Template's did against the
 * folder its scripts run in, since `pnpm --dir probe` runs this one in
 * `probe/`. Nothing found is an AuthorError naming `WC3_EXECUTABLE`.
 */
export function resolveGameExecutable(
  options: GameOptions,
  root: string,
  machine: Pick<Machine, "platform" | "env" | "exists">,
): string {
  const override = options.gameExecutable;
  if (override === "") {
    throw new AuthorError(`${OPTION_FLAGS.gameExecutable} must not be empty.`);
  }
  if (override !== undefined) {
    const executable = path.resolve(root, override);
    if (!machine.exists(executable)) {
      throw new AuthorError(
        `${OPTION_FLAGS.gameExecutable} is set to "${override}", which does not exist.`,
      );
    }
    return executable;
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
  return executable;
}
