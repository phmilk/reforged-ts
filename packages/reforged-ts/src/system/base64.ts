/** @noSelfInFile */

const alphabet =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

const padding = string.byte("=");

// The alphabet's characters by 6-bit value, and the 6-bit values by byte; a
// byte absent from the second table is outside the alphabet.
const characters: string[] = [];
const values = new LuaMap<number, number>();
for (let value = 0; value < 64; value++) {
  characters[value] = alphabet.charAt(value);
  values.set(string.byte(alphabet, value + 1), value);
}

// A group of three bytes is a 24-bit block, split and joined arithmetically:
// typescript-to-lua rejects `>>` on Lua 5.3 and masks `>>>` with 2^32 - 1, a
// literal the game's 32-bit integers cannot hold.
function sextet(block: number, divisor: number): string {
  return characters[Math.floor(block / divisor) % 64];
}

function byte(block: number, divisor: number): string {
  return string.char(Math.floor(block / divisor) % 256);
}

/**
 * Encode a byte string to base64 (RFC 4648, with padding). Any byte string
 * is accepted, including zero bytes and bytes that are not UTF-8.
 * @param input The byte string to encode.
 */
export function base64Encode(input: string): string {
  const output: string[] = [];
  const length = input.length;
  for (let index = 1; index <= length; index += 3) {
    // The bytes of this group after the first: 0, 1 or 2.
    const more = length - index;
    const [first, second = 0, third = 0] = string.byte(input, index, index + 2);
    const block = first * 0x10000 + second * 0x100 + third;
    output.push(
      sextet(block, 0x40000),
      sextet(block, 0x1000),
      more < 1 ? "=" : sextet(block, 0x40),
      more < 2 ? "=" : sextet(block, 1),
    );
  }
  return output.join("");
}

/**
 * Decode a base64 string (RFC 4648, with padding) back to its bytes.
 * @param input The base64 string to decode.
 * @throws When the length is not a multiple of four, when a character is
 * outside the alphabet, or when padding is anywhere but the last one or two
 * characters. Each case has its own message, with the offset of the
 * offending character.
 */
export function base64Decode(input: string): string {
  const length = input.length;
  if (length % 4 !== 0) {
    error(
      `reforged-ts: base64Decode input length ${String(length)} is not a multiple of four`,
      2,
    );
  }
  const output: string[] = [];
  for (let index = 1; index <= length; index += 4) {
    const bytes = [...string.byte(input, index, index + 3)];
    // Padding is allowed as the last character, or the last two, of the
    // last group; a padded character counts as zero bits.
    let padded = 0;
    if (index + 3 === length && bytes[3] === padding) {
      padded = bytes[2] === padding ? 2 : 1;
    }
    let block = 0;
    for (let offset = 0; offset < 4; offset++) {
      const value = offset < 4 - padded ? values.get(bytes[offset]) : 0;
      if (value === undefined) {
        const cause =
          bytes[offset] === padding
            ? "padding in the wrong place"
            : "a character outside the alphabet";
        error(
          `reforged-ts: base64Decode input has ${cause} at offset ${String(index + offset - 1)}`,
          2,
        );
      }
      block = block * 64 + value;
    }
    output.push(byte(block, 0x10000));
    if (padded < 2) {
      output.push(byte(block, 0x100));
    }
    if (padded < 1) {
      output.push(byte(block, 1));
    }
  }
  return output.join("");
}
