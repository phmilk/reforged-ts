/** @noSelfInFile */

/**
 * A color of four components, red, green, blue and alpha, each from 0 to
 * 255, with what the game makes of it: a text color code and a player color.
 * @example
 * {@includeCode ../../examples/harness/color-text.ts}
 */
export class Color {
  /** The opacity, from 0 (transparent) to 255 (opaque). */
  readonly alpha: ColorValue;

  /**
   * Makes a color from its components.
   * @param red - The red component, from 0 to 255.
   * @param green - The green component, from 0 to 255.
   * @param blue - The blue component, from 0 to 255.
   * @param alpha - The opacity, from 0 to 255; 255 (opaque) when left out.
   */
  public constructor(
    readonly red: ColorValue,
    readonly green: ColorValue,
    readonly blue: ColorValue,
    alpha: ColorValue = 255,
  ) {
    this.alpha = alpha;
  }

  /**
   * The code that colors the text after it, `|cAARRGGBB`: each component in
   * two lowercase hexadecimal digits. `|r` ends the colored text.
   * @returns The ten-character color code.
   */
  public get code() {
    return (
      `|c${toHex(this.alpha)}${toHex(this.red)}` +
      `${toHex(this.green)}${toHex(this.blue)}`
    );
  }

  /**
   * Tells whether `other` has the same four components.
   * @param other - The color to compare with.
   * @returns True when red, green, blue and alpha are all equal.
   */
  public equals(other: Color) {
    return (
      this.red === other.red &&
      this.green === other.green &&
      this.blue === other.blue &&
      this.alpha === other.alpha
    );
  }

  private playerColorIndex() {
    let i = 0;
    for (; i < playerColors.length; i++) {
      if (playerColors[i].equals(this)) {
        break;
      }
    }
    return i;
  }

  /**
   * The name of the player color this color equals, as
   * {@link playerColorNames} spells it.
   * @returns The name, such as `"red"`, or `"unknown"` when the color is none
   * of {@link playerColors}, alpha included.
   */
  public get name() {
    const index = this.playerColorIndex();
    if (index < playerColors.length) {
      return playerColorNames[index];
    }
    return "unknown";
  }

  /**
   * The game's `playercolor` for the player color this color equals.
   * @returns The `playercolor`, or `PLAYER_COLOR_RED` when the color is none
   * of {@link playerColors}, alpha included.
   */
  public get playerColor() {
    const index = this.playerColorIndex();
    if (index < playerColors.length) {
      return orderedPlayerColors[index];
    }
    return PLAYER_COLOR_RED;
  }

  /**
   * Blends this color toward `other`, each component alpha included, by
   * linear interpolation.
   * @param other - The color reached at a `factor` of 1.
   * @param factor - How far to go toward `other`: 0 gives this color, 1 gives
   * `other`. Outside that range a component past 0 or 255 is clamped.
   * @returns A new color, each component rounded to the nearest integer.
   * @native MathRound
   */
  public lerp(other: Color, factor: number) {
    const r = MathRound(this.red * (1 - factor) + other.red * factor);
    const g = MathRound(this.green * (1 - factor) + other.green * factor);
    const b = MathRound(this.blue * (1 - factor) + other.blue * factor);
    const a = MathRound(this.alpha * (1 - factor) + other.alpha * factor);
    return new Color(
      math.max(0, math.min(255, r)) as ColorValue,
      math.max(0, math.min(255, g)) as ColorValue,
      math.max(0, math.min(255, b)) as ColorValue,
      math.max(0, math.min(255, a)) as ColorValue,
    );
  }
}

/**
 * Makes a {@link Color}, as `new Color(red, green, blue, alpha)` does.
 * @param red - The red component, from 0 to 255.
 * @param green - The green component, from 0 to 255.
 * @param blue - The blue component, from 0 to 255.
 * @param alpha - The opacity, from 0 to 255; 255 (opaque) when left out.
 * @returns The new color.
 */
export const color = (
  red: ColorValue,
  green: ColorValue,
  blue: ColorValue,
  alpha?: ColorValue,
) => new Color(red, green, blue, alpha);

/**
 * The 24 player colors, by player index: `playerColors[0]` is red. The
 * neutral players' colors are not included.
 */
export const playerColors = [
  color(255, 3, 3),
  color(0, 66, 255),
  color(28, 230, 185),
  color(84, 0, 129),
  color(255, 252, 0),
  color(254, 138, 14),
  color(32, 192, 0),
  color(229, 91, 176),
  color(149, 150, 151),
  color(126, 191, 241),
  color(16, 98, 70),
  color(78, 42, 3),
  color(155, 0, 0),
  color(0, 0, 195),
  color(0, 234, 255),
  color(190, 0, 254),
  color(235, 205, 135),
  color(248, 164, 139),
  color(191, 255, 128),
  color(220, 185, 235),
  color(80, 79, 85),
  color(235, 240, 255),
  color(0, 120, 30),
  color(164, 111, 51),
];

/** The names of the 24 player colors, by player index: `"red"` first. */
export const playerColorNames = [
  "red",
  "blue",
  "teal",
  "purple",
  "yellow",
  "orange",
  "green",
  "pink",
  "gray",
  "light blue",
  "dark green",
  "brown",
  "maroon",
  "navy",
  "turquoise",
  "violet",
  "wheat",
  "peach",
  "mint",
  "lavender",
  "coal",
  "snow",
  "emerald",
  "peanut",
];

/** An ordered list of `playercolor`s, for lookup */
const orderedPlayerColors = [
  PLAYER_COLOR_RED,
  PLAYER_COLOR_BLUE,
  PLAYER_COLOR_CYAN,
  PLAYER_COLOR_PURPLE,
  PLAYER_COLOR_YELLOW,
  PLAYER_COLOR_ORANGE,
  PLAYER_COLOR_GREEN,
  PLAYER_COLOR_PINK,
  PLAYER_COLOR_LIGHT_GRAY,
  PLAYER_COLOR_LIGHT_BLUE,
  PLAYER_COLOR_AQUA,
  PLAYER_COLOR_BROWN,
  PLAYER_COLOR_MAROON,
  PLAYER_COLOR_NAVY,
  PLAYER_COLOR_TURQUOISE,
  PLAYER_COLOR_VIOLET,
  PLAYER_COLOR_WHEAT,
  PLAYER_COLOR_PEACH,
  PLAYER_COLOR_MINT,
  PLAYER_COLOR_LAVENDER,
  PLAYER_COLOR_COAL,
  PLAYER_COLOR_SNOW,
  PLAYER_COLOR_EMERALD,
  PLAYER_COLOR_PEANUT,
];

/**
 * Converts a color value to the hex string, making sure that it is 2
 * characters in length.
 */
function toHex(value: ColorValue) {
  let hex = value.toString(16);
  if (hex.length < 2) {
    hex = `0${hex}`;
  }
  return hex;
}

type Enumerate<
  N extends number,
  Acc extends number[] = [],
> = Acc["length"] extends N
  ? Acc[number]
  : Enumerate<N, [...Acc, Acc["length"]]>;

/**
 * The integers from `F` up to `T`, `T` excluded, as a union of number
 * literals: `NumberRange<0, 3>` is `0 | 1 | 2`.
 * @typeParam F - The first integer, included.
 * @typeParam T - The end of the range, excluded.
 */
export type NumberRange<F extends number, T extends number> = Exclude<
  Enumerate<T>,
  Enumerate<F>
>;

/** A color component: an integer from 0 to 255. */
export type ColorValue = NumberRange<0, 256>;
