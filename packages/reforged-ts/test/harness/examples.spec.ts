// Hands the runnable examples to the reforged-test glue: one vitest describe
// per example under examples/harness/, each with the one test that runs it in
// a fresh Lua state (../examples/run.ts). The global setup (compile.ts) has
// compiled them and provides the folder.

import { runLuaTests } from "reforged-test";
import { inject } from "vitest";

const compileErrors = inject("examplesCompileErrors");
if (compileErrors !== "") {
  throw new Error(
    `typescript-to-lua failed to compile the examples:\n${compileErrors}`,
  );
}

runLuaTests({ outDir: inject("examplesOutDir") });
