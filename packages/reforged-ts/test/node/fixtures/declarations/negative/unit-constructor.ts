// A Wrapper has no public constructor: creation goes through `create`.
import { MapPlayer, Unit } from "reforged-ts";

declare const owner: MapPlayer;

export function makeUnit(): void {
  new Unit(owner, FourCC("hfoo"), 0, 0); // error TS2674
}
