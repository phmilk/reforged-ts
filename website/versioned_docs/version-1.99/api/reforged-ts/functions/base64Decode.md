# Function: base64Decode()

> **base64Decode**(`input`): `string`

Defined in: [system/base64.ts:69](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/system/base64.ts#L69)

Decodes a base64 string (RFC 4648, with padding) back to its bytes.

## Parameters

### input

`string`

The base64 string to decode.

## Returns

`string`

The decoded bytes, one character of the string per byte.

## Remarks

Malformed input throws, where w3ts printed `'base64Decode' failed: ...`
and returned an empty string, which a caller could not tell from an empty
payload.

## Throws

When the input is malformed, at the calling line, with one message
per case, the offset counted from zero:
- a length that is not a multiple of four:
  `reforged-ts: base64Decode input length <length> is not a multiple of four`;
- a character outside the alphabet:
  `reforged-ts: base64Decode input has a character outside the alphabet at offset <offset>`;
- padding anywhere but the last one or two characters:
  `reforged-ts: base64Decode input has padding in the wrong place at offset <offset>`.
