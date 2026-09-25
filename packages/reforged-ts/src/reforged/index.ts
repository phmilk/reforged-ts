/** @noSelfInFile */

// The `Reforged` entry point of the library: `Reforged.configure` sets the
// one flag the runtime Guards read, Dev mode, and `Reforged.devMode` reads
// it. Off by default, so a map that never calls `configure` pays nothing.
//
// A dev-only decision is taken when a callback is registered, never on the
// hot path (ADR 0007). So the flag is meant to be set once, at the top of the
// Map project's entry point, before anything is registered: in Dev mode (on
// before the call or after it), a call after the Map project registered a
// callback through the library prints a warning naming the first
// registration, because it usually means the call is in the wrong place, and
// a registered callback keeps the decision taken for it. With Dev mode off
// before and after, a call prints nothing.
// `Reforged.debug` reads what Dev mode counted: the Wrappers created and
// destroyed per class, and the callback failures it suppressed.
//
// The flag lives (configuration.ts) on the library's global with the Init
// state (`anchored`), so a second execution of the Lua root finds the value
// the first one set: its registrations join the first load's queues. The
// map's repeated `configure`, the first call of that load keeping the mode,
// is then in the right place and prints nothing, although the first load
// registered callbacks.

import { LIBRARY } from "../init/state";
import { configuration } from "./configuration";
import {
  type CallbackFailure,
  callbackFailures,
  resetCallbackFailures,
} from "./protect";
import { resetWrapperCounts, type WrapperCount, wrapperCounts } from "./leaks";

export type { CallbackFailure } from "./protect";
export type { WrapperCount } from "./leaks";

/**
 * What `Reforged.configure` takes. The Template's generated environment
 * object can be passed as is: fields other than `devMode` and
 * `damageDepthLimit` are ignored.
 */
export interface ReforgedOptions {
  /** Whether the library runs in Dev mode. Absent means off. */
  readonly devMode?: boolean;
  /**
   * How many nested damage dispatches Dev mode allows before
   * `Unit.damageTarget` raises: the damage handlers running inside one
   * another may exceed it by none. Absent keeps the current limit: eight
   * until a call sets another. Read when damage is dealt, so a change
   * applies at once.
   */
  readonly damageDepthLimit?: number;
}

/** What `Reforged.debug.report()` returns. */
export interface DebugReport {
  /**
   * The Wrappers the library created and destroyed in Dev mode, one row per
   * class with the live difference, sorted by live descending: a leak shows
   * as a live count that keeps growing between reports. A heuristic: it
   * counts only the creations and destructions the library saw, so a unit
   * that decayed or an effect the game removed stays live here, and a
   * lookup (`fromHandle`, `fromEvent`) is never counted. Exact for the
   * classes only the library creates and destroys (`Point`, `Group`,
   * `Force`, `Timer`, `Trigger`, `Effect`, `Frame`). Empty with Dev mode
   * off.
   */
  readonly wrappers: readonly WrapperCount[];
  /**
   * Each callback that failed under the protection of Dev mode, once per
   * distinct message, in the order they first failed, with how many times
   * it failed. Empty with Dev mode off.
   */
  readonly failures: readonly CallbackFailure[];
}

/**
 * The type of `Reforged.debug`: what Dev mode counted, and a way to start
 * counting afresh. Every member prints that Dev mode is off, and returns
 * an empty result, when it is.
 */
export interface ReforgedDebug {
  /**
   * Prints the report, one line per row after a header, and returns it: the
   * Wrappers created, destroyed and live per class, most live first, then
   * the callbacks that failed and how many times each failed with the same
   * message. A repeated failure is reported on screen once, then only
   * counted here. The Wrapper counts are a heuristic, and the report says
   * so in a line of its own: only the creations and destructions the
   * library saw.
   * @example
   * {@includeCode ../../examples/debug-report.ts}
   */
  report(): DebugReport;
  /**
   * Zeroes the counts: every Wrapper row goes back to zero (a Wrapper
   * created before the reset is not counted destroyed after it), the
   * failures are forgotten, and the next failure of each callback is
   * reported on screen again.
   */
  reset(): void;
}

