// What the game does in the cases of a timer the Probes of #947 and #961
// left out, for the timers stub of `reforged-test` under the Game clock
// (#986):
//
// - what `GetTriggerEventId`, `GetTriggeringTrigger` and `GetExpiredTimer`
//   answer in the condition and in the action of a Trigger registered with
//   `TriggerRegisterTimerExpireEvent`, on a one-shot timer, a periodic one
//   and one never started and resumed, and whether it runs before the
//   timer's handler;
// - in which order two such Triggers of one timer run, whether a Trigger
//   registered twice fires twice, and whether a disabled or a destroyed one
//   is skipped;
// - where a timer's expire event runs among the timers of one instant;
// - what `ResumeTimer`, `PauseTimer` and `TimerStart` do when a timer's own
//   handler calls them: in the first and in the second fire of a resumed
//   timer, and in the handler of an ordinary one-shot and periodic timer;
// - what the same calls and `DestroyTimer` do when a Trigger of the timer's
//   expire event makes them, before the handler of that expiry, and what
//   `DestroyTimer` does in a timer's own handler.
//
// Every record carries `t`, the elapsed time of a reference timer started
// first. Every timer is read in its handler, before and after each call made
// on it, and every half second, a quarter second away from every call.

import type { ProbeContext } from "../game/probe";

/** How long the timers are watched, in seconds. */
const DURATION = 10.5;

