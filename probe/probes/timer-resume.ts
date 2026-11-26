// What the library's `Timer.resume` does now that it is built over
// `TimerStart` and no longer calls `ResumeTimer` (#962), and the facts of the
// game it relies on. Two groups of timers start together:
//
// - `raw-*`, on the Natives alone: whether `TimerStart` on a timer that
//   `PauseTimer` stopped is an ordinary start, whether a one-shot timer
//   started again inside its own handler as a periodic one keeps firing, and
//   what `PauseTimer` does inside a periodic timer's handler.
// - `lib-*`, on the library's `Timer`: a one-shot and a periodic Timer
//   paused then resumed, paused and resumed twice, `resume` on a running
//   Timer, on one never started and on an expired one-shot, `start` on a
//   paused and on a resumed Timer, `pause` inside a periodic handler, and a
//   Dev mode failure after a resume.
//
// Every record carries `t`, the elapsed time of a reference timer started
// first. Each timer is read before and after every call made on it, in its
// handler, and every half second from 0.25 on, a quarter second away from
// every call. A `lib-*` timer is read through the Wrapper's getters and
// through the Natives.

import type { ProbeContext } from "../game/probe";
import { Reforged, Timer } from "reforged-ts";

/** How long the timers are read, in seconds. */
const DURATION = 12.5;

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

  // Dev mode, so the failure after a resume goes through the protected
  // handler and the Caught error hook.
  const [configured, configureError] = pcall(() => {
    Reforged.configure({ devMode: true });
  });
  p.record("CONFIGURE", { ok: configured, error: tostring(configureError) });

  const caught: string[] = [];
  // The seam a harness defines (ADR 0028); the game defines no such global.
  (_G as unknown as Record<string, unknown>).__reforged_caught_error = (
    origin: string,
    message: string,
  ) => {
    caught.push(origin);
    p.record("CAUGHT", { origin, message, t: t() });
  };

  const fires = new Map<string, number>();
  const raws: (readonly [string, timer])[] = [];
  const libs: (readonly [string, Timer])[] = [];

  function natives(handle: timer): Record<string, number> {
    return {
      nElapsed: TimerGetElapsed(handle),
      nRemaining: TimerGetRemaining(handle),
      nTimeout: TimerGetTimeout(handle),
    };
  }

  function readings(timer: Timer): Record<string, number> {
    return {
      elapsed: timer.elapsed,
      remaining: timer.remaining,
      timeout: timer.timeout,
      ...natives(timer.handle),
    };
  }

  function readRaw(name: string, handle: timer, moment: string): void {
    p.record("READ", {
      timer: name,
      moment,
      t: t(),
      fires: fires.get(name) ?? 0,
      ...natives(handle),
    });
  }

  function readLib(name: string, timer: Timer, moment: string): void {
    p.record("READ", {
      timer: name,
      moment,
      t: t(),
      fires: fires.get(name) ?? 0,
      ...readings(timer),
    });
  }

  /** Counts a fire of `name` and records it, tagged with the start it came from. */
  function fired(name: string, tag: string, read: Record<string, number>) {
    const n = (fires.get(name) ?? 0) + 1;
    fires.set(name, n);
    p.record("FIRE", { timer: name, n, handler: tag, t: t(), ...read });
    return n;
  }

  function rawHandler(name: string, handle: timer, tag: string): () => void {
    return () => {
      fired(name, tag, {
        ...natives(handle),
        expired: GetExpiredTimer() === handle ? 1 : 0,
      });
    };
  }

  function libHandler(name: string, tag: string): (timer: Timer) => void {
    return (timer) => {
      fired(name, tag, readings(timer));
    };
  }

  function raw(name: string, timeout: number, periodic: boolean): timer {
    const handle = CreateTimer();
    fires.set(name, 0);
    raws.push([name, handle]);
    TimerStart(handle, timeout, periodic, rawHandler(name, handle, "first"));
    return handle;
  }

  function lib(name: string, timeout: number, periodic: boolean): Timer {
    const timer = Timer.create();
    fires.set(name, 0);
    libs.push([name, timer]);
    return timer.start(timeout, periodic, libHandler(name, "first"));
  }

  /** At `at`, reads the timer, makes the call, and reads it again. */
  function rawStep(
    at: number,
    name: string,
    handle: timer,
    call: string,
    act: () => void,
  ): void {
    p.after(at, () => {
      readRaw(name, handle, `before-${call}`);
      act();
      readRaw(name, handle, `after-${call}`);
    });
  }

  function libStep(
    at: number,
    name: string,
    timer: Timer,
    call: string,
    act: () => void,
  ): void {
    p.after(at, () => {
      readLib(name, timer, `before-${call}`);
      act();
      readLib(name, timer, `after-${call}`);
    });
  }

  function pause(at: number, name: string, timer: Timer): void {
    libStep(at, name, timer, "pause", () => timer.pause());
  }

  function resume(at: number, name: string, timer: Timer): void {
    libStep(at, name, timer, "resume", () => timer.resume());
  }

  function restart(
    at: number,
    name: string,
    timer: Timer,
    periodic: boolean,
  ): void {
    libStep(at, name, timer, "start", () =>
      timer.start(0.75, periodic, libHandler(name, "second")),
    );
  }

  // The Natives. A timer of timeout 2, `PauseTimer` at 0.5, then
  // `TimerStart(timer, 0.75, …)` with a new handler at 1.
  for (const periodic of [false, true]) {
    const name = `raw-start-after-pause-${periodic ? "periodic" : "one-shot"}`;
    const handle = raw(name, 2, !periodic);
    rawStep(0.5, name, handle, "pause", () => {
      PauseTimer(handle);
    });
    rawStep(1, name, handle, "start", () => {
      TimerStart(handle, 0.75, periodic, rawHandler(name, handle, "second"));
    });
  }

  // A one-shot timer of 0.5 whose handler starts it again, periodic, for 1:
  // what a resumed periodic Timer does at the end of what was left.
  {
    const name = "raw-periodic-from-own-handler";
    const handle = CreateTimer();
    fires.set(name, 0);
    raws.push([name, handle]);
    TimerStart(handle, 0.5, false, () => {
      TimerStart(handle, 1, true, rawHandler(name, handle, "second"));
      fired(name, "first", natives(handle));
    });
  }

  // `PauseTimer` inside the second handler of a periodic timer of 1.
  {
    const name = "raw-pause-in-handler";
    const handle = CreateTimer();
    fires.set(name, 0);
    raws.push([name, handle]);
    TimerStart(handle, 1, true, () => {
      const n = fired(name, "first", natives(handle));
      if (n === 2) {
        PauseTimer(handle);
        readRaw(name, handle, "after-pause-in-handler");
      }
    });
  }

  // The library. Unless the name says otherwise, a Timer of timeout 2,
  // paused at 0.5 and resumed at 1.
  for (const periodic of [false, true]) {
    const kind = periodic ? "periodic" : "one-shot";

    const once = `lib-resumed-${kind}`;
    const resumed = lib(once, 2, periodic);
    pause(0.5, once, resumed);
    resume(1, once, resumed);

    // Paused again at 1.5 in the countdown the resume continues (1 left),
    // resumed at 2; the periodic one paused once more at 5.5, 0.5 into its
    // second full timeout (1.5 left), and resumed at 6.
    const twice = `lib-resumed-twice-${kind}`;
    const again = lib(twice, 2, periodic);
    pause(0.5, twice, again);
    resume(1, twice, again);
    pause(1.5, twice, again);
    resume(2, twice, again);
    if (periodic) {
      pause(5.5, twice, again);
      resume(6, twice, again);
    }

    const running = `lib-resume-running-${kind}`;
    resume(1, running, lib(running, 2, periodic));

    // `start` on a paused Timer, at 1, and on a resumed one, at 1.5, with
    // the other flag than the first start's.
    const onPaused = `lib-start-paused-${kind}`;
    const paused = lib(onPaused, 2, periodic);
    pause(0.5, onPaused, paused);
    restart(1, onPaused, paused, !periodic);

    const onResumed = `lib-start-resumed-${kind}`;
    const restarted = lib(onResumed, 2, periodic);
    pause(0.5, onResumed, restarted);
    resume(1, onResumed, restarted);
    restart(1.5, onResumed, restarted, !periodic);
  }

  // `resume` on a Timer never started, with an expire event to see any
  // fire, and on a one-shot Timer of 1 that expired, alone and after a
  // `pause` at 1.5.
  {
    const name = "lib-resume-never-started";
    const never = Timer.create();
    fires.set(name, 0);
    libs.push([name, never]);
    const trigger = CreateTrigger();
    TriggerRegisterTimerExpireEvent(trigger, never.handle);
    TriggerAddAction(trigger, () => {
      fired(name, "expire-event", readings(never));
    });
    resume(1, name, never);
  }
  {
    const name = "lib-resume-expired";
    resume(2, name, lib(name, 1, false));
    const paused = "lib-pause-resume-expired";
    const timer = lib(paused, 1, false);
    pause(1.5, paused, timer);
    resume(2, paused, timer);
  }

  // `pause` inside the second handler of a periodic Timer of 1, `resume` at
  // 3.25.
  {
    const name = "lib-pause-in-handler";
    const timer = Timer.create();
    fires.set(name, 0);
    libs.push([name, timer]);
    timer.start(1, true, (expired) => {
      const n = fired(name, "first", readings(expired));
      if (n === 2) {
        expired.pause();
        readLib(name, expired, "after-pause-in-handler");
      }
    });
    resume(3.25, name, timer);
  }

  // A Dev mode failure after a resume: `Timer.every` of 1, paused at 1.5,
  // resumed at 2, failing at every fire from the resume on.
  {
    const name = "lib-failing-every";
    let resumed = false;
    const timer = Timer.every(1, (expired) => {
      fired(name, "first", readings(expired));
      if (resumed) {
        error("failed after resume", 0);
      }
    });
    fires.set(name, 0);
    libs.push([name, timer]);
    pause(1.5, name, timer);
    libStep(2, name, timer, "resume", () => {
      resumed = true;
      timer.resume();
    });
  }

  // Every timer read every half second, a checkpoint each second.
  for (let at = 0.25; at <= DURATION; at += 0.5) {
    p.after(at, () => {
      for (const [name, handle] of raws) {
        readRaw(name, handle, "sample");
      }
      for (const [name, timer] of libs) {
        readLib(name, timer, "sample");
      }
      p.checkpoint();
    });
  }

  p.after(DURATION + 0.5, () => {
    const total: Record<string, number> = {};
    for (const [name, count] of fires) {
      total[name] = count;
    }
    p.record("TOTAL", { ...total, caught: caught.length });
    p.finish();
  });
}
