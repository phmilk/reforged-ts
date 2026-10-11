# Function: color()

> **color**(`red`, `green`, `blue`, `alpha?`): [`Color`](../classes/Color.md)

Defined in: [utils/color.ts:123](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/utils/color.ts#L123)

Makes a [Color](../classes/Color.md), as `new Color(red, green, blue, alpha)` does.

## Parameters

### red

[`ColorValue`](../type-aliases/ColorValue.md)

The red component, from 0 to 255.

### green

[`ColorValue`](../type-aliases/ColorValue.md)

The green component, from 0 to 255.

### blue

[`ColorValue`](../type-aliases/ColorValue.md)

The blue component, from 0 to 255.

### alpha?

[`ColorValue`](../type-aliases/ColorValue.md)

The opacity, from 0 to 255; 255 (opaque) when left out.

## Returns

[`Color`](../classes/Color.md)

The new color.
