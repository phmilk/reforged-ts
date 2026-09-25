/**
 * What the CLIs of the release scripts share: the output streams, error
 * messages, the job summary, the base ref option, and running as a script.
 */
import { appendFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

export { errorMessage } from "../unknown.js";

export interface Output {
  stdout: (text: string) => void;
  stderr: (text: string) => void;
}

export const PROCESS_OUTPUT: Output = {
  stdout: (text) => process.stdout.write(text),
  stderr: (text) => process.stderr.write(text),
};

/** The environment variable GitHub Actions names the job summary file in. */
export const SUMMARY_VARIABLE = "GITHUB_STEP_SUMMARY";

/**
 * Appends `markdown` to the job summary when the environment `env` names
 * one (a step of GitHub Actions); does nothing elsewhere.
 */
export async function appendSummary(
  env: Readonly<Record<string, string | undefined>>,
  markdown: string,
): Promise<void> {
  const file = env[SUMMARY_VARIABLE];
  if (file !== undefined && file !== "") await appendFile(file, markdown);
}

/** The environment variable that names the base ref, for CI. */
export const BASE_REF_VARIABLE = "RELEASE_BASE_REF";

export const BASE_OPTION = "[--base <ref>]";

/**
 * The base ref of the arguments (`--base <ref>`), else of the environment
 * variable `RELEASE_BASE_REF` when set and not empty; `null` when neither
 * names one. `undefined` when an argument is unknown or lacks its value.
 */
export function parseBaseArgs(
  args: readonly string[],
  env: Readonly<Record<string, string | undefined>>,
): { base: string | null } | undefined {
  const fromEnv = env[BASE_REF_VARIABLE];
  let base = fromEnv === undefined || fromEnv === "" ? null : fromEnv;
  for (let i = 0; i < args.length; i++) {
    const value = args.at(i + 1);
    if (args[i] !== "--base" || value === undefined || value === "") {
      return undefined;
    }
    base = value;
    i++;
  }
  return { base };
}

/** Whether the module at `moduleUrl` is the script Node was started with. */
export function invokedDirectly(moduleUrl: string): boolean {
  const script = process.argv.at(1);
  return (
    script !== undefined && pathToFileURL(resolve(script)).href === moduleUrl
  );
}
