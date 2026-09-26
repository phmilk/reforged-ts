/**
 * The one string order of the report, so that it comes out the same on
 * every machine.
 */

/** Code-point order, independent of locale and file system. */
export function byCodePoint(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}
