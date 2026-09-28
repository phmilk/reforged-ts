/** @noSelfInFile */

// Every tag the workspace tsdoc.json declares, in a library comment, and a
// Typings header as reforged-types writes one: TSDoc reports nothing on
// either.

/**
 * Counts `seconds` down on a Timer.
 * @remarks A remark, with a {@link countdown} link.
 * @example A countdown
 * {@includeCode ../../../../examples/destructable-create.ts}
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

/**
 * @param key - oskeytype
 * @returns boolean
 * @patch 3.0.0.24268
 * @async
 * @deprecated Use BlzIsKeyPressed.
 * @remarks Pressed on the local client only.
 * @see {@link https://lep.duckdns.org/jassbot/doc/BlzIsKeyPressed}
 */
export declare function IsKeyPressed(key: number): boolean;
