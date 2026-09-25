/** @noSelfInFile */

// The one width table of the binary System: the writer appends each field's
// format to its format string and the reader unpacks the same format, so the
// two cannot disagree. Internal; the System's public surface is the typed
// methods of BinaryReader and BinaryWriter.

/** Every field is big-endian. */
export const BYTE_ORDER = ">";

/** A field of the binary format: its `string.pack` format, without the byte order. */
export interface BinaryField {
  readonly format: string;
  /** The smallest value an integer field packs. */
  readonly min?: number;
  /** The largest value an integer field packs, or the longest string, in bytes. */
  readonly max?: number;
}

/**
 * 2^32, the modulus of the unsigned 32-bit normalization. Written as a decimal
 * literal on purpose: Lua reads it as an integer where integers are 64-bit
 * (the test VM) and as a float where they are 32-bit (the game).
 */
export const UINT32_MODULUS = 4294967296;

/** 2^31, the first unsigned 32-bit value the signed four-byte field cannot hold. */
export const UINT32_SIGNED_LIMIT = 2147483648;

/**
 * `string.unpack`, typed for one field: the value, then the position of the
 * byte after it.
 */
export const unpackField = string.unpack as (
  format: string,
  data: string,
  position: number,
) => LuaMultiReturn<[unknown, number]>;

/** The fields, one per typed method pair of the reader and the writer. */
export const Fields = {
  int8: { format: "i1", min: -128, max: 127 },
  uint8: { format: "I1", min: 0, max: 255 },
  int16: { format: "i2", min: -32768, max: 32767 },
  uint16: { format: "I2", min: 0, max: 65535 },
  int32: { format: "i4", min: -2147483648, max: 2147483647 },
  // Packed through the signed four-byte field, shifted by UINT32_MODULUS above
  // 2^31 - 1: the same bytes as an unsigned field, and the same arithmetic
  // whatever the integer width (see BinaryWriter.writeUInt32).
  uint32: { format: "i4", min: 0, max: 4294967295 },
  float: { format: "f" },
  double: { format: "d" },
  // A string is its length in two bytes, then its bytes, so any byte survives,
  // zero included; stringLength is that prefix alone.
  string: { format: "s2", max: 65535 },
  stringLength: { format: "I2" },
} as const satisfies Record<string, BinaryField>;
