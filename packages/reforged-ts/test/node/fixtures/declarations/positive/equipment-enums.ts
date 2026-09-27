// The equipment enums are what the Item members take and return: a member
// passed where the enum is expected, a getter compared with and switched on.
import { EquipmentType, Item, ItemTag } from "reforged-ts";

declare const item: Item;

const ring: number = Item.chooseRandomWithFilter(
  ITEM_TYPE_PERMANENT,
  3,
  EquipmentType.Ring,
  ItemTag.Shop,
);

const onHead: boolean = item.equipmentType === EquipmentType.Head;

function isLoot(tag: ItemTag): boolean {
  switch (tag) {
    case ItemTag.Droppable:
    case ItemTag.BossDrop:
      return true;
    default:
      return false;
  }
}

const loot = isLoot(item.tag);

export { loot, onHead, ring };
