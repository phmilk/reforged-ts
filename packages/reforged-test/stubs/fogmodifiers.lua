-- reforged-test stubs for the fog modifiers family. Every creation call
-- returns a new fog modifier handle, as the game allocates one per call.

-- The game builds the FOG_OF_WAR_* constants with this at map start; the
-- harness runs no common.j, so a test builds the fog state it passes.
function ConvertFogState(i)
  __stub_record("ConvertFogState", i)
  local state = __stub_new_handle("fogstate")
  state.value = i
  return state
end

function CreateFogModifierRadius(forWhichPlayer, whichState, centerx, centery, radius, useSharedVision, afterUnits)
  __stub_record("CreateFogModifierRadius", forWhichPlayer, whichState, centerx, centery, radius, useSharedVision, afterUnits)
  return __stub_new_handle("fogmodifier")
end

function CreateFogModifierRect(forWhichPlayer, whichState, where, useSharedVision, afterUnits)
  __stub_record("CreateFogModifierRect", forWhichPlayer, whichState, where, useSharedVision, afterUnits)
  return __stub_new_handle("fogmodifier")
end
