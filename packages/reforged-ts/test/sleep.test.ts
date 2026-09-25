/** @noSelfInFile */

// `sleep` over the one-shot Timer helper: the Promise settles when the stub
// fires the Timer it started, with no value, and the Timer is destroyed.
// typescript-to-lua's Promise runs a continuation when it settles, so a
// `then` is observed right after the firing.

import { describe, expect, it, stubCalls } from "reforged-test/lua";
import { sleep } from "../src/index";
import { handleRef } from "./support/handle-ref";

/** The timers `TimerStart` was given while `body` ran, in order. */
function timersStartedBy(body: () => void): timer[] {
  const globals = _G as unknown as Record<string, unknown>;
  const start = TimerStart;
  const started: timer[] = [];
  globals.TimerStart = (
    whichTimer: timer,
    timeout: number,
    periodic: boolean,
    handler: () => void,
  ) => {
    started.push(whichTimer);
    start(whichTimer, timeout, periodic, handler);
  };
  try {
    body();
  } finally {
    globals.TimerStart = start;
  }
  return started;
}

describe("sleep", () => {
  it("starts a one-shot Timer for the given seconds", () => {
    const [timer] = timersStartedBy(() => {
      void sleep(1.5);
    });
    expect(stubCalls()).toContainCall(
      `TimerStart(${handleRef("timer", timer)}, 1.5, false, <function>)`,
    );
  });

  it("resolves with no value when its Timer fires, and destroys the Timer", () => {
    let settled = false;
    let value: unknown = "unset";
    const [timer] = timersStartedBy(() => {
      void sleep(0.5).then((resolved) => {
        settled = true;
        value = resolved;
      });
    });
    expect(settled).toEqual(false);
    __stub_fire_timer(timer);
    expect(settled).toEqual(true);
    expect(value).toBeUndefined();
    expect(stubCalls()).toContainCall(
      `DestroyTimer(${handleRef("timer", timer)})`,
    );
  });
});
