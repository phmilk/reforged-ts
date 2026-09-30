/**
 * What the Probe runner's commands share: the output streams, the failure
 * line, and running as a script.
 */
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { AuthorError } from "../errors.js";

export interface Output {
  stdout: (text: string) => void;
  stderr: (text: string) => void;
}

export const PROCESS_OUTPUT: Output = {
  stdout: (text) => process.stdout.write(text),
  stderr: (text) => process.stderr.write(text),
};

/**
 * A command's failure, as the Template prints it (`printFailure` of its
 * `scripts/cli.ts`): an AuthorError as the one line
 * `<command> failed: <message>`, anything else (a bug) with its stack.
 */
export function failure(command: string, error: unknown): string {
  if (error instanceof AuthorError)
    return `${command} failed: ${error.message}\n`;
  return `${error instanceof Error ? (error.stack ?? error.message) : String(error)}\n`;
}

/** Whether the module at `moduleUrl` is the script Node was started with. */
export function invokedDirectly(moduleUrl: string): boolean {
  const script = process.argv.at(1);
  return (
    script !== undefined && pathToFileURL(resolve(script)).href === moduleUrl
  );
}
