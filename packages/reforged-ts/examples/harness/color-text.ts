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
