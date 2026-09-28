# Class: Color

Defined in: [utils/color.ts:11](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/utils/color.ts#L11)

A color of four components, red, green, blue and alpha, each from 0 to
255, with what the game makes of it: a text color code and a player color.

## Remarks

An `alpha` of 0 is taken as left out, so the color comes out opaque (255).

## Example

```ts
// A message colored in its player's color, and a warning fading from yellow
// to red as a countdown runs out.
import { Color, color, Init, playerColors } from "reforged-ts";

const yellow = color(255, 255, 0);
const red = new Color(255, 0, 0);

/** The warning's text, colored for `left` of `total` seconds to go. */
export function warning(left: number, total: number): string {
  const shade = yellow.lerp(red, 1 - left / total);
  return `${shade.code}${String(left)} seconds left|r`;
}

Init.onGameStart(() => {
  const blue = playerColors[1];
  // "|cff0042ffblue|r": the name in its own color.
  print(`${blue.code}${blue.name}|r`);
  print(blue.equals(color(0, 66, 255))); // true
  print(red.name); // unknown: not a player color
});
```

## Constructors

### Constructor

> **new Color**(`red`, `green`, `blue`, `alpha?`): `Color`

Defined in: [utils/color.ts:22](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/utils/color.ts#L22)

Makes a color from its components.

#### Parameters

##### red

[`ColorValue`](../type-aliases/ColorValue.md)

The red component, from 0 to 255.

##### green

[`ColorValue`](../type-aliases/ColorValue.md)

The green component, from 0 to 255.

##### blue

[`ColorValue`](../type-aliases/ColorValue.md)

The blue component, from 0 to 255.

##### alpha?

[`ColorValue`](../type-aliases/ColorValue.md)

The opacity, from 0 to 255; 255 (opaque) when left out.

#### Returns

`Color`

## Properties

### alpha

> `readonly` **alpha**: [`ColorValue`](../type-aliases/ColorValue.md)

Defined in: [utils/color.ts:13](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/utils/color.ts#L13)

The opacity, from 0 (transparent) to 255 (opaque).

***

### blue

> `readonly` **blue**: [`ColorValue`](../type-aliases/ColorValue.md)

Defined in: [utils/color.ts:25](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/utils/color.ts#L25)

The blue component, from 0 to 255.

***

### green

> `readonly` **green**: [`ColorValue`](../type-aliases/ColorValue.md)

Defined in: [utils/color.ts:24](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/utils/color.ts#L24)

The green component, from 0 to 255.

***

### red

> `readonly` **red**: [`ColorValue`](../type-aliases/ColorValue.md)

Defined in: [utils/color.ts:23](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/utils/color.ts#L23)

The red component, from 0 to 255.

## Accessors

### code

#### Get Signature

> **get** **code**(): `string`

Defined in: [utils/color.ts:40](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/utils/color.ts#L40)

The code that colors the text after it, `|cAARRGGBB`: each component in
two lowercase hexadecimal digits. `|r` ends the colored text.

##### Returns

`string`

The ten-character color code.

***

### name

#### Get Signature

> **get** **name**(): `string`

Defined in: [utils/color.ts:77](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/utils/color.ts#L77)

The name of the player color this color equals, as
[playerColorNames](../variables/playerColorNames.md) spells it.

##### Returns

`string`

The name, such as `"red"`, or `"unknown"` when the color is none
of [playerColors](../variables/playerColors.md), alpha included.

***

### playerColor

#### Get Signature

> **get** **playerColor**(): `playercolor`

Defined in: [utils/color.ts:90](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/utils/color.ts#L90)

The game's `playercolor` for the player color this color equals.

##### Returns

`playercolor`

The `playercolor`, or `PLAYER_COLOR_RED` when the color is none
of [playerColors](../variables/playerColors.md), alpha included.

## Methods

### equals()

> **equals**(`other`): `boolean`

Defined in: [utils/color.ts:52](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/utils/color.ts#L52)

Tells whether `other` has the same four components.

#### Parameters

##### other

`Color`

The color to compare with.

#### Returns

`boolean`

True when red, green, blue and alpha are all equal.

***

### lerp()

> **lerp**(`other`, `factor`): `Color`

Defined in: [utils/color.ts:107](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/utils/color.ts#L107)

Blends this color toward `other`, each component alpha included, by
linear interpolation.

#### Parameters

##### other

`Color`

The color reached at a `factor` of 1.

##### factor

`number`

How far to go toward `other`: 0 gives this color, 1 gives
`other`. Outside that range a component past 0 or 255 is clamped.

#### Returns

`Color`

A new color, each component rounded to the nearest integer.

#### Native

[MathRound](/typings/3.0.0/functions/MathRound) ([jassbot](https://lep.duckdns.org/jassbot/doc/MathRound))
