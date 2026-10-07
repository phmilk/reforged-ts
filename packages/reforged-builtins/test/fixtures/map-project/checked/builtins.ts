// Positive: the Built-in units' literals and constants where a unit's Rawcode
// is expected, with no cast; an unknown literal accepted everywhere.
import { Units } from "reforged-builtins/units";
import { MapPlayer, Unit } from "reforged-ts";

declare const owner: player;
declare const player: MapPlayer;
declare const hero: unit;
declare const created: Unit;

// A literal and a constant into CreateUnit and Unit.create.
CreateUnit(owner, FourCC("hfoo"), 0, 0, 0);
CreateUnit(owner, Units.Footman_hfoo, 0, 0, 0);
Unit.create(player, FourCC("hfoo"), 0, 0);
Unit.create(player, Units.Footman_hfoo, 0, 0);

// An inferred const and an array of literals keep the unit kind.
export const footman = FourCC("hfoo");
export const spawns = [FourCC("hfoo"), FourCC("Hpal")];
export const constant = Units.Footman_hfoo;
CreateUnit(owner, footman, 0, 0, 0);
for (const id of spawns) {
  Unit.create(player, id, 0, 0);
}

// What the game returns compares with a constant and a literal.
export const isFootman: boolean = created.typeId === Units.Footman_hfoo;
export const isPaladin: boolean = GetUnitTypeId(hero) === FourCC("Hpal");

// A literal the package does not know (a Custom object) stays UnknownRawcode,
// which every Rawcode parameter accepts.
export const custom = FourCC("h000");
CreateUnit(owner, custom, 0, 0, 0);
Unit.create(player, FourCC("h000"), 0, 0);
UnitAddAbility(hero, FourCC("h000"));
SetPlayerTechResearched(owner, FourCC("h000"), 1);
