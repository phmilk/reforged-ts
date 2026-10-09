/**
 * Seam 2: the package as a Map project consumes it. The package is packed
 * and installed into a temporary folder; fixture projects list the
 * workspace's `reforged-types/3.0.0` and `reforged-builtins/3.0.0` in
 * `types`, import `reforged-builtins/units`, and are compiled against the
 * committed 3.0.0 artefacts with TypeScript and with typescript-to-lua,
 * whose bundle runs on Lua 5.3 through reforged-test.
 */
import { mkdir, copyFile, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { join } from "node:path";
import { runLuaTestFiles } from "reforged-test";
import * as ts from "typescript";
import * as tstl from "typescript-to-lua";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createMapProject,
  createWorkspace,
  locate,
  normalize,
  typecheck,
  TYPES,
  TYPES_REVERSED,
  type Workspace,
} from "./support/map-project.js";

let workspace: Workspace;

beforeAll(async () => {
  workspace = await createWorkspace();
}, 60_000);

afterAll(async () => {
  await (workspace as Workspace | undefined)?.dispose();
});

/** The negative fixtures' errors, by code and line. */
const NEGATIVES = [
  // A Built-in ability's literal is not a unit's Rawcode.
  "src/ability-into-unit-create.ts:5 TS2345",
  // A unit's constant is not an ability's Rawcode.
  "src/constant-into-ability.ts:4 TS2345",
  // An item's constant is neither a unit's nor an upgrade's Rawcode.
  "src/item-into-tech.ts:4 TS2345",
  // A Built-in unit's literal is a unit's Rawcode, not an ability's.
  "src/literal-into-ability.ts:3 TS2345",
];

describe.each([
  ["the Typings first", "typings-first", TYPES],
  ["the package's overloads first", "builtins-first", TYPES_REVERSED],
])("a Map project with %s in types", (_, name, types) => {
  let program: ts.Program;
  let diagnostics: string[];

  beforeAll(async () => {
    const project = await createMapProject(workspace, name, "checked", types);
    const result = typecheck(project);
    program = result.program;
    diagnostics = result.diagnostics.map((d) => locate(project, d)).sort();
  }, 60_000);

  it("type-checks every kind's literals and constants where their kind is expected, an unknown literal anywhere, and typeId against a constant", () => {
    expect(diagnostics.filter((d) => d.startsWith("src/rawcodes.ts"))).toEqual(
      [],
    );
  });

  it("reports exactly the negative fixtures' errors, by code and line", () => {
    expect(diagnostics).toEqual(NEGATIVES);
  });

  it("infers a literal's kind, an array's and a constant's, and leaves an unknown literal UnknownRawcode", () => {
    const file = program
      .getSourceFiles()
      .find((f) => normalize(f.fileName).endsWith("/src/rawcodes.ts"));
    if (file === undefined) throw new Error("rawcodes.ts is not compiled");
    const checker = program.getTypeChecker();
    const typeOf = (name: string) => {
      const declaration = file.statements
        .filter(ts.isVariableStatement)
        .flatMap((statement) => statement.declarationList.declarations)
        .find((d) => d.name.getText(file) === name);
      if (declaration === undefined) throw new Error(`no ${name}`);
      return checker.typeToString(checker.getTypeAtLocation(declaration.name));
    };

    expect(typeOf("footman")).toBe('Rawcode<"unit">');
    expect(typeOf("army")).toBe('Rawcode<"unit">[]');
    expect(typeOf("constant")).toBe('Rawcode<"unit">');
    expect(typeOf("custom")).toBe("UnknownRawcode");
  });

  it("reads the package from the installed tarball: its overloads' entry and the declarations of the kinds imported", () => {
    const installed = normalize(workspace.installed);
    const files = program
      .getSourceFiles()
      .map((f) => normalize(f.fileName))
      .filter((f) => f.startsWith(installed + "/"))
      .map((f) => f.slice(installed.length))
      .sort();

    expect(files).toEqual([
      "/3.0.0.d.ts",
      "/3.0.0/abilities.d.ts",
      "/3.0.0/buffs.d.ts",
      "/3.0.0/destructables.d.ts",
      "/3.0.0/doodads.d.ts",
      "/3.0.0/items.d.ts",
      "/3.0.0/units.d.ts",
      "/3.0.0/upgrades.d.ts",
    ]);
  });
});

describe("a Map project bundled with typescript-to-lua for Lua 5.3", () => {
  let dir: string;
  let bundle: string;

  beforeAll(async () => {
    const project = await createMapProject(workspace, "lua", "lua", TYPES, {
      luaBundle: "bundle.lua",
      luaBundleEntry: "src/main.ts",
    });
    dir = project.dir;
    const emitted = new Map<string, string>();

    const result = tstl.transpileProject(
      project.tsconfig,
      {},
      (fileName, text) => {
        emitted.set(normalize(fileName), text);
      },
    );

    expect(result.diagnostics.map((d) => locate(project, d))).toEqual([]);
    const text = emitted.get(normalize(join(dir, "dist", "bundle.lua")));
    if (text === undefined) throw new Error("no bundle.lua");
    bundle = text;
  }, 60_000);

  it("holds the units' module from the newest Game version, and no other kind's", () => {
    const modules = [...bundle.matchAll(/^\["([^"]+)"\] = function/gm)].map(
      (match) => match[1],
    );

    expect(modules.sort()).toEqual([
      "lua_modules.reforged-builtins.3_0_0.units",
      "main",
    ]);
    expect(bundle).toContain("Footman_hfoo = 1751543663,");
  });

  it("calls FourCC with a literal and no self, whichever overload resolved", () => {
    expect(bundle).toContain('____exports.literal = FourCC("hfoo")');
  });

  it('runs on reforged-test, where Units.Footman_hfoo equals FourCC("hfoo")', async () => {
    const outDir = join(dir, "dist");
    const harness = join(outDir, "lua_modules", "reforged-test", "lua");
    await mkdir(harness, { recursive: true });
    await writeFile(join(outDir, "bundle.lua"), bundle);
    await copyFile(
      createRequire(import.meta.url).resolve("reforged-test/lua/index.lua"),
      join(harness, "index.lua"),
    );
    await writeFile(
      join(outDir, "bundle_test.lua"),
      await readFile(
        new URL("./fixtures/map-project/bundle_test.lua", import.meta.url),
        "utf8",
      ),
    );

    const file = runLuaTestFiles({ outDir }).at(0);

    expect(file?.error).toBeUndefined();
    expect(file?.tests).toEqual([
      {
        suite: ["the units' module"],
        name: "holds the Footman's Rawcode as FourCC gives it",
        status: "pass",
      },
    ]);
  });
});
