/**
 * The committed 3.0.0 index, field table and provenance, extracted by
 * `builtins:generate` from an install of 3.0.0.24268: the facts of the Patch
 * they pin (the count of each Object kind and the examples of #512, the
 * fields of each kind), that the package carries the Patch of reforged-types,
 * and that the published files hold the index and the field table alone.
 */
import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { typingsBuild } from "../src/cli/generate.js";
import { KIND_CONSTANTS } from "../src/emit.js";
import { serializeFields, type FieldTable } from "../src/fields.js";
import {
  serializeIndex,
  serializeProvenance,
  type BuiltinsIndex,
  type ObjectKind,
  type Provenance,
} from "../src/model.js";

const read = (path: string) =>
  readFile(new URL(`../${path}`, import.meta.url), "utf8");

describe("the 3.0.0 index", () => {
  it("holds the seven Object kinds of the base layer of 3.0.0.24268", async () => {
    const index = JSON.parse(await read("3.0.0/index.json")) as BuiltinsIndex;

    expect(index.format).toBe(1);
    expect(index.build).toBe("3.0.0.24268");
    expect(index.gameVersion).toBe("3.0.0");
    expect(index.gameDataSets).toEqual([
      { id: "custom-fk", label: "Custom (Forsaken Kingdom)" },
      { id: "melee-fk", label: "Melee (Forsaken Kingdom)" },
      { id: "custom-tft", label: "Custom (The Frozen Throne)" },
      { id: "melee-tft", label: "Melee (The Frozen Throne)" },
      { id: "custom-roc", label: "Custom (Reign of Chaos)" },
      { id: "melee-roc", label: "Melee (Reign of Chaos)" },
    ]);
    const counts: Record<string, number> = {};
    for (const entry of Object.values(index.objects)) {
      counts[entry.kind] = (counts[entry.kind] ?? 0) + 1;
    }
    expect(counts).toEqual({
      unit: 928,
      item: 648,
      ability: 1551,
      buff: 318,
      destructable: 344,
      doodad: 771,
      upgrade: 90,
    });
    expect(index.objects.hfoo).toEqual({
      kind: "unit",
      name: "Footman",
      race: "human",
      sets: [
        "custom-fk",
        "melee-fk",
        "custom-tft",
        "melee-tft",
        "custom-roc",
        "melee-roc",
      ],
      constant: "Footman_hfoo",
    });
  });

  // The counts of the sets the Probe runs of #575 read: a set of Reign of
  // Chaos holds no unit of a later version, and Forsaken Kingdom the base
  // layer whole.
  it("holds each Game data set's units, the Scarlet Crusade's Footman in Forsaken Kingdom alone", async () => {
    const index = JSON.parse(await read("3.0.0/index.json")) as BuiltinsIndex;

    const units = Object.values(index.objects).filter((e) => e.kind === "unit");
    const count = (set: string) =>
      units.filter((entry) => entry.sets.includes(set)).length;
    expect(index.gameDataSets.map((set) => [set.id, count(set.id)])).toEqual([
      ["custom-fk", 928],
      ["melee-fk", 928],
      ["custom-tft", 864],
      ["melee-tft", 865],
      ["custom-roc", 470],
      ["melee-roc", 469],
    ]);
    expect(index.objects.sfoo).toMatchObject({
      name: "Footman",
      sets: ["custom-fk", "melee-fk"],
    });
    expect(await read("3.0.0/units.d.ts")).toContain(
      "   * Footman (`sfoo`), a Built-in unit of Patch 3.0.0, race human.\n" +
        "   *\n" +
        "   * Forsaken Kingdom only.\n",
    );
  });

  // The examples of #512. Its `Buffs.TimedLife_BTLF` is no Built-in buff:
  // `AbilityBuffData.slk` has no BTLF, only the skin and strings files a
  // `[Btlf]` section. `Binf` stands in, named by its Bufftip as a buff
  // without an EditorName is.
  it.each([
    ["Hpal", "unit", "Paladin_Hpal"],
    ["ratf", "item", "ClawsOfAttack15_ratf"],
    ["AHbz", "ability", "Blizzard_AHbz"],
    ["BHbz", "buff", "BlizzardCaster_BHbz"],
    ["Binf", "buff", "InnerFire_Binf"],
    ["LTlt", "destructable", "SummerTreeWall_LTlt"],
    ["LObr", "doodad", "Brazier_LObr"],
    ["Rhme", "upgrade", "IronForgedSwords_Rhme"],
  ])("names %s, %s, %s", async (rawcode, kind, constant) => {
    const index = JSON.parse(await read("3.0.0/index.json")) as BuiltinsIndex;
    expect(index.objects[rawcode]).toMatchObject({ kind, constant });
    expect(
      await read(`3.0.0/${KIND_CONSTANTS[kind as ObjectKind].entry}.d.ts`),
    ).toContain(`  readonly ${constant}: Rawcode<"${kind}">;`);
  });

  it("is written as the generator writes it", async () => {
    const text = await read("3.0.0/index.json");
    expect(serializeIndex(JSON.parse(text) as BuiltinsIndex)).toBe(text);
  });

  it("has its provenance, of the same Build, written as the generator writes it", async () => {
    const text = await read("3.0.0/provenance.json");
    const provenance = JSON.parse(text) as Provenance;

    expect(serializeProvenance(provenance)).toBe(text);
    expect(provenance.build).toBe("3.0.0.24268");
    expect(provenance.buildConfig).toBe("3a9d8f26806936764d2d9ad526a65e04");
    expect(provenance.inputs.map((input) => input.path)).toContain(
      "War3.w3mod:Units/UnitData.slk",
    );
  });
});

