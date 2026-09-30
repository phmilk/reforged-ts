// The Result file's encoding, on the writer's side: the line of a record,
// its values percent-encoded, and the split of a long line into continuation
// lines, so every line the runner gives `Preload` stays in #298's safe
// alphabet (printable ASCII without `"` or `\`) and within its 200 bytes.
// The reader (src/read.ts) undoes both. Plain Lua only: no Native, no
// library code, and no percent sign in the compiled Lua, comments included,
// which the World Editor cannot save.

import type { FieldValue } from "./probe";

/** The longest line the runner gives `Preload`, in bytes (#298). */
export const MAX_LINE_BYTES = 200;

/** The percent sign, built at run time so the compiled Lua holds none. */
const PERCENT = string.char(37);

/** The `string.format` pattern of a byte as two uppercase hexadecimal digits. */
const HEX_BYTE = `${PERCENT}02X`;

/** The bytes escaped besides those outside printable ASCII: `=`, the percent sign, `"` and `\`. */
const ESCAPED_PRINTABLE = [61, 37, 34, 92];

/**
 * The escape of each byte `encodeValue` escapes, keyed by the byte as a
 * one-byte string: each byte outside printable ASCII, space, `=`, the
 * percent sign, `"` and `\`, as the percent sign and the byte's two
 * uppercase hexadecimal digits. A byte kept as it is has no entry.
 */
const ESCAPES: Record<string, string> = {};
for (let byte = 0; byte < 256; byte++) {
  if (byte <= 32 || byte >= 127 || ESCAPED_PRINTABLE.includes(byte)) {
    ESCAPES[string.char(byte)] = PERCENT + string.format(HEX_BYTE, byte);
  }
}

/**
 * The value as the Result file holds it, percent-encoded: each byte outside
 * printable ASCII, and each space, `=`, percent sign, `"` and `\`, as the
 * percent sign and the byte's two uppercase hexadecimal digits; every other
 * byte as it is. Works on bytes, so a UTF-8 character becomes one escape per
 * byte.
 */
export function encodeValue(value: string): string {
  // `.` matches every byte; a byte without an entry in ESCAPES is kept.
  const [encoded] = string.gsub(value, ".", ESCAPES);
  return encoded;
}

/**
 * Whether `name` may be a record's kind or a field's key: not empty, and in
 * the safe alphabet, printable ASCII without space, `=`, the percent sign,
 * `"` or `\`. So it is a value `encodeValue` keeps as it is.
 */
export function isSafeName(name: string): boolean {
  return name !== "" && encodeValue(name) === name;
}

/** Raises an error, without a position, unless `name` is a safe name. */
function checkName(what: "kind" | "key", name: string): void {
  if (!isSafeName(name)) {
    error(
      `The ${what} "${encodeValue(name)}", percent-encoded here, is not a Result file name: a kind or a key is printable ASCII without space, =, the percent sign, the quote or the backslash, and is not empty.`,
      0,
    );
  }
}

/**
 * The line `<seq> <kind> <key>=<value> ...` of a record, its fields sorted
 * by key, as Lua tables keep no order, and each value percent-encoded.
 * Raises an error when the kind or a key is not a safe name (`isSafeName`):
 * the writer encodes values only, so a kind or a key it could not write as
 * it is fails the Probe run.
 */
export function recordLine(
  seq: number,
  kind: string,
  fields: Readonly<Record<string, FieldValue>>,
): string {
  checkName("kind", kind);
  const pairs = Object.keys(fields)
    .sort()
    .map((key) => {
      checkName("key", key);
      return ` ${key}=${encodeValue(tostring(fields[key]))}`;
    });
  return `${String(seq)} ${kind}${pairs.join("")}`;
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
