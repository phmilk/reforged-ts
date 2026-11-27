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

-- The slots whose player left the game (__stub_leave_player).
local leftSlots = {}

-- The slot state of a player, without a call-log line: for the Game actions
-- of reforged-test/map, which act for a playing player only.
function __stub_slot_state(whichPlayer)
  if leftSlots[whichPlayer.number] then
    return PLAYER_SLOT_STATE_LEFT
  end
  if playingUsers[whichPlayer.number] then
    return PLAYER_SLOT_STATE_PLAYING
  end
  return PLAYER_SLOT_STATE_EMPTY
end

function GetPlayerSlotState(whichPlayer)
  __stub_record("GetPlayerSlotState", whichPlayer)
  return __stub_slot_state(whichPlayer)
end

-- The player leaves the game: its slot reads PLAYER_SLOT_STATE_LEFT from
-- now on, then EVENT_PLAYER_LEAVE is dispatched to the triggers registered
-- for that player (__stub_dispatch, triggers.lua), GetTriggerPlayer
-- answering it, the slot already left in every handler. Nothing derived is
-- written: its controller, its units and its selection stay, and no defeat
-- or victory fires. It checks nothing, a player who already left included.
-- No Probe run measured a player leaving, which takes a second client. Not
-- a Native, so it adds no call-log line.
function __stub_leave_player(whichPlayer)
  leftSlots[whichPlayer.number] = true
  __stub_dispatch(EVENT_PLAYER_LEAVE, whichPlayer, { GetTriggerPlayer = whichPlayer })
end

function GetPlayerController(whichPlayer)
  __stub_record("GetPlayerController", whichPlayer)
  if playingUsers[whichPlayer.number] then
    return MAP_CONTROL_USER
  end
  return MAP_CONTROL_NONE
end

-- The player colours and race preferences, in the order the Typings declare
-- them: opaque values a test compares by identity, rendered by name.
__stub_constants("playercolor", {
  "PLAYER_COLOR_RED", "PLAYER_COLOR_BLUE", "PLAYER_COLOR_CYAN", "PLAYER_COLOR_PURPLE",
  "PLAYER_COLOR_YELLOW", "PLAYER_COLOR_ORANGE", "PLAYER_COLOR_GREEN", "PLAYER_COLOR_PINK",
  "PLAYER_COLOR_LIGHT_GRAY", "PLAYER_COLOR_LIGHT_BLUE", "PLAYER_COLOR_AQUA", "PLAYER_COLOR_BROWN",
  "PLAYER_COLOR_MAROON", "PLAYER_COLOR_NAVY", "PLAYER_COLOR_TURQUOISE", "PLAYER_COLOR_VIOLET",
  "PLAYER_COLOR_WHEAT", "PLAYER_COLOR_PEACH", "PLAYER_COLOR_MINT", "PLAYER_COLOR_LAVENDER",
  "PLAYER_COLOR_COAL", "PLAYER_COLOR_SNOW", "PLAYER_COLOR_EMERALD", "PLAYER_COLOR_PEANUT",
  "PLAYER_COLOR_BLACK",
})

__stub_constants("racepreference", {
  "RACE_PREF_HUMAN", "RACE_PREF_ORC", "RACE_PREF_NIGHTELF", "RACE_PREF_UNDEAD", "RACE_PREF_DEMON",
  "RACE_PREF_RANDOM", "RACE_PREF_USER_SELECTABLE", "RACE_PREF_FORSAKEN",
})
