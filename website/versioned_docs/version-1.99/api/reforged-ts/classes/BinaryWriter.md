# Class: BinaryWriter

Defined in: [system/binarywriter.ts:30](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/system/binarywriter.ts#L30)

Packs primitive types into a binary string, for a [BinaryReader](BinaryReader.md) to
read back in the same order.

The values accumulate until `toString` packs them. A value outside its
integer width's range, or a string longer than 65,535 bytes, throws at the
write that gave it.

## Remarks

Two changes from w3ts:
- Every integer `writeX`, `writeInt32` included, throws
  `reforged-ts: <writeX> takes <min> to <max>, got <value>` for a value its
  width cannot hold, and for NaN, at the call that writes it.
- Strings are length-prefixed, so any byte, a zero included, round-trips:
  w3ts's zero-terminated strings do not read back.

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

> **new BinaryWriter**(): `BinaryWriter`

#### Returns

`BinaryWriter`

## Methods

### toString()

> **toString**(): `string`

Defined in: [system/binarywriter.ts:39](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/system/binarywriter.ts#L39)

Packs the values written so far into a binary string.

#### Returns

`string`

The binary string, big-endian, for a [BinaryReader](BinaryReader.md).

***

### writeDouble()

> **writeDouble**(`value`): `void`

Defined in: [system/binarywriter.ts:48](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/system/binarywriter.ts#L48)

Writes a double-precision float in eight bytes, the lossless pair of
`readDouble`.

#### Parameters

##### value

`number`

Any number, read back exactly.

#### Returns

`void`

***

### writeFloat()

> **writeFloat**(`value`): `void`

Defined in: [system/binarywriter.ts:58](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/system/binarywriter.ts#L58)

Writes a single-precision float in four bytes, so the value is rounded to
single precision. `writeDouble` is the lossless pair.

#### Parameters

##### value

`number`

Any number; `readFloat` gives back its nearest
single-precision value.

#### Returns

`void`

***

### writeInt16()

> **writeInt16**(`value`): `void`

Defined in: [system/binarywriter.ts:68](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/system/binarywriter.ts#L68)

Writes a signed 16-bit integer in two bytes.

#### Parameters

##### value

`number`

The value, from -32,768 to 32,767.

#### Returns

`void`

#### Throws

When the value is outside that range, or NaN, at the calling
line: `reforged-ts: writeInt16 takes -32768 to 32767, got <value>`.

***

### writeInt32()

> **writeInt32**(`value`): `void`

Defined in: [system/binarywriter.ts:79](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/system/binarywriter.ts#L79)

Writes a signed 32-bit integer in four bytes.

#### Parameters

##### value

`number`

The value, from -2^31 to 2^31 - 1.

#### Returns

`void`

#### Throws

When the value is outside that range, or NaN, at the calling
line: `reforged-ts: writeInt32 takes -2147483648 to 2147483647, got <value>`.

***

### writeInt8()

> **writeInt8**(`value`): `void`

Defined in: [system/binarywriter.ts:90](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/system/binarywriter.ts#L90)

Writes a signed 8-bit integer in one byte.

#### Parameters

##### value

`number`

The value, from -128 to 127.

#### Returns

`void`

#### Throws

When the value is outside that range, or NaN, at the calling
line: `reforged-ts: writeInt8 takes -128 to 127, got <value>`.

***

### writeString()

> **writeString**(`value`): `void`

Defined in: [system/binarywriter.ts:104](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/system/binarywriter.ts#L104)

Writes a string as a two-byte length prefix and its bytes, so any byte
survives, zero included.

#### Parameters

##### value

`string`

The string, at most 65,535 bytes.

#### Returns

`void`

#### Remarks

The format is length-prefixed, where w3ts wrote zero-terminated strings.

#### Throws

When the string is longer, at the calling line:
`reforged-ts: writeString takes at most 65535 bytes, got <length>`.

***

### writeUInt16()

> **writeUInt16**(`value`): `void`

Defined in: [system/binarywriter.ts:120](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/system/binarywriter.ts#L120)

Writes an unsigned 16-bit integer in two bytes.

#### Parameters

##### value

`number`

The value, from 0 to 65,535.

#### Returns

`void`

#### Throws

When the value is outside that range, or NaN, at the calling
line: `reforged-ts: writeUInt16 takes 0 to 65535, got <value>`.

***

### writeUInt32()

> **writeUInt32**(`value`): `void`

Defined in: [system/binarywriter.ts:142](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/system/binarywriter.ts#L142)

Writes an unsigned 32-bit integer in four bytes, the range `readUInt32`
returns.

#### Parameters

##### value

`number`

The value, from 0 to 2^32 - 1.

#### Returns

`void`

#### Remarks

Integer width diverges here. The game's Lua has 32-bit integers: a value
above 2^31 - 1 is a float there, which the unsigned four-byte field of
`string.pack` rejects, and `string.unpack` of that field wraps it to a
negative integer. The test VM has 64-bit integers, where both stay
positive. So the value is packed through the signed four-byte field,
shifted down by 2^32 above 2^31 - 1, and `readUInt32` shifts it back up:
the same bytes as the unsigned field, by the same arithmetic on both
widths. This is the one place the library handles integer width.

#### Throws

When the value is outside that range, or NaN, at the calling
line: `reforged-ts: writeUInt32 takes 0 to 4294967295, got <value>`.

***

### writeUInt8()

> **writeUInt8**(`value`): `void`

Defined in: [system/binarywriter.ts:156](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/system/binarywriter.ts#L156)

Writes an unsigned 8-bit integer in one byte.

#### Parameters

##### value

`number`

The value, from 0 to 255.

#### Returns

`void`

#### Throws

When the value is outside that range, or NaN, at the calling
line: `reforged-ts: writeUInt8 takes 0 to 255, got <value>`.
