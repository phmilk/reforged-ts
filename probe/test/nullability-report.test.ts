import { cp, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { format } from "prettier";
import { describe, expect, it } from "vitest";
import { main, type Context } from "../src/cli/nullability-report.js";
import {
  NULLABILITY_REPORT,
  OVERLAY_FOLDER as TYPINGS_OVERLAY_FOLDER,
  TYPINGS_MANIFEST,
} from "../src/folders.js";
import { writeNullabilityReport } from "../src/nullability/report.js";
import {
  REPORT_HEADER,
  type SliceSection,
} from "../src/nullability/section.js";
import {
  FAMILIES,
  proposedNotes,
  TYPICAL_ARGUMENTS,
} from "../src/nullability/verdict.js";
import { preloadFile } from "./support/bridge.js";
import {
  caseRun,
  handleCase,
  numbered,
  OVERLAY_FOLDER,
  PATCH,
  PROBE,
  RUN_ID,
  sliceSetup,
  writeResultFile,
} from "./support/nullability.js";
import { stateFile } from "../src/state.js";

/** The clock's now: late on 2 October 2026, in UTC. */
const NOW = new Date("2026-10-02T23:30:00Z");

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
- Client: 3.0.0.12345
- Date: 2026-10-02
- Run: \`${RUN_ID}\`

### \`CreateTimer\`

| Case        | Group | Outcome | Id      | Type              | Message |
| ----------- | ----- | ------- | ------- | ----------------- | ------- |
| one call    | (a)   | handle  | 1048577 | \`timer: 0000020C\` |         |
| second call | (a)   | handle  | 1048580 | \`timer: 0000020F\` |         |

- Family: \`constructor\`
- Verdict: non-null (evidence)
- Overlay \`returns.nullable\`: \`false\`
- Comparison: consistent
- Proposed \`notes\`: Returned a handle in every case of the nullability sweep (one call, second call) on 3.0.0.12345; evidence, not proof.

### \`GetOwningPlayer\`

| Case         | Group | Outcome | Id      | Type               | Message |
| ------------ | ----- | ------- | ------- | ------------------ | ------- |
| live unit    | (a)   | handle  | 1048578 | \`player: 0000020D\` |         |
| removed unit | (b)   | nil     |         |                    |         |

- Family: \`intrinsic-property\`
- Verdict: nullable (proved)
- Overlay \`returns.nullable\`: \`false\`
- Comparison: mismatch
- Proposed \`notes\`: Returned nothing in a case of the nullability sweep (removed unit) on 3.0.0.12345.

### \`Location\`

| Case              | Group | Outcome | Id      | Type                 | Message |
| ----------------- | ----- | ------- | ------- | -------------------- | ------- |
| outside the world | (a)   | nil     |         |                      |         |
| origin            | (a)   | handle  | 1048579 | \`location: 0000020E\` |         |

- Family: \`constructor\`
- Verdict: nullable (proved)
- Overlay \`returns.nullable\`: \`true\`
- Comparison: consistent
- Proposed \`notes\`: Returned nothing in a case of the nullability sweep (outside the world) on 3.0.0.12345.
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
  "CALL case=not%20found%20frame group=b id=0 native=GetOwningPlayer outcome=handle type=framehandle:%2000000000",
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
 * The Slice's build of `sliceSetup`, and a report file not written yet,
 * with the fixed clock.
 */
async function setup(): Promise<Setup> {
  const { dir, context, resultFile } = await sliceSetup();
  return {
    context: {
      ...context,
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

/**
 * A copy of the fixture Overlay next to the context's report, with an
 * entry for each Native of `returns`, holding that `returns`, in place of
 * the fixture's own. Returns the copy's folder.
 */
async function overlayWith(
  context: Context,
  returns: Readonly<Record<string, { nullable: boolean; family?: string }>>,
): Promise<string> {
  const overlayFolder = join(context.reportFile, "..", "..", "overlay");
  await cp(OVERLAY_FOLDER, overlayFolder, { recursive: true });
  for (const [name, entryReturns] of Object.entries(returns)) {
    await writeFile(
      join(overlayFolder, "common.j", "functions", `${name}.json`),
      JSON.stringify({ name, source: "common.j", returns: entryReturns }),
    );
  }
  return overlayFolder;
}

/**
 * A copy of the fixture Overlay next to the context's report, with an
 * entry for each Native of `filters`, one that returns nothing and whose
 * parameter `filter` has that `nullable`. Returns the copy's folder.
 */
async function overlayWithFilters(
  context: Context,
  filters: Readonly<Record<string, boolean>>,
): Promise<string> {
  const overlayFolder = join(context.reportFile, "..", "..", "overlay");
  await cp(OVERLAY_FOLDER, overlayFolder, { recursive: true });
  for (const [name, nullable] of Object.entries(filters)) {
    await writeFile(
      join(overlayFolder, "common.j", "functions", `${name}.json`),
      JSON.stringify({
        name,
        source: "common.j",
        returns: { nullable: false },
        params: [
          { name: "whichGroup", nullable: false },
          { name: "filter", nullable },
        ],
      }),
    );
  }
  return overlayFolder;
}

/**
 * The records of one call case of `native`'s `filter`: its CASE, then its
 * PENDING and CALL with `outcome` (and `count` on a `completed`), or its
 * SKIP for the outcome `skipped`, in `group`. The CASE records come first
 * in a run: `callCase` returns them apart.
 */
function callCase(
  native: string,
  label: string,
  argument: "nil" | "always-true" | "live",
  outcome: "completed" | "error" | "skipped",
  count = 0,
  group: "a" | "b" = "a",
): { plan: string; records: string[] } {
  const encoded = label.replaceAll(" ", "%20");
  const fields = `argument=${argument} case=${encoded} counted=unit group=${group} native=${native}`;
  const records =
    outcome === "skipped"
      ? [`SKIP ${fields} param=filter reason=crashed`]
      : [
          `PENDING label=${native}%20${encoded}`,
          outcome === "completed"
            ? `CALL argument=${argument} case=${encoded} count=${String(count)} counted=unit group=${group} native=${native} outcome=completed param=filter`
            : `CALL argument=${argument} case=${encoded} counted=unit group=${group} message=bad%20filter native=${native} outcome=error param=filter`,
        ];
  return { plan: `CASE ${fields} param=filter`, records };
}

/** A finished run of `cases`: their CASE records, then their other records. */
function callRun(cases: readonly ReturnType<typeof callCase>[]): string[] {
  return numbered([
    ...cases.map(({ plan }) => plan),
    ...cases.flatMap(({ records }) => records),
    "END status=ok",
  ]);
}

/**
 * Reports a finished run whose seven Natives give the seven verdicts, one
 * each, in the order of the `Verdict` type, against an Overlay that types every
 * one of them nullable, or every one non-null, as `nullable` says:
 * GetOwningPlayer returns nothing; GetTriggerUnit, of a nullable family, a
 * handle; CreateTimer's case was skipped after a crash; CreateUnit's
 * raised an error; CreateUbersplat a handle for typical arguments and a
 * Placeholder handle of id -1 for an unknown name; Location returns a
 * handle; TriggerAddAction a handle of id 0, with no case of typical
 * arguments to tell it from. Returns the Slice's section.
 */
async function reportEveryVerdict(
  context: Context,
  file: string,
  nullable: boolean,
): Promise<SliceSection> {
  const overlayFolder = await overlayWith(context, {
    GetOwningPlayer: { nullable, family: "intrinsic-property" },
    GetTriggerUnit: { nullable, family: "event-response" },
    CreateTimer: { nullable, family: "constructor" },
    CreateUnit: { nullable, family: "constructor" },
    CreateUbersplat: { nullable, family: "constructor" },
    Location: { nullable, family: "constructor" },
    TriggerAddAction: { nullable, family: "registration" },
  });
  await writeResultFile(
    file,
    numbered([
      "CASE case=removed%20unit group=b native=GetOwningPlayer",
      "CASE case=outside%20its%20event group=a native=GetTriggerUnit",
      "CASE case=one%20call group=a native=CreateTimer",
      "CASE case=one%20call group=a native=CreateUnit",
      "CASE case=typical%20arguments group=a native=CreateUbersplat",
      "CASE case=name:%20unknown%20name group=a native=CreateUbersplat",
      "CASE case=origin group=a native=Location",
      "CASE case=destroyed%20trigger group=b native=TriggerAddAction",
      "PENDING label=GetOwningPlayer%20removed%20unit",
      "CALL case=removed%20unit group=b native=GetOwningPlayer outcome=nil",
      "PENDING label=GetTriggerUnit%20outside%20its%20event",
      "CALL case=outside%20its%20event group=a id=1048577 native=GetTriggerUnit outcome=handle type=unit:%200000020C",
      "SKIP case=one%20call group=a native=CreateTimer reason=crashed",
      "PENDING label=CreateUnit%20one%20call",
      "CALL case=one%20call group=a message=bad%20arg native=CreateUnit outcome=error",
      "PENDING label=CreateUbersplat%20typical%20arguments",
      "CALL case=typical%20arguments group=a id=1 native=CreateUbersplat outcome=handle type=ubersplat:%200000020F",
      "PENDING label=CreateUbersplat%20name:%20unknown%20name",
      "CALL case=name:%20unknown%20name group=a id=-1 native=CreateUbersplat outcome=handle type=ubersplat:%2000000210",
      "PENDING label=Location%20origin",
      "CALL case=origin group=a id=1048578 native=Location outcome=handle type=location:%200000020D",
      "PENDING label=TriggerAddAction%20destroyed%20trigger",
      "CALL case=destroyed%20trigger group=b id=0 native=TriggerAddAction outcome=handle type=triggeraction:%200000020E",
      "END status=ok",
    ]),
  );
  const { slice } = await writeNullabilityReport(PROBE, {
    ...context,
    overlayFolder,
  });
  return slice;
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

- Family: \`constructor\`
- Verdict: review
- Overlay \`returns.nullable\`: \`false\`
- Comparison: mismatch
- Proposed \`notes\`: review
`);
    expect(report).toContain(`### \`GetOwningPlayer\`

| Case            | Group | Outcome | Id      | Type                    | Message |
| --------------- | ----- | ------- | ------- | ----------------------- | ------- |
| live unit       | (a)   | handle  | 1048578 | \`player: 0000020D\`      |         |
| a number        | (a)   | odd     |         | \`42\`                    |         |
| not found frame | (b)   | handle  | 0       | \`framehandle: 00000000\` |         |

- Family: \`intrinsic-property\`
- Verdict: review
- Overlay \`returns.nullable\`: \`false\`
- Comparison: mismatch
- Proposed \`notes\`: review
`);
    expect(report).toContain(`### \`Location\`

| Case              | Group | Outcome | Id  | Type | Message                            |
| ----------------- | ----- | ------- | --- | ---- | ---------------------------------- |
| destroyed frame   | (b)   | crashed |     |      | skipped: crashed in an earlier run |
| outside the world | (b)   | nil     |     |      |                                    |

- Family: \`constructor\`
- Verdict: nullable (proved)
- Overlay \`returns.nullable\`: \`true\`
- Comparison: consistent
- Proposed \`notes\`: Crashed the game in a case of the nullability sweep (destroyed frame) on 3.0.0.12345. Returned nothing in a case of the nullability sweep (outside the world) on 3.0.0.12345.
`);
    expect(await format(report, { parser: "markdown" })).toBe(report);
  });

  it("proves a Native nullable from a nil next to a crash, the crash first in its notes, and reviews an error and an odd value", async () => {
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
      ["CreateTimer", "review", "mismatch", "review"],
      ["GetOwningPlayer", "review", "mismatch", "review"],
      [
        "Location",
        "nullable (proved)",
        "consistent",
        "Crashed the game in a case of the nullability sweep (destroyed frame) on 3.0.0.12345. Returned nothing in a case of the nullability sweep (outside the world) on 3.0.0.12345.",
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

  it("names the client's Build the run was run on beside the Patch, and says when the run recorded none", async () => {
    const { context, resultFile } = await setup();
    await writeResultFile(resultFile, FINISHED);
    await writeFile(
      stateFile(context.stateFolder, PROBE),
      JSON.stringify({ probe: PROBE, runId: RUN_ID }),
    );
    const { slice } = await writeNullabilityReport(PROBE, context);
    expect(slice.client).toBeUndefined();
    expect(await readFile(context.reportFile, "utf8")).toContain(
      "- Patch: 3.0.0.12345\n- Client: not recorded\n",
    );
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
    // Read back as the section of another Build, every label pairs with its
    // case again: no change.
    await writeFile(
      context.reportFile,
      report.replace("- Patch: 3.0.0.12345", "- Patch: 3.0.0.11111"),
    );
    const { stdout } = await runMain(context);
    expect(stdout.join("")).toContain(
      "\nNo change from the section of Build 3.0.0.11111.\n",
    );
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
      "- Proposed `notes`: Returned nothing in a case of the nullability sweep (one call) on 3.0.0.12345.",
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

  it("keeps a Native of a nullable family nullable by the rule when every case gave a handle, with the reason and the cases of a handle of id 0 in its notes", async () => {
    const { context, resultFile } = await setup();
    const overlayFolder = await overlayWith(context, {
      GetTriggerUnit: { nullable: true, family: "event-response" },
      GetTriggerEventId: { nullable: true, family: "event-response" },
      LoadUnitHandle: { nullable: true, family: "lookup" },
    });
    await writeResultFile(
      resultFile,
      numbered([
        "CASE case=outside%20its%20event group=a native=GetTriggerUnit",
        "CASE case=outside%20its%20event group=a native=GetTriggerEventId",
        "CASE case=unsaved%20key group=a native=LoadUnitHandle",
        "PENDING label=GetTriggerUnit%20outside%20its%20event",
        "CALL case=outside%20its%20event group=a id=1048577 native=GetTriggerUnit outcome=handle type=unit:%200000020C",
        "PENDING label=GetTriggerEventId%20outside%20its%20event",
        "CALL case=outside%20its%20event group=a id=0 native=GetTriggerEventId outcome=handle type=eventid:%200000020D",
        "PENDING label=LoadUnitHandle%20unsaved%20key",
        "CALL case=unsaved%20key group=a native=LoadUnitHandle outcome=nil",
        "END status=ok",
      ]),
    );
    const { slice } = await writeNullabilityReport(PROBE, {
      ...context,
      overlayFolder,
    });
    expect(
      slice.natives.map(({ native, family, verdict, comparison, notes }) => [
        native,
        family,
        verdict,
        comparison,
        notes,
      ]),
    ).toEqual([
      [
        "GetTriggerUnit",
        "event-response",
        "nullable (rule)",
        "consistent",
        "May return nothing outside its event. Returned a handle in every case of the nullability sweep (outside its event) on 3.0.0.12345.",
      ],
      [
        "GetTriggerEventId",
        "event-response",
        "nullable (rule)",
        "consistent",
        "May return nothing outside its event. Returned a handle in every case of the nullability sweep (outside its event) on 3.0.0.12345. The handle had id 0 in a case (outside its event).",
      ],
      [
        "LoadUnitHandle",
        "lookup",
        "nullable (proved)",
        "consistent",
        "Returned nothing in a case of the nullability sweep (unsaved key) on 3.0.0.12345.",
      ],
    ]);
  });

  it("reports a mismatch whenever the Overlay types a Native non-null without evidence: unsafe, review and every nullable verdict", async () => {
    const { context, resultFile } = await setup();
    const slice = await reportEveryVerdict(context, resultFile, false);
    expect(
      slice.natives.map(({ verdict, comparison }) => [verdict, comparison]),
    ).toEqual([
      ["nullable (proved)", "mismatch"],
      ["nullable (rule)", "mismatch"],
      ["unsafe", "mismatch"],
      ["review", "mismatch"],
      ["nullable (placeholder)", "mismatch"],
      ["non-null (evidence)", "consistent"],
      ["non-null (evidence, handle id 0 or -1)", "consistent"],
    ]);
  });

  it("finds an Overlay nullable consistent whatever the verdict", async () => {
    const { context, resultFile } = await setup();
    const slice = await reportEveryVerdict(context, resultFile, true);
    expect(
      slice.natives.map(({ verdict, comparison }) => [verdict, comparison]),
    ).toEqual([
      ["nullable (proved)", "consistent"],
      ["nullable (rule)", "consistent"],
      ["unsafe", "consistent"],
      ["review", "consistent"],
      ["nullable (placeholder)", "consistent"],
      ["non-null (evidence)", "consistent"],
      ["non-null (evidence, handle id 0 or -1)", "consistent"],
    ]);
  });

  it("refuses to word a nullable (rule) verdict for a family whose Natives may be non-null", () => {
    expect(() =>
      proposedNotes(
        "nullable (rule)",
        [{ label: "one call", group: "a", outcome: "handle", id: "1" }],
        "constructor",
        PATCH,
      ),
    ).toThrow(
      "The family constructor may be non-null: it gives no verdict of nullable (rule).",
    );
  });

  it("knows every family the Typings' Overlay names, and no other", async () => {
    const folder = join(TYPINGS_OVERLAY_FOLDER, "common.j", "functions");
    const named = new Set<string>();
    for (const file of await readdir(folder)) {
      const { returns } = JSON.parse(
        await readFile(join(folder, file), "utf8"),
      ) as { returns?: { family?: string } };
      if (returns?.family !== undefined) named.add(returns.family);
    }
    expect([...named].sort()).toEqual(Object.keys(FAMILIES).sort());
  });

  it("keeps the committed report's header the one the command writes", async () => {
    const report = await readFile(NULLABILITY_REPORT, "utf8");
    expect(report.slice(0, report.indexOf("\n## "))).toBe(REPORT_HEADER);
  });

  it("lets a handle of id 0 satisfy non-null, naming its cases in the notes", async () => {
    const { context, resultFile } = await setup();
    const overlayFolder = await overlayWith(context, {
      TriggerAddAction: { nullable: true, family: "registration" },
    });
    await writeResultFile(
      resultFile,
      numbered([
        "CASE case=live%20trigger group=a native=TriggerAddAction",
        "CASE case=destroyed%20trigger group=b native=TriggerAddAction",
        "PENDING label=TriggerAddAction%20live%20trigger",
        "CALL case=live%20trigger group=a id=1048577 native=TriggerAddAction outcome=handle type=triggeraction:%200000020C",
        "PENDING label=TriggerAddAction%20destroyed%20trigger",
        "CALL case=destroyed%20trigger group=b id=0 native=TriggerAddAction outcome=handle type=triggeraction:%200000020D",
        "END status=ok",
      ]),
    );
    const { slice } = await writeNullabilityReport(PROBE, {
      ...context,
      overlayFolder,
    });
    expect(slice.natives.map(({ verdict, notes }) => [verdict, notes])).toEqual(
      [
        [
          "non-null (evidence, handle id 0 or -1)",
          "Returned a handle in every case of the nullability sweep (live trigger, destroyed trigger) on 3.0.0.12345; evidence, not proof. The handle had id 0 in a case (destroyed trigger).",
        ],
      ],
    );
  });

  /**
   * Reports one Native of `family`, nullable in the Overlay, whose cases
   * give the ids `ids`, by label, in that order. Returns its verdict and
   * proposed notes.
   */
  async function reportIds(
    context: Context,
    resultFile: string,
    native: string,
    family: string,
    ids: readonly (readonly [label: string, id: number])[],
  ) {
    const overlayFolder = await overlayWith(context, {
      [native]: { nullable: true, family },
    });
    await writeResultFile(
      resultFile,
      caseRun(ids.map(([label, id]) => handleCase(native, label, id))),
    );
    const { slice } = await writeNullabilityReport(PROBE, {
      ...context,
      overlayFolder,
    });
    return slice.natives.map(({ verdict, notes }) => [verdict, notes]);
  }

  it("makes a constructor nullable when a case other than typical arguments gave a Placeholder handle, naming its cases and ids", async () => {
    const { context, resultFile } = await setup();
    expect(
      await reportIds(context, resultFile, "AddWeatherEffect", "constructor", [
        ["typical arguments", 1],
        ["effectID: unknown rawcode", -1],
        ["where: removed rect", 0],
      ]),
    ).toEqual([
      [
        "nullable (placeholder)",
        "Returned a placeholder handle in place of nothing in 2 cases of the nullability sweep (effectID: unknown rawcode, where: removed rect) on 3.0.0.12345: id 0 or -1, so a nil check does not catch it.",
      ],
    ]);
  });

  it("makes a registration nullable for a Placeholder handle of id 0, in a case", async () => {
    const { context, resultFile } = await setup();
    expect(
      await reportIds(context, resultFile, "TriggerAddAction", "registration", [
        ["typical arguments", 1048577],
        ["whichTrigger: destroyed trigger", 0],
      ]),
    ).toEqual([
      [
        "nullable (placeholder)",
        "Returned a placeholder handle in place of nothing in a case of the nullability sweep (whichTrigger: destroyed trigger) on 3.0.0.12345: id 0, so a nil check does not catch it.",
      ],
    ]);
  });

  it("keeps a constructor's handle of id 0 from typical arguments a handle, not a Placeholder", async () => {
    const { context, resultFile } = await setup();
    expect(
      await reportIds(
        context,
        resultFile,
        "TerrainDeformCrater",
        "constructor",
        [
          ["typical arguments", 0],
          ["x: 0", 1],
        ],
      ),
    ).toEqual([
      [
        "non-null (evidence, handle id 0 or -1)",
        "Returned a handle in every case of the nullability sweep (typical arguments, x: 0) on 3.0.0.12345; evidence, not proof. The handle had id 0 in a case (typical arguments).",
      ],
    ]);
  });

  it("tells a Placeholder handle of id -1 apart from typical arguments of id 0", async () => {
    const { context, resultFile } = await setup();
    expect(
      await reportIds(context, resultFile, "CreateNothing", "constructor", [
        ["typical arguments", 0],
        ["x: 0", 1],
        ["name: unknown name", -1],
      ]),
    ).toEqual([
      [
        "nullable (placeholder)",
        "Returned a placeholder handle in place of nothing in a case of the nullability sweep (name: unknown name) on 3.0.0.12345: id -1, so a nil check does not catch it.",
      ],
    ]);
  });

  it("pins the label of typical arguments to the one the case generators write", () => {
    expect(TYPICAL_ARGUMENTS).toBe("typical arguments");
  });

  it("judges a handle of id 0 or -1 outside a constructor or a registration in review, naming each id", async () => {
    const { context, resultFile } = await setup();
    expect(
      await reportIds(context, resultFile, "GetPlayerRace", "enum-getter", [
        ["typical arguments", 1],
        ["whichPlayer: neutral player", 0],
        ["whichPlayer: empty slot", -1],
      ]),
    ).toEqual([
      [
        "non-null (evidence, handle id 0 or -1)",
        "Returned a handle in every case of the nullability sweep (typical arguments, whichPlayer: neutral player, whichPlayer: empty slot) on 3.0.0.12345; evidence, not proof. The handle had id 0 in a case (whichPlayer: neutral player). The handle had id -1 in a case (whichPlayer: empty slot).",
      ],
    ]);
  });

  it("reviews an odd value, one that is no handle, whatever the family", async () => {
    const { context, resultFile } = await setup();
    const overlayFolder = await overlayWith(context, {
      GetTriggerUnit: { nullable: true, family: "event-response" },
    });
    await writeResultFile(
      resultFile,
      numbered([
        "CASE case=outside%20its%20event group=a native=GetTriggerUnit",
        "PENDING label=GetTriggerUnit%20outside%20its%20event",
        "CALL case=outside%20its%20event group=a native=GetTriggerUnit outcome=odd type=42",
        "END status=ok",
      ]),
    );
    const { slice } = await writeNullabilityReport(PROBE, {
      ...context,
      overlayFolder,
    });
    expect(slice.natives.map(({ verdict, notes }) => [verdict, notes])).toEqual(
      [["review", "review"]],
    );
  });

  it("refuses a Native whose Overlay entry names no Nullability family", async () => {
    const { context, resultFile } = await setup();
    const overlayFolder = await overlayWith(context, {
      CreateTimer: { nullable: false },
    });
    await writeResultFile(resultFile, FINISHED);
    await expectRefusal(
      { ...context, overlayFolder },
      `${join(overlayFolder, "common.j", "functions", "CreateTimer.json")} names no Nullability family in returns.family (converter, enum-getter, constructor, registration, intrinsic-property, optional-property, event-response, callback-getter, lookup): the verdict depends on it.`,
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

  it("prints, when it replaces a section written under another Build, each change: a verdict, a case's outcome, a case added or gone, never an id", async () => {
    const { context, resultFile } = await setup();
    await mkdir(join(context.reportFile, ".."), { recursive: true });
    await writeFile(
      context.reportFile,
      `${REPORT_HEADER}\n${SECTION.replace("- Patch: 3.0.0.12345", "- Patch: 3.0.0.11111")}`,
    );
    // On the new Build CreateTimer's first case returns nothing,
    // GetOwningPlayer's removed unit became a dead unit, and Location's
    // origin is another handle.
    await writeResultFile(
      resultFile,
      FINISHED.map((line) =>
        line
          .replace(
            "id=1048577 native=CreateTimer outcome=handle type=timer:%200000020C",
            "native=CreateTimer outcome=nil",
          )
          .replaceAll("removed%20unit", "dead%20unit")
          .replace("id=1048579", "id=1048999"),
      ),
    );
    const { code, stdout } = await runMain(context);
    expect(code).toBe(0);
    expect(stdout.join("").split("\n").slice(4)).toEqual([
      "Changes from the section of Build 3.0.0.11111:",
      "CreateTimer: verdict non-null (evidence) -> nullable (proved)",
      "CreateTimer case one call: handle -> nil",
      "GetOwningPlayer case dead unit: added, nil",
      "GetOwningPlayer case removed unit: gone",
      "",
    ]);
  });

  it("flags a new unsafe, and a Native or parameter added or gone, among the changes", async () => {
    const { context, resultFile } = await setup();
    await mkdir(join(context.reportFile, ".."), { recursive: true });
    const previous = SECTION.replace(
      "- Patch: 3.0.0.12345",
      "- Patch: 3.0.0.11111",
    )
      .replaceAll("`Location`", "`CreateTrigger`")
      .concat(
        "\n### `EnumItemsInRect` parameter `filter`\n\n| Case | Group | Argument | Outcome | Count | Message |\n| --- | --- | --- | --- | --- | --- |\n| nil filter | (a) | nil | completed | 3 | |\n\n- Verdict: nullable (accepted)\n",
      );
    await writeFile(context.reportFile, `${REPORT_HEADER}\n${previous}`);
    // CreateTimer's second call crashed the game in an earlier run.
    await writeResultFile(
      resultFile,
      FINISHED.map((line) =>
        line.includes(" CALL case=second%20call ")
          ? line.replace(
              / CALL .*/,
              " SKIP case=second%20call group=a native=CreateTimer reason=crashed",
            )
          : line,
      ),
    );
    const { stdout } = await runMain(context);
    expect(stdout.join("").split("\n").slice(4)).toEqual([
      "Changes from the section of Build 3.0.0.11111:",
      "CreateTimer: verdict non-null (evidence) -> unsafe, a new unsafe",
      "CreateTimer case second call: handle -> crashed",
      "Location: added, nullable (proved)",
      "CreateTrigger: gone",
      "EnumItemsInRect parameter filter: gone",
      "",
    ]);
  });

  it("prints no change when the section it replaces is of the same Build, and says so when one of another Build has none", async () => {
    const { context, resultFile } = await setup();
    await mkdir(join(context.reportFile, ".."), { recursive: true });
    await writeResultFile(resultFile, FINISHED);
    await writeFile(context.reportFile, `${REPORT_HEADER}\n${SECTION}`);
    const same = await runMain(context);
    expect(same.stdout.join("").split("\n")).toHaveLength(5);
    await writeFile(
      context.reportFile,
      `${REPORT_HEADER}\n${SECTION.replace("- Patch: 3.0.0.12345", "- Patch: 3.0.0.11111")}`,
    );
    const other = await runMain(context);
    expect(other.stdout.join("").split("\n").slice(4)).toEqual([
      "No change from the section of Build 3.0.0.11111.",
      "",
    ]);
  });

  it("reviews a Native whose only case raised an error, never unsafe", async () => {
    const { context, resultFile } = await setup();
    await writeResultFile(
      resultFile,
      numbered([
        "CASE case=one%20call group=a native=CreateTimer",
        "PENDING label=CreateTimer%20one%20call",
        "CALL case=one%20call group=a message=bad%20arg native=CreateTimer outcome=error",
        "END status=ok",
      ]),
    );
    const { slice } = await writeNullabilityReport(PROBE, context);
    expect(
      slice.natives.map(({ verdict, comparison, notes }) => [
        verdict,
        comparison,
        notes,
      ]),
    ).toEqual([["review", "mismatch", "review"]]);
  });

  it("gives a skipped case unsafe, proposed nullable with the crash first in its notes, for a family that may be non-null and a nullable one", async () => {
    const { context, resultFile } = await setup();
    const overlayFolder = await overlayWith(context, {
      GetTriggerUnit: { nullable: true, family: "event-response" },
    });
    await writeResultFile(
      resultFile,
      numbered([
        "CASE case=one%20call group=a native=CreateTimer",
        "CASE case=outside%20its%20event group=a native=GetTriggerUnit",
        "CASE case=second%20call group=b native=CreateTimer",
        "CASE case=dead%20trigger group=b native=GetTriggerUnit",
        "PENDING label=CreateTimer%20one%20call",
        "CALL case=one%20call group=a id=1048577 native=CreateTimer outcome=handle type=timer:%200000020C",
        "PENDING label=GetTriggerUnit%20outside%20its%20event",
        "CALL case=outside%20its%20event group=a id=0 native=GetTriggerUnit outcome=handle type=unit:%2000000000",
        "SKIP case=second%20call group=b native=CreateTimer reason=crashed",
        "SKIP case=dead%20trigger group=b native=GetTriggerUnit reason=crashed",
        "END status=ok",
      ]),
    );
    const { slice } = await writeNullabilityReport(PROBE, {
      ...context,
      overlayFolder,
    });
    expect(
      slice.natives.map(({ native, verdict, comparison, notes }) => [
        native,
        verdict,
        comparison,
        notes,
      ]),
    ).toEqual([
      [
        "CreateTimer",
        "unsafe",
        "mismatch",
        "Crashed the game in a case of the nullability sweep (second call) on 3.0.0.12345. Returned a handle in every other case (one call).",
      ],
      [
        "GetTriggerUnit",
        "unsafe",
        "consistent",
        "Crashed the game in a case of the nullability sweep (dead trigger) on 3.0.0.12345. May return nothing outside its event. Returned a handle in every other case (outside its event). The handle had id 0 in a case (outside its event).",
      ],
    ]);
  });

  it("gives a case that crashed the game in this run unsafe, proposed nullable with the crash in its notes, for a family that may be non-null and a nullable one", async () => {
    const { context, resultFile } = await setup();
    const overlayFolder = await overlayWith(context, {
      GetTriggerUnit: { nullable: true, family: "event-response" },
    });
    const crashedOn = async (native: string, label: string) => {
      await writeResultFile(
        resultFile,
        numbered([
          "CASE case=one%20call group=a native=CreateTimer",
          `CASE case=${label.replaceAll(" ", "%20")} group=b native=${native}`,
          "PENDING label=CreateTimer%20one%20call",
          "CALL case=one%20call group=a id=1048577 native=CreateTimer outcome=handle type=timer:%200000020C",
          `PENDING label=${native}%20${label.replaceAll(" ", "%20")}`,
          "CHECKPOINT",
        ]),
      );
      const { slice } = await writeNullabilityReport(PROBE, {
        ...context,
        overlayFolder,
      });
      return slice.natives.map(({ native, verdict, comparison, notes }) => [
        native,
        verdict,
        comparison,
        notes,
      ]);
    };
    expect(await crashedOn("CreateTimer", "second call")).toEqual([
      [
        "CreateTimer",
        "unsafe",
        "mismatch",
        "Crashed the game in a case of the nullability sweep (second call) on 3.0.0.12345. Returned a handle in every other case (one call).",
      ],
    ]);
    expect((await crashedOn("GetTriggerUnit", "dead trigger"))[1]).toEqual([
      "GetTriggerUnit",
      "unsafe",
      "consistent",
      "Crashed the game in a case of the nullability sweep (dead trigger) on 3.0.0.12345. May return nothing outside its event.",
    ]);
  });

  it("names every crashed case of an unsafe Native in its crash sentence, a second crash included", async () => {
    const { context, resultFile } = await setup();
    await writeResultFile(
      resultFile,
      numbered([
        "CASE case=one%20call group=a native=CreateTimer",
        "CASE case=second%20call group=b native=CreateTimer",
        "CASE case=third%20call group=b native=CreateTimer",
        "PENDING label=CreateTimer%20one%20call",
        "CALL case=one%20call group=a id=1048577 native=CreateTimer outcome=handle type=timer:%200000020C",
        "SKIP case=second%20call group=b native=CreateTimer reason=crashed",
        "PENDING label=CreateTimer%20third%20call",
        "CHECKPOINT",
      ]),
    );
    const { slice } = await writeNullabilityReport(PROBE, context);
    expect(
      slice.natives.map(({ verdict, comparison, notes }) => [
        verdict,
        comparison,
        notes,
      ]),
    ).toEqual([
      [
        "unsafe",
        "mismatch",
        "Crashed the game in 2 cases of the nullability sweep (second call, third call) on 3.0.0.12345. Returned a handle in every other case (one call).",
      ],
    ]);
  });
});

describe("the nullability report's parameter section", () => {
  it("keeps a filter nullable when a nil filter completes with the always-true filter's count, in a section of its own after the Natives", async () => {
    const { context, resultFile } = await setup();
    const overlayFolder = await overlayWithFilters(context, {
      GroupEnumUnitsInRect: true,
    });
    await writeResultFile(
      resultFile,
      callRun([
        callCase(
          "GroupEnumUnitsInRect",
          "always-true filter",
          "always-true",
          "completed",
          4,
        ),
        callCase("GroupEnumUnitsInRect", "nil filter", "nil", "completed", 4),
        callCase(
          "GroupEnumUnitsInRect",
          "footmen only",
          "live",
          "completed",
          2,
        ),
      ]),
    );
    await writeNullabilityReport(PROBE, { ...context, overlayFolder });
    const report = await readFile(context.reportFile, "utf8");
    expect(report).toBe(`${REPORT_HEADER}
## \`${PROBE}\`

- Probe: \`${PROBE}\`
- Patch: 3.0.0.12345
- Client: 3.0.0.12345
- Date: 2026-10-02
- Run: \`${RUN_ID}\`

### \`GroupEnumUnitsInRect\` parameter \`filter\`

| Case               | Group | Argument    | Outcome   | Count | Message |
| ------------------ | ----- | ----------- | --------- | ----- | ------- |
| always-true filter | (a)   | always-true | completed | 4     |         |
| nil filter         | (a)   | nil         | completed | 4     |         |
| footmen only       | (a)   | live        | completed | 2     |         |

- Verdict: nullable (completed)
- Overlay \`params[].nullable\`: \`true\`
- Comparison: consistent
- Proposed sentence of the Native's \`notes\`: A nil filter keeps every unit (nullability sweep, 3.0.0.12345).
`);
    expect(await format(report, { parser: "markdown" })).toBe(report);
  });

  it("shows how a nil filter's count differs from the always-true filter's, in the section and the summary, and words its notes as accepted", async () => {
    const { context, resultFile } = await setup();
    const overlayFolder = await overlayWithFilters(context, {
      GroupEnumUnitsInRect: true,
    });
    await writeResultFile(
      resultFile,
      callRun([
        callCase(
          "GroupEnumUnitsInRect",
          "always-true filter",
          "always-true",
          "completed",
          5,
        ),
        callCase("GroupEnumUnitsInRect", "nil filter", "nil", "completed", 3),
      ]),
    );
    const { code, stdout } = await runMain({ ...context, overlayFolder });
    expect(code).toBe(0);
    expect(stdout.join("")).toContain(
      "GroupEnumUnitsInRect parameter filter: nullable (completed), consistent; count difference: nil: nil filter 3; always-true: always-true filter 5\n",
    );
    const report = await readFile(context.reportFile, "utf8");
    expect(report).toContain(`- Verdict: nullable (completed)
- Overlay \`params[].nullable\`: \`true\`
- Comparison: consistent
- Count difference: nil: nil filter 3; always-true: always-true filter 5
- Proposed sentence of the Native's \`notes\`: A nil filter is accepted (nullability sweep, 3.0.0.12345).
`);
  });

  it("makes a filter non-null only when a nil filter was skipped, a crash the crash loop confirmed, and reviews one that crashed in this run only", async () => {
    const { context, resultFile } = await setup();
    const overlayFolder = await overlayWithFilters(context, {
      GroupEnumUnitsInRect: true,
      ForceEnumPlayers: true,
    });
    const alwaysTrue = callCase(
      "GroupEnumUnitsInRect",
      "always-true filter",
      "always-true",
      "completed",
      4,
    );
    const crashing = callCase(
      "GroupEnumUnitsInRect",
      "nil filter",
      "nil",
      "completed",
    );
    const skipped = callCase(
      "ForceEnumPlayers",
      "nil filter",
      "nil",
      "skipped",
    );
    await writeResultFile(
      resultFile,
      numbered([
        alwaysTrue.plan,
        skipped.plan,
        crashing.plan,
        ...alwaysTrue.records,
        ...skipped.records,
        crashing.records[0] ?? "",
        "CHECKPOINT",
      ]),
    );
    const { slice } = await writeNullabilityReport(PROBE, {
      ...context,
      overlayFolder,
    });
    expect(
      slice.params.map(({ native, verdict, comparison, notes }) => [
        native,
        verdict,
        comparison,
        notes,
      ]),
    ).toEqual([
      ["GroupEnumUnitsInRect", "review", "consistent", "review"],
      [
        "ForceEnumPlayers",
        "non-null (crashed)",
        "mismatch",
        "Crashes the game with a nil filter (nullability sweep, 3.0.0.12345).",
      ],
    ]);
    expect(slice.params[0]?.cases.map(({ outcome }) => outcome)).toEqual([
      "completed",
      "crashed",
    ]);
  });

  it("reviews a filter whose live or always-true case was skipped, never non-null, even when its nil filter completed", async () => {
    const { context, resultFile } = await setup();
    const overlayFolder = await overlayWithFilters(context, {
      GroupEnumUnitsInRect: true,
      ForceEnumPlayers: true,
    });
    await writeResultFile(
      resultFile,
      callRun([
        callCase("GroupEnumUnitsInRect", "nil filter", "nil", "completed", 4),
        callCase("GroupEnumUnitsInRect", "footmen only", "live", "skipped"),
        callCase("ForceEnumPlayers", "nil filter", "nil", "completed", 2),
        callCase(
          "ForceEnumPlayers",
          "always-true filter",
          "always-true",
          "skipped",
        ),
      ]),
    );
    const { slice } = await writeNullabilityReport(PROBE, {
      ...context,
      overlayFolder,
    });
    expect(
      slice.params.map(({ native, verdict, comparison, notes }) => [
        native,
        verdict,
        comparison,
        notes,
      ]),
    ).toEqual([
      ["GroupEnumUnitsInRect", "review", "consistent", "review"],
      ["ForceEnumPlayers", "review", "consistent", "review"],
    ]);
  });

  it("compares a nil filter's count with the always-true filter's of the same group only", async () => {
    const { context, resultFile } = await setup();
    const overlayFolder = await overlayWithFilters(context, {
      GroupEnumUnitsInRect: true,
    });
    await writeResultFile(
      resultFile,
      callRun([
        callCase(
          "GroupEnumUnitsInRect",
          "always-true filter",
          "always-true",
          "completed",
          3,
        ),
        callCase("GroupEnumUnitsInRect", "nil filter", "nil", "completed", 3),
        callCase(
          "GroupEnumUnitsInRect",
          "always-true filter on removed units",
          "always-true",
          "completed",
          0,
          "b",
        ),
        callCase(
          "GroupEnumUnitsInRect",
          "nil filter on removed units",
          "nil",
          "completed",
          0,
          "b",
        ),
      ]),
    );
    const { slice } = await writeNullabilityReport(PROBE, {
      ...context,
      overlayFolder,
    });
    expect(
      slice.params.map(({ verdict, countDifference, notes }) => [
        verdict,
        countDifference,
        notes,
      ]),
    ).toEqual([
      [
        "nullable (completed)",
        undefined,
        "A nil filter keeps every unit (nullability sweep, 3.0.0.12345).",
      ],
    ]);
  });

  it("compares no group whose counts are all 0, and words the notes as accepted", async () => {
    const { context, resultFile } = await setup();
    const overlayFolder = await overlayWithFilters(context, {
      GroupEnumUnitsInRect: true,
    });
    await writeResultFile(
      resultFile,
      callRun([
        callCase(
          "GroupEnumUnitsInRect",
          "always-true filter",
          "always-true",
          "completed",
          0,
        ),
        callCase("GroupEnumUnitsInRect", "nil filter", "nil", "completed", 0),
      ]),
    );
    const { slice } = await writeNullabilityReport(PROBE, {
      ...context,
      overlayFolder,
    });
    expect(
      slice.params.map(({ verdict, countDifference, notes }) => [
        verdict,
        countDifference,
        notes,
      ]),
    ).toEqual([
      [
        "nullable (completed)",
        undefined,
        "A nil filter is accepted (nullability sweep, 3.0.0.12345).",
      ],
    ]);
  });

  it("prints no count difference when no always-true filter completed, and words the notes as accepted", async () => {
    const { context, resultFile } = await setup();
    const overlayFolder = await overlayWithFilters(context, {
      GroupEnumUnitsInRect: true,
    });
    await writeResultFile(
      resultFile,
      callRun([
        callCase("GroupEnumUnitsInRect", "nil filter", "nil", "completed", 3),
        callCase(
          "GroupEnumUnitsInRect",
          "footmen only",
          "live",
          "completed",
          2,
        ),
      ]),
    );
    const { code, stdout } = await runMain({ ...context, overlayFolder });
    expect(code).toBe(0);
    expect(stdout.join("")).toContain(
      "GroupEnumUnitsInRect parameter filter: nullable (completed), consistent\n",
    );
    const report = await readFile(context.reportFile, "utf8");
    expect(report).not.toContain("Count difference");
    expect(report).toContain(
      "A nil filter is accepted (nullability sweep, 3.0.0.12345).",
    );
  });

  it("reviews a filter whose case raised an error, and reports a mismatch when a nil filter completes on a filter the Overlay types non-null", async () => {
    const { context, resultFile } = await setup();
    const overlayFolder = await overlayWithFilters(context, {
      GroupEnumUnitsInRect: true,
      ForceEnumPlayers: false,
    });
    await writeResultFile(
      resultFile,
      callRun([
        callCase("GroupEnumUnitsInRect", "nil filter", "nil", "error"),
        callCase(
          "ForceEnumPlayers",
          "always-true filter",
          "always-true",
          "completed",
          1,
        ),
        callCase("ForceEnumPlayers", "nil filter", "nil", "completed", 1),
      ]),
    );
    const { slice } = await writeNullabilityReport(PROBE, {
      ...context,
      overlayFolder,
    });
    expect(
      slice.params.map(
        ({ native, verdict, overlayNullable, comparison, notes }) => [
          native,
          verdict,
          overlayNullable,
          comparison,
          notes,
        ],
      ),
    ).toEqual([
      ["GroupEnumUnitsInRect", "review", true, "consistent", "review"],
      [
        "ForceEnumPlayers",
        "nullable (completed)",
        false,
        "mismatch",
        "A nil filter keeps every unit (nullability sweep, 3.0.0.12345).",
      ],
    ]);
  });

  it("refuses a Native with both return cases and call cases, a call case's outcome on a return case, and a parameter the Overlay entry does not list", async () => {
    const { context, resultFile } = await setup();
    const overlayFolder = await overlayWithFilters(context, {
      GroupEnumUnitsInRect: true,
    });
    const nilFilter = callCase(
      "GroupEnumUnitsInRect",
      "nil filter",
      "nil",
      "completed",
      1,
    );
    await writeResultFile(
      resultFile,
      numbered([
        nilFilter.plan,
        "CASE case=one%20call group=a native=GroupEnumUnitsInRect",
        ...nilFilter.records,
        "PENDING label=GroupEnumUnitsInRect%20one%20call",
        "CALL case=one%20call group=a native=GroupEnumUnitsInRect outcome=nil",
        "END status=ok",
      ]),
    );
    await expectRefusal(
      { ...context, overlayFolder },
      "GroupEnumUnitsInRect has both return cases and call cases: a Native that returns a value has return cases only, one that returns nothing call cases only.",
    );
    await writeResultFile(
      resultFile,
      numbered([
        "CASE case=one%20call group=a native=CreateTimer",
        "PENDING label=CreateTimer%20one%20call",
        "CALL case=one%20call count=1 group=a native=CreateTimer outcome=completed",
        "END status=ok",
      ]),
    );
    await expectRefusal(
      { ...context, overlayFolder },
      'The record CALL case="one call" count=1 group=a native=CreateTimer outcome=completed is not one the nullability report reads.',
    );
    await writeResultFile(
      resultFile,
      callRun([callCase("CreateTimer", "nil filter", "nil", "completed", 1)]),
    );
    await expectRefusal(
      { ...context, overlayFolder },
      `${join(overlayFolder, "common.j", "functions", "CreateTimer.json")} has no parameter filter with a boolean nullable in params.`,
    );
  });

  it("refuses a CALL or SKIP whose param, argument or counted differ from its CASE, and a completed CALL without an integer count", async () => {
    const { context, resultFile } = await setup();
    const overlayFolder = await overlayWithFilters(context, {
      GroupEnumUnitsInRect: true,
    });
    const fields = (argument: string, counted: string, param: string) =>
      `argument=${argument} case=nil%20filter counted=${counted} group=a native=GroupEnumUnitsInRect param=${param}`;
    const completed = (fieldsOfCase: string, count: string) =>
      `CALL ${fieldsOfCase.replace(" group=", ` count=${count} group=`)} outcome=completed`;
    const refused = [
      completed(fields("live", "unit", "filter"), "1"),
      completed(fields("nil", "item", "filter"), "1"),
      completed(fields("nil", "unit", "whichGroup"), "1"),
      `SKIP ${fields("always-true", "unit", "filter")} reason=crashed`,
      `CALL ${fields("nil", "unit", "filter")} outcome=completed`,
      completed(fields("nil", "unit", "filter"), "many"),
      completed(fields("nil", "unit", "filter"), "1.5"),
    ];
    for (const record of refused) {
      await writeResultFile(
        resultFile,
        numbered([
          `CASE ${fields("nil", "unit", "filter")}`,
          "PENDING label=GroupEnumUnitsInRect%20nil%20filter",
          record,
          "END status=ok",
        ]),
      );
      await expectRefusal(
        { ...context, overlayFolder },
        `The record ${record.replace("nil%20filter", '"nil filter"')} is not one the nullability report reads.`,
      );
    }
  });
});

describe("the nullability report's converter notes", () => {
  /**
   * Reports a finished run of the fixture common.j's converters, typed
   * nullable: ConvertRace and ConvertAbilityIntegerLevelArrayField give the
   * integer passed in as the id, ConvertMouseButtonType its bit flag, and
   * ConvertRace's `-1` the id `idOfMinusOne`.
   */
  async function reportConverters(context: Context, idOfMinusOne = -1) {
    const overlayFolder = await overlayWith(context, {
      ConvertRace: { nullable: true, family: "converter" },
      ConvertMouseButtonType: { nullable: true, family: "converter" },
      ConvertAbilityIntegerLevelArrayField: {
        nullable: true,
        family: "converter",
      },
    });
    const race = [
      handleCase("ConvertRace", "RACE_NONE", 0),
      handleCase("ConvertRace", "RACE_HUMAN", 1),
      handleCase("ConvertRace", "RACE_ORC or RACE_GREEN", 2),
      handleCase("ConvertRace", "-1", idOfMinusOne),
      handleCase("ConvertRace", "past the last constant", 3),
      handleCase("ConvertRace", "2147483647", 2147483647),
      handleCase("ConvertRace", "-2147483648", -2147483648),
    ];
    const mouse = [
      ["MOUSE_BUTTON_TYPE_LEFT", 1],
      ["MOUSE_BUTTON_TYPE_MIDDLE", 2],
      ["MOUSE_BUTTON_TYPE_RIGHT", 4],
      ["-1", 1073741824],
      ["past the last constant", 8],
      ["2147483647", 1073741824],
      ["-2147483648", -2147483648],
    ].map(([label, id]) =>
      handleCase("ConvertMouseButtonType", String(label), id),
    );
    const field = [0, 1, -1, 2147483647].map((i) =>
      handleCase("ConvertAbilityIntegerLevelArrayField", String(i), i),
    );
    return { overlayFolder, run: caseRun([...race, ...mouse, ...field]) };
  }

  it("condenses the notes of a converter backed non-null to the measured fact", async () => {
    const { context, resultFile } = await setup();
    const { overlayFolder, run } = await reportConverters(context);
    await writeResultFile(resultFile, run);
    const { slice } = await writeNullabilityReport(PROBE, {
      ...context,
      overlayFolder,
    });
    expect(
      slice.natives.map(({ native, verdict, notes }) => [
        native,
        verdict,
        notes,
      ]),
    ).toEqual([
      [
        "ConvertRace",
        "non-null (evidence, handle id 0 or -1)",
        "Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.0.12345); the handle's id is the integer passed in. Evidence, not proof.",
      ],
      [
        "ConvertMouseButtonType",
        "non-null (evidence)",
        "Returned a handle for every common.j constant of its type and for -1, past the last constant, 2147483647 and -2147483648 (nullability sweep, 3.0.0.12345); the handle's id is the bit flag `1 << ((i - 1) & 31)` of the integer `i` passed in. Evidence, not proof.",
      ],
      [
        "ConvertAbilityIntegerLevelArrayField",
        "non-null (evidence, handle id 0 or -1)",
        "Returned a handle for 0, 1, -1 and 2147483647, its type having no common.j constant (nullability sweep, 3.0.0.12345); the handle's id is the integer passed in. Evidence, not proof.",
      ],
    ]);
  });

  it("keeps the full text of a converter whose ids follow no rule", async () => {
    const { context, resultFile } = await setup();
    const { overlayFolder, run } = await reportConverters(context, 7);
    await writeResultFile(resultFile, run);
    const { slice } = await writeNullabilityReport(PROBE, {
      ...context,
      overlayFolder,
    });
    const race = slice.natives.find(({ native }) => native === "ConvertRace");
    expect(race?.notes).toBe(
      "Returned a handle in every case of the nullability sweep (RACE_NONE, RACE_HUMAN, RACE_ORC or RACE_GREEN, -1, past the last constant, 2147483647, -2147483648) on 3.0.0.12345; evidence, not proof. The handle had id 0 in a case (RACE_NONE).",
    );
  });

  it("refuses a Slice of converters whose Patch is not vendored, and reads no common.j for a Slice without one", async () => {
    const { context, resultFile } = await setup();
    const { overlayFolder, run } = await reportConverters(context);
    await writeResultFile(resultFile, run);
    const vendorFolder = join(context.reportFile, "..", "..", "vendor");
    await expectRefusal(
      { ...context, overlayFolder, vendorFolder },
      `${join(vendorFolder, PATCH, "common.j")} could not be read: the Patch ${PATCH} is not vendored.`,
    );
    await writeResultFile(resultFile, FINISHED);
    expect(await runMain({ ...context, vendorFolder })).toMatchObject({
      code: 0,
    });
  });
});
