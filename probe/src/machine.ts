/**
 * The machine the Probe runner's Node side reaches: its platform and
 * environment, its files, the registry, its processes and the programs it
 * starts, its windows and the time. Every command takes one `Machine`, so a
 * test answers with a fake instead of the real machine. The Template's
 * `ExecutableProbe` (platform, environment, file existence), extended. Under
 * WSL the platform is `linux` and `wsl` reaches the Windows side through
 * interop (#347), for `probe:read` only: `probe:run` runs on native Windows.
 */
import { execFileSync, spawn } from "node:child_process";
import fs from "node:fs";
import { AuthorError } from "./errors.js";

/** A program to start: what `spawn` takes, without spawning. */
export interface SpawnCommand {
  command: string;
  args: readonly string[];
}

/** A process `startGame` started. */
export interface GameProcess {
  pid: number;
  /** Whether the process has exited, by itself or ended. */
  exited(): boolean;
}

/**
 * The Windows side of a WSL machine, reached through interop: the game is a
 * Windows program, so the reader finds its files and process there. Each
 * method raises an AuthorError naming the interop step that failed.
 */
export interface Wsl {
  /** The WSL path of a Windows path (`wslpath -u`): `C:\x` gives `/mnt/c/x`. */
  toWsl(windowsPath: string): string;
  /** The Windows Documents known folder, as a Windows path, redirection included. */
  documentsFolder(): string;
}

export interface Machine {
  /** Node's platform: `linux` under WSL, which `wsl` then marks. */
  platform: NodeJS.Platform;
  /** The Windows side, on a WSL machine only. */
  wsl?: Wsl;
  env: Readonly<Record<string, string | undefined>>;
  /** Whether `file` exists and is a file. */
  exists(file: string): boolean;
  /** The text of `file`, read as UTF-8; undefined when it is not a file. */
  readFile(file: string): string | undefined;
  /**
   * The data of the string value `value` under the registry key `key`
   * (`reg query <key> /v <value>`), as stored: a `REG_EXPAND_SZ` keeps its
   * `%VAR%`s. Undefined when the key or the value is missing, or off
   * Windows.
   */
  queryRegistry(key: string, value: string): string | undefined;
  /**
   * Whether a process of this image name runs, from the process list
   * (`tasklist`, `tasklistArgs`; `tasklist.exe` under WSL), which it only
   * reads: it stops no process. False off Windows and WSL.
   */
  isRunning(imageName: string): boolean;
  /**
   * Starts the program, its output ignored, and keeps its process, which
   * the command ends with `endProcess`. Native Windows only.
   */
  startGame(command: SpawnCommand): Promise<GameProcess>;
  /**
   * Posts one space key, `WM_KEYDOWN` then `WM_KEYUP`, to the main window of
   * the process `pid` (`PostMessage`: the window needs no focus, and may be
   * minimized). False when the process has no window yet. Native Windows
   * only.
   */
  postKey(pid: number): boolean;
  /**
   * Captures the main window of the process `pid` to the PNG file `file`
   * (`PrintWindow` with `PW_RENDERFULLCONTENT`, which reads a DirectX
   * window). A minimized window has no picture: it is shown first without
   * being activated (`SW_SHOWNOACTIVATE`), and stays shown, for the human to
   * log in. An AuthorError when the process has no window or the capture
   * fails. Native Windows only.
   */
  captureWindow(pid: number, file: string): void;
  /**
   * Ends the process `pid`, and only it (`taskkill /F /PID <pid>`: the game
   * ignores a plain `taskkill`). Native Windows only.
   */
  endProcess(pid: number): void;
  /** Milliseconds since the epoch. */
  now(): number;
  sleep(milliseconds: number): Promise<void>;
}

/**
 * Whether Linux runs under WSL: `WSL_DISTRO_NAME` is set, or the kernel
 * version names Microsoft, as WSL's kernels do.
 */
export function isWsl(
  platform: NodeJS.Platform,
  env: Machine["env"],
  procVersion: string | undefined,
): boolean {
  if (platform !== "linux") return false;
  if (env.WSL_DISTRO_NAME !== undefined && env.WSL_DISTRO_NAME !== "") {
    return true;
  }
  return /microsoft/i.test(procVersion ?? "");
}

/** Runs an interop program and gives its standard output. */
export type InteropRunner = (
  command: string,
  args: readonly string[],
) => string;

const runInterop: InteropRunner = (command, args) =>
  execFileSync(command, args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  });

/**
 * The output of the interop program `command`, trimmed. When it fails or
 * prints nothing, an AuthorError on one line naming `step`, the program and
 * `override`, what the human can do instead.
 */
