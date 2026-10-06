// Negative: a plain number where a Rawcode is expected.
declare function takeUnit(id: Rawcode<"unit">): void;
declare const count: number;
takeUnit(count);

export {};
