// The coverage of the Crashing cases (src/nullability/crashing-cases.ts):
// every crashed row of the Nullability sweep's report has one record in
// crashing-cases.json, with a Guard that exists or the reason it is
// excluded, and every record is still a crashed row. `pnpm check` runs it on
// the real files.

import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  crashedCases,
  crashingCaseProblems,
  knownGuards,
  type KnownGuards,
} from "../src/nullability/crashing-cases.js";
import {
  CRASHING_CASES,
  LIBRARY_SOURCES,
  NULLABILITY_REPORT,
  PLUGIN_RULES_INDEX,
} from "../src/folders.js";

/**
 * A report of two Slices, as `probe:nullability-report` writes it: a
 * crashed return case, a crashed label Markdown escapes, a crashed call
 * case, and rows of every other outcome.
 */
const REPORT = `# Nullability sweep

The header, which names no case.

## \`nullability-one\`

- Probe: \`nullability-one\`
- Patch: 3.0.0.12345

### \`CreateImage\`

| Case                  | Group | Outcome | Id  | Type             | Message                            |
| --------------------- | ----- | ------- | --- | ---------------- | ---------------------------------- |
| typical arguments     | (a)   | handle  | 7   | \`image: 01\`    |                                    |
| imageType: 0          | (a)   | handle  | -1  | \`image: 02\`    |                                    |
| imageType: 2147483647 | (a)   | crashed |     |                  | skipped: crashed in an earlier run |

- Verdict: unsafe

### \`GetExpiredTimer\`

| Case                | Group | Outcome | Id  | Type | Message |
| ------------------- | ----- | ------- | --- | ---- | ------- |
| outside its \\_event | (a)   | crashed |     |      |         |

- Verdict: nullable (proved)

## \`nullability-two\`

- Probe: \`nullability-two\`
- Patch: 3.0.0.12345

### \`GroupEnumUnitsOfType\` parameter \`filter\`

| Case                | Group | Argument    | Outcome   | Count | Message |
| ------------------- | ----- | ----------- | --------- | ----- | ------- |
| filter: always-true | (a)   | always-true | completed | 1     |         |
| filter: nil         | (a)   | nil         | crashed   |       |         |

- Verdict: non-null (crashed)
`;

/** The Guards that exist for the records below. */
const GUARDS: KnownGuards = {
  rules: new Set(["no-crashing-arguments", "no-event-response-outside-event"]),
  members: new Set(["Image.create", "Group.enumUnitsOfType", "Timer#start"]),
};

/** One record per crashed row of `REPORT`. */
const RECORDS = [
  {
    native: "CreateImage",
    case: "imageType: 2147483647",
    guard: "Image.create",
  },
  {
    native: "GetExpiredTimer",
    case: "outside its _event",
    guard: "no-event-response-outside-event",
  },
  {
    native: "GroupEnumUnitsOfType",
    case: "filter: nil",
    guard: ["no-crashing-arguments", "Group.enumUnitsOfType"],
  },
];

describe("the crashed rows of the report", () => {
  it("are each Native's or parameter's cases whose outcome is crashed, their escapes undone", () => {
    expect(crashedCases(REPORT)).toEqual([
      { native: "CreateImage", case: "imageType: 2147483647" },
      { native: "GetExpiredTimer", case: "outside its _event" },
      { native: "GroupEnumUnitsOfType", case: "filter: nil" },
    ]);
  });
});

