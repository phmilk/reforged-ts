// Positive: the Variable Editor's object-type variables where the Natives and
// the library take a Rawcode of their kind, with no cast.
import { MapPlayer, Unit } from "reforged-ts";

declare const owner: player;
declare const player: MapPlayer;
declare const hero: unit;

CreateUnit(owner, udg_SpawnType, 0, 0, 0);
Unit.create(player, udg_SpawnType, 0, 0);
SetPlayerTechResearched(owner, udg_Tech, 1);
UnitAddItemById(hero, udg_Loot[1]);
IssueImmediateOrderById(hero, udg_Order);
udg_SpawnType = FourCC("hfoo");
udg_SpawnType = GetUnitTypeId(hero);
