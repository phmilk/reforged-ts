// Fixture folders are hand-written Lua standing in for typescript-to-lua
// output. A test copies one into a temporary outDir and adds the compiled
// runner where typescript-to-lua puts a dependency's Lua for a Map project
// (lua_modules/reforged-test/lua/index.lua), so the fixtures require it as
// a compiled test would.

import { cpSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

export const RUNNER_MODULE = "lua_modules.reforged-test.lua.index";

const fixtures = fileURLToPath(new URL("../fixtures/", import.meta.url));
const runner = fileURLToPath(new URL("../../lua/index.lua", import.meta.url));

/** The path of a fixture file (a consumer stub, for instance). */
export function fixturePath(...parts: string[]): string {
  return join(fixtures, ...parts);
}

const created: string[] = [];

/** A temporary outDir holding the named fixture folders and the runner. */
export function outDir(...names: string[]): string {
  const dir = mkdtempSync(join(tmpdir(), "reforged-test-"));
  created.push(dir);
  for (const name of names) {
    cpSync(join(fixtures, name), dir, { recursive: true });
  }
  cpSync(runner, join(dir, "lua_modules", "reforged-test", "lua", "index.lua"));
  return dir;
}

/** Deletes every outDir this test file created; pass it to afterAll. */
export function removeOutDirs(): void {
  for (const dir of created.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
}