describe("the coverage of the Crashing cases", () => {
  it("passes when every crashed row has one record and every record a crashed row", () => {
    expect(crashingCaseProblems(REPORT, RECORDS, GUARDS)).toEqual([]);
  });

  it("passes with an instance member, Class#member, as the Guard", () => {
    const records = RECORDS.map((record, index) =>
      index === 0 ? { ...record, guard: "Timer#start" } : record,
    );

    expect(crashingCaseProblems(REPORT, records, GUARDS)).toEqual([]);
  });

  it("passes with a reason in place of a Guard", () => {
    const records = RECORDS.map((record, index) =>
      index === 0
        ? {
            native: record.native,
            case: record.case,
            excluded: "No map passes it.",
          }
        : record,
    );

    expect(crashingCaseProblems(REPORT, records, GUARDS)).toEqual([]);
  });

  it("fails on a crashed row with no record", () => {
    expect(crashingCaseProblems(REPORT, RECORDS.slice(1), GUARDS)).toEqual([
      "CreateImage imageType: 2147483647: a crashed row of the report with no record: add one with a Guard or a reason it is excluded",
    ]);
  });

  it("fails on a record whose case is no longer a crashed row", () => {
    const stale = {
      native: "CreateFogModifierRadius",
      case: "radius: 2147483647",
      excluded: "No map passes int-max as a radius.",
    };

    expect(crashingCaseProblems(REPORT, [...RECORDS, stale], GUARDS)).toEqual([
      "CreateFogModifierRadius radius: 2147483647: recorded, but no longer a crashed row of the report: remove its record",
    ]);
  });

  it("fails on a record of a case that ran without a crash", () => {
    const ran = {
      native: "CreateImage",
      case: "imageType: 0",
      guard: "Image.create",
    };

    expect(crashingCaseProblems(REPORT, [...RECORDS, ran], GUARDS)).toEqual([
      "CreateImage imageType: 0: recorded, but no longer a crashed row of the report: remove its record",
    ]);
  });

  it("fails on a case recorded twice", () => {
    expect(
      crashingCaseProblems(REPORT, [...RECORDS, RECORDS[0]], GUARDS),
    ).toEqual(["CreateImage imageType: 2147483647: recorded twice"]);
  });

  it.each([
    [
      "both a Guard and a reason",
      { guard: "Image.create", excluded: "No map passes it." },
      "has both guard and excluded: give exactly one",
    ],
    [
      "neither a Guard nor a reason",
      {},
      "has neither guard nor excluded: give exactly one",
    ],
    [
      "an empty reason",
      { excluded: " " },
      "excluded is not a reason: give a non-empty string",
    ],
    [
      "a Guard that is neither a rule nor a Class.member",
      { guard: "Image create" },
      'guard "Image create" is neither a rule (no-crashing-arguments) nor a Class.member or Class#member (Image.create)',
    ],
    [
      "a rule the lint plugin does not have",
      { guard: "no-crashing-images" },
      'guard "no-crashing-images" is not a rule of eslint-plugin-reforged',
    ],
    [
      "a member the library does not have",
      { guard: "Image.createChecked" },
      'guard "Image.createChecked" is not a member of the reforged-ts library',
    ],
    [
      "a static member named as an instance one",
      { guard: "Image#create" },
      'guard "Image#create" is not a member of the reforged-ts library',
    ],
    [
      "an empty list of Guards",
      { guard: [] },
      "guard is an empty list: give one Guard or more",
    ],
    [
      "a Guard named twice",
      { guard: ["Image.create", "Image.create"] },
      'guard "Image.create" is named twice',
    ],
    [
      "a field the record does not have",
      { guard: "Image.create", build: "3.0.0.12345" },
      "has an unknown field build",
    ],
  ])("fails on a record with %s", (_, fields, problem) => {
    const records = [
      { native: "CreateImage", case: "imageType: 2147483647", ...fields },
      ...RECORDS.slice(1),
    ];

    expect(crashingCaseProblems(REPORT, records, GUARDS)).toEqual([
      `CreateImage imageType: 2147483647: ${problem}`,
    ]);
  });

  it("fails on records that are not a list of records naming a Native and a case", () => {
    expect(crashingCaseProblems(REPORT, {}, GUARDS)).toEqual([
      "crashing-cases.json is not a list of records",
    ]);
    expect(
      crashingCaseProblems(
        REPORT,
        [
          ...RECORDS,
          "CreateImage",
          { native: "CreateImage", guard: "Image.create" },
        ],
        GUARDS,
      ),
    ).toEqual([
      "record 4 is not an object",
      "record 5 has no native and case: give both as non-empty strings",
    ]);
  });
});

describe("the Guards that exist", () => {
  it("are the rules the registry imports and the members of the library's classes", () => {
    const rulesIndex = [
      'import type { RuleEntry } from "../rule-entry.js";',
      'import noCrashingArguments from "./no-crashing-arguments.js";',
      'import noDottedAssetPaths from "./no-dotted-asset-paths.js";',
    ].join("\n");
    const source = {
      fileName: "image.ts",
      text: [
        "export class Image {",
        "  public static create(): Image { return new Image(); }",
        "  public get visible(): boolean { return true; }",
        "  public destroy(): void {}",
        "}",
      ].join("\n"),
    };

    expect(knownGuards(rulesIndex, [source])).toEqual({
      rules: new Set(["no-crashing-arguments", "no-dotted-asset-paths"]),
      members: new Set(["Image.create", "Image#visible", "Image#destroy"]),
    });
  });
});

/** The Guards of the workspace: its lint plugin's rules and its library's members. */
async function workspaceGuards(): Promise<KnownGuards> {
  const files = (await readdir(LIBRARY_SOURCES, { recursive: true })).filter(
    (file) => file.endsWith(".ts"),
  );
  const sources = await Promise.all(
    files.map(async (file) => ({
      fileName: file,
      text: await readFile(join(LIBRARY_SOURCES, file), "utf8"),
    })),
  );
  return knownGuards(await readFile(PLUGIN_RULES_INDEX, "utf8"), sources);
}

// The gate of `pnpm check`: the committed records, the committed report and
// the Guards of the workspace.
describe("crashing-cases.json", () => {
  it("records every Crashing case of the Nullability sweep, and no other, each Guard one that exists", async () => {
    const report = await readFile(NULLABILITY_REPORT, "utf8");
    const records: unknown = JSON.parse(await readFile(CRASHING_CASES, "utf8"));

    expect(
      crashingCaseProblems(report, records, await workspaceGuards()),
    ).toEqual([]);
    expect(crashedCases(report)).not.toEqual([]);
  });
});
