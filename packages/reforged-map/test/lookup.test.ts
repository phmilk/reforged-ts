// The Rawcode lookup (#588): from a Rawcode literal to what it names, on
// map folders the encoder builds and the workspace's committed
// reforged-builtins index.

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import {
  DEFAULT_MIN_INTERVAL,
  openRawcodeLookup,
  type RawcodeLookupResult,
} from "../src/index.js";
import {
  PACKAGE_ROOT,
  makeTempDir,
  mapFolder,
  removeTemporary,
} from "./support/map-folder.js";
import { buildObjectData, buildWts } from "./support/object-data.js";

afterAll(removeTemporary);

const ALL_SETS = [
  "custom-fk",
  "melee-fk",
  "custom-tft",
  "melee-tft",
  "custom-roc",
  "melee-roc",
];

/**
 * A map folder holding a Custom unit `h000` named Captain through
 * war3map.wts, a Custom unit `h00A` that keeps its base's name, Footman
 * renamed Militia, Knight modified without a rename, and a Custom buff and a
 * Custom destructable both at `B000`.
 */
function sampleMap(): string {
  return mapFolder({
    "war3map.w3u": buildObjectData({
      original: [
        {
          original: "hfoo",
          modifications: [{ field: "unam", value: "Militia" }],
        },
        { original: "hkni", modifications: [{ field: "umvs", value: 300 }] },
      ],
      custom: [
        { original: "hfoo", custom: "h000" },
        { original: "hpea", custom: "h00A" },
      ],
    }),
    "war3mapSkin.w3u": buildObjectData({
      custom: [
        {
          original: "hfoo",
          custom: "h000",
          modifications: [{ field: "unam", value: "TRIGSTR_007" }],
        },
      ],
    }),
    "war3map.wts": buildWts({ 7: "Captain" }),
    "war3map.w3h": buildObjectData({
      custom: [
        {
          original: "Binf",
          custom: "B000",
          modifications: [{ field: "fnam", value: "Holy Fire" }],
        },
      ],
    }),
    "war3map.w3b": buildObjectData({
      custom: [
        {
          original: "LTlt",
          custom: "B000",
          modifications: [{ field: "bnam", value: "Gate" }],
        },
      ],
    }),
  });
}

const openSample = () =>
  openRawcodeLookup({ mapFolder: sampleMap(), projectRoot: PACKAGE_ROOT });

