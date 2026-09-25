// A Trackable is created, registered for its hit and track events through the
// Wrapper, and read back in the action as Trackable | undefined.
import { Trackable, Trigger } from "reforged-ts";

const trackable: Trackable = Trackable.create("trackable.mdl", 0, 0, 270);
let triggering: Trackable | undefined;

const trigger: Trigger = Trigger.create()
  .registerTrackableHit(trackable)
  .registerTrackableTrack(trackable)
  .addAction(() => {
    triggering = Trackable.fromEvent();
  });

export { trigger, triggering };
