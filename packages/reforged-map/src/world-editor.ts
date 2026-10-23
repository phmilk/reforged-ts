// The World Editor check (#475): whether a World Editor window holds a map
// folder, and whether it shows unsaved edits. Only the main window's title
// tells: `Warcraft III World Editor - [<path>]`, then `[<path> *]` once
// modified. The titles are read through EnumWindows and GetWindowText in a
// short-lived powershell.exe, on Windows and on WSL, where the folder's path
// is converted with `wslpath -w`. A check that cannot read them fails
// closed: the writer error, never "no window".

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { ObjectDataWriterError } from "./writer-error.js";

/**
 * What the World Editor shows of a map folder: `"no-window"`, no World
 * Editor window holds it; `"open"`, a window holds it without unsaved edits;
 * `"modified"`, a window holds it with unsaved edits, its title ending in
 * ` *]`.
 */
export type WorldEditorState = "no-window" | "open" | "modified";

/** The options of {@link checkWorldEditor}. */
export interface WorldEditorCheckOptions {
  /**
   * Reads the titles of the top-level windows instead of the system: the
   * map folder's path is then compared as given, resolved and not
   * converted. An error it throws is a failed check. For tests, and for a
   * tool that reads the titles itself.
   */
  readWindowTitles?: () => readonly string[];
  /** How long the check may take, in milliseconds, before it fails: 15000 when left out. */
  timeout?: number;
}

/** The start of a World Editor main window's title, up to the map's path. */
const TITLE_PREFIX = "Warcraft III World Editor - [";

/** The end of the path in the title of a World Editor holding unsaved edits. */
const MODIFIED_SUFFIX = " *";

const DEFAULT_TIMEOUT = 15_000;

/** The line the script prints last, so that a cut-off output is a failure. */
const END_LINE = "reforged-map: end of window titles";

/**
 * The PowerShell script that prints the title of each top-level window
 * whose title starts with {@link TITLE_PREFIX}, one per line in UTF-8, then
 * {@link END_LINE}.
 */
const SCRIPT = `$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Add-Type -TypeDefinition @'
using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Text;
public static class ReforgedMapWindowTitles {
  delegate bool EnumWindowsProc(IntPtr window, IntPtr data);
  [DllImport("user32.dll", SetLastError = true)] static extern bool EnumWindows(EnumWindowsProc callback, IntPtr data);
  [DllImport("user32.dll", CharSet = CharSet.Unicode)] static extern int GetWindowTextLength(IntPtr window);
  [DllImport("user32.dll", CharSet = CharSet.Unicode)] static extern int GetWindowText(IntPtr window, StringBuilder text, int length);
  public static List<string> Read() {
    var titles = new List<string>();
    EnumWindowsProc callback = (window, data) => {
      int length = GetWindowTextLength(window);
      if (length > 0) {
        var text = new StringBuilder(length + 1);
        GetWindowText(window, text, text.Capacity);
        titles.Add(text.ToString());
      }
      return true;
    };
    if (!EnumWindows(callback, IntPtr.Zero)) throw new System.ComponentModel.Win32Exception();
    return titles;
  }
}
'@
foreach ($title in [ReforgedMapWindowTitles]::Read()) {
  if ($title.StartsWith('${TITLE_PREFIX}', [System.StringComparison]::Ordinal)) { [Console]::Out.WriteLine($title) }
}
[Console]::Out.WriteLine('${END_LINE}')
`;

/**
 * Checks whether the World Editor holds a map folder, and whether it shows
 * unsaved edits for it.
 *
 * @remarks
 * It lists the top-level windows whose title has the form
 * `Warcraft III World Editor - [<path>]`, and keeps those whose path is the
 * map folder's, compared with `/` and `\` alike, ignoring case and a
 * trailing separator. A title ending in ` *]` is a World Editor with
 * unsaved edits ([#475](https://github.com/phmilk/reforged-ts/issues/475)).
 *
 * It reads the titles through `EnumWindows` and `GetWindowText` in a
 * short-lived `powershell.exe`: on Windows, and on WSL, where `powershell.exe`
 * is on the path and the map folder's path is converted with `wslpath -w`.
 * On any other system, and for a folder that does not exist, no World
 * Editor can hold it, and the state is `"no-window"` without running
 * anything. A check that cannot run, fails or times out throws: it is never
 * `"no-window"`.
 *
 * @param mapFolder - The path of the map folder.
 * @param options - Where the windows' titles come from, and how long the
 *   check may take.
 * @returns `"modified"` when a World Editor window holding the map folder
 *   shows unsaved edits, else `"open"` when one holds it, else
 *   `"no-window"`.
 * @throws {@link ObjectDataWriterError} With the reason
 *   `"world-editor-check-failed"`, when the titles cannot be read: the
 *   check could not run, failed or timed out.
 */
