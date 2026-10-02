// The calibration Probe's bundle, as probe:build compiles it with the bridge
// fixtures' runId, run on the harness with the shipped stubs, so the Probe
// fails on nothing but the game. The tests share one Lua state and run in
// order: the runner's timer fires and the Probe writes its test files, from
// C1 to the first write of C5; its 30-second timer fires and it writes the
// second, then ends the run; its 3-second timer fires and it calls
// `EndGame`, which the stubs leave out and this test stubs (C8). The stubs'
// clock moves only when a test sets it: 5.25 while `run` runs, 35.75 when the
// 30-second timer fires.

import { describe, expect, it, stubCalls } from "reforged-test/lua";
import { globals, loadBundle, startedTimer } from "./bundle";

/** The Result file of the calibration Probe, under CustomMapData. */
const RESULT_FILE = "reforged-ts\\probes\\calibration.txt";

/** A test file of the calibration Probe, under CustomMapData. */
function testFile(name: string): string {
  return `reforged-ts\\calibration\\${name}`;
}

/** The Preload family's calls so far, from the call log. */
function preloadCalls(): string[] {
  return stubCalls().filter((call) => call.startsWith("Preload"));
}

/** The call-log line of each write of preload-rewrite.txt, its backslashes escaped. */
const REWRITE_END =
  'PreloadGenEnd("reforged-ts\\\\calibration\\\\preload-rewrite.txt")';

/**
 * The Result file's lines up to the records of preload-crash.txt's first
 * write, which reach the disk only with its second.
 */
const UNTIL_C5 = [
  "1 BEGIN patch=3.0.0.12345 probe=calibration run=bridge",
  "2 PENDING label=C1,C2,C6",
  "3 C1 file=preload-chars.txt length=200 preload=1",
  "4 C1 file=preload-chars.txt length=238 preload=2",
  "5 C1 file=preload-chars.txt length=255 preload=3",
  "6 C1 file=preload-chars.txt length=259 preload=4",
  "7 C1 file=preload-chars.txt length=260 preload=5",
  "8 C1 file=preload-chars.txt length=300 preload=6",
  "9 C2 backslashes=126 doubled=258 file=preload-chars.txt length=132 preload=7",
  "10 C2 backslashes=127 doubled=260 file=preload-chars.txt length=133 preload=8",
  "11 C2 backslashes=40 doubled=239 file=preload-chars.txt length=199 preload=9",
  "12 C6 character=cr file=preload-chars.txt length=13 preload=10",
  "13 C6 character=crlf file=preload-chars.txt length=16 preload=11",
  "14 C6 character=nul file=preload-chars.txt length=14 preload=12",
  "15 C6 character=tab file=preload-chars.txt length=14 preload=13",
  "16 C6 character=pct file=preload-chars.txt length=14 preload=14",
  "17 write clear=true clock=5.25 file=preload-chars.txt preloads=15 start=true",
  "18 PENDING label=C4",
  "19 write clear=true clock=5.25 file=preload-rewrite.txt preloads=1 start=true",
  "20 C4 file=preload-rewrite.txt text=checkpoint%201 write=1",
  "21 write clear=true clock=5.25 file=preload-rewrite.txt preloads=1 start=true",
  "22 C4 file=preload-rewrite.txt text=checkpoint%202 write=2",
  "23 write clear=false clock=5.25 file=preload-rewrite.txt preloads=1 start=true",
  "24 C4 file=preload-rewrite.txt text=checkpoint%203,%20no%20clear write=3",
  "25 PENDING label=C3",
  "26 write clear=true clock=5.25 file=preload-many.txt preloads=5001 start=true",
  "27 C3 file=preload-many.txt length=100 lines=5001 seconds=0.0",
  "28 PENDING label=C5,C7",
];

