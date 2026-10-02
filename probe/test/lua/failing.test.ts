// The failing Probe's bundle, as probe:build compiles it with the bridge
// fixtures' runId, run on the harness with the shipped stubs: its `run`
// records one line, then throws an Error. The tests share one Lua state and
// run in order.

import { describe, expect, it } from "reforged-test/lua";

declare function __stub_preload_file(filename: string): string[] | undefined;
declare function __stub_fire_timer(whichTimer: timer): void;
declare function __stub_args(name: string): (unknown[] & { n: number })[];
declare function __stub_displayed(): { duration?: number; text: string }[];

/**
 * The editor's entry point, which the runner wraps, Lua's `require`, which
 * loads the modules the global setup wrote next to this test, and the
 * `debug` library, which the game does not have.
 * @noSelf
 */
interface Globals {
  main?: () => void;
  require: (module: string) => unknown;
  debug: unknown;
}

const globals = _G as unknown as Globals;

/** The Result file of the failing Probe, under CustomMapData. */
const RESULT_FILE = "reforged-ts\\probes\\failing.txt";

describe("the failing Probe's bundle", () => {
  it("catches the error run throws and writes the failing bridge fixture's lines when the timer fires, without the debug library, as in the game", () => {
    globals.main = () => undefined;
    globals.require("failing_bundle");
    globals.main();
    // The Error's own __tostring reads `debug`, which the game lacks.
    const debugLibrary = globals.debug;
    globals.debug = undefined;
    try {
      __stub_fire_timer(__stub_args("TimerStart")[0]?.[0] as timer);
    } finally {
      globals.debug = debugLibrary;
    }
    expect(__stub_preload_file(RESULT_FILE)).toEqual(
      globals.require("failing_fixture") as string[],
    );
  });

  it("ends the Result file with ERROR, holding the Error's message, then END status=failed", () => {
    const lines = __stub_preload_file(RESULT_FILE) ?? [];
    expect(lines.slice(-2)).toEqual([
      "3 ERROR message=Error:%20The%20step%20%22after%22%20broke.",
      "4 END status=failed",
    ]);
  });

  it("shows the failure, the number of records and the message, for an hour", () => {
    expect(
      __stub_displayed().map(({ duration, text }) => [duration, text]),
    ).toEqual([
      [
        3600,
        'Probe failing failed after 1 record. Close the game.\nError: The step "after" broke.',
      ],
    ]);
  });
});
