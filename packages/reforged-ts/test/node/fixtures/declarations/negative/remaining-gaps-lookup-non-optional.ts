// An event lookup's result assigned to a non-optional Wrapper: the Native
// answers nothing outside its event, and Point | undefined is not assignable
// to Point.
import { Item, Point } from "reforged-ts";

const target: Point = Point.fromSpellTarget(); // error TS2322
const stacked: Item = Item.fromStackingTarget(); // error TS2322

export { stacked, target };
