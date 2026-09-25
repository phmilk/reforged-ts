// The death payload's killer may be undefined, deathOf takes the Unit
// Wrapper, and the killer lookup may find nothing.
import { on, Unit, UnitEvents } from "reforged-ts";

declare const rawUnit: unit;

export function subscribe(): void {
  on(UnitEvents.death, ({ killer }) => {
    const by: Unit = killer; // error TS2322
    by.kill();
  });
  on(UnitEvents.deathOf(rawUnit), () => undefined); // error TS2345
}

export const killing: Unit = Unit.fromKilling(); // error TS2322
