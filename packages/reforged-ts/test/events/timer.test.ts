/** @noSelfInFile */

// TimerEvents through on(): the suites of support/events.ts, iterating the
// namespace's members, which fire the Subscription's Trigger with a stubbed
// context and observe the call log and the Timer the handler received.

import { Timer, TimerEvents } from "../../src/index";
import { describeNamespace } from "../support/events";
import { handleRef } from "../support/handle-ref";

const timer = Timer.create();

describeNamespace("TimerEvents", TimerEvents, {
  expired: [
    {
      args: [timer],
      registers: (trigger) => [
        `TriggerRegisterTimerExpireEvent(${trigger}, ${handleRef("timer", timer.handle)})`,
      ],
      context: { GetExpiredTimer: timer.handle },
      payload: { timer },
      required: [["timer", "GetExpiredTimer"]],
    },
  ],
});
