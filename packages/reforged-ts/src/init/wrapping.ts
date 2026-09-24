/** @noSelfInFile */

// Wrapping a global function in place: the wrapper calls the original, with
// what the caller asked for before and after it, and takes the original's
// place under its name. A wrapper carries a marker (it is in the shared set
// of wrappers), and wrapping a function that carries it is a no-op, so a
// root that executes twice in one Lua state wraps each function once.
//
// A name that is nil when asked for (the map header position: the editor's
// script defines `InitCustomTriggers`, `RunInitializationTriggers`, `main`
// and `config` after the header) is recorded as pending. The interception
// through the `_G` metatable that wraps a pending name on its first
// assignment is the next ticket's; it reads `pendingNames` and calls
// `wrapPendingName` from its hook.
//
// Package-internal: nothing here is exported from the library index.

import { type Around, globals, state } from "./state";

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
 * Wraps the global function `name` in place, or records the name as pending
 * when the global is nil now. A global that already is a wrapper is left as
 * it is.
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
}

/** The names asked for while their global was nil, oldest first. */
export function pendingNames(): string[] {
  return state.pending.map((pending) => pending.name);
}

/**
 * Wraps `original`, just assigned to the pending global `name`, and stores
 * the wrapper under the name with a raw set. Does nothing for a name that is
 * not pending.
 */
export function wrapPendingName(name: string, original: () => void): void {
  const index = state.pending.findIndex((pending) => pending.name === name);
  if (index < 0) {
    return;
  }
  const [pending] = state.pending.splice(index, 1);
  install(name, original, pending.around);
}
