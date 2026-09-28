# Type Alias: NumberRange\<F, T\>

> **NumberRange**\<`F`, `T`\> = `Exclude`\<`Enumerate`\<`T`\>, `Enumerate`\<`F`\>\>

Defined in: [utils/color.ts:248](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/utils/color.ts#L248)

The integers from `F` up to `T`, `T` excluded, as a union of number
literals: `NumberRange<0, 3>` is `0 | 1 | 2`.

## Type Parameters

### F

`F` *extends* `number`

The first integer, included.

### T

`T` *extends* `number`

The end of the range, excluded.
