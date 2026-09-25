/** @noSelfInFile */

import { Timer } from "../handles/timer";
import type { Trigger } from "../handles/trigger";
import { required } from "./descriptor";
import { eventRows } from "./rows";

/** The timer Event descriptors: `TimerEvents.expired(timer)` for one Timer. */
export const TimerEvents = eventRows("TimerEvents", {
  /** `timer` expires; the payload reads it back as the expired Timer. */
  expired: {
    register: (trigger: Trigger, timer: Timer) => {
      trigger.registerTimerExpire(timer);
    },
    read: (event) => ({
      timer: required(Timer.fromExpired(), "timer", event),
    }),
  },
});
