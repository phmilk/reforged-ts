/** @noSelfInFile */

import { Timer } from "../handles/timer";
import type { Trigger } from "../handles/trigger";
import { required } from "./descriptor";
import { eventRows } from "./rows";

/**
 * The timer Event descriptors: `TimerEvents.expired(timer)` for one Timer.
 * The payload's `timer` is always set.
 * @example A second listener on a Timer
 * {@includeCode ../../examples/harness/timer-events.ts}
 * @namespace
 */
export const TimerEvents = eventRows("TimerEvents", {
  /**
   * `timer` expires; the payload reads it back as the expired Timer.
   * @example A second listener on a Timer
   * {@includeCode ../../examples/harness/timer-events.ts}
   * @native TriggerRegisterTimerExpireEvent
   */
  expired: {
    /** Registers the expiry of `timer` on the Trigger. */
    register: (trigger: Trigger, timer: Timer) => {
      trigger.registerTimerExpire(timer);
    },
    /** Reads the expired Timer. */
    read: (event) => ({
      /** The Timer that expired. */
      timer: required(Timer.fromExpired(), "timer", event),
    }),
  },
});
