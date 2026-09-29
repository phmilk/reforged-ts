/** @noSelfInFile */

// Region on the Handle base: creation throws, lookup returns undefined.

import { describe, expect, it, stubCalls } from "reforged-test/lua";
import { Point, Region } from "../src/index";
import { handleRef } from "./support/handle-ref";
import { describeNatives, nativeCase } from "./support/native-cases";
import { withNative } from "./support/native-override";
import { raisedIn } from "./support/raised-in";

describe("Region.create", () => {
  it("wraps the handle CreateRegion returns, and a lookup finds it", () => {
    const region = Region.create();
    expect(stubCalls()).toContainCall("CreateRegion()");
    expect(Region.fromHandle(region.handle)).toBe(region);
  });

  it("throws when CreateRegion returns nil", () => {
    const message = withNative(
      "CreateRegion",
      () => undefined,
      () =>
        raisedIn(() => {
          Region.create();
        }),
    );
    expect(message).toEqual("reforged-ts: failed to create Region");
  });
});

describe("Region.fromEvent", () => {
  it("is undefined when GetTriggeringRegion returns nil", () => {
    const region = withNative(
      "GetTriggeringRegion",
      () => undefined,
      () => Region.fromEvent(),
    );
    expect(region).toBeUndefined();
  });

  it("wraps the triggering region, the same object a lookup finds", () => {
    const handle = CreateRegion();
    const region = withNative(
      "GetTriggeringRegion",
      () => handle,
      () => Region.fromEvent(),
    );
    expect(region?.handle).toBe(handle);
    expect(Region.fromHandle(handle)).toBe(region);
  });
});

// containsPoint returns IsLocationInRegion's answer (#259).
{
  const region = Region.create();
  const regionRef = handleRef("region", region.handle);
  const inside = Point.create(0, 0);
  const outside = Point.create(512, 512);

  describeNatives("Region.containsPoint", [
    nativeCase({
      native: "IsLocationInRegion",
      answer: () => true,
      member: () => region.containsPoint(inside),
      line: `IsLocationInRegion(${regionRef}, ${handleRef("location", inside.handle)})`,
      returns: true,
    }),
    nativeCase({
      native: "IsLocationInRegion",
      answer: () => false,
      member: () => region.containsPoint(outside),
      line: `IsLocationInRegion(${regionRef}, ${handleRef("location", outside.handle)})`,
      returns: false,
    }),
  ]);
}
