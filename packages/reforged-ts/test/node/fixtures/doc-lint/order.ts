/** @noSelfInFile */

// A doc comment whose tags are out of the documented order: `@native` before
// `@param`, `@remarks` after `@returns`. sort-tags reports it once.

/**
 * Halves `value`.
 * @native CreateTimer
 * @param value - The value to halve.
 * @returns Half the value.
 * @remarks Rounds nothing.
 */
export function half(value: number): number {
  return value / 2;
}
