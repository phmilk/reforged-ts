// The World Editor reload (#706, #871; #700, "The World Editor reload"):
// after a tool wrote a map folder a World Editor holds without unsaved
// edits, make the World Editor load what was written, so that its next save
// does not put back what it had loaded before. `-launch -loadfile <map
// folder>` alone does not: a World Editor that holds the folder answers it
// with "The file '<path>' is already open and active." So the reload first
// posts File, Close Map to the window that holds the folder, waits for its
// title to drop the path, then runs `-launch -loadfile`, and watches for the
// World Editor's `Warning` dialog. The screen check behind it is
// docs/research/world-editor-reload.md.

import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import {
  powershell,
  titleState,
  windowSystem,
  windowsPath,
} from "./world-editor.js";

/** How long `wslpath -w` and each read of the windows may take, in milliseconds. */
const STEP_TIMEOUT = 15_000;

/** The `WM_COMMAND` id of File, Close Map in the World Editor's main menu (Ctrl+W), read with `GetMenuItemID`. */
export const CLOSE_MAP_COMMAND = 64189;

/** The title of the World Editor's dialogs that ask or warn: "Save changes to …?" and "… is already open and active." */
const WARNING_TITLE = "Warning";

/** A top-level window of the World Editor, as the reload reads it. */
export interface WorldEditorWindow {
  /** The window's handle, as the window system names it. */
  readonly handle: string;
  /** Its title. */
  readonly title: string;
  /**
   * `"main"`, a main window, titled `Warcraft III World Editor`, then
   * ` - [<path>]` while it holds a map; `"warning"`, a dialog of the World
   * Editor titled `Warning`.
   */
  readonly kind: "main" | "warning";
}

/** The window system the reload reads and drives: the system's through `powershell.exe` when left out. */
export interface WorldEditorWindows {
  /**
   * Lists the World Editor's top-level windows.
   *
   * @returns Its main windows and its `Warning` dialogs.
   */
  list(): readonly WorldEditorWindow[];
  /**
   * Posts File, Close Map ({@link CLOSE_MAP_COMMAND}) to a main window,
   * without waiting for it.
   *
   * @param handle - The main window's handle.
   */
  closeMap(handle: string): void;
  /**
   * Presses a dialog's Cancel button (control 2), or its only button
   * (control 1) when it has no Cancel.
   *
   * @param handle - The dialog's handle.
   */
  cancel(handle: string): void;
}

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
  /**
   * Reads and drives the World Editor's windows instead of the system: for
   * tests, and for a tool that reads windows itself. An error it throws
   * ends the reload with that error.
   */
  windows?: WorldEditorWindows;
  /** How long to wait for Close Map to take the map away, in milliseconds: 5000 when left out. */
  closeTimeout?: number;
  /** How long to wait for the World Editor to show the map again after `-loadfile`, in milliseconds: 10000 when left out. */
  loadTimeout?: number;
  /** How long to wait between two reads of the windows, in milliseconds: 250 when left out. */
  pollInterval?: number;
}

/**
 * Why {@link reloadWorldEditor} did not reload the map:
 *
 * - `"modified"`: a World Editor window shows unsaved edits for it (` *]`);
 *   nothing was closed or started.
 * - `"dialog-open"`: a World Editor `Warning` dialog was already open;
 *   nothing was closed or started.
 * - `"save-prompt"`: Close Map asked to save changes, the map holding
 *   unsaved edits after all; the prompt was cancelled, the map and its
 *   edits kept, and nothing started.
 * - `"not-closed"`: the window still showed the map once the close timeout
 *   ran out; nothing was started.
 * - `"warning"`: after `-loadfile`, the World Editor showed a `Warning`
 *   dialog, such as "The file '<path>' is already open and active."; it was
 *   pressed away.
 * - `"not-loaded"`: after `-loadfile`, no World Editor window showed the
 *   map again before the load timeout ran out.
 */
export type WorldEditorNotReloadedReason =
  | "modified"
  | "dialog-open"
  | "save-prompt"
  | "not-closed"
  | "warning"
  | "not-loaded";

/**
 * What {@link reloadWorldEditor} did: `"reloaded"`, the World Editor held
 * the map, closed it and showed it again from disk; `"opened"`, no World
 * Editor window held the map, and the executable was started with
 * `-launch -loadfile` without waiting for it; `"not-reloaded"`, with the
 * reason and a message to show.
 */
