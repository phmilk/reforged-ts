/** @noSelfInFile */

// Wrapping a global function, now or on its first assignment: the wrapper
// calls the original, with what the caller asked for before and after it,
// and takes the original's place under its name. A wrapper carries a marker
// (it is in the shared set of wrappers), and wrapping a function that
// carries it is a no-op, so a root that executes twice in one Lua state
// wraps each function once.
//
// A name that is nil when asked for (the map header position: the editor's
// script defines `InitCustomTriggers`, `RunInitializationTriggers`, `main`
// and `config` after the header) is pending, and the interception, a
// metatable the library sets on `_G`, wraps it the moment the editor's
// script assigns it, storing the wrapper with a raw set. The decision is
// per name; nothing records a load position. The library's metatable
// composes with one the map installed before it (an undeclared-global
// warner): the map's `__index` and `__newindex` keep working for every
// other key (a raw set when there was no `__newindex`), and the map's
// metatable is `_G`'s again, or `_G` has none again, once every pending
// name was captured. The interception lives in the shared state, so a
// second root finds it on and installs no second metatable over it.
//
// Package-internal: nothing here is exported from the library index.

import {
  type Around,
  type Globals,
  type GlobalsMetatable,
  globals,
  state,
} from "./state";

/** Installs the wrapper of `original` as the global `name` and marks it. */
function install(name: string, original: () => void, around: Around): void {
  const wrapper = () => {
    around.before?.();
    original();
    around.after?.();
  };
  state.wrappers.add(wrapper);
  rawset(globals, name, wrapper);
}

/**
 * Assigns `value` to `key` as `_G` did before the interception: through the
 * `__newindex` of the metatable the map installed, or with a raw set.
 */
function assignThrough(
  previous: GlobalsMetatable | undefined,
  table: Globals,
  key: string,
  value: unknown,
): void {
  const newindex = previous?.__newindex;
  if (newindex === undefined) {
    rawset(table, key, value);
  } else if (typeof newindex === "function") {
    newindex(table, key, value);
  } else {
    (newindex as Globals)[key] = value;
  }
}

/**
 * Takes the library's metatable off `_G` once every pending name was
 * captured: the map's metatable is `_G`'s again, or `_G` has none. A
 * metatable something else put over the library's meanwhile is left alone.
 */
function release(): void {
  const interception = state.interception;
  if (interception === undefined || state.pending.length > 0) {
    return;
  }
  state.interception = undefined;
  if (getmetatable(globals) === interception.metatable) {
    setmetatable(globals, interception.previous);
  }
}

/**
 * The `__newindex` of the library's metatable: a function assigned to a
 * pending name is wrapped and stored with a raw set; every other assignment
 * goes where it went before the interception.
 */
function capture(
  previous: GlobalsMetatable | undefined,
  table: Globals,
  key: string,
  value: unknown,
): void {
  const index =
    typeof value === "function"
      ? state.pending.findIndex((pending) => pending.name === key)
      : -1;
  if (index < 0) {
    assignThrough(previous, table, key, value);
    return;
  }
  const [pending] = state.pending.splice(index, 1);
  install(pending.name, value as () => void, pending.around);
  release();
}

/**
 * Puts the library's metatable on `_G` unless the interception is on
 * already: the metatable `_G` has now is what the library's composes with
 * and what comes back when the interception ends.
 */
function intercept(): void {
  if (state.interception !== undefined) {
    return;
  }
  const previous: GlobalsMetatable | undefined = getmetatable(globals);
  const metatable: GlobalsMetatable = {
    __newindex: (table, key, value) => {
      capture(previous, table, key, value);
    },
  };
  if (previous?.__index !== undefined) {
    metatable.__index = previous.__index;
  }
  setmetatable(globals, metatable);
  state.interception = { metatable, previous };
}

/**
 * Wraps the global function `name` in place, or, when the global is nil now,
 * on its first assignment. A global that already is a wrapper is left as it
 * is.
 */
export function wrapGlobal(name: string, around: Around): void {
  const current = rawget(globals, name);
  if (type(current) === "function") {
    const original = current as () => void;
    if (!state.wrappers.has(original)) {
      install(name, original, around);
    }
    return;
  }
  if (!state.pending.some((pending) => pending.name === name)) {
    state.pending.push({ name, around });
  }
  intercept();
}
