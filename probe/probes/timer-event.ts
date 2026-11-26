// What a Trigger registered with `TriggerRegisterTimerEvent` does, for the
// Game clock of `reforged-test` (#985), which fires those Triggers through
// the Event dispatch:
//
// - what `GetTriggerEventId`, `GetTriggeringTrigger` and `GetExpiredTimer`
//   answer in its condition and in its action, and which runs first;
// - how often a one-shot and a periodic registration fire;
// - whether a disabled Trigger is skipped and fires again once enabled, and
//   whether a destroyed one is skipped silently;
// - whether a registration of timeout 0 fires inside the call;
// - in which order timers and timer events of one instant run.
//
// Every record carries `t`, the elapsed time of a reference timer started
// first.

import type { ProbeContext } from "../game/probe";

/** How long the registrations are watched, in seconds. */
const DURATION = 4.5;

export function run(p: ProbeContext): void {
  p.hold();

  // A timeout of 1000 keeps the reading's float precision near 0.00006.
  const reference = CreateTimer();
  TimerStart(reference, 1000, false, () => {
    // Never reached: the timer is only read.
  });

  function t(): number {
    return TimerGetElapsed(reference);
  }

  /** Records what the response Natives answer, from a condition or an action. */
  function responses(name: string, where: string, self: trigger): void {
    const eventId = GetTriggerEventId();
    p.record("FIRE", {
      name,
      where,
      t: t(),
      eventIsTimerExpired: eventId === EVENT_GAME_TIMER_EXPIRED,
      eventId: tostring(eventId),
      eventHandleId: eventId === undefined ? -1 : GetHandleId(eventId),
      timerExpiredHandleId: GetHandleId(EVENT_GAME_TIMER_EXPIRED),
      triggeringIsSelf: GetTriggeringTrigger() === self,
      expiredTimer: tostring(GetExpiredTimer()),
    });
  }

  /** A Trigger whose condition and action record the responses. */
  function watched(name: string): trigger {
    const self = CreateTrigger();
    TriggerAddCondition(
      self,
      Condition(() => {
        responses(name, "condition", self);
        return true;
      }),
    );
    TriggerAddAction(self, () => {
      responses(name, "action", self);
    });
    return self;
  }

  // The responses, and how often each registration fires.
  TriggerRegisterTimerEvent(watched("once-1"), 1, false);
  TriggerRegisterTimerEvent(watched("every-1"), 1, true);

  // A Trigger with two registrations.
  const twice = watched("two-registrations");
  TriggerRegisterTimerEvent(twice, 1.5, false);
  TriggerRegisterTimerEvent(twice, 2.5, false);

  // A disabled Trigger, enabled at 2.25; a destroyed one.
  const disabled = watched("disabled-until-2.25");
  TriggerRegisterTimerEvent(disabled, 1, true);
  DisableTrigger(disabled);
  p.after(2.25, () => {
    EnableTrigger(disabled);
    p.record("STEP", { name: "enabled", t: t() });
  });
  const destroyed = watched("destroyed");
  TriggerRegisterTimerEvent(destroyed, 1, true);
  DestroyTrigger(destroyed);

  // A timeout of 0: inside the call, or after it.
  let zeroFires = 0;
  const zero = CreateTrigger();
  TriggerAddAction(zero, () => {
    zeroFires += 1;
    if (zeroFires === 1) p.record("ZERO", { name: "first fire", t: t() });
  });
  TriggerRegisterTimerEvent(zero, 0, false);
  p.record("ZERO", { name: "after the call", fires: zeroFires, t: t() });

  // The order of one instant, 3 s from here: a timer, an event, a timer and
  // an event, started in this order.
  const order: string[] = [];
  function ordered(name: string): () => void {
    return () => {
      order.push(name);
      p.record("ORDER", { name, position: order.length, t: t() });
    };
  }
  TimerStart(CreateTimer(), 3, false, ordered("timer-1"));
  const firstEvent = CreateTrigger();
  TriggerAddAction(firstEvent, ordered("event-2"));
  TriggerRegisterTimerEvent(firstEvent, 3, false);
  TimerStart(CreateTimer(), 3, false, ordered("timer-3"));
  const secondEvent = CreateTrigger();
  TriggerAddAction(secondEvent, ordered("event-4"));
  TriggerRegisterTimerEvent(secondEvent, 3, false);

  p.checkpoint();
  p.after(DURATION, () => {
    p.record("END_STATE", {
      zeroFires,
      order: order.join(","),
      t: t(),
    });
    p.finish();
  });
}
