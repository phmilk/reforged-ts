/** @noSelfInFile */

// The item rows of UnitEvents (pickupItem, dropItem, useItem, sellItem,
// pawnItem, and the 3.0.0 equip and unequip) and their Of twins through on(),
// and the equipment lookups: the suites of support/events.ts, which fire the
// Subscription's Trigger with a stubbed context and observe the call log and
// what the handler received. Every context answers both GetEquippedItem and
// GetUnequippedItem with different items, so equip yielding the equipped
// item and unequip the unequipped one is asserted by their payloads.

import type { EventDescriptor } from "../../src/index";
import { Item, MapPlayer, Unit, UnitEvents } from "../../src/index";
import { defined } from "../support/defined";
import {
  describeDescriptor,
  describeLookup,
  everySlot,
} from "../support/events";
import { handleRef } from "../support/handle-ref";

const owner = defined(MapPlayer.fromIndex(0), "the player in slot 0");
const hero = Unit.create(owner, FourCC("Hpal"), 0, 0);
const manipulated = Item.create(FourCC("rat6"), 0, 0);
const sold = Item.create(FourCC("rat9"), 0, 0);
const equipped = Item.create(FourCC("ckng"), 0, 0);
const unequipped = Item.create(FourCC("bgst"), 0, 0);

/** Every item a response Native of these events can answer, each different. */
const items = {
  GetManipulatedItem: manipulated.handle,
  GetSoldItem: sold.handle,
  GetEquippedItem: equipped.handle,
  GetUnequippedItem: unequipped.handle,
};

interface ItemPayload {
  unit: Unit;
  item: Item;
}
type ItemNative = keyof typeof items;

/**
 * One item row: its two descriptors, its two events and its item Native.
 * @noSelf
 */
interface ItemRow {
  readonly name: string;
  readonly any: EventDescriptor<ItemPayload>;
  readonly of: (unit: Unit) => EventDescriptor<ItemPayload>;
  readonly event: string;
  readonly twin: string;
  readonly native: ItemNative;
  readonly item: Item;
}

const rows: ItemRow[] = [
  {
    name: "pickupItem",
    any: UnitEvents.pickupItem,
    of: UnitEvents.pickupItemOf,
    event: "EVENT_PLAYER_UNIT_PICKUP_ITEM",
    twin: "EVENT_UNIT_PICKUP_ITEM",
    native: "GetManipulatedItem",
    item: manipulated,
  },
  {
    name: "dropItem",
    any: UnitEvents.dropItem,
    of: UnitEvents.dropItemOf,
    event: "EVENT_PLAYER_UNIT_DROP_ITEM",
    twin: "EVENT_UNIT_DROP_ITEM",
    native: "GetManipulatedItem",
    item: manipulated,
  },
  {
    name: "useItem",
    any: UnitEvents.useItem,
    of: UnitEvents.useItemOf,
    event: "EVENT_PLAYER_UNIT_USE_ITEM",
    twin: "EVENT_UNIT_USE_ITEM",
    native: "GetManipulatedItem",
    item: manipulated,
  },
  {
    name: "sellItem",
    any: UnitEvents.sellItem,
    of: UnitEvents.sellItemOf,
    event: "EVENT_PLAYER_UNIT_SELL_ITEM",
    twin: "EVENT_UNIT_SELL_ITEM",
    native: "GetSoldItem",
    item: sold,
  },
  {
    name: "pawnItem",
    any: UnitEvents.pawnItem,
    of: UnitEvents.pawnItemOf,
    event: "EVENT_PLAYER_UNIT_PAWN_ITEM",
    twin: "EVENT_UNIT_PAWN_ITEM",
    native: "GetSoldItem",
    item: sold,
  },
  {
    name: "equip",
    any: UnitEvents.equip,
    of: UnitEvents.equipOf,
    event: "EVENT_PLAYER_UNIT_EQUIP_ITEM",
    twin: "EVENT_UNIT_EQUIP_ITEM",
    native: "GetEquippedItem",
    item: equipped,
  },
  {
    name: "unequip",
    any: UnitEvents.unequip,
    of: UnitEvents.unequipOf,
    event: "EVENT_PLAYER_UNIT_UNEQUIP_ITEM",
    twin: "EVENT_UNIT_UNEQUIP_ITEM",
    native: "GetUnequippedItem",
    item: unequipped,
  },
];

for (const row of rows) {
  describeDescriptor({
    name: `UnitEvents.${row.name}`,
    descriptor: row.any,
    registers: (trigger) =>
      everySlot(
        (player) =>
          `TriggerRegisterPlayerUnitEvent(${trigger}, ${player}, ${row.event}, nil)`,
      ),
    context: { ...items, GetTriggerUnit: hero.handle },
    payload: { unit: hero, item: row.item },
    required: [
      ["unit", "GetTriggerUnit"],
      ["item", row.native],
    ],
  });

  describeDescriptor({
    name: `UnitEvents.${row.name}Of`,
    descriptor: row.of(hero),
    registers: (trigger) => [
      `TriggerRegisterUnitEvent(${trigger}, ${handleRef("unit", hero.handle)}, ${row.twin})`,
    ],
    context: items,
    payload: { unit: hero, item: row.item },
    required: [["item", row.native]],
  });
}

describeLookup({
  name: "Item.fromEquipped",
  lookup: () => Item.fromEquipped(),
  context: { GetEquippedItem: equipped.handle },
  expected: equipped,
});

describeLookup({
  name: "Item.fromUnequipped",
  lookup: () => Item.fromUnequipped(),
  context: { GetUnequippedItem: unequipped.handle },
  expected: unequipped,
});
