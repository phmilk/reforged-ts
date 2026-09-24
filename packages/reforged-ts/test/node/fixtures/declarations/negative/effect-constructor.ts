// A Wrapper has no public constructor: creation goes through `create`.
import { Effect } from "reforged-ts";

export function makeEffect(): void {
  new Effect("model.mdx", 0, 0); // error TS2674
}
