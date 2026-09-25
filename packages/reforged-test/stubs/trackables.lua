-- reforged-test stubs for the trackables family. The game has no Native that
-- destroys a trackable or reads one back, so the stubs keep nothing of it.

function CreateTrackable(trackableModelPath, x, y, facing)
  __stub_record("CreateTrackable", trackableModelPath, x, y, facing)
  return __stub_new_handle("trackable")
end

-- The hit or tracked trackable: the firing context's answer, nil outside a
-- firing.
__stub_response("GetTriggeringTrackable")
