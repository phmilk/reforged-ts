// The global setup of the library's vitest project: compiles the library and
// its tests with typescript-to-lua (../tsconfig.json), and the examples with
// the library (../examples/tsconfig.json), before the first run and before
// every watch rerun, so `vitest run` and `vitest --watch` take the same path.
// A failed compile fails the run of its spec with its diagnostics.

import { readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { compileLuaProject } from "reforged-test";
import type { TestProject } from "vitest/node";

declare module "vitest" {
  export interface ProvidedContext {
    /** The output folder of the compile, where the glue finds the tests. */
    outDir: string;
    /** The typescript-to-lua errors of the last compile, or "" when none. */
    compileErrors: string;
    /** The output folder of the examples' compile. */
    examplesOutDir: string;
    /** The typescript-to-lua errors of the examples' last compile, or "". */
    examplesCompileErrors: string;
  }
}

const tsconfig = fileURLToPath(new URL("../tsconfig.json", import.meta.url));

/** The outDir of ../tsconfig.json. */
const outDir = fileURLToPath(new URL("../../dist-test/", import.meta.url));

const examplesTsconfig = fileURLToPath(
  new URL("../examples/tsconfig.json", import.meta.url),
);

/** The outDir of ../examples/tsconfig.json. */
const examplesOutDir = fileURLToPath(
  new URL("../../dist-examples/", import.meta.url),
);

/** Where the runnable examples are emitted, and their module names' prefix. */
const RUNNABLE = "examples/harness";

/**
 * Compiles the tests into an emptied outDir, so a deleted test leaves no
 * module behind, and returns the errors as text ("" when there are none).
 * typescript-to-lua's warnings do not fail the compile.
 */
function compile(): string {
  rmSync(outDir, { recursive: true, force: true });
  return compileLuaProject(tsconfig);
}

/**
 * Compiles the examples as `compile` does the tests, then writes one test
 * module per runnable example next to it (`file-write-read_test.lua`), which
 * registers the one test of ../examples/run.ts for the example. The glue
 * runs each test module in a fresh Lua state.
 */
function compileExamples(): string {
  rmSync(examplesOutDir, { recursive: true, force: true });
  const errors = compileLuaProject(examplesTsconfig);
  if (errors !== "") {
    return errors;
  }
  const runnable = join(examplesOutDir, RUNNABLE);
  for (const file of readdirSync(runnable)) {
    if (!file.endsWith(".lua")) {
      continue;
    }
    const name = file.slice(0, -".lua".length);
    const example = `${RUNNABLE.replaceAll("/", ".")}.${name}`;
    writeFileSync(
      join(runnable, `${name}_test.lua`),
      `require("test.examples.run").runExample(${JSON.stringify(example)})
`,
    );
  }
  return "";
}

export default function setup(project: TestProject): void {
  project.provide("outDir", outDir);
  project.provide("compileErrors", compile());
  project.provide("examplesOutDir", examplesOutDir);
  project.provide("examplesCompileErrors", compileExamples());
  project.onTestsRerun((specifications) => {
    if (specifications.some((spec) => spec.project.name === project.name)) {
      project.provide("compileErrors", compile());
      project.provide("examplesCompileErrors", compileExamples());
    }
  });
}
