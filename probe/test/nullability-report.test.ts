import { mkdir, mkdtemp, readFile, readdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { format } from "prettier";
import { describe, expect, it } from "vitest";
import { main, type Context } from "../src/cli/nullability-report.js";
import { systemMachine } from "../src/machine.js";
import { writeNullabilityReport } from "../src/nullability/report.js";
import { REPORT_HEADER } from "../src/nullability/section.js";
import { stateFile } from "../src/state.js";
import { USER_FOLDER_VARIABLE } from "../src/user-folder.js";
import { preloadFile } from "./support/bridge.js";

/** The Slice the hand-written Result files belong to. */
const PROBE = "nullability-slice-1";

/** The runId of the Slice's last build, in the state file and the Result files. */
const RUN_ID = "slice-run";

/** The fixture Overlay: CreateTimer and GetOwningPlayer non-null, Location nullable. */
const OVERLAY_FOLDER = fileURLToPath(
  new URL("fixtures/nullability/overlay/", import.meta.url),
);

/** The fixture manifest, whose `patch` is 3.0.0.12345. */
const MANIFEST_FILE = fileURLToPath(
  new URL("fixtures/nullability/manifest.json", import.meta.url),
);

/** The clock's now: late on 2 October 2026, in UTC. */
const NOW = new Date("2026-10-02T23:30:00Z");

/**
 * A finished run of the Slice, as the case runner writes it: CreateTimer
 * returns a handle in both its cases, the second called last;
 * GetOwningPlayer a handle on a live unit and nothing on a removed one;
 * Location nothing outside the world and a handle at the origin.
 */
const FINISHED = [
  `1 BEGIN probe=${PROBE} run=${RUN_ID}`,
  "2 PENDING label=CreateTimer%20one%20call",
  "3 CALL case=one%20call group=a id=1048577 native=CreateTimer outcome=handle type=timer:%200000020C",
  "4 PENDING label=GetOwningPlayer%20live%20unit",
  "5 CALL case=live%20unit group=a id=1048578 native=GetOwningPlayer outcome=handle type=player:%200000020D",
  "6 PENDING label=Location%20outside%20the%20world",
  "7 CALL case=outside%20the%20world group=a native=Location outcome=nil",
  "8 PENDING label=Location%20origin",
  "9 CALL case=origin group=a id=1048579 native=Location outcome=handle type=location:%200000020E",
  "10 PENDING label=GetOwningPlayer%20removed%20unit",
  "11 CALL case=removed%20unit group=b native=GetOwningPlayer outcome=nil",
  "12 PENDING label=CreateTimer%20second%20call",
  "13 CALL case=second%20call group=a id=1048580 native=CreateTimer outcome=handle type=timer:%200000020F",
  "14 END status=ok",
];

/** The section the finished run gives. */
const SECTION = `## \`${PROBE}\`

- Probe: \`${PROBE}\`
- Patch: 3.0.0.12345
- Date: 2026-10-02
- Run: \`${RUN_ID}\`

### \`CreateTimer\`

| Case        | Group | Outcome | Id      | Type              |
| ----------- | ----- | ------- | ------- | ----------------- |
| one call    | (a)   | handle  | 1048577 | \`timer: 0000020C\` |
| second call | (a)   | handle  | 1048580 | \`timer: 0000020F\` |

- Verdict: non-null (evidence)
- Overlay \`returns.nullable\`: \`false\`
- Comparison: consistent
- Proposed \`notes\`: Returned a handle in every case of the nullability sweep (one call, second call) on 3.0.0.12345; evidence, not proof.

### \`GetOwningPlayer\`

| Case         | Group | Outcome | Id      | Type               |
| ------------ | ----- | ------- | ------- | ------------------ |
| live unit    | (a)   | handle  | 1048578 | \`player: 0000020D\` |
| removed unit | (b)   | nil     |         |                    |

- Verdict: nullable (proved)
- Overlay \`returns.nullable\`: \`false\`
- Comparison: mismatch
- Proposed \`notes\`: Returns nothing for removed unit (nullability sweep, 3.0.0.12345).

### \`Location\`

| Case              | Group | Outcome | Id      | Type                 |
| ----------------- | ----- | ------- | ------- | -------------------- |
| outside the world | (a)   | nil     |         |                      |
| origin            | (a)   | handle  | 1048579 | \`location: 0000020E\` |

- Verdict: nullable (proved)
- Overlay \`returns.nullable\`: \`true\`
- Comparison: consistent
- Proposed \`notes\`: Returns nothing for outside the world (nullability sweep, 3.0.0.12345).
`;

/** Another Slice's section, which a rerun of this one keeps as it is. */
function otherSection(probe: string): string {
  return `## \`${probe}\`

- Probe: \`${probe}\`
- Patch: 3.0.0.24268
- Date: 2026-09-30
- Run: \`other-run\`
`;
}

interface Setup {
  context: Context;
  /** Where the game writes the Slice's Result file. */
  resultFile: string;
}

/**
 * A temporary Warcraft III user folder, named by WC3_USER_FOLDER on the real
 * machine, a state folder holding the Slice's build with `RUN_ID`, and a
 * report file not written yet, with the fixture Overlay and manifest and
 * the fixed clock.
 */
async function setup(): Promise<Setup> {
  const dir = await mkdtemp(join(tmpdir(), "probe-nullability-"));
  const userFolder = join(dir, "Warcraft III");
  const stateFolder = join(dir, "state");
  await mkdir(stateFolder);
  await writeFile(
    stateFile(stateFolder, PROBE),
    JSON.stringify({ probe: PROBE, runId: RUN_ID }),
  );
  const resultFile = join(
    userFolder,
    "CustomMapData",
    "reforged-ts",
    "probes",
    `${PROBE}.txt`,
  );
  return {
    context: {
      machine: {
        ...systemMachine,
        env: { [USER_FOLDER_VARIABLE]: userFolder },
      },
      stateFolder,
      overlayFolder: OVERLAY_FOLDER,
      manifestFile: MANIFEST_FILE,
      reportFile: join(dir, "docs", "nullability-sweep.md"),
      clock: () => NOW,
    },
    resultFile,
  };
}

/** Writes the Result file as the game does, its lines through `Preload`. */
async function writeResultFile(file: string, lines: readonly string[]) {
  await mkdir(join(file, ".."), { recursive: true });
  await writeFile(file, preloadFile(lines));
}

/** Every file under `folder` with its text, by path relative to it. */
async function snapshot(folder: string): Promise<Record<string, string>> {
  const files = await readdir(folder, { recursive: true, withFileTypes: true });
  const entries = await Promise.all(
    files
      .filter((entry) => entry.isFile())
      .map(async (entry) => {
        const file = join(entry.parentPath, entry.name);
        return [
          file.slice(folder.length),
          await readFile(file, "utf8"),
        ] as const;
      }),
  );
  return Object.fromEntries(entries);
}

describe("the nullability report", () => {
  it("creates the report with its header and the Slice's section from a finished run", async () => {
    const { context, resultFile } = await setup();
    await writeResultFile(resultFile, FINISHED);
    writeNullabilityReport(PROBE, context);
    expect(await readFile(context.reportFile, "utf8")).toBe(
      `${REPORT_HEADER}\n${SECTION}`,
    );
  });

  it("gives each Native its verdict, comparison and proposed notes", async () => {
    const { context, resultFile } = await setup();
    await writeResultFile(resultFile, FINISHED);
    const { slice } = writeNullabilityReport(PROBE, context);
    expect(
      slice.natives.map(({ native, verdict, overlayNullable, comparison }) => [
        native,
        verdict,
        overlayNullable,
        comparison,
      ]),
    ).toEqual([
      ["CreateTimer", "non-null (evidence)", false, "consistent"],
      ["GetOwningPlayer", "nullable (proved)", false, "mismatch"],
      ["Location", "nullable (proved)", true, "consistent"],
    ]);
  });

  it("takes the Patch from the Typings' manifest and the date from the clock, in UTC", async () => {
    const { context, resultFile } = await setup();
    await writeResultFile(resultFile, FINISHED);
    const { slice } = writeNullabilityReport(PROBE, context);
    expect([slice.patch, slice.date, slice.runId]).toEqual([
      "3.0.0.12345",
      "2026-10-02",
      RUN_ID,
    ]);
  });

  it("writes Markdown that Prettier leaves as it is, labels and types holding Markdown's own characters included", async () => {
    const { context, resultFile } = await setup();
    await writeResultFile(resultFile, [
      ...FINISHED.slice(0, -1),
      "14 PENDING label=Location%20odd",
      "15 CALL case=a%20*b*%20_c_%20[d]%20<e>%20#f%20|%20%5C%20`g` group=b id=1 native=Location outcome=handle type=x|`y`",
      "16 END status=ok",
    ]);
    writeNullabilityReport(PROBE, context);
    const report = await readFile(context.reportFile, "utf8");
    expect(await format(report, { parser: "markdown" })).toBe(report);
    expect(report).toContain(
      "| a \\*b\\* \\_c\\_ \\[d\\] \\<e\\> \\#f \\| \\\\ \\`g\\` | (b)   |",
    );
    expect(report).toContain("| 1       | `` x\\|`y` ``         |");
  });

  it("replaces on a rerun only its own section, in place, and keeps the other Slices' sections", async () => {
    const { context, resultFile } = await setup();
    await mkdir(join(context.reportFile, ".."), { recursive: true });
    await writeFile(
      context.reportFile,
      `${REPORT_HEADER}\n${otherSection("nullability-slice-0")}\n${SECTION}\n${otherSection("nullability-slice-2")}`,
    );
    // The rerun's CreateTimer returns nothing in its first case.
    await writeResultFile(
      resultFile,
      FINISHED.map((line) =>
        line.replace(
          "id=1048577 native=CreateTimer outcome=handle type=timer:%200000020C",
          "native=CreateTimer outcome=nil",
        ),
      ),
    );
    writeNullabilityReport(PROBE, context);
    const report = await readFile(context.reportFile, "utf8");
    const sections = report.split(/^(?=## )/m);
    expect(sections[0]).toBe(`${REPORT_HEADER}\n`);
    expect(sections[1]).toBe(`${otherSection("nullability-slice-0")}\n`);
    expect(sections[2]?.startsWith(`## \`${PROBE}\``)).toBe(true);
    expect(sections[2]).toContain("| one call    | (a)   | nil     |");
    expect(sections[2]).toContain(
      "- Proposed `notes`: Returns nothing for one call (nullability sweep, 3.0.0.12345).",
    );
    expect(sections[3]).toBe(otherSection("nullability-slice-2"));
    expect(sections.length).toBe(4);
  });

  it("appends its section after the other Slices' when the report has none of its own", async () => {
    const { context, resultFile } = await setup();
    await mkdir(join(context.reportFile, ".."), { recursive: true });
    await writeFile(
      context.reportFile,
      `${REPORT_HEADER}\n${otherSection("nullability-slice-0")}`,
    );
    await writeResultFile(resultFile, FINISHED);
    writeNullabilityReport(PROBE, context);
    expect(await readFile(context.reportFile, "utf8")).toBe(
      `${REPORT_HEADER}\n${otherSection("nullability-slice-0")}\n${SECTION}`,
    );
  });

  it("never writes under the Overlay folder", async () => {
    const before = await snapshot(OVERLAY_FOLDER);
    const { context, resultFile } = await setup();
    await writeResultFile(resultFile, FINISHED);
    writeNullabilityReport(PROBE, context);
    expect(await snapshot(OVERLAY_FOLDER)).toEqual(before);
    expect(Object.keys(before).length).toBe(3);
  });

  it("refuses a run that is not finished, with one line, and writes no report", async () => {
    const { context, resultFile } = await setup();
    await writeResultFile(resultFile, [
      ...FINISHED.slice(0, 5),
      "6 CHECKPOINT",
    ]);
    const stdout: string[] = [];
    const stderr: string[] = [];
    const code = main(
      [PROBE],
      {
        stdout: (text) => stdout.push(text),
        stderr: (text) => stderr.push(text),
      },
      { ...context, machine: { ...context.machine, platform: "linux" } },
    );
    expect(code).toBe(1);
    expect(stdout).toEqual([]);
    expect(stderr).toEqual([
      `probe:nullability-report failed: Probe ${PROBE}'s last run is incomplete: the report reads a finished run only. Run \`pnpm probe:read ${PROBE}\` to see it.\n`,
    ]);
    await expect(readFile(context.reportFile, "utf8")).rejects.toThrow();
  });

  it("prints the section it wrote, one line per Native", async () => {
    const { context, resultFile } = await setup();
    await writeResultFile(resultFile, FINISHED);
    const stdout: string[] = [];
    const code = main(
      [PROBE],
      {
        stdout: (text) => stdout.push(text),
        stderr: () => undefined,
      },
      context,
    );
    expect(code).toBe(0);
    expect(stdout.join("")).toBe(
      [
        `Wrote the section of Probe ${PROBE}, run ${RUN_ID}, to ${context.reportFile}:`,
        "CreateTimer: non-null (evidence), consistent",
        "GetOwningPlayer: nullable (proved), mismatch",
        "Location: nullable (proved), consistent",
        "",
      ].join("\n"),
    );
  });
});