/** The type of `Reforged`: the configuration call, its read, and `debug`. */
export interface ReforgedEntry {
  /**
   * Records the configuration. An absent `devMode` means off: `configure({})`
   * after `configure({ devMode: true })` turns Dev mode off. Call it once,
   * first thing in the entry point: in Dev mode (on before the call or
   * after it), a call after the Map project registered a callback (through
   * `Init`, `addScriptHook` or a member that hands a function to a Native,
   * such as `Timer.start`; the library's own registrations do not count)
   * prints a warning naming the first registration, and records the values
   * anyway. A changed `devMode` affects only later registrations: a callback
   * keeps the mode it was registered under. An absent `damageDepthLimit`
   * keeps the current limit (eight until set); it is read when damage is
   * dealt, so a new one applies at once.
   */
  configure(options: ReforgedOptions): void;
  /** Whether the library is in Dev mode: false until `configure` sets it. */
  readonly devMode: boolean;
  /**
   * What Dev mode counted: the Wrappers created and destroyed per class, and
   * the callback failures it suppressed.
   */
  readonly debug: ReforgedDebug;
}

/**
 * The line `report()` prints before the Wrapper rows: the counts are a
 * heuristic.
 */
const SAW_ONLY = `${LIBRARY}: counts only the Wrappers the library created and destroyed: a unit that decayed or an effect the game removed stays live here`;

/** The line every `debug` member prints with Dev mode off. */
const DEV_MODE_OFF = `${LIBRARY}: Dev mode is off: Reforged.debug has nothing to report`;

class ReforgedDebugObject implements ReforgedDebug {
  public report(): DebugReport {
    if (!configuration.devMode) {
      print(DEV_MODE_OFF);
      return { wrappers: [], failures: [] };
    }
    const wrappers = wrapperCounts();
    const failures = callbackFailures();
    print(`${LIBRARY}: debug report`);
    print(SAW_ONLY);
    for (const row of wrappers) {
      print(
        `${LIBRARY}: ${row.className}: created ${String(row.created)}, destroyed ${String(row.destroyed)}, live ${String(row.live)}`,
      );
    }
    if (failures.length === 0) {
      print(`${LIBRARY}: no callback failed`);
    }
    for (const failure of failures) {
      print(
        `${LIBRARY}: ${failure.origin} failed ${String(failure.count)}x: ${failure.message}`,
      );
    }
    return { wrappers, failures };
  }

  public reset(): void {
    if (!configuration.devMode) {
      print(DEV_MODE_OFF);
      return;
    }
    resetWrapperCounts();
    resetCallbackFailures();
  }
}

class ReforgedObject implements ReforgedEntry {
  public readonly debug: ReforgedDebug = new ReforgedDebugObject();

  /**
   * Whether this load of the library has seen a `configure` call. Kept in a
   * module local, not on the anchor: a second execution of the Lua root
   * starts it false again, and its first call keeping the mode is the map's
   * repeated `configure`, in the right place.
   */
  private configured = false;

  public configure(options: ReforgedOptions): void {
    const devMode = options.devMode ?? false;
    const repeatedRoot = !this.configured && devMode === configuration.devMode;
    this.configured = true;
    const first = configuration.firstRegistration;
    if (
      first !== undefined &&
      !repeatedRoot &&
      (devMode || configuration.devMode)
    ) {
      print(
        `${LIBRARY}: Reforged.configure({ devMode: ${String(devMode)} }) called after a callback was registered (the first: ${first}): call it first in the entry point; a callback keeps the mode it was registered under`,
      );
    }
    configuration.damageDepthLimit =
      options.damageDepthLimit ?? configuration.damageDepthLimit;
    configuration.devMode = devMode;
  }

  public get devMode(): boolean {
    return configuration.devMode;
  }
}

/** The library's entry point: `configure`, what it recorded, and `debug`. */
export const Reforged: ReforgedEntry = new ReforgedObject();
