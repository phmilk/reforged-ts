// A complete Trigger in one expression: every registration, addCondition with
// a plain function and addAction return the Trigger; filters are optional.
import { Frame, MapPlayer, MouseEventKind, Timer, Trigger } from "reforged-ts";

declare const timer: Timer;
declare const frame: Frame;
declare const player: MapPlayer;

const trigger: Trigger = Trigger.create()
  .registerTimerExpire(timer)
  .registerFrameEvent(frame, FRAMEEVENT_CONTROL_CLICK)
  .registerPlayerMouseEvent(player, MouseEventKind.Move)
  .registerPlayerUnitEvent(player, EVENT_PLAYER_UNIT_DEATH)
  .registerAnyUnitEvent(EVENT_PLAYER_UNIT_ATTACKED)
  .addCondition(() => true)
  .addAction(() => {
    trigger.enabled = false;
  });

export { trigger };
