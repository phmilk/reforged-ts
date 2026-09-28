/** @noSelfInFile */

import { LIBRARY } from "../init/state";

/**
 * The equipment type of an item, the integer `ConvertEquipmentType` takes:
 * `EQUIPMENT_TYPE_NONE` to `EQUIPMENT_TYPE_ANY`, in the Patch's order.
 */
export enum EquipmentType {
  /**
   * No equipment type: the item cannot be equipped.
   * @native EQUIPMENT_TYPE_NONE
   */
  None = 0,
  /**
   * An item worn on the head.
   * @native EQUIPMENT_TYPE_HEAD
   */
  Head = 1,
  /**
   * An item worn on the chest.
   * @native EQUIPMENT_TYPE_CHEST
   */
  Chest = 2,
  /**
   * An item worn on the hands.
   * @native EQUIPMENT_TYPE_GLOVES
   */
  Gloves = 3,
  /**
   * An item worn on the feet.
   * @native EQUIPMENT_TYPE_BOOTS
   */
  Boots = 4,
  /**
   * A ring, worn in either ring slot.
   * @native EQUIPMENT_TYPE_RING
   */
  Ring = 5,
  /**
   * An item held in the primary hand.
   * @native EQUIPMENT_TYPE_PRIMARY
   */
  Primary = 6,
  /**
   * An item held in the off hand.
   * @native EQUIPMENT_TYPE_OFFHAND
   */
  Offhand = 7,
  /**
   * An item carried as a trinket.
   * @native EQUIPMENT_TYPE_TRINKET
   */
  Trinket = 8,
  /**
   * Every equipment type, for a filter such as
   * {@link Item.chooseRandomWithFilter}.
   * @native EQUIPMENT_TYPE_ANY
   */
  Any = 9,
}

/**
 * The tag of an item, the integer `ConvertItemTag` takes:
 * `ITEMTAG_TYPE_UNDEFINED` to `ITEMTAG_TYPE_ANY`, in the Patch's order.
 */
export enum ItemTag {
  /**
   * An item with no tag.
   * @native ITEMTAG_TYPE_UNDEFINED
   */
  Undefined = 0,
  /**
   * An item tagged as a droppable item.
   * @native ITEMTAG_TYPE_DROPPABLE
   */
  Droppable = 1,
  /**
   * An item tagged as a quest reward.
   * @native ITEMTAG_TYPE_QUESTREWARD
   */
  QuestReward = 2,
  /**
   * An item tagged as a boss drop.
   * @native ITEMTAG_TYPE_BOSSDROP
   */
  BossDrop = 3,
  /**
   * An item tagged as a secret item.
   * @native ITEMTAG_TYPE_SECRET
   */
  Secret = 4,
  /**
   * An item tagged as a puzzle item.
   * @native ITEMTAG_TYPE_PUZZLE
   */
  Puzzle = 5,
  /**
   * An item tagged as a world item.
   * @native ITEMTAG_TYPE_WORLD
   */
  World = 6,
  /**
   * An item tagged as a shop item.
   * @native ITEMTAG_TYPE_SHOP
   */
  Shop = 7,
  /**
   * Every tag, for a filter such as {@link Item.chooseRandomWithFilter}.
   * @native ITEMTAG_TYPE_ANY
   */
  Any = 8,
}

/**
 * A slot of a unit's equipment loadout, the integer `ConvertLoadoutSlot`
 * takes: `EQUIPMENT_LOADOUT_SLOT_HEAD` to `EQUIPMENT_LOADOUT_SLOT_TRINKET`,
 * in the Patch's order.
 */