/** What a handler does to its own timer in its fire `n`, if anything. */
type InHandler = (n: number) => (() => void) | undefined;

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

  const fires = new Map<string, number>();
  const tracked: (readonly [string, timer])[] = [];

  function read(name: string, timer: timer, moment: string): void {
    p.record("READ", {
      timer: name,
      moment,
      t: t(),
      elapsed: TimerGetElapsed(timer),
      remaining: TimerGetRemaining(timer),
      timeout: TimerGetTimeout(timer),
      fires: fires.get(name) ?? 0,
    });
  }

  /**
   * A handler that records its fire, then makes the call `inHandler` gives
   * for that fire and reads the timer after it.
   */
  function handler(
    name: string,
    timer: timer,
    tag: string,
    inHandler?: InHandler,
  ): () => void {
    return () => {
      const n = (fires.get(name) ?? 0) + 1;
      fires.set(name, n);
      p.record("FIRE", {
        timer: name,
        n,
        handler: tag,
        t: t(),
        elapsed: TimerGetElapsed(timer),
        remaining: TimerGetRemaining(timer),
        timeout: TimerGetTimeout(timer),
        expired: GetExpiredTimer() === timer,
      });
      const act = inHandler?.(n);
      if (act !== undefined) {
        act();
        read(name, timer, `after-call-in-fire-${tostring(n)}`);
      }
    };
  }

  /** Starts a new timer whose handler makes the call `act` on it in its fire `fire`. */
  function start(
    name: string,
    timeout: number,
    periodic: boolean,
    fire?: number,
    act?: (timer: timer) => void,
  ): timer {
    const timer = CreateTimer();
    fires.set(name, 0);
    tracked.push([name, timer]);
    const inHandler: InHandler = (n) =>
      act !== undefined && n === fire
        ? () => {
            act(timer);
          }
        : undefined;
    TimerStart(
      timer,
      timeout,
      periodic,
      handler(name, timer, "first", inHandler),
    );
    return timer;
  }

  /** At `at`, reads the timer, makes the call, and reads it again. */
  function step(
    at: number,
    name: string,
    timer: timer,
    call: string,
    act: () => void,
  ): void {
    p.after(at, () => {
      read(name, timer, `before-${call}`);
      act();
      read(name, timer, `after-${call}`);
    });
  }

  /**
   * A one-shot timer of timeout 2, paused at 0.5 and resumed at 1: alone, it
   * fires at 2.5 and at 4.5. Its handler makes the call `act` in its fire
   * `fire`.
   */
  function resumed(
    name: string,
    fire: number,
    act: (timer: timer) => void,
  ): timer {
    const timer = start(name, 2, false, fire, act);
    step(0.5, name, timer, "pause", () => {
      PauseTimer(timer);
    });
    step(1, name, timer, "resume", () => {
      ResumeTimer(timer);
    });
    return timer;
  }

  /** Records what an expire-event Trigger answers, from a condition or an action. */
  function responses(
    name: string,
    which: string,
    where: string,
    self: trigger,
    timer: timer,
  ): void {
    const eventId = GetTriggerEventId();
    p.record("EXPIRE", {
      timer: name,
      trigger: which,
      where,
      t: t(),
      eventIsTimerExpired: eventId === EVENT_GAME_TIMER_EXPIRED,
      eventId: tostring(eventId),
      eventHandleId: eventId === undefined ? -1 : GetHandleId(eventId),
      timerExpiredHandleId: GetHandleId(EVENT_GAME_TIMER_EXPIRED),
      triggeringIsSelf: GetTriggeringTrigger() === self,
      expiredIsTimer: GetExpiredTimer() === timer,
      expiredTimer: tostring(GetExpiredTimer()),
      elapsed: TimerGetElapsed(timer),
      remaining: TimerGetRemaining(timer),
      timeout: TimerGetTimeout(timer),
      fires: fires.get(name) ?? 0,
    });
  }

  const triggers: trigger[] = [];

  /** A Trigger of the timer's expire event, whose condition and action record the responses. */
  function expireEvent(name: string, which: string, timer: timer): trigger {
    const self = CreateTrigger();
    TriggerAddCondition(
      self,
      Condition(() => {
        responses(name, which, "condition", self, timer);
        return true;
      }),
    );
    TriggerAddAction(self, () => {
      responses(name, which, "action", self, timer);
    });
    TriggerRegisterTimerExpireEvent(self, timer);
    triggers.push(self);
    return self;
  }

  // The responses, on a one-shot and on a periodic timer, each with a handler.
  expireEvent("event-one-shot", "only", start("event-one-shot", 1, false));
  expireEvent("event-periodic", "only", start("event-periodic", 1, true));

  // Two Triggers of one timer, the second one registered twice.
  const two = start("event-two-triggers", 1.5, false);
  expireEvent("event-two-triggers", "first", two);
  const second = expireEvent("event-two-triggers", "second-twice", two);
  TriggerRegisterTimerExpireEvent(second, two);

  // A disabled Trigger, enabled at 2.25, and a destroyed one, on periodic timers.
  const disabled = expireEvent(
    "event-disabled-until-2.25",
    "only",
    start("event-disabled-until-2.25", 1, true),
  );
  DisableTrigger(disabled);
  p.after(2.25, () => {
    EnableTrigger(disabled);
    p.record("STEP", { name: "enabled", t: t() });
  });
  DestroyTrigger(
    expireEvent("event-destroyed", "only", start("event-destroyed", 1, true)),
  );

  // The order of one instant, 3 s from here: a timer, a timer with an expire
  // event registered before every one of them started, and a timer.
  const order: string[] = [];
  function ordered(name: string): () => void {
    return () => {
      order.push(name);
      p.record("ORDER", { name, position: order.length, t: t() });
    };
  }
  const middle = CreateTimer();
  const middleEvent = CreateTrigger();
  TriggerAddAction(middleEvent, ordered("event-of-timer-2"));
  TriggerRegisterTimerExpireEvent(middleEvent, middle);
  TimerStart(CreateTimer(), 3, false, ordered("timer-1"));
  TimerStart(middle, 3, false, ordered("timer-2"));
  TimerStart(CreateTimer(), 3, false, ordered("timer-3"));

  // A timer never started, resumed at 1: what its expire event answers.
  const never = CreateTimer();
  fires.set("event-never-started", 0);
  tracked.push(["event-never-started", never]);
  expireEvent("event-never-started", "only", never);
  step(1, "event-never-started", never, "resume", () => {
    ResumeTimer(never);
  });

  // A resumed timer whose own handler calls on it: in its first fire (2.5)
  // and in its second (4.5).
  resumed("resume-in-first-fire", 1, (timer) => {
    ResumeTimer(timer);
  });
  resumed("pause-in-first-fire", 1, (timer) => {
    PauseTimer(timer);
  });
  resumed("resume-in-second-fire", 2, (timer) => {
    ResumeTimer(timer);
  });
  resumed("pause-in-second-fire", 2, (timer) => {
    PauseTimer(timer);
  });
  resumed("start-in-first-fire", 1, (timer) => {
    TimerStart(
      timer,
      0.75,
      false,
      handler("start-in-first-fire", timer, "second"),
    );
  });

  // An ordinary timer whose own handler calls ResumeTimer on it, in its
  // first fire.
  start("periodic-resume-in-handler", 1, true, 1, (timer) => {
    ResumeTimer(timer);
  });
  start("one-shot-resume-in-handler", 1, false, 1, (timer) => {
    ResumeTimer(timer);
  });

  // A periodic timer paused in its first handler, at 1, and resumed at 2.5.
  const pausedInHandler = start(
    "periodic-pause-in-handler",
    1,
    true,
    1,
    (timer) => {
      PauseTimer(timer);
    },
  );
  step(2.5, "periodic-pause-in-handler", pausedInHandler, "resume", () => {
    ResumeTimer(pausedInHandler);
  });

  /**
   * A Trigger of the timer's expire event whose action records each event
   * and, in its event `at`, makes the call `act` on the timer, reading it
   * after the call unless the call destroyed it.
   */
  function actingTrigger(
    name: string,
    timer: timer,
    at: number,
    act: () => void,
    destroys: boolean,
  ): void {
    const self = CreateTrigger();
    let events = 0;
    TriggerAddAction(self, () => {
      events += 1;
      p.record("TRIGGER", {
        timer: name,
        n: events,
        t: t(),
        elapsed: TimerGetElapsed(timer),
        remaining: TimerGetRemaining(timer),
        timeout: TimerGetTimeout(timer),
        fires: fires.get(name) ?? 0,
      });
      if (events !== at) return;
      act();
      if (destroys) {
        p.record("DESTROYED", { timer: name, where: "trigger", t: t() });
      } else {
        read(name, timer, "after-call-in-trigger");
      }
    });
    TriggerRegisterTimerExpireEvent(self, timer);
    triggers.push(self);
  }

  // A Trigger of the expire event that calls on its timer, at the first
  // expiry (1), before the handler: on a one-shot and on a periodic timer.
  for (const periodic of [false, true]) {
    const kind = periodic ? "periodic" : "one-shot";
    const started = start(`trigger-starts-${kind}`, 1, periodic);
    actingTrigger(
      `trigger-starts-${kind}`,
      started,
      1,
      () => {
        TimerStart(
          started,
          0.75,
          false,
          handler(`trigger-starts-${kind}`, started, "second"),
        );
      },
      false,
    );
    const paused = start(`trigger-pauses-${kind}`, 1, periodic);
    actingTrigger(
      `trigger-pauses-${kind}`,
      paused,
      1,
      () => {
        PauseTimer(paused);
      },
      false,
    );
    const resumedByTrigger = start(`trigger-resumes-${kind}`, 1, periodic);
    actingTrigger(
      `trigger-resumes-${kind}`,
      resumedByTrigger,
      1,
      () => {
        ResumeTimer(resumedByTrigger);
      },
      false,
    );
  }

  /**
   * Starts a timer that is never read from outside, since it is destroyed
   * on the way: its handler records its fire and, in its fire `destroyAt`,
   * destroys it.
   */
  function destroyed(
    name: string,
    timeout: number,
    periodic: boolean,
    destroyAt: number,
  ): timer {
    const timer = CreateTimer();
    let n = 0;
    TimerStart(timer, timeout, periodic, () => {
      n += 1;
      p.record("FIRE", { timer: name, n, handler: "first", t: t() });
      if (n === destroyAt) {
        DestroyTimer(timer);
        p.record("DESTROYED", { timer: name, where: "handler", t: t() });
      }
    });
    return timer;
  }

  // DestroyTimer in a timer's own handler: a periodic timer, in its first
  // fire (1), and a resumed one, in the first of its two fires (2.5).
  destroyed("destroy-in-periodic-handler", 1, true, 1);
  const destroyedResumed = destroyed("destroy-in-first-fire", 2, false, 1);
  p.after(0.5, () => {
    PauseTimer(destroyedResumed);
  });
  p.after(1, () => {
    ResumeTimer(destroyedResumed);
  });

  // DestroyTimer in a Trigger of the expire event, at 6, before the handler
  // of that expiry: a one-shot timer of 6, and a periodic one of 2 in its
  // third expiry. A checkpoint comes first, since it may crash.
  const destroyedOneShot = destroyed("trigger-destroys-one-shot", 6, false, 0);
  actingTrigger(
    "trigger-destroys-one-shot",
    destroyedOneShot,
    1,
    () => {
      DestroyTimer(destroyedOneShot);
    },
    true,
  );
  const destroyedPeriodic = destroyed("trigger-destroys-periodic", 2, true, 0);
  actingTrigger(
    "trigger-destroys-periodic",
    destroyedPeriodic,
    3,
    () => {
      DestroyTimer(destroyedPeriodic);
    },
    true,
  );
  p.after(5.875, () => {
    p.pending("DestroyTimer in a Trigger of the timer's expire event");
    p.checkpoint();
  });
  p.after(6.125, () => {
    p.pending("after DestroyTimer in a Trigger of the timer's expire event");
    p.checkpoint();
  });

  function sample(): void {
    for (const [name, timer] of tracked) read(name, timer, "sample");
  }

  const samples = Math.floor(DURATION / 0.5);
  for (let i = 0; i < samples; i++) {
    p.after(0.25 + 0.5 * i, () => {
      sample();
      if (i % 4 === 3) p.checkpoint();
    });
  }

  p.checkpoint();
  p.after(DURATION, () => {
    // The periodic timers would record past the end.
    for (const [, timer] of tracked) DestroyTimer(timer);
    for (const trigger of triggers) DestroyTrigger(trigger);
    p.record("END_STATE", { order: order.join(","), t: t() });
    p.finish();
  });
}
