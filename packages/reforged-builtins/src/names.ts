/**
 * The enUS name of a Built-in object as the index holds it, and the name of
 * its constant (#509, "Constant names"): the enUS name in PascalCase, then
 * `_` and the Rawcode exactly as cased.
 */

/** The constant's name stem of an object without an enUS name. */
export const UNNAMED = "Unnamed";

/**
 * The game's text reduced to the name: colour codes (`|cAARRGGBB`, `|r`)
 * and line breaks (`|n`, a newline) removed, runs of spaces folded, ends
 * trimmed.
 */
export function displayName(text: string): string {
  return text
    .replace(/\|c[0-9a-f]{8}/gi, "")
    .replace(/\|r/gi, "")
    .replace(/\|n|\r?\n/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * The constant's name of the object `rawcode` named `name` (undefined or
 * empty when it has none), by the rules in order:
 *
 * 1. strip colour codes, then fold accents to their base letter (NFKD,
 *    combining marks dropped);
 * 2. drop apostrophes (`'` and `’`);
 * 3. split into words on every character that is not an ASCII letter or digit;
 * 4. upper-case the first letter of each word, the rest as written;
 * 5. join; prefix `_` to a result starting with a digit; `Unnamed` when empty;
 * 6. append `_` and the Rawcode.
 */
export function constantName(
  name: string | undefined,
  rawcode: string,
): string {
  const folded = displayName(name ?? "")
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replace(/['’]/g, "");
  const words = folded.split(/[^A-Za-z0-9]+/).filter((word) => word !== "");
  let stem = words
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join("");
  if (/^[0-9]/.test(stem)) stem = `_${stem}`;
  if (stem === "") stem = UNNAMED;
  return `${stem}_${rawcode}`;
}
