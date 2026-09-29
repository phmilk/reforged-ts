/** @noSelfInFile */

import { Region } from "../handles/region";
import type { Trigger } from "../handles/trigger";
import { Unit } from "../handles/unit";
import { required } from "./descriptor";
import { eventRows } from "./rows";

/**
 * The payload of `RegionEvents.enter` and `RegionEvents.leave`: the unit and
 * the region it crossed, both always set.
 */
export interface RegionCrossing {
  /** The unit entering or leaving. */
  unit: Unit;
  /** The region it crossed. */
  region: Region;
}

/**
 * The region Event descriptors: `RegionEvents.enter(region, filter?)` and
 * `RegionEvents.leave(region, filter?)` for one Region. The filter, a
 * `boolexpr` or a plain function, is handed to the registration. The
 * payload, a {@link RegionCrossing}, always holds the unit and the region.
 * @namespace
 */
export const RegionEvents = eventRows("RegionEvents", {
  /**
   * A unit enters `region`, when `filter` (if given) accepts it.
   * @native TriggerRegisterEnterRegion
   */
  enter: {
    /** Registers the units entering `region` on the Trigger. */
    register: (
      trigger: Trigger,
      region: Region,
      filter?: boolexpr | (() => boolean),
    ) => {
      trigger.registerEnterRegion(region, filter);
    },
    /** Reads the entering unit and the region. */
    read: (event): RegionCrossing => ({
      unit: required(Unit.fromEntering(), "unit", event),
      region: required(Region.fromEvent(), "region", event),
    }),
  },
  /**
   * A unit leaves `region`, when `filter` (if given) accepts it.
   * @native TriggerRegisterLeaveRegion
   */
  leave: {
    /** Registers the units leaving `region` on the Trigger. */
    register: (
      trigger: Trigger,
      region: Region,
      filter?: boolexpr | (() => boolean),
    ) => {
      trigger.registerLeaveRegion(region, filter);
    },
    /** Reads the leaving unit and the region. */
    read: (event): RegionCrossing => ({
      unit: required(Unit.fromLeaving(), "unit", event),
      region: required(Region.fromEvent(), "region", event),
    }),
  },
});
