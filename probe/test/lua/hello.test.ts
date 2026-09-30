// The hello Probe's bundle, as probe:build compiles it with the bridge
// fixture's runId, run on the harness with the shipped stubs. The tests share
// one Lua state and run in order: the bundle loads, the editor's main runs,
// then the runner's timer fires.

import { describe, expect, it, stubCalls } from "reforged-test/lua";

declare function __stub_preload_file(filename: string): string[] | undefined;
declare function __stub_fire_timer(whichTimer: timer): void;
declare function __stub_args(name: string): (unknown[] & { n: number })[];

/**
 * The editor's entry point, which the runner wraps, and Lua's `require`,
 * which loads the modules the global setup wrote next to this test.
 * @noSelf
 */
interface Globals {
  main?: () => void;
  require: (module: string) => unknown;
}

const globals = _G as unknown as Globals;

/** The Result file of the hello Probe, under CustomMapData. */
const RESULT_FILE = "reforged-ts\\probes\\hello.txt";

describe("the hello Probe's bundle", () => {
  let editorMainRan = false;

  it("calls no Native when it loads", () => {
    globals.main = () => {
      editorMainRan = true;
    };
    globals.require("hello_bundle");
    expect(stubCalls().length).toEqual(0);
  });

  it("starts a 0-second timer from the editor's main, after it", () => {
    globals.main?.();
    expect(editorMainRan).toEqual(true);
    const starts = __stub_args("TimerStart");
    expect(starts.length).toEqual(1);
    expect(starts[0]?.[1]).toEqual(0);
    expect(starts[0]?.[2]).toEqual(false);
    expect(__stub_preload_file(RESULT_FILE)).toBeUndefined();
  });

  it("writes the bridge fixture's lines to the Result file when the timer fires", () => {
    __stub_fire_timer(__stub_args("TimerStart")[0]?.[0] as timer);
    expect(__stub_preload_file(RESULT_FILE)).toEqual(
      globals.require("bridge_fixture") as string[],
    );
  });

  it("writes them through the Preload Natives, in one rewrite", () => {
    const calls = stubCalls().filter((call) => call.startsWith("Preload"));
    expect(calls).toEqual([
      "PreloadGenClear()",
      "PreloadGenStart()",
      'Preload("1 BEGIN probe=hello run=bridge")',
      'Preload("2 greeting count=1 word=hello")',
      'Preload("3 END status=ok")',
      'PreloadGenEnd("reforged-ts\\\\probes\\\\hello.txt")',
    ]);
  });
});
