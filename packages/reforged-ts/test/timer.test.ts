/** @noSelfInFile */

// A Timer's handler runs when the stub helper fires the timer, as the game
// would on expiry (callback firing through a stub helper), and receives the
// Timer that was started. `Timer.after` and `Timer.every` are observed through
// the call log and through firing. Timer is on the Handle base: creation
// throws, lookup returns undefined.

import { describe, expect, it, stubCalls } from "reforged-test/lua";
import { Timer } from "../src/index";
import { handleRef } from "./support/handle-ref";
import { withNative } from "./support/native-override";
import { raisedIn } from "./support/raised-in";

describe("Timer", () => {
  it("is the same object for its handle", () => {
    const timer = Timer.create();
    expect(Timer.fromHandle(timer.handle)).toBe(timer);
    expect(Timer.fromHandle(undefined)).toBeUndefined();
  });

  it("stores the timeout it was started with", () => {
    const timer = Timer.create().start(1.5, true, () => undefined);
    expect(timer.timeout).toEqual(1.5);
    expect(stubCalls()).toContainCall(
      `TimerStart(${handleRef("timer", timer.handle)}, 1.5, true, <function>)`,
    );
  });

  it("runs the handler once when the stub fires the timer", () => {
    let runs = 0;
    const timer = Timer.create().start(0.25, false, () => {
      runs++;
    });
    expect(runs).toEqual(0);
    __stub_fire_timer(timer.handle);
    expect(runs).toEqual(1);
  });

  it("passes the handler the Timer that was started", () => {
    let received: Timer | undefined;
    const timer = Timer.create().start(0.25, false, (expired) => {
      received = expired;
    });
    __stub_fire_timer(timer.handle);
    expect(received).toBe(timer);
  });

  it("returns itself from pause, resume and start", () => {
    const timer = Timer.create();
    expect(timer.start(1, false, () => undefined)).toBe(timer);
    expect(timer.pause()).toBe(timer);
    expect(timer.resume()).toBe(timer);
    // A second resume, on a Timer no longer paused, does nothing and chains.
    expect(timer.resume()).toBe(timer);
  });

  it("records its destruction", () => {
    const timer = Timer.create();
    timer.destroy();
    expect(stubCalls()).toContainCall(
      `DestroyTimer(${handleRef("timer", timer.handle)})`,
    );
  });
});

/** The calls to the Natives `body` makes, in order. */
function callsDuring(body: () => void): string[] {
  const before = stubCalls().length;
  body();
  return stubCalls().slice(before);
}

/**
 * Pauses `timer` with `left` seconds left, as `TimerGetRemaining` answers at
 * the pause: the stubs keep no clock, so a test says what the game would.
 */
function pauseWith(timer: Timer, left: number): void {
  withNative(
    "TimerGetRemaining",
    () => left,
    () => {
      timer.pause();
    },
  );
}

