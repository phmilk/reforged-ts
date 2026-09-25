/** @noSelfInFile */

import { Trackable } from "../handles/trackable";
import type { Trigger } from "../handles/trigger";
import { required } from "./descriptor";
import { eventRows } from "./rows";

/** The payload of a trackable event: the Trackable read back. */
interface TrackablePayload {
  trackable: Trackable;
}

/** Reads the triggering Trackable, naming `event` when it is missing. */
function readTrackable(event: string): TrackablePayload {
  return {
    trackable: required(Trackable.fromEvent(), "trackable", event),
  };
}

/**
 * The trackable Event descriptors: `TrackableEvents.hit(trackable)` and
 * `TrackableEvents.track(trackable)` for one Trackable.
 */
export const TrackableEvents = eventRows("TrackableEvents", {
  /** `trackable` is clicked; the payload reads it back as the hit one. */
  hit: {
    register: (trigger: Trigger, trackable: Trackable) => {
      trigger.registerTrackableHit(trackable);
    },
    read: readTrackable,
  },
  /** The mouse moves over `trackable`; the payload reads it back. */
  track: {
    register: (trigger: Trigger, trackable: Trackable) => {
      trigger.registerTrackableTrack(trackable);
    },
    read: readTrackable,
  },
});
