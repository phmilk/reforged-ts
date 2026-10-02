/**
 * Where the game writes its files: the `CustomMapData` folder of its user
 * folder. The game follows the Documents known folder, which Windows may
 * redirect (to OneDrive, `OneDrive\Documentos`), so the lookup reads that
 * folder from the registry, or under WSL from Windows through interop, and
 * never takes the home folder's `Documents`, which can exist and be the
 * wrong one (#298, section 2.1).
 */
import path from "node:path";
import { AuthorError } from "./errors.js";
import type { Machine } from "./machine.js";

/** Names the game's user folder, the `Warcraft III` folder that holds `CustomMapData`. */
export const USER_FOLDER_VARIABLE = "WC3_USER_FOLDER";

/** The registry key of the current user's known folders. */
export const DOCUMENTS_KEY =
  "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\User Shell Folders";

/** The value of the Documents known folder under `DOCUMENTS_KEY`. */
export const DOCUMENTS_VALUE = "Personal";

/** The path functions of the machine's platform. */
export function pathsOf(machine: Machine): path.PlatformPath {
  return machine.platform === "win32" ? path.win32 : path.posix;
}

/**
 * The game's `CustomMapData` folder: in `WC3_USER_FOLDER` when it is set;
 * else, on Windows, in `Warcraft III` of the Documents known folder, read
 * from the registry with its `%VAR%`s expanded; under WSL, in that folder as
 * Windows gives it, at its WSL path. Anything else is an AuthorError that
 * says to set `WC3_USER_FOLDER`.
 */
export function customMapDataFolder(machine: Machine): string {
  const paths = pathsOf(machine);
  const userFolder = machine.env[USER_FOLDER_VARIABLE];
  if (userFolder !== undefined && userFolder !== "") {
    return paths.join(userFolder, "CustomMapData");
  }
  const setIt = `Set ${USER_FOLDER_VARIABLE} to the game's user folder, the "Warcraft III" folder that holds CustomMapData`;
  if (machine.wsl !== undefined) {
    const { wsl } = machine;
    return paths.join(
      wsl.toWsl(wsl.documentsFolder()),
      "Warcraft III",
      "CustomMapData",
    );
  }
  if (machine.platform !== "win32") {
    throw new AuthorError(
      `${setIt}: the runner finds it by itself only on Windows and under WSL, from the Documents known folder.`,
    );
  }
  const documents = machine.queryRegistry(DOCUMENTS_KEY, DOCUMENTS_VALUE);
  if (documents === undefined || documents === "") {
    throw new AuthorError(
      `${setIt}: the Documents known folder could not be read from the registry (${DOCUMENTS_VALUE} under ${DOCUMENTS_KEY}).`,
    );
  }
  return paths.join(
    expandVariables(documents, machine.env),
    "Warcraft III",
    "CustomMapData",
  );
}

/**
 * `%NAME%` replaced by the variable `NAME` of `env`, its name in any case as
 * on Windows; a variable `env` lacks is left as written, as Windows leaves
 * it.
 */
function expandVariables(
  text: string,
  env: Readonly<Record<string, string | undefined>>,
): string {
  return text.replace(/%([^%]+)%/g, (written, name: string) => {
    const key = Object.keys(env).find(
      (candidate) => candidate.toLowerCase() === name.toLowerCase(),
    );
    return (key === undefined ? undefined : env[key]) ?? written;
  });
}
