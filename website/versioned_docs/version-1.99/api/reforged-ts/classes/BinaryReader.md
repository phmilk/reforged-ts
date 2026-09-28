# Class: BinaryReader

Defined in: [system/binaryreader.ts:31](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/system/binaryreader.ts#L31)

Reads primitive types from a binary string a [BinaryWriter](BinaryWriter.md) packed, in
the order they were written.

Every read advances the reader by exactly the bytes it consumed, as
`string.unpack` reports them, and reading past the end throws with the
position and the width the read needed.

## Remarks

Two changes from w3ts:
- Every `readX` advances by exactly what it consumed, so `readDouble` no
  longer misaligns the values after it, and a read past the end throws
  `reforged-ts: <readX> past the end: position <P>, width <W>, <R> remaining`
  instead of returning 0 or garbage.
- Strings are length-prefixed: data written with w3ts's zero-terminated
  strings does not read back.

## Example

```ts
// Values packed into one binary string and read back in the order they were
// written: each read returns what the matching write took.
import { BinaryReader, BinaryWriter } from "reforged-ts";

const writer = new BinaryWriter();
writer.writeUInt8(5);
writer.writeUInt32(12345678);
writer.writeDouble(0.1);
writer.writeString("hello");
writer.writeUInt16(45000);

const reader = new BinaryReader(writer.toString());
print(reader.readUInt8()); // 5
print(reader.readUInt32()); // 12345678
print(reader.readDouble()); // 0.1
print(reader.readString()); // hello
print(reader.readUInt16()); // 45000
print(reader.remaining); // 0
```

## Constructors

### Constructor

> **new BinaryReader**(`binaryString`): `BinaryReader`

Defined in: [system/binaryreader.ts:43](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/system/binaryreader.ts#L43)

Makes a reader positioned at the first byte of `binaryString`.

#### Parameters

##### binaryString

`string`

The binary string to read, as
[BinaryWriter.toString](BinaryWriter.md#tostring) packed it.

#### Returns

`BinaryReader`

## Accessors

### position

#### Get Signature

> **get** **position**(): `number`

Defined in: [system/binaryreader.ts:51](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/system/binaryreader.ts#L51)

The number of bytes read so far: the offset of the next byte, from zero.

##### Returns

`number`

The byte count, from 0 to the length of the string.

***

### remaining

#### Get Signature

> **get** **remaining**(): `number`

Defined in: [system/binaryreader.ts:59](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/system/binaryreader.ts#L59)

The number of bytes left to read.

##### Returns

`number`

The byte count; 0 once everything was read.

## Methods

### readDouble()

> **readDouble**(): `number`

Defined in: [system/binaryreader.ts:72](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/system/binaryreader.ts#L72)

Reads a double-precision float, the lossless pair of `writeDouble`.

#### Returns

`number`

The value, exactly as written.

#### Remarks

Advances by exactly its eight bytes: in w3ts it misaligned every value
read after it.

#### Throws

When fewer than eight bytes remain, at the calling line:
`reforged-ts: readDouble past the end: position <P>, width 8, <R> remaining`.

***

### readFloat()

> **readFloat**(): `number`

Defined in: [system/binaryreader.ts:83](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/system/binaryreader.ts#L83)

Reads a single-precision float. `readDouble` is the lossless pair.

#### Returns

`number`

The value `writeFloat` wrote, rounded to single precision.

#### Throws

When fewer than four bytes remain, at the calling line:
`reforged-ts: readFloat past the end: position <P>, width 4, <R> remaining`.

***

### readInt16()

> **readInt16**(): `number`

Defined in: [system/binaryreader.ts:94](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/system/binaryreader.ts#L94)

Reads a signed 16-bit integer.

#### Returns

`number`

The value, from -32,768 to 32,767.

#### Throws

When fewer than two bytes remain, at the calling line:
`reforged-ts: readInt16 past the end: position <P>, width 2, <R> remaining`.

***

### readInt32()

> **readInt32**(): `number`

Defined in: [system/binaryreader.ts:105](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/system/binaryreader.ts#L105)

Reads a signed 32-bit integer.

#### Returns

`number`

The value, from -2^31 to 2^31 - 1.

#### Throws

When fewer than four bytes remain, at the calling line:
`reforged-ts: readInt32 past the end: position <P>, width 4, <R> remaining`.

***

### readInt8()

> **readInt8**(): `number`

Defined in: [system/binaryreader.ts:116](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/system/binaryreader.ts#L116)

Reads a signed 8-bit integer.

#### Returns

`number`

The value, from -128 to 127.

#### Throws

When no byte remains, at the calling line:
`reforged-ts: readInt8 past the end: position <P>, width 1, 0 remaining`.

***

### readString()

> **readString**(): `string`

Defined in: [system/binaryreader.ts:132](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/system/binaryreader.ts#L132)

Reads a string by its two-byte length prefix, so it comes back byte for
byte, zero bytes included.

#### Returns

`string`

The string `writeString` wrote.

#### Remarks

The format is length-prefixed, where w3ts wrote zero-terminated strings:
data written that way does not read back.

#### Throws

When fewer bytes remain than the prefix and the length it states,
at the calling line:
`reforged-ts: readString past the end: position <P>, width <W>, <R> remaining`.

***

### readUInt16()

> **readUInt16**(): `number`

Defined in: [system/binaryreader.ts:143](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/system/binaryreader.ts#L143)

Reads an unsigned 16-bit integer.

#### Returns

`number`

The value, from 0 to 65,535.

#### Throws

When fewer than two bytes remain, at the calling line:
`reforged-ts: readUInt16 past the end: position <P>, width 2, <R> remaining`.

***

### readUInt32()

> **readUInt32**(): `number`

Defined in: [system/binaryreader.ts:157](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/system/binaryreader.ts#L157)

Reads an unsigned 32-bit integer, whatever the integer width (see
`BinaryWriter.writeUInt32`).

#### Returns

`number`

The value, from 0 to 2^32 - 1: one above 2^31 - 1 comes back
as a float in the game, whose integers are 32-bit, and as an integer on
the 64-bit test VM, equal either way.

#### Throws

When fewer than four bytes remain, at the calling line:
`reforged-ts: readUInt32 past the end: position <P>, width 4, <R> remaining`.

***

### readUInt8()

> **readUInt8**(): `number`

Defined in: [system/binaryreader.ts:168](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/system/binaryreader.ts#L168)

Reads an unsigned 8-bit integer.

#### Returns

`number`

The value, from 0 to 255.

#### Throws

When no byte remains, at the calling line:
`reforged-ts: readUInt8 past the end: position <P>, width 1, 0 remaining`.
