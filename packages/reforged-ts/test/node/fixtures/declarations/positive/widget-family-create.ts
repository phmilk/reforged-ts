// The creation members of the Widget family and Group are typed non-null,
// including the Unit members whose Natives allocate.
import { Destructable, Group, Item, Point, Unit } from "reforged-ts";

declare const unit: Unit;

const item: Item = Item.create(FourCC("ratf"), 0, 0);
const tree: Destructable = Destructable.create(FourCC("LTlt"), 0, 0);
const raised: Destructable = Destructable.createZ(FourCC("LTlt"), 0, 0, 0);
const group: Group = Group.create();
const position: Point = unit.getPoint();
const added: Item = unit.addItemById(FourCC("ratf"));

export { item, tree, raised, group, position, added };
