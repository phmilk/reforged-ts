// Force.fromPlayer allocates a new force: a creation, typed non-null.
import { Force, MapPlayer } from "reforged-ts";

declare const owner: MapPlayer;

const force: Force = Force.fromPlayer(owner);

export { force };
