/** @noSelfInFile */

// Group on the Handle base: `create` throws; `first` and `getUnitAt` are
// lookups; the enumeration goes through `Unit.fromEnum`, the one name for
// GetEnumUnit.

import { describe, expect, it, stubCalls } from "reforged-test/lua";
import { Group, MapPlayer, Unit } from "../src/index";
import { defined } from "./support/defined";
import { handleRef } from "./support/handle-ref";
import { withNative } from "./support/native-override";
import { raisedIn } from "./support/raised-in";

const footman = FourCC("hfoo");
const owner = defined(MapPlayer.fromIndex(0), "MapPlayer.fromIndex(0)");

/** A group holding two new units, and the units in added order. */
function groupOfTwo(): [Group, Unit, Unit] {
  const group = Group.create();
  const first = Unit.create(owner, footman, 0, 0);
  const second = Unit.create(owner, footman, 0, 0);
  group.addUnit(first);
  group.addUnit(second);
  return [group, first, second];
}

describe("Group.create", () => {
  it("wraps the handle CreateGroup returns, and a lookup finds it", () => {
    const group = Group.create();
    expect(stubCalls()).toContainCall("CreateGroup()");
    expect(Group.fromHandle(group.handle)).toBe(group);
  });

  it("throws when CreateGroup returns nil", () => {
    const message = withNative(
      "CreateGroup",
      () => undefined,
      () =>
        raisedIn(() => {
          Group.create();
        }),
    );
    expect(message).toEqual("reforged-ts: failed to create Group");
  });
});

describe("Group.first", () => {
  it("is undefined for an empty group", () => {
    expect(Group.create().first).toBeUndefined();
  });

  it("is the Wrapper of the first unit", () => {
    const [group, first] = groupOfTwo();
    expect(group.first).toBe(first);
  });
});

describe("Group.getUnitAt", () => {
  it("is the Wrapper of the unit at the index", () => {
    const [group, first, second] = groupOfTwo();
    expect(group.getUnitAt(0)).toBe(first);
    expect(group.getUnitAt(1)).toBe(second);
  });

  it("is undefined past the last unit", () => {
    const [group] = groupOfTwo();
    expect(group.getUnitAt(2)).toBeUndefined();
  });
});

describe("Group enumeration", () => {
  it("gives each unit through Unit.fromEnum inside for", () => {
    const [group, first, second] = groupOfTwo();
    const seen: (Unit | undefined)[] = [];
    group.for(() => {
      seen.push(Unit.fromEnum());
    });
    expect(seen.length).toEqual(2);
    expect(seen[0]).toBe(first);
    expect(seen[1]).toBe(second);
  });

  it("getUnits lists the units' Wrappers in order", () => {
    const [group, first, second] = groupOfTwo();
    const units = group.getUnits();
    expect(units.length).toEqual(2);
    expect(units[0]).toBe(first);
    expect(units[1]).toBe(second);
  });

  it("Unit.fromEnum is undefined outside an enumeration", () => {
    expect(Unit.fromEnum()).toBeUndefined();
  });
});

// The game's BlzGroupAddGroupFast and BlzGroupRemoveGroupFast change their
// second group (measured in 3.0.0, #260); the members change `this`.
describe("Group.addGroupFast", () => {
  it("adds every unit of the argument to this group, and leaves the argument as it was", () => {
    const [source, first, second] = groupOfTwo();
    const target = Group.create();
    expect(target.addGroupFast(source)).toEqual(2);
    expect(target.size).toEqual(2);
    expect(target.getUnitAt(0)).toBe(first);
    expect(target.getUnitAt(1)).toBe(second);
    expect(source.size).toEqual(2);
    expect(source.getUnitAt(0)).toBe(first);
    expect(source.getUnitAt(1)).toBe(second);
  });

  it("calls the Native with the argument first and this group second", () => {
    const [source] = groupOfTwo();
    const target = Group.create();
    target.addGroupFast(source);
    expect(stubCalls()).toContainCall(
      `BlzGroupAddGroupFast(${handleRef("group", source.handle)}, ${handleRef("group", target.handle)})`,
    );
  });
});

describe("Group.removeGroupFast", () => {
  it("removes every unit of the argument from this group, and leaves the argument as it was", () => {
    const [target, first, second] = groupOfTwo();
    const source = Group.create();
    source.addUnit(first);
    expect(target.removeGroupFast(source)).toEqual(1);
    expect(target.size).toEqual(1);
    expect(target.getUnitAt(0)).toBe(second);
    expect(source.size).toEqual(1);
    expect(source.getUnitAt(0)).toBe(first);
  });

  it("calls the Native with the argument first and this group second", () => {
    const [target, first] = groupOfTwo();
    const source = Group.create();
    source.addUnit(first);
    target.removeGroupFast(source);
    expect(stubCalls()).toContainCall(
      `BlzGroupRemoveGroupFast(${handleRef("group", source.handle)}, ${handleRef("group", target.handle)})`,
    );
  });
});
