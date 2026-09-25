// The equipment Of twins take the Unit Wrapper, a payload's item is an Item
// and never a raw handle, and the sold-item and equipment lookups may find
// nothing.
import { Item, on, UnitEvents } from "reforged-ts";

declare const rawUnit: unit;

export function subscribe(): void {
  on(UnitEvents.unequip, ({ item }) => {
    const raw: item = item; // error TS2739
    return raw;
  });
  on(UnitEvents.equipOf(rawUnit), () => undefined); // error TS2345
}

export const equipped: Item = Item.fromEquipped(); // error TS2322
export const sold: Item = Item.fromSold(); // error TS2322
export const unequipped: Item = Item.fromUnequipped(); // error TS2322