export function interop(
  step: string,
  override: string,
  command: string,
  args: readonly string[],
  run: InteropRunner = runInterop,
): string {
  let output: string;
  try {
    output = run(command, args);
  } catch (error) {
    const reason =
      error instanceof Error ? (error.message.split("\n")[0] ?? "") : "";
    throw new AuthorError(
      `WSL interop failed to ${step} (${command}${reason ? `: ${reason}` : ""}). ${override}`,
    );
  }
  const text = output.trim();
  if (text === "") {
    throw new AuthorError(
      `WSL interop failed to ${step}: ${command} printed nothing. ${override}`,
    );
  }
  return text;
}

/** The Windows side of this machine through `wslpath`, `powershell.exe` and `cmd.exe`. */
const interopWsl: Wsl = {
  toWsl: (windowsPath) =>
    interop(
      `translate "${windowsPath}"`,
      "Check that wslpath is installed.",
      "wslpath",
      ["-u", windowsPath],
    ),
  documentsFolder: () =>
    interop(
      "read the Windows Documents folder",
      "Set WC3_USER_FOLDER to the game's user folder instead.",
      "powershell.exe",
      [
        "-NoProfile",
        "-NonInteractive",
        "-Command",
        "[Environment]::GetFolderPath('MyDocuments')",
      ],
    ),
};

const systemWsl: Wsl | undefined = isWsl(
  process.platform,
  process.env,
  fs.statSync("/proc/version", { throwIfNoEntry: false })?.isFile()
    ? fs.readFileSync("/proc/version", "utf8")
    : undefined,
)
  ? interopWsl
  : undefined;

/** The real machine. */
export const systemMachine: Machine = {
  platform: process.platform,
  ...(systemWsl !== undefined && { wsl: systemWsl }),
  env: process.env,
  exists: (file) =>
    fs.statSync(file, { throwIfNoEntry: false })?.isFile() ?? false,
  readFile: (file) =>
    fs.statSync(file, { throwIfNoEntry: false })?.isFile()
      ? fs.readFileSync(file, "utf8")
      : undefined,
  queryRegistry: (key, value) => {
    if (process.platform !== "win32") return undefined;
    let output: string;
    try {
      output = execFileSync("reg", ["query", key, "/v", value], {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
        windowsHide: true,
      });
    } catch {
      // reg exits 1 when the key or the value is missing.
      return undefined;
    }
    return parseRegQuery(output, value);
  },
  isRunning: (imageName) => {
    if (process.platform !== "win32" && systemWsl === undefined) return false;
    const program = process.platform === "win32" ? "tasklist" : "tasklist.exe";
    const output = execFileSync(program, tasklistArgs(imageName), {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      windowsHide: true,
    });
    return listsImage(output, imageName);
  },
  startGame: (command) =>
    new Promise((resolve, reject) => {
      const child = spawn(command.command, command.args, {
        stdio: "ignore",
      });
      let exited = false;
      child.once("exit", () => {
        exited = true;
      });
      child.once("error", (error: NodeJS.ErrnoException) => {
        reject(
          error.code === "ENOENT"
            ? new AuthorError(
                `Could not start "${command.command}": no such file. Check --game-executable or WC3_EXECUTABLE.`,
              )
            : error,
        );
      });
      child.once("spawn", () => {
        // Its exit still sets `exited`; only the command's own end waits on it.
        child.unref();
        const { pid } = child;
        if (pid === undefined) {
          reject(new Error(`${command.command} started with no pid`));
          return;
        }
        resolve({ pid, exited: () => exited });
      });
    }),
  postKey: (pid) => runWindowScript(pid, "key", "") === "posted",
  captureWindow: (pid, file) => {
    const result = runWindowScript(pid, "capture", file);
    if (result !== "captured") {
      throw new AuthorError(
        `Could not capture the window of process ${String(pid)}: ${result}.`,
      );
    }
  },
  endProcess: (pid) => {
    try {
      execFileSync("taskkill", ["/F", "/PID", String(pid)], {
        stdio: "ignore",
        windowsHide: true,
      });
    } catch {
      // taskkill exits non-zero when the process is gone already.
    }
  },
  now: () => Date.now(),
  sleep: (milliseconds) =>
    new Promise((resolve) => setTimeout(resolve, milliseconds)),
};

/**
 * The window helper's C#, compiled by PowerShell's `Add-Type`: `Key` posts
 * a space key to the process's main window, `Capture` saves a picture of it
 * as a PNG. Each returns the one word the machine checks, or the reason it
 * could not.
 */
