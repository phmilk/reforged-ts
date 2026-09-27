-- reforged-test stubs for the cameras family. Each of the position Natives
-- returns a new location handle per call, as the game allocates one.

function CreateCameraSetup()
  __stub_record("CreateCameraSetup")
  return __stub_new_handle("camerasetup")
end

function CameraSetupGetDestPositionLoc(whichSetup)
  __stub_record("CameraSetupGetDestPositionLoc", whichSetup)
  return __stub_new_handle("location")
end

function GetCameraEyePositionLoc()
  __stub_record("GetCameraEyePositionLoc")
  return __stub_new_handle("location")
end

function GetCameraTargetPositionLoc()
  __stub_record("GetCameraTargetPositionLoc")
  return __stub_new_handle("location")
end

-- The camera fields, in the order the Typings declare them: opaque values a
-- test compares by identity, rendered by name.
__stub_constants("camerafield", {
  "CAMERA_FIELD_TARGET_DISTANCE", "CAMERA_FIELD_FARZ", "CAMERA_FIELD_ANGLE_OF_ATTACK",
  "CAMERA_FIELD_FIELD_OF_VIEW", "CAMERA_FIELD_ROLL", "CAMERA_FIELD_ROTATION", "CAMERA_FIELD_ZOFFSET",
  "CAMERA_FIELD_NEARZ", "CAMERA_FIELD_LOCAL_PITCH", "CAMERA_FIELD_LOCAL_YAW", "CAMERA_FIELD_LOCAL_ROLL",
  "CAMERA_FIELD_DEPTH_OF_FIELD_DISTANCE", "CAMERA_FIELD_DEPTH_OF_FIELD_SCALE", "CAMERA_FIELD_ZABSOLUTE",
})
