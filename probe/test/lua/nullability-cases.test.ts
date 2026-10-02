// The Nullability sweep's case runner (probes/nullability/case-runner.ts),
// run on the harness with the shipped stubs inside the bundle of a small
// Probe of the tests (probes/nullability-cases.ts), built with the bridge
// fixtures' runId. Its cases call stand-in Natives defined here: they return
// a stub handle, nothing, the frame stub's id-0 "not found" frame or a
// number, or raise; one case is on the skip list and one asks for a
// checkpoint. The tests share one Lua state and run in order.

import { describe, expect, it } from "reforged-test/lua";
import { loadBundle, startedTimer } from "./bundle";

/**
 * The stand-in Natives the Probe's cases call.
 * @noSelf
 */
interface StandIns {
  StandInHandle?: () => handle;
  StandInNil?: () => handle | undefined;
  StandInRaise?: () => handle;
  StandInNotFound?: () => handle;
  StandInNumber?: () => number;
  StandInSnapshot?: () => handle;
}

const standIns = _G as unknown as StandIns;

/** The Result file of the Probe, under CustomMapData. */
const RESULT_FILE = "reforged-ts\\probes\\nullability-cases.txt";

/** Each stand-in Native's calls so far, in order. */
const calls: string[] = [];

/** The Result file as it was on disk when StandInSnapshot was called. */
let snapshot: string[] = [];

/** The lines of the Result file whose kind is `kind`. */
function linesOfKind(kind: string): string[] {
  return (__stub_preload_file(RESULT_FILE) ?? []).filter(
    (line) => line.split(" ")[1] === kind,
  );
}

describe("the Nullability sweep's case runner", () => {
  it("runs the cases when the runner's timer fires, calls no skipped case, and ends the run", () => {
    standIns.StandInHandle = () => {
      calls.push("StandInHandle");
      return __stub_new_handle("timer");
    };
    standIns.StandInNil = () => {
      calls.push("StandInNil");
      return undefined;
    };
    standIns.StandInRaise = () => {
      calls.push("StandInRaise");
      return error("the stand-in broke", 0);
    };
    standIns.StandInNotFound = () => {
      calls.push("StandInNotFound");
      return __stub_frame_not_found();
    };
    standIns.StandInNumber = () => {
      calls.push("StandInNumber");
      return 42;
    };
    standIns.StandInSnapshot = () => {
      calls.push("StandInSnapshot");
      snapshot = __stub_preload_file(RESULT_FILE) ?? [];
      return __stub_new_handle("timer");
    };
    loadBundle("nullability-cases");
    __stub_fire_timer(startedTimer(0));
    expect(calls).toEqual([
      "StandInHandle",
      "StandInNumber",
      "StandInNil",
      "StandInRaise",
      "StandInNotFound",
      "StandInSnapshot",
    ]);
    expect(__stub_preload_file(RESULT_FILE)?.at(-1)).toEqual(
      "22 END status=ok",
    );
  });

  it("records every case up front, in the case order", () => {
    expect(__stub_preload_file(RESULT_FILE)?.slice(1, 8)).toEqual([
      "2 CASE case=live%20handle group=a native=StandInHandle",
      "3 CASE case=a%20number group=a native=StandInNumber",
      "4 CASE case=removed%20unit group=b native=StandInNil",
      "5 CASE case=raising%20call group=b native=StandInRaise",
      "6 CASE case=not%20found%20frame group=b native=StandInNotFound",
      "7 CASE case=crashing%20call group=b native=StandInHandle",
      "8 CASE case=risky%20call group=b native=StandInSnapshot",
    ]);
  });

  it("writes a PENDING line naming the Native and the case right before each called case's CALL, and a SKIP where the skipped case would have run", () => {
    const records = linesOfKind("CALL");
    expect(__stub_preload_file(RESULT_FILE)?.slice(8, 21)).toEqual([
      "9 PENDING label=StandInHandle%20live%20handle",
      records[0] ?? "",
      "11 PENDING label=StandInNumber%20a%20number",
      records[1] ?? "",
      "13 PENDING label=StandInNil%20removed%20unit",
      records[2] ?? "",
      "15 PENDING label=StandInRaise%20raising%20call",
      records[3] ?? "",
      "17 PENDING label=StandInNotFound%20not%20found%20frame",
      records[4] ?? "",
      "19 SKIP case=crashing%20call group=b native=StandInHandle reason=crashed",
      "20 PENDING label=StandInSnapshot%20risky%20call",
      records[5] ?? "",
    ]);
  });

  it("writes one CALL per called case with its outcome: handle with id and type, odd with type, nil, error with message", () => {
    // The runner's own timer takes the first handle id, 1048577, and the
    // checkpoint's message the local player's, 1048579.
    const records = linesOfKind("CALL");
    expect([
      records[0],
      records[1],
      records[2],
      records[3],
      records[5],
    ]).toEqual([
      "10 CALL case=live%20handle group=a id=1048578 native=StandInHandle outcome=handle type=timer:%201048578",
      "12 CALL case=a%20number group=a native=StandInNumber outcome=odd type=42",
      "14 CALL case=removed%20unit group=b native=StandInNil outcome=nil",
      "16 CALL case=raising%20call group=b message=the%20stand-in%20broke native=StandInRaise outcome=error",
      "21 CALL case=risky%20call group=b id=1048580 native=StandInSnapshot outcome=handle type=timer:%201048580",
    ]);
    expect(records.length).toBe(6);
  });

  it("records the frame stub's id-0 frame as odd, with its tostring", () => {
    // The not-found frame has no metatable: its tostring is a table's.
    expect(
      (linesOfKind("CALL")[4] ?? "").startsWith(
        "18 CALL case=not%20found%20frame group=b native=StandInNotFound outcome=odd type=table:%20",
      ),
    ).toBe(true);
  });

  it("puts every line on disk, the case's PENDING line last, right before a checkpointed case's call", () => {
    expect(snapshot.slice(-2)).toEqual([
      "20 PENDING label=StandInSnapshot%20risky%20call",
      "21 CHECKPOINT",
    ]);
    expect(snapshot.length).toBe(21);
  });
});
