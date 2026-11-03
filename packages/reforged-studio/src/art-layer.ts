/**
 * The art layer the Studio previews in, as #481 settled it: the World
 * Editor's Asset Mode preference (`[Misc] assetMode` of
 * `Documents\Warcraft III\WorldEditPreferences.txt`), limited by the map's
 * Supported Modes (`war3map.w3i`), and HD when the preference cannot be
 * read.
 *
 * Neither the meaning of the preference's values nor that of the Supported
 * Modes was checked in the World Editor; both are the human checks of #842.
 * The preference reads 0, 1 and 2 as SD, HD and DE, the order of the
 * editor's strings `WESTRING_PREFS_ASSETMODE_SD`, `_HD` and `_DE`, and -1
 * as Default, which takes the same section's `hd` (the research's sample
 * file holds `assetMode=-1` with `hd=1`). The Supported Modes read 1 to 4
 * in the order of `WESTRING_ASSET_MODE_SD`, `_HD`, `_HYBRID` ("All Modes")
 * and `_DE`: every map the 3.0 World Editor saved in the workspace's
 * fixtures stores 3.
 */
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { ArtLayer } from "./paths.js";
import { Profile } from "./profile.js";

/** The art layers, in the order the header's switch shows them. */
export const ART_LAYERS: readonly ArtLayer[] = ["sd", "hd", "de"];

/** The World Editor's preferences file, in the game's user folder. */
export const WORLD_EDITOR_PREFERENCES = "WorldEditPreferences.txt";

/**
 * The Probe runner's variable naming the game's user folder, the
 * `Warcraft III` folder of the Documents known folder, which holds the
 * World Editor's preferences.
 */
export const USER_FOLDER_ENV = "WC3_USER_FOLDER";

/** The art layers each value of a map's Supported Modes allows. */
export const SUPPORTED_MODES: Readonly<
  Partial<Record<number, readonly ArtLayer[]>>
> = {
  1: ["sd"],
  2: ["hd"],
  3: ["sd", "hd", "de"],
  4: ["de"],
};

/** The art layer of each value of the Asset Mode preference and its `hd`. */
const ASSET_MODES: Readonly<Partial<Record<string, ArtLayer>>> = {
  "0": "sd",
  "1": "hd",
  "2": "de",
};

/** The art layer when the preference cannot be read. */
const DEFAULT_ART_LAYER: ArtLayer = "hd";

/** The section of the World Editor's preferences that holds the Asset Mode. */
const PREFERENCES_SECTION = "Misc";

/** What the art layer is read from. */
export interface ArtLayerOptions {
  /** The World Editor's preferences file; none read when absent. */
  preferencesFile?: string;
  /** The map's Supported Modes, as `war3map.w3i` stores them; no limit when absent. */
  supportedModes?: number;
}

/**
 * The art layers a map's Supported Modes allow, in the switch's order.
 *
 * @param supportedModes - The Supported Modes `war3map.w3i` stores; every
 *   layer when absent or outside 1 to 4.
 * @returns The layers the switch offers.
 */
export function allowedArtLayers(
  supportedModes: number | undefined,
): readonly ArtLayer[] {
  return (
    (supportedModes === undefined
      ? undefined
      : SUPPORTED_MODES[supportedModes]) ?? ART_LAYERS
  );
}

/** What the preferences file is found from; tests answer with a fake. */
export interface PreferencesMachine {
  platform: NodeJS.Platform;
  /** Whether Linux runs under WSL, where the World Editor is on the Windows side. */
  wsl: boolean;
  env: Readonly<Record<string, string | undefined>>;
  /**
   * Runs a program and answers its output, trimmed; undefined when it
   * cannot run or fails.
   */
  run(command: string, args: readonly string[]): Promise<string | undefined>;
}

/** Runs a program, its output read as UTF-8, for at most ten seconds. */
function runProgram(
  command: string,
  args: readonly string[],
): Promise<string | undefined> {
  return new Promise((resolve) => {
    execFile(
      command,
      args,
      { encoding: "utf8", timeout: 10_000, windowsHide: true },
      (error, stdout) => {
        resolve(error === null ? stdout.trim() : undefined);
      },
    );
  });
}

/** The arguments that make PowerShell print the Documents known folder. */
const DOCUMENTS_COMMAND = [
  "-NoProfile",
  "-NonInteractive",
  "-Command",
  "[Environment]::GetFolderPath('MyDocuments')",
];

/**
 * Finds the World Editor's preferences file, `WorldEditPreferences.txt`
 * of the game's user folder: in the folder `WC3_USER_FOLDER` names when it
 * is set; else in `Warcraft III` of the Documents known folder, which
 * Windows may redirect (to OneDrive), so it is asked of Windows, through
 * PowerShell, rather than built from the home folder; under WSL through
 * interop, at its WSL path.
 *
 * @param machine - The platform, the environment and how to run a program;
 *   the running process's when left out.
 * @returns The file's path, which may not exist; undefined off Windows and
 *   WSL without `WC3_USER_FOLDER`, or when Windows cannot say where the
 *   Documents folder is.
 */
export async function findWorldEditorPreferences(
  machine: PreferencesMachine,
): Promise<string | undefined> {
  const userFolder = machine.env[USER_FOLDER_ENV];
  if (userFolder !== undefined && userFolder !== "") {
    const join =
      machine.platform === "win32" ? path.win32.join : path.posix.join;
    return join(userFolder, WORLD_EDITOR_PREFERENCES);
  }
  if (machine.platform === "win32") {
    const documents = await machine.run("powershell", DOCUMENTS_COMMAND);
    return documents === undefined || documents === ""
      ? undefined
      : path.win32.join(documents, "Warcraft III", WORLD_EDITOR_PREFERENCES);
  }
  if (!machine.wsl) return undefined;
  const documents = await machine.run("powershell.exe", DOCUMENTS_COMMAND);
  if (documents === undefined || documents === "") return undefined;
  const folder = await machine.run("wslpath", ["-u", documents]);
  return folder === undefined || folder === ""
    ? undefined
    : path.posix.join(folder, "Warcraft III", WORLD_EDITOR_PREFERENCES);
}

/** The running machine's way to the preferences file. */
export function systemPreferencesMachine(wsl: boolean): PreferencesMachine {
  return { platform: process.platform, wsl, env: process.env, run: runProgram };
}

/**
 * The art layer: the World Editor's Asset Mode preference, HD when the file
 * or its value cannot be read, limited by the map's Supported Modes. A
 * value of the Supported Modes outside 1 to 4 limits nothing.
 */
export async function readArtLayer(
  options: ArtLayerOptions,
): Promise<ArtLayer> {
  let preferred = DEFAULT_ART_LAYER;
  if (options.preferencesFile !== undefined) {
    let text: string | undefined;
    try {
      text = await readFile(options.preferencesFile, "utf8");
    } catch {
      text = undefined;
    }
    if (text !== undefined) {
      const preferences = new Profile("last");
      preferences.add(text, options.preferencesFile);
      const mode = preferences.get(PREFERENCES_SECTION, "assetMode");
      const layer =
        mode === "-1"
          ? ASSET_MODES[preferences.get(PREFERENCES_SECTION, "hd") ?? ""]
          : ASSET_MODES[mode ?? ""];
      if (layer !== undefined) preferred = layer;
    }
  }
  const allowed =
    options.supportedModes === undefined
      ? undefined
      : SUPPORTED_MODES[options.supportedModes];
  if (allowed === undefined || allowed.includes(preferred)) return preferred;
  return allowed[0] ?? preferred;
}
