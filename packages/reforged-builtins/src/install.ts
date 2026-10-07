/**
 * Where the install is, found the way the Probe runner finds the game
 * (`probe/src/game.ts`): the command's argument, else the Probe runner's
 * `WC3_EXECUTABLE` environment variable, else the well-known install
 * folders. The install is the folder that holds `.build.info`: the nearest
 * one at or above the argument or the executable (the executable sits in
 * `<install>/_retail_/x86_64`).
 */
import path from "node:path";
import { BUILD_INFO_FILE } from "./casc/storage.js";

/** The Probe runner's variable: the game's executable. */
export const EXECUTABLE_ENV = "WC3_EXECUTABLE";

/** The command-line option of the install folder. */
export const INSTALL_OPTION = "--install";

/** What the lookup reaches of the machine; tests answer with a fake. */
export interface InstallMachine {
  platform: NodeJS.Platform;
  /** Whether Linux runs under WSL, where the game is on the Windows side. */
  wsl: boolean;
  env: Readonly<Record<string, string | undefined>>;
  /** Whether `file` exists and is a file. */
  isFile(file: string): boolean;
}

/** The install could not be found; the message says what to set. */
export class InstallNotFoundError extends Error {
  override name = "InstallNotFoundError";
}

/**
 * The default install folders, looked at in order: the Battle.net app's
 * under `ProgramFiles(x86)`, then `ProgramFiles`, or their defaults, on
 * Windows; the same folders of drive C under WSL. None elsewhere.
 */
export function wellKnownInstalls(
  machine: Pick<InstallMachine, "platform" | "wsl" | "env">,
): string[] {
  if (machine.platform === "win32") {
    const programFolders = [
      machine.env["ProgramFiles(x86)"] ?? "C:\\Program Files (x86)",
      machine.env.ProgramFiles ?? "C:\\Program Files",
    ];
    return [...new Set(programFolders)].map((folder) =>
      path.win32.join(folder, "Warcraft III"),
    );
  }
  if (machine.wsl) {
    return [
      "/mnt/c/Program Files (x86)/Warcraft III",
      "/mnt/c/Program Files/Warcraft III",
    ];
  }
  return [];
}

/**
 * The install folder: from `argument` (a folder or a file inside the
 * install) when given, else from `WC3_EXECUTABLE`, else the first well-known
 * folder that holds `.build.info`. A relative argument or variable resolves
 * against `cwd`. Nothing found is an {@link InstallNotFoundError}.
 */
export function findInstall(
  argument: string | undefined,
  cwd: string,
  machine: InstallMachine,
): string {
  const pathOf = machine.platform === "win32" ? path.win32 : path.posix;
  if (argument !== undefined) {
    const start = pathOf.resolve(cwd, argument);
    const found = installAbove(start, machine, pathOf);
    if (found === undefined) {
      throw new InstallNotFoundError(
        `${INSTALL_OPTION} is set to "${argument}", and no ${BUILD_INFO_FILE} is at or above ${start}.`,
      );
    }
    return found;
  }
  const looked: string[] = [];
  const fromEnv = machine.env[EXECUTABLE_ENV];
  if (fromEnv !== undefined && fromEnv !== "") {
    const start = pathOf.resolve(cwd, fromEnv);
    looked.push(start);
    const found = installAbove(start, machine, pathOf);
    if (found !== undefined) return found;
  }
  for (const folder of wellKnownInstalls(machine)) {
    looked.push(folder);
    if (machine.isFile(pathOf.join(folder, BUILD_INFO_FILE))) return folder;
  }
  const where =
    looked.length > 0
      ? ` Looked at: ${looked.map((p) => `"${p}"`).join(", ")}.`
      : "";
  throw new InstallNotFoundError(
    `Warcraft III was not found. Pass ${INSTALL_OPTION} <folder> or set the ${EXECUTABLE_ENV} environment variable to the game's executable.${where}`,
  );
}

/** The nearest folder at or above `start` that holds `.build.info`. */
function installAbove(
  start: string,
  machine: Pick<InstallMachine, "isFile">,
  pathOf: path.PlatformPath,
): string | undefined {
  for (let folder = start; ; folder = pathOf.dirname(folder)) {
    if (machine.isFile(pathOf.join(folder, BUILD_INFO_FILE))) return folder;
    if (pathOf.dirname(folder) === folder) return undefined;
  }
}
