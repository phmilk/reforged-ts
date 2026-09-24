-- reforged-test baseline stubs: the shared machinery every stub file uses,
-- and the load-time globals the library reads before its first require.
-- Plain Lua 5.3 on the standard libraries only; see the package README for
-- the stub authoring rules. The glue executes this file first, then the other
-- shipped stub files, then the extra stub files of the `stubs` option.

-- The call log: every stub appends one readable line per call.
__stub_calls = {}

-- Handles are tables carrying a kind and a sequential id from a fixed base,
-- so ids are deterministic within a Lua state (the first one is 1048577).
local nextHandleId = 0x100000

-- Renders one argument for the call log: handles as kind#id, constants by
-- their name, strings quoted.
function __stub_format(value)
  local kind = type(value)
  if kind == "table" and value.__handleId ~= nil then
    return tostring(value.__kind) .. "#" .. tostring(value.__handleId)
  elseif kind == "table" and value.__name ~= nil then
    return tostring(value.__name)
  elseif kind == "string" then
    return string.format("%q", value)
  elseif kind == "function" then
    return "<function>"
  elseif kind == "table" then
    return "<table>"
  end
  return tostring(value)
end

-- Appends Name(arg, arg) to the call log. Stub files call this first thing.
function __stub_record(name, ...)
  local parts = {}
  for i = 1, select("#", ...) do
    parts[i] = __stub_format((select(i, ...)))
  end
  __stub_calls[#__stub_calls + 1] = name .. "(" .. table.concat(parts, ", ") .. ")"
end

-- A new handle of the given kind with the next id.
function __stub_new_handle(kind)
  nextHandleId = nextHandleId + 1
  return { __kind = kind, __handleId = nextHandleId }
end

-- A constant of the game (PLAYER_SLOT_STATE_PLAYING, MAP_CONTROL_USER): an
-- opaque value a test compares by identity. It takes no handle id, so the
-- sequence above stays the same whether or not a constant is defined.
function __stub_constant(kind, name)
  return { __kind = kind, __name = name }
end

-- Globals read at module load time. `main` and `config` stay nil: the
-- library's Hook code reads them before the game would define them.
bj_MAX_PLAYER_SLOTS = 28
bj_MAX_PLAYERS = 24
bj_UNIT_FACING = 270.0

-- The slot-state and controller constants, in the order the Typings declare
-- them. The players family answers GetPlayerSlotState and
-- GetPlayerController with them.
PLAYER_SLOT_STATE_EMPTY = __stub_constant("playerslotstate", "PLAYER_SLOT_STATE_EMPTY")
PLAYER_SLOT_STATE_PLAYING = __stub_constant("playerslotstate", "PLAYER_SLOT_STATE_PLAYING")
PLAYER_SLOT_STATE_LEFT = __stub_constant("playerslotstate", "PLAYER_SLOT_STATE_LEFT")

MAP_CONTROL_USER = __stub_constant("mapcontrol", "MAP_CONTROL_USER")
MAP_CONTROL_COMPUTER = __stub_constant("mapcontrol", "MAP_CONTROL_COMPUTER")
MAP_CONTROL_RESCUABLE = __stub_constant("mapcontrol", "MAP_CONTROL_RESCUABLE")
MAP_CONTROL_NEUTRAL = __stub_constant("mapcontrol", "MAP_CONTROL_NEUTRAL")
MAP_CONTROL_CREEP = __stub_constant("mapcontrol", "MAP_CONTROL_CREEP")
MAP_CONTROL_NONE = __stub_constant("mapcontrol", "MAP_CONTROL_NONE")

-- FourCC is the game's Lua helper, not a Native: a four-character id to its
-- integer, as the game computes it.
function FourCC(id)
  __stub_record("FourCC", id)
  return (string.unpack(">I4", id))
end

-- One player handle per slot, created on first use and returned after.
local players = {}

-- The handle of a slot, without a call-log line: for stubs that return a
-- player (GetLocalPlayer) and must return the same handle as Player.
function __stub_player(number)
  local player = players[number]
  if player == nil then
    player = __stub_new_handle("player")
    player.number = number
    players[number] = player
  end
  return player
end

function Player(number)
  __stub_record("Player", number)
  return __stub_player(number)
end

function GetPlayerId(whichPlayer)
  __stub_record("GetPlayerId", whichPlayer)
  return whichPlayer.number
end

function GetHandleId(h)
  __stub_record("GetHandleId", h)
  return h.__handleId
end

function CreateTrigger()
  __stub_record("CreateTrigger")
  return __stub_new_handle("trigger")
end
