/** @noSelfInFile */

/**
 * Turns a rawcode, or another four-character code, back into the four
 * characters its author wrote, `FourCC("hfoo")` into `"hfoo"`, for the detail
 * of a creation error.
 * @remarks
 * Package-internal: `utils/index.ts` does not re-export it. Reads the four
 * bytes arithmetically, so a rawcode the game wrapped to a negative 32-bit
 * integer comes out the same.
 * @param rawcode - The rawcode, such as the Footman's, `FourCC("hfoo")`, or
 * a weather type's code.
 * @returns The four-character string, such as `"hfoo"`.
 */
export function rawcodeToString(rawcode: number): string {
  return string.char(
    Math.floor(rawcode / 0x1000000) % 256,
    Math.floor(rawcode / 0x10000) % 256,
    Math.floor(rawcode / 0x100) % 256,
    rawcode % 256,
  );
}
