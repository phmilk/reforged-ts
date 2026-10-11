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

/** The file the Battle.net app keeps the installed Build in, at the install's root. */
export const BUILD_INFO_FILE = ".build.info";

/** The client's Build, and where it was read from. */
export interface ClientBuild {
  /**
   * The Build of the install's content: the one its build config names
   * (`build-name`), else `.build.info`'s Version.
   */
  build: string;
  /** The file `build` was read from: the build config, else `.build.info`. */
  file: string;
  /** The `.build.info` the build config was found from. */
  buildInfoFile: string;
  /** The Version of `.build.info`'s active row, which may differ from `build`. */
  buildInfoVersion: string;
}

// The reading of .build.info and of the build config's build-name mirrors
// parseBuildInfo and buildConfigName in
// packages/reforged-builtins/src/casc/storage.ts, which the Probe runner
// does not depend on: change both together.
// packages/reforged-builtins/test/probe-parity.test.ts runs both.

/**
 * The Build of the game client the executable belongs to, read as
 * `builtins:generate` reads it. The nearest `.build.info` in a folder above
 * the executable, at the install's root (`<install>\_retail_\x86_64` holds
 * the executable), is a table the Battle.net app writes: a header of
 * `<name>!<type>:<size>` columns separated by `|`, then one row per region.
 * Its active row (`Active` 1) names the build config (`Build Key`), at
 * `Data\config\<k0k1>\<k2k3>\<key>`, whose `build-name` is the Build of the
 * content; without one, the active row's `Version` is the Build. The build
 * config is the authority: the Battle.net app has written 3.0.0.24248 as the
 * Version of the build config that names 3.0.0.24268, a Build that never
 * existed (#564). No `.build.info`, or one without an active `Version`, is
 * an AuthorError.
 */
export function readClientBuild(
  executable: string,
  machine: Pick<Machine, "readFile">,
): ClientBuild {
  const folders: string[] = [];
  for (
    let folder = path.dirname(executable);
    !folders.includes(folder);
    folder = path.dirname(folder)
  ) {
    folders.push(folder);
    const file = path.join(folder, BUILD_INFO_FILE);
    const text = machine.readFile(file);
    if (text === undefined) continue;
    const [header = "", ...rows] = text.split(/\r?\n/);
    const columns = header.split("|").map((column) => column.split("!")[0]);
    const active = columns.indexOf("Active");
    const version = columns.indexOf("Version");
    const key = columns.indexOf("Build Key");
    const row = rows
      .map((line) => line.split("|"))
      .find((cells) => active === -1 || cells[active] === "1");
    const buildInfoVersion = version === -1 ? undefined : row?.[version];
    if (buildInfoVersion === undefined || buildInfoVersion === "") {
      throw new AuthorError(
        `${file} names no Version in an active row: probe:run reads the client's Build from it.`,
      );
    }
    const fallback = {
      build: buildInfoVersion,
      file,
      buildInfoFile: file,
      buildInfoVersion,
    };
    const buildConfigKey = key === -1 ? undefined : row?.[key];
    if (
      buildConfigKey === undefined ||
      !/^[0-9a-f]{32}$/.test(buildConfigKey)
    ) {
      return fallback;
    }
    const configFile = path.join(
      folder,
      "Data",
      "config",
      buildConfigKey.slice(0, 2),
      buildConfigKey.slice(2, 4),
      buildConfigKey,
    );
    const buildName = buildNameOf(machine.readFile(configFile) ?? "");
    return buildName === undefined
      ? fallback
      : { ...fallback, build: buildName, file: configFile };
  }
  throw new AuthorError(
    `No ${BUILD_INFO_FILE} above the game's executable ${executable}: probe:run reads the client's Build from it.`,
  );
}

/**
 * The Build a build config names, `3.0.0.24268` of
 * `build-name = 3.0.0.24268-retail`; undefined when it names none.
 */
function buildNameOf(config: string): string | undefined {
  for (const line of config.split(/\r?\n/)) {
    if (line.startsWith("#")) continue;
    const at = line.indexOf("=");
    if (at === -1 || line.slice(0, at).trim() !== "build-name") continue;
    return /^\d+\.\d+\.\d+\.\d+/.exec(line.slice(at + 1).trim())?.[0];
  }
  return undefined;
}
