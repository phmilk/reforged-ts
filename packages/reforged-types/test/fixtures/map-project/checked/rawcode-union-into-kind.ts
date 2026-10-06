// Negative: a Rawcode of a unit or an upgrade where a unit's is expected.
declare function takeUnit(id: Rawcode<"unit">): void;
declare const tech: Rawcode<"unit" | "upgrade">;
takeUnit(tech);

export {};
