/**
 * "Open in editor" of an Object definition: VS Code's `code -g <file>:<line>`
 * when `code` is on the PATH, else `$VISUAL <file>`, else `$EDITOR <file>`,
 * started detached from the server, without waiting for it.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

/** The environment the editor is found in. */
export type EditorEnvironment = Readonly<Record<string, string | undefined>>;

/** The editor started: which, and how. */
export interface StartedEditor {
  readonly editor: "code" | "VISUAL" | "EDITOR";
}

/** The path of a command on the PATH, with the PATHEXT extensions on Windows; undefined when none is found. */
function onPath(
  command: string,
  env: EditorEnvironment,
  platform: NodeJS.Platform,
): string | undefined {
  const pathValue = env.PATH ?? env.Path ?? "";
  const extensions =
    platform === "win32"
      ? (env.PATHEXT ?? ".COM;.EXE;.BAT;.CMD").split(";").filter(Boolean)
      : [""];
  for (const folder of pathValue.split(path.delimiter).filter(Boolean)) {
    for (const extension of extensions) {
      const candidate = path.join(folder, command + extension.toLowerCase());
      const stat = fs.statSync(candidate, { throwIfNoEntry: false });
      if (stat?.isFile() === true) return candidate;
    }
  }
  return undefined;
}

/** Quotes a path for the shell a command line runs in. */
const quote = (text: string): string => `"${text.replace(/"/g, '\\"')}"`;

/**
 * Starts a command detached, in the server's own environment, its output
 * ignored; an error it meets after starting is not reported.
 */
function detached(
  command: string,
  args: readonly string[],
  shell: boolean,
): void {
  const child = shell
    ? spawn([command, ...args].join(" "), {
        shell: true,
        detached: true,
        stdio: "ignore",
        windowsHide: true,
      })
    : spawn(command, args, { detached: true, stdio: "ignore" });
  child.on("error", () => undefined);
  child.unref();
}

/**
 * Opens a file at a line in the author's editor.
 *
 * @param file - The file, absolute.
 * @param line - Its line, from 1.
 * @param env - The environment `PATH`, `VISUAL` and `EDITOR` are read
 *   from; the editor itself starts in the server's.
 * @param platform - The system, whose PATH extensions and shell are used.
 * @returns The editor started, or undefined when none is found.
 */
export function openInEditor(
  file: string,
  line: number,
  env: EditorEnvironment,
  platform: NodeJS.Platform = process.platform,
): StartedEditor | undefined {
  const code = onPath("code", env, platform);
  if (code !== undefined) {
    // A .cmd runs through the shell on Windows: Node refuses to spawn one
    // without it.
    if (/\.(cmd|bat)$/i.test(code)) {
      detached(quote(code), ["-g", quote(`${file}:${String(line)}`)], true);
    } else {
      detached(code, ["-g", `${file}:${String(line)}`], false);
    }
    return { editor: "code" };
  }
  for (const name of ["VISUAL", "EDITOR"] as const) {
    const command = env[name];
    if (command !== undefined && command.trim() !== "") {
      // The variable is a command line (`code --wait`), run as the shell
      // reads it.
      detached(command, [quote(file)], true);
      return { editor: name };
    }
  }
  return undefined;
}
