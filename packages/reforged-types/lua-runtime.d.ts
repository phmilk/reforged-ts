/** @noSelfInFile */
// Hand-written: the globals the Warcraft III Lua runtime defines besides the
// Natives and the Lua 5.3 standard library, limited to what the probe map
// confirmed (#9) and the library needs. TypeDefine is left out until its
// signature is established.

/**
 * The integer id of a four-character rawcode, as the Natives take it.
 *
 * @param id - four-character rawcode, such as `"hfoo"`
 * @returns integer (32-bit)
 */
declare function FourCC(id: string): number;

/**
 * A table whose missing keys read as `defaultValue`: the Lua form of a Jass
 * array, as the World Editor emits it for GUI variables.
 *
 * @param defaultValue - the value of every index not yet written
 */
declare function __jarray<T>(defaultValue: T): Record<number, T>;
