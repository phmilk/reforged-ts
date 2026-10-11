// Positive: a Custom unit's constant and its FourCC literal where the
// library and the Natives take a unit's Rawcode, with no cast.
import { MapPlayer, Unit } from "reforged-ts";
import { CustomUnits } from "./custom-units";

declare const owner: player;
declare const player: MapPlayer;

Unit.create(player, CustomUnits.Captain_h000, 0, 0);
Unit.create(player, FourCC("h000"), 0, 0);
CreateUnit(owner, CustomUnits.Captain_h000, 0, 0, 0);
