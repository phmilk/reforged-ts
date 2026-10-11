// The files generateObjects writes, in a Map project (#583): type-checked
// against the workspace's reforged-types and reforged-ts with the fixtures
// under test/fixtures/objects-map-project, and the constants module compiled
// with typescript-to-lua and run on reforged-test's harness.

import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { runLuaTestFiles } from "reforged-test";
import * as tstl from "typescript-to-lua";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  CONSTANTS_FILES,
  OBJECTS_DECLARATIONS_FILE,
  generateObjects,
  type ObjectsOutput,
} from "../src/index.js";
import {
  PACKAGE_ROOT,
  makeTempDir,
  mapFolder,
  removeTemporary,
} from "./support/map-folder.js";
import {
  createMapProject,
  readFixture,
  typecheck,
} from "./support/map-project.js";
import { buildObjectData, buildWts } from "./support/object-data.js";

afterAll(removeTemporary);

const FIXTURES = "objects-map-project";

/** The map folder of the fixtures: the Custom unit Captain (`h000`), named in the Skin file. */
function generate(): ObjectsOutput {
  return generateObjects(
    mapFolder({
      "war3map.w3u": buildObjectData({
        custom: [{ original: "hfoo", custom: "h000" }],
      }),
      "war3mapSkin.w3u": buildObjectData({
        custom: [
          {
            original: "hfoo",
            custom: "h000",
            modifications: [{ field: "unam", value: "TRIGSTR_001" }],
          },
        ],
      }),
      "war3map.wts": buildWts({ 1: "Captain" }),
    }),
    { projectRoot: PACKAGE_ROOT },
  );
}

describe("the generated objects in a Map project", () => {
  let output: ObjectsOutput;
  let tsconfig: string;
  let diagnostics: string[];

  beforeAll(() => {
    output = generate();
    tsconfig = createMapProject(output.files, FIXTURES);
    diagnostics = typecheck(tsconfig);
  }, 60_000);

  it("are the files the fixtures stand in for", () => {
    expect(output.warnings).toEqual([]);
    for (const name of [OBJECTS_DECLARATIONS_FILE, CONSTANTS_FILES.unit]) {
      expect(output.files.find((f) => f.name === name)?.contents, name).toBe(
        readFixture(name, FIXTURES),
      );
    }
  });

  it("type-check a Custom unit's constant and its FourCC literal into Unit.create and CreateUnit, with no cast", () => {
    expect(
      diagnostics.filter((d) =>
        d.startsWith("src/custom-units-into-unit-create.ts"),
      ),
    ).toEqual([]);
  });

  it("reports exactly the negative fixtures' errors, by code and line", () => {
    expect(diagnostics).toEqual([
      // A Custom unit's constant is not an ability's Rawcode.
      "src/custom-unit-into-ability.ts:6 TS2345",
      // Nor is its FourCC literal.
      "src/literal-into-ability.ts:4 TS2345",
    ]);
  });

  it('compile the constants to an integer, equal to FourCC("h000") on reforged-test (Lua 5.3)', () => {
    const emitted = new Map<string, string>();
    tstl.transpileProject(
      tsconfig,
      { luaTarget: tstl.LuaTarget.Lua53 },
      (fileName, text) => {
        emitted.set(path.basename(fileName), text);
      },
    );
    const lua = emitted.get("custom-units.lua");
    if (lua === undefined) throw new Error("no custom-units.lua");

    const outDir = path.join(makeTempDir(), "out");
    const harness = path.join(outDir, "lua_modules", "reforged-test", "lua");
    fs.mkdirSync(harness, { recursive: true });
    fs.copyFileSync(
      createRequire(import.meta.url).resolve("reforged-test/lua/index.lua"),
      path.join(harness, "index.lua"),
    );
    fs.writeFileSync(path.join(outDir, "custom-units.lua"), lua);
    fs.writeFileSync(
      path.join(outDir, "custom_units_test.lua"),
      [
        'local t = require("lua_modules.reforged-test.lua.index")',
        'local CustomUnits = require("custom-units").CustomUnits',
        't.describe("the CustomUnits module", function()',
        '  t.it("holds the Captain\'s Rawcode as FourCC gives it", function()',
        '    t.expect(math.type(CustomUnits.Captain_h000)).toBe("integer")',
        '    t.expect(CustomUnits.Captain_h000).toBe(FourCC("h000"))',
        "  end)",
        "end)",
        "",
      ].join("\n"),
    );

    const file = runLuaTestFiles({ outDir }).at(0);

    expect(file?.error).toBeUndefined();
    expect(file?.tests).toEqual([
      {
        suite: ["the CustomUnits module"],
        name: "holds the Captain's Rawcode as FourCC gives it",
        status: "pass",
      },
    ]);
  });
});
