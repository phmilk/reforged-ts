// Positive: Built-in literals and constants of every kind go where their
// kind's Rawcode is expected, with no annotation and no cast, and a Rawcode the package does
// not know (a Custom object's) still compiles everywhere.
import type { MapPlayer } from "reforged-ts";
import { Unit } from "reforged-ts";
import { Abilities } from "reforged-builtins/abilities";
import { Buffs } from "reforged-builtins/buffs";
import { Destructables } from "reforged-builtins/destructables";
import { Doodads } from "reforged-builtins/doodads";
import { Items } from "reforged-builtins/items";
import { Units } from "reforged-builtins/units";
import { Upgrades } from "reforged-builtins/upgrades";

declare const owner: player;
declare const mapOwner: MapPlayer;
declare const area: rect;

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

// Every kind's literal and constant goes where its kind is expected.
SetPlayerTechResearched(owner, FourCC("Rhme"), 1);
SetPlayerTechResearched(owner, Upgrades.IronForgedSwords_Rhme, 1);
UnitAddAbility(spawned.handle, FourCC("AHbz"));
UnitAddAbility(spawned.handle, Abilities.Blizzard_AHbz);
CreateItem(Items.ClawsOfAttack15_ratf, 0, 0);
CreateItem(FourCC("ratf"), 0, 0);
UnitApplyTimedLife(spawned.handle, Buffs.InnerFire_Binf, 10);
CreateDestructable(Destructables.SummerTreeWall_LTlt, 0, 0, 0, 1, 0);
SetDoodadAnimationRect(area, Doodads.Brazier_LObr, "stand", false);