describe("the calibration Probe's bundle", () => {
  it("writes preload-chars.txt first: the strings of C1, C2 and C6, then its last line", () => {
    loadBundle("calibration");
    __stub_set_clock(5.25);
    __stub_fire_timer(startedTimer(0));
    const lines = __stub_preload_file(testFile("preload-chars.txt")) ?? [];
    expect(lines.length).toEqual(15);
    expect(lines.slice(0, 6).map((line) => line.length)).toEqual([
      200, 238, 255, 259, 260, 300,
    ]);
    expect(lines[0]).toEqual(`C1 len=200 ${string.rep("x", 188)}Z`);
    expect(lines.slice(6, 9)).toEqual([
      `C2 a ${string.rep("\\", 126)}Z`,
      `C2 b ${string.rep("\\", 127)}Z`,
      `C2 bs40 ${string.rep("\\", 40)}${string.rep("y", 150)}Z`,
    ]);
    expect(lines.slice(9)).toEqual([
      "C6 cr [\r] end",
      "C6 crlf [\r\n] end",
      `C6 nul [${string.char(0)}] end`,
      "C6 tab [\t] end",
      `C6 pct [${string.char(37)}] end`,
      "C1 C2 C6 done",
    ]);
  });

  it("writes preload-rewrite.txt three times in a row, the third without PreloadGenClear (C4)", () => {
    const calls = preloadCalls();
    const first = calls.indexOf('Preload("checkpoint 1")') - 2;
    expect(first >= 2).toEqual(true);
    expect(calls.slice(first, first + 11)).toEqual([
      "PreloadGenClear()",
      "PreloadGenStart()",
      'Preload("checkpoint 1")',
      REWRITE_END,
      "PreloadGenClear()",
      "PreloadGenStart()",
      'Preload("checkpoint 2")',
      REWRITE_END,
      "PreloadGenStart()",
      'Preload("checkpoint 3, no clear")',
      REWRITE_END,
    ]);
    // The stubs keep the buffer until PreloadGenClear, as jassdoc claims.
    expect(__stub_preload_file(testFile("preload-rewrite.txt"))).toEqual([
      "checkpoint 2",
      "checkpoint 3, no clear",
    ]);
  });

  it("writes preload-many.txt: 5,000 lines of 100 bytes, then its last line (C3)", () => {
    const lines = __stub_preload_file(testFile("preload-many.txt")) ?? [];
    expect(lines.length).toEqual(5001);
    for (const line of lines.slice(0, 5000)) {
      expect(line.length).toEqual(100);
    }
    expect(lines[0]).toEqual(`C3 line 00001 ${string.rep("w", 85)}Z`);
    expect(string.sub(lines[4999] ?? "", 1, 14)).toEqual("C3 line 05000 ");
    expect(lines[5000]).toEqual("C3 done");
  });

  it("has the PENDING line of C5 and C7 on disk, then writes preload-crash.txt's checkpoint 1 last of all, and starts a 30-second timer", () => {
    expect(__stub_preload_file(RESULT_FILE)).toEqual([
      ...UNTIL_C5,
      "29 CHECKPOINT",
    ]);
    expect(__stub_preload_file(testFile("preload-crash.txt"))).toEqual([
      "checkpoint 1",
    ]);
    expect(preloadCalls().slice(-4)).toEqual([
      "PreloadGenClear()",
      "PreloadGenStart()",
      'Preload("checkpoint 1")',
      'PreloadGenEnd("reforged-ts\\\\calibration\\\\preload-crash.txt")',
    ]);
    const starts = __stub_args("TimerStart");
    expect(starts.length).toEqual(2);
    expect(starts[1]?.[1]).toEqual(30);
  });

  it("shows when C5's END comes, for a minute, so the human can kill the game before", () => {
    const shown = __stub_displayed().map(({ duration, text }) => [
      duration,
      text,
    ]);
    expect(shown[shown.length - 1]).toEqual([
      60,
      "Probe calibration, C5: checkpoint 1 written; END in 30 s. To test a crash, kill Warcraft III.exe now.",
    ]);
  });

  it("writes preload-crash.txt again on the timer, without PreloadGenStart, records the clocks and ends the run (C5, C7)", () => {
    const before = preloadCalls().length;
    __stub_set_clock(35.75);
    __stub_fire_timer(startedTimer(1));
    expect(preloadCalls().slice(before, before + 5)).toEqual([
      "PreloadGenClear()",
      'Preload("checkpoint 1")',
      'Preload("checkpoint 2")',
      'Preload("END")',
      'PreloadGenEnd("reforged-ts\\\\calibration\\\\preload-crash.txt")',
    ]);
    expect(__stub_preload_file(testFile("preload-crash.txt"))).toEqual([
      "checkpoint 1",
      "checkpoint 2",
      "END",
    ]);
    expect(__stub_preload_file(RESULT_FILE)).toEqual([
      ...UNTIL_C5,
      "29 write clear=true clock=5.25 file=preload-crash.txt preloads=1 start=true",
      "30 C5 file=preload-crash.txt write=1",
      "31 write clear=true clock=35.75 file=preload-crash.txt preloads=3 start=false",
      "32 C5 file=preload-crash.txt write=2",
      "33 C7 file=preload-crash.txt firstStart=5.25 idle=30.5 timer=30",
      "34 C8 seconds=3 showScores=false",
      "35 END status=ok",
    ]);
  });

  it("shows the end message, then C8's, and calls EndGame(false) only on a 3-second timer, after END (C8)", () => {
    const shown = __stub_displayed().map(({ text }) => text);
    expect(shown.slice(-2)).toEqual([
      "Probe calibration finished: 29 records. Close the game.",
      "Probe calibration, C8: EndGame(false) in 3 s. Say where the client went.",
    ]);
    const starts = __stub_args("TimerStart");
    expect(starts.length).toEqual(3);
    expect(starts[2]?.[1]).toEqual(3);

    const endGames: boolean[] = [];
    globals.EndGame = (doScoreScreen) => {
      endGames.push(doScoreScreen);
    };
    const resultFile = __stub_preload_file(RESULT_FILE);
    const writes = preloadCalls().length;
    try {
      __stub_fire_timer(startedTimer(2));
    } finally {
      globals.EndGame = undefined;
    }
    expect(endGames).toEqual([false]);
    expect(preloadCalls().length).toEqual(writes);
    expect(__stub_preload_file(RESULT_FILE)).toEqual(resultFile);
  });
});