// `resume` is reimplemented over `TimerStart` (#962): the game's
// `ResumeTimer`, measured on Build 3.0.1.24371, fires a resumed timer when
// what was left runs out, once more a full timeout later, then stops,
// one-shot or periodic alike (docs/research/timer-resume.md, #947). The
// stubs keep no clock, so these tests check the Natives the Wrapper calls
// and the readings it answers from what it remembers; the fires and their
// times are the Probe run's, recorded in the research.
describe("Timer.pause and Timer.resume", () => {
  it("pauses through PauseTimer", () => {
    const timer = Timer.create().start(2, false, () => undefined);
    const ref = handleRef("timer", timer.handle);
    expect(
      callsDuring(() => {
        pauseWith(timer, 1.5);
      }),
    ).toEqual([`TimerGetRemaining(${ref})`, `PauseTimer(${ref})`]);
  });

  it("resumes a paused one-shot Timer with TimerStart for what was left, never ResumeTimer", () => {
    let runs = 0;
    const timer = Timer.create().start(2, false, () => {
      runs++;
    });
    const ref = handleRef("timer", timer.handle);
    pauseWith(timer, 1.5);
    expect(
      callsDuring(() => {
        timer.resume();
      }),
    ).toEqual([`TimerStart(${ref}, 1.5, false, <function>)`]);
    const fired = callsDuring(() => {
      __stub_fire_timer(timer.handle);
    });
    expect(runs).toEqual(1);
    expect(fired).toEqual([]);
    expect(stubCalls().some((call) => call.startsWith("ResumeTimer("))).toBe(
      false,
    );
  });

  it("starts a resumed periodic Timer again for its timeout at the end of what was left", () => {
    const received: Timer[] = [];
    const timer = Timer.every(2, (expired) => {
      received.push(expired);
    });
    const ref = handleRef("timer", timer.handle);
    pauseWith(timer, 0.5);
    timer.resume();
    expect(
      callsDuring(() => {
        __stub_fire_timer(timer.handle);
      }),
    ).toEqual([`TimerStart(${ref}, 2, true, <function>)`]);
    expect(received.length).toEqual(1);
    expect(
      callsDuring(() => {
        __stub_fire_timer(timer.handle);
        __stub_fire_timer(timer.handle);
      }),
    ).toEqual([]);
    expect(received.length).toEqual(3);
    for (const expired of received) {
      expect(expired).toBe(timer);
    }
  });

  it("does nothing on a running Timer, a Timer never started and an expired one-shot Timer", () => {
    const running = Timer.create().start(2, true, () => undefined);
    const never = Timer.create();
    const expired = Timer.create().start(1, false, () => undefined);
    __stub_fire_timer(expired.handle);
    expect(
      callsDuring(() => {
        running.resume();
        never.resume();
        expired.resume();
      }),
    ).toEqual([]);
  });

  it("does nothing on a Timer started again after its pause", () => {
    const timer = Timer.create().start(2, false, () => undefined);
    pauseWith(timer, 1.5);
    timer.start(0.75, true, () => undefined);
    expect(
      callsDuring(() => {
        timer.resume();
      }),
    ).toEqual([]);
  });

  it("resumes once for two resumes in a row", () => {
    const timer = Timer.create().start(2, false, () => undefined);
    pauseWith(timer, 1.5);
    const calls = callsDuring(() => {
      timer.resume();
      timer.resume();
    });
    expect(calls.length).toEqual(1);
  });

  it("continues with what was left at the latest pause, paused and resumed again", () => {
    let runs = 0;
    const timer = Timer.every(2, () => {
      runs++;
    });
    const ref = handleRef("timer", timer.handle);
    pauseWith(timer, 1.5);
    timer.resume();
    pauseWith(timer, 1);
    expect(
      callsDuring(() => {
        timer.resume();
      }),
    ).toEqual([`TimerStart(${ref}, 1, false, <function>)`]);
    __stub_fire_timer(timer.handle);
    expect(runs).toEqual(1);
    pauseWith(timer, 0.25);
    expect(
      callsDuring(() => {
        timer.resume();
      }),
    ).toEqual([`TimerStart(${ref}, 0.25, false, <function>)`]);
    expect(
      callsDuring(() => {
        __stub_fire_timer(timer.handle);
      }),
    ).toEqual([`TimerStart(${ref}, 2, true, <function>)`]);
    expect(runs).toEqual(2);
  });

  it("counts a full timeout after a pause in a periodic Timer's handler", () => {
    const timer = Timer.every(2, (expired) => {
      // In its handler a periodic timer reads 0 left, as the stub does.
      expired.pause();
    });
    const ref = handleRef("timer", timer.handle);
    __stub_fire_timer(timer.handle);
    expect(timer.remaining).toEqual(2);
    expect(timer.elapsed).toEqual(0);
    expect(
      callsDuring(() => {
        timer.resume();
      }),
    ).toEqual([`TimerStart(${ref}, 2, false, <function>)`]);
  });

  it("starts ordinarily after a resume: the new handler and flag, nothing kept", () => {
    const runs: string[] = [];
    const timer = Timer.create().start(2, true, () => {
      runs.push("first");
    });
    pauseWith(timer, 1.5);
    timer.resume();
    timer.start(0.75, false, () => {
      runs.push("second");
    });
    expect(
      callsDuring(() => {
        __stub_fire_timer(timer.handle);
      }),
    ).toEqual([]);
    expect(runs).toEqual(["second"]);
    expect(timer.remaining).toEqual(0);
    expect(timer.elapsed).toEqual(0.75);
  });
});

describe("Timer readings", () => {
  it("reads the Natives on a Timer never started and on a running one", () => {
    const never = Timer.create();
    expect(never.timeout).toEqual(0);
    expect(never.remaining).toEqual(0);
    expect(never.elapsed).toEqual(0);
    const running = Timer.create().start(2, false, () => undefined);
    const ref = handleRef("timer", running.handle);
    expect(
      callsDuring(() => {
        expect(running.timeout).toEqual(2);
        expect(running.elapsed).toEqual(0);
        expect(running.remaining).toEqual(0);
      }),
    ).toEqual([
      `TimerGetTimeout(${ref})`,
      `TimerGetElapsed(${ref})`,
      `TimerGetRemaining(${ref})`,
    ]);
  });

  it("reads what was left at the pause on a paused Timer", () => {
    const timer = Timer.create().start(2, false, () => undefined);
    pauseWith(timer, 1.5);
    expect(timer.remaining).toEqual(1.5);
    expect(timer.elapsed).toEqual(0.5);
    expect(timer.timeout).toEqual(2);
  });

  it("reads the started timeout on a resumed Timer, and elapsed plus remaining is the timeout", () => {
    const timer = Timer.create().start(2, false, () => undefined);
    pauseWith(timer, 1.5);
    timer.resume();
    // The stub stored the 1.5 the resume started the timer for.
    expect(TimerGetTimeout(timer.handle)).toEqual(1.5);
    expect(timer.timeout).toEqual(2);
    withNative(
      "TimerGetRemaining",
      () => 1,
      () => {
        expect(timer.remaining).toEqual(1);
        expect(timer.elapsed).toEqual(1);
      },
    );
  });

  it("reads the timeout and 0 on a one-shot Timer from its handler on, a resumed one included", () => {
    let inHandler: [number, number] | undefined;
    const timer = Timer.create().start(2, false, (expired) => {
      inHandler = [expired.elapsed, expired.remaining];
    });
    pauseWith(timer, 1.5);
    timer.resume();
    withNative(
      "TimerGetRemaining",
      () => 1.5,
      () => {
        __stub_fire_timer(timer.handle);
        expect(inHandler).toEqual([2, 0]);
        expect(timer.elapsed).toEqual(2);
        expect(timer.remaining).toEqual(0);
        expect(timer.timeout).toEqual(2);
      },
    );
  });
});

