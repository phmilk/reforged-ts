// fromIndex is a lookup: an out-of-range slot gives undefined, so its result
// is not assignable to a non-optional MapPlayer.
import { MapPlayer } from "reforged-ts";

const first: MapPlayer = MapPlayer.fromIndex(0); // error TS2322

export { first };
