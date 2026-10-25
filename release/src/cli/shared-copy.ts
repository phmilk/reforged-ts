/**
 * `skills:copy`: brings the Template's copy of what the library shares
 * (ADR 0024) to the library's files. `--template <dir>` is a checkout of
 * the Template, `--commit <sha>` the library commit the library's checkout
 * holds (its root, or `--library <dir>`). When the copy differs from the
 * files the library's `.claude/shared.json` names, it replaces the copied
 * files, deletes those no longer shared and rewrites the record
 * `.claude/shared.lock.json`; when it is the same, it writes nothing,
 * whatever commit the record names. `--report <file>` writes what it found
 * as JSON for the weekly skills workflow, with the pull request to open;
 * `--run-url <url>` names the run in it. Exit codes: 0 refreshed or
 * already the same, 1 a checkout cannot be read, 2 usage.
 */
import { writeFile } from "node:fs/promises";
import {
  copyPullRequest,
  isSame,
  refreshCopy,
  type CopyDifference,
} from "../shared-copy.js";
import { repositoryRoot } from "../workspace.js";
import {
  errorMessage,
  invokedDirectly,
  parseOptions,
  PROCESS_OUTPUT,
  type Output,
} from "./common.js";

const USAGE =
  "Usage: skills:copy --template <dir> --commit <sha> [--library <dir>] [--report <file>] [--run-url <url>]\n";

/** The JSON `--report` writes. */
export interface CopyReport {
  /** Whether the copy changed: the Template needs a pull request. */
  changed: boolean;
  difference: CopyDifference;
  pullRequest: { title: string; body: string };
}

export async function main(
  args: readonly string[],
  output: Output,
  libraryRoot: string = repositoryRoot,
): Promise<number> {
  const options = parseOptions(
    args,
    ["--template", "--commit", "--library", "--report", "--run-url"],
    ["--template", "--commit"],
  );
  if (options === undefined) {
    output.stderr(USAGE);
    return 2;
  }

  let report: CopyReport;
  try {
    const { difference } = await refreshCopy(
      options["--library"] ?? libraryRoot,
      options["--template"],
      options["--commit"],
    );
    report = {
      changed: !isSame(difference),
      difference,
      pullRequest: copyPullRequest(
        difference,
        options["--commit"],
        options["--run-url"],
      ),
    };
  } catch (error) {
    output.stderr(`${errorMessage(error)}\n`);
    return 1;
  }

  const { added, removed, modified } = report.difference;
  output.stdout(
    report.changed
      ? `The copy was refreshed: ${String(added.length)} added, ${String(modified.length)} modified, ${String(removed.length)} removed.\n`
      : "The copy is the library's already: nothing written.\n",
  );
  const file = options["--report"];
  if (file !== undefined) {
    await writeFile(file, `${JSON.stringify(report, null, 2)}\n`);
  }
  return 0;
}

if (invokedDirectly(import.meta.url)) {
  process.exitCode = await main(process.argv.slice(2), PROCESS_OUTPUT);
}
