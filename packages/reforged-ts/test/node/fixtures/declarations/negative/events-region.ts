// RegionEvents take the Region Wrapper and a boolean filter, and the entering
// and leaving lookups may find nothing.
import { on, Region, RegionEvents, Unit } from "reforged-ts";

declare const region: Region;
declare const rawRegion: region;
declare const nameOf: () => string;

export function subscribe(): void {
  on(RegionEvents.enter(rawRegion), () => undefined); // error TS2345
  on(RegionEvents.leave(region, nameOf), () => undefined); // error TS2345
}

export const entering: Unit = Unit.fromEntering(); // error TS2322
export const leaving: Unit = Unit.fromLeaving(); // error TS2322
