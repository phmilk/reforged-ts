// The damage source may be undefined, the Of twins take the Unit Wrapper, and
// the combat lookups may find nothing.
import { on, Unit, UnitEvents } from "reforged-ts";

declare const rawUnit: unit;

export function subscribe(): void {
  on(UnitEvents.damaged, ({ source }) => {
    const from: Unit = source; // error TS2322
    from.kill();
  });
  on(UnitEvents.damagingOf(rawUnit), () => undefined); // error TS2345
}

export const attacker: Unit = Unit.fromAttacker(); // error TS2322
export const source: Unit = Unit.fromDamageSource(); // error TS2322
export const target: Unit = Unit.fromDamageTarget(); // error TS2322
