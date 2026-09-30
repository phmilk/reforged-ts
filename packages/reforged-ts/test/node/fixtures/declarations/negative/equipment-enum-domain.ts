// A numeric enum accepts any `number`-typed value, but not a literal outside
// its domain: 42 names no EquipmentType, 9 names none of ItemTag's.
import { EquipmentType, Item, ItemTag } from "reforged-ts";

export function outOfDomain(): void {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-assignment -- Negative: the literal names no member, which the line proves
  Item.chooseRandomWithFilter(ITEM_TYPE_ANY, 1, 42, ItemTag.Any); // error TS2345
  // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-assignment -- Negative: the literal names no member, which the line proves
  Item.chooseRandomWithFilter(ITEM_TYPE_ANY, 1, EquipmentType.Any, 9); // error TS2345
}