const WINDOW_HELPER = String.raw`
using System;
using System.Diagnostics;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;
using System.Threading;
public static class ProbeWindow {
  [StructLayout(LayoutKind.Sequential)] struct Rect { public int Left, Top, Right, Bottom; }
  [DllImport("user32.dll")] static extern bool PostMessage(IntPtr window, uint message, IntPtr wParam, IntPtr lParam);
  [DllImport("user32.dll")] static extern bool IsIconic(IntPtr window);
  [DllImport("user32.dll")] static extern bool ShowWindow(IntPtr window, int command);
  [DllImport("user32.dll")] static extern bool GetWindowRect(IntPtr window, out Rect rect);
  [DllImport("user32.dll")] static extern bool PrintWindow(IntPtr window, IntPtr hdc, uint flags);
  static IntPtr MainWindow(int pid) {
    try { return Process.GetProcessById(pid).MainWindowHandle; } catch (ArgumentException) { return IntPtr.Zero; }
  }
  public static string Key(int pid) {
    IntPtr window = MainWindow(pid);
    if (window == IntPtr.Zero) return "no window";
    // VK_SPACE, scan code 0x39: the lParam of a key down, then of a key up.
    PostMessage(window, 0x0100, new IntPtr(0x20), new IntPtr(0x00390001));
    PostMessage(window, 0x0101, new IntPtr(0x20), new IntPtr(unchecked((int)0xC0390001)));
    return "posted";
  }
  public static string Capture(int pid, string file) {
    IntPtr window = MainWindow(pid);
    if (window == IntPtr.Zero) return "no window";
    if (IsIconic(window)) {
      // SW_SHOWNOACTIVATE: a minimized window draws nothing to capture.
      ShowWindow(window, 4);
      Thread.Sleep(700);
    }
    Rect rect;
    if (!GetWindowRect(window, out rect)) return "no window rectangle";
    int width = rect.Right - rect.Left, height = rect.Bottom - rect.Top;
    if (width <= 0 || height <= 0) return "an empty window";
    using (Bitmap bitmap = new Bitmap(width, height)) {
      using (Graphics graphics = Graphics.FromImage(bitmap)) {
        IntPtr hdc = graphics.GetHdc();
        // PW_RENDERFULLCONTENT: reads a DirectX window too.
        bool printed = PrintWindow(window, hdc, 2);
        graphics.ReleaseHdc(hdc);
        if (!printed) return "PrintWindow failed";
      }
      bitmap.Save(file, ImageFormat.Png);
    }
    return "captured";
  }
}`;

/** A PowerShell single-quoted string of `text`. */
const powerShellString = (text: string) => `'${text.replaceAll("'", "''")}'`;

/**
 * Runs the window helper's `action` on the process `pid` through
 * `powershell.exe` and gives the word it printed, or why it could not run.
 */
function runWindowScript(
  pid: number,
  action: "key" | "capture",
  file: string,
): string {
  if (process.platform !== "win32") return "not on Windows";
  const call =
    action === "key"
      ? `[ProbeWindow]::Key(${String(pid)})`
      : `[ProbeWindow]::Capture(${String(pid)}, ${powerShellString(file)})`;
  const script = [
    `Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition ${powerShellString(WINDOW_HELPER)}`,
    call,
  ].join("\n");
  try {
    return execFileSync(
      "powershell.exe",
      [
        "-NoProfile",
        "-NonInteractive",
        "-ExecutionPolicy",
        "Bypass",
        "-EncodedCommand",
        Buffer.from(script, "utf16le").toString("base64"),
      ],
      {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
        windowsHide: true,
      },
    ).trim();
  } catch (error) {
    const reason =
      error instanceof Error ? (error.message.split("\n")[0] ?? "") : "";
    return `powershell.exe failed${reason ? ` (${reason})` : ""}`;
  }
}

/**
 * The arguments of the `tasklist` that lists the processes of the image
 * `imageName`, one CSV line each without a header: a query of the process
 * list, which reads and never stops a process.
 */
export function tasklistArgs(imageName: string): string[] {
  return ["/FI", `IMAGENAME eq ${imageName}`, "/FO", "CSV", "/NH"];
}

/**
 * Whether the output of `tasklist` with `tasklistArgs(imageName)` lists a
 * process of `imageName`: a line `"<imageName>","<pid>",...`, the name
 * compared as Windows does, ignoring case. The line `tasklist` prints when
 * no process matches lists none.
 */
export function listsImage(output: string, imageName: string): boolean {
  const start = `"${imageName.toLowerCase()}",`;
  return output
    .split(/\r?\n/)
    .some((line) => line.toLowerCase().startsWith(start));
}

/**
 * The data of `value` in the output of `reg query <key> /v <value>`: the
 * line `    <value>    REG_SZ    <data>` (or `REG_EXPAND_SZ`). Undefined
 * when no such line is there.
 */
export function parseRegQuery(
  output: string,
  value: string,
): string | undefined {
  for (const line of output.split(/\r?\n/)) {
    const match = /^ {4}(.+?) {4}REG_(?:EXPAND_)?SZ {4}(.*)$/.exec(line);
    if (match?.[1]?.toLowerCase() === value.toLowerCase()) return match[2];
  }
  return undefined;
}
