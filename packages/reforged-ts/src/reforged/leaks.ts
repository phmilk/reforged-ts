/** @noSelfInFile */

// Leak counters: in Dev mode the Handle base's creation step counts a
// Wrapper created per class and its release step a Wrapper destroyed; live
// is the difference, so a leak shows as a number that keeps growing.
// Lookups (`fromHandle`, `fromEvent`, the documented non-null lookups) never
// count: they wrap objects the library did not create. The counts are a
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
  /** How many of any the library destroyed in Dev mode since the last reset. */
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
  rows: Map<string, CountRow>;
}

/**
 * The store, anchored on the library's global so a second load of the
 * library counts into the same one. Made on first use: a release build
 * never counts, so it never creates it.
 */
function store(): CountStore {
  return anchored<CountStore>("wrappers", () => ({ rows: new Map() }));
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

/** Counts one `className` Wrapper created. Called in Dev mode only. */
export function countCreated(className: string): void {
  rowOf(className).created++;
}

/** Counts one `className` Wrapper destroyed. Called in Dev mode only. */
export function countDestroyed(className: string): void {
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

/** Forgets every count: the next report counts from zero. */
export function resetWrapperCounts(): void {
  store().rows = new Map();
}
