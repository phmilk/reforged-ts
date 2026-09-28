/** @noSelfInFile */

// Every tag the workspace tsdoc.json declares, in a library comment: TSDoc
// reports nothing on it. The generated Typings headers are linted from
// packages/reforged-types itself (../../doc-lint.test.ts).

/**
 * Counts `seconds` down on a Timer.
 * @remarks A remark, with a {@link countdown} link.
 * @example A countdown
 * {@includeCode ../../../../examples/harness/destructable-create.ts}
 * @param seconds - How long, in seconds.
 * @returns The seconds left.
 * @native CreateTimer
 * @native TimerStart
 * @patch 3.0.0.24268
 * @since 1.1.0
 * @bug One bug.
 * @bug Another bug.
 * @async
 */
export function countdown(seconds: number): number {
  return seconds;
}

/**
 * Functions the game calls without a `self` argument.
 * @noSelf
 */
export interface Callbacks {
  /** Runs on expiry. */
  readonly expire: () => void;
}