export type WorldEditorReload =
  | { readonly status: "reloaded" }
  | { readonly status: "opened" }
  | {
      readonly status: "not-reloaded";
      readonly reason: WorldEditorNotReloadedReason;
      readonly message: string;
    };

/**
 * Reloads a map folder in the World Editor: it closes the map in the World
 * Editor window that holds it without unsaved edits, then starts the
 * World Editor's executable with `-launch -loadfile <map folder>`, and says
 * whether the World Editor showed the map again.
 *
 * @remarks
 * `-launch -loadfile` alone does not reload a map the World Editor holds:
 * it shows "The file '<path>' is already open and active." and keeps what
 * it loaded. In order, as the screen check of
 * [`docs/research/world-editor-reload.md`](https://github.com/phmilk/reforged-ts/blob/master/docs/research/world-editor-reload.md)
 * found reliable ([#871](https://github.com/phmilk/reforged-ts/issues/871)):
 *
 * 1. It lists the World Editor's windows. A main window whose title shows
 *    the map folder (`Warcraft III World Editor - [<path>]`, compared as
 *    {@link checkWorldEditor} compares it) with ` *]` stops the reload
 *    (`"modified"`), and so does a `Warning` dialog already open
 *    (`"dialog-open"`): nothing is closed or started. A window holding
 *    another map is never touched.
 * 2. With no window holding the map, it starts the executable and returns
 *    `"opened"` without waiting.
 * 3. Else it posts File, Close Map ({@link CLOSE_MAP_COMMAND}) to each
 *    window that holds it, and reads the windows again until none shows
 *    the map, for up to `closeTimeout`. A `Warning` dialog meanwhile is
 *    the World Editor asking to save changes: it is cancelled and the
 *    reload stops (`"save-prompt"`), the map and its edits kept.
 * 4. It starts the executable, then reads the windows until one shows the
 *    map again (`"reloaded"`), for up to `loadTimeout` (`"not-loaded"`),
 *    and once more a poll later. A `Warning` dialog meanwhile is pressed
 *    away, control 2 or else 1, and the reload did not happen
 *    (`"warning"`).
 *
 * It runs synchronously: each read of the windows is a short-lived
 * `powershell.exe`, as the World Editor check's, and a reload takes a few
 * seconds. Run it after {@link checkWorldEditor} said `"open"` and the map
 * folder was written. Object sync runs it when given the executable
 * ({@link ObjectSyncOptions.worldEditorExecutable}).
 *
 * The map folder is passed by its Windows path: on Windows its resolved
 * path, under WSL the one `wslpath -w` gives. The executable is started
 * detached, with no standard input or output; an error it meets after
 * starting is not reported. The caller finds the executable, `World
 * Editor.exe` beside the game's.
 *
 * @param mapFolder - The path of the map folder to reload.
 * @param executable - The path of the World Editor's executable, as this
 *   system names it: a WSL path under WSL.
 * @param options - The launcher, the system, the path conversion, the
 *   window system and the waits, each the system's or its default when
 *   left out.
 * @returns What it did: `"reloaded"`, `"opened"`, or `"not-reloaded"` with
 *   the reason and a message.
 * @throws Error When the map folder is not a folder, the executable is not
 *   a file, the system is neither Windows nor WSL, `wslpath -w` fails, or
 *   the World Editor's windows cannot be read or driven. Nothing is started
 *   when it throws; a failure after Close Map leaves the map closed.
 */
