import { describe, expect, it } from "vitest";
import { coverageReport, type CoverageReport } from "../src/report.js";
import {
  standardExclusions,
  standardSources,
  standardWrappers,
  writeFixture,
  type Fixture,
} from "./support/fixture.js";

async function reportOf(fixture: Fixture = {}): Promise<CoverageReport> {
  const result = await coverageReport(await writeFixture(fixture));
  if (!result.ok) throw new Error(result.message);
  return result.report;
}

const wrapper = (report: CoverageReport, name: string) => {
  const found = report.wrappers.find((entry) => entry.wrapper === name);
  if (!found) throw new Error(`no Wrapper ${name} in the report`);
  return found;
};

const names = (natives: readonly { name: string }[]) =>
  natives.map((native) => native.name);

describe("ownership", () => {
  it("gives each Wrapper the Natives of its type, first parameter or created", async () => {
    const report = await reportOf();

    const unit = wrapper(report, "Unit");
    expect(unit.type).toBe("unit");
    expect(unit.counts).toEqual({
      owned: 4,
      covered: 2,
      missing: 1,
      excluded: 1,
    });
    expect(names(unit.covered)).toEqual(["GetUnitX", "GetTriggerUnit"]);

    const player = wrapper(report, "MapPlayer");
    expect(player.type).toBe("player");
    expect(names(player.covered)).toEqual([
      "CreateUnit",
      "GetPlayerId",
      "Player",
      "GetLocalPlayer",
    ]);
  });

  it("groups the unowned Natives by the handle type they take first", async () => {
    const report = await reportOf();

    expect(report.unowned).toEqual({
      handleFirst: [
        { type: "camerafield", count: 1, natives: ["SetCameraField"] },
        { type: "hashtable", count: 1, natives: ["LoadUnitHandle"] },
      ],
      noHandle: { count: 2, natives: ["R2I", "DoNotSaveReplay"] },
    });
  });

  it("counts the common.j Natives only", async () => {
    const report = await reportOf();

    expect(report.patch).toBe("3.0.0.24268");
    expect(report.totals).toEqual({
      natives: 12,
      owned: 8,
      covered: 6,
      missing: 1,
      excluded: 1,
      unowned: 4,
    });
  });
});

describe("coverage", () => {
  it("reports a Native called by its owner as covered by the owner", async () => {
    const unit = wrapper(await reportOf(), "Unit");

    expect(unit.covered).toContainEqual({
      name: "GetUnitX",
      signature: "GetUnitX takes unit whichUnit returns real",
      coveredBy: ["Unit"],
    });
  });

  it("reports a Native called by another class as covered by that class, not missing", async () => {
    const player = wrapper(await reportOf(), "MapPlayer");

    expect(player.covered).toContainEqual({
      name: "CreateUnit",
      signature:
        "CreateUnit takes player id, integer unitid, real x, real y, real face returns unit",
      coveredBy: ["Unit"],
    });
    expect(player.missing).toEqual([]);
  });

  it("counts a static-only class as a class", async () => {
    const player = wrapper(await reportOf(), "MapPlayer");

    expect(player.covered).toContainEqual({
      name: "GetLocalPlayer",
      signature: "GetLocalPlayer takes nothing returns player",
      coveredBy: ["Camera"],
    });
  });

  it("names every class calling a Native", async () => {
    const sources = standardSources();
    sources["handles/camera.ts"] += [
      "export class Selection {",
      "  static focus(handle: unit) {",
      "    return GetUnitX(handle);",
      "  }",
      "}",
      "",
    ].join("\n");

    const unit = wrapper(await reportOf({ sources }), "Unit");

    expect(unit.covered).toContainEqual(
      expect.objectContaining({
        name: "GetUnitX",
        coveredBy: ["Selection", "Unit"],
      }),
    );
  });

  it("reports an owned Native no class calls as missing, with its signature", async () => {
    const unit = wrapper(await reportOf(), "Unit");

    expect(unit.missing).toEqual([
      {
        name: "SetUnitFacingTimed",
        signature:
          "SetUnitFacingTimed takes unit whichUnit, real facingAngle, real duration returns nothing",
      },
    ]);
  });

  it("does not count a call outside any class", async () => {
    const sources = standardSources();
    sources["handles/facing.ts"] =
      "export function face(handle: unit) {\n  SetUnitFacingTimed(handle, 0, 1);\n}\n";

    const unit = wrapper(await reportOf({ sources }), "Unit");

    expect(names(unit.missing)).toEqual(["SetUnitFacingTimed"]);
  });

  it("reports a hashtable-first Native as unowned even when it returns a wrapped type", async () => {
    const report = await reportOf();

    const owned = report.wrappers.flatMap((entry) => [
      ...names(entry.covered),
      ...names(entry.missing),
      ...names(entry.excluded),
    ]);
    expect(owned).not.toContain("LoadUnitHandle");
    expect(report.unowned.handleFirst).toContainEqual({
      type: "hashtable",
      count: 1,
      natives: ["LoadUnitHandle"],
    });
  });
});

