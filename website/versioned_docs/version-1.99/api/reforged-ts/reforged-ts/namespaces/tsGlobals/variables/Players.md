# Variable: Players

> `const` **Players**: [`MapPlayer`](../../../../classes/MapPlayer.md)[] = `[]`

Defined in: [globals/index.ts:18](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/globals/index.ts#L18)

The `MapPlayer` of every player slot, `Players[i]` for slot `i`, from 0 to
`bj_MAX_PLAYER_SLOTS - 1`, the neutral slots included.

## Remarks

Empty until the `globals` stage: the library fills it after `InitGlobals`,
before any [Init.onGlobals](../../../../interfaces/InitStages.md#onglobals) callback of the Map
project. Read it from `Init.onGlobals` or a later stage, never at module top
level, where it holds nothing. In w3ts 3.x it was filled when the library
loaded.
