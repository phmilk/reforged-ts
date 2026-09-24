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
