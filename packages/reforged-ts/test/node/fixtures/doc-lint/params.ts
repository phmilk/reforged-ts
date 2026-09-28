/** @noSelfInFile */

// A function whose doc comment names one of its two parameters and not its
// return value, and one that returns nothing: require-param reports the
// missing parameter, require-returns the missing return value, and neither
// reports the function returning nothing.

/**
 * Adds two numbers.
 * @param left - The first number.
 */
export function add(left: number, right: number): number {
  return left + right;
}

/**
 * Empties a list of numbers.
 * @param values - The list to empty.
 */
export function clear(values: number[]): void {
  values.length = 0;
}
