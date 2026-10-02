import {
  cp,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { format } from "prettier";
import { describe, expect, it } from "vitest";
import { main, type Context } from "../src/cli/nullability-report.js";
import { TYPINGS_MANIFEST } from "../src/folders.js";
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

/**
 * The Patch the Slice's build baked, in the Result files' `BEGIN` line: not
 * the Typings' own.
 */
const PATCH = "3.0.0.12345";

/** The clock's now: late on 2 October 2026, in UTC. */
const NOW = new Date("2026-10-02T23:30:00Z");

/** The lines of a Result file: `BEGIN`, then `records`, each numbered. */
function numbered(records: readonly string[]): string[] {
  return [`BEGIN patch=${PATCH} probe=${PROBE} run=${RUN_ID}`, ...records].map(
    (line, index) => `${String(index + 1)} ${line}`,
  );
}

/**
 * The case list of the finished run, as the case runner records it up
 * front: CreateTimer's second case comes last.
 */
const PLAN = [
  "CASE case=one%20call group=a native=CreateTimer",
  "CASE case=live%20unit group=a native=GetOwningPlayer",
  "CASE case=outside%20the%20world group=a native=Location",
  "CASE case=origin group=a native=Location",
  "CASE case=removed%20unit group=b native=GetOwningPlayer",
  "CASE case=second%20call group=a native=CreateTimer",
];

/**
 * The records of a finished run of the Slice, as the case runner writes
 * them: CreateTimer returns a handle in both its cases, the second called
 * last; GetOwningPlayer a handle on a live unit and nothing on a removed
 * one; Location nothing outside the world and a handle at the origin.
 */
const FINISHED_RECORDS = [
  ...PLAN,
  "PENDING label=CreateTimer%20one%20call",
  "CALL case=one%20call group=a id=1048577 native=CreateTimer outcome=handle type=timer:%200000020C",
  "PENDING label=GetOwningPlayer%20live%20unit",
  "CALL case=live%20unit group=a id=1048578 native=GetOwningPlayer outcome=handle type=player:%200000020D",
  "PENDING label=Location%20outside%20the%20world",
  "CALL case=outside%20the%20world group=a native=Location outcome=nil",
  "PENDING label=Location%20origin",
  "CALL case=origin group=a id=1048579 native=Location outcome=handle type=location:%200000020E",
  "PENDING label=GetOwningPlayer%20removed%20unit",
  "CALL case=removed%20unit group=b native=GetOwningPlayer outcome=nil",
  "PENDING label=CreateTimer%20second%20call",
  "CALL case=second%20call group=a id=1048580 native=CreateTimer outcome=handle type=timer:%200000020F",
];

const FINISHED = numbered([...FINISHED_RECORDS, "END status=ok"]);

/** The section the finished run gives. */
const SECTION = `## \`${PROBE}\`

- Probe: \`${PROBE}\`
- Patch: 3.0.0.12345
- Date: 2026-10-02
- Run: \`${RUN_ID}\`

### \`CreateTimer\`

| Case        | Group | Outcome | Id      | Type              | Message |
| ----------- | ----- | ------- | ------- | ----------------- | ------- |
| one call    | (a)   | handle  | 1048577 | \`timer: 0000020C\` |         |
| second call | (a)   | handle  | 1048580 | \`timer: 0000020F\` |         |

- Verdict: non-null (evidence)
- Overlay \`returns.nullable\`: \`false\`
- Comparison: consistent
- Proposed \`notes\`: Returned a handle in every case of the nullability sweep (one call, second call) on 3.0.0.12345; evidence, not proof.

### \`GetOwningPlayer\`

| Case         | Group | Outcome | Id      | Type               | Message |
| ------------ | ----- | ------- | ------- | ------------------ | ------- |
| live unit    | (a)   | handle  | 1048578 | \`player: 0000020D\` |         |
| removed unit | (b)   | nil     |         |                    |         |

- Verdict: nullable (proved)
- Overlay \`returns.nullable\`: \`false\`
- Comparison: mismatch
- Proposed \`notes\`: Returns nothing for removed unit (nullability sweep, 3.0.0.12345).

### \`Location\`

| Case              | Group | Outcome | Id      | Type                 | Message |
| ----------------- | ----- | ------- | ------- | -------------------- | ------- |
| outside the world | (a)   | nil     |         |                      |         |
| origin            | (a)   | handle  | 1048579 | \`location: 0000020E\` |         |

- Verdict: nullable (proved)
- Overlay \`returns.nullable\`: \`true\`
- Comparison: consistent
- Proposed \`notes\`: Returns nothing for outside the world (nullability sweep, 3.0.0.12345).
`;

/**
 * A finished run with every other outcome: CreateTimer a handle, then an
 * error; GetOwningPlayer a handle, then an odd number and the id-0 frame;
 * Location a case skipped after an earlier crash, then nothing.
 */
const OUTCOMES = numbered([
  "CASE case=one%20call group=a native=CreateTimer",
  "CASE case=raising%20call group=a native=CreateTimer",
  "CASE case=live%20unit group=a native=GetOwningPlayer",
  "CASE case=a%20number group=a native=GetOwningPlayer",
  "CASE case=not%20found%20frame group=b native=GetOwningPlayer",
  "CASE case=destroyed%20frame group=b native=Location",
  "CASE case=outside%20the%20world group=b native=Location",
  "PENDING label=CreateTimer%20one%20call",
  "CALL case=one%20call group=a id=1048577 native=CreateTimer outcome=handle type=timer:%200000020C",
  "PENDING label=CreateTimer%20raising%20call",
  "CALL case=raising%20call group=a message=bad%20|%20`arg` native=CreateTimer outcome=error",
  "PENDING label=GetOwningPlayer%20live%20unit",
  "CALL case=live%20unit group=a id=1048578 native=GetOwningPlayer outcome=handle type=player:%200000020D",
  "PENDING label=GetOwningPlayer%20a%20number",
  "CALL case=a%20number group=a native=GetOwningPlayer outcome=odd type=42",
  "PENDING label=GetOwningPlayer%20not%20found%20frame",
  "CALL case=not%20found%20frame group=b native=GetOwningPlayer outcome=odd type=framehandle:%2000000000",
  "SKIP case=destroyed%20frame group=b native=Location reason=crashed",
  "PENDING label=Location%20outside%20the%20world",
  "CALL case=outside%20the%20world group=b native=Location outcome=nil",
  "END status=ok",
]);

/**
 * A run a crash ended: CreateTimer's case ran, GetOwningPlayer's live unit
 * crashed the game after its checkpoint, and the cases after it never ran.
 */
const CRASHED = numbered([
  "CASE case=one%20call group=a native=CreateTimer",
  "CASE case=live%20unit group=a native=GetOwningPlayer",
  "CASE case=removed%20unit group=b native=GetOwningPlayer",
  "CASE case=origin group=b native=Location",
  "PENDING label=CreateTimer%20one%20call",
  "CALL case=one%20call group=a id=1048577 native=CreateTimer outcome=handle type=timer:%200000020C",
  "PENDING label=GetOwningPlayer%20live%20unit",
  "CHECKPOINT",
]);

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
 * report file not written yet, with the fixture Overlay and the fixed
 * clock.
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
        platform: "linux",
        env: { [USER_FOLDER_VARIABLE]: userFolder },
      },
      stateFolder,
      overlayFolder: OVERLAY_FOLDER,
      reportFile: join(dir, "docs", "nullability-sweep.md"),
      clock: () => NOW,
    },
    resultFile,
  };
}

