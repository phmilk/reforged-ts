// Hands the library's compiled tests to the reforged-test glue: one vitest
// describe per test file, named after its TypeScript file, one test per it.
// The global setup (compile.ts) has compiled them and provides the folder.

import { runLuaTests } from "reforged-test";
import { inject } from "vitest";

const compileErrors = inject("compileErrors");
if (compileErrors !== "") {
  throw new Error(
    `typescript-to-lua failed to compile the tests:\n${compileErrors}`,
  );
}

runLuaTests({ outDir: inject("outDir") });
