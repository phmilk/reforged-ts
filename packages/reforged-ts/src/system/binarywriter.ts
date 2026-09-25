/** @noSelfInFile */

import {
  type BinaryField,
  BYTE_ORDER,
  Fields,
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
 * @example
 * ```ts
 * // Write the values
 * const writer = new BinaryWriter();
 * writer.writeUInt8(5);
 * writer.writeUInt32(12345678);
 * writer.writeDouble(0.1);
 * writer.writeString("hello");
 * writer.writeUInt16(45000);
 *
 * // Read the values
 * const reader = new BinaryReader(writer.toString());
 * reader.readUInt8(); // 5
 * reader.readUInt32(); // 12345678
 * reader.readDouble(); // 0.1
 * reader.readString(); // hello
 * reader.readUInt16(); // 45000
 * reader.remaining; // 0
 * ```
 */
export class BinaryWriter {
  private format = BYTE_ORDER;

  private readonly values: (string | number)[] = [];

  /** Packs the values written so far into a binary string. */
  public toString(): string {
    return string.pack(this.format, ...this.values);
  }

  /**
   * Writes a double-precision float in eight bytes, the lossless pair of
   * `readDouble`.
   */
  public writeDouble(value: number): void {
    this.push(Fields.double, value);
  }

  /**
   * Writes a single-precision float in four bytes, so the value is rounded to
   * single precision. `writeDouble` is the lossless pair.
   */
  public writeFloat(value: number): void {
    this.push(Fields.float, value);
  }

  /** Writes a signed 16-bit integer, from -32,768 to 32,767. */
  public writeInt16(value: number): void {
    this.checkRange("writeInt16", Fields.int16, value);
    this.push(Fields.int16, value);
  }

  /** Writes a signed 32-bit integer, from -2^31 to 2^31 - 1. */
  public writeInt32(value: number): void {
    this.checkRange("writeInt32", Fields.int32, value);
    this.push(Fields.int32, value);
  }

  /** Writes a signed 8-bit integer, from -128 to 127. */
  public writeInt8(value: number): void {
    this.checkRange("writeInt8", Fields.int8, value);
    this.push(Fields.int8, value);
  }

  /**
   * Writes a string as a two-byte length prefix and its bytes, so any byte
   * survives, zero included. Throws for a string longer than 65,535 bytes.
   */
  public writeString(value: string): void {
    if (value.length > Fields.string.max) {
      error(
        `reforged-ts: writeString takes at most ${String(Fields.string.max)} bytes, got ${String(value.length)}`,
        2,
      );
    }
    this.push(Fields.string, value);
  }

  /** Writes an unsigned 16-bit integer, from 0 to 65,535. */
  public writeUInt16(value: number): void {
    this.checkRange("writeUInt16", Fields.uint16, value);
    this.push(Fields.uint16, value);
  }

  /**
   * Writes an unsigned 32-bit integer, from 0 to 2^32 - 1, the range
   * `readUInt32` returns.
   *
   * Integer width diverges here. The game's Lua has 32-bit integers: a value
   * above 2^31 - 1 is a float there, which the unsigned four-byte field of
   * `string.pack` rejects, and `string.unpack` of that field wraps it to a
   * negative integer. The test VM has 64-bit integers, where both stay
   * positive. So the value is packed through the signed four-byte field,
   * shifted down by 2^32 above 2^31 - 1, and `readUInt32` shifts it back up:
   * the same bytes as the unsigned field, by the same arithmetic on both
   * widths. This is the one place the library handles integer width.
   */
  public writeUInt32(value: number): void {
    this.checkRange("writeUInt32", Fields.uint32, value);
    this.push(
      Fields.uint32,
      value >= UINT32_SIGNED_LIMIT ? value - UINT32_MODULUS : value,
    );
  }

  /** Writes an unsigned 8-bit integer, from 0 to 255. */
  public writeUInt8(value: number): void {
    this.checkRange("writeUInt8", Fields.uint8, value);
    this.push(Fields.uint8, value);
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
