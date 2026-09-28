# Enumeration: ImageType

Defined in: [handles/image.ts:9](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/image.ts#L9)

The layers an image is drawn in, which decide which images cover others;
the game takes them as integers from 1 to 4.

## Enumeration Members

### Indicator

> **Indicator**: `2`

Defined in: [handles/image.ts:17](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/image.ts#L17)

Over Ubersplat; under Selection and OcclusionMask.

***

### OcclusionMask

> **OcclusionMask**: `3`

Defined in: [handles/image.ts:21](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/image.ts#L21)

Over Ubersplat and Indicator; under Selection.

***

### Selection

> **Selection**: `1`

Defined in: [handles/image.ts:13](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/image.ts#L13)

The top layer, over every other type.

***

### Ubersplat

> **Ubersplat**: `4`

Defined in: [handles/image.ts:26](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/image.ts#L26)

The bottom layer, under every other type. The time of day and the fog of
war tint the images of this layer too.
