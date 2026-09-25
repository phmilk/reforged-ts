/** @noSelfInFile */

// TimerEvents.expired(timer) through on(): the suite of support/events.ts,
// which fires the Subscription's Trigger with a stubbed context and observes
// the call log and the Timer the handler received.

import { Timer, TimerEvents } from "../../src/index";
import { describeDescriptor } from "../support/events";
import { handleRef } from "../support/handle-ref";

const timer = Timer.create();

describeDescriptor({
  name: "TimerEvents.expired",
  descriptor: TimerEvents.expired(timer),
  registers: (trigger) => [
    `TriggerRegisterTimerExpireEvent(${trigger}, ${handleRef("timer", timer.handle)})`,
  ],
  context: { GetExpiredTimer: timer.handle },
  payload: { timer },
  required: [["timer", "GetExpiredTimer"]],
});
