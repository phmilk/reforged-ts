# Interface: DestructableOptions

Defined in: [handles/destructable.ts:12](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/destructable.ts#L12)

The options of `Destructable.create`. `typeId`, `x` and `y` are required;
each other option left out keeps its default, and each of `dead`, `z`,
`pitch` or `roll`, `skin` and `color` given picks the creation Native that
takes it.

## Properties

### color?

> `readonly` `optional` **color?**: `playercolor`

Defined in: [handles/destructable.ts:34](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/destructable.ts#L34)

The team colour of the model.

***

### dead?

> `readonly` `optional` **dead?**: `boolean`

Defined in: [handles/destructable.ts:36](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/destructable.ts#L36)

Creates the destructable dead when true; alive by default.

***

### face?

> `readonly` `optional` **face?**: `number`

Defined in: [handles/destructable.ts:22](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/destructable.ts#L22)

The facing, in degrees; 0 by default.

***

### pitch?

> `readonly` `optional` **pitch?**: `number`

Defined in: [handles/destructable.ts:28](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/destructable.ts#L28)

The pitch; 0 when only `roll` is given.

***

### roll?

> `readonly` `optional` **roll?**: `number`

Defined in: [handles/destructable.ts:30](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/destructable.ts#L30)

The roll; 0 when only `pitch` is given.

***

### scale?

> `readonly` `optional` **scale?**: `number`

Defined in: [handles/destructable.ts:24](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/destructable.ts#L24)

The X-Y-Z scale; 1 by default.

***

### skin?

> `readonly` `optional` **skin?**: `number`

Defined in: [handles/destructable.ts:32](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/destructable.ts#L32)

The skin's rawcode; left out, the type's own model.

***

### typeId

> `readonly` **typeId**: `number`

Defined in: [handles/destructable.ts:14](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/destructable.ts#L14)

The rawcode of the destructable type.

***

### variation?

> `readonly` `optional` **variation?**: `number`

Defined in: [handles/destructable.ts:26](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/destructable.ts#L26)

The model variation; 0 by default.

***

### x

> `readonly` **x**: `number`

Defined in: [handles/destructable.ts:16](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/destructable.ts#L16)

The x-coordinate, in world units.

***

### y

> `readonly` **y**: `number`

Defined in: [handles/destructable.ts:18](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/destructable.ts#L18)

The y-coordinate, in world units.

***

### z?

> `readonly` `optional` **z?**: `number`

Defined in: [handles/destructable.ts:20](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/destructable.ts#L20)

The z-coordinate; left out, the game places it on the ground.