describe("the 3.0.0 field table", () => {
  const table = async () =>
    JSON.parse(await read("3.0.0/fields.json")) as FieldTable;

  it("holds every field of the seven kinds' metadata of 3.0.0.24268, labelled", async () => {
    const { format, build, gameVersion, kinds, fields } = await table();

    expect([format, build, gameVersion]).toEqual([1, "3.0.0.24268", "3.0.0"]);
    expect(kinds).toEqual({
      unit: "Units",
      item: "Items",
      ability: "Abilities",
      buff: "Buffs/Effects",
      destructable: "Destructibles",
      doodad: "Doodads",
      upgrade: "Upgrades",
    });
    // The rows of each metadata file; units and items share the 285 of
    // UnitMetaData.slk by its use columns, 9 of them both.
    expect(
      Object.fromEntries(
        Object.entries(fields).map(([kind, byId]) => [
          kind,
          Object.keys(byId).length,
        ]),
      ),
    ).toEqual({
      unit: 247,
      item: 47,
      ability: 960,
      buff: 27,
      destructable: 56,
      doodad: 42,
      upgrade: 37,
    });
    for (const byId of Object.values(fields)) {
      for (const entry of Object.values(byId))
        expect(entry.label).toBeDefined();
    }
  });

  it.each([
    // Names go to the Skin file as a TRIGSTR, the doodads' to the base file
    // (editor-objects.w3m of reforged-map, #591).
    ["unit", "unam", { file: "skin", localizable: true, label: "Name" }],
    ["item", "unam", { file: "skin", localizable: true }],
    ["ability", "anam", { file: "skin", localizable: true }],
    [
      "buff",
      "ftip",
      { file: "skin", localizable: true, field: "Bufftip", label: "Tooltip" },
    ],
    ["destructable", "bnam", { file: "skin", localizable: true }],
    ["doodad", "dnam", { file: "base", localizable: true }],
    ["upgrade", "gnam", { file: "skin", localizable: true, levels: true }],
    // A path is no text; a cost per level is an integer in the base file.
    ["unit", "umdl", { type: "string", file: "skin", localizable: false }],
    ["item", "igol", { type: "int", file: "base" }],
    ["ability", "amcs", { type: "int", file: "base", levels: true, data: 0 }],
    [
      "ability",
      "Hbz1",
      { levels: true, data: 1, specific: ["AHbz", "ACbz", "ANrf", "ACrf"] },
    ],
  ] as const)("describes the %s field %s", async (kind, id, facts) => {
    expect((await table()).fields[kind][id]).toMatchObject(facts);
  });

  it("is written as the generator writes it, from inputs its provenance pins", async () => {
    const text = await read("3.0.0/fields.json");
    expect(serializeFields(JSON.parse(text) as FieldTable)).toBe(text);
    const provenance = JSON.parse(
      await read("3.0.0/provenance.json"),
    ) as Provenance;
    expect(provenance.inputs.map((input) => input.path)).toEqual(
      expect.arrayContaining([
        "War3.w3mod:Units/UnitMetaData.slk",
        "War3.w3mod:Units/AbilityMetaData.slk",
        "War3.w3mod:Units/AbilityBuffMetaData.slk",
        "War3.w3mod:Units/DestructableMetaData.slk",
        "War3.w3mod:Doodads/DoodadMetaData.slk",
        "War3.w3mod:Units/UpgradeMetaData.slk",
        "War3.w3mod:_Locales/enUS.w3mod:UI/WorldEditGameStrings.txt",
        "War3.w3mod:_Locales/enUS.w3mod:UI/WorldEditStrings.txt",
      ]),
    );
  });
});

describe("the package", () => {
  const manifest = async () =>
    JSON.parse(await read("package.json")) as {
      files: string[];
      reforged: { patch: string };
    };

  it("carries the Patch of reforged-types and of its index", async () => {
    const { reforged } = await manifest();
    const index = JSON.parse(await read("3.0.1/index.json")) as BuiltinsIndex;

    expect(reforged.patch).toBe(typingsBuild());
    expect(index.build).toBe(reforged.patch);
  });

  // npm always adds package.json; the provenance file, the generator (src/,
  // build/) and the tests match none of these patterns.
  it("publishes the index, the field table and the artefacts, and nothing of the generator, the provenance or the raw files", async () => {
    expect((await manifest()).files).toEqual([
      "/[0-9]*.d.ts",
      "/[0-9]*/*.d.ts",
      "/[0-9]*/*.lua",
      "/[0-9]*/index.json",
      "/[0-9]*/fields.json",
      "/LICENSE",
      "/README.md",
    ]);
  });
});
