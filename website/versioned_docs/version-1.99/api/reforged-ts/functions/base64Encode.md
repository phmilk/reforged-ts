# Function: base64Encode()

> **base64Encode**(`input`): `string`

Defined in: [system/base64.ts:34](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/system/base64.ts#L34)

Encodes a byte string to base64 (RFC 4648, with padding).

## Parameters

### input

`string`

The byte string to encode: any bytes, zero bytes and bytes
that are not UTF-8 included.

## Returns

`string`

The base64 text, four characters per three bytes.