describe("Timer.create", () => {
  it("wraps the handle CreateTimer returns, and a lookup finds it", () => {
    const timer = Timer.create();
    expect(stubCalls()).toContainCall("CreateTimer()");
    expect(Timer.fromHandle(timer.handle)).toBe(timer);
  });

  it("throws when CreateTimer returns nil", () => {
    const message = withNative(
      "CreateTimer",
      () => undefined,
      () =>
        raisedIn(() => {
          Timer.create();
        }),
    );
    expect(message).toEqual("reforged-ts: failed to create Timer");
  });
});

describe("Timer.after", () => {
  it("creates one Timer and starts it once", () => {
    const handle = CreateTimer();
    const before = stubCalls().length;
    withNative(
      "CreateTimer",
      () => handle,
      () => {
        Timer.after(2, () => undefined);
      },
    );
    expect(stubCalls().slice(before)).toEqual([
      "CreateTimer()",
      `TimerStart(${handleRef("timer", handle)}, 2, false, <function>)`,
    ]);
  });

  it("runs the handler once, then destroys the Timer", () => {
    const handle = CreateTimer();
    const destroyed = `DestroyTimer(${handleRef("timer", handle)})`;
    let runs = 0;
    let destroyedBeforeHandler = false;
    withNative(
      "CreateTimer",
      () => handle,
      () => {
        Timer.after(0.5, () => {
          runs++;
          destroyedBeforeHandler = stubCalls().includes(destroyed);
        });
      },
    );
    expect(runs).toEqual(0);
    __stub_fire_timer(handle);
    expect(runs).toEqual(1);
    expect(destroyedBeforeHandler).toEqual(false);
    expect(stubCalls()).toContainCall(destroyed);
    expect(() => {
      __stub_fire_timer(handle);
    }).toThrow("was destroyed");
    expect(runs).toEqual(1);
  });

  it("destroys the Timer when the handler throws, and the error propagates", () => {
    const handle = CreateTimer();
    withNative(
      "CreateTimer",
      () => handle,
      () => {
        Timer.after(1, () => {
          error("handler failed", 0);
        });
      },
    );
    expect(() => {
      __stub_fire_timer(handle);
    }).toThrow("handler failed");
    expect(stubCalls()).toContainCall(
      `DestroyTimer(${handleRef("timer", handle)})`,
    );
  });
});

describe("Timer.every", () => {
  it("returns the Timer it started periodically", () => {
    const timer = Timer.every(0.5, () => undefined);
    expect(Timer.fromHandle(timer.handle)).toBe(timer);
    expect(stubCalls()).toContainCall(
      `TimerStart(${handleRef("timer", timer.handle)}, 0.5, true, <function>)`,
    );
  });

  it("runs the handler on each expiry with the same Timer", () => {
    const received: Timer[] = [];
    const timer = Timer.every(1, (expired) => {
      received.push(expired);
    });
    __stub_fire_timer(timer.handle);
    __stub_fire_timer(timer.handle);
    __stub_fire_timer(timer.handle);
    expect(received.length).toEqual(3);
    for (const expired of received) {
      expect(expired).toBe(timer);
    }
  });

  it("lets the handler destroy the Timer it receives", () => {
    let runs = 0;
    const timer = Timer.every(1, (expired) => {
      runs++;
      expired.destroy();
    });
    __stub_fire_timer(timer.handle);
    expect(stubCalls()).toContainCall(
      `DestroyTimer(${handleRef("timer", timer.handle)})`,
    );
    expect(() => {
      __stub_fire_timer(timer.handle);
    }).toThrow("was destroyed");
    expect(runs).toEqual(1);
  });
});

describe("Timer.fromExpired", () => {
  it("is the fired Timer inside its handler", () => {
    let expired: Timer | undefined;
    const timer = Timer.create().start(1, false, () => {
      expired = Timer.fromExpired();
    });
    __stub_fire_timer(timer.handle);
    expect(expired).toBe(timer);
  });

  it("is undefined outside a firing", () => {
    expect(Timer.fromExpired()).toBeUndefined();
  });

  it("is undefined when GetExpiredTimer returns nil", () => {
    const timer = withNative(
      "GetExpiredTimer",
      () => undefined,
      () => Timer.fromExpired(),
    );
    expect(timer).toBeUndefined();
  });

  it("wraps the expired timer, the same object a lookup finds", () => {
    const handle = CreateTimer();
    const timer = withNative(
      "GetExpiredTimer",
      () => handle,
      () => Timer.fromExpired(),
    );
    expect(timer?.handle).toBe(handle);
    expect(Timer.fromHandle(handle)).toBe(timer);
  });
});
