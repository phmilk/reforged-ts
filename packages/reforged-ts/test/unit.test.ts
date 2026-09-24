/** @noSelfInFile */

// A Wrapper passes its arguments to the Native, and what the Native returns
// comes back through the Wrapper (argument recording).

import { describe, expect, it, stubCalls } from "reforged-test/lua";
import { MapPlayer, Unit } from "../src/index";
import { defined } from "./support/defined";

const footman = FourCC("hfoo");

describe("Unit.create", () => {
  const owner = defined(MapPlayer.fromIndex(0), "MapPlayer.fromIndex(0)");
  const ownerRef = `player#${tostring(GetHandleId(owner.handle))}`;

  it("passes the recorded arguments to CreateUnit", () => {
    Unit.create(owner, footman, 10, 20, 90);
    expect(stubCalls()).toContainCall(
      `CreateUnit(${ownerRef}, 1751543663, 10, 20, 90)`,
    );
  });

  it("passes the default facing when none is given", () => {
    Unit.create(owner, footman, -64, 128.5);
    expect(stubCalls()).toContainCall(
      `CreateUnit(${ownerRef}, 1751543663, -64, 128.5, 270.0)`,
    );
  });

  it("round-trips the owner and the type id", () => {
    const unit = defined(Unit.create(owner, footman, 0, 0), "Unit.create");
    expect(unit.getOwner()?.handle).toBe(owner.handle);
    expect(unit.typeId).toEqual(footman);
  });
});
