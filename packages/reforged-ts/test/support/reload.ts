/** @noSelfInFile */

// Loading a family of the library's modules a second time in one Lua state:
// how a test stands in for a root that executes twice in one game. The
// harness preloads every compiled module into `package.preload`, and
// `require` caches what it loaded in `package.loaded`; forgetting the family
// there and running the entry's loader again runs every module of the
// family again, with fresh locals, exactly as a second root would.

/**
 * Lua's `package` as this file uses it: `loaded`, which lua-types describes
 * but does not declare, and `preload`.
 * @noSelf
 */
interface LuaPackage {
  loaded: Record<string, unknown>;
  preload: Record<string, (name: string) => unknown>;
}

/** Reached through `_G`: the name is reserved in a module. */
const luaPackage = _G.package as unknown as LuaPackage;

/**
 * Runs the modules whose names start with `family` again, from the loader
 * of `entry` (a module name as typescript-to-lua emits it, `src.init.index`),
 * and returns what the entry exported this time; the caller knows its type.
 */
export function reloadModules(family: string, entry: string): unknown {
  for (const name of Object.keys(luaPackage.loaded)) {
    if (name.startsWith(family)) {
      // Forgotten: nil is how a Lua table drops a key.
      luaPackage.loaded[name] = undefined;
    }
  }
  return luaPackage.preload[entry](entry);
}
