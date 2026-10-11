# Interface: ReforgedOptions

Defined in: [reforged/index.ts:42](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/reforged/index.ts#L42)

What `Reforged.configure` takes. The Template's generated environment
object can be passed as is: fields other than `devMode` and
`damageDepthLimit` are ignored.

## Properties

### damageDepthLimit?

> `readonly` `optional` **damageDepthLimit?**: `number`

Defined in: [reforged/index.ts:52](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/reforged/index.ts#L52)

How many nested damage dispatches Dev mode allows before
`Unit.damageTarget` raises: the damage handlers running inside one
another may exceed it by none. Absent keeps the current limit: eight
until a call sets another. Read when damage is dealt, so a change
applies at once.

***

### devMode?

> `readonly` `optional` **devMode?**: `boolean`

Defined in: [reforged/index.ts:44](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/reforged/index.ts#L44)

Whether the library runs in Dev mode. Absent means off.
