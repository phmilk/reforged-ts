// The map folder the 3.0 World Editor saved (test/fixtures/editor-variables.w3m,
// its provenance in test/fixtures/editor-variables.md): one GUI variable of
// each object type the Variable Editor offers, plus `integer` and
// `ordercode`, scalar and array, with and without an initial value. Read
// through the entry point, as the Template runs it.

import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { runLuaTestFiles } from "reforged-test";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  DECLARATIONS_FILE,
  LUA_STUB_FILE,
  generateEditorGlobals,
  type EditorGlobalsOutput,
} from "../src/index.js";
import { WTG_FILE, readWtgVariables } from "../src/war3map-wtg.js";
import {
  fixtureMap,
  makeTempDir,
  removeTemporary,
} from "./support/map-folder.js";
import {
  FIXTURE_DECLARATIONS,
  createMapProject,
  readFixture,
  typecheck,
} from "./support/map-project.js";

afterAll(removeTemporary);

const FOLDER = fixtureMap("editor-variables.w3m");
const MAP_PROJECT = "editor-map-project";

/** The generated file of that name. */
function contents(output: EditorGlobalsOutput, name: string): string {
  const file = output.files.find((candidate) => candidate.name === name);
  if (file === undefined) throw new Error(`no ${name} generated`);
  return file.contents;
}

/**
 * The `declare let` statements of a declarations file, as name to type, in
 * order; a type Prettier wrapped over several lines is joined back.
 */
function declaredTypes(text: string): Record<string, string> {
  return Object.fromEntries(
    [...text.matchAll(/^declare let (\w+): ([^;]*);$/gm)].map((match) => [
      match[1],
      match[2].replace(/\s+/g, " ").replace(/< /g, "<").replace(/ >/g, ">"),
    ]),
  );
}

/**
 * Each variable family of the fixture: its name, its Variable Editor type,
 * the type it declares, and whether the fixture gives it an initial value.
 * An order has none: the 3.0 editor writes an order's initial value into the
 * script as a bare identifier, which fails its own script check.
 */
const FAMILIES: readonly {
  name: string;
  type: string;
  declared: string;
  initialized: boolean;
}[] = [
  {
    name: "UnitType",
    type: "unitcode",
    declared: 'Rawcode<"unit">',
    initialized: true,
  },
  {
    name: "ItemType",
    type: "itemcode",
    declared: 'Rawcode<"item">',
    initialized: true,
  },
  {
    name: "AbilityCode",
    type: "abilcode",
    declared: 'Rawcode<"ability">',
    initialized: true,
  },
  {
    name: "Buff",
    type: "buffcode",
    declared: 'Rawcode<"buff">',
    initialized: true,
  },
  {
    name: "DestructibleType",
    type: "destructablecode",
    declared: 'Rawcode<"destructable">',
    initialized: true,
  },
  {
    name: "TechType",
    type: "techcode",
    declared: 'Rawcode<"unit" | "upgrade">',
    initialized: true,
  },
  { name: "Order", type: "ordercode", declared: "number", initialized: false },
  { name: "Integer", type: "integer", declared: "number", initialized: true },
];

/** The fixture's variables: per family, the scalar, then the array, each without and with an initial value. */
const VARIABLES = FAMILIES.flatMap((family) =>
  [
    { suffix: "", array: false, initialized: false },
    { suffix: "Init", array: false, initialized: true },
    { suffix: "Array", array: true, initialized: false },
    { suffix: "ArrayInit", array: true, initialized: true },
  ]
    .filter((shape) => family.initialized || !shape.initialized)
    .map((shape) => ({
      name: family.name + shape.suffix,
      type: family.type,
      array: shape.array,
      declared: shape.array
        ? `Record<number, ${family.declared}>`
        : family.declared,
    })),
);

