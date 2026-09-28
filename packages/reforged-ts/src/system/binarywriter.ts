/** @noSelfInFile */

import {
  type BinaryField,
  BYTE_ORDER,
  FIELDS,
  UINT32_MODULUS,
  UINT32_SIGNED_LIMIT,
} from "./binaryformat";

/**
 * Packs primitive types into a binary string, for a {@link BinaryReader} to
 * read back in the same order.
 *
 * The values accumulate until `toString` packs them. A value outside its
 * integer width's range, or a string longer than 65,535 bytes, throws at the
 * write that gave it.
 *
 * @remarks
 * Two changes from w3ts:
 * - Every integer `writeX`, `writeInt32` included, throws
 *   `reforged-ts: <writeX> takes <min> to <max>, got <value>` for a value its
 *   width cannot hold, and for NaN, at the call that writes it.
 * - Strings are length-prefixed, so any byte, a zero included, round-trips:
 *   w3ts's zero-terminated strings do not read back.
 *
 * @example
 * {@includeCode ../../examples/harness/binary-round-trip.ts}
 */
export class BinaryWriter {
  private format = BYTE_ORDER;

  private readonly values: (string | number)[] = [];

  /**
   * Packs the values written so far into a binary string.
   * @returns The binary string, big-endian, for a {@link BinaryReader}.
   */
  public toString(): string {
    return string.pack(this.format, ...this.values);
  }

  /**
   * Writes a double-precision float in eight bytes, the lossless pair of
   * `readDouble`.
   * @param value - Any number, read back exactly.
   */
  public writeDouble(value: number): void {
    this.push(FIELDS.double, value);
  }

  /**
   * Writes a single-precision float in four bytes, so the value is rounded to
   * single precision. `writeDouble` is the lossless pair.
   * @param value - Any number; `readFloat` gives back its nearest
   * single-precision value.
   */
  public writeFloat(value: number): void {
    this.push(FIELDS.float, value);
  }

  /**
   * Writes a signed 16-bit integer in two bytes.
   * @param value - The value, from -32,768 to 32,767.
   * @throws When the value is outside that range, or NaN, at the calling
   * line: `reforged-ts: writeInt16 takes -32768 to 32767, got <value>`.
   */
  public writeInt16(value: number): void {
    this.checkRange("writeInt16", FIELDS.int16, value);
    this.push(FIELDS.int16, value);
  }

  /**
   * Writes a signed 32-bit integer in four bytes.
   * @param value - The value, from -2^31 to 2^31 - 1.
   * @throws When the value is outside that range, or NaN, at the calling
   * line: `reforged-ts: writeInt32 takes -2147483648 to 2147483647, got <value>`.
   */
  public writeInt32(value: number): void {
    this.checkRange("writeInt32", FIELDS.int32, value);
    this.push(FIELDS.int32, value);
  }

  /**
   * Writes a signed 8-bit integer in one byte.
   * @param value - The value, from -128 to 127.
   * @throws When the value is outside that range, or NaN, at the calling
   * line: `reforged-ts: writeInt8 takes -128 to 127, got <value>`.
   */
  public writeInt8(value: number): void {
    this.checkRange("writeInt8", FIELDS.int8, value);
    this.push(FIELDS.int8, value);
  }

  /**
   * Writes a string as a two-byte length prefix and its bytes, so any byte
   * survives, zero included.
   * @remarks
   * The format is length-prefixed, where w3ts wrote zero-terminated strings.
   * @param value - The string, at most 65,535 bytes.
   * @throws When the string is longer, at the calling line:
   * `reforged-ts: writeString takes at most 65535 bytes, got <length>`.
   */
  public writeString(value: string): void {
    if (value.length > FIELDS.string.max) {
      error(
        `reforged-ts: writeString takes at most ${String(FIELDS.string.max)} bytes, got ${String(value.length)}`,
        2,
      );
    }
    this.push(FIELDS.string, value);
  }

  /**
   * Writes an unsigned 16-bit integer in two bytes.
   * @param value - The value, from 0 to 65,535.
   * @throws When the value is outside that range, or NaN, at the calling
   * line: `reforged-ts: writeUInt16 takes 0 to 65535, got <value>`.
   */
  public writeUInt16(value: number): void {
    this.checkRange("writeUInt16", FIELDS.uint16, value);
    this.push(FIELDS.uint16, value);
  }

  /**
   * Writes an unsigned 32-bit integer in four bytes, the range `readUInt32`
   * returns.
   *
   * @remarks
   * Integer width diverges here. The game's Lua has 32-bit integers: a value
   * above 2^31 - 1 is a float there, which the unsigned four-byte field of
   * `string.pack` rejects, and `string.unpack` of that field wraps it to a
   * negative integer. The test VM has 64-bit integers, where both stay
   * positive. So the value is packed through the signed four-byte field,
   * shifted down by 2^32 above 2^31 - 1, and `readUInt32` shifts it back up:
   * the same bytes as the unsigned field, by the same arithmetic on both
   * widths. This is the one place the library handles integer width.
   * @param value - The value, from 0 to 2^32 - 1.
   * @throws When the value is outside that range, or NaN, at the calling
   * line: `reforged-ts: writeUInt32 takes 0 to 4294967295, got <value>`.
   */
  public writeUInt32(value: number): void {
    this.checkRange("writeUInt32", FIELDS.uint32, value);
    this.push(
      FIELDS.uint32,
      value >= UINT32_SIGNED_LIMIT ? value - UINT32_MODULUS : value,
    );
  }

  /**
   * Writes an unsigned 8-bit integer in one byte.
   * @param value - The value, from 0 to 255.
   * @throws When the value is outside that range, or NaN, at the calling
   * line: `reforged-ts: writeUInt8 takes 0 to 255, got <value>`.
   */
  public writeUInt8(value: number): void {
    this.checkRange("writeUInt8", FIELDS.uint8, value);
    this.push(FIELDS.uint8, value);
  }

  /**
   * Throws, pointing at the caller of `method`, when `value` is outside the
   * integer field's range, NaN included.
   */
  private checkRange(
    method: string,
    field: Required<BinaryField>,
    value: number,
  ): void {
    if (!(value >= field.min && value <= field.max)) {
      error(
        `reforged-ts: ${method} takes ${String(field.min)} to ${String(field.max)}, got ${String(value)}`,
        3,
      );
    }
  }

  private push(field: BinaryField, value: string | number): void {
    this.format += field.format;
    this.values.push(value);
  }
}
