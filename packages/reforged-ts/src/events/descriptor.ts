/** @noSelfInFile */

// The second event surface: `on(descriptor, handler, when?)`. An Event
// descriptor registers one game event on a Trigger and reads that event's
// payload from the trigger context; `on()` creates one Trigger per call, adds
// `when` as its condition and the handler as its action, and returns the
// Subscription the caller owns and ends with `destroy()`.
//
// Ordering: within one Subscription, `when` runs before the handler, as a
// trigger condition (where sleeping Natives are invalid), and each reads the
// payload from the same trigger context. Across Subscriptions to the same
// event the library promises nothing beyond what the game does: Triggers fire
// in registration order in practice, which the game does not guarantee.

import { Trigger } from "../handles/trigger";

/**
 * An Event descriptor: how one game event registers on a Trigger and how its
 * payload is read from the trigger context. Its functions take no `self`.
 * @noSelf
 */
export interface EventDescriptor<P> {
  /** Registers the event on `trigger`. */
  readonly register: (trigger: Trigger) => void;
  /** Reads the payload from the running trigger context. */
  readonly read: () => P;
  /** Set on the events that run inside a damage context. */
  readonly damage?: true;
}

/** The Trigger `on()` created for one handler; `destroy()` ends it. */
export interface Subscription {
  /** The Trigger the event is registered on, which the caller owns. */
  readonly trigger: Trigger;
  /** Ends the Subscription: destroys its Trigger and no other. */
  destroy(): void;
}

class TriggerSubscription implements Subscription {
  public constructor(public readonly trigger: Trigger) {}

  public destroy(): void {
    this.trigger.destroy();
  }
}

/**
 * The one path from the library to a Map project's handler or `when`
 * predicate. A plain call; the runtime Guards wrap it in Dev mode.
 */
function dispatch<P, R>(callback: (payload: P) => R, payload: P): R {
  return callback(payload);
}

/**
 * Subscribes `handler` to `event` on a new Trigger: `when`, if given, runs
 * first as the trigger's condition, and the handler runs only when it
 * returns true. Each reads the payload from the trigger context.
 */
export function on<P>(
  event: EventDescriptor<P>,
  handler: (payload: P) => void,
  when?: (payload: P) => boolean,
): Subscription {
  const trigger = Trigger.create();
  event.register(trigger);
  if (when !== undefined) {
    trigger.addCondition(() => dispatch(when, event.read()));
  }
  trigger.addAction(() => {
    dispatch(handler, event.read());
  });
  return new TriggerSubscription(trigger);
}

/**
 * A payload field the event guarantees: `value`, or an error naming `field`
 * and `event` (`UnitEvents.death`) when the Native gave nothing, which is a
 * library or engine bug, never the Map project's mistake.
 */
export function required<T>(
  value: T | undefined,
  field: string,
  event: string,
): T {
  if (value === undefined) {
    error(`reforged-ts: missing ${field} in the ${event} payload`, 2);
  }
  return value;
}
