/** @noSelfInFile */

import {
  type BinaryField,
  BYTE_ORDER,
  FIELDS,
  UINT32_MODULUS,
  unpackField,
} from "./binaryformat";

/**
 * Reads primitive types from a binary string a {@link BinaryWriter} packed, in
 * the order they were written.
 *
 * Every read advances the reader by exactly the bytes it consumed, as
 * `string.unpack` reports them, and reading past the end throws with the
 * position and the width the read needed.
 *
 * @remarks
 * Two changes from w3ts:
 * - Every `readX` advances by exactly what it consumed, so `readDouble` no
 *   longer misaligns the values after it, and a read past the end throws
 *   `reforged-ts: <readX> past the end: position <P>, width <W>, <R> remaining`
 *   instead of returning 0 or garbage.
 * - Strings are length-prefixed: data written with w3ts's zero-terminated
 *   strings does not read back.
 *
 * @example
 * {@includeCode ../../examples/harness/binary-round-trip.ts}
 */
export class BinaryReader {
  /** The binary string read. */
  private readonly data: string;

  /** The position of the next byte, from one, as `string.unpack` takes it. */
  private next = 1;

  /**
   * Makes a reader positioned at the first byte of `binaryString`.
   * @param binaryString - The binary string to read, as
   * {@link BinaryWriter.toString} packed it.
   */
  constructor(binaryString: string) {
    this.data = binaryString;
  }

  /**
   * The number of bytes read so far: the offset of the next byte, from zero.
   * @returns The byte count, from 0 to the length of the string.
   */
  public get position(): number {
    return this.next - 1;
  }

  /**
   * The number of bytes left to read.
   * @returns The byte count; 0 once everything was read.
   */
  public get remaining(): number {
    return this.data.length - this.position;
  }

  /**
   * Reads a double-precision float, the lossless pair of `writeDouble`.
   * @remarks
   * Advances by exactly its eight bytes: in w3ts it misaligned every value
   * read after it.
   * @returns The value, exactly as written.
   * @throws When fewer than eight bytes remain, at the calling line:
   * `reforged-ts: readDouble past the end: position <P>, width 8, <R> remaining`.
   */
  public readDouble(): number {
    const value = this.read("readDouble", FIELDS.double) as number;
    return value;
  }

  /**
   * Reads a single-precision float. `readDouble` is the lossless pair.
   * @returns The value `writeFloat` wrote, rounded to single precision.
   * @throws When fewer than four bytes remain, at the calling line:
   * `reforged-ts: readFloat past the end: position <P>, width 4, <R> remaining`.
   */
  public readFloat(): number {
    const value = this.read("readFloat", FIELDS.float) as number;
    return value;
  }

  /**
   * Reads a signed 16-bit integer.
   * @returns The value, from -32,768 to 32,767.
   * @throws When fewer than two bytes remain, at the calling line:
   * `reforged-ts: readInt16 past the end: position <P>, width 2, <R> remaining`.
   */
  public readInt16(): number {
    const value = this.read("readInt16", FIELDS.int16) as number;
    return value;
  }

  /**
   * Reads a signed 32-bit integer.
   * @returns The value, from -2^31 to 2^31 - 1.
   * @throws When fewer than four bytes remain, at the calling line:
   * `reforged-ts: readInt32 past the end: position <P>, width 4, <R> remaining`.
   */
  public readInt32(): number {
    const value = this.read("readInt32", FIELDS.int32) as number;
    return value;
  }

  /**
   * Reads a signed 8-bit integer.
   * @returns The value, from -128 to 127.
   * @throws When no byte remains, at the calling line:
   * `reforged-ts: readInt8 past the end: position <P>, width 1, 0 remaining`.
   */
  public readInt8(): number {
    const value = this.read("readInt8", FIELDS.int8) as number;
    return value;
  }

  /**
   * Reads a string by its two-byte length prefix, so it comes back byte for
   * byte, zero bytes included.
   * @remarks
   * The format is length-prefixed, where w3ts wrote zero-terminated strings:
   * data written that way does not read back.
   * @returns The string `writeString` wrote.
   * @throws When fewer bytes remain than the prefix and the length it states,
   * at the calling line:
   * `reforged-ts: readString past the end: position <P>, width <W>, <R> remaining`.
   */
  public readString(): string {
    const value = this.read("readString", FIELDS.string) as string;
    return value;
  }

  /**
   * Reads an unsigned 16-bit integer.
   * @returns The value, from 0 to 65,535.
   * @throws When fewer than two bytes remain, at the calling line:
   * `reforged-ts: readUInt16 past the end: position <P>, width 2, <R> remaining`.
   */
  public readUInt16(): number {
    const value = this.read("readUInt16", FIELDS.uint16) as number;
    return value;
  }

  /**
   * Reads an unsigned 32-bit integer, whatever the integer width (see
   * `BinaryWriter.writeUInt32`).
   * @returns The value, from 0 to 2^32 - 1: one above 2^31 - 1 comes back
   * as a float in the game, whose integers are 32-bit, and as an integer on
   * the 64-bit test VM, equal either way.
   * @throws When fewer than four bytes remain, at the calling line:
   * `reforged-ts: readUInt32 past the end: position <P>, width 4, <R> remaining`.
   */
  public readUInt32(): number {
    const value = this.read("readUInt32", FIELDS.uint32) as number;
    return value < 0 ? value + UINT32_MODULUS : value;
  }

  /**
   * Reads an unsigned 8-bit integer.
   * @returns The value, from 0 to 255.
   * @throws When no byte remains, at the calling line:
   * `reforged-ts: readUInt8 past the end: position <P>, width 1, 0 remaining`.
   */
  public readUInt8(): number {
    const value = this.read("readUInt8", FIELDS.uint8) as number;
    return value;
  }

  /**
   * Unpacks one field at the next byte and advances by what `string.unpack`
   * consumed; throws, pointing at the caller of `method`, when fewer bytes
   * remain than the field needs. The typed methods keep their call out of
   * tail position (a local, then its return), since a Lua tail call would drop
   * their frame and move the error's level.
   */
  private read(method: string, field: BinaryField): unknown {
    const width = this.widthOf(field);
    if (width > this.remaining) {
      error(
        `reforged-ts: ${method} past the end: position ${String(this.position)}, width ${String(width)}, ${String(this.remaining)} remaining`,
        3,
      );
    }
    const [value, next] = unpackField(
      BYTE_ORDER + field.format,
      this.data,
      this.next,
    );
    this.next = next;
    return value;
  }

  /**
   * The bytes `field` needs at the next byte: its packed size, or for a string
   * its length prefix and, once the prefix is there, the length it states.
   */
  private widthOf(field: BinaryField): number {
    if (field !== FIELDS.string) {
      return string.packsize(BYTE_ORDER + field.format);
    }
    const prefix = string.packsize(BYTE_ORDER + FIELDS.stringLength.format);
    if (prefix > this.remaining) {
      return prefix;
    }
    const [length] = unpackField(
      BYTE_ORDER + FIELDS.stringLength.format,
      this.data,
      this.next,
    );
    return prefix + (length as number);
  }
}