export function reloadWorldEditor(
  mapFolder: string,
  executable: string,
  options: WorldEditorReloadOptions = {},
): WorldEditorReload {
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
      ? (options.windowsPath ?? ((wsl) => windowsPath(wsl, STEP_TIMEOUT)))(
          folder,
        )
      : folder;
  const windows = options.windows ?? systemWindows;
  const pollInterval = options.pollInterval ?? 250;
  const notReloaded = (
    reason: WorldEditorNotReloadedReason,
    message: string,
  ): WorldEditorReload => ({ status: "not-reloaded", reason, message });
  const start = () => {
    (options.launch ?? launchDetached)(executable, [
      "-launch",
      "-loadfile",
      loadPath,
    ]);
  };

  const listed = windows.list();
  const holding = listed.filter(
    (window) =>
      window.kind === "main" &&
      titleState(window.title, loadPath) !== "no-window",
  );
  if (
    holding.some((window) => titleState(window.title, loadPath) === "modified")
  ) {
    return notReloaded(
      "modified",
      `The World Editor shows unsaved edits for ${mapFolder}: it was not reloaded, so that they are kept.`,
    );
  }
  if (listed.some((window) => window.kind === "warning")) {
    return notReloaded(
      "dialog-open",
      `A World Editor dialog titled Warning is open: ${mapFolder} was neither closed nor reloaded. Answer the dialog there.`,
    );
  }
  if (holding.length === 0) {
    start();
    return { status: "opened" };
  }
  /** Whether a main window, or one of those given, shows the map folder. */
  const shows = (
    now: readonly WorldEditorWindow[],
    among: readonly WorldEditorWindow[] = now,
  ) =>
    now.some(
      (window) =>
        window.kind === "main" &&
        among.some((each) => each.handle === window.handle) &&
        titleState(window.title, loadPath) !== "no-window",
    );
  /** Reads the windows until they are done, or a Warning shows, pressed away; for up to the timeout. */
  const watch = (
    timeout: number,
    done: (now: readonly WorldEditorWindow[]) => boolean,
  ) =>
    waitFor(timeout, pollInterval, () => {
      const now = windows.list();
      const warning = now.find((window) => window.kind === "warning");
      if (warning !== undefined) {
        windows.cancel(warning.handle);
        return "warning" as const;
      }
      return done(now) ? ("done" as const) : undefined;
    });

  for (const window of holding) windows.closeMap(window.handle);
  const closeTimeout = options.closeTimeout ?? 5_000;
  // A Warning now is Close Map asking to save changes.
  const closed = watch(closeTimeout, (now) => !shows(now, holding));
  if (closed === "warning") {
    return notReloaded(
      "save-prompt",
      `The World Editor asked to save changes to ${mapFolder} on Close Map: it holds unsaved edits, so the prompt was cancelled and the map kept, not reloaded.`,
    );
  }
  if (closed === undefined) {
    return notReloaded(
      "not-closed",
      `The World Editor still showed ${mapFolder} ${String(closeTimeout)} ms after Close Map: it was not reloaded.`,
    );
  }

  start();
  const loadTimeout = options.loadTimeout ?? 10_000;
  let loaded = watch(loadTimeout, (now) => shows(now));
  if (loaded === "done") {
    // A Warning may follow the title: one more read, a poll later.
    sleep(pollInterval);
    loaded = watch(0, () => true);
  }
  if (loaded === "warning") {
    return notReloaded(
      "warning",
      `The World Editor answered -loadfile ${mapFolder} with a Warning, pressed away: it did not reload the map.`,
    );
  }
  if (loaded === undefined) {
    return notReloaded(
      "not-loaded",
      `The World Editor did not show ${mapFolder} again within ${String(loadTimeout)} ms of -loadfile: whether it loaded it is unknown.`,
    );
  }
  return { status: "reloaded" };
}

/**
 * Reads until a read gives a value or the timeout runs out, waiting the
 * interval between two reads; it reads at least once.
 */
function waitFor<T>(
  timeout: number,
  interval: number,
  read: () => T | undefined,
): T | undefined {
  const deadline = Date.now() + timeout;
  for (;;) {
    const value = read();
    if (value !== undefined) return value;
    const left = deadline - Date.now();
    if (left <= 0) return undefined;
    sleep(Math.min(interval, left));
  }
}

