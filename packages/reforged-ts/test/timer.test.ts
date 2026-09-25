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
    expect(stubCalls()).toContainCall(
      `PauseTimer(${handleRef("timer", timer.handle)})`,
    );
    expect(stubCalls()).toContainCall(
      `ResumeTimer(${handleRef("timer", timer.handle)})`,
    );
  });

  it("records its destruction", () => {
    const timer = Timer.create();
    timer.destroy();
    expect(stubCalls()).toContainCall(
      `DestroyTimer(${handleRef("timer", timer.handle)})`,
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
