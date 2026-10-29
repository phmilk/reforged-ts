// The known-flake catalogue of ship-spec (#812): the timeouts of named tests
// on named jobs that #658's diagnosis measured as the windows runner
// stalling, each allowed one rerun of the failed jobs. It fails when an
// entry names a job ci.yml does not run as a check, a test file that is not
// there, or a test title that file does not hold: such an entry would never
// match, and a renamed test would lose its rerun without anyone noticing.
import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";

import { proseLines } from "./markdown.js";
import { read, root } from "./repository.js";

const catalogue = ".claude/skills/ship-spec/known-flakes.md";

// One entry: the check it fails on, the test file, and the test's titles
// from its outermost `describe` to its `it`.
interface Flake {
  job: string;
  file: string;
  titles: string[];
}

// The text of a table cell, its backticks or quotes removed.
const cell = (text: string): string =>
  text
    .trim()
    .replace(/^`(.*)`$/, "$1")
    .replace(/^"(.*)"$/, "$1");

// The entries of the catalogue's table: its rows after the header and the
// rule, the job, file and test columns read by their header.
function flakes(text: string): Flake[] {
  const rows = proseLines(text)
    .filter((line) => line.startsWith("|"))
    .map((line) => line.split("|").slice(1, -1));
  const [header, , ...body] = rows;
  if (header === undefined) return [];
  const column = (name: string): number =>
    header.findIndex((each) => each.trim() === name);
  const [job, file, test] = ["Job", "File", "Test"].map(column);
  return body.map((row) => ({
    job: cell(row[job] ?? ""),
    file: cell(row[file] ?? ""),
    titles: (row[test] ?? "").split("›").map(cell),
  }));
}

// The check names of ci.yml's matrix, as GitHub names them and the ruleset
// requires them: `<job name> (<os>)` (release/test/repo-settings.test.ts).
function ciChecks(): string[] {
  const workflow = parse(read(".github/workflows/ci.yml")) as {
    jobs: Record<
      string,
      { name?: string; strategy?: { matrix?: { os?: string[] } } }
    >;
  };
  const job = workflow.jobs.ci;
  return (job?.strategy?.matrix?.os ?? []).map(
    (os) => `${job?.name ?? "ci"} (${os})`,
  );
}

describe("flakes", () => {
  it("reads each row's job, file and titles by the header", () => {
    expect(
      flakes(
        [
          "Intro.",
          "",
          "| Test | Job | File | Measured |",
          "| --- | --- | --- | --- |",
          '| `outer` › "inner one" | `ci (windows)` | `a/b.test.ts` | 1 s |',
          "",
          "```text",
          "| not | a | row |",
          "```",
        ].join("\n"),
      ),
    ).toEqual([
      {
        job: "ci (windows)",
        file: "a/b.test.ts",
        titles: ["outer", "inner one"],
      },
    ]);
  });
});

describe("the known-flake catalogue", () => {
  const entries = flakes(read(catalogue));

  it("lists the four timeouts #658 measured on ci (windows)", () => {
    expect(
      entries.map(({ job, file }) => `${job} ${file}`),
      catalogue,
    ).toEqual([
      "ci (windows) release/test/cli.test.ts",
      "ci (windows) release/test/matrix.test.ts",
      "ci (windows) packages/reforged-map/test/world-editor.test.ts",
      "ci (windows) packages/reforged-map/test/object-data-text.test.ts",
    ]);
  });

  it("names only checks of ci.yml's matrix", () => {
    const checks = ciChecks();
    expect(checks).toContain("ci (windows)");
    expect(
      entries.filter(({ job }) => !checks.includes(job)).map(({ job }) => job),
      `the jobs of ${catalogue} that ci.yml does not run as a check`,
    ).toEqual([]);
  });

  it("names test files that hold each of its titles", () => {
    const problems = entries.flatMap(({ file, titles }) => {
      if (!existsSync(join(root, file))) return [`${file}: no such file`];
      const text = read(file);
      return titles
        .filter((title) => !text.includes(`"${title}"`))
        .map((title) => `${file}: no test or describe titled "${title}"`);
    });
    expect(problems, catalogue).toEqual([]);
  });
});
