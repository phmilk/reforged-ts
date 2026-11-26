// What `ResumeTimer` does in the cases the resume study of #947 left out
// (#961, for the Game clock of #935 and the decision of #955): a timer never
// started, a `TimerStart` on a timer that was resumed, a second pause and
// resume, and the doubled calls. Every record carries `t`, the elapsed time
// of a reference timer started first. Every timer of the first phase is read
// before and after each call made on it, in its handler, and every half
// second, a quarter second away from every call. The timers never started
// come last, after a checkpoint, since a timer with no handler may crash.

import type { ProbeContext } from "../game/probe";

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
  const expires = new Map<string, number>();
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
      expires: expires.get(name) ?? 0,
    });
  }

  /** A handler that records its fire, tagged with the `TimerStart` it came from. */
  function handler(name: string, timer: timer, tag: string): () => void {
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
    };
  }

  function start(name: string, timeout: number, periodic: boolean): timer {
    const timer = CreateTimer();
    fires.set(name, 0);
    tracked.push([name, timer]);
    TimerStart(timer, timeout, periodic, handler(name, timer, "first"));
    return timer;
  }

  /** Records every expire event of the timer, beside or without a handler. */
  function expireEvent(name: string, timer: timer): void {
    const trigger = CreateTrigger();
    TriggerRegisterTimerExpireEvent(trigger, timer);
    TriggerAddAction(trigger, () => {
      const n = (expires.get(name) ?? 0) + 1;
      expires.set(name, n);
      // A timer of timeout 0 may fire 10000 times a second: keep the first five.
      if (n > 5) return;
      p.record("EXPIRE", {
        timer: name,
        n,
        t: t(),
        elapsed: TimerGetElapsed(timer),
        remaining: TimerGetRemaining(timer),
        timeout: TimerGetTimeout(timer),
      });
    });
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

  function pause(at: number, name: string, timer: timer): void {
    step(at, name, timer, "pause", () => {
      PauseTimer(timer);
    });
  }

  function resume(at: number, name: string, timer: timer): void {
    step(at, name, timer, "resume", () => {
      ResumeTimer(timer);
    });
  }

  function restart(
    at: number,
    name: string,
    timer: timer,
    periodic: boolean,
  ): void {
    step(at, name, timer, "start", () => {
      TimerStart(timer, 0.75, periodic, handler(name, timer, "second"));
    });
  }

  /** A timer of timeout 2, paused at 0.5 and resumed at 1: it should fire at 2.5 and 4.5. */
  function resumed(name: string, periodic: boolean): timer {
    const timer = start(name, 2, periodic);
    pause(0.5, name, timer);
    resume(1, name, timer);
    return timer;
  }

  // The control: one pause, one resume.
  resumed("control-one-shot", false);
  resumed("control-periodic", true);

  // `TimerStart` on a resumed timer: in its first countdown, in its second,
  // and after it stopped. The new start takes the other flag than the first.
  const restarts: (readonly [string, number])[] = [
    ["start-in-first", 1.5],
    ["start-in-second", 3],
    ["start-after-stop", 5.5],
  ];
  for (const [prefix, at] of restarts) {
    restart(
      at,
      `${prefix}-periodic`,
      resumed(`${prefix}-periodic`, false),
      true,
    );
    restart(
      at,
      `${prefix}-one-shot`,
      resumed(`${prefix}-one-shot`, true),
      false,
    );
  }

  // A second pause and resume: in the first countdown, and in the second.
  for (const periodic of [false, true]) {
    const kind = periodic ? "periodic" : "one-shot";
    const first = resumed(`repause-in-first-${kind}`, periodic);
    pause(1.5, `repause-in-first-${kind}`, first);
    resume(2, `repause-in-first-${kind}`, first);
    const second = resumed(`repause-in-second-${kind}`, periodic);
    pause(3.1, `repause-in-second-${kind}`, second);
    resume(3.6, `repause-in-second-${kind}`, second);
  }

  // An expired one-shot timer: resumed, and paused then resumed.
  resume(2, "expired-resume", start("expired-resume", 1, false));
  const expiredPaused = start("expired-pause-resume", 1, false);
  pause(1.5, "expired-pause-resume", expiredPaused);
  resume(2, "expired-pause-resume", expiredPaused);

  // `ResumeTimer` twice in a row on a paused timer.
  for (const periodic of [false, true]) {
    const name = `double-resume-${periodic ? "periodic" : "one-shot"}`;
    const timer = start(name, 2, periodic);
    pause(0.5, name, timer);
    step(1, name, timer, "resume-twice", () => {
      ResumeTimer(timer);
      ResumeTimer(timer);
    });
  }

  // `ResumeTimer` again while the resumed timer counts, and after it stopped.
  resume(1.5, "resume-while-counting", resumed("resume-while-counting", false));
  resume(5.5, "resume-after-stop", resumed("resume-after-stop", false));

  // A resumed timer started again as a one-shot, then resumed once it expired.
  const restartedResumed = resumed("restart-then-resume", false);
  restart(5.5, "restart-then-resume", restartedResumed, false);
  resume(7, "restart-then-resume", restartedResumed);

  // An expired one-shot timer of timeout 0, resumed.
  resume(2, "zero-expired-resume", start("zero-expired-resume", 0, false));

  // The control again, with an expire event beside its handler.
  expireEvent(
    "control-with-expire-event",
    resumed("control-with-expire-event", false),
  );

  function sample(): void {
    for (const [name, timer] of tracked) read(name, timer, "sample");
  }

  for (let i = 0; i < 24; i++) {
    p.after(0.25 + 0.5 * i, () => {
      sample();
      if (i % 4 === 3) p.checkpoint();
    });
  }

  // The timers never started: no handler, so an expire event counts the fires.
  p.after(12.5, () => {
    for (const [, timer] of tracked) DestroyTimer(timer);
    tracked.length = 0;

    function never(name: string): timer {
      const timer = CreateTimer();
      fires.set(name, 0);
      tracked.push([name, timer]);
      expireEvent(name, timer);
      read(name, timer, "created");
      return timer;
    }

    const resumedNever = never("never-resume");
    const pausedNever = never("never-pause-resume");
    const startedLater = never("never-resume-then-start");

    p.pending("ResumeTimer on a timer never started");
    p.checkpoint();
    ResumeTimer(resumedNever);
    read("never-resume", resumedNever, "after-resume");
    ResumeTimer(startedLater);
    read("never-resume-then-start", startedLater, "after-resume");

    p.pending("PauseTimer, then ResumeTimer, on a timer never started");
    p.checkpoint();
    PauseTimer(pausedNever);
    read("never-pause-resume", pausedNever, "after-pause");
    ResumeTimer(pausedNever);
    read("never-pause-resume", pausedNever, "after-resume");
    p.pending("the timers never started, resumed, running");
    p.checkpoint();

    p.after(2, () => {
      read("never-resume-then-start", startedLater, "before-start");
      TimerStart(
        startedLater,
        1,
        false,
        handler("never-resume-then-start", startedLater, "first"),
      );
      read("never-resume-then-start", startedLater, "after-start");
    });

    for (let i = 0; i < 10; i++) {
      p.after(0.25 + 0.5 * i, () => {
        sample();
        if (i === 4) p.checkpoint();
      });
    }

    p.after(5.5, () => {
      for (const [, timer] of tracked) DestroyTimer(timer);
      p.finish();
    });
  });
}
