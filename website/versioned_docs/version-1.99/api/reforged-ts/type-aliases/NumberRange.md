# Type Alias: NumberRange\<F, T\>

> **NumberRange**\<`F`, `T`\> = `Exclude`\<`Enumerate`\<`T`\>, `Enumerate`\<`F`\>\>

Defined in: [utils/color.ts:242](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/utils/color.ts#L242)

The integers from `F` up to `T`, `T` excluded, as a union of number
literals: `NumberRange<0, 3>` is `0 | 1 | 2`.

## Type Parameters

### F

`F` *extends* `number`

The first integer, included.

### T

`T` *extends* `number`

The end of the range, excluded.
