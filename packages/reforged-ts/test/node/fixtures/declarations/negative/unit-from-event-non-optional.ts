// An event lookup's result assigned to a non-optional Unit: Unit | undefined
// is not assignable to Unit.
import { Unit } from "reforged-ts";

const triggering: Unit = Unit.fromEvent(); // error TS2322

export { triggering };
