// A Wrapper has no public constructor: creation goes through `create`.
import { Timer } from "reforged-ts";

export function makeTimer(): void {
  new Timer(); // error TS2674
}
