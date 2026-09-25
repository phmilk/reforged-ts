-- reforged-test stubs for the players family. Player, GetPlayerId and
-- GetHandleId are in base.lua, the baseline every test can rely on.

-- The local player is the player in slot 0, the same handle Player(0)
-- returns, until a test sets another slot.
local localSlot = 0

function GetLocalPlayer()
  __stub_record("GetLocalPlayer")
  return __stub_player(localSlot)
end

-- Makes the player in slot `number` the local player and returns the slot
-- that was local before: how a test runs code as another client. Not a
-- Native, so it adds no call-log line.
function __stub_set_local_player(number)
  local previous = localSlot
  localSlot = number
  return previous
end

-- The local player's handle, without a call-log line: for stubs that record
-- who called them (BlzSendSyncData).
function __stub_local_player()
  return __stub_player(localSlot)
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
