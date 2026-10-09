// Negative: a Built-in unit's literal where UnitAddAbility expects an ability's.
declare const footman: unit;
UnitAddAbility(footman, FourCC("hfoo"));

export {};
