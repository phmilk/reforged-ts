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
import { protect } from "../reforged/protect";

/**
 * An Event descriptor: how one game event registers on a Trigger and how its
 * payload is read from the trigger context. Its functions take no `self`.
 * @remarks
 * The library's descriptors live in the events namespaces (`UnitEvents`,
 * `PlayerEvents` and the others) and are passed to `on()`. Every payload
 * field is set unless the descriptor's comment says it can be `undefined`:
 * a guaranteed field the game leaves empty raises
 * `reforged-ts: missing <field> in the <descriptor> payload`, a library or
 * engine bug rather than the Map project's mistake.
 * @typeParam P - The payload the handler receives.
 * @noSelf
 */
export interface EventDescriptor<P> {
  /**
   * The descriptor's name (`UnitEvents.death`), which a Dev-mode report of
   * a failing handler or `when` names. The library's descriptors all carry
   * one; a descriptor without one is reported as `on`.
   */
  readonly name?: string;
  /** Registers the event on `trigger`. */
  readonly register: (trigger: Trigger) => void;
  /** Reads the payload from the running trigger context. */
  readonly read: () => P;
  /** Set on the events that run inside a damage context. */
  readonly damage?: true;
}

/**
 * What `on()` returns for one handler: the Trigger it created, owned by the
 * caller of `on()`.
 * @remarks
 * Nothing ends a Subscription but its `destroy()`: the handler runs for
 * every matching event until then, for the rest of the game when it is never
 * called. Keep the Subscription for a handler that must stop, such as a
 * listener for one round or one unit.
 * @example Ending a Subscription from its own handler
 * {@includeCode ../../examples/harness/events-on.ts#subscription}
 */
export interface Subscription {
  /**
   * The Trigger the event is registered on, which the caller owns: it can
   * be disabled or given more events, but destroy it through the
   * Subscription.
   */
  readonly trigger: Trigger;
  /**
   * Ends the Subscription: destroys its Trigger, with the event
   * registration, the `when` condition and the handler, and no other
   * Trigger. The handler never runs again.
   * @example Ending a Subscription from its own handler
   * {@includeCode ../../examples/harness/events-on.ts#subscription}
   */
  destroy(): void;
}

class TriggerSubscription implements Subscription {
  public constructor(public readonly trigger: Trigger) {}

  public destroy(): void {
    this.trigger.destroy();
  }
}

/**
 * Subscribes `handler` to `event` on a new Trigger: `when`, if given, runs
 * first as the trigger's condition, and the handler runs only when it
 * returns true. Each reads the payload from the trigger context.
 * @remarks
 * - In Dev mode each runs under `pcall`, through the protection step, and
 *   a failure is reported under the descriptor's name
 *   (`reforged-ts: UnitEvents.death failed: ...`): a `when` that throws
 *   evaluates false. The Trigger's own protection of its action and
 *   condition stays in place around them; it sees no failure, the
 *   descriptor's step having caught it.
 * - `when` runs as a trigger condition, where the sleeping Natives are
 *   invalid. Across Subscriptions to one event the game runs the Triggers in
 *   registration order in practice, which it does not guarantee.
 * - Call it from an Init stage (`Init.onTriggers` or later), never at
 *   module top level: it creates a Trigger.
 * @example A handler with a filter
 * {@includeCode ../../examples/harness/events-on.ts#on}
 * @typeParam P - The event's payload.
 * @param event - The Event descriptor, such as `UnitEvents.death` or
 * `PlayerEvents.chat(player, "-help", true)`.
 * @param handler - Runs for each event `when` accepts, with its payload.
 * @param when - Decides from the payload whether `handler` runs; it runs
 * for every event when left out.
 * @returns The Subscription, which the caller owns: its `destroy()` ends
 * the handler.
 * @throws What `Trigger.create` throws: `reforged-ts: failed to create Trigger`
 * when the game returns no handle, and in Dev mode when called before the
 * globals Init stage or inside `MapPlayer.runLocal`.
 * @native CreateTrigger
 * @native TriggerAddCondition
 * @native Condition
 * @native TriggerAddAction
 */
export function on<P>(
  event: EventDescriptor<P>,
  handler: (payload: P) => void,
  when?: (payload: P) => boolean,
): Subscription {
  const name = event.name ?? "on";
  const trigger = Trigger.create();
  event.register(trigger);
  if (when !== undefined) {
    trigger.addCondition(
      protect(undefined, name, () => when(event.read()), false),
    );
  }
  trigger.addAction(
    protect(undefined, name, () => {
      handler(event.read());
    }),
  );
  return new TriggerSubscription(trigger);
}

/**
 * A payload field the event guarantees: `value`, or an error naming `field`
 * and `event` (`UnitEvents.death`) when the Native gave nothing, which is a
 * library or engine bug, never the Map project's mistake.
 * @param value - What the response Native read.
 * @param field - The payload field, for the message.
 * @param event - The descriptor's name, for the message.
 * @returns `value`, never `undefined`.
 * @throws When `value` is `undefined`:
 * `reforged-ts: missing <field> in the <event> payload`.
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
