-- reforged-test baseline stubs: the shared machinery every stub file uses,
-- the globals the library reads when its modules load, and the Natives every
-- test can rely on (Player, GetPlayerId, GetHandleId, CreateTrigger).
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

-- The arguments of every recorded call, by Native name: one table.pack'd
-- list per call, oldest first. The call log renders a function as
-- <function>; this is where a test finds the very object a Native was given.
local argumentsByName = {}

-- Appends Name(arg, arg) to the call log. Stub files call this first thing.
function __stub_record(name, ...)
  local parts = {}
  for i = 1, select("#", ...) do
    parts[i] = __stub_format((select(i, ...)))
  end
  __stub_calls[#__stub_calls + 1] = name .. "(" .. table.concat(parts, ", ") .. ")"
  local calls = argumentsByName[name]
  if calls == nil then
    calls = {}
    argumentsByName[name] = calls
  end
  calls[#calls + 1] = table.pack(...)
end

-- The arguments of every recorded call of the Native `name`, oldest first:
-- a list per call, with `n` its argument count (nil arguments included).
-- Values are the ones the Native was given, so a test compares them by
-- identity. An empty list for a Native never called. Not a Native, so it
-- adds no call-log line.
function __stub_args(name)
  local calls = argumentsByName[name] or {}
  return table.move(calls, 1, #calls, 1, {})
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

-- The firing context: while a firing helper runs, the value each response
-- Native (GetTriggerUnit, GetExpiredTimer) answers with, keyed by the
-- Native's name. nil outside a firing, where every response Native answers
-- nil.
local context = nil

-- Defines the response Native `name`: it records its call and answers with
-- the firing context's value for its name, nil when the context has none.
function __stub_response(name)
  _G[name] = function()
    __stub_record(name)
    if context == nil then
      return nil
    end
    return context[name]
  end
end

-- Runs body with `firing` as the firing context and returns what it returned.
-- The previous context is put back afterwards, also when body throws, so a
-- firing inside a firing hands the outer one back when it ends.
function __stub_with_context(firing, body)
  local previous = context
  context = firing
  local ok, result = pcall(body)
  context = previous
  if not ok then
    error(result, 0)
  end
  return result
end

-- print writes to the capture, not to the terminal: one line per call, its
-- arguments converted by tostring and joined by a tab, as the standard print
-- joins them. It is the standard library's, not a Native, so it adds no
-- call-log line.
local printed = {}

function print(...)
  local parts = {}
  for i = 1, select("#", ...) do
    parts[i] = tostring((select(i, ...)))
  end
  printed[#printed + 1] = table.concat(parts, "\t")
end

-- The lines print wrote so far, oldest first. Not a Native, so it adds no
-- call-log line.
function __stub_printed()
  return table.move(printed, 1, #printed, 1, {})
end

-- Enters the globals Init stage as the editor's main does: calls the global
-- InitGlobals, after defining it as an empty function when nothing defined it
-- yet. The definition is a plain assignment, so a wrapper the code under test
-- installs on the first assignment of InitGlobals (the library's) sees it.
-- Not a Native, so it adds no call-log line.
function __stub_init_globals()
  if InitGlobals == nil then
    InitGlobals = function() end
  end
  InitGlobals()
end

-- Globals the library reads when its modules load. The editor's entry points
-- (config, main, InitGlobals, InitCustomTriggers, RunInitializationTriggers,
-- MarkGameStarted) stay nil: the library wraps the ones that exist when it
-- loads and captures the others on their first assignment, so a test defines
-- the ones it drives, in the load position it stands in for.
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

-- The baseline Natives every test can rely on. The library's globals stage
-- calls Player for every slot and CreateTrigger for the sync System once a
-- test runs InitGlobals; every Wrapper reads its ids with GetHandleId and
-- GetPlayerId. Nothing calls them when the library loads.

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
