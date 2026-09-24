/** @noSelfInFile */

// The `Reforged` entry point of the library: `Reforged.configure` sets the
// one flag the runtime Guards read, Dev mode, and `Reforged.devMode` reads
// it. Off by default, so a map that never calls `configure` pays nothing.
//
// A dev-only decision is taken when a callback is registered, never on the
// hot path (ADR 0007). So the flag is meant to be set once, at the top of the
// Map project's entry point, before anything is registered: a call that
// changes it after the Map project registered a callback through the
// library prints a warning, because that callback keeps the decision taken
// for it, and the new value affects later registrations only. A call that
// changes nothing prints nothing.
//
// The flag lives on the library's global with the Init state (`anchored`),
// so a second execution of the Lua root finds the value the first one set:
// its registrations join the first load's queues, and the map's repeated
// `configure` is then the silent repeated call, not a change after
// registrations.

import { hasProjectRegistrations } from "../init/queue";
import { anchored, LIBRARY } from "../init/state";

/**
 * What `Reforged.configure` takes. The Template's generated environment
 * object can be passed as is: fields other than `devMode` are ignored.
 */
export interface ReforgedOptions {
  /** Whether the library runs in Dev mode. Absent means off. */
  readonly devMode?: boolean;
}

/** The type of `Reforged`: the configuration call and its read. */
export interface ReforgedEntry {
  /**
   * Records the configuration. Call it once, first thing in the entry
   * point: a call that changes `devMode` after the Map project registered a
   * callback through the library prints a warning and affects only later
   * registrations.
   */
  configure(options: ReforgedOptions): void;
  /** Whether the library is in Dev mode: false until `configure` sets it. */
  readonly devMode: boolean;
}

/** The recorded configuration, shared by every load of the library. */
interface Configuration {
  devMode: boolean;
}

const configuration = anchored<Configuration>("configuration", () => ({
  devMode: false,
}));

class ReforgedObject implements ReforgedEntry {
  public configure(options: ReforgedOptions): void {
    const devMode = options.devMode ?? false;
    if (devMode === configuration.devMode) {
      return;
    }
    if (hasProjectRegistrations()) {
      print(
        `${LIBRARY}: Reforged.configure({ devMode: ${String(devMode)} }) called after a callback was registered: only later registrations see the new value`,
      );
    }
    configuration.devMode = devMode;
  }

  public get devMode(): boolean {
    return configuration.devMode;
  }
}

/** The library's entry point: `configure` and what it recorded. */
export const Reforged: ReforgedEntry = new ReforgedObject();
