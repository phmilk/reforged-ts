// The coverage of the Crashing cases (src/nullability/crashing-cases.ts):
// every crashed row of the Nullability sweep's report has one record in
// crashing-cases.json, with a Guard or the reason it is excluded, and every
// record is still a crashed row. `pnpm check` runs it on the real files.

import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import {
  crashedCases,
  crashingCaseProblems,
} from "../src/nullability/crashing-cases.js";
import { CRASHING_CASES, NULLABILITY_REPORT } from "../src/folders.js";

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
    expect(crashingCaseProblems(REPORT, RECORDS)).toEqual([]);
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

    expect(crashingCaseProblems(REPORT, records)).toEqual([]);
  });

  it("fails on a crashed row with no record", () => {
    expect(crashingCaseProblems(REPORT, RECORDS.slice(1))).toEqual([
      "CreateImage imageType: 2147483647: a crashed row of the report with no record: add one with a Guard or a reason it is excluded",
    ]);
  });

  it("fails on a record whose case is no longer a crashed row", () => {
    const stale = {
      native: "CreateFogModifierRadius",
      case: "radius: 2147483647",
      excluded: "No map passes int-max as a radius.",
    };

    expect(crashingCaseProblems(REPORT, [...RECORDS, stale])).toEqual([
      "CreateFogModifierRadius radius: 2147483647: recorded, but no longer a crashed row of the report: remove its record",
    ]);
  });

  it("fails on a record of a case that ran without a crash", () => {
    const ran = {
      native: "CreateImage",
      case: "imageType: 0",
      guard: "Image.create",
    };

    expect(crashingCaseProblems(REPORT, [...RECORDS, ran])).toEqual([
      "CreateImage imageType: 0: recorded, but no longer a crashed row of the report: remove its record",
    ]);
  });

  it("fails on a case recorded twice", () => {
    expect(crashingCaseProblems(REPORT, [...RECORDS, RECORDS[0]])).toEqual([
      "CreateImage imageType: 2147483647: recorded twice",
    ]);
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
      'guard "Image create" is neither a rule (no-crashing-arguments) nor a Class.member (Image.create)',
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

    expect(crashingCaseProblems(REPORT, records)).toEqual([
      `CreateImage imageType: 2147483647: ${problem}`,
    ]);
  });

  it("fails on records that are not a list of records naming a Native and a case", () => {
    expect(crashingCaseProblems(REPORT, {})).toEqual([
      "crashing-cases.json is not a list of records",
    ]);
    expect(
      crashingCaseProblems(REPORT, [
        ...RECORDS,
        "CreateImage",
        { native: "CreateImage", guard: "Image.create" },
      ]),
    ).toEqual([
      "record 4 is not an object",
      "record 5 has no native and case: give both as non-empty strings",
    ]);
  });
});

// The gate of `pnpm check`: the committed records and the committed report.
describe("crashing-cases.json", () => {
  it("records every Crashing case of the Nullability sweep, and no other", async () => {
    const report = await readFile(NULLABILITY_REPORT, "utf8");
    const records: unknown = JSON.parse(await readFile(CRASHING_CASES, "utf8"));

    expect(crashingCaseProblems(report, records)).toEqual([]);
    expect(crashedCases(report)).not.toEqual([]);
  });
});
