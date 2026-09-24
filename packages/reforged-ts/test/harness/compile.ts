// The global setup of the library's vitest project: compiles the library and
// its tests with typescript-to-lua (../tsconfig.json) before the first run
// and before every watch rerun, so `vitest run` and `vitest --watch` take the
// same path. A failed compile fails the run with its diagnostics.

import { rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { compileLuaProject } from "reforged-test";
import type { TestProject } from "vitest/node";

declare module "vitest" {
  export interface ProvidedContext {
    /** The output folder of the compile, where the glue finds the tests. */
    outDir: string;
    /** The typescript-to-lua errors of the last compile, or "" when none. */
    compileErrors: string;
  }
}

const tsconfig = fileURLToPath(new URL("../tsconfig.json", import.meta.url));

/** The outDir of ../tsconfig.json. */
const outDir = fileURLToPath(new URL("../../dist-test/", import.meta.url));

/**
 * Compiles the tests into an emptied outDir, so a deleted test leaves no
 * module behind, and returns the errors as text ("" when there are none).
 * typescript-to-lua's warnings do not fail the compile.
 */
function compile(): string {
  rmSync(outDir, { recursive: true, force: true });
  return compileLuaProject(tsconfig);
}

export default function setup(project: TestProject): void {
  project.provide("outDir", outDir);
  project.provide("compileErrors", compile());
  project.onTestsRerun((specifications) => {
    if (specifications.some((spec) => spec.project.name === project.name)) {
      project.provide("compileErrors", compile());
    }
  });
}
