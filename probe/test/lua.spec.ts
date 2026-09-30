// Hands the Lua tests of the runner's in-game module to the reforged-test
// glue: one vitest describe per test file, one test per it. The global setup
// (support/lua-setup.ts) has compiled them and provides the folder.

import { runLuaTests } from "reforged-test";
import { inject } from "vitest";

const compileErrors = inject("luaCompileErrors");
if (compileErrors !== "") {
  throw new Error(`The Lua tests could not be built:\n${compileErrors}`);
}

runLuaTests({ outDir: inject("luaOutDir") });
