/**
 * A count and its noun, in the singular for one: `1 object`, `3 objects`.
 *
 * @param count - How many.
 * @param noun - The noun in the singular, which takes an `s` in the plural.
 * @returns The count and its noun.
 */
export const counted = (count: number, noun: string): string =>
  `${String(count)} ${noun}${count === 1 ? "" : "s"}`;
