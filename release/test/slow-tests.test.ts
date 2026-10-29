import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { main } from "../src/cli/slow-tests.js";
import { renderSlowTests, seconds, slowTests } from "../src/slow-tests.js";
import { tempDir, writeText } from "./support/workspace.js";

const ROOT = join("/", "work", "reforged-ts");

/** A vitest JSON report of `files`, each a file and its tests' durations. */
function report(
  files: Record<string, Record<string, number | null>>,
): Record<string, unknown> {
  return {
    numTotalTests: 0,
    success: true,
    testResults: Object.entries(files).map(([file, tests]) => ({
      name: join(ROOT, file),
      status: "passed",
      assertionResults: Object.entries(tests).map(([fullName, duration]) => ({
        fullName,
        title: fullName,
        status: duration === null ? "skipped" : "passed",
        duration,
      })),
    })),
  };
}

const REPORT = report({
  "packages/reforged-map/test/measure.test.ts": {
    "the check-time measurement type-checks the project": 9_903.4,
    "the reload cost loads every definition file": 597,
  },
  "release/test/versioning.test.ts": {
    "changeset version gives 1.0.0-alpha.0 first": 12_050,
    "changeset version is skipped here": null,
    "changeset version takes exactly the threshold": 5_000,
  },
});

describe("slowTests", () => {
  it("lists the tests above 5 s, slowest first, each file from the root", () => {
    expect(slowTests(REPORT, ROOT)).toEqual([
      {
        file: "release/test/versioning.test.ts",
        name: "changeset version gives 1.0.0-alpha.0 first",
        duration: 12_050,
      },
      {
        file: "packages/reforged-map/test/measure.test.ts",
        name: "the check-time measurement type-checks the project",
        duration: 9_903.4,
      },
    ]);
  });

  it("takes another threshold", () => {
    expect(
      slowTests(REPORT, ROOT, 500).map(({ duration }) => duration),
    ).toEqual([12_050, 9_903.4, 5_000, 597]);
  });

  it("throws on a value that is not a vitest JSON report", () => {
    expect(() => slowTests({ tests: [] }, ROOT)).toThrow(/no testResults/);
    expect(() => slowTests({ testResults: [{ name: "a" }] }, ROOT)).toThrow(
      /without a name or tests/,
    );
  });
});

describe("renderSlowTests", () => {
  it("tables the duration, file and name, a `|` of a name escaped", () => {
    expect(
      renderSlowTests([
        { file: "a.test.ts", name: "splits a | b", duration: 6_000 },
      ]),
    ).toBe(
      "## Tests above 5.0 s\n\n" +
        "1 test, slowest first. A report, never a gate: an explicit timeout's comment cites a measurement from here " +
        '(CONTRIBUTING.md, "Slow tests and explicit timeouts").\n\n' +
        "| Duration | File        | Test          |\n" +
        "| -------- | ----------- | ------------- |\n" +
        "| 6.0 s    | `a.test.ts` | splits a \\| b |\n",
    );
  });

  it("says so when no test is above the threshold", () => {
    expect(renderSlowTests([])).toBe(
      "## Tests above 5.0 s\n\nNone: every test took 5.0 s or less.\n",
    );
  });

  it("writes durations in seconds, one decimal", () => {
    expect(seconds(9_903.4)).toBe("9.9 s");
  });
});

describe("test:slow-report", () => {
  async function run(args: string[], root: string, summary?: string) {
    let stdout = "";
    let stderr = "";
    const status = await main(
      args,
      {
        stdout: (text) => (stdout += text),
        stderr: (text) => (stderr += text),
      },
      { root, env: { GITHUB_STEP_SUMMARY: summary } },
    );
    return { status, stdout, stderr };
  }

  it("prints the slow tests of test-report.json and appends them to the job summary", async () => {
    const root = await tempDir("slow-tests");
    const file = join(root, "a.test.ts");
    await writeText(
      root,
      "test-report.json",
      JSON.stringify({
        testResults: [
          {
            name: file,
            assertionResults: [{ fullName: "is slow", duration: 7_000 }],
          },
        ],
      }),
    );
    const summary = join(root, "summary.md");
    await writeText(root, "summary.md", "# Earlier step\n");

    const result = await run([], root, summary);

    expect(result).toMatchObject({ status: 0, stderr: "" });
    expect(result.stdout).toContain("| 7.0 s    | `a.test.ts` | is slow |");
    expect(await readFile(summary, "utf8")).toBe(
      `# Earlier step\n${result.stdout}`,
    );
  });

  it("reads the report --report names, and exits 1 when it cannot", async () => {
    const root = await tempDir("slow-tests");
    await writeText(root, "other.json", JSON.stringify({ testResults: [] }));

    expect(await run(["--report", "other.json"], root)).toMatchObject({
      status: 0,
      stdout: expect.stringContaining("None:") as unknown,
    });
    expect(await run(["--report", "missing.json"], root)).toMatchObject({
      status: 1,
      stderr: expect.stringContaining("missing.json") as unknown,
    });
  });

  it("exits 2 on an unknown argument", async () => {
    const root = await tempDir("slow-tests");
    expect(await run(["--verbose"], root)).toEqual({
      status: 2,
      stdout: "",
      stderr: "Usage: test:slow-report [--report <path>]\n",
    });
  });
});
