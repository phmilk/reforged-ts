/**
 * What the CLIs of the release scripts share: the output streams, error
 * messages, the job summary, the base ref option, writing generated files,
 * and running as a script.
 */
import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
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

/**
 * The arguments as `--option value` pairs: each option one of `options`,
 * given at most once, with a value neither empty nor another option.
 * `undefined` on anything else, or when an option of `required` is missing.
 */
export function parseOptions<Option extends string, Required extends Option>(
  args: readonly string[],
  options: readonly Option[],
  required: readonly Required[],
): (Record<Required, string> & Partial<Record<Option, string>>) | undefined {
  const values = new Map<string, string>();
  for (let i = 0; i < args.length; i += 2) {
    const [option, value] = [args.at(i) ?? "", args.at(i + 1)];
    if (
      !(options as readonly string[]).includes(option) ||
      values.has(option) ||
      value === undefined ||
      value === "" ||
      value.startsWith("--")
    ) {
      return undefined;
    }
    values.set(option, value);
  }
  if (required.some((option) => !values.has(option))) return undefined;
  return Object.fromEntries(values) as Record<Required, string> &
    Partial<Record<Option, string>>;
}

/**
 * Writes `text` at the `/`-separated `path` under `root` unless the file
 * already holds it; resolves with whether it wrote.
 */
export async function update(
  root: string,
  path: string,
  text: string,
): Promise<boolean> {
  const target = join(root, path);
  const current = await readFile(target, "utf8").catch(() => null);
  if (current === text) return false;
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, text);
  return true;
}

/** Whether the module at `moduleUrl` is the script Node was started with. */
export function invokedDirectly(moduleUrl: string): boolean {
  const script = process.argv.at(1);
  return (
    script !== undefined && pathToFileURL(resolve(script)).href === moduleUrl
  );
}
