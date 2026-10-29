/**
 * `test:slow-report [--report <path>]`: prints, as Markdown, every test of
 * a vitest JSON report that took longer than 5 s, slowest first, and
 * appends it to the job summary on GitHub Actions. The report is
 * `test-report.json` at the workspace root unless `--report` names another,
 * relative to the root. Exit codes: 0 the list (empty included), 1 a report
 * that cannot be read, 2 usage. It never judges a duration: the CI step
 * that runs it does not fail the job either.
 */
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { renderSlowTests, slowTests } from "../slow-tests.js";
import { repositoryRoot } from "../workspace.js";
import {
  appendSummary,
  errorMessage,
  invokedDirectly,
  parseOptions,
  PROCESS_OUTPUT,
  type Output,
} from "./common.js";

const USAGE = "Usage: test:slow-report [--report <path>]\n";

/** The report written by `pnpm run test` with the json reporter, in CI. */
export const DEFAULT_REPORT = "test-report.json";

/** Where the command reads and what it writes to. */
export interface Context {
  root: string;
  env: Readonly<Record<string, string | undefined>>;
}

export async function main(
  args: readonly string[],
  output: Output,
  context: Context = { root: repositoryRoot, env: process.env },
): Promise<number> {
  const options = parseOptions(args, ["--report"], []);
  if (options === undefined) {
    output.stderr(USAGE);
    return 2;
  }
  const path = resolve(context.root, options["--report"] ?? DEFAULT_REPORT);

  let markdown: string;
  try {
    const report: unknown = JSON.parse(await readFile(path, "utf8"));
    markdown = renderSlowTests(slowTests(report, context.root));
  } catch (error) {
    output.stderr(`${path}: ${errorMessage(error)}\n`);
    return 1;
  }
  output.stdout(markdown);
  await appendSummary(context.env, markdown);
  return 0;
}

if (invokedDirectly(import.meta.url)) {
  process.exitCode = await main(process.argv.slice(2), PROCESS_OUTPUT);
}
