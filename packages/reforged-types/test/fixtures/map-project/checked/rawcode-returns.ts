// Positive: a Rawcode the game returns carries its kind into the next call,
// and widens to number.
declare const owner: player;
declare const target: unit;

// A returned unit's Rawcode into a unit parameter.
CreateUnit(owner, GetUnitTypeId(target), 0, 0, 270);

// A returned ability's Rawcode into an ability parameter.
UnitRemoveAbility(target, GetSpellAbilityId());

// A returned Rawcode widens to number.
const sum: number = GetUnitTypeId(target) + 1;
const same: boolean = GetUnitTypeId(target) === FourCC("hfoo");

// A blizzard.j Rawcode global carries its kind.
const gate: Rawcode<"destructable"> = bj_ELEVATOR_CODE01;

export { sum, same, gate };
