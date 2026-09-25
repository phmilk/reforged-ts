// The renamed registrations have no alias: registerTimerExpireEvent,
// triggerRegisterFrameEvent, registerTrackableHitEvent and
// registerTrackableTrackEvent are gone (TS2551 suggests the new names).
import { Frame, Timer, Trackable, Trigger } from "reforged-ts";

declare const trigger: Trigger;
declare const timer: Timer;
declare const frame: Frame;
declare const trackable: Trackable;

export function register(): void {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call -- Negative: the member does not exist, so its type does not resolve
  trigger.registerTimerExpireEvent(timer.handle); // error TS2551
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call -- Negative: the member does not exist, so its type does not resolve
  trigger.triggerRegisterFrameEvent(frame, FRAMEEVENT_CONTROL_CLICK); // error TS2551
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call -- Negative: the member does not exist, so its type does not resolve
  trigger.registerTrackableHitEvent(trackable.handle); // error TS2551
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call -- Negative: the member does not exist, so its type does not resolve
  trigger.registerTrackableTrackEvent(trackable.handle); // error TS2551
}
