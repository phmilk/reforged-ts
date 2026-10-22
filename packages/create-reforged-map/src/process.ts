/**
 * Running another program to completion: git and pnpm in the new Map
 * project. `create` takes a `Runner`, the shape the release scripts use, so
 * a test answers with exit codes instead of processes.
 */
import { spawn } from "node:child_process";

/** A program to run, its arguments, where, and what it adds to the environment. */
export interface Command {
  command: string;
  args: readonly string[];
  /** The folder it runs in; the CLI's own when absent. */
  cwd?: string;
  /** Variables added to the CLI's environment. */
  env?: Readonly<Record<string, string>>;
  /**
   * Whether its output is discarded: a check whose exit code is the whole
   * answer, such as `git --version`.
   */
  quiet?: boolean;
}

/** Runs a command to completion and resolves with its exit code. */
export type Runner = (command: Command) => Promise<number>;

/** The command as a shell line, for messages. */
export function commandLine({ command, args }: Command): string {
  return [command, ...args]
    .map((arg) => (/^[\w./:@=-]+$/.test(arg) ? arg : JSON.stringify(arg)))
    .join(" ");
}

/**
 * Runs `command` with the process's standard streams, or none when it is
 * quiet, and resolves with its exit code (1 when a signal ends it). Rejects
 * when the program cannot start. On Windows, `pnpm` is a `.cmd` shim, which
 * only a shell starts: its command line is then joined unquoted, so its
 * arguments must hold no spaces or shell characters.
 */
export function runInherited(command: Command): Promise<number> {
  return new Promise((resolve, reject) => {
    const options = {
      cwd: command.cwd,
      env:
        command.env === undefined
          ? process.env
          : { ...process.env, ...command.env },
      stdio: command.quiet === true ? "ignore" : "inherit",
    } as const;
    const child =
      process.platform === "win32" && command.command === "pnpm"
        ? spawn([command.command, ...command.args].join(" "), {
            ...options,
            shell: true,
          })
        : spawn(command.command, command.args, options);
    child.on("error", reject);
    child.on("close", (code) => {
      resolve(code ?? 1);
    });
  });
}
