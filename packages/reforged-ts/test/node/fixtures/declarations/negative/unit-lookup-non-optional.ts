// A lookup's result assigned to a non-optional Unit: Unit | undefined is not
// assignable to Unit.
import { Unit } from "reforged-ts";

declare const h: unit;

const found: Unit = Unit.fromHandle(h); // error TS2322

export { found };
