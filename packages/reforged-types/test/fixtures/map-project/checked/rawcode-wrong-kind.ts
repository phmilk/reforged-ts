// Negative: an ability's Rawcode where CreateUnit expects a unit's.
declare const owner: player;
declare const spell: Rawcode<"ability">;
CreateUnit(owner, spell, 0, 0, 0);

export {};
