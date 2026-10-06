// Negative: a plain number where a Rawcode is expected.
declare function takeUnit(id: Rawcode<"unit">): void;
const count = 3;
takeUnit(count);

export {};
