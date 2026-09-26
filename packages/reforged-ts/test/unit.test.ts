/** @noSelfInFile */

// Unit on the Handle base. A Wrapper passes its arguments to the Native, and
// what the Native returns comes back through the Wrapper (argument
// recording). The members whose Natives allocate (create, getPoint,
// addItemById) throw when the Native returns nothing, naming the rawcode
// where there is one; the lookups return undefined; getOwner is the
// documented non-null path (a live unit has an owner).

import { describe, expect, it, stubCalls } from "reforged-test/lua";
import { Destructable, Item, MapPlayer, Point, Unit } from "../src/index";
import { defined } from "./support/defined";
import { handleRef } from "./support/handle-ref";
import { withNative } from "./support/native-override";
import { raisedIn } from "./support/raised-in";

const footman = FourCC("hfoo");
const knightSkin = FourCC("hkni");
const ration = FourCC("ratf");
const owner = defined(MapPlayer.fromIndex(0), "MapPlayer.fromIndex(0)");

describe("Unit.create", () => {
  const ownerRef = handleRef("player", owner.handle);

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

  it("wraps the handle CreateUnit returns, and a lookup finds it", () => {
    const unit = Unit.create(owner, footman, 0, 0);
    expect(unit.typeId).toEqual(footman);
    expect(Unit.fromHandle(unit.handle)).toBe(unit);
  });

  it("creates with BlzCreateUnitWithSkin when a skin is given", () => {
    const unit = Unit.create(owner, footman, 5, 6, 45, knightSkin);
    expect(stubCalls()).toContainCall(
      `BlzCreateUnitWithSkin(${ownerRef}, 1751543663, 5, 6, 45, ${String(knightSkin)})`,
    );
    expect(Unit.fromHandle(unit.handle)).toBe(unit);
  });

  it("throws naming the rawcode when CreateUnit returns nil, and still records the call", () => {
    const message = withNative(
      "CreateUnit",
      () => undefined,
      () =>
        raisedIn(() => {
          Unit.create(owner, footman, 30, 40, 180);
        }),
    );
    expect(message).toEqual("reforged-ts: failed to create Unit (hfoo)");
    expect(stubCalls()).toContainCall(
      `CreateUnit(${ownerRef}, 1751543663, 30, 40, 180)`,
    );
  });

  it("throws naming the rawcode when BlzCreateUnitWithSkin returns nil", () => {
    const message = withNative(
      "BlzCreateUnitWithSkin",
      () => undefined,
      () =>
        raisedIn(() => {
          Unit.create(owner, footman, 30, 40, 180, knightSkin);
        }),
    );
    expect(message).toEqual("reforged-ts: failed to create Unit (hfoo)");
  });
});

describe("Unit.getOwner", () => {
  it("is the owner the unit was created with", () => {
    const unit = Unit.create(owner, footman, 0, 0);
    const found: MapPlayer = unit.getOwner();
    expect(found).toBe(owner);
    expect(found.handle).toBe(owner.handle);
  });

  it("throws when GetOwningPlayer returns nil, never returning undefined", () => {
    const unit = Unit.create(owner, footman, 0, 0);
    const message = withNative(
      "GetOwningPlayer",
      () => undefined,
      () =>
        raisedIn(() => {
          unit.getOwner();
        }),
    );
    expect(message).toEqual("reforged-ts: failed to create MapPlayer");
  });
});

describe("Unit event and enumeration lookups", () => {
  it("are undefined when their Native returns nil", () => {
    expect(
      withNative(
        "GetTriggerUnit",
        () => undefined,
        () => Unit.fromEvent(),
      ),
    ).toBeUndefined();
    expect(
      withNative(
        "GetEnumUnit",
        () => undefined,
        () => Unit.fromEnum(),
      ),
    ).toBeUndefined();
    expect(
      withNative(
        "GetFilterUnit",
        () => undefined,
        () => Unit.fromFilter(),
      ),
    ).toBeUndefined();
  });

  it("are the Wrapper of the unit their Native returns", () => {
    const unit = Unit.create(owner, footman, 0, 0);
    expect(
      withNative(
        "GetTriggerUnit",
        () => unit.handle,
        () => Unit.fromEvent(),
      ),
    ).toBe(unit);
    expect(
      withNative(
        "GetEnumUnit",
        () => unit.handle,
        () => Unit.fromEnum(),
      ),
    ).toBe(unit);
    expect(
      withNative(
        "GetFilterUnit",
        () => unit.handle,
        () => Unit.fromFilter(),
      ),
    ).toBe(unit);
  });
});

