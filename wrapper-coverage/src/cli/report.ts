/**
 * `coverage:report`: writes the Wrapper coverage report of the library
 * sources against the manifest of the library's Patch, as JSON and as
 * Markdown, and lists every missing Native and every problem on stderr.
 * Exit codes: 0 no Native missing and no problem, 1 a missing Native, a
 * problem or inputs that cannot be read (then nothing is written), 2 usage.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { errorMessage } from "../input-error.js";
import {
  realInput,
  repositoryRoot,
  REPORT_JSON_FILE,
  REPORT_MARKDOWN_FILE,
} from "../real-inputs.js";
import {
  coverageReport,
  type CoverageInput,
  type CoverageReport,
} from "../report.js";

const USAGE = "Usage: coverage:report\n";

export interface Output {
  stdout: (text: string) => void;
  stderr: (text: string) => void;
}

/** Where the command reads its inputs and writes the report. */
export interface Context {
  input: () => Promise<CoverageInput>;
  /** Absolute paths of the two report files. */
  jsonFile: string;
  markdownFile: string;
}

export const DEFAULT_CONTEXT: Context = {
  input: () => realInput(),
  jsonFile: join(repositoryRoot, REPORT_JSON_FILE),
  markdownFile: join(repositoryRoot, REPORT_MARKDOWN_FILE),
};

/** Writes `text` at `path` unless the file already holds it. */
async function update(path: string, text: string): Promise<boolean> {
  const current = await readFile(path, "utf8").catch(() => null);
  if (current === text) return false;
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, text);
  return true;
}

/** One line per missing Native, then one per problem. */
function failures(report: CoverageReport): string {
  const missing = report.wrappers.flatMap(({ wrapper, type, missing }) =>
    missing.map(
      (native) => `missing: ${wrapper} (${type}): ${native.signature}\n`,
    ),
  );
  const problems = report.problems.map(
    ({ kind, message }) => `${kind}: ${message}\n`,
  );
  return [...missing, ...problems].join("");
}

export async function main(
  args: readonly string[],
  output: Output,
  context: Context = DEFAULT_CONTEXT,
): Promise<number> {
  if (args.length > 0) {
    output.stderr(USAGE);
    return 2;
  }

  let result: Awaited<ReturnType<typeof coverageReport>>;
  try {
    result = await coverageReport(await context.input());
  } catch (error) {
    output.stderr(`${errorMessage(error)}\n`);
    return 1;
  }
  if (!result.ok) {
    output.stderr(`${result.message}\n`);
    return 1;
  }

  const written: string[] = [];
  if (await update(context.jsonFile, result.json))
    written.push(context.jsonFile);
  if (await update(context.markdownFile, result.markdown))
    written.push(context.markdownFile);

  const { totals, problems } = result.report;
  output.stderr(failures(result.report));
  output.stdout(
    `Wrapper coverage of Patch ${result.report.patch}: ${String(totals.owned)} owned Natives, ` +
      `${String(totals.covered)} covered, ${String(totals.excluded)} excluded, ` +
      `${String(totals.missing)} missing; ${String(problems.length)} problems. ` +
      `${written.length === 0 ? "No file changed." : `Wrote ${written.join(", ")}.`}\n`,
  );
  return result.failed ? 1 : 0;
}

/** Whether the module at `moduleUrl` is the script Node was started with. */
function invokedDirectly(moduleUrl: string): boolean {
  const script = process.argv.at(1);
  return (
    script !== undefined && pathToFileURL(resolve(script)).href === moduleUrl
  );
}

if (invokedDirectly(import.meta.url)) {
  process.exitCode = await main(process.argv.slice(2), {
    stdout: (text) => process.stdout.write(text),
    stderr: (text) => process.stderr.write(text),
  });
}
