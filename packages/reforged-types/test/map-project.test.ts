/**
 * Seam 2: the package as a Map project consumes it. The package is packed and
 * installed into a temporary folder; fixture projects list it in `types`
 * exactly as the Template will, and are compiled with TypeScript (the
 * `tsc --noEmit` program) and with typescript-to-lua for Lua 5.3.
 */
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import * as ts from "typescript";
import * as tstl from "typescript-to-lua";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  AI_TYPES,
  TEMPLATE_TYPES,
  createMapProject,
  createWorkspace,
  locate,
  normalize,
  packageRoot,
  readFixture,
  typecheck,
  type MapProject,
  type Workspace,
} from "./support/map-project.js";
import { required } from "./support/fixture.js";

let workspace: Workspace;

beforeAll(async () => {
  workspace = await createWorkspace();
}, 60_000);

afterAll(async () => {
  await (workspace as Workspace | undefined)?.dispose();
});

describe("a Map project with the Template's types", () => {
  let project: MapProject;
  let program: ts.Program;
  let diagnostics: string[];

  beforeAll(async () => {
    project = await createMapProject(workspace, "checked", TEMPLATE_TYPES);
    const result = typecheck(project);
    program = result.program;
    diagnostics = result.diagnostics.map((d) => locate(project, d));
  }, 60_000);

  it("reads the Typings from the installed package, never from this package's sources", () => {
    const typings = program
      .getSourceFiles()
      .map((file) => normalize(file.fileName))
      .filter((name) => name.includes("/reforged-types/"));

    expect(typings.length).toBeGreaterThan(0);
    for (const name of typings) {
      expect(name.startsWith(normalize(workspace.installed) + "/")).toBe(true);
      expect(name.startsWith(normalize(packageRoot) + "/")).toBe(false);
    }
    expect(
      typings.map((name) => name.slice(normalize(workspace.installed).length)),
    ).toEqual(
      expect.arrayContaining([
        "/3.0.0.d.ts",
        "/lua-runtime.d.ts",
        "/3.0.0/common.j.d.ts",
        "/3.0.0/blizzard.j.d.ts",
      ]),
    );
    expect(typings).not.toContain(
      normalize(join(workspace.installed, "3.0.0", "common.ai.d.ts")),
    );
  });

  it("gets lua-types as a dependency of the installed package", async () => {
    const manifest = JSON.parse(
      await readFile(join(workspace.installed, "package.json"), "utf8"),
    ) as { dependencies?: Record<string, string> };

    expect(Object.keys(manifest.dependencies ?? {})).toContain("lua-types");
  });

  it("type-checks handle types, omitted optional parameters, Filter and bj_ arrays", () => {
    expect(diagnostics.filter((d) => d.startsWith("src/handles.ts"))).toEqual(
      [],
    );
  });

  it("reports exactly the negative fixtures' errors, by code and line", () => {
    expect(diagnostics.sort()).toEqual([
      // GetMinesOwned is declared by common.ai only.
      "src/ai-without-path.ts:2 TS2304",
      // unit | undefined is not assignable to unit.
      "src/nullable-return.ts:2 TS2322",
      // A removed Native is not declared at all.
      "src/removed-native.ts:2 TS2304",
      // timer is not assignable to unit.
      "src/timer-as-unit.ts:3 TS2345",
    ]);
  });
});

describe("a Map project that adds the common.ai path", () => {
  it("type-checks calls to the AI natives with zero diagnostics", async () => {
    const project = await createMapProject(workspace, "ai", AI_TYPES);

    const { diagnostics } = typecheck(project);

    expect(diagnostics.map((d) => locate(project, d))).toEqual([]);
  }, 60_000);
});

describe("a Map project compiled with typescript-to-lua for Lua 5.3", () => {
  let source: string;
  let lua: string;

  beforeAll(async () => {
    source = await readFixture("lua", "callbacks.ts");
    const project = await createMapProject(workspace, "lua", TEMPLATE_TYPES);
    const emitted = new Map<string, string>();

    const result = tstl.transpileProject(
      project.tsconfig,
      {},
      (fileName, text) => {
        emitted.set(normalize(fileName), text);
      },
    );

    expect(result.diagnostics.map((d) => locate(project, d))).toEqual([]);
    const emittedLua = emitted.get(
      normalize(join(project.dir, "dist", "callbacks.lua")),
    );
    expect(emittedLua).toBeDefined();
    // One space for every run of whitespace: the assertions below do not
    // depend on how typescript-to-lua breaks long calls over lines.
    lua = required(emittedLua, "callbacks.lua").replace(/\s+/g, " ");
  }, 60_000);

  it("compiles a fixture that has no @noSelfInFile of its own", () => {
    expect(source).not.toContain("@noSelf");
  });

  it("emits the callbacks passed to TimerStart and Filter without a self parameter", () => {
    expect(lua).toContain(
      "TimerStart( ticker, 0.03, true, function() PauseTimer(ticker) end )",
    );
    expect(lua).toContain(
      "Filter(function() return GetFilterUnit() ~= nil end)",
    );
  });

  it("calls the Natives with a dot: no colon, no context argument", () => {
    expect(lua).toContain("local ticker = CreateTimer()");
    expect(lua).toContain("local nearby = CreateGroup()");
    expect(lua).toContain("GroupEnumUnitsInRange( nearby, 0, 0, 256, Filter(");
    expect(lua).toContain("DestroyTimer(ticker)");
    expect(lua).not.toMatch(/\w:\w+\(/);
  });

  it("keeps self where the Typings are not involved (the control)", () => {
    expect(lua).toContain(
      "registerLocal( nil, function(self) DestroyTimer(ticker) end )",
    );
  });
});
