// What the timer Natives answer in the three cases the Game clock of
// `reforged-test` cannot guess (#947, for the Game clock of #935): a paused
// timer, a one-shot timer that expired, and a periodic timer of timeout 0.
// Every record carries `now`, the elapsed time of a reference timer started
// first, so each value reads against the game's own clock. The zero-period
// cases come last, after a checkpoint, since they are the ones that may
// stall the game.

import type { ProbeContext } from "../game/probe";

export function run(p: ProbeContext): void {
  p.hold();

  const reference = CreateTimer();
  TimerStart(reference, 100000, false, () => {
    // Never reached: the timer is only read.
  });

  function now(): number {
    return TimerGetElapsed(reference);
  }

  /** Records what the three reading Natives answer for one timer. */
  function read(timer: timer, name: string, moment: string): void {
    p.record("READ", {
      timer: name,
      moment,
      now: now(),
      elapsed: TimerGetElapsed(timer),
      remaining: TimerGetRemaining(timer),
      timeout: TimerGetTimeout(timer),
    });
  }

  // A timer never started.
  const never = CreateTimer();
  read(never, "never-started", "created");

  // A one-shot timer of 4 seconds, paused at 1.5 and resumed at 2.5.
  const paused = CreateTimer();
  TimerStart(paused, 4, false, () => {
    read(paused, "paused-one-shot", "handler");
  });

  // A one-shot timer of 4 seconds, paused at 1.5 and never resumed.
  const stopped = CreateTimer();
  let stoppedFires = 0;
  TimerStart(stopped, 4, false, () => {
    stoppedFires++;
    read(stopped, "paused-never-resumed", "handler");
  });

  // A periodic timer of 1 second, paused at 1.5 and resumed at 2.5.
  const periodic = CreateTimer();
  let periodicFires = 0;
  TimerStart(periodic, 1, true, () => {
    periodicFires++;
    read(periodic, "paused-periodic", `handler-${tostring(periodicFires)}`);
  });

  // A one-shot timer of 1 second, read in its handler and after it.
  const expired = CreateTimer();
  TimerStart(expired, 1, false, () => {
    read(expired, "expired-one-shot", "handler");
    p.record("EXPIRED", { same: GetExpiredTimer() === expired });
  });

  read(paused, "paused-one-shot", "started");
  read(expired, "expired-one-shot", "started");

  p.after(1.5, () => {
    read(paused, "paused-one-shot", "before-pause");
    PauseTimer(paused);
    read(paused, "paused-one-shot", "at-pause");
    PauseTimer(stopped);
    read(stopped, "paused-never-resumed", "at-pause");
    read(periodic, "paused-periodic", "before-pause");
    PauseTimer(periodic);
    read(periodic, "paused-periodic", "at-pause");
  });

  p.after(2, () => {
    read(expired, "expired-one-shot", "1s-after");
  });

  p.after(2.5, () => {
    read(paused, "paused-one-shot", "paused-1s");
    ResumeTimer(paused);
    read(paused, "paused-one-shot", "at-resume");
    read(periodic, "paused-periodic", "paused-1s");
    ResumeTimer(periodic);
    read(periodic, "paused-periodic", "at-resume");
  });

  p.after(3.5, () => {
    read(paused, "paused-one-shot", "resumed-1s");
    read(periodic, "paused-periodic", "resumed-1s");
  });

  p.after(4, () => {
    read(expired, "expired-one-shot", "3s-after");
  });

  p.after(7, () => {
    read(paused, "paused-one-shot", "after-expiry");
    read(stopped, "paused-never-resumed", "paused-5.5s");
    p.record("COUNT", {
      timer: "paused-never-resumed",
      fires: stoppedFires,
      now: now(),
    });
    read(periodic, "paused-periodic", "before-destroy");
    p.record("COUNT", {
      timer: "paused-periodic",
      fires: periodicFires,
      now: now(),
    });
    DestroyTimer(periodic);
    DestroyTimer(stopped);
    DestroyTimer(paused);
    DestroyTimer(expired);
    DestroyTimer(never);

    p.pending("one-shot timer of timeout 0");
    p.checkpoint();
    const zeroOnce = CreateTimer();
    const startedAt = now();
    let zeroOnceFired = false;
    TimerStart(zeroOnce, 0, false, () => {
      zeroOnceFired = true;
      p.record("ZERO-ONE-SHOT", {
        startedAt,
        firedAt: now(),
        delay: now() - startedAt,
      });
      read(zeroOnce, "zero-one-shot", "handler");
    });
    read(zeroOnce, "zero-one-shot", "started");
    p.record("ZERO-ONE-SHOT-INSIDE", { firedInsideTimerStart: zeroOnceFired });
  });

  /** Counts the fires of a periodic timer of `timeout` over one second of game time. */
  function count(name: string, timeout: number, then: () => void): void {
    p.pending(`periodic timer of timeout ${name}`);
    p.checkpoint();
    const fast = CreateTimer();
    const window = CreateTimer();
    const startedAt = now();
    let fires = 0;
    let firesInside = 0;
    let firstAt = -1;
    let secondAt = -1;
    let thirdAt = -1;
    TimerStart(window, 1, false, () => {
      PauseTimer(fast);
      p.record("PERIODIC", {
        timeout: name,
        fires,
        firesInsideTimerStart: firesInside,
        startedAt,
        firstAt,
        secondAt,
        thirdAt,
        stoppedAt: now(),
      });
      read(fast, `periodic-${name}`, "stopped");
      DestroyTimer(fast);
      DestroyTimer(window);
      p.after(0.5, then);
    });
    TimerStart(fast, timeout, true, () => {
      fires++;
      if (fires === 1) firstAt = now();
      else if (fires === 2) secondAt = now();
      else if (fires === 3) thirdAt = now();
    });
    firesInside = fires;
    read(fast, `periodic-${name}`, "started");
  }

  /**
   * What `ResumeTimer` leaves behind: five timers, each sampled every half
   * second for 12 seconds, every fire recorded. `t` is the time since the
   * study started.
   */
  function resumeStudy(): void {
    p.pending("resume study");
    p.checkpoint();
    const startedAt = now();
    const fires = new Map<string, number>();
    const timers: (readonly [string, timer])[] = [];

    function t(): number {
      return now() - startedAt;
    }

    function start(name: string, timeout: number, periodic: boolean): timer {
      const timer = CreateTimer();
      fires.set(name, 0);
      timers.push([name, timer]);
      TimerStart(timer, timeout, periodic, () => {
        const n = (fires.get(name) ?? 0) + 1;
        fires.set(name, n);
        p.record("FIRE", {
          timer: name,
          n,
          t: t(),
          elapsed: TimerGetElapsed(timer),
          remaining: TimerGetRemaining(timer),
        });
      });
      return timer;
    }

    const oneShot = start("one-shot-4-paused-1s", 4, false);
    const periodic = start("periodic-1-paused-1s", 1, true);
    const periodicNoGap = start("periodic-1-paused-0s", 1, true);
    const expiredResumed = start("one-shot-1-expired-resumed", 1, false);
    const runningResumed = start("one-shot-4-running-resumed", 4, false);

    let samples = 0;
    const sampler = CreateTimer();
    TimerStart(sampler, 0.5, true, () => {
      samples++;
      for (const [name, timer] of timers) {
        p.record("SAMPLE", {
          timer: name,
          t: t(),
          elapsed: TimerGetElapsed(timer),
          remaining: TimerGetRemaining(timer),
          fires: fires.get(name) ?? 0,
        });
      }
      if (samples === 12) p.checkpoint();
      if (samples === 24) {
        DestroyTimer(sampler);
        for (const [, timer] of timers) DestroyTimer(timer);
        p.finish();
      }
    });

    p.after(1.25, () => {
      PauseTimer(oneShot);
      PauseTimer(periodic);
      PauseTimer(periodicNoGap);
      ResumeTimer(periodicNoGap);
      ResumeTimer(runningResumed);
      p.record("STEP", { name: "paused", t: t() });
    });

    p.after(2.25, () => {
      ResumeTimer(oneShot);
      ResumeTimer(periodic);
      ResumeTimer(expiredResumed);
      p.record("STEP", { name: "resumed", t: t() });
    });
  }

  p.after(8, () => {
    count("0.01", 0.01, () => {
      count("0.001", 0.001, () => {
        count("0.0001", 0.0001, () => {
          count("0", 0, () => {
            resumeStudy();
          });
        });
      });
    });
  });
}
