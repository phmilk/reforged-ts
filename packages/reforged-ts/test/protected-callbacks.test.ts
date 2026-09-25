/** @noSelfInFile */

// Protected callbacks, proven on Timer: in Dev mode a handler that throws is
// reported on screen and printed, once per distinct message, and counted in
// `Reforged.debug.report()`; with Dev mode off the handler runs unprotected.
// A callback keeps the mode it was registered under, and a `configure` that
// changes the mode afterwards names the first registration.
//
// The file's tests share one Lua state, in order: the first registration of
// the state is the one the first test makes (entering the globals stage runs
// no Map project callback), and each later test sets the mode it needs.

import { describe, expect, it } from "reforged-test/lua";
import { Reforged, Timer } from "../src/index";
import { protect } from "../src/reforged/protect";
import { withNative } from "./support/native-override";
import { withPrint } from "./support/print-capture";

// The globals Init stage is entered first: in Dev mode a Wrapper created
// before it raises.
__stub_init_globals();

/** What a piece of code printed and showed on screen. */
interface Output {
  readonly printed: string[];
  readonly displayed: StubDisplayed[];
}

/** Runs `body` and returns what it printed and showed on screen. */
function output(body: () => void): Output {
  const printed = __stub_printed().length;
  const displayed = __stub_displayed().length;
  body();
  return {
    printed: __stub_printed().slice(printed),
    displayed: __stub_displayed().slice(displayed),
  };
}

/** The error text `fn` raises, as pcall returns it: with its `file:line:`. */
function errorOf(fn: () => void): string {
  const [ok, failure] = pcall(fn);
  expect(ok).toEqual(false);
  return tostring(failure);
}

describe("mode at registration", () => {
  it("keeps the mode a callback was registered under, and a late configure names the first registration", () => {
    Reforged.configure({ devMode: true });
    const timer = Timer.create().start(1, false, () => {
      error("registered in Dev mode");
    });
    const warning = withPrint(() => {
      Reforged.configure({ devMode: false });
    });
    expect(warning).toEqual([
      `reforged-ts: Reforged.configure({ devMode: false }) called after a callback was registered (the first: Timer#${String(timer.id)} Timer.start): only later registrations see the new value`,
    ]);
    const seen = output(() => {
      __stub_fire_timer(timer.handle);
    });
    expect(seen.printed.length).toEqual(1);
    expect(seen.displayed.length).toEqual(1);
  });

  it("leaves a callback registered with Dev mode off unprotected after Dev mode is turned on", () => {
    Reforged.configure({ devMode: false });
    const timer = Timer.create().start(1, false, () => {
      error("registered in release", 0);
    });
    Reforged.configure({ devMode: true });
    expect(() => {
      __stub_fire_timer(timer.handle);
    }).toThrow("registered in release");
  });
});

