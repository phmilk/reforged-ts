/** @noSelfInFile */

// TrackableEvents through on(): the suites of support/events.ts, iterating
// the namespace's members, which fire the Subscription's Trigger with a
// stubbed context and observe the call log and the Trackable the handler
// received.

import { Trackable, TrackableEvents } from "../../src/index";
import { describeNamespace } from "../support/events";
import { handleRef } from "../support/handle-ref";

const trackable = Trackable.create("trackable.mdl", 0, 0, 0);
const trackableRef = handleRef("trackable", trackable.handle);

/** The case of a member registering through the Native `native`. */
function trackableCase(native: string) {
  return {
    args: [trackable] as const,
    registers: (trigger: string) => [`${native}(${trigger}, ${trackableRef})`],
    context: { GetTriggeringTrackable: trackable.handle },
    payload: { trackable },
    required: [["trackable", "GetTriggeringTrackable"]] as const,
  };
}

describeNamespace("TrackableEvents", TrackableEvents, {
  hit: [trackableCase("TriggerRegisterTrackableHitEvent")],
  track: [trackableCase("TriggerRegisterTrackableTrackEvent")],
});
