// An order's target fields may be undefined, its Of twins take the Unit
// Wrapper, orderUnit has no Of twin, and the order lookups may find nothing.
import { on, Unit, UnitEvents } from "reforged-ts";

declare const rawUnit: unit;

export function subscribe(): void {
  on(UnitEvents.orderPoint, ({ targetX }) => {
    const x: number = targetX; // error TS2322
    return x;
  });
  on(UnitEvents.orderTarget, ({ targetUnit }) => {
    const target: Unit = targetUnit; // error TS2322
    target.kill();
  });
  on(UnitEvents.orderIssuedOf(rawUnit), () => undefined); // error TS2345
}

export const twin: keyof typeof UnitEvents = "orderUnitOf"; // error TS2820

export const ordered: Unit = Unit.fromOrdered(); // error TS2322
