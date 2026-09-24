/** @noSelfInFile */

// Point on the Handle base: creation throws.

import { describe, expect, it, stubCalls } from "reforged-test/lua";
import { Point } from "../src/index";
import { withNative } from "./support/native-override";
import { raisedIn } from "./support/raised-in";

describe("Point.create", () => {
  it("wraps the handle Location returns, and a lookup finds it", () => {
    const point = Point.create(16, -32);
    expect(stubCalls()).toContainCall("Location(16, -32)");
    expect(Point.fromHandle(point.handle)).toBe(point);
  });

  it("throws when Location returns nil", () => {
    const message = withNative(
      "Location",
      () => undefined,
      () =>
        raisedIn(() => {
          Point.create(16, -32);
        }),
    );
    expect(message).toEqual("reforged-ts: failed to create Point");
  });
});
