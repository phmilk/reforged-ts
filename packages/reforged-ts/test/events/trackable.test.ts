/** @noSelfInFile */

// TrackableEvents.hit(trackable) and TrackableEvents.track(trackable) through
// on(): the suites of support/events.ts, which fire the Subscription's
// Trigger with a stubbed context and observe the call log and the Trackable
// the handler received.

import { Trackable, TrackableEvents } from "../../src/index";
import { describeDescriptor } from "../support/events";
import { handleRef } from "../support/handle-ref";

const trackable = Trackable.create("trackable.mdl", 0, 0, 0);

describeDescriptor({
  name: "TrackableEvents.hit",
  descriptor: TrackableEvents.hit(trackable),
  registers: (trigger) => [
    `TriggerRegisterTrackableHitEvent(${trigger}, ${handleRef("trackable", trackable.handle)})`,
  ],
  context: { GetTriggeringTrackable: trackable.handle },
  payload: { trackable },
  required: [["trackable", "GetTriggeringTrackable"]],
});

describeDescriptor({
  name: "TrackableEvents.track",
  descriptor: TrackableEvents.track(trackable),
  registers: (trigger) => [
    `TriggerRegisterTrackableTrackEvent(${trigger}, ${handleRef("trackable", trackable.handle)})`,
  ],
  context: { GetTriggeringTrackable: trackable.handle },
  payload: { trackable },
  required: [["trackable", "GetTriggeringTrackable"]],
});
