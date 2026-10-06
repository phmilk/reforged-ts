// Positive: FourCC literals into the Natives' Rawcode parameters, one Native
// of each Object kind, a union and any kind.
declare const owner: player;
declare const target: unit;

CreateUnit(owner, FourCC("hfoo"), 0, 0, 270);
CreateItem(FourCC("ratc"), 0, 0);
UnitAddAbility(target, FourCC("AHbz"));
UnitApplyTimedLife(target, FourCC("BTLF"), 10);
CreateDestructable(FourCC("LTlt"), 0, 0, 270, 1, 0);
SetDoodadAnimation(0, 0, 256, FourCC("ZPfw"), false, "stand", false);
TriggerRegisterUpgradeCommandEvent(CreateTrigger(), FourCC("Rhde"));

// A unit's or an upgrade's Rawcode where the Native takes either.
const footman: Rawcode<"unit"> = FourCC("hfoo");
const swords: Rawcode<"upgrade"> = FourCC("Rhme");
SetPlayerTechResearched(owner, FourCC("Rhde"), 1);
SetPlayerTechResearched(owner, footman, 1);
SetPlayerTechResearched(owner, swords, 1);

// Any kind.
const name: string | undefined = GetObjectName(footman);

// An order id stays a number: a unit's Rawcode widens into a train order.
IssueImmediateOrderById(target, footman);

export { name };
