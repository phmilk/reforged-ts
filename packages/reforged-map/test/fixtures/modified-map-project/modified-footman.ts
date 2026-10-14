// The Footman the map renames Militia: its literal resolves to the map's
// overload, not to reforged-builtins' (the test asks the checker which).
declare const owner: player;
CreateUnit(owner, FourCC("hfoo"), 0, 0, 0);

export {};