describe("the map folder saved by the 3.0 World Editor", () => {
  const output = generateEditorGlobals(FOLDER);
  const types = declaredTypes(contents(output, DECLARATIONS_FILE));
  const stub = contents(output, LUA_STUB_FILE);

  it("holds the variables in war3map.wtg as the editor wrote them", () => {
    const bytes = fs.readFileSync(path.join(FOLDER, WTG_FILE));
    expect(readWtgVariables(bytes)).toEqual(
      VARIABLES.map(({ name, type, array }) => ({
        name,
        type,
        array,
        arraySize: array ? 3 : 1,
      })),
    );
  });

  it("sets the initial values in war3map.lua's InitGlobals, which the reader never evaluates", () => {
    const lines = fs
      .readFileSync(path.join(FOLDER, "war3map.lua"), "utf8")
      .split("\r\n");
    expect(lines).toContain('udg_UnitTypeInit = FourCC("hfoo")');
    expect(lines).toContain('udg_TechTypeArrayInit[i] = FourCC("Rhme")');
    expect(lines).toContain("udg_IntegerInit = 7");
  });

  it("declares each variable with its Variable Editor type, scalar and array, with and without an initial value", () => {
    expect(types).toEqual({
      ...Object.fromEntries(
        VARIABLES.map(({ name, declared }) => [`udg_${name}`, declared]),
      ),
      gg_trg_Melee_Initialization: "trigger",
    });
  });

  it("reads it with no warning", () => {
    expect(output.warnings).toEqual([]);
  });

  it("declares the gg_ global of its trigger", () => {
    expect(types.gg_trg_Melee_Initialization).toBe("trigger");
  });

  it("stubs every global with its header literal, the initial values left out", () => {
    const assignments = stub
      .split("\n")
      .filter((line) => /^(gg|udg)_/.test(line));
    expect(assignments).toEqual([
      ...VARIABLES.map(
        ({ name, array }) => `udg_${name} = ${array ? "__jarray(0)" : "0"}`,
      ),
      "gg_trg_Melee_Initialization = nil",
    ]);
  });

  it("runs its stub in the reforged-test harness (Lua 5.3)", () => {
    const dir = makeTempDir();
    const stubFile = path.join(dir, LUA_STUB_FILE);
    fs.writeFileSync(stubFile, stub);
    const outDir = path.join(dir, "out");
    fs.mkdirSync(path.join(outDir, "lua_modules", "reforged-test", "lua"), {
      recursive: true,
    });
    fs.copyFileSync(
      createRequire(import.meta.url).resolve("reforged-test/lua/index.lua"),
      path.join(outDir, "lua_modules", "reforged-test", "lua", "index.lua"),
    );
    fs.writeFileSync(
      path.join(outDir, "stub_test.lua"),
      [
        'local t = require("lua_modules.reforged-test.lua.index")',
        't.describe("editor-saved globals", function()',
        '  t.it("has the header values", function()',
        "    t.expect(udg_UnitType).toBe(0)",
        "    t.expect(udg_UnitTypeInit).toBe(0)",
        "    t.expect(udg_UnitTypeArrayInit[2]).toBe(0)",
        "    t.expect(udg_Order).toBe(0)",
        "    t.expect(udg_OrderArray[1]).toBe(0)",
        "    t.expect(udg_IntegerInit).toBe(0)",
        "    t.expect(gg_trg_Melee_Initialization).toBe(nil)",
        "    udg_ItemTypeArray[1] = 1919251555",
        "    t.expect(udg_ItemTypeArray[1]).toBe(1919251555)",
        "    t.expect(udg_ItemTypeArray[2]).toBe(0)",
        "    t.expect(#t.stubCalls()).toBe(0)",
        "  end)",
        "end)",
        "",
      ].join("\n"),
    );

    const file = runLuaTestFiles({ outDir, stubs: [stubFile] }).at(0);

    expect(file?.error).toBeUndefined();
    expect(file?.tests).toEqual([
      {
        suite: ["editor-saved globals"],
        name: "has the header values",
        status: "pass",
      },
    ]);
  });
});

describe("the declarations generated from it in a Map project", () => {
  let diagnostics: string[];

  beforeAll(() => {
    diagnostics = typecheck(
      createMapProject(generateEditorGlobals(FOLDER).files, MAP_PROJECT),
    );
  }, 60_000);

  it("declare what the fixtures' editor-globals.d.ts declares", () => {
    expect(
      declaredTypes(contents(generateEditorGlobals(FOLDER), DECLARATIONS_FILE)),
    ).toEqual(declaredTypes(readFixture(FIXTURE_DECLARATIONS, MAP_PROJECT)));
  });

  it("type-check each variable into the Natives of its kind, with no cast", () => {
    expect(
      diagnostics.filter((d) => d.startsWith("src/editor-variables.ts")),
    ).toEqual([]);
  });

  it("reports exactly the negative fixtures' errors, by code and line", () => {
    expect(diagnostics).toEqual([
      // A buff's Rawcode is not an ability's.
      "src/buff-into-ability.ts:3 TS2345",
      // A plain number is not an item's Rawcode.
      "src/integer-into-item-type.ts:3 TS2322",
      // An order id is not a unit's Rawcode.
      "src/order-into-unit-type.ts:3 TS2345",
    ]);
  });
});
