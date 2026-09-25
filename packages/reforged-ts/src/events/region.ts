/** @noSelfInFile */

import { Region } from "../handles/region";
import { Unit } from "../handles/unit";
import type { EventDescriptor } from "./descriptor";
import { required } from "./descriptor";

/** The payload of a region event: the unit and the region it crossed. */
interface RegionCrossing {
  unit: Unit;
  region: Region;
}

/**
 * The region Event descriptors: `RegionEvents.enter(region, filter?)` and
 * `RegionEvents.leave(region, filter?)` for one Region. The filter, a
 * `boolexpr` or a plain function, is handed to the registration.
 */
export const RegionEvents = {
  /** A unit enters `region`, when `filter` (if given) accepts it. */
  enter: (
    region: Region,
    filter?: boolexpr | (() => boolean),
  ): EventDescriptor<RegionCrossing> => ({
    register: (trigger) => {
      trigger.registerEnterRegion(region, filter);
    },
    read: () => ({
      unit: required(Unit.fromEntering(), "unit", "RegionEvents.enter"),
      region: required(Region.fromEvent(), "region", "RegionEvents.enter"),
    }),
  }),
  /** A unit leaves `region`, when `filter` (if given) accepts it. */
  leave: (
    region: Region,
    filter?: boolexpr | (() => boolean),
  ): EventDescriptor<RegionCrossing> => ({
    register: (trigger) => {
      trigger.registerLeaveRegion(region, filter);
    },
    read: () => ({
      unit: required(Unit.fromLeaving(), "unit", "RegionEvents.leave"),
      region: required(Region.fromEvent(), "region", "RegionEvents.leave"),
    }),
  }),
};
