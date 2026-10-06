// Positive: each Variable Editor type of the map folder the 3.0 World Editor
// saved, scalar and array, with and without an initial value, where the
// Natives take it, with no cast.

declare const owner: player;
declare const hero: unit;

CreateUnit(owner, udg_UnitType, 0, 0, 0);
CreateUnit(owner, udg_UnitTypeInit, 0, 0, 0);
CreateUnit(owner, udg_UnitTypeArray[0], 0, 0, 0);
CreateUnit(owner, udg_UnitTypeArrayInit[1], 0, 0, 0);

CreateItem(udg_ItemType, 0, 0);
CreateItem(udg_ItemTypeInit, 0, 0);
CreateItem(udg_ItemTypeArray[0], 0, 0);
CreateItem(udg_ItemTypeArrayInit[1], 0, 0);

UnitAddAbility(hero, udg_AbilityCode);
UnitAddAbility(hero, udg_AbilityCodeInit);
UnitAddAbility(hero, udg_AbilityCodeArray[0]);
UnitAddAbility(hero, udg_AbilityCodeArrayInit[1]);

UnitApplyTimedLife(hero, udg_Buff, 1);
UnitApplyTimedLife(hero, udg_BuffInit, 1);
UnitApplyTimedLife(hero, udg_BuffArray[0], 1);
UnitApplyTimedLife(hero, udg_BuffArrayInit[1], 1);

CreateDestructable(udg_DestructibleType, 0, 0, 0, 1, 0);
CreateDestructable(udg_DestructibleTypeInit, 0, 0, 0, 1, 0);
CreateDestructable(udg_DestructibleTypeArray[0], 0, 0, 0, 1, 0);
CreateDestructable(udg_DestructibleTypeArrayInit[1], 0, 0, 0, 1, 0);

SetPlayerTechResearched(owner, udg_TechType, 1);
SetPlayerTechResearched(owner, udg_TechTypeInit, 1);
SetPlayerTechResearched(owner, udg_TechTypeArray[0], 1);
SetPlayerTechResearched(owner, udg_TechTypeArrayInit[1], 1);
// A unit-type is a tech-type too.
SetPlayerTechResearched(owner, udg_UnitType, 1);

IssueImmediateOrderById(hero, udg_Order);
IssueImmediateOrderById(hero, udg_OrderArray[0]);

SetPlayerState(owner, PLAYER_STATE_RESOURCE_GOLD, udg_Integer);
SetPlayerState(owner, PLAYER_STATE_RESOURCE_GOLD, udg_IntegerInit);
SetPlayerState(owner, PLAYER_STATE_RESOURCE_GOLD, udg_IntegerArray[0]);
SetPlayerState(owner, PLAYER_STATE_RESOURCE_GOLD, udg_IntegerArrayInit[1]);

udg_UnitTypeArrayInit[2] = GetUnitTypeId(hero);
udg_AbilityCodeInit = FourCC("AHbz");
TriggerExecute(gg_trg_Melee_Initialization);

export {};
