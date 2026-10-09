/**
 * Seam 1: the record of a Patch (#509, "The record and versioning"): a new
 * model against the previous one, each change with its verdict, and the
 * rename entries it produces.
 */
import { describe, expect, it } from "vitest";
import type { BuiltinsIndex, IndexEntry } from "../src/model.js";
import { formatRecord, recordOf, renameEntriesOf } from "../src/record.js";

const SETS = [
  { id: "default", label: "Default" },
  { id: "custom", label: "Custom" },
  { id: "melee", label: "Melee" },
];
const ALL = ["default", "custom", "melee"];

function index(
  objects: Record<string, IndexEntry>,
  build = "3.0.0.24268",
): BuiltinsIndex {
  return {
    format: 1,
    build,
    gameVersion: build.split(".").slice(0, 3).join("."),
    gameDataSets: SETS,
    objects,
  };
}

const unit = (constant: string, sets = ALL): IndexEntry => ({
  kind: "unit",
  sets,
  constant,
});

const PREVIOUS = index({
  hfoo: unit("Footman_hfoo"),
  Hpal: unit("Paladin_Hpal"),
  hkni: unit("Knight_hkni"),
  sfoo: unit("Footman_sfoo", ["default"]),
  Aabc: unit("Thing_Aabc"),
});

const NEXT = index(
  {
    // Unchanged.
    hfoo: unit("Footman_hfoo"),
    // Renamed: the same Rawcode, a new constant.
    Hpal: unit("HolyPaladin_Hpal"),
    // Removed: hkni. Added: hrif.
    hrif: unit("Rifleman_hrif"),
    // Its sets changed.
    sfoo: unit("Footman_sfoo", ["default", "melee"]),
    // Its kind changed.
    Aabc: { kind: "ability", sets: ALL, constant: "Thing_Aabc" },
  },
  "3.0.1.25000",
);

describe("the record of a Patch", () => {
  it("names each change and its verdict, a major when any is breaking", () => {
    const record = recordOf(PREVIOUS, NEXT);

    expect(record.added).toEqual([
      { rawcode: "hrif", symbol: "Units.Rifleman_hrif" },
    ]);
    expect(record.removed).toEqual([
      { rawcode: "hkni", symbol: "Units.Knight_hkni" },
    ]);
    expect(record.renamed).toEqual([
      {
        rawcode: "Hpal",
        from: "Units.Paladin_Hpal",
        to: "Units.HolyPaladin_Hpal",
      },
    ]);
    expect(record.kindChanged).toEqual([
      {
        rawcode: "Aabc",
        from: "Units.Thing_Aabc",
        to: "Abilities.Thing_Aabc",
      },
    ]);
    expect(record.setsChanged).toEqual([
      {
        rawcode: "sfoo",
        symbol: "Units.Footman_sfoo",
        from: ["default"],
        to: ["default", "melee"],
      },
    ]);
    expect(record.verdict).toBe("major");
  });

  it("is a minor for added objects and set changes alone", () => {
    const next = index({
      ...PREVIOUS.objects,
      hrif: unit("Rifleman_hrif"),
      sfoo: unit("Footman_sfoo", ["default", "melee"]),
    });

    expect(recordOf(PREVIOUS, next).verdict).toBe("minor");
  });

  it("is no change against the same model", () => {
    const record = recordOf(PREVIOUS, PREVIOUS);

    expect(record.verdict).toBe("none");
    expect(formatRecord(record)).toBe(
      "The record against Game version 3.0.0 (Build 3.0.0.24268): no change.\n",
    );
  });

  it("prints one line per change, with its verdict", () => {
    expect(formatRecord(recordOf(PREVIOUS, NEXT))).toBe(
      "The record against Game version 3.0.0 (Build 3.0.0.24268): a major.\n" +
        "- added (minor): Units.Rifleman_hrif (hrif)\n" +
        "- removed (major): Units.Knight_hkni (hkni)\n" +
        "- renamed (major): Units.Paladin_Hpal to Units.HolyPaladin_Hpal (Hpal)\n" +
        "- kind changed (major): Units.Thing_Aabc to Abilities.Thing_Aabc (Aabc)\n" +
        "- Game data sets changed (minor): Units.Footman_sfoo (sfoo), from Default to Default and Melee\n",
    );
  });

  it("against no previous model, adds every object", () => {
    const record = recordOf(undefined, PREVIOUS);

    expect(record.added).toHaveLength(5);
    expect(record.verdict).toBe("minor");
    expect(formatRecord(record)).toMatch(
      /^The record against no previous model: a minor\.\n/,
    );
  });
});

describe("the rename entries of a record", () => {
  it("map a renamed constant to its new name, a moved one to its new kind's, and a removed one to nothing", () => {
    const versions = {
      from: "reforged-builtins@1",
      to: "reforged-builtins@2",
    };

    expect(renameEntriesOf(recordOf(PREVIOUS, NEXT), versions)).toEqual([
      {
        old: "Units.Knight_hkni",
        new: null,
        kind: "member",
        versions,
        oneToOne: false,
        note: "The Built-in unit hkni is gone from Game version 3.0.1.",
      },
      {
        old: "Units.Paladin_Hpal",
        new: "Units.HolyPaladin_Hpal",
        kind: "member",
        versions,
        oneToOne: true,
        note: "The Built-in unit Hpal is renamed in Game version 3.0.1.",
      },
      {
        old: "Units.Thing_Aabc",
        new: "Abilities.Thing_Aabc",
        kind: "member",
        versions,
        oneToOne: false,
        note: "Aabc is a Built-in ability in Game version 3.0.1, no longer a unit: its Rawcode's type changes.",
      },
    ]);
  });

  it("are none for a minor", () => {
    expect(
      renameEntriesOf(recordOf(PREVIOUS, PREVIOUS), {
        from: "reforged-builtins@1",
        to: "reforged-builtins@2",
      }),
    ).toEqual([]);
  });
});
