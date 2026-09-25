// A Timer handler's parameter is the Timer: a handler that expects any other
// Wrapper is not assignable.
import { Timer, Unit } from "reforged-ts";

declare const killUnit: (unit: Unit) => void;

export function schedule(): void {
  Timer.every(1, killUnit); // error TS2345
}
