-- reforged-test stubs for the players family. Player, GetPlayerId and
-- GetHandleId are in base.lua because the library calls them at module load.

-- The local player is the player in slot 0, the same handle Player(0)
-- returns.
function GetLocalPlayer()
  __stub_record("GetLocalPlayer")
  return __stub_player(0)
end

-- The slots the stubs hold as playing users: 0 and 1. Every other slot is
-- empty, with no controller. This is state the stubs hold, not a game rule;
-- the README names the two slots so a test can rely on them.
local playingUsers = { [0] = true, [1] = true }

function GetPlayerSlotState(whichPlayer)
  __stub_record("GetPlayerSlotState", whichPlayer)
  if playingUsers[whichPlayer.number] then
    return PLAYER_SLOT_STATE_PLAYING
  end
  return PLAYER_SLOT_STATE_EMPTY
end

function GetPlayerController(whichPlayer)
  __stub_record("GetPlayerController", whichPlayer)
  if playingUsers[whichPlayer.number] then
    return MAP_CONTROL_USER
  end
  return MAP_CONTROL_NONE
end