describe("Unit.getPoint", () => {
  it("wraps the new location GetUnitLoc returns, a new one per call", () => {
    const unit = Unit.create(owner, footman, 7, 8);
    const point: Point = unit.getPoint();
    expect(stubCalls()).toContainCall(
      `GetUnitLoc(${handleRef("unit", unit.handle)})`,
    );
    expect(Point.fromHandle(point.handle)).toBe(point);
    expect(unit.getPoint() === point).toEqual(false);
  });

  it("throws when GetUnitLoc returns nil", () => {
    const unit = Unit.create(owner, footman, 0, 0);
    const message = withNative(
      "GetUnitLoc",
      () => undefined,
      () =>
        raisedIn(() => {
          unit.getPoint();
        }),
    );
    expect(message).toEqual("reforged-ts: failed to create Point");
  });
});

describe("Unit rally lookups", () => {
  it("are undefined for a unit with no rally", () => {
    const unit = Unit.create(owner, footman, 0, 0);
    expect(unit.rallyPoint).toBeUndefined();
    expect(unit.rallyUnit).toBeUndefined();
    expect(unit.rallyDestructable).toBeUndefined();
  });

  it("rallyPoint wraps the location GetUnitRallyPoint returns", () => {
    const unit = Unit.create(owner, footman, 0, 0);
    const location = Location(3, 4);
    const point = withNative(
      "GetUnitRallyPoint",
      () => location,
      () => unit.rallyPoint,
    );
    expect(point?.handle).toBe(location);
    expect(Point.fromHandle(location)).toBe(point);
  });

  it("rallyUnit is the Wrapper of the unit GetUnitRallyUnit returns", () => {
    const unit = Unit.create(owner, footman, 0, 0);
    const target = Unit.create(owner, footman, 9, 9);
    expect(
      withNative(
        "GetUnitRallyUnit",
        () => target.handle,
        () => unit.rallyUnit,
      ),
    ).toBe(target);
  });

  it("rallyDestructable is the Wrapper of the destructable GetUnitRallyDestructable returns", () => {
    const unit = Unit.create(owner, footman, 0, 0);
    const tree = Destructable.create({ typeId: FourCC("LTlt"), x: 0, y: 0 });
    expect(
      withNative(
        "GetUnitRallyDestructable",
        () => tree.handle,
        () => unit.rallyDestructable,
      ),
    ).toBe(tree);
  });
});

describe("Unit inventory", () => {
  it("addItemById wraps the new item UnitAddItemById returns", () => {
    const unit = Unit.create(owner, footman, 0, 0);
    const item: Item = unit.addItemById(ration);
    expect(stubCalls()).toContainCall(
      `UnitAddItemById(${handleRef("unit", unit.handle)}, ${String(ration)})`,
    );
    expect(Item.fromHandle(item.handle)).toBe(item);
  });

  it("addItemById throws naming the rawcode when UnitAddItemById returns nil", () => {
    const unit = Unit.create(owner, footman, 0, 0);
    const message = withNative(
      "UnitAddItemById",
      () => undefined,
      () =>
        raisedIn(() => {
          unit.addItemById(ration);
        }),
    );
    expect(message).toEqual("reforged-ts: failed to create Item (ratf)");
  });

  it("getItemInSlot is the item in the slot, undefined for an empty one", () => {
    const unit = Unit.create(owner, footman, 0, 0);
    const first = unit.addItemById(ration);
    const second = unit.addItemById(ration);
    expect(unit.getItemInSlot(0)).toBe(first);
    expect(unit.getItemInSlot(1)).toBe(second);
    expect(unit.getItemInSlot(2)).toBeUndefined();
  });

  it("removeItemFromSlot is the item it removed, undefined for an empty slot", () => {
    const unit = Unit.create(owner, footman, 0, 0);
    const item = unit.addItemById(ration);
    expect(unit.removeItemFromSlot(0)).toBe(item);
    expect(unit.getItemInSlot(0)).toBeUndefined();
    expect(unit.removeItemFromSlot(0)).toBeUndefined();
  });
});
