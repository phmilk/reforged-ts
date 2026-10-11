// The names of the map's objects and of their constants, by the rules
// reforged-builtins applies to its own (its README, "Constant names"; ADR
// 0013). A table both packages' tests run holds the two to one rule
// (test/fixtures/constant-names.json at the workspace's root).

/** The constant's name stem of an object without a name. */
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
 *
 * `undefined` when the Rawcode cannot end an identifier.
 */
export function constantName(
  name: string | undefined,
  rawcode: string,
): string | undefined {
  if (!/^[A-Za-z0-9_$]{4}$/.test(rawcode)) return undefined;
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
