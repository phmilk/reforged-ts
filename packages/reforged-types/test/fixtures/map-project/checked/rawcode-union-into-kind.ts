// Negative: a unit-or-upgrade Rawcode where CreateUnit expects a unit's.
declare const owner: player;
declare const tech: Rawcode<"unit" | "upgrade">;
CreateUnit(owner, tech, 0, 0, 0);

export {};
