// The player's start location as a Point is a creation: it returns the
// Point itself.
import { MapPlayer, Point } from "reforged-ts";

const start: Point = MapPlayer.fromLocal().startLocationPoint;

export { start };
