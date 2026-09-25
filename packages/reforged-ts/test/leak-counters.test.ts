/** @noSelfInFile */

// Leak counters: in Dev mode the creation step counts `created` per class
// and the release step counts `destroyed`; `Reforged.debug.report()` prints
// and returns the rows with the live difference, sorted by live descending,
// and `reset()` zeroes them. Lookups never count. With Dev mode off nothing
// is counted and the report is empty.

import { describe, expect, it } from "reforged-test/lua";
import { Group, MapPlayer, Timer, Unit } from "../src/index";
import { Reforged, type WrapperCount } from "../src/reforged/index";
import { defined } from "./support/defined";
import { withPrint } from "./support/print-capture";

// Dev mode raises for a Wrapper created before the globals Init stage.
__stub_init_globals();

/** The report's rows, read without keeping what it printed. */
function rows(): readonly WrapperCount[] {
  let counted: readonly WrapperCount[] = [];
  withPrint(() => {
    counted = Reforged.debug.report().wrappers;
  });
  return counted;
}

/** The row of `className`, or undefined when the report has none. */
function rowOf(className: string): WrapperCount | undefined {
  return rows().find((row) => row.className === className);
}

describe("leak counters in Dev mode", () => {
  it("counts three timers created and one destroyed as two live", () => {
    Reforged.configure({ devMode: true });
    Reforged.debug.reset();
    const timers = [Timer.create(), Timer.create(), Timer.create()];
    timers[0].destroy();

    expect(rowOf("Timer")).toEqual({
      className: "Timer",
      created: 3,
      destroyed: 1,
      live: 2,
    });
  });

  it("leaves the row unchanged on a lookup, and reset() zeroes it", () => {
    Reforged.configure({ devMode: true });
    Reforged.debug.reset();
    const timer = Timer.create();
    const before = rowOf("Timer");

    expect(Timer.fromHandle(timer.handle)).toBe(timer);
    expect(Timer.fromHandle(CreateTimer())).toBeTruthy();
    expect(rowOf("Timer")).toEqual(before);

    Reforged.debug.reset();
    expect(rowOf("Timer")).toBeUndefined();
    expect(rows()).toEqual([]);
  });

  it("does not count the non-null lookups fromLocal and getOwner", () => {
    Reforged.configure({ devMode: true });
    Reforged.debug.reset();
    const owner = defined(MapPlayer.fromIndex(0), "MapPlayer.fromIndex(0)");
    const unit = Unit.create(owner, FourCC("hfoo"), 0, 0);

    expect(unit.getOwner()).toBe(owner);
    MapPlayer.fromLocal();

    expect(rowOf("MapPlayer")).toBeUndefined();
    expect(rowOf("Unit")?.created).toEqual(1);
  });

  it("sorts rows by live descending and prints one line per row", () => {
    Reforged.configure({ devMode: true });
    Reforged.debug.reset();
    Group.create();
    Timer.create();
    Timer.create();

    let wrappers: readonly WrapperCount[] = [];
    const printed = withPrint(() => {
      wrappers = Reforged.debug.report().wrappers;
    });

    expect(wrappers.map((row) => row.className)).toEqual(["Timer", "Group"]);
    expect(
      printed.includes("reforged-ts: Timer: created 2, destroyed 0, live 2"),
    ).toEqual(true);
    expect(
      printed.includes("reforged-ts: Group: created 1, destroyed 0, live 1"),
    ).toEqual(true);
  });
});

describe("leak counters with Dev mode off", () => {
  it("counts nothing, and report() returns empty", () => {
    Reforged.configure({ devMode: true });
    Reforged.debug.reset();
    Reforged.configure({ devMode: false });
    const timer = Timer.create();
    timer.destroy();

    let wrappers: readonly WrapperCount[] | undefined;
    const printed = withPrint(() => {
      wrappers = Reforged.debug.report().wrappers;
    });

    expect(wrappers).toEqual([]);
    expect(printed).toEqual([
      "reforged-ts: Dev mode is off: Reforged.debug has nothing to report",
    ]);
    Reforged.configure({ devMode: true });
    expect(rowOf("Timer")).toBeUndefined();
  });
});
