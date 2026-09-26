/**
 * Running another program to completion, its output going to the script's
 * own: `changeset version`, git for the Template clone, pnpm in the
 * Template gate. Each caller takes a `Runner`, so a test answers with exit
 * codes instead of processes.
 */
import { spawn } from "node:child_process";

/** A program to run, its arguments, where, and what it adds to the environment. */
export interface Command {
  command: string;
  args: readonly string[];
  /** The folder it runs in; the script's own when absent. */
  cwd?: string;
  /** Variables added to the script's environment. */
  env?: Readonly<Record<string, string>>;
}

/** Runs a command to completion and resolves with its exit code. */
export type Runner = (command: Command) => Promise<number>;

/** The command as a shell line, for messages. */
export function commandLine({ command, args }: Command): string {
  return [command, ...args].join(" ");
}

/**
 * Runs `command` with the process's standard streams and resolves with its
 * exit code (1 when a signal ends it). With `shell`, it starts through a
 * shell, which Windows needs for a `.cmd` shim such as `pnpm`; the command
 * line is then joined unquoted, so its arguments must hold no spaces or
 * shell characters.
 */
export function runInherited(
  command: Command,
  options: { shell?: boolean } = {},
): Promise<number> {
  return new Promise((resolve, reject) => {
    const spawnOptions = {
      cwd: command.cwd,
      env:
        command.env === undefined
          ? process.env
          : { ...process.env, ...command.env },
      stdio: "inherit",
    } as const;
    const child =
      options.shell === true
        ? spawn(commandLine(command), { ...spawnOptions, shell: true })
        : spawn(command.command, command.args, spawnOptions);
    child.on("error", reject);
    child.on("close", (code) => {
      resolve(code ?? 1);
    });
  });
}
