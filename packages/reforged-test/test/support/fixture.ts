// Fixture folders are hand-written Lua standing in for typescript-to-lua
// output. A test copies one into a temporary outDir and adds the compiled
// entry points where typescript-to-lua puts a dependency's Lua for a Map
// project (lua_modules/reforged-test/lua/index.lua and
// lua_modules/reforged-test/map/index.lua), so the fixtures require them as
// a compiled test would.

import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const RUNNER_MODULE = "lua_modules.reforged-test.lua.index";

const fixtures = fileURLToPath(new URL("../fixtures/", import.meta.url));
const runner = fileURLToPath(new URL("../../lua/index.lua", import.meta.url));
const map = fileURLToPath(new URL("../../map/index.lua", import.meta.url));

// The require the map entry point is compiled with, by its path in the
// package, and the one typescript-to-lua rewrites it to in a Map project.
const PACKAGE_REQUIRE = 'require("lua.index")';
const PROJECT_REQUIRE = `require("${RUNNER_MODULE}")`;

/** The map entry point's Lua as a Map project's build emits it. */
function mapEntryPoint(): string {
  const source = readFileSync(map, "utf8");
  if (!source.includes(PACKAGE_REQUIRE)) {
    throw new Error(`map/index.lua no longer holds ${PACKAGE_REQUIRE}`);
  }
  return source.replace(PACKAGE_REQUIRE, PROJECT_REQUIRE);
}

/** The path of a fixture file (an extra stub file, for instance). */
export function fixturePath(...parts: string[]): string {
  return join(fixtures, ...parts);
}

const created: string[] = [];

/** A temporary outDir holding the named fixture folders and the entry points. */
export function outDir(...names: string[]): string {
  const dir = mkdtempSync(join(tmpdir(), "reforged-test-"));
  created.push(dir);
  for (const name of names) {
    cpSync(join(fixtures, name), dir, { recursive: true });
  }
  cpSync(runner, join(dir, "lua_modules", "reforged-test", "lua", "index.lua"));
  const mapFile = join(dir, "lua_modules", "reforged-test", "map", "index.lua");
  mkdirSync(dirname(mapFile), { recursive: true });
  writeFileSync(mapFile, mapEntryPoint());
  return dir;
}

/** Deletes every outDir this test file created; pass it to afterAll. */
export function removeOutDirs(): void {
  for (const dir of created.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
}
