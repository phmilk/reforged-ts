// The hello Probe's bundle, as probe:build compiles it with the bridge
// fixtures' runId, run on the harness with the shipped stubs. The tests share
// one Lua state and run in order: the bundle loads, the editor's main runs,
// then the runner's timer fires and the Probe runs: a PENDING line and a
// record, a checkpoint, again a PENDING line and a record, a checkpoint,
// then the end.

import { describe, expect, it, stubCalls } from "reforged-test/lua";

declare function __stub_preload_file(filename: string): string[] | undefined;
declare function __stub_fire_timer(whichTimer: timer): void;
declare function __stub_args(name: string): (unknown[] & { n: number })[];
declare function __stub_displayed(): { duration?: number; text: string }[];

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

/** The bridge fixtures' lines, as the global setup wrote them. */
interface BridgeFixtures {
  /** The Result file of the finished run. */
  finished: string[];
  /** The Result file as the second checkpoint leaves it. */
  checkpoint: string[];
}

function bridge(): BridgeFixtures {
  return globals.require("bridge_fixture") as BridgeFixtures;
}

/** The Result file of the hello Probe, under CustomMapData. */
const RESULT_FILE = "reforged-ts\\probes\\hello.txt";

/**
 * The strings of each write of the Result file, in order: what `Preload`
 * was given between each `PreloadGenClear` and its `PreloadGenEnd`.
 */
function preloadWrites(): string[][] {
  const strings = __stub_args("Preload").map((args) => args[0] as string);
  const writes: string[][] = [];
  let next = 0;
  for (const call of stubCalls()) {
    if (call === "PreloadGenClear()") {
      writes.push([]);
    } else if (call.startsWith("Preload(")) {
      writes[writes.length - 1]?.push(strings[next] ?? "");
      next++;
    }
  }
  return writes;
}

/** The lines of `lines` whose kind is `kind`. */
function linesOfKind(lines: readonly string[], kind: string): string[] {
  // A continuation line's second word is not a kind, never a reserved one.
  return lines.filter((line) => line.split(" ")[1] === kind);
}

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
    expect(__stub_preload_file(RESULT_FILE)).toEqual(bridge().finished);
  });

  it("writes the Result file three times through the Preload Natives, each a full rewrite", () => {
    const calls = stubCalls().filter((call) => call.startsWith("Preload"));
    const writes = preloadWrites();
    expect(writes.length).toEqual(3);
    expect(calls).toEqual(
      writes.flatMap((lines) => [
        "PreloadGenClear()",
        "PreloadGenStart()",
        ...lines.map((line) => `Preload("${line}")`),
        'PreloadGenEnd("reforged-ts\\\\probes\\\\hello.txt")',
      ]),
    );
    expect(writes[2]).toEqual(bridge().finished);
  });

  it("rewrites at each of its two checkpoints every line so far, then a CHECKPOINT line of the next seq", () => {
    const writes = preloadWrites();
    const finished = bridge().finished;
    expect(writes[0]).toEqual([...finished.slice(0, 3), "4 CHECKPOINT"]);
    expect(writes[1]).toEqual([...finished.slice(0, 6), "6 CHECKPOINT"]);
    for (const lines of writes.slice(0, 2)) {
      expect(linesOfKind(lines, "CHECKPOINT")).toEqual([
        lines[lines.length - 1] ?? "",
      ]);
    }
  });

  it("writes at its second checkpoint the bridge's checkpoint fixture", () => {
    expect(preloadWrites()[1]).toEqual(bridge().checkpoint);
  });

  it("writes the PENDING lines in order, each before the record of its step", () => {
    const writes = preloadWrites();
    expect(linesOfKind(writes[0] ?? [], "PENDING")).toEqual([
      "2 PENDING label=greet",
    ]);
    expect(linesOfKind(writes[2] ?? [], "PENDING")).toEqual([
      "2 PENDING label=greet",
      "4 PENDING label=encode",
    ]);
    expect(writes[2]?.[2]).toEqual("3 greeting count=1 word=hello");
    expect(string.find(writes[2]?.[4] ?? "", "^5 encoded ")[0]).toEqual(1);
  });

  it("shows a progress message after each checkpoint, and the end message after the last write", () => {
    const shown = __stub_args("DisplayTimedTextToPlayer").map(
      (args) => args[4] as string,
    );
    expect(shown).toEqual([
      "Probe hello: checkpoint 1, 1 record so far.",
      "Probe hello: checkpoint 2, 2 records so far.",
      "Probe hello finished: 2 records. Close the game.",
    ]);
    const order = stubCalls()
      .filter(
        (call) =>
          call.startsWith("PreloadGenEnd(") ||
          call.startsWith("DisplayTimedTextToPlayer("),
      )
      .map((call) => string.match(call, "^[A-Za-z]+")[0]);
    expect(order).toEqual([
      "PreloadGenEnd",
      "DisplayTimedTextToPlayer",
      "PreloadGenEnd",
      "DisplayTimedTextToPlayer",
      "PreloadGenEnd",
      "DisplayTimedTextToPlayer",
    ]);
  });

  it("shows the end message with the number of records, for an hour", () => {
    expect(
      __stub_displayed().map(({ duration, text }) => [duration, text]),
    ).toEqual([[3600, "Probe hello finished: 2 records. Close the game."]]);
  });

  it("writes no line longer than 200 bytes, nor any holding a quote or a backslash", () => {
    const lines = preloadWrites().flat();
    expect(lines.length > 0).toEqual(true);
    for (const line of lines) {
      expect(line.length <= 200).toEqual(true);
      expect(string.find(line, '["\\]')[0]).toBeUndefined();
    }
  });

  it("splits a record longer than 200 bytes into continuation lines of its seq", () => {
    const lines = __stub_preload_file(RESULT_FILE) ?? [];
    let continuations = 0;
    let seq = "";
    for (const [index, line] of lines.entries()) {
      // `string.match` gives nil when the line does not match.
      const continued = string.match(line, "^(%d+)%+ ")[0] as
        string | undefined;
      if (continued === undefined) {
        seq = string.match(line, "^(%d+) ")[0];
        continue;
      }
      continuations++;
      expect(continued).toEqual(seq);
      expect(lines[index - 1]?.length).toEqual(200);
    }
    expect(continuations > 0).toEqual(true);
  });
});
