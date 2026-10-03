// The Nullability sweep's case runner (probes/nullability/case-runner.ts),
// run on the harness with the shipped stubs inside the bundle of a small
// Probe of the tests (probes/nullability-cases.ts), built with the bridge
// fixtures' runId. Its cases call stand-in Natives defined here: they return
// a stub handle, nothing, the frame stub's id-0 "not found" frame or a
// number, or raise, and each keeps the Result file as it is on disk when it
// is called, what a crash in the call would leave; the first (b) case is on
// the skip list. The tests share one Lua state and run in order.

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
}

const standIns = _G as unknown as StandIns;

/** The Result file of the Probe, under CustomMapData. */
const RESULT_FILE = "reforged-ts\\probes\\nullability-cases.txt";

/** Each stand-in Native's calls so far, in order. */
const calls: string[] = [];

/** The Result file as it was on disk at each stand-in call, in order. */
const onDisk: string[][] = [];

/** Records a call of the stand-in `name`, with the Result file on disk then. */
function called(name: string): void {
  calls.push(name);
  onDisk.push(__stub_preload_file(RESULT_FILE) ?? []);
}

/** The lines of the Result file at the end of the run. */
function resultLines(): string[] {
  return __stub_preload_file(RESULT_FILE) ?? [];
}

/** The lines of the Result file whose kind is `kind`. */
function linesOfKind(kind: string): string[] {
  return resultLines().filter((line) => line.split(" ")[1] === kind);
}

describe("the Nullability sweep's case runner", () => {
  it("runs the cases when the runner's timer fires, calls no skipped case, and ends the run", () => {
    standIns.StandInHandle = () => {
      called("StandInHandle");
      return __stub_new_handle("timer");
    };
    standIns.StandInNil = () => {
      called("StandInNil");
      return undefined;
    };
    standIns.StandInRaise = () => {
      called("StandInRaise");
      return error("the stand-in broke", 0);
    };
    standIns.StandInNotFound = () => {
      called("StandInNotFound");
      return __stub_frame_not_found();
    };
    standIns.StandInNumber = () => {
      called("StandInNumber");
      return 42;
    };
    loadBundle("nullability-cases");
    __stub_fire_timer(startedTimer(0));
    expect(calls).toEqual([
      "StandInHandle",
      "StandInNumber",
      "StandInNil",
      "StandInRaise",
      "StandInNotFound",
    ]);
    expect(resultLines().at(-1)).toEqual("19 END status=ok");
  });

  it("records every case up front, in the case order", () => {
    expect(resultLines().slice(1, 7)).toEqual([
      "2 CASE case=live%20handle group=a native=StandInHandle",
      "3 CASE case=a%20number group=a native=StandInNumber",
      "4 CASE case=crashing%20call group=b native=StandInHandle",
      "5 CASE case=removed%20unit group=b native=StandInNil",
      "6 CASE case=raising%20call group=b native=StandInRaise",
      "7 CASE case=not%20found%20frame group=b native=StandInNotFound",
    ]);
  });

  it("writes a PENDING line naming the Native and the case right before each called case's CALL, and a SKIP where the skipped case would have run", () => {
    const records = linesOfKind("CALL");
    expect(resultLines().slice(7, 18)).toEqual([
      "8 PENDING label=StandInHandle%20live%20handle",
      records[0] ?? "",
      "10 PENDING label=StandInNumber%20a%20number",
      records[1] ?? "",
      "12 SKIP case=crashing%20call group=b native=StandInHandle reason=crashed",
      "13 PENDING label=StandInNil%20removed%20unit",
      records[2] ?? "",
      "15 PENDING label=StandInRaise%20raising%20call",
      records[3] ?? "",
      "17 PENDING label=StandInNotFound%20not%20found%20frame",
      records[4] ?? "",
    ]);
  });

  it("writes one CALL per called case with its outcome: handle with id and type, odd with type, nil, error with message", () => {
    // The runner's own timer takes the first handle id, 1048577, and the
    // first checkpoint's message the local player's, 1048578.
    const records = linesOfKind("CALL");
    expect([records[0], records[1], records[2], records[3]]).toEqual([
      "9 CALL case=live%20handle group=a id=1048579 native=StandInHandle outcome=handle type=timer:%201048579",
      "11 CALL case=a%20number group=a native=StandInNumber outcome=odd type=42",
      "14 CALL case=removed%20unit group=b native=StandInNil outcome=nil",
      "16 CALL case=raising%20call group=b message=the%20stand-in%20broke native=StandInRaise outcome=error",
    ]);
    expect(records.length).toBe(5);
  });

  it("records the frame stub's id-0 frame as a handle of id 0, with its tostring", () => {
    // The not-found frame has no metatable: its tostring is a table's.
    expect(
      (linesOfKind("CALL")[4] ?? "").startsWith(
        "18 CALL case=not%20found%20frame group=b id=0 native=StandInNotFound outcome=handle type=table:%20",
      ),
    ).toBe(true);
  });

  it("puts every line on disk right before each call, the case's PENDING line last, so a crash in an (a) case names it", () => {
    // The line each call's PENDING line is, in the file at the end.
    const pendingAt = [8, 10, 13, 15, 17];
    expect(onDisk).toEqual(
      pendingAt.map((seq) => [
        ...resultLines().slice(0, seq),
        `${String(seq + 1)} CHECKPOINT`,
      ]),
    );
  });

  it("puts the CASE records on disk, then each SKIP line, so a skipped first (b) case keeps the (a) group on disk", () => {
    expect(
      __stub_displayed()
        .map(({ text }) => text)
        .filter((text) =>
          text.startsWith("Probe nullability-cases: checkpoint"),
        ),
    ).toEqual(
      [6, 6, 7, 9, 9, 10, 11].map(
        (records, index) =>
          `Probe nullability-cases: checkpoint ${String(index + 1)}, ${String(records)} records so far.`,
      ),
    );
  });
});
