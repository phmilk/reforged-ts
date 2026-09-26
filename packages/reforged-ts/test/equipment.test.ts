/** @noSelfInFile */

// The equipment enums hold the integers the Patch converts: each member,
// converted through its `Convert*` Native, is the named constant of the same
// place in common.j (the stubs make `ConvertEquipmentType(1)` the object
// `EQUIPMENT_TYPE_HEAD` is, as the game does).

import { describe, expect, it } from "reforged-test/lua";
import { EquipmentType, ItemTag, LoadoutSlot } from "../src/index";

describe("EquipmentType", () => {
  const cases: [EquipmentType, equipmentType, string][] = [
    [EquipmentType.None, EQUIPMENT_TYPE_NONE, "None"],
    [EquipmentType.Head, EQUIPMENT_TYPE_HEAD, "Head"],
    [EquipmentType.Chest, EQUIPMENT_TYPE_CHEST, "Chest"],
    [EquipmentType.Gloves, EQUIPMENT_TYPE_GLOVES, "Gloves"],
    [EquipmentType.Boots, EQUIPMENT_TYPE_BOOTS, "Boots"],
    [EquipmentType.Ring, EQUIPMENT_TYPE_RING, "Ring"],
    [EquipmentType.Primary, EQUIPMENT_TYPE_PRIMARY, "Primary"],
    [EquipmentType.Offhand, EQUIPMENT_TYPE_OFFHAND, "Offhand"],
    [EquipmentType.Trinket, EQUIPMENT_TYPE_TRINKET, "Trinket"],
    [EquipmentType.Any, EQUIPMENT_TYPE_ANY, "Any"],
  ];
  for (const [member, constant, name] of cases) {
    it(`converts ${name} to its named constant`, () => {
      expect(ConvertEquipmentType(member)).toBe(constant);
    });
  }
});

describe("ItemTag", () => {
  const cases: [ItemTag, itemTag, string][] = [
    [ItemTag.Undefined, ITEMTAG_TYPE_UNDEFINED, "Undefined"],
    [ItemTag.Droppable, ITEMTAG_TYPE_DROPPABLE, "Droppable"],
    [ItemTag.QuestReward, ITEMTAG_TYPE_QUESTREWARD, "QuestReward"],
    [ItemTag.BossDrop, ITEMTAG_TYPE_BOSSDROP, "BossDrop"],
    [ItemTag.Secret, ITEMTAG_TYPE_SECRET, "Secret"],
    [ItemTag.Puzzle, ITEMTAG_TYPE_PUZZLE, "Puzzle"],
    [ItemTag.World, ITEMTAG_TYPE_WORLD, "World"],
    [ItemTag.Shop, ITEMTAG_TYPE_SHOP, "Shop"],
    [ItemTag.Any, ITEMTAG_TYPE_ANY, "Any"],
  ];
  for (const [member, constant, name] of cases) {
    it(`converts ${name} to its named constant`, () => {
      expect(ConvertItemTag(member)).toBe(constant);
    });
  }
});

describe("LoadoutSlot", () => {
  const cases: [LoadoutSlot, loadoutslot, string][] = [
    [LoadoutSlot.Head, EQUIPMENT_LOADOUT_SLOT_HEAD, "Head"],
    [LoadoutSlot.Chest, EQUIPMENT_LOADOUT_SLOT_CHEST, "Chest"],
    [LoadoutSlot.Gloves, EQUIPMENT_LOADOUT_SLOT_GLOVES, "Gloves"],
    [LoadoutSlot.Boots, EQUIPMENT_LOADOUT_SLOT_BOOTS, "Boots"],
    [LoadoutSlot.Ring, EQUIPMENT_LOADOUT_SLOT_RING, "Ring"],
    [LoadoutSlot.RingAlt, EQUIPMENT_LOADOUT_SLOT_RINGALT, "RingAlt"],
    [LoadoutSlot.Primary, EQUIPMENT_LOADOUT_SLOT_PRIMARY, "Primary"],
    [LoadoutSlot.Offhand, EQUIPMENT_LOADOUT_SLOT_OFFHAND, "Offhand"],
    [LoadoutSlot.Trinket, EQUIPMENT_LOADOUT_SLOT_TRINKET, "Trinket"],
  ];
  for (const [member, constant, name] of cases) {
    it(`converts ${name} to its named constant`, () => {
      expect(ConvertLoadoutSlot(member)).toBe(constant);
    });
  }
});
