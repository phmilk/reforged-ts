/** @noSelfInFile */

// A Timer's handler runs when the stub helper fires the timer, as the game
// would on expiry (callback firing through a stub helper).

import { describe, expect, it, stubCalls } from "reforged-test/lua";
import { Timer } from "../src/index";

/** How the call log renders a handle. */
function ref(kind: string, handle: handle): string {
  return `${kind}#${tostring(GetHandleId(handle))}`;
}

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
      `TimerStart(${ref("timer", timer.handle)}, 1.5, true, <function>)`,
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

  it("records its destruction", () => {
    const timer = Timer.create();
    timer.destroy();
    expect(stubCalls()).toContainCall(
      `DestroyTimer(${ref("timer", timer.handle)})`,
    );
  });
});
