// Positive: Built-in literals and constants go where a unit's Rawcode is
// expected, with no annotation and no cast, and a Rawcode the package does
// not know (a Custom object's) still compiles everywhere.
import type { MapPlayer } from "reforged-ts";
import { Unit } from "reforged-ts";
import { Units } from "reforged-builtins/units";

declare const owner: player;
declare const mapOwner: MapPlayer;

CreateUnit(owner, FourCC("hfoo"), 0, 0, 0);
CreateUnit(owner, Units.Footman_hfoo, 0, 0, 0);
Unit.create(mapOwner, FourCC("hfoo"), 0, 0);
Unit.create(mapOwner, Units.Footman_hfoo, 0, 0);

export const footman = FourCC("hfoo");
export const army = [FourCC("hfoo"), FourCC("hkni")];
export const constant = Units.Footman_hfoo;
const typed: Rawcode<"unit"> = footman;
const typedArmy: Rawcode<"unit">[] = army;
CreateUnit(owner, typed, 0, 0, 0);
Unit.create(mapOwner, typedArmy[0], 0, 0);

const spawned = Unit.create(mapOwner, footman, 0, 0);
export const isFootman = spawned.typeId === Units.Footman_hfoo;

export const custom = FourCC("h000");
CreateUnit(owner, FourCC("h000"), 0, 0, 0);
Unit.create(mapOwner, custom, 0, 0);
UnitAddAbility(spawned.handle, custom);
