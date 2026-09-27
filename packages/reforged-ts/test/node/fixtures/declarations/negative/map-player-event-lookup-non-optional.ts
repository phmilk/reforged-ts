// A player event lookup's result assigned to a non-optional MapPlayer: the
// Native answers nothing outside its event, and MapPlayer | undefined is not
// assignable to MapPlayer.
import { MapPlayer } from "reforged-ts";

const winner: MapPlayer = MapPlayer.fromWinning(); // error TS2322

export { winner };
