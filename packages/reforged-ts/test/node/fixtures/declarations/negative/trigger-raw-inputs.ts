// A Trigger registration takes the Wrapper: a raw timer is not a Timer, a raw
// trackable is not a Trackable, and the mouse registration takes
// MouseEventKind, not the Blizzard.j number.
import { MapPlayer, Trigger } from "reforged-ts";

declare const trigger: Trigger;
declare const rawTimer: timer;
declare const rawTrackable: trackable;
declare const player: MapPlayer;

export function register(): void {
  trigger.registerTimerExpire(rawTimer); // error TS2345
  trigger.registerTrackableHit(rawTrackable); // error TS2345
  trigger.registerTrackableTrack(rawTrackable); // error TS2345
  trigger.registerPlayerMouseEvent(player, 0); // error TS2345
}
