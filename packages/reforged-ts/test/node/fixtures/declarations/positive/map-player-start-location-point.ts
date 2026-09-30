// The player's start location as a Point is a creation: it returns the
// Point itself.
import { MapPlayer, Point } from "reforged-ts";

export function firstStart(): Point | undefined {
  const player = MapPlayer.fromIndex(0);
  if (player === undefined) return undefined;
  const start: Point = player.getStartLocationPoint();
  return start;
}
