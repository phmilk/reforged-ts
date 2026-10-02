// The Nullability sweep's case runner (probes/nullability/case-runner.ts),
// run on the harness with the shipped stubs inside the bundle of a small
// Probe of the tests (probes/nullability-cases.ts), built with the bridge
// fixtures' runId. Its cases call stand-in Natives defined here: one returns
// a stub handle, one returns nothing. The tests share one Lua state and run
// in order.

import { describe, expect, it } from "reforged-test/lua";
import { loadBundle, startedTimer } from "./bundle";

/**
 * The stand-in Natives the Probe's cases call.
 * @noSelf
 */
interface StandIns {
  StandInHandle?: () => handle;
  StandInNil?: () => handle | undefined;
}

const standIns = _G as unknown as StandIns;

/** The Result file of the Probe, under CustomMapData. */
const RESULT_FILE = "reforged-ts\\probes\\nullability-cases.txt";

/** Each stand-in Native's calls so far, in order. */
const calls: string[] = [];

/** The lines of the Result file whose kind is `kind`. */
function linesOfKind(kind: string): string[] {
  return (__stub_preload_file(RESULT_FILE) ?? []).filter(
    (line) => line.split(" ")[1] === kind,
  );
}

describe("the Nullability sweep's case runner", () => {
  it("runs the cases when the runner's timer fires, and ends the run", () => {
    standIns.StandInHandle = () => {
      calls.push("StandInHandle");
      return __stub_new_handle("timer");
    };
    standIns.StandInNil = () => {
      calls.push("StandInNil");
      return undefined;
    };
    loadBundle("nullability-cases");
    __stub_fire_timer(startedTimer(0));
    expect(calls).toEqual(["StandInHandle", "StandInNil", "StandInHandle"]);
    expect(__stub_preload_file(RESULT_FILE)?.at(-1)).toEqual("8 END status=ok");
  });

  it("writes a PENDING line naming the Native and the case right before each case's CALL", () => {
    expect(__stub_preload_file(RESULT_FILE)?.slice(1, 7)).toEqual([
      "2 PENDING label=StandInHandle%20live%20handle",
      linesOfKind("CALL")[0] ?? "",
      "4 PENDING label=StandInNil%20removed%20unit",
      linesOfKind("CALL")[1] ?? "",
      "6 PENDING label=StandInHandle%20second%20call",
      linesOfKind("CALL")[2] ?? "",
    ]);
  });

  it("writes one CALL per case, in the case order: a handle with its id and its tostring, nil with neither", () => {
    // The runner's own timer takes the first handle id, 1048577.
    expect(linesOfKind("CALL")).toEqual([
      "3 CALL case=live%20handle group=a id=1048578 native=StandInHandle outcome=handle type=timer:%201048578",
      "5 CALL case=removed%20unit group=b native=StandInNil outcome=nil",
      "7 CALL case=second%20call group=b id=1048579 native=StandInHandle outcome=handle type=timer:%201048579",
    ]);
  });
});