/**
 * The context of `setup` on Windows, where a run that ends with a
 * checkpoint is `running` while the game's process runs and `crashed`
 * otherwise: the Result file `lines`, whatever its Windows path, and the
 * game's process running or not.
 */
async function windowsSetup(
  lines: readonly string[],
  gameRunning: boolean,
): Promise<Setup> {
  const { context, resultFile } = await setup();
  const result = preloadFile(lines);
  return {
    context: {
      ...context,
      machine: {
        ...context.machine,
        platform: "win32",
        readFile: (file) =>
          file.endsWith(`\\${PROBE}.txt`)
            ? result
            : context.machine.readFile(file),
        isRunning: () => gameRunning,
      },
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

/** Runs the command on `context`, and what it printed. */
async function runMain(context: Context) {
  const stdout: string[] = [];
  const stderr: string[] = [];
  const code = await main(
    [PROBE],
    {
      stdout: (text) => stdout.push(text),
      stderr: (text) => stderr.push(text),
    },
    context,
  );
  return { code, stdout, stderr };
}

/**
 * Asserts the command refuses the run with the one-line author error
 * `message` and writes no report.
 */
async function expectRefusal(context: Context, message: string) {
  expect(await runMain(context)).toEqual({
    code: 1,
    stdout: [],
    stderr: [`probe:nullability-report failed: ${message}\n`],
  });
  await expect(readFile(context.reportFile, "utf8")).rejects.toThrow();
}

describe("the nullability report", () => {
  it("creates the report with its header and the Slice's section from a finished run", async () => {
    const { context, resultFile } = await setup();
    await writeResultFile(resultFile, FINISHED);
    await writeNullabilityReport(PROBE, context);
    expect(await readFile(context.reportFile, "utf8")).toBe(
      `${REPORT_HEADER}\n${SECTION}`,
    );
  });

  it("gives each Native its verdict, comparison and proposed notes", async () => {
    const { context, resultFile } = await setup();
    await writeResultFile(resultFile, FINISHED);
    const { slice } = await writeNullabilityReport(PROBE, context);
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

  it("reports an error with its message, an odd value with its type, and a skipped case as crashed", async () => {
    const { context, resultFile } = await setup();
    await writeResultFile(resultFile, OUTCOMES);
    await writeNullabilityReport(PROBE, context);
    const report = await readFile(context.reportFile, "utf8");
    expect(report).toContain(`### \`CreateTimer\`

| Case         | Group | Outcome | Id      | Type              | Message            |
| ------------ | ----- | ------- | ------- | ----------------- | ------------------ |
| one call     | (a)   | handle  | 1048577 | \`timer: 0000020C\` |                    |
| raising call | (a)   | error   |         |                   | \`\` bad \\| \`arg\` \`\` |

- Verdict: unsafe
- Overlay \`returns.nullable\`: \`false\`
- Comparison: consistent
- Proposed \`notes\`: review
`);
    expect(report).toContain(`### \`GetOwningPlayer\`

| Case            | Group | Outcome | Id      | Type                    | Message |
| --------------- | ----- | ------- | ------- | ----------------------- | ------- |
| live unit       | (a)   | handle  | 1048578 | \`player: 0000020D\`      |         |
| a number        | (a)   | odd     |         | \`42\`                    |         |
| not found frame | (b)   | odd     |         | \`framehandle: 00000000\` |         |

- Verdict: review
- Overlay \`returns.nullable\`: \`false\`
- Comparison: consistent
- Proposed \`notes\`: review
`);
    expect(report).toContain(`### \`Location\`

| Case              | Group | Outcome | Id  | Type | Message                            |
| ----------------- | ----- | ------- | --- | ---- | ---------------------------------- |
| destroyed frame   | (b)   | crashed |     |      | skipped: crashed in an earlier run |
| outside the world | (b)   | nil     |     |      |                                    |

- Verdict: nullable (proved)
- Overlay \`returns.nullable\`: \`true\`
- Comparison: consistent
- Proposed \`notes\`: Returns nothing for outside the world (nullability sweep, 3.0.0.12345).
`);
    expect(await format(report, { parser: "markdown" })).toBe(report);
  });

  it("proves a Native nullable from a nil next to a crash, and gives no notes to unsafe and review", async () => {
    const { context, resultFile } = await setup();
    await writeResultFile(resultFile, OUTCOMES);
    const { slice } = await writeNullabilityReport(PROBE, context);
    expect(
      slice.natives.map(({ native, verdict, comparison, notes }) => [
        native,
        verdict,
        comparison,
        notes,
      ]),
    ).toEqual([
      ["CreateTimer", "unsafe", "consistent", "review"],
      ["GetOwningPlayer", "review", "consistent", "review"],
      [
        "Location",
        "nullable (proved)",
        "consistent",
        "Returns nothing for outside the world (nullability sweep, 3.0.0.12345).",
      ],
    ]);
  });

  it("reports a run a crash ended: the trailing PENDING case crashed, the cases after it not run", async () => {
    const { context, resultFile } = await setup();
    await writeResultFile(resultFile, CRASHED);
    const { slice } = await writeNullabilityReport(PROBE, context);
    const report = await readFile(context.reportFile, "utf8");
    expect(report)
      .toContain(`| Case         | Group | Outcome | Id  | Type | Message                      |
| ------------ | ----- | ------- | --- | ---- | ---------------------------- |
| live unit    | (a)   | crashed |     |      | crashed the game in this run |
| removed unit | (b)   | not run |     |      |                              |
`);
    expect(report)
      .toContain(`| Case   | Group | Outcome | Id  | Type | Message |
| ------ | ----- | ------- | --- | ---- | ------- |
| origin | (b)   | not run |     |      |         |
`);
    expect(
      slice.natives.map(({ native, verdict, notes }) => [
        native,
        verdict,
        notes.startsWith("Returned") ? "notes" : notes,
      ]),
    ).toEqual([
      ["CreateTimer", "non-null (evidence)", "notes"],
      ["GetOwningPlayer", "unsafe", "review"],
      ["Location", "review", "review"],
    ]);
  });

  it("reports a crashed run on Windows as it does an incomplete one", async () => {
    const { context } = await windowsSetup(CRASHED, false);
    const { slice } = await writeNullabilityReport(PROBE, context);
    expect(slice.natives[1]?.cases.map(({ outcome }) => outcome)).toEqual([
      "crashed",
      "not run",
    ]);
  });

  it("takes the Patch from the run's BEGIN line, not from the Typings' manifest, and the date from the clock, in UTC", async () => {
    const { context, resultFile } = await setup();
    await writeResultFile(resultFile, FINISHED);
    const { slice } = await writeNullabilityReport(PROBE, context);
    const { patch } = JSON.parse(await readFile(TYPINGS_MANIFEST, "utf8")) as {
      patch: string;
    };
    expect(patch).not.toBe(PATCH);
    expect([slice.patch, slice.date, slice.runId]).toEqual([
      PATCH,
      "2026-10-02",
      RUN_ID,
    ]);
  });

  it("refuses a run whose BEGIN line names no Patch", async () => {
    const { context, resultFile } = await setup();
    await writeResultFile(
      resultFile,
      FINISHED.map((line, index) =>
        index === 0 ? `1 BEGIN probe=${PROBE} run=${RUN_ID}` : line,
      ),
    );
    await expectRefusal(
      context,
      `Probe ${PROBE}'s last run names no Patch in its BEGIN line: build it with \`pnpm probe:build ${PROBE}\` and run it again.`,
    );
  });

  it("keeps each table row on one line and aligned as Prettier aligns it, line breaks, pipes and wide characters included", async () => {
    const { context, resultFile } = await setup();
    await writeResultFile(
      resultFile,
      numbered([
        "CASE case=%E6%97%A5%E6%9C%AC%E8%AA%9E%20unit group=a native=Location",
        "CASE case=two%0Alines group=b native=Location",
        "PENDING label=Location%20%E6%97%A5%E6%9C%AC%E8%AA%9E%20unit",
        "CALL case=%E6%97%A5%E6%9C%AC%E8%AA%9E%20unit group=a id=1 native=Location outcome=handle type=location:%20%E6%97%A5",
        "PENDING label=Location%20two%0Alines",
        "CALL case=two%0Alines group=b message=line%20one%0D%0Aline%20|%20two native=Location outcome=error",
        "END status=ok",
      ]),
    );
    await writeNullabilityReport(PROBE, context);
    const report = await readFile(context.reportFile, "utf8");
    expect(await format(report, { parser: "markdown" })).toBe(report);
    // 日本語 is 6 columns wide, as Prettier measures it.
    expect(report)
      .toContain(`| Case        | Group | Outcome | Id  | Type           | Message                |
| ----------- | ----- | ------- | --- | -------------- | ---------------------- |
| 日本語 unit | (a)   | handle  | 1   | \`location: 日\` |                        |
| two lines   | (b)   | error   |     |                | \`line one line \\| two\` |
`);
  });

  it("writes Markdown that Prettier leaves as it is, labels and types holding Markdown's own characters included", async () => {
    const { context, resultFile } = await setup();
    await writeResultFile(
      resultFile,
      numbered([
        "CASE case=a%20*b*%20_c_%20[d]%20<e>%20#f%20|%20%5C%20`g` group=b native=Location",
        ...FINISHED_RECORDS,
        "PENDING label=Location%20odd",
        "CALL case=a%20*b*%20_c_%20[d]%20<e>%20#f%20|%20%5C%20`g` group=b id=1 native=Location outcome=handle type=x|`y`",
        "END status=ok",
      ]),
    );
    await writeNullabilityReport(PROBE, context);
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
    await writeNullabilityReport(PROBE, context);
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
    await writeNullabilityReport(PROBE, context);
    expect(await readFile(context.reportFile, "utf8")).toBe(
      `${REPORT_HEADER}\n${otherSection("nullability-slice-0")}\n${SECTION}`,
    );
  });

  it("never writes under the Overlay folder", async () => {
    const before = await snapshot(OVERLAY_FOLDER);
    const { context, resultFile } = await setup();
    await writeResultFile(resultFile, FINISHED);
    await writeNullabilityReport(PROBE, context);
    expect(await snapshot(OVERLAY_FOLDER)).toEqual(before);
    expect(Object.keys(before).length).toBe(3);
  });

  it("refuses a run still running, on Windows: close the game first", async () => {
    const { context } = await windowsSetup(CRASHED, true);
    await expectRefusal(
      context,
      `Probe ${PROBE}'s last run is still running: close the game first, then run the report again.`,
    );
  });

  it("refuses a failed run with its ERROR message", async () => {
    const { context, resultFile } = await setup();
    await writeResultFile(
      resultFile,
      numbered([
        ...PLAN,
        "ERROR message=Error:%20no%20fixture%20unit",
        "END status=failed",
      ]),
    );
    await expectRefusal(
      context,
      `Probe ${PROBE}'s last run failed with the error "Error: no fixture unit": fix the Probe and run it again.`,
    );
  });

  it("refuses a Result file of another run, naming the stale runId", async () => {
    const { context, resultFile } = await setup();
    await writeResultFile(resultFile, [
      `1 BEGIN probe=${PROBE} run=stale-run`,
      "2 END status=ok",
    ]);
    await expectRefusal(
      context,
      `Probe ${PROBE}'s last build has no run: the Result file is from run stale-run, not from this build's run ${RUN_ID}.`,
    );
  });

  it("refuses a build with no Result file", async () => {
    const { context, resultFile } = await setup();
    await expectRefusal(
      context,
      `Probe ${PROBE}'s last build has no run: there is no Result file at ${resultFile}.`,
    );
  });

  it("refuses a Native with no Overlay entry", async () => {
    const { context, resultFile } = await setup();
    await writeResultFile(
      resultFile,
      numbered([
        "CASE case=normal group=a native=Rect",
        "PENDING label=Rect%20normal",
        "CALL case=normal group=a id=1048577 native=Rect outcome=handle type=rect:%200000020C",
        "END status=ok",
      ]),
    );
    await expectRefusal(
      context,
      `Rect has no Overlay entry in ${OVERLAY_FOLDER}: the report compares each verdict with one.`,
    );
  });

  it("refuses a Native with Overlay entries under several sources", async () => {
    const { context, resultFile } = await setup();
    const overlayFolder = join(context.reportFile, "..", "..", "overlay");
    await cp(OVERLAY_FOLDER, overlayFolder, { recursive: true });
    const duplicate = join(
      overlayFolder,
      "blizzard.j",
      "functions",
      "CreateTimer.json",
    );
    await mkdir(join(duplicate, ".."), { recursive: true });
    await writeFile(duplicate, JSON.stringify({ returns: { nullable: true } }));
    await writeResultFile(resultFile, FINISHED);
    await expectRefusal(
      { ...context, overlayFolder },
      `CreateTimer has an Overlay entry under several sources, ${join(overlayFolder, "blizzard.j", "functions", "CreateTimer.json")}, ${join(overlayFolder, "common.j", "functions", "CreateTimer.json")}: the report compares each verdict with one.`,
    );
  });

  it("refuses a finished run with a case it never recorded, and a record of no planned case", async () => {
    const { context, resultFile } = await setup();
    await writeResultFile(resultFile, numbered([...PLAN, "END status=ok"]));
    await expectRefusal(
      context,
      `Probe ${PROBE}'s run finished without a CALL or SKIP record of the case "CreateTimer one call".`,
    );
    await writeResultFile(
      resultFile,
      numbered([
        "CALL case=one%20call group=a native=CreateTimer outcome=nil",
        "END status=ok",
      ]),
    );
    await expectRefusal(
      context,
      'The record CALL case="one call" group=a native=CreateTimer outcome=nil is not one the nullability report reads.',
    );
  });

  it("prints the section it wrote, one line per Native", async () => {
    const { context, resultFile } = await setup();
    await writeResultFile(resultFile, FINISHED);
    const { code, stdout } = await runMain(context);
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
