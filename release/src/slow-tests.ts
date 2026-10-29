/**
 * The slow tests of a vitest run, read from its JSON report (vitest's
 * `json` reporter, the shape Jest's `--json` writes): every test that took
 * longer than a threshold, slowest first, and the Markdown a CI leg writes
 * to its job summary (#759). A report, never a gate: runner variance would
 * make a duration gate noise.
 */
import { relative, sep } from "node:path";
import { markdownTable } from "./markdown-table.js";
import { isRecord } from "./unknown.js";

/** The duration above which a test is listed, in milliseconds. */
export const SLOW_TEST_THRESHOLD = 5_000;

/** One test of the report that took longer than the threshold. */
export interface SlowTest {
  /** Its file, `/`-separated from the workspace root. */
  file: string;
  /** Its full name: the describe titles and its own, space-separated. */
  name: string;
  /** How long it took, in milliseconds. */
  duration: number;
}

/**
 * The tests of `report` (a parsed vitest JSON report) that took longer than
 * `threshold` milliseconds, slowest first, each file relative to `root`.
 * Throws when `report` does not have the report's shape.
 */
export function slowTests(
  report: unknown,
  root: string,
  threshold: number = SLOW_TEST_THRESHOLD,
): SlowTest[] {
  if (!isRecord(report) || !Array.isArray(report.testResults)) {
    throw new Error("Not a vitest JSON report: no testResults list.");
  }
  const slow: SlowTest[] = [];
  for (const file of report.testResults as unknown[]) {
    if (
      !isRecord(file) ||
      typeof file.name !== "string" ||
      !Array.isArray(file.assertionResults)
    ) {
      throw new Error(
        "Not a vitest JSON report: a test file without a name or tests.",
      );
    }
    const path = relative(root, file.name).split(sep).join("/");
    for (const test of file.assertionResults as unknown[]) {
      if (!isRecord(test) || typeof test.fullName !== "string") {
        throw new Error(`Not a vitest JSON report: a test of ${path} unnamed.`);
      }
      // A skipped test has no duration (null in the report).
      if (typeof test.duration === "number" && test.duration > threshold) {
        slow.push({ file: path, name: test.fullName, duration: test.duration });
      }
    }
  }
  return slow.sort(
    (a, b) =>
      b.duration - a.duration ||
      (a.file < b.file ? -1 : a.file > b.file ? 1 : 0),
  );
}

/** `milliseconds` in seconds, one decimal: `12.3 s`. */
export const seconds = (milliseconds: number): string =>
  `${(milliseconds / 1_000).toFixed(1)} s`;

// A cell of the table: a `|` would end it, a newline the row.
const cell = (text: string): string =>
  text.replaceAll("|", "\\|").replaceAll(/\s+/g, " ");

/**
 * The job summary of the slow tests `tests`, above `threshold`
 * milliseconds: a heading, then a table of their duration, file and name,
 * or a line saying there is none.
 */
export function renderSlowTests(
  tests: readonly SlowTest[],
  threshold: number = SLOW_TEST_THRESHOLD,
): string {
  const heading = `## Tests above ${seconds(threshold)}\n\n`;
  if (tests.length === 0) {
    return `${heading}None: every test took ${seconds(threshold)} or less.\n`;
  }
  return (
    heading +
    `${String(tests.length)} ${tests.length === 1 ? "test" : "tests"}, slowest first. ` +
    "A report, never a gate: an explicit timeout's comment cites a measurement from here " +
    '(CONTRIBUTING.md, "Slow tests and explicit timeouts").\n\n' +
    markdownTable(
      ["Duration", "File", "Test"],
      tests.map(({ duration, file, name }) => [
        seconds(duration),
        `\`${cell(file)}\``,
        cell(name),
      ]),
    )
  );
}