describe("Timer handlers in Dev mode", () => {
  it("reports a throwing handler once on screen and once in the log, with the origin and the error text", () => {
    Reforged.configure({ devMode: true });
    const failing = () => {
      error("boom");
    };
    const expected = errorOf(failing);
    // The text carries the line the error was raised at, `file:line: boom`.
    expect(string.gsub(expected, "^.+:%d+: boom$", "with its line")[0]).toEqual(
      "with its line",
    );
    const timer = Timer.create().start(1, false, failing);
    const seen = output(() => {
      __stub_fire_timer(timer.handle);
    });
    const line = `reforged-ts: Timer#${String(timer.id)} Timer.start failed: ${expected}`;
    expect(seen.printed).toEqual([line]);
    expect(seen.displayed.length).toEqual(1);
    const [shown] = seen.displayed;
    expect(shown.native).toEqual("DisplayTimedTextToPlayer");
    expect(shown.player).toBe(__stub_local_player());
    expect(shown.duration).toEqual(30);
    expect(shown.text).toEqual(line);
  });

  it("reports a periodic handler failing three times once, and report() counts three", () => {
    Reforged.configure({ devMode: true });
    Reforged.debug.reset();
    const timer = Timer.every(1, () => {
      error("tick failed", 0);
    });
    const seen = output(() => {
      __stub_fire_timer(timer.handle);
      __stub_fire_timer(timer.handle);
      __stub_fire_timer(timer.handle);
    });
    const origin = `Timer#${String(timer.id)} Timer.every`;
    expect(seen.printed).toEqual([
      `reforged-ts: ${origin} failed: tick failed`,
    ]);
    expect(seen.displayed.length).toEqual(1);
    let report: ReturnType<typeof Reforged.debug.report> | undefined;
    const printed = withPrint(() => {
      report = Reforged.debug.report();
    });
    expect(report?.failures).toEqual([
      { origin, message: "tick failed", count: 3 },
    ]);
    expect(
      printed.includes(`reforged-ts: ${origin} failed 3x: tick failed`),
    ).toEqual(true);
  });

  it("reports a different message from the same handler again", () => {
    Reforged.configure({ devMode: true });
    let run = 0;
    const timer = Timer.every(1, () => {
      run++;
      error(run === 3 ? "second message" : "first message", 0);
    });
    const seen = output(() => {
      __stub_fire_timer(timer.handle);
      __stub_fire_timer(timer.handle);
      __stub_fire_timer(timer.handle);
    });
    const origin = `Timer#${String(timer.id)} Timer.every`;
    expect(seen.printed).toEqual([
      `reforged-ts: ${origin} failed: first message`,
      `reforged-ts: ${origin} failed: second message`,
    ]);
  });

  it("reports a Timer.after handler as Timer.after and still destroys its Timer", () => {
    Reforged.configure({ devMode: true });
    const created = CreateTimer();
    withNative(
      "CreateTimer",
      () => created,
      () => {
        Timer.after(1, () => {
          error("one-shot failed", 0);
        });
      },
    );
    const seen = output(() => {
      __stub_fire_timer(created);
    });
    expect(seen.printed).toEqual([
      `reforged-ts: Timer#${String(GetHandleId(created))} Timer.after failed: one-shot failed`,
    ]);
    expect(() => {
      __stub_fire_timer(created);
    }).toThrow("was destroyed");
  });

  it("reports again after reset(), and report() is empty right after it", () => {
    Reforged.configure({ devMode: true });
    const timer = Timer.every(1, () => {
      error("again", 0);
    });
    __stub_fire_timer(timer.handle);
    Reforged.debug.reset();
    let report: ReturnType<typeof Reforged.debug.report> | undefined;
    withPrint(() => {
      report = Reforged.debug.report();
    });
    expect(report?.failures).toEqual([]);
    const seen = output(() => {
      __stub_fire_timer(timer.handle);
    });
    expect(seen.printed.length).toEqual(1);
  });
});

describe("Timer handlers with Dev mode off", () => {
  it("lets a throwing handler's error through, reporting nothing", () => {
    Reforged.configure({ devMode: false });
    const timer = Timer.create().start(1, false, () => {
      error("unprotected", 0);
    });
    const seen = output(() => {
      expect(() => {
        __stub_fire_timer(timer.handle);
      }).toThrow("unprotected");
    });
    expect(seen.printed).toEqual([]);
    expect(seen.displayed).toEqual([]);
  });

  it("makes report() and reset() print that Dev mode is off and return nothing", () => {
    Reforged.configure({ devMode: false });
    let report: ReturnType<typeof Reforged.debug.report> | undefined;
    const printed = withPrint(() => {
      report = Reforged.debug.report();
      Reforged.debug.reset();
    });
    expect(report?.failures).toEqual([]);
    expect(printed).toEqual([
      "reforged-ts: Dev mode is off: Reforged.debug has nothing to report",
      "reforged-ts: Dev mode is off: Reforged.debug has nothing to report",
    ]);
  });
});

describe("the protection step", () => {
  it("hands back the very function with Dev mode off, and a new one in Dev mode", () => {
    const callback = () => undefined;
    Reforged.configure({ devMode: false });
    expect(protect(undefined, "probe", callback)).toBe(callback);
    Reforged.configure({ devMode: true });
    expect(protect(undefined, "probe", callback) === callback).toEqual(false);
  });

  it("passes the original arguments and the result, and returns the failure value", () => {
    Reforged.configure({ devMode: true });
    const add = protect(undefined, "probe", (a: number, b: number) => a + b);
    expect(add(2, 3)).toEqual(5);
    const condition = protect(
      undefined,
      "probe condition",
      (): boolean => {
        error("condition failed", 0);
      },
      false,
    );
    const seen = output(() => {
      expect(condition()).toEqual(false);
    });
    expect(seen.printed).toEqual([
      "reforged-ts: probe condition failed: condition failed",
    ]);
  });
});
