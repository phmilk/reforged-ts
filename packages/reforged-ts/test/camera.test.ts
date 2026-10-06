/** @noSelfInFile */

// CameraSetup on the Handle base, and the three camera accessors that
// allocate a location: `Camera.eyePoint`, `Camera.targetPoint` and
// `cameraSetup.destPoint` are creations, typed `Point`, and throw naming
// Point when the game returns nothing. `Camera` is a static namespace, not a
// Wrapper; its accessors reach the same creation code as the Wrappers. The
// 3.0.0 camera type and field control call their Natives with the value
// given and answer what the Natives answer. A pan calls its `WithZ` Native
// only when given a z-offset; the unit controllers take the Unit Wrapper and
// pass its Handle; the cinematic scene is camelCase like the other members.

import { describe, expect, it, stubCalls } from "reforged-test/lua";
import { Camera, CameraSetup, MapPlayer, Point, Unit } from "../src/index";
import { defined } from "./support/defined";
import { handleRef } from "./support/handle-ref";
import { withNative } from "./support/native-override";
import { raisedIn } from "./support/raised-in";

/**
 * The cinematic scene takes the speaker's portrait as a unit's Rawcode,
 * never another kind's or a plain `number`. Never called: `tsc` checks it.
 */
export function cinematicRawcodeKinds(count: number): void {
  const footmanType: Rawcode<"unit"> = FourCC("hfoo");
  const blizzard: Rawcode<"ability"> = FourCC("AHbz");
  const blue = PLAYER_COLOR_BLUE;
  Camera.setCinematicScene(footmanType, blue, "Footman", "Halt!", 5, 4);
  // @ts-expect-error: an ability's Rawcode is not a unit's.
  Camera.setCinematicScene(blizzard, blue, "Footman", "Halt!", 5, 4);
  // @ts-expect-error: a plain number is not a Rawcode.
  Camera.setCinematicScene(count, blue, "Footman", "Halt!", 5, 4);
}

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

/**
 * Runs `body` with a pan Native and its `WithZ` twin replaced, and returns
 * the name of each one it called, in order.
 */
function pansCalled(
  plain: "PanCameraTo" | "PanCameraToTimed",
  withZ: "PanCameraToWithZ" | "PanCameraToTimedWithZ",
  body: () => void,
): string[] {
  const called: string[] = [];
  withNative(
    plain,
    () => {
      called.push(plain);
    },
    () => {
      withNative(
        withZ,
        () => {
          called.push(withZ);
        },
        body,
      );
    },
  );
  return called;
}

describe("Camera.pan", () => {
  it("calls PanCameraTo when no z-offset is given", () => {
    const called = pansCalled("PanCameraTo", "PanCameraToWithZ", () => {
      Camera.pan(128, 256);
    });
    expect(called).toEqual(["PanCameraTo"]);
    expect(stubCalls()).toContainCall("PanCameraTo(128, 256)");
  });

  it("calls PanCameraToWithZ with the z-offset given", () => {
    const called = pansCalled("PanCameraTo", "PanCameraToWithZ", () => {
      Camera.pan(128, 256, 64);
    });
    expect(called).toEqual(["PanCameraToWithZ"]);
    expect(stubCalls()).toContainCall("PanCameraToWithZ(128, 256, 64)");
  });
});

describe("Camera.panTimed", () => {
  it("calls PanCameraToTimed when no z-offset is given", () => {
    const called = pansCalled(
      "PanCameraToTimed",
      "PanCameraToTimedWithZ",
      () => {
        Camera.panTimed(128, 256, 2);
      },
    );
    expect(called).toEqual(["PanCameraToTimed"]);
    expect(stubCalls()).toContainCall("PanCameraToTimed(128, 256, 2)");
  });

  it("calls PanCameraToTimedWithZ with the z-offset before the duration", () => {
    const called = pansCalled(
      "PanCameraToTimed",
      "PanCameraToTimedWithZ",
      () => {
        Camera.panTimed(128, 256, 2, 64);
      },
    );
    expect(called).toEqual(["PanCameraToTimedWithZ"]);
    expect(stubCalls()).toContainCall("PanCameraToTimedWithZ(128, 256, 64, 2)");
  });
});

describe("Camera unit controllers", () => {
  const owner = defined(MapPlayer.fromIndex(0), "MapPlayer.fromIndex(0)");
  const unit = Unit.create(owner, FourCC("hfoo"), 0, 0);
  const unitRef = handleRef("unit", unit.handle);

  it("setOrientController passes the Unit's Handle to SetCameraOrientController", () => {
    withNative(
      "SetCameraOrientController",
      () => undefined,
      () => {
        Camera.setOrientController(unit, 16, 32);
      },
    );
    expect(stubCalls()).toContainCall(
      `SetCameraOrientController(${unitRef}, 16, 32)`,
    );
  });

  it("setTargetController passes the Unit's Handle to SetCameraTargetController", () => {
    withNative(
      "SetCameraTargetController",
      () => undefined,
      () => {
        Camera.setTargetController(unit, 16, 32, true);
      },
    );
    expect(stubCalls()).toContainCall(
      `SetCameraTargetController(${unitRef}, 16, 32, true)`,
    );
  });
});

describe("Camera.setCinematicScene", () => {
  it("hands its arguments to SetCinematicScene", () => {
    withNative(
      "SetCinematicScene",
      () => undefined,
      () => {
        Camera.setCinematicScene(
          FourCC("Hpal"),
          PLAYER_COLOR_BLUE,
          "Uther",
          "Hold the line.",
          5,
          3,
        );
      },
    );
    expect(stubCalls()).toContainCall(
      `SetCinematicScene(${tostring(FourCC("Hpal"))}, PLAYER_COLOR_BLUE, "Uther", "Hold the line.", 5, 3)`,
    );
  });
});
