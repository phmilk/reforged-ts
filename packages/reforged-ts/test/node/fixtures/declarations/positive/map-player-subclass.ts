// A Map project extends MapPlayer with its own player model: the constructor
// is protected, not private, and the inherited lookup gives the subclass.
import { MapPlayer } from "reforged-ts";

class Contestant extends MapPlayer {
  public score = 0;
}

declare const h: player;

const contestant: Contestant | undefined = Contestant.fromHandle(h);
const score: number | undefined = contestant?.score;

export { Contestant, score };
