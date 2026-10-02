// The global setup of the probe vitest project: compiles the Lua tests
// (../lua) with typescript-to-lua, builds the hello, failing, held and
// calibration Probes with the bridge fixtures' runId, and puts their bundles and the fixtures'
// lines next to the tests as Lua modules: `<probe>_bundle`, `bridge_fixture`
// (hello's, the table `{ finished = {...}, checkpoint = {...} }`) and
// `failing_fixture`. Before the
// first run and before every watch rerun; a failed compile or build fails
// the run of ../lua.spec.ts with its message.

import { copyFileSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { compileLuaProject } from "reforged-test";
import type { TestProject } from "vitest/node";
import { buildProbe } from "../../src/build.js";
import { AuthorError } from "../../src/errors.js";
import { PROBE_FOLDERS } from "../../src/folders.js";
import {
  BRIDGE_PROBE,
  BRIDGE_RUN_ID,
  FAILING_PROBE,
  bridgeLines,
  type BridgeFixture,
} from "./bridge.js";

/** The Probes whose bundles the Lua tests load, each as the module `<probe>_bundle`. */
const BUNDLED_PROBES = [BRIDGE_PROBE, FAILING_PROBE, "held", "calibration"];

declare module "vitest" {
  export interface ProvidedContext {
    /** The output folder of the Lua tests' compile, where the glue finds them. */
    luaOutDir: string;
    /** The errors of the last compile or build, or "" when none. */
    luaCompileErrors: string;
  }
}

const tsconfig = fileURLToPath(
  new URL("../lua/tsconfig.json", import.meta.url),
);

/** The outDir of ../lua/tsconfig.json. */
const outDir = fileURLToPath(
  new URL("../../.probe/lua-test/", import.meta.url),
);

function compile(): string {
  rmSync(outDir, { recursive: true, force: true });
  const errors = compileLuaProject(tsconfig);
  if (errors !== "") return errors;

  const dir = mkdtempSync(join(tmpdir(), "probe-lua-"));
  try {
    for (const probe of BUNDLED_PROBES) {
      const { bundleFile } = buildProbe(
        probe,
        { ...PROBE_FOLDERS, output: join(dir, "output"), state: dir },
        BRIDGE_RUN_ID,
      );
      copyFileSync(bundleFile, join(outDir, `${probe}_bundle.lua`));
    }
  } catch (error) {
    if (error instanceof AuthorError) return error.message;
    throw error;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
  writeFixture(
    "bridge_fixture",
    `{ finished = ${luaList("finished")}, checkpoint = ${luaList("checkpoint")} }`,
  );
  writeFixture("failing_fixture", luaList("failed"));
  return "";
}

/** The lines of a fixture as a Lua list. */
function luaList(fixture: BridgeFixture): string {
  // JSON strings of printable ASCII are Lua strings too.
  return `{ ${bridgeLines(fixture)
    .map((line) => JSON.stringify(line))
    .join(", ")} }`;
}

/** Writes the Lua module `module` next to the tests, which returns `value`. */
function writeFixture(module: string, value: string): void {
  writeFileSync(join(outDir, `${module}.lua`), `return ${value}\n`);
}

export default function setup(project: TestProject): void {
  project.provide("luaOutDir", outDir);
  project.provide("luaCompileErrors", compile());
  project.onTestsRerun((specifications) => {
    if (specifications.some((spec) => spec.project.name === project.name)) {
      project.provide("luaCompileErrors", compile());
    }
  });
}
