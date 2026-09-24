// Unit.create is typed Unit: no `!` and no `?.` after a creation.
import { MapPlayer, Unit } from "reforged-ts";

declare const owner: MapPlayer;

const footman: Unit = Unit.create(owner, FourCC("hfoo"), 0, 0);
footman.kill();

export { footman };
