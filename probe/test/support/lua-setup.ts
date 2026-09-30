// The global setup of the probe vitest project: compiles the Lua tests
// (../lua) with typescript-to-lua, builds the hello Probe with the bridge
// fixture's runId, and puts its bundle and the fixture's lines next to the
// tests as the Lua modules `hello_bundle` and `bridge_fixture`. Before the
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
import { BRIDGE_PROBE, BRIDGE_RUN_ID, bridgeLines } from "./bridge.js";

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
  let bundleFile: string;
  try {
    ({ bundleFile } = buildProbe(
      BRIDGE_PROBE,
      { ...PROBE_FOLDERS, output: join(dir, "output"), state: dir },
      BRIDGE_RUN_ID,
    ));
  } catch (error) {
    if (error instanceof AuthorError) return error.message;
    throw error;
  }
  copyFileSync(bundleFile, join(outDir, `${BRIDGE_PROBE}_bundle.lua`));
  // JSON strings of printable ASCII are Lua strings too.
  writeFileSync(
    join(outDir, "bridge_fixture.lua"),
    `return { ${bridgeLines()
      .map((line) => JSON.stringify(line))
      .join(", ")} }\n`,
  );
  rmSync(dir, { recursive: true, force: true });
  return "";
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
