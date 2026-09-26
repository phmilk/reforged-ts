// An equipment lookup's result assigned to a non-optional Item: an empty slot
// is undefined, and Item | undefined is not assignable to Item.
import { Item, LoadoutSlot, Unit } from "reforged-ts";

declare const hero: Unit;

const helmet: Item = hero.equippedItem(LoadoutSlot.Head); // error TS2322

export { helmet };
