// The map folder the 3.0 World Editor saved with Object data
// (test/fixtures/editor-objects.w3m, its provenance in
// test/fixtures/editor-objects.md): a Custom object of each of the seven
// Object kinds, a modified Built-in object of each, a non-ASCII name, a
// multi-level ability, and a Custom buff and a Custom destructable both at
// `B000`. Read through the entry point and the lookup, as the Template and
// the tools run them; the ability's levels, which nothing generated carries,
// through the Object data reader.

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  CONSTANTS_FILES,
  OBJECTS_DECLARATIONS_FILE,
  generateObjects,
  openRawcodeLookup,
  type ObjectKind,
  type ObjectsOutput,
} from "../src/index.js";
import { OBJECT_KINDS, createModel } from "../src/model.js";
import { readObjectData } from "../src/object-data.js";
import {
  PACKAGE_ROOT,
  fixtureMap,
  removeTemporary,
} from "./support/map-folder.js";
import {
  createMapProject,
  readFixture,
  typecheck,
} from "./support/map-project.js";

afterAll(removeTemporary);

const FOLDER = fixtureMap("editor-objects.w3m");
const FIXTURES = "editor-objects-map-project";

/** The objects of the fixture: Rawcode, Object kind, origin and the name the map gives it. */
const OBJECTS: readonly {
  rawcode: string;
  kind: ObjectKind;
  origin: "custom" | "modified";
  name: string;
  /** A modified Built-in object's enUS name in the game. */
  builtinName?: string;
}[] = [
  { rawcode: "h000", kind: "unit", origin: "custom", name: "Captain" },
  { rawcode: "h001", kind: "unit", origin: "custom", name: "Chevalier Élu" },
  {
    rawcode: "hfoo",
    kind: "unit",
    origin: "modified",
    name: "Militia",
    builtinName: "Footman",
  },
  { rawcode: "I000", kind: "item", origin: "custom", name: "Captain's Claws" },
  {
    rawcode: "ratc",
    kind: "item",
    origin: "modified",
    name: "Claws of Attack +12",
    builtinName: "Claws of Attack +12",
  },
  {
    rawcode: "A000",
    kind: "ability",
    origin: "custom",
    name: "Arctic Blizzard",
  },
  {
    rawcode: "AHhb",
    kind: "ability",
    origin: "modified",
    name: "Holy Light",
    builtinName: "Holy Light",
  },
  {
    rawcode: "Binf",
    kind: "buff",
    origin: "modified",
    name: "Burning Fire",
    builtinName: "Inner Fire",
  },
  {
    rawcode: "LTlt",
    kind: "destructable",
    origin: "modified",
    name: "Summer Tree Wall",
    builtinName: "Summer Tree Wall",
  },
  {
    rawcode: "D000",
    kind: "doodad",
    origin: "custom",
    name: "Statue of the Captain",
  },
  {
    rawcode: "AObr",
    kind: "doodad",
    origin: "modified",
    name: "Skull Brazier",
    builtinName: "Brazier Skull",
  },
  {
    rawcode: "R000",
    kind: "upgrade",
    origin: "custom",
    name: "Sharper Swords",
  },
  {
    rawcode: "Rhar",
    kind: "upgrade",
    origin: "modified",
    name: "Iron Plating",
    builtinName: "Iron Plating",
  },
];

describe("the Object data saved by the 3.0 World Editor", () => {
  let output: ObjectsOutput;
  let diagnostics: string[];

  beforeAll(() => {
    output = generateObjects(FOLDER, { projectRoot: PACKAGE_ROOT });
    diagnostics = typecheck(createMapProject(output.files, FIXTURES));
  }, 60_000);

  /** The generated file of that name. */
  function contents(name: string): string {
    const file = output.files.find((candidate) => candidate.name === name);
    if (file === undefined) throw new Error(`no ${name} generated`);
    return file.contents;
  }

  it("reads it with no warning", () => {
    expect(output.warnings).toEqual([]);
  });

  it("generates the overloads and the constants of the seven kinds the fixtures stand in for", () => {
    for (const name of [
      OBJECTS_DECLARATIONS_FILE,
      ...OBJECT_KINDS.map((kind) => CONSTANTS_FILES[kind]),
    ]) {
      expect(contents(name), name).toBe(readFixture(name, FIXTURES));
    }
  });

  it("gives each modified Built-in object an overload naming the game's object, and the map's name when renamed", () => {
    const overloads = contents(OBJECTS_DECLARATIONS_FILE);
    expect(overloads).toContain(
      "Footman (`hfoo`), a Built-in unit of Patch 3.0.0, named Militia in this map.",
    );
    expect(overloads).toContain(
      "Holy Light (`AHhb`), a Built-in ability of Patch 3.0.0, which this map modifies.",
    );
    for (const { rawcode, origin } of OBJECTS) {
      if (origin === "modified") {
        expect(overloads).toContain(
          `declare function FourCC(id: "${rawcode}")`,
        );
      }
    }
  });

  it("gives the shared B000 no overload, and a constant in each of its two kinds", () => {
    expect(contents(OBJECTS_DECLARATIONS_FILE)).not.toContain('"B000"');
    expect(contents(CONSTANTS_FILES.buff)).toContain("HolyFire_B000");
    expect(contents(CONSTANTS_FILES.destructable)).toContain("Gate_B000");
  });

  it("names the constant of a non-ASCII name in ASCII", () => {
    expect(contents(CONSTANTS_FILES.unit)).toContain("ChevalierElu_h001");
  });

  it("reads the multi-level ability's three levels", () => {
    const model = createModel();
    readObjectData(FOLDER, ["ability"], model);
    // A000's entry in war3map.w3a: its Skin entry holds only its name.
    const ability = model.objectData
      .find((file) => file.name === "war3map.w3a")
      ?.custom.find((entry) => entry.custom === "A000");

    expect(
      ability?.sets[0]?.modifications
        .filter((modification) => modification.field === "amcs")
        .map(({ level, value }) => [level, value]),
    ).toEqual([
      [1, 80],
      [2, 100],
      [3, 120],
    ]);
  });

  it("type-checks every kind's constant and FourCC literal where its Natives take it, and nowhere else", () => {
    expect(diagnostics).toEqual([
      // A Custom doodad's constant is not a unit's Rawcode.
      "src/editor-objects-negative.ts:7 TS2345",
      // The Custom buff's constant of B000 is not a destructable's.
      "src/editor-objects-negative.ts:8 TS2345",
    ]);
  });

  it("looks each object up as known, by the name the map gives it", () => {
    const lookup = openRawcodeLookup({
      mapFolder: FOLDER,
      projectRoot: PACKAGE_ROOT,
    });

    for (const { rawcode, kind, origin, name, builtinName } of OBJECTS) {
      expect(lookup.lookup(rawcode), rawcode).toMatchObject({
        status: "known",
        objects: [
          { rawcode, kind, origin, name, ...(builtinName && { builtinName }) },
        ],
      });
    }
    expect(lookup.lookup("B000")).toMatchObject({
      status: "known",
      objects: [
        { kind: "buff", origin: "custom", name: "Holy Fire" },
        { kind: "destructable", origin: "custom", name: "Gate" },
      ],
    });
    expect(lookup.warnings()).toEqual([]);
  });
});
