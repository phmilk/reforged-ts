# Function: color()

> **color**(`red`, `green`, `blue`, `alpha?`): [`Color`](../classes/Color.md)

Defined in: [utils/color.ts:129](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/utils/color.ts#L129)

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
