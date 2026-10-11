# Interface: DestructableOptions

Defined in: [handles/destructable.ts:12](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/destructable.ts#L12)

The options of `Destructable.create`. `typeId`, `x` and `y` are required;
each other option left out keeps its default, and each of `dead`, `z`,
`pitch` or `roll`, `skin` and `color` given picks the creation Native that
takes it.

## Properties

### color?

> `readonly` `optional` **color?**: `playercolor`

Defined in: [handles/destructable.ts:40](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/destructable.ts#L40)

The team colour of the model.

***

### dead?

> `readonly` `optional` **dead?**: `boolean`

Defined in: [handles/destructable.ts:42](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/destructable.ts#L42)

Creates the destructable dead when true; alive by default.

***

### face?

> `readonly` `optional` **face?**: `number`

Defined in: [handles/destructable.ts:25](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/destructable.ts#L25)

The facing, in degrees; 0 by default.

***

### pitch?

> `readonly` `optional` **pitch?**: `number`

Defined in: [handles/destructable.ts:31](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/destructable.ts#L31)

The pitch; 0 when only `roll` is given.

***

### roll?

> `readonly` `optional` **roll?**: `number`

Defined in: [handles/destructable.ts:33](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/destructable.ts#L33)

The roll; 0 when only `pitch` is given.

***

### scale?

> `readonly` `optional` **scale?**: `number`

Defined in: [handles/destructable.ts:27](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/destructable.ts#L27)

The X-Y-Z scale; 1 by default.

***

### skin?

> `readonly` `optional` **skin?**: `Rawcode`\<`"destructable"`\>

Defined in: [handles/destructable.ts:38](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/destructable.ts#L38)

The skin's rawcode, a destructable type's, such as the Summer Tree
Wall's, `FourCC("LTlt")`; left out, the type's own model.

***

### typeId

> `readonly` **typeId**: `Rawcode`\<`"destructable"`\>

Defined in: [handles/destructable.ts:17](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/destructable.ts#L17)

The destructable type's rawcode, such as the Summer Tree Wall's,
`FourCC("LTlt")`.

***

### variation?

> `readonly` `optional` **variation?**: `number`

Defined in: [handles/destructable.ts:29](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/destructable.ts#L29)

The model variation; 0 by default.

***

### x

> `readonly` **x**: `number`

Defined in: [handles/destructable.ts:19](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/destructable.ts#L19)

The x-coordinate, in world units.

***

### y

> `readonly` **y**: `number`

Defined in: [handles/destructable.ts:21](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/destructable.ts#L21)

The y-coordinate, in world units.

***

### z?

> `readonly` `optional` **z?**: `number`

Defined in: [handles/destructable.ts:23](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/destructable.ts#L23)

The z-coordinate; left out, the game places it on the ground.
