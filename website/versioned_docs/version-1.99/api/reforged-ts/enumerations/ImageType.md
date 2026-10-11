# Enumeration: ImageType

Defined in: [handles/image.ts:11](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/image.ts#L11)

The layers an image is drawn in, which decide which images cover others;
the game takes them as integers from 1 to 4.

## Enumeration Members

### Indicator

> **Indicator**: `2`

Defined in: [handles/image.ts:19](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/image.ts#L19)

Over Ubersplat; under Selection and OcclusionMask.

***

### OcclusionMask

> **OcclusionMask**: `3`

Defined in: [handles/image.ts:23](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/image.ts#L23)

Over Ubersplat and Indicator; under Selection.

***

### Selection

> **Selection**: `1`

Defined in: [handles/image.ts:15](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/image.ts#L15)

The top layer, over every other type.

***

### Ubersplat

> **Ubersplat**: `4`

Defined in: [handles/image.ts:28](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/image.ts#L28)

The bottom layer, under every other type. The time of day and the fog of
war tint the images of this layer too.