export enum LoadoutSlot {
  /**
   * The head slot.
   * @native EQUIPMENT_LOADOUT_SLOT_HEAD
   */
  Head = 0,
  /**
   * The chest slot.
   * @native EQUIPMENT_LOADOUT_SLOT_CHEST
   */
  Chest = 1,
  /**
   * The hands slot.
   * @native EQUIPMENT_LOADOUT_SLOT_GLOVES
   */
  Gloves = 2,
  /**
   * The feet slot.
   * @native EQUIPMENT_LOADOUT_SLOT_BOOTS
   */
  Boots = 3,
  /**
   * The first ring slot.
   * @native EQUIPMENT_LOADOUT_SLOT_RING
   */
  Ring = 4,
  /**
   * The second ring slot.
   * @native EQUIPMENT_LOADOUT_SLOT_RINGALT
   */
  RingAlt = 5,
  /**
   * The primary-hand slot.
   * @native EQUIPMENT_LOADOUT_SLOT_PRIMARY
   */
  Primary = 6,
  /**
   * The off-hand slot.
   * @native EQUIPMENT_LOADOUT_SLOT_OFFHAND
   */
  Offhand = 7,
  /**
   * The trinket slot.
   * @native EQUIPMENT_LOADOUT_SLOT_TRINKET
   */
  Trinket = 8,
}

/**
 * The outbound match of one enum: the member for a Handle a Native returned,
 * `native` being that Native's name. The Handle is compared with the game's
 * named constants, the way Jass compares `GetPlayerRace(p) == RACE_HUMAN`,
 * through a table built on the first call: reading a constant creates
 * nothing, and nothing is built at Lua root. A Handle no constant names
 * raises an error naming `native`, so a value a later Patch adds is noticed;
 * level 2 names the line that read the member, the matcher being tail-called.
 */
function enumMatcher<H extends handle, E>(
  enumName: string,
  constants: () => [H, E][],
): (value: H, native: string) => E {
  let members: LuaMap<H, E> | undefined;
  return (value, native) => {
    if (members === undefined) {
      members = new LuaMap();
      for (const [constant, member] of constants()) {
        members.set(constant, member);
      }
    }
    const member = members.get(value);
    if (member === undefined) {
      error(
        `${LIBRARY}: ${native} returned a value ${enumName} does not name`,
        2,
      );
    }
    return member;
  };
}

/** The `EquipmentType` of an `equipmentType` Handle `native` returned. */
export const equipmentTypeOf = enumMatcher("EquipmentType", () => [
  [EQUIPMENT_TYPE_NONE, EquipmentType.None],
  [EQUIPMENT_TYPE_HEAD, EquipmentType.Head],
  [EQUIPMENT_TYPE_CHEST, EquipmentType.Chest],
  [EQUIPMENT_TYPE_GLOVES, EquipmentType.Gloves],
  [EQUIPMENT_TYPE_BOOTS, EquipmentType.Boots],
  [EQUIPMENT_TYPE_RING, EquipmentType.Ring],
  [EQUIPMENT_TYPE_PRIMARY, EquipmentType.Primary],
  [EQUIPMENT_TYPE_OFFHAND, EquipmentType.Offhand],
  [EQUIPMENT_TYPE_TRINKET, EquipmentType.Trinket],
  [EQUIPMENT_TYPE_ANY, EquipmentType.Any],
]);

/** The `ItemTag` of an `itemTag` Handle `native` returned. */
export const itemTagOf = enumMatcher("ItemTag", () => [
  [ITEMTAG_TYPE_UNDEFINED, ItemTag.Undefined],
  [ITEMTAG_TYPE_DROPPABLE, ItemTag.Droppable],
  [ITEMTAG_TYPE_QUESTREWARD, ItemTag.QuestReward],
  [ITEMTAG_TYPE_BOSSDROP, ItemTag.BossDrop],
  [ITEMTAG_TYPE_SECRET, ItemTag.Secret],
  [ITEMTAG_TYPE_PUZZLE, ItemTag.Puzzle],
  [ITEMTAG_TYPE_WORLD, ItemTag.World],
  [ITEMTAG_TYPE_SHOP, ItemTag.Shop],
  [ITEMTAG_TYPE_ANY, ItemTag.Any],
]);
