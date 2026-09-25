// The item and equipment payloads hand a guaranteed unit and item, and the
// 3.0.0 equipment lookups may find nothing.
import type { EventDescriptor } from "reforged-ts";
import { Item, on, Unit, UnitEvents } from "reforged-ts";

declare const hero: Unit;

const subscription = on(
  UnitEvents.equip,
  ({ unit, item }) => {
    const equipping: Unit = unit;
    const equipped: Item = item;
    equipping.kill();
    equipped.destroy();
  },
  ({ item }) => item.typeId !== 0,
);

const rows: EventDescriptor<{ unit: Unit; item: Item }>[] = [
  UnitEvents.pickupItem,
  UnitEvents.dropItemOf(hero),
  UnitEvents.useItem,
  UnitEvents.sellItemOf(hero),
  UnitEvents.pawnItem,
  UnitEvents.equipOf(hero),
  UnitEvents.unequip,
  UnitEvents.unequipOf(hero),
];
const equipped: Item | undefined = Item.fromEquipped();
const unequipped: Item | undefined = Item.fromUnequipped();

export { subscription, rows, equipped, unequipped };
