// The Result file's encoding, on the writer's side: percent-encoding of a
// value and the split of a long line into continuation lines, so every line
// the runner gives `Preload` stays in #298's safe alphabet (printable ASCII
// without `"` or `\`) and within its 200 bytes. The reader (src/read.ts)
// undoes both. Plain Lua only: no Native, no library code, and no percent
// sign in the compiled Lua, comments included, which the World Editor cannot
// save.

/** The longest line the runner gives `Preload`, in bytes (#298). */
export const MAX_LINE_BYTES = 200;

/** The percent sign, built at run time so the compiled Lua holds none. */
const PERCENT = string.char(37);

const HEX_DIGITS = "0123456789ABCDEF";

/** The bytes escaped besides those outside printable ASCII: `=`, the percent sign, `"` and `\`. */
const ESCAPED_PRINTABLE = [61, 37, 34, 92];

/**
 * Whether `encodeValue` escapes the byte: outside printable ASCII, space,
 * `=`, the percent sign, `"` or `\`.
 */
function isEscaped(byte: number): boolean {
  return byte <= 32 || byte >= 127 || ESCAPED_PRINTABLE.includes(byte);
}

/** The byte as its escape: the percent sign, then two uppercase hexadecimal digits. */
function escape(byte: number): string {
  const high = Math.floor(byte / 16);
  const low = byte - high * 16;
  return (
    PERCENT +
    string.sub(HEX_DIGITS, high + 1, high + 1) +
    string.sub(HEX_DIGITS, low + 1, low + 1)
  );
}

/**
 * The value as the Result file holds it, percent-encoded: each byte outside
 * printable ASCII, and each space, `=`, percent sign, `"` and `\`, as the
 * percent sign and the byte's two uppercase hexadecimal digits; every other
 * byte as it is. Works on bytes, so a UTF-8 character becomes one escape per
 * byte.
 */
export function encodeValue(value: string): string {
  const parts: string[] = [];
  for (let index = 1; index <= value.length; index++) {
    const byte = string.byte(value, index);
    parts.push(isEscaped(byte) ? escape(byte) : string.char(byte));
  }
  return parts.join("");
}

/**
 * The lines `Preload` is given for the line `line` of sequence number
 * `seq`: the line itself when it holds at most 200 bytes; otherwise its
 * first 200 bytes, then continuation lines `<seq>+ <next bytes>` of at most
 * 200 bytes each, which the reader joins back.
 */
export function splitLine(line: string, seq: number): string[] {
  if (line.length <= MAX_LINE_BYTES) return [line];
  const prefix = `${String(seq)}+ `;
  const size = MAX_LINE_BYTES - prefix.length;
  const parts = [string.sub(line, 1, MAX_LINE_BYTES)];
  for (let start = MAX_LINE_BYTES + 1; start <= line.length; start += size) {
    parts.push(prefix + string.sub(line, start, start + size - 1));
  }
  return parts;
}
