// Negative: a Built-in unit's literal where UnitAddAbility expects an ability's Rawcode.
declare const hero: unit;
UnitAddAbility(hero, FourCC("hfoo"));

export {};