describe("openRawcodeLookup", () => {
  it("returns a Built-in object with its name, race, Game data sets and constant", () => {
    expect(openSample().lookup("Hpal")).toEqual({
      status: "known",
      rawcode: "Hpal",
      objects: [
        {
          origin: "builtin",
          rawcode: "Hpal",
          kind: "unit",
          name: "Paladin",
          race: "human",
          gameDataSets: ALL_SETS,
          constant: {
            object: "Units",
            member: "Paladin_Hpal",
            module: "reforged-builtins/units",
            generated: false,
          },
        },
      ],
    } satisfies RawcodeLookupResult);
  });

  it("returns a Custom object with its name, base, base's race and generated constant", () => {
    const lookup = openSample();

    expect(lookup.lookup("h000")).toEqual({
      status: "known",
      rawcode: "h000",
      objects: [
        {
          origin: "custom",
          rawcode: "h000",
          kind: "unit",
          name: "Captain",
          race: "human",
          base: { rawcode: "hfoo", name: "Footman" },
          constant: {
            object: "CustomUnits",
            member: "Captain_h000",
            module: "custom-units.ts",
            generated: true,
          },
        },
      ],
    } satisfies RawcodeLookupResult);
    expect(lookup.lookup("h00A")).toMatchObject({
      status: "known",
      objects: [
        {
          origin: "custom",
          name: "Peasant",
          base: { rawcode: "hpea", name: "Peasant" },
          constant: { member: "Peasant_h00A" },
        },
      ],
    });
  });

  it("returns a modified Built-in object with the game's name and the map's", () => {
    const lookup = openSample();

    expect(lookup.lookup("hfoo")).toEqual({
      status: "known",
      rawcode: "hfoo",
      objects: [
        {
          origin: "modified",
          rawcode: "hfoo",
          kind: "unit",
          name: "Militia",
          builtinName: "Footman",
          mapName: "Militia",
          race: "human",
          gameDataSets: ALL_SETS,
          constant: {
            object: "Units",
            member: "Footman_hfoo",
            module: "reforged-builtins/units",
            generated: false,
          },
        },
      ],
    } satisfies RawcodeLookupResult);
    expect(lookup.lookup("hkni")).toMatchObject({
      status: "known",
      objects: [
        {
          origin: "modified",
          name: "Knight",
          builtinName: "Knight",
          mapName: undefined,
        },
      ],
    });
  });

  it("returns both objects of a Rawcode a Custom buff and a Custom destructable share", () => {
    const result = openSample().lookup("B000");

    expect(result).toMatchObject({
      status: "known",
      rawcode: "B000",
      objects: [
        {
          origin: "custom",
          kind: "buff",
          name: "Holy Fire",
          base: { rawcode: "Binf", name: "Inner Fire" },
          constant: { object: "CustomBuffs", member: "HolyFire_B000" },
        },
        {
          origin: "custom",
          kind: "destructable",
          name: "Gate",
          base: { rawcode: "LTlt", name: "Summer Tree Wall" },
          constant: { object: "CustomDestructables", member: "Gate_B000" },
        },
      ],
    });
    expect(result.status === "known" && result.objects[1].race).toBe(undefined);
  });

  it("suggests up to three Rawcodes one edit away for an unknown one, a change of case first", () => {
    const lookup = openSample();

    expect(lookup.lookup("hpal")).toEqual({
      status: "unknown",
      rawcode: "hpal",
      suggestions: [
        { rawcode: "Hpal", name: "Paladin", kind: "unit" },
        { rawcode: "Npal", name: "Forsaken Paladin", kind: "unit" },
        { rawcode: "hval", name: "Helm of Valor", kind: "item" },
      ],
    } satisfies RawcodeLookupResult);
  });

  it("suggests the map's objects, by the name the map gives them", () => {
    expect(openSample().lookup("h00a")).toEqual({
      status: "unknown",
      rawcode: "h00a",
      suggestions: [
        { rawcode: "h00A", name: "Peasant", kind: "unit" },
        { rawcode: "h000", name: "Captain", kind: "unit" },
      ],
    } satisfies RawcodeLookupResult);
  });

  it("suggests nothing for a Rawcode with no Rawcode one edit away", () => {
    expect(openSample().lookup("zzzz")).toEqual({
      status: "unknown",
      rawcode: "zzzz",
      suggestions: [],
    });
  });

  it("returns a literal that is not four one-byte characters as malformed", () => {
    const lookup = openSample();

    for (const literal of ["hfo", "hfooo", "", "hfoĀ"]) {
      expect(lookup.lookup(literal)).toEqual({
        status: "malformed",
        rawcode: literal,
      });
    }
  });

  it("returns a malformed literal as malformed even when it is unavailable", () => {
    const lookup = openRawcodeLookup({
      mapFolder: path.join(makeTempDir(), "missing.w3m"),
      projectRoot: PACKAGE_ROOT,
    });

    expect(lookup.lookup("hfo")).toEqual({
      status: "malformed",
      rawcode: "hfo",
    });
  });

  it("is unavailable without reforged-builtins, with its reason", () => {
    const lookup = openRawcodeLookup({
      mapFolder: sampleMap(),
      projectRoot: makeTempDir(),
    });

    expect(lookup.lookup("hfoo")).toEqual({
      status: "unavailable",
      reason:
        "reforged-builtins is not installed: install it in the Map project to look Rawcodes up.",
    });
    expect(lookup.gameVersion()).toBeUndefined();
  });

  it("is unavailable with a missing map folder, with its reason", () => {
    const folder = path.join(makeTempDir(), "missing.w3m");
    const lookup = openRawcodeLookup({
      mapFolder: folder,
      projectRoot: PACKAGE_ROOT,
    });

    expect(lookup.lookup("hfoo")).toEqual({
      status: "unavailable",
      reason: `Map folder not found: ${folder}. Save the map as a folder from the World Editor (File > Save Map As, "Folder").`,
    });
  });

  it("gives the Game version of the index it read", () => {
    expect(openSample().gameVersion()).toBe("3.0.0");
  });

  it("builds its model on the first lookup and keeps it", () => {
    const folder = sampleMap();
    const lookup = openRawcodeLookup({
      mapFolder: folder,
      projectRoot: PACKAGE_ROOT,
    });
    fs.rmSync(path.join(folder, "war3map.w3h"));
    expect(lookup.lookup("B000")).toMatchObject({
      objects: [{ kind: "destructable" }],
    });

    fs.rmSync(folder, { recursive: true });

    expect(lookup.lookup("B000")).toMatchObject({
      objects: [{ kind: "destructable" }],
    });
  });

  it("keeps the minimum interval it is given, one second by default", () => {
    expect(DEFAULT_MIN_INTERVAL).toBe(1000);
    expect(openSample().minInterval).toBe(1000);
    expect(
      openRawcodeLookup({
        mapFolder: sampleMap(),
        projectRoot: PACKAGE_ROOT,
        minInterval: 250,
      }).minInterval,
    ).toBe(250);
  });

  it("loads with require from a CommonJS script", () => {
    const output = execFileSync(
      process.execPath,
      [
        path.join(PACKAGE_ROOT, "test", "fixtures", "require-lookup.cjs"),
        PACKAGE_ROOT,
        sampleMap(),
      ],
      { encoding: "utf8" },
    );

    expect(JSON.parse(output)).toEqual({
      gameVersion: "3.0.0",
      status: "known",
      name: "Captain",
    });
  });
});
