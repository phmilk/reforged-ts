/** @noSelfInFile */

// The deprecated alias of the Init stages, kept one release for w3ts 3.x
// consumers: `addScriptHook` registers a callback before or after the map
// script's `main` or `config`, at the alias's old timing, now on the init
// machinery (each callback under pcall, in both load positions). The stage
// that replaces each entry point is in the deprecation notes; the two
// `config` entry points have no stage in this release.

import { isEntryPoint, onEntryPoint } from "../init/entry-points";
import type { EntryPoint } from "../init/state";

/**
 * The entry points of `addScriptHook`.
 * @deprecated Register an Init stage instead: `Init.onGlobals` for
 * `MAIN_BEFORE` and `Init.onInitTriggers` for `MAIN_AFTER`. `CONFIG_BEFORE`
 * and `CONFIG_AFTER` have no stage in this release: code that needs lobby
 * timing stays on `addScriptHook` until 2.0.
 */
export enum W3TS_HOOK {
  /**
   * @deprecated Use `Init.onGlobals`: later than before, after
   * `InitGlobals`, by design.
   */
  MAIN_BEFORE = "main::before",
  /** @deprecated Use `Init.onInitTriggers`: the same moment, the end of `main`. */
  MAIN_AFTER = "main::after",
  /** @deprecated No stage in this release: stay on `addScriptHook` until 2.0. */
  CONFIG_BEFORE = "config::before",
  /** @deprecated No stage in this release: stay on `addScriptHook` until 2.0. */
  CONFIG_AFTER = "config::after",
}

/**
 * Registers `hook` to run at `entryPoint`, before or after the map script's
 * `main` or `config`, and returns whether the entry point is one of the
 * four. The hook runs under pcall: a failure prints one line, and the other
 * hooks of the entry point and the entry point itself still run.
 * @deprecated Register an Init stage instead: `Init.onGlobals` for
 * `main::before` and `Init.onInitTriggers` for `main::after`. The two
 * `config` entry points have no stage in this release: code that needs
 * lobby timing stays on this alias until 2.0.
 */
export function addScriptHook(
  entryPoint: EntryPoint,
  hook: () => void,
): boolean {
  if (!isEntryPoint(entryPoint)) {
    return false;
  }
  onEntryPoint(entryPoint, "project", hook);
  return true;
}
