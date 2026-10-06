// Negative: an ability's Rawcode where a unit's is expected.
declare function takeUnit(id: Rawcode<"unit">): void;
declare const spell: Rawcode<"ability">;
takeUnit(spell);

export {};
