/** @noSelfInFile */

// A handle maps to one Wrapper object for the life of the state (registry
// identity).

import { describe, expect, it } from "reforged-test/lua";
import { MapPlayer, tsGlobals, Unit } from "../src/index";
import { defined } from "./support/defined";

describe("the Handle registry", () => {
  const owner = defined(MapPlayer.fromIndex(0), "MapPlayer.fromIndex(0)");
  const unit = Unit.create(owner, FourCC("hfoo"), 0, 0);

  it("returns the same Unit for a handle every time", () => {
    expect(Unit.fromHandle(unit.handle)).toBe(unit);
    expect(Unit.fromHandle(unit.handle)).toBe(unit);
  });

  it("returns the cached MapPlayer as the owner", () => {
    expect(unit.getOwner()).toBe(owner);
  });

  it("holds the same MapPlayer objects in the Players global", () => {
    expect(tsGlobals.Players.length).toEqual(bj_MAX_PLAYER_SLOTS);
    for (let slot = 0; slot < bj_MAX_PLAYER_SLOTS; slot++) {
      expect(MapPlayer.fromIndex(slot)).toBe(tsGlobals.Players[slot]);
    }
    expect(MapPlayer.fromLocal()).toBe(tsGlobals.Players[0]);
  });
});
