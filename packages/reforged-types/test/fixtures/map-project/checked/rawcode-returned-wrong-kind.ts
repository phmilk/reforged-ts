// Negative: a returned unit's Rawcode where UnitAddAbility expects an ability's.
declare const target: unit;
declare const other: unit;
UnitAddAbility(target, GetUnitTypeId(other));

export {};