describe("exclusions", () => {
  it("reports an excluded Native as excluded, with its reason, not missing", async () => {
    const unit = wrapper(await reportOf(), "Unit");

    expect(unit.excluded).toEqual([
      {
        name: "IsUnitInvisible",
        signature:
          "IsUnitInvisible takes unit whichUnit, player whichPlayer returns boolean",
        reason: "Returns false for every unit in 3.0.0.",
        source: "probe map, invisibility round 1",
        date: "2026-09-25",
      },
    ]);
    expect(names(unit.missing)).not.toContain("IsUnitInvisible");
  });

  const exclusion = (native: string) => ({
    native,
    reason: "A reason.",
    source: "A source.",
    date: "2026-09-25",
  });

  it("fails on an exclusion of a Native some class calls", async () => {
    const report = await reportOf({
      exclusions: [...standardExclusions(), exclusion("GetUnitX")],
    });

    expect(report.problems).toEqual([
      {
        kind: "stale-exclusion",
        message:
          "GetUnitX is excluded, but Unit now calls it: remove the exclusion.",
      },
    ]);
    expect(names(wrapper(report, "Unit").covered)).toContain("GetUnitX");
  });

  it("fails on an exclusion of a name the manifest does not know", async () => {
    const report = await reportOf({
      exclusions: [
        ...standardExclusions(),
        exclusion("GetUnitColour"),
        exclusion("CreateNUnitsAtLoc"),
      ],
    });

    expect(report.problems).toEqual([
      {
        kind: "unknown-exclusion",
        message:
          "GetUnitColour is excluded, but it is no common.j Native of the manifest: remove the exclusion.",
      },
      {
        kind: "unknown-exclusion",
        message:
          "CreateNUnitsAtLoc is excluded, but it is no common.j Native of the manifest: remove the exclusion.",
      },
    ]);
  });

  it("fails on an exclusion of an unowned Native", async () => {
    const report = await reportOf({
      exclusions: [...standardExclusions(), exclusion("LoadUnitHandle")],
    });

    expect(report.problems).toEqual([
      {
        kind: "unowned-exclusion",
        message:
          "LoadUnitHandle is excluded, but no Wrapper owns it: remove the exclusion.",
      },
    ]);
  });
});

describe("the exclusions file", () => {
  const valid = standardExclusions()[0] as Record<string, unknown>;

  async function messageOf(exclusions: unknown) {
    const result = await coverageReport(await writeFixture({ exclusions }));
    return result.ok ? null : result.message;
  }

  it("may be empty", async () => {
    expect(await messageOf([])).toBeNull();
  });

  it.each([
    [{ natives: [] }, "expected an array of exclusions"],
    [["IsUnitInvisible"], "entry 0 is not an object"],
    [[{ ...valid, reason: "" }], "entry 0 has no reason"],
    [
      [{ ...valid, source: undefined }],
      "entry 0 must have exactly the keys native, reason, source, date",
    ],
    [
      [{ ...valid, author: "someone" }],
      "entry 0 must have exactly the keys native, reason, source, date",
    ],
    [
      [{ ...valid, date: "2026-02-30" }],
      "entry 0 has the date 2026-02-30, not YYYY-MM-DD",
    ],
    [
      [{ ...valid, date: "2026-13-01" }],
      "entry 0 has the date 2026-13-01, not YYYY-MM-DD",
    ],
    [
      [{ ...valid, date: "25/09/2026" }],
      "entry 0 has the date 25/09/2026, not YYYY-MM-DD",
    ],
    [[valid, valid], "IsUnitInvisible is excluded twice"],
  ])("rejects %j", async (exclusions, detail) => {
    expect(await messageOf(exclusions)).toBe(
      `The exclusions file is invalid: ${detail}.`,
    );
  });
});

