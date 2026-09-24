// A live unit has an owner: getOwner is the documented non-null path.
import { MapPlayer, Unit } from "reforged-ts";

declare const unit: Unit;

const owner: MapPlayer = unit.getOwner();

export { owner };
