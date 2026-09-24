// One Lua 5.3 state per compiled test file, on lua-wasm-bindings.
//
// Every call into the VM that can raise goes through lua_pcall, so a Lua
// error comes back as a status code and a message on the stack; it never
// reaches emscripten's uncaught-exception handler as a JavaScript exception.

import { createRequire } from "node:module";
import type * as Lua53 from "lua-wasm-bindings/dist/lua.53.js";
import type { LuaState } from "lua-wasm-bindings/dist/lua.js";

const LUA_OK = 0;
const LUA_TNUMBER = 3;
const LUA_TSTRING = 4;
const LUA_TFUNCTION = 6;

// Stack slots a state holds for its whole life, captured before any stub
// runs, so a stub that removes `load` or `tostring` (the game has no `load`)
// does not break the glue.
const APPEND = 1;
const LOAD = 2;
const TOSTRING = 3;
const PRELOAD = 4;

// emscripten passes a string argument on its 5 MB wasm stack at up to four
// bytes per character, so a source goes into the state in pieces that the
// loader below joins before compiling it under its chunk name.
const PIECE_LENGTH = 256 * 1024;
const LOADER = `
local load, concat, pieces = load, table.concat, {}
local function append(piece) pieces[#pieces + 1] = piece end
local function loadPieces(name)
  local source = concat(pieces)
  pieces = {}
  return load(source, name, "t")
end
return append, loadPieces
`;

type Bindings = typeof Lua53;

let bindings: Bindings | undefined;

/** lua-wasm-bindings at the Lua 5.3.6 build, loaded once per process. */
function vm(): Bindings {
  bindings ??= createRequire(import.meta.url)(
    "lua-wasm-bindings/dist/lua.53.js",
  ) as Bindings;
  return bindings;
}

/** Lua source with the name its error messages show. */
export interface Chunk {
  readonly name: string;
  readonly source: string;
}

/** A Lua module preloaded under the name `require` looks it up by. */
export interface LuaModule {
  readonly moduleName: string;
  readonly chunk: Chunk;
}

/** An error raised inside the Lua VM, carrying the Lua message only. */
export class LuaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LuaError";
  }
}

/** The global the runner defines; calling it runs the tests, returns JSON. */
export const RUN_GLOBAL = "__reforged_test_run";

/**
 * Runs one test module in a fresh state: the standard libraries, the stub
 * chunks in order, every module in `package.preload`, then
 * `require(testModule)` and the runner's global. Returns the runner's JSON;
 * throws LuaError when any step raises.
 */
export function runTestModule(
  stubs: readonly Chunk[],
  modules: readonly LuaModule[],
  testModule: string,
): string {
  const { lua, lauxlib, lualib } = vm();
  const L = lauxlib.luaL_newstate();
  try {
    lualib.luaL_openlibs(L);
    if (lauxlib.luaL_loadstring(L, LOADER) !== LUA_OK) {
      throw new LuaError(popMessage(L));
    }
    call(L, 0, 2);
    lua.lua_getglobal(L, "tostring");
    lua.lua_getglobal(L, "package");
    lua.lua_getfield(L, -1, "preload");
    lua.lua_remove(L, -2);

    for (const stub of stubs) {
      load(L, stub);
      call(L, 0, 0);
    }
    for (const module of modules) {
      load(L, module.chunk);
      lua.lua_setfield(L, PRELOAD, module.moduleName);
    }

    lua.lua_getglobal(L, "require");
    lua.lua_pushstring(L, testModule);
    call(L, 1, 0);

    lua.lua_getglobal(L, RUN_GLOBAL);
    if (lua.lua_type(L, -1) !== LUA_TFUNCTION) {
      throw new LuaError(
        `${testModule} did not load the reforged-test runner: the global ${RUN_GLOBAL} is not a function`,
      );
    }
    call(L, 0, 1);
    if (lua.lua_type(L, -1) !== LUA_TSTRING) {
      throw new LuaError(
        `${RUN_GLOBAL} returned a ${typeName(L, -1)}, expected a JSON string`,
      );
    }
    return lua.lua_tostring(L, -1);
  } finally {
    lua.lua_close(L);
  }
}

/** Pushes the compiled chunk, or throws its syntax error. */
function load(L: LuaState, chunk: Chunk): void {
  const { lua } = vm();
  for (const piece of pieces(chunk.source)) {
    lua.lua_pushvalue(L, APPEND);
    lua.lua_pushstring(L, piece);
    call(L, 1, 0);
  }
  lua.lua_pushvalue(L, LOAD);
  lua.lua_pushstring(L, `@${chunk.name}`);
  call(L, 1, 2);
  if (lua.lua_type(L, -2) !== LUA_TFUNCTION) {
    const message = popMessage(L);
    lua.lua_pop(L, 1);
    throw new LuaError(message);
  }
  lua.lua_pop(L, 1);
}

/** Splits a source into pieces, never between the halves of a surrogate pair. */
function* pieces(source: string): Generator<string> {
  let start = 0;
  while (start < source.length) {
    let end = Math.min(start + PIECE_LENGTH, source.length);
    const last = source.charCodeAt(end - 1);
    if (end < source.length && last >= 0xd800 && last <= 0xdbff) end -= 1;
    yield source.slice(start, end);
    start = end;
  }
}

/** lua_pcall; on error pops the message and throws it. */
function call(L: LuaState, nargs: number, nresults: number): void {
  const { lua } = vm();
  if (lua.lua_pcall(L, nargs, nresults, 0) !== LUA_OK) {
    throw new LuaError(popMessage(L));
  }
}

/** Pops the value on top of the stack as a message, via `tostring` if needed. */
function popMessage(L: LuaState): string {
  const { lua } = vm();
  const type = lua.lua_type(L, -1);
  if (type === LUA_TSTRING || type === LUA_TNUMBER) {
    const message = lua.lua_tostring(L, -1);
    lua.lua_pop(L, 1);
    return message;
  }
  const shown = typeName(L, -1);
  lua.lua_pushvalue(L, TOSTRING);
  lua.lua_insert(L, -2);
  const status = lua.lua_pcall(L, 1, 1, 0);
  const message =
    status === LUA_OK && lua.lua_type(L, -1) === LUA_TSTRING
      ? lua.lua_tostring(L, -1)
      : `(error object is a ${shown} value)`;
  lua.lua_pop(L, 1);
  return message;
}

function typeName(L: LuaState, index: number): string {
  const { lua } = vm();
  return lua.lua_typename(L, lua.lua_type(L, index));
}
