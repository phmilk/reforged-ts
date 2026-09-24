/** @noSelfInFile */

// CameraSetup on the Handle base, and the three camera accessors that
// allocate a location: `Camera.eyePoint`, `Camera.targetPoint` and
// `cameraSetup.destPoint` are creations, typed `Point`, and throw naming
// Point when the game returns nothing. `Camera` is a static namespace, not a
// Wrapper; its accessors reach the same creation code as the Wrappers.

import { describe, expect, it, stubCalls } from "reforged-test/lua";
import { Camera, CameraSetup, Point } from "../src/index";
import { handleRef } from "./support/handle-ref";
import { withNative } from "./support/native-override";
import { raisedIn } from "./support/raised-in";

describe("CameraSetup.create", () => {
  it("wraps the handle CreateCameraSetup returns, and a lookup finds it", () => {
    const setup = CameraSetup.create();
    expect(stubCalls()).toContainCall("CreateCameraSetup()");
    expect(CameraSetup.fromHandle(setup.handle)).toBe(setup);
  });

  it("throws when CreateCameraSetup returns nil", () => {
    const message = withNative(
      "CreateCameraSetup",
      () => undefined,
      () =>
        raisedIn(() => {
          CameraSetup.create();
        }),
    );
    expect(message).toEqual("reforged-ts: failed to create CameraSetup");
  });
});

describe("CameraSetup.fromHandle", () => {
  it("is undefined for an undefined Handle", () => {
    expect(CameraSetup.fromHandle(undefined)).toBeUndefined();
  });

  it("gives the same CameraSetup for two lookups of one Handle", () => {
    const handle = CreateCameraSetup();
    const setup = CameraSetup.fromHandle(handle);
    expect(setup?.handle).toBe(handle);
    expect(CameraSetup.fromHandle(handle)).toBe(setup);
  });
});

describe("cameraSetup.destPoint", () => {
  const setup = CameraSetup.create();

  it("wraps the location CameraSetupGetDestPositionLoc returns", () => {
    const point = setup.destPoint;
    expect(stubCalls()).toContainCall(
      `CameraSetupGetDestPositionLoc(${handleRef("camerasetup", setup.handle)})`,
    );
    expect(Point.fromHandle(point.handle)).toBe(point);
  });

  it("throws naming Point when CameraSetupGetDestPositionLoc returns nil", () => {
    let point: Point | undefined;
    const message = withNative(
      "CameraSetupGetDestPositionLoc",
      () => undefined,
      () =>
        raisedIn(() => {
          point = setup.destPoint;
        }),
    );
    expect(message).toEqual("reforged-ts: failed to create Point");
    expect(point).toBeUndefined();
  });
});

describe("Camera.eyePoint", () => {
  it("wraps the location GetCameraEyePositionLoc returns", () => {
    const point = Camera.eyePoint;
    expect(stubCalls()).toContainCall("GetCameraEyePositionLoc()");
    expect(Point.fromHandle(point.handle)).toBe(point);
  });

  it("throws naming Point when GetCameraEyePositionLoc returns nil", () => {
    let point: Point | undefined;
    const message = withNative(
      "GetCameraEyePositionLoc",
      () => undefined,
      () =>
        raisedIn(() => {
          point = Camera.eyePoint;
        }),
    );
    expect(message).toEqual("reforged-ts: failed to create Point");
    expect(point).toBeUndefined();
  });
});

describe("Camera.targetPoint", () => {
  it("wraps the location GetCameraTargetPositionLoc returns", () => {
    const point = Camera.targetPoint;
    expect(stubCalls()).toContainCall("GetCameraTargetPositionLoc()");
    expect(Point.fromHandle(point.handle)).toBe(point);
  });

  it("throws naming Point when GetCameraTargetPositionLoc returns nil", () => {
    let point: Point | undefined;
    const message = withNative(
      "GetCameraTargetPositionLoc",
      () => undefined,
      () =>
        raisedIn(() => {
          point = Camera.targetPoint;
        }),
    );
    expect(message).toEqual("reforged-ts: failed to create Point");
    expect(point).toBeUndefined();
  });
});