/** Blocks this thread for a while. */
function sleep(ms: number): void {
  if (ms <= 0) return;
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
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

/** The line the window script prints last, so that a cut-off output is a failure. */
const END_LINE = "reforged-map: end of World Editor windows";

/**
 * The PowerShell script that runs one call of the window class: `List()`
 * prints each World Editor window as `<kind>\t<handle>\t<title>`, a main
 * window by its title alone, as the World Editor check reads it, a visible
 * `Warning` dialog when the `World Editor` process owns it; then
 * {@link END_LINE}.
 */
const windowScript = (call: string): string => `$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Add-Type -TypeDefinition @'
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Text;
public static class ReforgedMapWorldEditorWindows {
  delegate bool EnumWindowsProc(IntPtr window, IntPtr data);
  [DllImport("user32.dll", SetLastError = true)] static extern bool EnumWindows(EnumWindowsProc callback, IntPtr data);
  [DllImport("user32.dll", CharSet = CharSet.Unicode)] static extern int GetWindowTextLength(IntPtr window);
  [DllImport("user32.dll", CharSet = CharSet.Unicode)] static extern int GetWindowText(IntPtr window, StringBuilder text, int length);
  [DllImport("user32.dll")] static extern bool IsWindowVisible(IntPtr window);
  [DllImport("user32.dll")] static extern uint GetWindowThreadProcessId(IntPtr window, out uint process);
  [DllImport("user32.dll", SetLastError = true)] static extern bool PostMessage(IntPtr window, uint message, IntPtr wParam, IntPtr lParam);
  [DllImport("user32.dll")] static extern IntPtr GetDlgItem(IntPtr dialog, int id);
  [DllImport("user32.dll")] static extern IntPtr SendMessage(IntPtr window, uint message, IntPtr wParam, IntPtr lParam);
  static string ProcessName(IntPtr window) {
    uint id;
    GetWindowThreadProcessId(window, out id);
    try { return Process.GetProcessById((int)id).ProcessName; } catch (Exception) { return ""; }
  }
  public static List<string> List() {
    var lines = new List<string>();
    EnumWindowsProc callback = (window, data) => {
      int length = GetWindowTextLength(window);
      if (length > 0) {
        var text = new StringBuilder(length + 1);
        GetWindowText(window, text, text.Capacity);
        string title = text.ToString();
        if (title == "Warcraft III World Editor" || title.StartsWith("Warcraft III World Editor - [", StringComparison.Ordinal)) {
          lines.Add("main\\t" + window.ToInt64() + "\\t" + title);
        } else if (title == "${WARNING_TITLE}" && IsWindowVisible(window) && ProcessName(window) == "World Editor") {
          lines.Add("warning\\t" + window.ToInt64() + "\\t" + title);
        }
      }
      return true;
    };
    if (!EnumWindows(callback, IntPtr.Zero)) throw new System.ComponentModel.Win32Exception();
    return lines;
  }
  public static void CloseMap(long window) {
    if (!PostMessage(new IntPtr(window), 0x0111, new IntPtr(${String(CLOSE_MAP_COMMAND)}), IntPtr.Zero)) throw new System.ComponentModel.Win32Exception();
  }
  public static void Cancel(long dialog) {
    IntPtr button = GetDlgItem(new IntPtr(dialog), 2);
    if (button == IntPtr.Zero) button = GetDlgItem(new IntPtr(dialog), 1);
    if (button == IntPtr.Zero) throw new Exception("the dialog has no button 1 or 2");
    SendMessage(button, 0x00F5, IntPtr.Zero, IntPtr.Zero);
  }
}
'@
${call}
[Console]::Out.WriteLine('${END_LINE}')
`;

/** A window handle as the script takes it: a decimal integer, never text to run. */
function handleOf(handle: string): string {
  if (!/^-?\d+$/.test(handle)) {
    throw new Error(`${handle} is not a window handle`);
  }
  return handle;
}

/** Runs one call of the window script, a failure of which names the step. */
function windowCall(step: string, call: string): string[] {
  try {
    return powershell(windowScript(call), END_LINE, STEP_TIMEOUT);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(
      `The World Editor's windows could not be ${step}: ${detail}`,
      { cause: error },
    );
  }
}

/** The system's window system: the World Editor's windows read and driven by a short-lived powershell.exe per call. */
const systemWindows: WorldEditorWindows = {
  list: () =>
    windowCall(
      "read",
      "foreach ($line in [ReforgedMapWorldEditorWindows]::List()) { [Console]::Out.WriteLine($line) }",
    ).flatMap((line): WorldEditorWindow[] => {
      const parts = line.split("\t");
      const [kind = "", handle = "", ...title] = parts;
      if (parts.length < 3 || (kind !== "main" && kind !== "warning")) {
        return [];
      }
      return [{ kind, handle, title: title.join("\t") }];
    }),
  closeMap: (handle) => {
    windowCall(
      "closed",
      `[ReforgedMapWorldEditorWindows]::CloseMap(${handleOf(handle)})`,
    );
  },
  cancel: (handle) => {
    windowCall(
      "answered",
      `[ReforgedMapWorldEditorWindows]::Cancel(${handleOf(handle)})`,
    );
  },
};
