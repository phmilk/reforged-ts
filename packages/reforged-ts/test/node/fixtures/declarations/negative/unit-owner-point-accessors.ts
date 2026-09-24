// The deprecated `owner` and `point` accessors are gone: getOwner/setOwner
// and getPoint/setPoint stay.
import { MapPlayer, Point, Unit } from "reforged-ts";

declare const unit: Unit;
declare const owner: MapPlayer;
declare const point: Point;

export function move(): void {
  unit.owner = owner; // error TS2339
  unit.point = point; // error TS2339
}
