// The renamed registrations have no alias: registerTimerExpireEvent and
// triggerRegisterFrameEvent are gone (TS2551 suggests the new names).
import { Frame, Timer, Trigger } from "reforged-ts";

declare const trigger: Trigger;
declare const timer: Timer;
declare const frame: Frame;

export function register(): void {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call -- Negative: the member does not exist, so its type does not resolve
  trigger.registerTimerExpireEvent(timer.handle); // error TS2551
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call -- Negative: the member does not exist, so its type does not resolve
  trigger.triggerRegisterFrameEvent(frame, FRAMEEVENT_CONTROL_CLICK); // error TS2551
}
