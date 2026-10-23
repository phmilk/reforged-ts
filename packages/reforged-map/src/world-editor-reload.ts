// The World Editor reload (#706; #700, "The World Editor reload"): after a
// tool wrote a map folder a World Editor holds without unsaved edits, start
// the World Editor with `-launch -loadfile <map folder>`, so that it loads
// what was written and its next save does not put back what it had loaded
// before. The caller finds the executable; this never waits for it.

import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { windowSystem, windowsPath } from "./world-editor.js";

/** How long `wslpath -w` may take, in milliseconds. */
const WSLPATH_TIMEOUT = 15_000;

/** The options of {@link reloadWorldEditor}. */
export interface WorldEditorReloadOptions {
  /**
   * Starts the executable with these arguments instead of the system,
   * returning at once: for tests, and for a tool that starts programs
   * itself. Detached, without waiting, when left out.
   */
  launch?: (executable: string, args: readonly string[]) => void;
  /**
   * The system the World Editor runs on: `"windows"`, or `"wsl"`, where the
   * map folder's path is converted for Windows. Detected when left out.
   */
  system?: "windows" | "wsl";
  /**
   * Converts the map folder's resolved WSL path to its Windows path under
   * WSL instead of `wslpath -w`. For tests.
   */
  windowsPath?: (folder: string) => string;
}

/**
 * Reloads a map folder in the World Editor: it starts the World Editor's
 * executable with `-launch -loadfile <map folder>`, without waiting for it.
 *
 * @remarks
 * Run it only after {@link checkWorldEditor} said `"open"` and the map
 * folder was written: a World Editor holding unsaved edits for the map
 * (`"modified"`) would be asked to drop them. Object sync runs it when
 * given the executable ({@link ObjectSyncOptions.worldEditorExecutable}).
 *
 * The map folder is passed by its Windows path: on Windows its resolved
 * path, under WSL the one `wslpath -w` gives. The executable is started
 * detached, with no standard input or output, and the function returns
 * once it is started; an error the executable meets after starting is not
 * reported.
 *
 * The caller finds the executable, `World Editor.exe` beside the game's.
 * Whether the World Editor of Patch 3.0.1 still loads a map folder given to
 * `-loadfile` is not settled in game: the game itself no longer does
 * ([reforged-ts-template#99](https://github.com/phmilk/reforged-ts-template/issues/99)).
 *
 * @param mapFolder - The path of the map folder to reload.
 * @param executable - The path of the World Editor's executable, as this
 *   system names it: a WSL path under WSL.
 * @param options - The launcher, the system and the path conversion, each
 *   the system's when left out.
 * @throws Error When the map folder is not a folder, the executable is not
 *   a file, the system is neither Windows nor WSL, or `wslpath -w` fails.
 *   Nothing is started.
 */
export function reloadWorldEditor(
  mapFolder: string,
  executable: string,
  options: WorldEditorReloadOptions = {},
): void {
  const folder = path.resolve(mapFolder);
  if (!fs.statSync(folder, { throwIfNoEntry: false })?.isDirectory()) {
    throw new Error(
      `The World Editor cannot reload ${mapFolder}: it is not a folder.`,
    );
  }
  if (!fs.statSync(executable, { throwIfNoEntry: false })?.isFile()) {
    throw new Error(
      `The World Editor cannot be started: ${executable} is not a file. Give the path of World Editor.exe, beside the game's.`,
    );
  }
  const system = options.system ?? windowSystem();
  if (system === undefined) {
    throw new Error(
      `The World Editor cannot be started from this system: it runs on Windows or WSL only.`,
    );
  }
  const loadPath =
    system === "wsl"
      ? (options.windowsPath ?? ((wsl) => windowsPath(wsl, WSLPATH_TIMEOUT)))(
          folder,
        )
      : folder;
  (options.launch ?? launchDetached)(executable, [
    "-launch",
    "-loadfile",
    loadPath,
  ]);
}

/** Starts a program detached from this process, which neither waits for it nor keeps it alive. */
function launchDetached(executable: string, args: readonly string[]): void {
  const child = spawn(executable, args, {
    detached: true,
    stdio: "ignore",
    windowsHide: false,
  });
  // An error after the start (one spawn reports late) is not this
  // process's to handle: without a listener it would end it.
  child.on("error", () => undefined);
  child.unref();
}