describe("the Wrapper configuration", () => {
  it("fails on a class extending the Handle base that it does not list", async () => {
    const sources = standardSources();
    sources["handles/item.ts"] =
      'import { Handle } from "./handle";\n\nexport class Item extends Handle<item> {}\n';
    sources["handles/hero.ts"] =
      'import { Unit } from "./unit";\n\nexport class Hero extends Unit {}\n';

    const report = await reportOf({ sources });

    expect(report.problems).toEqual([
      {
        kind: "unlisted-wrapper",
        message:
          "Hero extends Handle but the Wrapper configuration does not list it.",
      },
      {
        kind: "unlisted-wrapper",
        message:
          "Item extends Handle but the Wrapper configuration does not list it.",
      },
    ]);
  });

  it("fails on a listed handle type the manifest names nowhere", async () => {
    const sources = standardSources();
    sources["handles/lightning.ts"] =
      "export class Lightning extends Handle<lightning> {}\n";

    const report = await reportOf({
      sources,
      wrappers: { ...standardWrappers(), Lightning: "lightning" },
    });

    expect(report.problems).toEqual([
      {
        kind: "unknown-type",
        message:
          "The Wrapper configuration gives Lightning the handle type lightning, which the manifest names nowhere.",
      },
    ]);
  });

  it("fails on a listed Wrapper no class declaration names", async () => {
    const report = await reportOf({
      wrappers: { ...standardWrappers(), Hashtable: "hashtable" },
    });

    expect(report.problems).toEqual([
      {
        kind: "missing-wrapper",
        message:
          "The Wrapper configuration lists Hashtable, which is no class extending Handle in the sources.",
      },
    ]);
    expect(wrapper(report, "Hashtable").counts.owned).toBe(1);
  });

  it("fails on a listed class that does not extend the Handle base", async () => {
    const report = await reportOf({
      wrappers: { ...standardWrappers(), Camera: "camerafield" },
    });

    expect(report.problems).toEqual([
      {
        kind: "missing-wrapper",
        message:
          "The Wrapper configuration lists Camera, which is no class extending Handle in the sources.",
      },
    ]);
  });

  it.each([
    [["Unit"], "expected an object of class names to handle types"],
    [{ Unit: "unit", Counter: "integer" }, "Counter names no handle type"],
    [{ Unit: "unit", Hero: "unit" }, "Unit and Hero both own unit"],
  ])("rejects %j", async (wrappers, detail) => {
    const result = await coverageReport(await writeFixture({ wrappers }));

    expect(result).toEqual({
      ok: false,
      message: `The Wrapper configuration is invalid: ${detail}.`,
    });
  });
});

