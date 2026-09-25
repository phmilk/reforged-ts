/** @noSelfInFile */

import { Timer } from "../handles/timer";
import type { EventDescriptor } from "./descriptor";
import { required } from "./descriptor";

/** The timer Event descriptors: `TimerEvents.expired(timer)` for one Timer. */
export const TimerEvents = {
  /** `timer` expires; the payload reads it back as the expired Timer. */
  expired: (timer: Timer): EventDescriptor<{ timer: Timer }> => ({
    register: (trigger) => {
      trigger.registerTimerExpire(timer);
    },
    read: () => ({
      timer: required(Timer.fromExpired(), "timer", "TimerEvents.expired"),
    }),
  }),
};
