// Negative: a Custom item's constant where Unit.create expects a unit's
// Rawcode.
import { MapPlayer, Unit } from "reforged-ts";
import { CustomItems } from "./custom-items";

declare const player: MapPlayer;
Unit.create(player, CustomItems.Blade_I000, 0, 0);