describe("the files", () => {
  it("hold the report as JSON", async () => {
    const result = await coverageReport(await writeFixture());
    if (!result.ok) throw new Error(result.message);

    expect(result.json.endsWith("}\n")).toBe(true);
    expect(JSON.parse(result.json)).toEqual({
      format: 1,
      patch: "3.0.0.24268",
      totals: {
        natives: 12,
        owned: 8,
        covered: 6,
        missing: 1,
        excluded: 1,
        unowned: 4,
      },
      problems: [],
      wrappers: [
        {
          wrapper: "Unit",
          type: "unit",
          counts: { owned: 4, covered: 2, missing: 1, excluded: 1 },
          covered: [
            {
              name: "GetUnitX",
              signature: "GetUnitX takes unit whichUnit returns real",
              coveredBy: ["Unit"],
            },
            {
              name: "GetTriggerUnit",
              signature: "GetTriggerUnit takes nothing returns unit",
              coveredBy: ["Unit"],
            },
          ],
          missing: [
            {
              name: "SetUnitFacingTimed",
              signature:
                "SetUnitFacingTimed takes unit whichUnit, real facingAngle, real duration returns nothing",
            },
          ],
          excluded: [
            {
              name: "IsUnitInvisible",
              signature:
                "IsUnitInvisible takes unit whichUnit, player whichPlayer returns boolean",
              reason: "Returns false for every unit in 3.0.0.",
              source: "probe map, invisibility round 1",
              date: "2026-09-25",
            },
          ],
        },
        {
          wrapper: "MapPlayer",
          type: "player",
          counts: { owned: 4, covered: 4, missing: 0, excluded: 0 },
          covered: [
            {
              name: "CreateUnit",
              signature:
                "CreateUnit takes player id, integer unitid, real x, real y, real face returns unit",
              coveredBy: ["Unit"],
            },
            {
              name: "GetPlayerId",
              signature: "GetPlayerId takes player whichPlayer returns integer",
              coveredBy: ["MapPlayer"],
            },
            {
              name: "Player",
              signature: "Player takes integer number returns player",
              coveredBy: ["MapPlayer"],
            },
            {
              name: "GetLocalPlayer",
              signature: "GetLocalPlayer takes nothing returns player",
              coveredBy: ["Camera"],
            },
          ],
          missing: [],
          excluded: [],
        },
      ],
      unowned: {
        handleFirst: [
          { type: "camerafield", count: 1, natives: ["SetCameraField"] },
          { type: "hashtable", count: 1, natives: ["LoadUnitHandle"] },
        ],
        noHandle: { count: 2, natives: ["R2I", "DoNotSaveReplay"] },
      },
    });
  });

  it("render the report as Markdown", async () => {
    const result = await coverageReport(
      await writeFixture({
        exclusions: [
          ...standardExclusions(),
          {
            native: "GetUnitX",
            reason: "A reason.",
            source: "A source.",
            date: "2026-09-25",
          },
        ],
      }),
    );
    if (!result.ok) throw new Error(result.message);

    expect(result.markdown).toBe(
      [
        "# Wrapper coverage report",
        "",
        "Generated by `pnpm coverage:report` from the manifest of Patch 3.0.0.24268 and the library sources; do not edit. A Wrapper covers the common.j Natives its handle type owns (ADR 0008).",
        "",
        "| Owned | Covered | Excluded | Missing | Unowned | common.j Natives |",
        "| ----: | ------: | -------: | ------: | ------: | ---------------: |",
        "| 8 | 6 | 1 | 1 | 4 | 12 |",
        "",
        "## Problems",
        "",
        "- `stale-exclusion`: GetUnitX is excluded, but Unit now calls it: remove the exclusion.",
        "",
        "## Wrappers",
        "",
        "| Wrapper | Type | Owned | Covered | Excluded | Missing |",
        "| ------- | ---- | ----: | ------: | -------: | ------: |",
        "| Unit | `unit` | 4 | 2 | 1 | 1 |",
        "| MapPlayer | `player` | 4 | 4 | 0 | 0 |",
        "",
        "### Unit (`unit`)",
        "",
        "Missing:",
        "",
        "- `SetUnitFacingTimed takes unit whichUnit, real facingAngle, real duration returns nothing`",
        "",
        "Excluded:",
        "",
        "- `IsUnitInvisible takes unit whichUnit, player whichPlayer returns boolean`: Returns false for every unit in 3.0.0. Source: probe map, invisibility round 1 (2026-09-25).",
        "",
        "Covered:",
        "",
        "| Native | Covered by |",
        "| ------ | ---------- |",
        "| `GetUnitX` | Unit |",
        "| `GetTriggerUnit` | Unit |",
        "",
        "### MapPlayer (`player`)",
        "",
        "Covered:",
        "",
        "| Native | Covered by |",
        "| ------ | ---------- |",
        "| `CreateUnit` | Unit |",
        "| `GetPlayerId` | MapPlayer |",
        "| `Player` | MapPlayer |",
        "| `GetLocalPlayer` | Camera |",
        "",
        "## Unowned Natives",
        "",
        "Outside the coverage rule: the first parameter is a handle type no Wrapper owns, or no handle and no wrapped handle is returned. The JSON report names each Native.",
        "",
        "| First parameter | Natives |",
        "| --------------- | ------: |",
        "| `camerafield` | 1 |",
        "| `hashtable` | 1 |",
        "| No handle | 2 |",
        "",
      ].join("\n"),
    );
  });

  it("render no problems as none", async () => {
    const result = await coverageReport(await writeFixture());
    if (!result.ok) throw new Error(result.message);

    expect(result.markdown).toContain("## Problems\n\nNone.\n\n## Wrappers");
  });
});
