/** @noSelfInFile */

import { Item } from "../../handles/item";
import type { Unit } from "../../handles/unit";
import { required } from "../descriptor";
import { unitEventRows } from "./rows";

/** The reader of an item row: the event's unit and the item `lookup` finds. */
function readItem(lookup: () => Item | undefined) {
  return (unit: Unit, event: string) => ({
    /** The unit the event fires for. */
    unit,
    /** The item. */
    item: required(lookup(), "item", event),
  });
}

/**
 * The item rows of UnitEvents: pick up, drop, use, sell, pawn, equip and
 * unequip.
 */
export const itemRows = unitEventRows({
  /**
   * A unit picks up an item.
   * `unit` and `item` are always set.
   * @native TriggerRegisterPlayerUnitEvent
   */
  pickupItem: {
    event: EVENT_PLAYER_UNIT_PICKUP_ITEM,
    unit: "unit",
    read: readItem(() => Item.fromEvent()),
  },
  /**
   * The event of `pickupItem` on one Unit: `unit` picks up an item.
   * `unit` and `item` are always set.
   * @native TriggerRegisterUnitEvent
   */
  pickupItemOf: { twinOf: "pickupItem", event: EVENT_UNIT_PICKUP_ITEM },
  /**
   * A unit drops an item.
   * `unit` and `item` are always set.
   * @native TriggerRegisterPlayerUnitEvent
   */
  dropItem: {
    event: EVENT_PLAYER_UNIT_DROP_ITEM,
    unit: "unit",
    read: readItem(() => Item.fromEvent()),
  },
  /**
   * The event of `dropItem` on one Unit: `unit` drops an item.
   * `unit` and `item` are always set.
   * @native TriggerRegisterUnitEvent
   */
  dropItemOf: { twinOf: "dropItem", event: EVENT_UNIT_DROP_ITEM },
  /**
   * A unit uses an item.
   * `unit` and `item` are always set.
   * @native TriggerRegisterPlayerUnitEvent
   */
  useItem: {
    event: EVENT_PLAYER_UNIT_USE_ITEM,
    unit: "unit",
    read: readItem(() => Item.fromEvent()),
  },
  /**
   * The event of `useItem` on one Unit: `unit` uses an item.
   * `unit` and `item` are always set.
   * @native TriggerRegisterUnitEvent
   */
  useItemOf: { twinOf: "useItem", event: EVENT_UNIT_USE_ITEM },
  /**
   * A shop sells an item: `unit` is the shop, the selling unit the event
   * fires for, and `item` the sold item, read with `GetSoldItem`, the one
   * response the Patch lists for this event.
   * @native TriggerRegisterPlayerUnitEvent
   */
  sellItem: {
    event: EVENT_PLAYER_UNIT_SELL_ITEM,
    unit: "unit",
    read: readItem(() => Item.fromSold()),
  },
  /**
   * The event of `sellItem` on one Unit: the shop `unit` sells an item.
   * `unit` and `item` are always set.
   * @native TriggerRegisterUnitEvent
   */
  sellItemOf: { twinOf: "sellItem", event: EVENT_UNIT_SELL_ITEM },
  /**
   * A unit pawns an item to a shop: `unit` is the pawning unit and `item` the
   * pawned item, read with `GetSoldItem`: the Patch lists no response for
   * this event, and a pawn is the item sale seen from the unit.
   * @native TriggerRegisterPlayerUnitEvent
   */
  pawnItem: {
    event: EVENT_PLAYER_UNIT_PAWN_ITEM,
    unit: "unit",
    read: readItem(() => Item.fromSold()),
  },
  /**
   * The event of `pawnItem` on one Unit: `unit` pawns an item to a shop.
   * `unit` and `item` are always set.
   * @native TriggerRegisterUnitEvent
   */
  pawnItemOf: { twinOf: "pawnItem", event: EVENT_UNIT_PAWN_ITEM },
  /**
   * A unit equips an item (3.0.0).
   * `unit` and `item` are always set.
   * @native TriggerRegisterPlayerUnitEvent
   */
  equip: {
    event: EVENT_PLAYER_UNIT_EQUIP_ITEM,
    unit: "unit",
    read: readItem(() => Item.fromEquipped()),
  },
  /**
   * The event of `equip` on one Unit: `unit` equips an item (3.0.0).
   * `unit` and `item` are always set.
   * @native TriggerRegisterUnitEvent
   */
  equipOf: { twinOf: "equip", event: EVENT_UNIT_EQUIP_ITEM },
  /**
   * A unit unequips an item (3.0.0).
   * `unit` and `item` are always set.
   * @native TriggerRegisterPlayerUnitEvent
   */
  unequip: {
    event: EVENT_PLAYER_UNIT_UNEQUIP_ITEM,
    unit: "unit",
    read: readItem(() => Item.fromUnequipped()),
  },
  /**
   * The event of `unequip` on one Unit: `unit` unequips an item (3.0.0).
   * `unit` and `item` are always set.
   * @native TriggerRegisterUnitEvent
   */
  unequipOf: { twinOf: "unequip", event: EVENT_UNIT_UNEQUIP_ITEM },
});
