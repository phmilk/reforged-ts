// An equipment lookup takes a LoadoutSlot and returns the Wrapper or
// undefined, an empty slot being undefined.
import { Item, LoadoutSlot, Unit } from "reforged-ts";

declare const hero: Unit;

const helmet: Item | undefined = hero.equippedItem(LoadoutSlot.Head);

export { helmet };
