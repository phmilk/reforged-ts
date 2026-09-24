/** @noSelfInFile */

// Widget on the Handle base, and the registry upgrade rule on the Widget
// family: event code that reached a Handle through `Widget.fromEvent()` and
// then asks for the `Unit` gets a real `Unit`, which becomes the one Wrapper
// for that Handle; asking through `Widget` for a Handle cached as a `Unit`,
// `Item` or `Destructable` gives that more specific object back.

import { describe, expect, it } from "reforged-test/lua";
import { Destructable, Item, MapPlayer, Unit, Widget } from "../src/index";
import { defined } from "./support/defined";
import { withNative } from "./support/native-override";

const footman = FourCC("hfoo");
const owner = defined(MapPlayer.fromIndex(0), "MapPlayer.fromIndex(0)");

describe("Widget.fromEvent", () => {
  it("is undefined when GetTriggerWidget returns nil", () => {
    expect(
      withNative(
        "GetTriggerWidget",
        () => undefined,
        () => Widget.fromEvent(),
      ),
    ).toBeUndefined();
  });

  it("wraps the triggering widget, the same object a lookup finds", () => {
    const handle = CreateItem(FourCC("ratf"), 1, 2);
    const widget = withNative(
      "GetTriggerWidget",
      () => handle,
      () => Widget.fromEvent(),
    );
    expect(widget?.handle).toBe(handle);
    expect(Widget.fromHandle(handle)).toBe(widget);
  });
});

describe("the registry upgrade from Widget to Unit", () => {
  it("gives a real Unit after Widget.fromEvent, canonical from then on", () => {
    const handle = CreateUnit(owner.handle, footman, 12, 34, 0);
    const widget = defined(
      withNative(
        "GetTriggerWidget",
        () => handle,
        () => Widget.fromEvent(),
      ),
      "Widget.fromEvent",
    );
    expect(widget instanceof Unit).toEqual(false);

    const unit = defined(Unit.fromHandle(handle), "Unit.fromHandle");
    expect(unit instanceof Unit).toEqual(true);
    expect(unit.typeId).toEqual(footman);
    expect(unit.getOwner()).toBe(owner);

    expect(Widget.fromHandle(handle)).toBe(unit);
    expect(Unit.fromHandle(handle)).toBe(unit);
    expect(widget === unit).toEqual(false);
  });

  it("leaves the earlier Widget object answering its own methods", () => {
    const handle = defined(
      CreateUnit(owner.handle, footman, 56, 78, 0),
      "CreateUnit",
    );
    const widget = defined(Widget.fromHandle(handle), "Widget.fromHandle");
    Unit.fromHandle(handle);
    expect(widget.x).toEqual(56);
    expect(widget.y).toEqual(78);
    expect(widget.handle).toBe(handle);
  });
});

describe("Widget lookups of a more specific Wrapper", () => {
  it("give back the cached Unit, Item or Destructable", () => {
    const unit = Unit.create(owner, footman, 0, 0);
    const item = Item.create(FourCC("ratf"), 0, 0);
    const tree = Destructable.create(FourCC("LTlt"), 0, 0);
    expect(Widget.fromHandle(unit.handle)).toBe(unit);
    expect(Widget.fromHandle(item.handle)).toBe(item);
    expect(Widget.fromHandle(tree.handle)).toBe(tree);
  });
});
