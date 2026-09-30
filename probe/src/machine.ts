/**
 * The machine the Probe runner's Node side reaches: its platform and
 * environment, its files, the registry, its processes and the programs it
 * starts. Every command takes one `Machine`, so a test answers with a fake
 * instead of the real machine. The Template's `ExecutableProbe` (platform,
 * environment, file existence), extended.
 */
import { execFileSync, spawn } from "node:child_process";
import fs from "node:fs";
import { AuthorError } from "./errors.js";

/** A program to start: what `spawn` takes, without spawning. */
export interface SpawnCommand {
  command: string;
  args: readonly string[];
  /** Variables added to the inherited environment. */
  env: Readonly<Record<string, string>>;
}

export interface Machine {
  platform: NodeJS.Platform;
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
  /** Whether a process of this image name runs (`tasklist`); false off Windows. */
  isRunning(imageName: string): boolean;
  /** Starts the program detached: it outlives the command. */
  spawnDetached(command: SpawnCommand): Promise<void>;
}

/** The real machine. */
export const systemMachine: Machine = {
  platform: process.platform,
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
    if (process.platform !== "win32") return false;
    const output = execFileSync(
      "tasklist",
      ["/FI", `IMAGENAME eq ${imageName}`, "/FO", "CSV", "/NH"],
      { encoding: "utf8", windowsHide: true },
    );
    return output
      .split(/\r?\n/)
      .some((line) => line.startsWith(`"${imageName}",`));
  },
  spawnDetached: (command) =>
    new Promise((resolve, reject) => {
      const child = spawn(command.command, command.args, {
        detached: true,
        stdio: "ignore",
        env: { ...process.env, ...command.env },
      });
      child.once("error", (error: NodeJS.ErrnoException) => {
        reject(
          error.code === "ENOENT"
            ? new AuthorError(
                `Could not start "${command.command}": no such file.`,
              )
            : error,
        );
      });
      child.once("spawn", () => {
        child.unref();
        resolve();
      });
    }),
};

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
