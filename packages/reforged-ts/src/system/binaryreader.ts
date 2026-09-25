/** @noSelfInFile */

import {
  type BinaryField,
  BYTE_ORDER,
  Fields,
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
export class BinaryReader {
  /** The binary string read. */
  private readonly data: string;

  /** The position of the next byte, from one, as `string.unpack` takes it. */
  private next = 1;

  constructor(binaryString: string) {
    this.data = binaryString;
  }

  /** The number of bytes read so far: the offset of the next byte, from zero. */
  public get position(): number {
    return this.next - 1;
  }

  /** The number of bytes left to read. */
  public get remaining(): number {
    return this.data.length - this.position;
  }

  /** Reads a double-precision float, the lossless pair of `writeDouble`. */
  public readDouble(): number {
    const value = this.read("readDouble", Fields.double) as number;
    return value;
  }

  /**
   * Reads a single-precision float: the value `writeFloat` wrote, rounded to
   * single precision. `readDouble` is the lossless pair.
   */
  public readFloat(): number {
    const value = this.read("readFloat", Fields.float) as number;
    return value;
  }

  /** Reads a signed 16-bit integer. */
  public readInt16(): number {
    const value = this.read("readInt16", Fields.int16) as number;
    return value;
  }

  /** Reads a signed 32-bit integer, from -2^31 to 2^31 - 1. */
  public readInt32(): number {
    const value = this.read("readInt32", Fields.int32) as number;
    return value;
  }

  /** Reads a signed 8-bit integer. */
  public readInt8(): number {
    const value = this.read("readInt8", Fields.int8) as number;
    return value;
  }

  /**
   * Reads a string by its two-byte length prefix, so it comes back byte for
   * byte, zero bytes included.
   */
  public readString(): string {
    const value = this.read("readString", Fields.string) as string;
    return value;
  }

  /** Reads an unsigned 16-bit integer. */
  public readUInt16(): number {
    const value = this.read("readUInt16", Fields.uint16) as number;
    return value;
  }

  /**
   * Reads an unsigned 32-bit integer, from 0 to 2^32 - 1 whatever the integer
   * width (see `BinaryWriter.writeUInt32`): a value above 2^31 - 1 comes back
   * as a float in the game, whose integers are 32-bit, and as an integer on
   * the 64-bit test VM, equal either way.
   */
  public readUInt32(): number {
    const value = this.read("readUInt32", Fields.uint32) as number;
    return value < 0 ? value + UINT32_MODULUS : value;
  }

  /** Reads an unsigned 8-bit integer. */
  public readUInt8(): number {
    const value = this.read("readUInt8", Fields.uint8) as number;
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
    if (field !== Fields.string) {
      return string.packsize(BYTE_ORDER + field.format);
    }
    const prefix = string.packsize(BYTE_ORDER + Fields.stringLength.format);
    if (prefix > this.remaining) {
      return prefix;
    }
    const [length] = unpackField(
      BYTE_ORDER + Fields.stringLength.format,
      this.data,
      this.next,
    );
    return prefix + (length as number);
  }
}
