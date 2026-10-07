/**
 * Seam 2: the package as a Map project consumes it. The package is packed
 * and installed into a temporary folder; fixture projects list it in
 * `types` next to the workspace's `reforged-types/3.0.0`, in both orders,
 * and are type-checked against the committed 3.0.0 artefacts. A fixture that
 * imports `reforged-builtins/units` is bundled by typescript-to-lua and run
 * on Lua 5.3 through reforged-test.
 */
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { runLuaTestFiles, type LuaTestFile } from "reforged-test";
import * as ts from "typescript";
import * as tstl from "typescript-to-lua";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  BUILTINS_FIRST,
  createMapProject,
  createWorkspace,
  locate,
  normalize,
  TYPES_FIRST,
  typecheck,
  type MapProject,
  type Workspace,
} from "./support/map-project.js";

let workspace: Workspace;

beforeAll(async () => {
  workspace = await createWorkspace();
}, 60_000);

afterAll(async () => {
  await (workspace as Workspace | undefined)?.dispose();
});

describe("the packed package", () => {
  it("ships the overloads, the units' declarations and Lua and the index, and nothing of the generator or the provenance", () => {
    expect(workspace.packed).toEqual([
      "3.0.0.d.ts",
      "3.0.0/index.json",
      "3.0.0/units.d.ts",
      "3.0.0/units.lua",
      "LICENSE",
      "README.md",
      "package.json",
    ]);
  });
});

describe.each([
  ["the Typings first", "typings-first", TYPES_FIRST],
  ["reforged-builtins first", "builtins-first", BUILTINS_FIRST],
])("a Map project listing %s in types", (_, name, types) => {
  let project: MapProject;
  let program: ts.Program;
  let diagnostics: string[];

  beforeAll(async () => {
    project = await createMapProject(workspace, name, "checked", types);
    const result = typecheck(project);
    program = result.program;
    diagnostics = result.diagnostics.map((d) => locate(project, d));
  }, 60_000);

  it("reads the overloads and the constants from the installed package", () => {
    const files = program
      .getSourceFiles()
      .map((file) => normalize(file.fileName))
      .filter((file) => file.startsWith(normalize(workspace.installed) + "/"))
      .map((file) => file.slice(normalize(workspace.installed).length));

    expect(files.sort()).toEqual(["/3.0.0.d.ts", "/3.0.0/units.d.ts"]);
  });

  it("type-checks literals and constants into CreateUnit and Unit.create, typeId against a constant and an unknown literal everywhere", () => {
    expect(diagnostics.filter((d) => d.startsWith("src/builtins.ts"))).toEqual(
      [],
    );
  });

  it("narrows a literal, an inferred const and an array to the unit kind, and leaves an unknown literal UnknownRawcode", () => {
    const file = program.getSourceFile(join(project.dir, "src", "builtins.ts"));
    if (file === undefined)
      throw new Error("builtins.ts is not in the program");
    const checker = program.getTypeChecker();
    const typeOf = (variable: string) => {
      const declaration = file.statements
        .filter(ts.isVariableStatement)
        .flatMap((statement) => statement.declarationList.declarations)
        .find((d) => d.name.getText(file) === variable);
      if (declaration === undefined) throw new Error(`no ${variable}`);
      return checker.typeToString(checker.getTypeAtLocation(declaration.name));
    };

    expect(typeOf("footman")).toBe('Rawcode<"unit">');
    expect(typeOf("spawns")).toBe('Rawcode<"unit">[]');
    expect(typeOf("constant")).toBe('Rawcode<"unit">');
    expect(typeOf("custom")).toBe("UnknownRawcode");
  });

  it("reports exactly the negative fixtures' errors, by code and line", () => {
    expect(diagnostics.sort()).toEqual([
      // A unit's constant is not an ability's Rawcode.
      "src/constant-into-ability.ts:4 TS2345",
      // A Built-in unit's literal is not an ability's Rawcode either.
      "src/literal-into-ability.ts:3 TS2345",
    ]);
  });
});

describe("a typescript-to-lua bundle of a fixture that imports reforged-builtins/units", () => {
  let bundle: string;
  let results: LuaTestFile[];

  beforeAll(async () => {
    const project = await createMapProject(
      workspace,
      "lua",
      "lua",
      TYPES_FIRST,
      { luaBundle: "units_test.lua", luaBundleEntry: "src/units.test.ts" },
    );
    const result = tstl.transpileProject(project.tsconfig);
    const errors = result.diagnostics.filter(
      (d) => d.category === ts.DiagnosticCategory.Error,
    );
    expect(errors.map((d) => locate(project, d))).toEqual([]);
    const outDir = join(project.dir, "dist");
    bundle = await readFile(join(outDir, "units_test.lua"), "utf8");
    results = runLuaTestFiles({ outDir });
  }, 60_000);

  it("holds the units' module, and no other module of the package", () => {
    const modules = [...bundle.matchAll(/^\["([^"]+)"\] = function/gm)].map(
      (match) => match[1],
    );

    expect(
      modules.filter((module) => module.includes("reforged-builtins")),
    ).toEqual(["lua_modules.reforged-builtins.3_0_0.units"]);
    expect(bundle).toContain(`  Footman_hfoo = ${String(0x68666f6f)},`);
  });

  it("calls FourCC through the overloads with no context argument", () => {
    expect(bundle).toContain('FourCC("hfoo")');
    expect(bundle).not.toMatch(/FourCC\(\s*(?:nil|_G)\s*,/);
  });

  it('runs on Lua 5.3, where Units.Footman_hfoo equals FourCC("hfoo")', () => {
    expect(results).toEqual([
      {
        moduleName: "units_test",
        testFile: "units.test.ts",
        tests: [
          {
            suite: ["reforged-builtins/units"],
            name: "holds the integer FourCC gives for each Rawcode",
            status: "pass",
          },
        ],
      },
    ]);
  });
});
