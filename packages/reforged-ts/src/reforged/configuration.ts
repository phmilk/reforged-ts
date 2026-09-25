/** @noSelfInFile */

// What `Reforged.configure` recorded, and the first registration it warns
// about. Kept apart from the entry point (index.ts) so the modules that take
// a dev-only decision at registration (the Init queues, the protected
// callbacks) read it without importing the entry point, which imports them.
//
// It lives on the library's global with the Init state (`anchored`), so a
// second execution of the Lua root finds the value the first one set.
//
// Package-internal: nothing here is exported from the library index.

import { anchored } from "../init/state";

/** The recorded configuration, shared by every load of the library. */
export interface Configuration {
  /** Whether the library is in Dev mode. */
  devMode: boolean;
  /**
   * The first callback registered through the library, as a warning names
   * it (`Init.onGlobals "spawn"`, `Timer#1048577 Timer.start`), or undefined
   * while there is none. The library's own load-time Init registrations do
   * not count.
   */
  firstRegistration: string | undefined;
  /**
   * How deep damage handlers may nest before `Unit.damageTarget` raises in
   * Dev mode: `DEFAULT_DAMAGE_DEPTH_LIMIT` unless `configure` set another.
   */
  damageDepthLimit: number;
}

/** The damage nesting depth `Unit.damageTarget` allows by default in Dev mode. */
export const DEFAULT_DAMAGE_DEPTH_LIMIT = 8;

/** The configuration: the one an earlier load anchored, or a new one. */
export const configuration = anchored<Configuration>("configuration", () => ({
  devMode: false,
  firstRegistration: undefined,
  damageDepthLimit: DEFAULT_DAMAGE_DEPTH_LIMIT,
}));

/**
 * Remembers `name` as the first registration, unless one came before. The
 * name is built by the caller only when `configuration.firstRegistration` is
 * undefined, so a registration after the first costs one read.
 */
export function noteRegistration(name: string): void {
  configuration.firstRegistration ??= name;
}
