// The Nullability sweep's case runner (probes/nullability/case-runner.ts)
// on call cases, run on the harness with the shipped stubs inside the
// bundle of a small Probe of the tests (probes/nullability-call-cases.ts),
// built with the bridge fixtures' runId. Its call cases call a stand-in
// Native defined here, which returns nothing and raises for the filter
// "raising"; each call keeps the Result file as it is on disk when it is
// called, what a crash in the call would leave. A return case comes first,
// and one call case is on the skip list. The tests share one Lua state and
// run in order.

import { describe, expect, it } from "reforged-test/lua";
import { loadBundle, startedTimer } from "./bundle";

/**
 * The stand-in Natives the Probe's cases call.
 * @noSelf
 */
interface StandIns {
  StandInEnum?: (filter: string | undefined) => void;
  StandInNil?: () => handle | undefined;
}

const standIns = _G as unknown as StandIns;

/** The Result file of the Probe, under CustomMapData. */
const RESULT_FILE = "reforged-ts\\probes\\nullability-call-cases.txt";

/** The filter of each stand-in call so far, in order. */
const calls: string[] = [];

/** The Result file as it was on disk at each stand-in call, in order. */
const onDisk: string[][] = [];

/** Records a call with `filter`, with the Result file on disk then. */
function called(filter: string): void {
  calls.push(filter);
  onDisk.push(__stub_preload_file(RESULT_FILE) ?? []);
}

/** The lines of the Result file at the end of the run. */
function resultLines(): string[] {
  return __stub_preload_file(RESULT_FILE) ?? [];
}

describe("the Nullability sweep's case runner, on call cases", () => {
  it("runs the call cases after the return case, calls no skipped case, and ends the run", () => {
    standIns.StandInNil = () => {
      called("return case");
      return undefined;
    };
    standIns.StandInEnum = (filter) => {
      called(filter ?? "nil");
      if (filter === "raising") error("the filter broke", 0);
    };
    loadBundle("nullability-call-cases");
    __stub_fire_timer(startedTimer(0));
    expect(calls).toEqual([
      "return case",
      "always true",
      "nil",
      "raising",
      "nil",
    ]);
    expect(resultLines().at(-1)).toEqual("19 END status=ok");
  });

  it("records every call case up front with its param, argument and what it counts", () => {
    expect(resultLines().slice(1, 7)).toEqual([
      "2 CASE case=removed%20unit group=a native=StandInNil",
      "3 CASE argument=always-true case=always-true%20filter counted=unit group=a native=StandInEnum param=filter",
      "4 CASE argument=nil case=nil%20filter counted=unit group=a native=StandInEnum param=filter",
      "5 CASE argument=live case=crashing%20filter counted=unit group=a native=StandInEnum param=filter",
      "6 CASE argument=live case=raising%20filter counted=unit group=b native=StandInEnum param=filter",
      "7 CASE argument=nil case=no%20count counted=unit group=b native=StandInEnum param=filter",
    ]);
  });

  it("records completed with the count the case reports, error for a call that raised or reported no count, and SKIP for a skipped call case", () => {
    expect(resultLines().slice(7, 18)).toEqual([
      "8 PENDING label=StandInNil%20removed%20unit",
      "9 CALL case=removed%20unit group=a native=StandInNil outcome=nil",
      "10 PENDING label=StandInEnum%20always-true%20filter",
      "11 CALL argument=always-true case=always-true%20filter count=5 counted=unit group=a native=StandInEnum outcome=completed param=filter",
      "12 PENDING label=StandInEnum%20nil%20filter",
      "13 CALL argument=nil case=nil%20filter count=3 counted=unit group=a native=StandInEnum outcome=completed param=filter",
      "14 SKIP argument=live case=crashing%20filter counted=unit group=a native=StandInEnum param=filter reason=crashed",
      "15 PENDING label=StandInEnum%20raising%20filter",
      "16 CALL argument=live case=raising%20filter counted=unit group=b message=the%20filter%20broke native=StandInEnum outcome=error param=filter",
      "17 PENDING label=StandInEnum%20no%20count",
      "18 CALL argument=nil case=no%20count counted=unit group=b message=The%20case%20reported%20no%20count:%20it%20returned%20one. native=StandInEnum outcome=error param=filter",
    ]);
  });

  it("puts every line on disk right before each call, the call case's PENDING line last, as for a return case", () => {
    // The line each call's PENDING line is, in the file at the end.
    const pendingAt = [8, 10, 12, 15, 17];
    expect(onDisk).toEqual(
      pendingAt.map((seq) => [
        ...resultLines().slice(0, seq),
        `${String(seq + 1)} CHECKPOINT`,
      ]),
    );
  });
});
