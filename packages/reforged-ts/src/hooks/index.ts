/** @noSelfInFile */

// The deprecated alias of the Init stages, kept one release for w3ts 3.x
// consumers: `addScriptHook` registers a callback before or after the map
// script's `main` or `config`, at the alias's old timing, now on the init
// machinery (each callback under pcall, in both load positions). The stage
// that replaces each entry point is in the deprecation notes; the two
// `config` entry points have no stage in this release.

import { isEntryPoint, onEntryPoint } from "../init/entry-points";
import type { EntryPoint } from "../init/state";

export type { EntryPoint } from "../init/state";

/**
 * The entry points of {@link addScriptHook}, by their w3ts names.
 * @deprecated Register for an Init stage instead:
 * {@link InitStages.onGlobals | Init.onGlobals} for `MAIN_BEFORE` and
 * {@link InitStages.onInitTriggers | Init.onInitTriggers} for `MAIN_AFTER`.
 * `CONFIG_BEFORE` and `CONFIG_AFTER` have no stage in 1.x: code that needs
 * the lobby's timing stays on {@link addScriptHook}. Removed in 2.0.0.
 */
export enum W3TS_HOOK {
  /**
   * Before the map script's `main`.
   * @deprecated Use {@link InitStages.onGlobals | Init.onGlobals}, which
   * runs later by design, after `InitGlobals`. Removed in 2.0.0.
   */
  MAIN_BEFORE = "main::before",
  /**
   * After the map script's `main`.
   * @deprecated Use {@link InitStages.onInitTriggers | Init.onInitTriggers},
   * the same moment: the end of `main`. Removed in 2.0.0.
   */
  MAIN_AFTER = "main::after",
  /**
   * Before the map script's `config`, in the lobby.
   * @deprecated With no replacement: no Init stage runs at the lobby's
   * timing. It still works in 1.x and is removed in 2.0.0, with the rest of
   * `W3TS_HOOK`.
   */
  CONFIG_BEFORE = "config::before",
  /**
   * After the map script's `config`, in the lobby.
   * @deprecated With no replacement: no Init stage runs at the lobby's
   * timing. It still works in 1.x and is removed in 2.0.0, with the rest of
   * `W3TS_HOOK`.
   */
  CONFIG_AFTER = "config::after",
}

/**
 * Registers `hook` to run before or after the map script's `main` or
 * `config`.
 * @remarks
 * The hook runs under pcall, where w3ts let a failing hook end `main` or
 * `config` silently: a failure prints one line,
 * `reforged-ts: main::before callback #2 failed: <message>` (the entry
 * point, the hook's ordinal in its queue and the message), and the other
 * hooks of the entry point and the entry point itself still run. The hooks
 * keep their w3ts timing: a hook registered after its entry point ran waits
 * for the next run.
 * @param entryPoint - When the hook runs: `"main::before"`, `"main::after"`,
 * `"config::before"` or `"config::after"`, or the {@link W3TS_HOOK} value.
 * @param hook - The function to run.
 * @returns True when `entryPoint` is one of the four and the hook was
 * registered; false otherwise, and nothing is registered.
 * @deprecated Register for an Init stage instead:
 * {@link InitStages.onGlobals | Init.onGlobals} for `main::before` and
 * {@link InitStages.onInitTriggers | Init.onInitTriggers} for `main::after`.
 * The two `config` entry points have no stage in 1.x: code that needs the
 * lobby's timing stays on this alias. Removed in 2.0.0.
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
