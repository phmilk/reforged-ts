// The held Probe's bundle, as probe:build compiles it with the bridge
// fixtures' runId, run on the harness with the shipped stubs: its `run`
// holds the run, records one line and starts a timer, whose expiry records a
// second line, finishes the run and asks for a checkpoint past the end,
// which leaves the Result file and the screen as the end left them. The tests share one Lua state and run in
// order.

import { describe, expect, it } from "reforged-test/lua";

declare function __stub_preload_file(filename: string): string[] | undefined;
declare function __stub_fire_timer(whichTimer: timer): void;
declare function __stub_args(name: string): (unknown[] & { n: number })[];
declare function __stub_displayed(): { duration?: number; text: string }[];

/**
 * The editor's entry point, which the runner wraps, and Lua's `require`,
 * which loads the bundle the global setup wrote next to this test.
 * @noSelf
 */
interface Globals {
  main?: () => void;
  require: (module: string) => unknown;
}

const globals = _G as unknown as Globals;

/** The Result file of the held Probe, under CustomMapData. */
const RESULT_FILE = "reforged-ts\\probes\\held.txt";

/** The timer the `index`th TimerStart started: the runner's, then the Probe's. */
function startedTimer(index: number): timer {
  return __stub_args("TimerStart")[index]?.[0] as timer;
}

describe("the held Probe's bundle", () => {
  it("writes no END, and shows no end message, once run returns", () => {
    globals.main = () => undefined;
    globals.require("held_bundle");
    globals.main();
    __stub_fire_timer(startedTimer(0));
    expect(__stub_args("TimerStart").length).toEqual(2);
    expect(__stub_preload_file(RESULT_FILE)).toBeUndefined();
    expect(__stub_displayed().length).toEqual(0);
  });

  it("writes END status=ok when the Probe's timer calls finish, after every record, and no checkpoint past it", () => {
    __stub_fire_timer(startedTimer(1));
    expect(__stub_preload_file(RESULT_FILE)).toEqual([
      "1 BEGIN probe=held run=bridge",
      "2 step name=run",
      "3 step name=timer",
      "4 END status=ok",
    ]);
  });

  it("shows the end message with the number of records, for an hour, and no checkpoint message", () => {
    expect(
      __stub_displayed().map(({ duration, text }) => [duration, text]),
    ).toEqual([[3600, "Probe held finished: 2 records. Close the game."]]);
  });
});
