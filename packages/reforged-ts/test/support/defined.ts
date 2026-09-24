/** @noSelfInFile */

/**
 * The value, or an error naming what was missing: for the factories and
 * lookups that return undefined when a Native returns nothing.
 */
export function defined<T>(value: T | undefined, what: string): T {
  if (value === undefined) {
    throw new Error(`${what} is undefined`);
  }
  return value;
}
