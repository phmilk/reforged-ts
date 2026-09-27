/** @noSelfInFile */

// Rectangle on the Handle base: `create`, `fromPoint` and `getWorldBounds`
// all allocate a rect, so all three follow the creation rule. The camera
// blocker members pass the rect to their 3.0.0 Natives.

import { describe, expect, it, stubCalls } from "reforged-test/lua";
import { Point, Rectangle } from "../src/index";
import { handleRef } from "./support/handle-ref";
import { describeNatives, nativeCase } from "./support/native-cases";
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

describe("Rectangle camera blocker", () => {
  const rectangle = Rectangle.create(-64, -32, 64, 32);
  const rectRef = handleRef("rect", rectangle.handle);

  it("addCameraBlocker makes the rect a blocker through AddCameraBlocker", () => {
    withNative(
      "AddCameraBlocker",
      () => undefined,
      () => {
        rectangle.addCameraBlocker();
      },
    );
    expect(stubCalls()).toContainCall(`AddCameraBlocker(${rectRef})`);
  });

  it("enableCameraBlocker passes the flag to EnableCameraBlocker", () => {
    withNative(
      "EnableCameraBlocker",
      () => undefined,
      () => {
        rectangle.enableCameraBlocker(false);
      },
    );
    expect(stubCalls()).toContainCall(`EnableCameraBlocker(${rectRef}, false)`);
  });
});

{
  const rectangle = Rectangle.create(-64, -32, 64, 32);
  const ref = handleRef("rect", rectangle.handle);
  const lamp = FourCC("LOtr");

  describeNatives("Rectangle doodad members", [
    nativeCase({
      native: "SetDoodadAnimationRect",
      answer: () => undefined,
      member: () => {
        rectangle.setDoodadAnimation(lamp, "death", true);
      },
      line: `SetDoodadAnimationRect(${ref}, ${tostring(lamp)}, "death", true)`,
    }),
    nativeCase({
      native: "SetDoodadColorRect",
      answer: () => undefined,
      member: () => {
        rectangle.setDoodadColor(lamp, PLAYER_COLOR_RED);
      },
      line: `SetDoodadColorRect(${ref}, ${tostring(lamp)}, PLAYER_COLOR_RED)`,
    }),
  ]);
}
