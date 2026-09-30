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
      ...(globals.require("bridge_fixture") as string[]).map(
        (line) => `Preload("${line}")`,
      ),
      'PreloadGenEnd("reforged-ts\\\\probes\\\\hello.txt")',
    ]);
  });

  it("writes no line longer than 200 bytes, nor any holding a quote or a backslash", () => {
    const lines = __stub_preload_file(RESULT_FILE) ?? [];
    expect(lines.length).toEqual(5);
    for (const line of lines) {
      expect(line.length <= 200).toEqual(true);
      expect(string.find(line, '["\\]')[0]).toBeUndefined();
    }
  });

  it("splits the encoded record into a continuation line", () => {
    const lines = __stub_preload_file(RESULT_FILE) ?? [];
    expect(lines[2]?.length).toEqual(200);
    expect(string.sub(lines[2] ?? "", 1, 10)).toEqual("3 encoded ");
    expect(string.sub(lines[3] ?? "", 1, 3)).toEqual("3+ ");
    expect(string.sub(lines[4] ?? "", 1, 2)).toEqual("4 ");
  });
});
