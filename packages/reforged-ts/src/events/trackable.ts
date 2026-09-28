/** @noSelfInFile */

import { Trackable } from "../handles/trackable";
import type { Trigger } from "../handles/trigger";
import { required } from "./descriptor";
import { eventRows } from "./rows";

/**
 * The payload of `TrackableEvents.hit` and `TrackableEvents.track`: the
 * Trackable read back, always set.
 */
export interface TrackablePayload {
  /** The Trackable hit or tracked. */
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
 * `TrackableEvents.track(trackable)` for one Trackable. The payload is a
 * {@link TrackablePayload}.
 */
export const TrackableEvents = eventRows("TrackableEvents", {
  /**
   * `trackable` is clicked; the payload reads it back as the hit one.
   * @native TriggerRegisterTrackableHitEvent
   */
  hit: {
    /** Registers a click on `trackable` on the Trigger. */
    register: (trigger: Trigger, trackable: Trackable) => {
      trigger.registerTrackableHit(trackable);
    },
    /** Reads the clicked Trackable. */
    read: readTrackable,
  },
  /**
   * The mouse moves over `trackable`; the payload reads it back.
   * @native TriggerRegisterTrackableTrackEvent
   */
  track: {
    /** Registers the mouse moving over `trackable` on the Trigger. */
    register: (trigger: Trigger, trackable: Trackable) => {
      trigger.registerTrackableTrack(trackable);
    },
    /** Reads the tracked Trackable. */
    read: readTrackable,
  },
});
