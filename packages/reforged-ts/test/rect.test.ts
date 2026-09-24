/** @noSelfInFile */

// Rectangle on the Handle base: `create`, `fromPoint` and `getWorldBounds`
// all allocate a rect, so all three follow the creation rule.

import { describe, expect, it, stubCalls } from "reforged-test/lua";
import { Point, Rectangle } from "../src/index";
import { handleRef } from "./support/handle-ref";
import { withNative } from "./support/native-override";
import { raisedIn } from "./support/raised-in";

describe("Rectangle.create", () => {
  it("wraps the handle Rect returns, and a lookup finds it", () => {
    const rectangle = Rectangle.create(-64, -32, 64, 32);
    expect(stubCalls()).toContainCall("Rect(-64, -32, 64, 32)");
    expect(Rectangle.fromHandle(rectangle.handle)).toBe(rectangle);
  });

  it("throws when Rect returns nil", () => {
    const message = withNative(
      "Rect",
      () => undefined,
      () =>
        raisedIn(() => {
          Rectangle.create(-64, -32, 64, 32);
        }),
    );
    expect(message).toEqual("reforged-ts: failed to create Rectangle");
  });
});

describe("Rectangle.fromPoint", () => {
  const min = Point.create(0, 0);
  const max = Point.create(128, 256);

  it("wraps the handle RectFromLoc returns, and a lookup finds it", () => {
    const rectangle = Rectangle.fromPoint(min, max);
    expect(stubCalls()).toContainCall(
      `RectFromLoc(${handleRef("location", min.handle)}, ${handleRef("location", max.handle)})`,
    );
    expect(Rectangle.fromHandle(rectangle.handle)).toBe(rectangle);
  });

  it("throws when RectFromLoc returns nil", () => {
    const message = withNative(
      "RectFromLoc",
      () => undefined,
      () =>
        raisedIn(() => {
          Rectangle.fromPoint(min, max);
        }),
    );
    expect(message).toEqual("reforged-ts: failed to create Rectangle");
  });
});

describe("Rectangle.getWorldBounds", () => {
  it("wraps the handle GetWorldBounds returns, and a lookup finds it", () => {
    const bounds = Rectangle.getWorldBounds();
    expect(stubCalls()).toContainCall("GetWorldBounds()");
    expect(Rectangle.fromHandle(bounds.handle)).toBe(bounds);
  });

  it("throws when GetWorldBounds returns nil", () => {
    const message = withNative(
      "GetWorldBounds",
      () => undefined,
      () =>
        raisedIn(() => {
          Rectangle.getWorldBounds();
        }),
    );
    expect(message).toEqual("reforged-ts: failed to create Rectangle");
  });
});
