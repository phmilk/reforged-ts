/** @noSelfInFile */

// Exactly three TSDoc mistakes: a `@param` without the hyphen, an undeclared
// tag and an unescaped brace.

/**
 * Doubles `value`.
 * @note An undeclared tag.
 * @param value The value.
 * @returns Twice the value, as in 2 * value }.
 */
export function double(value: number): number {
  return value * 2;
}
