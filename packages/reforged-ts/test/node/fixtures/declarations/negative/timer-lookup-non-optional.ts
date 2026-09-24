// A lookup's result assigned to a non-optional Timer: Timer | undefined is
// not assignable to Timer.
import { Timer } from "reforged-ts";

const expired: Timer = Timer.fromExpired(); // error TS2322

export { expired };
