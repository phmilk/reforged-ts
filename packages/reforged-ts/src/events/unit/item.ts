/** @noSelfInFile */

import { Item } from "../../handles/item";
import type { Unit } from "../../handles/unit";
import { required } from "../descriptor";
import { unitEventRows } from "./rows";

/** The reader of an item row: the event's unit and the item `lookup` finds. */
function readItem(lookup: () => Item | undefined) {
  return (unit: Unit, event: string) => ({
    unit,
    item: required(lookup(), "item", event),
  });
}

/**
 * The item rows of UnitEvents: pick up, drop, use, sell, pawn, equip and
 * unequip.
 */
export const itemRows = unitEventRows({
  /** A unit picks up an item. */
  pickupItem: {
    event: EVENT_PLAYER_UNIT_PICKUP_ITEM,
    twin: EVENT_UNIT_PICKUP_ITEM,
    unit: "unit",
    read: readItem(() => Item.fromEvent()),
  },
  /** A unit drops an item. */
  dropItem: {
    event: EVENT_PLAYER_UNIT_DROP_ITEM,
    twin: EVENT_UNIT_DROP_ITEM,
    unit: "unit",
    read: readItem(() => Item.fromEvent()),
  },
  /** A unit uses an item. */
  useItem: {
    event: EVENT_PLAYER_UNIT_USE_ITEM,
    twin: EVENT_UNIT_USE_ITEM,
    unit: "unit",
    read: readItem(() => Item.fromEvent()),
  },
  /**
   * A shop sells an item: `unit` is the shop, the selling unit the event
   * fires for, and `item` the sold item, read with `GetSoldItem`, the one
   * response the Patch lists for this event.
   */
  sellItem: {
    event: EVENT_PLAYER_UNIT_SELL_ITEM,
    twin: EVENT_UNIT_SELL_ITEM,
    unit: "unit",
    read: readItem(() => Item.fromSold()),
  },
  /**
   * A unit pawns an item to a shop: `unit` is the pawning unit and `item` the
   * pawned item, read with `GetSoldItem`: the Patch lists no response for
   * this event, and a pawn is the item sale seen from the unit.
   */
  pawnItem: {
    event: EVENT_PLAYER_UNIT_PAWN_ITEM,
    twin: EVENT_UNIT_PAWN_ITEM,
    unit: "unit",
    read: readItem(() => Item.fromSold()),
  },
  /** A unit equips an item (3.0.0). */
  equip: {
    event: EVENT_PLAYER_UNIT_EQUIP_ITEM,
    twin: EVENT_UNIT_EQUIP_ITEM,
    unit: "unit",
    read: readItem(() => Item.fromEquipped()),
  },
  /** A unit unequips an item (3.0.0). */
  unequip: {
    event: EVENT_PLAYER_UNIT_UNEQUIP_ITEM,
    twin: EVENT_UNIT_UNEQUIP_ITEM,
    unit: "unit",
    read: readItem(() => Item.fromUnequipped()),
  },
});
