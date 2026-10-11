// Negative: a Custom unit's FourCC literal where UnitAddAbility expects an
// ability's Rawcode.
declare const hero: unit;
UnitAddAbility(hero, FourCC("h000"));

export {};