export function checkWorldEditor(
  mapFolder: string,
  options: WorldEditorCheckOptions = {},
): WorldEditorState {
  const folder = path.resolve(mapFolder);
  if (!fs.statSync(folder, { throwIfNoEntry: false })?.isDirectory()) {
    return "no-window";
  }
  const { readWindowTitles } = options;
  if (readWindowTitles !== undefined) {
    return stateOf(folder, attempt(mapFolder, readWindowTitles));
  }
  const system = windowSystem();
  if (system === undefined) return "no-window";
  const timeout = options.timeout ?? DEFAULT_TIMEOUT;
  const deadline = Date.now() + timeout;
  const titlePath =
    system === "wsl"
      ? attempt(mapFolder, () => windowsPath(folder, timeout))
      : folder;
  const titles = attempt(mapFolder, () =>
    systemWindowTitles(Math.max(1, deadline - Date.now())),
  );
  return stateOf(titlePath, titles);
}

/** The state the windows' titles give a map folder's path. */
function stateOf(folder: string, titles: readonly string[]): WorldEditorState {
  const wanted = comparable(folder);
  let state: WorldEditorState = "no-window";
  for (const title of titles) {
    if (!title.startsWith(TITLE_PREFIX) || !title.endsWith("]")) continue;
    const shown = title.slice(TITLE_PREFIX.length, -1);
    const modified = shown.endsWith(MODIFIED_SUFFIX);
    const shownPath = modified
      ? shown.slice(0, -MODIFIED_SUFFIX.length)
      : shown;
    if (comparable(shownPath) !== wanted) continue;
    if (modified) return "modified";
    state = "open";
  }
  return state;
}

/** A path as the check compares it: `\` read as `/`, in lower case, without a trailing separator. */
function comparable(folder: string): string {
  return folder.replaceAll("\\", "/").toLowerCase().replace(/\/+$/, "");
}

/** Runs one step of the check, a failure of which is the writer error. */
function attempt<T>(mapFolder: string, step: () => T): T {
  try {
    return step();
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new ObjectDataWriterError(
      "world-editor-check-failed",
      `The World Editor check of ${mapFolder} failed (${detail}), so whether the World Editor holds unsaved edits for it is unknown: nothing was written. ` +
        `Check that powershell.exe runs from this shell, or turn the check off for a folder no World Editor opens.`,
    );
  }
}

/** The system a World Editor runs on: Windows, or WSL, where Windows programs run with their paths converted by `wslpath -w`. */
export type WindowSystem = "windows" | "wsl";

/** Where a World Editor can run: on Windows, on WSL, or nowhere. */
export function windowSystem(): WindowSystem | undefined {
  if (process.platform === "win32") return "windows";
  if (process.platform !== "linux") return undefined;
  if (process.env.WSL_DISTRO_NAME !== undefined) return "wsl";
  try {
    const release = fs.readFileSync("/proc/sys/kernel/osrelease", "utf8");
    return /microsoft/i.test(release) ? "wsl" : undefined;
  } catch {
    return undefined;
  }
}

/** A WSL path as Windows names it, through `wslpath -w`. */
export function windowsPath(folder: string, timeout: number): string {
  return run("wslpath", ["-w", folder], timeout).replace(/\r?\n$/, "");
}

/** The titles of the top-level windows that start with {@link TITLE_PREFIX}, read by powershell.exe. */
function systemWindowTitles(timeout: number): string[] {
  const output = run(
    "powershell.exe",
    [
      "-NoLogo",
      "-NoProfile",
      "-NonInteractive",
      "-ExecutionPolicy",
      "Bypass",
      "-EncodedCommand",
      Buffer.from(SCRIPT, "utf16le").toString("base64"),
    ],
    timeout,
  );
  const lines = output.split(/\r?\n/);
  while (lines.at(-1) === "") lines.pop();
  if (lines.pop() !== END_LINE) {
    throw new Error("powershell.exe stopped before listing every window");
  }
  return lines;
}

/** The standard output of a command, which must exit with 0 within the timeout. */
function run(
  command: string,
  args: readonly string[],
  timeout: number,
): string {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    timeout,
    windowsHide: true,
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.error !== undefined) {
    throw new Error(
      (result.error as NodeJS.ErrnoException).code === "ETIMEDOUT"
        ? `${command} timed out after ${String(timeout)} ms`
        : `${command} could not run: ${result.error.message}`,
    );
  }
  if (result.status !== 0) {
    const stderr = result.stderr.trim().split(/\r?\n/)[0] ?? "";
    throw new Error(
      `${command} exited with ${String(result.status ?? result.signal)}${stderr === "" ? "" : `: ${stderr}`}`,
    );
  }
  return result.stdout;
}
