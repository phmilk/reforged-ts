// The enumeration, event and instance lookups return the Wrapper or
// undefined; rallyPoint is a lookup too.
import { Destructable, Group, Item, Point, Unit, Widget } from "reforged-ts";

declare const unit: Unit;
declare const group: Group;

const enumerated: Unit | undefined = Unit.fromEnum();
const filtered: Unit | undefined = Unit.fromFilter();
const triggering: Widget | undefined = Widget.fromEvent();
const manipulated: Item | undefined = Item.fromEvent();
const destroyed: Destructable | undefined = Destructable.fromEvent();
const inSlot: Item | undefined = unit.getItemInSlot(0);
const rally: Point | undefined = unit.rallyPoint;
const first: Unit | undefined = group.first;
const at: Unit | undefined = group.getUnitAt(0);

export {
  enumerated,
  filtered,
  triggering,
  manipulated,
  destroyed,
  inSlot,
  rally,
  first,
  at,
};
