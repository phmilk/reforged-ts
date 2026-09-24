/** @noSelfInFile */

/**
 * A rawcode as its author wrote it, `FourCC("RAhr")` back to `"RAhr"`, for
 * the detail of a creation error. Package-internal: `utils/index.ts` does not
 * re-export it. Reads the four bytes arithmetically, so a rawcode the game
 * wrapped to a negative 32-bit integer comes out the same.
 */
export function rawcodeToString(rawcode: number): string {
  return string.char(
    Math.floor(rawcode / 0x1000000) % 256,
    Math.floor(rawcode / 0x10000) % 256,
    Math.floor(rawcode / 0x100) % 256,
    rawcode % 256,
  );
}
