/** @noSelfInFile */

import { LIBRARY } from "../init/state";

/**
 * The equipment type of an item, the integer `ConvertEquipmentType` takes:
 * `EQUIPMENT_TYPE_NONE` to `EQUIPMENT_TYPE_ANY`, in the Patch's order.
 */
export enum EquipmentType {
  None = 0,
  Head = 1,
  Chest = 2,
  Gloves = 3,
  Boots = 4,
  Ring = 5,
  Primary = 6,
  Offhand = 7,
  Trinket = 8,
  Any = 9,
}

/**
 * The tag of an item, the integer `ConvertItemTag` takes:
 * `ITEMTAG_TYPE_UNDEFINED` to `ITEMTAG_TYPE_ANY`, in the Patch's order.
 */
export enum ItemTag {
  Undefined = 0,
  Droppable = 1,
  QuestReward = 2,
  BossDrop = 3,
  Secret = 4,
  Puzzle = 5,
  World = 6,
  Shop = 7,
  Any = 8,
}

/**
 * A slot of a unit's equipment loadout, the integer `ConvertLoadoutSlot`
 * takes: `EQUIPMENT_LOADOUT_SLOT_HEAD` to `EQUIPMENT_LOADOUT_SLOT_TRINKET`,
 * in the Patch's order.
 */
export enum LoadoutSlot {
  Head = 0,
  Chest = 1,
  Gloves = 2,
  Boots = 3,
  Ring = 4,
  RingAlt = 5,
  Primary = 6,
  Offhand = 7,
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
function matcher<H extends handle, E>(
  name: string,
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
      error(`${LIBRARY}: ${native} returned a value ${name} does not name`, 2);
    }
    return member;
  };
}

/** The `EquipmentType` of an `equipmentType` Handle `native` returned. */
export const equipmentTypeOf = matcher("EquipmentType", () => [
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
export const itemTagOf = matcher("ItemTag", () => [
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
