// The failing-later Probe's bundle, as probe:build compiles it with the
// bridge fixtures' runId, run on the harness with the shipped stubs: its
// `run` holds the run, records one line and asks for a timer with
// `p.after`, whose callback records a second line, then throws an Error.
// The tests share one Lua state and run in order.

import { describe, expect, it } from "reforged-test/lua";
import { globals, loadBundle, startedTimer } from "./bundle";

/** The Result file of the failing-later Probe, under CustomMapData. */
const RESULT_FILE = "reforged-ts\\probes\\failing-later.txt";

describe("the failing-later Probe's bundle", () => {
  it("writes nothing once run returns, and starts the Probe's 1-second timer", () => {
    loadBundle("failing-later");
    __stub_fire_timer(startedTimer(0));
    const starts = __stub_args("TimerStart");
    expect(starts.length).toEqual(2);
    expect(starts[1]?.[1]).toEqual(1);
    expect(starts[1]?.[2]).toEqual(false);
    expect(__stub_preload_file(RESULT_FILE)).toBeUndefined();
  });

  it("catches the error the callback throws, without the debug library, and writes ERROR, then END status=failed", () => {
    const debugLibrary = globals.debug;
    globals.debug = undefined;
    try {
      __stub_fire_timer(startedTimer(1));
    } finally {
      globals.debug = debugLibrary;
    }
    expect(__stub_preload_file(RESULT_FILE)).toEqual([
      "1 BEGIN probe=failing-later run=bridge",
      "2 step name=run",
      "3 step name=timer",
      "4 ERROR message=Error:%20The%20later%20step%20broke.",
      "5 END status=failed",
    ]);
  });

  it("destroys the callback's timer and shows the failure, for an hour", () => {
    const timer = startedTimer(1);
    expect(
      __stub_args("DestroyTimer").some((args) => args[0] === timer),
    ).toEqual(true);
    expect(
      __stub_displayed().map(({ duration, text }) => [duration, text]),
    ).toEqual([
      [
        3600,
        "Probe failing-later failed after 2 records. Close the game.\nError: The later step broke.",
      ],
    ]);
  });
});
