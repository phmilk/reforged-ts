/** @noSelfInFile */

// Leak counters: in Dev mode the Handle base's creation step counts a
// Wrapper created per class and its release step a Wrapper destroyed; live
// is the difference, so a leak shows as a number that keeps growing.
// Lookups (`fromHandle`, `fromEvent`, the documented non-null lookups) never
// count: they wrap objects the library did not create. A destruction counts
// only for a Handle counted created since the last reset, under the class it
// was counted created as, so no row goes below zero: a looked-up Wrapper
// destroyed, one created before the reset or before Dev mode was on, is not
// counted. The counts are a
// heuristic, then: a unit that decayed or an effect the game removed is not
// a destruction the library saw. They are exact for the classes only the
// library creates and destroys (`Point`, `Group`, `Force`, `Timer`,
// `Trigger`, `Effect`, `Frame`, ...).
//
// Package-internal: nothing here is exported from the library index.

import { anchored } from "../init/state";

/** One Wrapper class as `Reforged.debug.report()` returns it. */
export interface WrapperCount {
  /** The Wrapper's class name: `Timer`. */
  readonly className: string;
  /** How many the library created in Dev mode since the last reset. */
  readonly created: number;
  /** How many of those the library destroyed in Dev mode since then. */
  readonly destroyed: number;
  /** `created - destroyed`: how many the library believes still live. */
  readonly live: number;
}

/** A row as the store keeps it: the counts grow. */
interface CountRow {
  readonly className: string;
  created: number;
  destroyed: number;
}

/** The counts since the last reset, by class name, in first-counted order. */
interface CountStore {
  /** One row per class ever counted: a reset zeroes it, never removes it. */
  readonly rows: Map<string, CountRow>;
  /**
   * The Handles counted created since the last reset and not yet destroyed,
   * with the class name they were counted under. Weak, so a Handle the game
   * dropped does not stay here; a reset replaces it.
   */
  counted: WeakMap<handle, string>;
}

/**
 * The store, anchored on the library's global so a second load of the
 * library counts into the same one. Made on first use: a release build
 * never counts, so it never creates it.
 */
function store(): CountStore {
  return anchored<CountStore>("wrappers", () => ({
    rows: new Map(),
    counted: new WeakMap(),
  }));
}

/** The row of `className`, made at zero on its first count. */
function rowOf(className: string): CountRow {
  const rows = store().rows;
  let row = rows.get(className);
  if (row === undefined) {
    row = { className, created: 0, destroyed: 0 };
    rows.set(className, row);
  }
  return row;
}

/**
 * Counts `handle` created as a `className` Wrapper, once. Called in Dev mode
 * only.
 */
export function countCreated(className: string, handle: handle): void {
  const counted = store().counted;
  if (counted.has(handle)) {
    return;
  }
  counted.set(handle, className);
  rowOf(className).created++;
}

/**
 * Counts `handle` destroyed, under the class it was counted created as, when
 * it was counted created since the last reset; otherwise counts nothing.
 * Called in Dev mode only.
 */
export function countDestroyed(handle: handle): void {
  const counted = store().counted;
  const className = counted.get(handle);
  if (className === undefined) {
    return;
  }
  counted.delete(handle);
  rowOf(className).destroyed++;
}

/**
 * The counts since the last reset, one row per class, sorted by live
 * descending, then by class name so equal rows come in the same order on
 * every run.
 */
export function wrapperCounts(): WrapperCount[] {
  const counts: WrapperCount[] = [];
  for (const [, row] of store().rows) {
    counts.push({
      className: row.className,
      created: row.created,
      destroyed: row.destroyed,
      live: row.created - row.destroyed,
    });
  }
  return counts.sort((a, b) =>
    a.live !== b.live
      ? b.live - a.live
      : a.className < b.className
        ? -1
        : a.className > b.className
          ? 1
          : 0,
  );
}

/**
 * Zeroes every row and forgets the Handles counted created: a Wrapper
 * created before the reset is not counted destroyed after it.
 */
export function resetWrapperCounts(): void {
  const counts = store();
  for (const [, row] of counts.rows) {
    row.created = 0;
    row.destroyed = 0;
  }
  counts.counted = new WeakMap();
}
