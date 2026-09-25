// The spell targets may be undefined, the Of twins take the Unit Wrapper, and
// the spell-target lookups may find nothing.
import { Destructable, Item, on, Unit, UnitEvents } from "reforged-ts";

declare const rawUnit: unit;

export function subscribe(): void {
  on(UnitEvents.spellEffect, ({ targetUnit }) => {
    const target: Unit = targetUnit; // error TS2322
    target.kill();
  });
  on(UnitEvents.spellCastOf(rawUnit), () => undefined); // error TS2345
}

export const unitTarget: Unit = Unit.fromSpellTarget(); // error TS2322
export const itemTarget: Item = Item.fromSpellTarget(); // error TS2322
export const treeTarget: Destructable = Destructable.fromSpellTarget(); // error TS2322
