/** @noSelfInFile */

// CameraSetup on the Handle base, and the three camera accessors that
// allocate a location: `Camera.eyePoint`, `Camera.targetPoint` and
// `cameraSetup.destPoint` are creations, typed `Point`, and throw naming
// Point when the game returns nothing. `Camera` is a static namespace, not a
// Wrapper; its accessors reach the same creation code as the Wrappers. The
// 3.0.0 camera type and field control call their Natives with the value
// given and answer what the Natives answer.

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

describe("Camera.type", () => {
  it("is what BlzCameraGetCameraType answers", () => {
    const type = withNative(
      "BlzCameraGetCameraType",
      () => 2,
      () => Camera.type,
    );
    expect(type).toBe(2);
    expect(stubCalls()).toContainCall("BlzCameraGetCameraType()");
  });

  it("is set through BlzCameraSetCameraType", () => {
    withNative(
      "BlzCameraSetCameraType",
      () => undefined,
      () => {
        Camera.type = 1;
      },
    );
    expect(stubCalls()).toContainCall("BlzCameraSetCameraType(1)");
  });
});

describe("Camera field control", () => {
  it("setFieldControlledByInput hands the field to SetCameraFieldControlledByInput", () => {
    withNative(
      "SetCameraFieldControlledByInput",
      () => undefined,
      () => {
        Camera.setFieldControlledByInput(CAMERA_FIELD_ROTATION, false);
      },
    );
    expect(stubCalls()).toContainCall(
      "SetCameraFieldControlledByInput(CAMERA_FIELD_ROTATION, false)",
    );
  });

  it("isFieldControlledByInput is what GetCameraFieldControlledByInput answers", () => {
    const controlled = withNative(
      "GetCameraFieldControlledByInput",
      () => true,
      () => Camera.isFieldControlledByInput(CAMERA_FIELD_ZOFFSET),
    );
    expect(controlled).toBe(true);
    expect(stubCalls()).toContainCall(
      "GetCameraFieldControlledByInput(CAMERA_FIELD_ZOFFSET)",
    );
  });

  it("passes a 3.0.0 field through the existing field members", () => {
    const value = withNative(
      "GetCameraField",
      () => 512,
      () => Camera.getField(CAMERA_FIELD_ZABSOLUTE),
    );
    expect(value).toBe(512);
    expect(stubCalls()).toContainCall("GetCameraField(CAMERA_FIELD_ZABSOLUTE)");
  });
});

describe("cameraSetup.type", () => {
  const setup = CameraSetup.create();
  const setupRef = handleRef("camerasetup", setup.handle);

  it("is what BlzCameraSetupGetCameraType answers", () => {
    const type = withNative(
      "BlzCameraSetupGetCameraType",
      () => 3,
      () => setup.type,
    );
    expect(type).toBe(3);
    expect(stubCalls()).toContainCall(
      `BlzCameraSetupGetCameraType(${setupRef})`,
    );
  });

  it("is set through BlzCameraSetupSetCameraType", () => {
    withNative(
      "BlzCameraSetupSetCameraType",
      () => undefined,
      () => {
        setup.type = 1;
      },
    );
    expect(stubCalls()).toContainCall(
      `BlzCameraSetupSetCameraType(${setupRef}, 1)`,
    );
  });
});
