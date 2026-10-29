// The files generateObjects writes, in a Map project (#583): type-checked
// against the workspace's reforged-types and reforged-ts with the fixtures
// under test/fixtures/objects-map-project, and the constants module compiled
// with typescript-to-lua and run on reforged-test's harness.

import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { runLuaTestFiles } from "reforged-test";
import * as ts from "typescript";
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

/** The map folder of the fixtures: the Custom unit Captain (`h000`), named in the Skin file, the Custom ability Frost Storm (`A000`) and the Custom item Blade (`I000`). */
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
      "war3map.w3a": buildObjectData({
        levels: true,
        custom: [
          {
            original: "AHbz",
            custom: "A000",
            modifications: [{ field: "anam", value: "Frost Storm" }],
          },
        ],
      }),
      "war3map.w3t": buildObjectData({
        custom: [
          {
            original: "ratf",
            custom: "I000",
            modifications: [{ field: "unam", value: "Blade" }],
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

  // Measured 6.5 s with pnpm test on Linux (WSL 2, 8 threads), 2026-10: the
  // windows leg's report carries no hook duration.
  beforeAll(() => {
    output = generate();
    tsconfig = createMapProject(output.files, FIXTURES);
    diagnostics = typecheck(tsconfig);
  }, 60_000);

  it("are the files the fixtures stand in for", () => {
    expect(output.warnings).toEqual([]);
    for (const name of [
      OBJECTS_DECLARATIONS_FILE,
      CONSTANTS_FILES.unit,
      CONSTANTS_FILES.item,
      CONSTANTS_FILES.ability,
    ]) {
      expect(output.files.find((f) => f.name === name)?.contents, name).toBe(
        readFixture(name, FIXTURES),
      );
    }
  });

  it("type-check a Custom unit's constant and its FourCC literal into Unit.create and CreateUnit, and a Custom ability's into UnitAddAbility, with no cast", () => {
    expect(
      diagnostics.filter(
        (d) =>
          d.startsWith("src/custom-units-into-unit-create.ts") ||
          d.startsWith("src/custom-ability-into-unit-add-ability.ts"),
      ),
    ).toEqual([]);
  });

  it("reports exactly the negative fixtures' errors, by code and line", () => {
    expect(diagnostics).toEqual([
      // A Custom item's constant is not a unit's Rawcode.
      "src/custom-item-into-unit.ts:7 TS2345",
      // A Custom unit's constant is not an ability's Rawcode.
      "src/custom-unit-into-ability.ts:6 TS2345",
      // Nor is a Custom unit's FourCC literal an ability's.
      "src/literal-into-ability.ts:4 TS2345",
    ]);
  });

  // Measured 1.5 s with pnpm test on the windows CI leg of #815, 3.9 s on Linux
  // (WSL 2, 8 threads), 2026-10.
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
  }, 30_000);
});

const MODIFIED_FIXTURES = "modified-map-project";

/** The map folder of the modified fixtures: the Footman renamed Militia, and B000 both a Custom buff, Holy Fire, and a Custom destructable, Gate. */
function generateModified(): ObjectsOutput {
  return generateObjects(
    mapFolder({
      "war3map.w3u": buildObjectData({
        original: [
          {
            original: "hfoo",
            modifications: [{ field: "unam", value: "Militia" }],
          },
        ],
      }),
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
    }),
    { projectRoot: PACKAGE_ROOT },
  );
}

describe("a modified Built-in object and a shared Rawcode in a Map project with reforged-builtins' overloads turned on (#586)", () => {
  let output: ObjectsOutput;
  let tsconfig: string;

  // Measured 0.1 s with pnpm test on Linux (WSL 2, 8 threads), 2026-10: the
  // windows leg's report carries no hook duration.
  beforeAll(() => {
    output = generateModified();
    tsconfig = createMapProject(output.files, MODIFIED_FIXTURES, {
      builtins: true,
    });
  }, 30_000);

  it("are the files the fixtures stand in for", () => {
    expect(output.warnings).toEqual([]);
    for (const name of [
      OBJECTS_DECLARATIONS_FILE,
      CONSTANTS_FILES.buff,
      CONSTANTS_FILES.destructable,
    ]) {
      expect(output.files.find((f) => f.name === name)?.contents, name).toBe(
        readFixture(name, MODIFIED_FIXTURES),
      );
    }
  });

  it("resolve the modified Footman's FourCC literal to the map's overload, which precedes reforged-builtins'", () => {
    const { program, checker } = checkedProgram(tsconfig);
    const source = program
      .getSourceFiles()
      .find((f) => f.fileName.endsWith("/src/modified-footman.ts"));
    if (source === undefined) throw new Error("no modified-footman.ts");
    const call = findCall(source, "FourCC");
    // reforged-builtins' overloads are in the program, its hfoo among them.
    expect(
      program
        .getSourceFiles()
        .find((f) => f.fileName.endsWith("/reforged-builtins/3.0.1.d.ts"))
        ?.text,
    ).toContain('declare function FourCC(id: "hfoo"): Rawcode<"unit">;');

    const declaration = checker.getResolvedSignature(call)?.declaration;

    expect(
      path.relative(
        path.dirname(tsconfig),
        path.resolve(declaration?.getSourceFile().fileName ?? ""),
      ),
    ).toBe(path.join("src", OBJECTS_DECLARATIONS_FILE));
    expect(
      ts.displayPartsToString(
        checker.getResolvedSignature(call)?.getDocumentationComment(checker),
      ),
    ).toContain("named Militia in this map");
  });

  // Starts tsc on the project. Measured 1.3 s with pnpm test on the windows
  // CI leg of #815, 2.2 s on Linux (WSL 2, 8 threads) alone and past the
  // default 5 s in a full pnpm test there, 2026-10.
  it("type-check each constant of B000 where its kind is expected and its literal anywhere, and report the buff's constant where a destructable's is expected", () => {
    expect(typecheck(tsconfig)).toEqual([
      "src/buff-into-destructable.ts:5 TS2345",
    ]);
  }, 30_000);
});

/** The program of a Map project's tsconfig.json, and its checker. */
function checkedProgram(tsconfigPath: string): {
  program: ts.Program;
  checker: ts.TypeChecker;
} {
  const config = ts.getParsedCommandLineOfConfigFile(
    tsconfigPath,
    { noEmit: true },
    {
      ...ts.sys,
      onUnRecoverableConfigFileDiagnostic: (diagnostic) => {
        throw new Error(
          ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"),
        );
      },
    },
  );
  if (config === undefined)
    throw new Error(`${tsconfigPath} could not be read`);
  const program = ts.createProgram({
    rootNames: config.fileNames,
    options: config.options,
  });
  return { program, checker: program.getTypeChecker() };
}

/** The first call of `name` in `source`. */
function findCall(source: ts.SourceFile, name: string): ts.CallExpression {
  let found: ts.CallExpression | undefined;
  const visit = (node: ts.Node): void => {
    if (
      found === undefined &&
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === name
    ) {
      found = node;
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  if (found === undefined) throw new Error(`no call of ${name}`);
  return found;
}
