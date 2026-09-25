/** @noSelfInFile */

import { Trackable } from "../handles/trackable";
import type { EventDescriptor } from "./descriptor";
import { required } from "./descriptor";

/**
 * The trackable Event descriptors: `TrackableEvents.hit(trackable)` and
 * `TrackableEvents.track(trackable)` for one Trackable.
 */
export const TrackableEvents = {
  /** `trackable` is clicked; the payload reads it back as the hit one. */
  hit: (trackable: Trackable): EventDescriptor<{ trackable: Trackable }> => ({
    register: (trigger) => {
      trigger.registerTrackableHit(trackable);
    },
    read: () => ({
      trackable: required(
        Trackable.fromEvent(),
        "trackable",
        "TrackableEvents.hit",
      ),
    }),
  }),
  /** The mouse moves over `trackable`; the payload reads it back. */
  track: (trackable: Trackable): EventDescriptor<{ trackable: Trackable }> => ({
    register: (trigger) => {
      trigger.registerTrackableTrack(trackable);
    },
    read: () => ({
      trackable: required(
        Trackable.fromEvent(),
        "trackable",
        "TrackableEvents.track",
      ),
    }),
  }),
};
