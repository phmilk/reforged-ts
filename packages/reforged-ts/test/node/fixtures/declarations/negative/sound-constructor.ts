// A Wrapper has no public constructor: creation goes through `create`.
import { Sound } from "reforged-ts";

export function makeSound(): void {
  new Sound("Sound/Interface/Warning.flac", false, false, false, 10, 10, ""); // error TS2674
}
