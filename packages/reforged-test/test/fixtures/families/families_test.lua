-- The shipped stub families on a fresh state: one call-log line per Native
-- call, handles from the shared sequence, stored values returned, callbacks
-- run only by the firing helpers.
local runner = require("lua_modules.reforged-test.lua.index")
local describe, it, expect = runner.describe, runner.it, runner.expect

local function since(mark)
  local calls = runner.stubCalls()
  local lines = {}
  for i = mark + 1, #calls do
    lines[#lines + 1] = calls[i]
  end
  return lines
end

describe("players", function()
  it("returns the slot 0 player as the local player", function()
    local mark = #runner.stubCalls()
    local player = GetLocalPlayer()
    expect(player).toBe(Player(0))
    expect(since(mark)).toEqual({ "GetLocalPlayer()", "Player(0)" })
  end)
end)

describe("units", function()
  it("records CreateUnit and returns what it was given", function()
    local owner = Player(1)
    local mark = #runner.stubCalls()
    local unit = CreateUnit(owner, 1751543663, 10, 20.5, 270.0)
    expect(GetOwningPlayer(unit)).toBe(owner)
    expect(GetUnitTypeId(unit)).toEqual(1751543663)
    expect(since(mark)).toEqual({
      "CreateUnit(player#1048578, 1751543663, 10, 20.5, 270.0)",
      "GetOwningPlayer(unit#1048579)",
      "GetUnitTypeId(unit#1048579)",
    })
  end)
end)

describe("timers", function()
  it("stores the timeout and runs the handler only when fired", function()
    local timer = CreateTimer()
    expect(TimerGetTimeout(timer)).toEqual(0.0)
    local fired = 0
    TimerStart(timer, 1.5, true, function() fired = fired + 1 end)
    expect(TimerGetTimeout(timer)).toEqual(1.5)
    expect(fired).toEqual(0)
    __stub_fire_timer(timer)
    __stub_fire_timer(timer)
    expect(fired).toEqual(2)
    DestroyTimer(timer)
    expect(runner.stubCalls()).toContainCall("TimerStart(timer#1048580, 1.5, true, <function>)")
    expect(runner.stubCalls()).toContainCall("DestroyTimer(timer#1048580)")
  end)
  it("refuses to fire a timer that was never started", function()
    local timer = CreateTimer()
    expect(function() __stub_fire_timer(timer) end).toThrow("timer#1048581 was never started")
  end)
end)

describe("triggers", function()
  it("runs the actions in the order they were added when fired", function()
    local trigger = CreateTrigger()
    local order = {}
    __stub_fire_trigger(trigger)
    local action = TriggerAddAction(trigger, function() order[#order + 1] = "first" end)
    TriggerAddAction(trigger, function() order[#order + 1] = "second" end)
    expect(order).toEqual({})
    __stub_fire_trigger(trigger)
    expect(order).toEqual({ "first", "second" })
    expect(GetHandleId(action)).toEqual(1048583)
    expect(runner.stubCalls()).toContainCall("TriggerAddAction(trigger#1048582, <function>)")
  end)
end)

-- Handle ids run through the file in order, so these later additions keep
-- the ids asserted above in place.
describe("players", function()
  it("reports slots 0 and 1 as playing users and slot 2 as empty", function()
    local mark = #runner.stubCalls()
    expect(GetPlayerSlotState(Player(0))).toBe(PLAYER_SLOT_STATE_PLAYING)
    expect(GetPlayerController(Player(0))).toBe(MAP_CONTROL_USER)
    expect(GetPlayerSlotState(Player(1))).toBe(PLAYER_SLOT_STATE_PLAYING)
    expect(GetPlayerController(Player(1))).toBe(MAP_CONTROL_USER)
    expect(GetPlayerSlotState(Player(2))).toBe(PLAYER_SLOT_STATE_EMPTY)
    expect(GetPlayerController(Player(2))).toBe(MAP_CONTROL_NONE)
    expect(since(mark)).toEqual({
      "Player(0)",
      "GetPlayerSlotState(player#1048577)",
      "Player(0)",
      "GetPlayerController(player#1048577)",
      "Player(1)",
      "GetPlayerSlotState(player#1048578)",
      "Player(1)",
      "GetPlayerController(player#1048578)",
      "Player(2)",
      "GetPlayerSlotState(player#1048585)",
      "Player(2)",
      "GetPlayerController(player#1048585)",
    })
  end)
end)

describe("triggers", function()
  it("records a sync event registration with its four arguments", function()
    local trigger = CreateTrigger()
    local mark = #runner.stubCalls()
    local event = BlzTriggerRegisterPlayerSyncEvent(trigger, Player(1), "T", false)
    expect(GetHandleId(event)).toEqual(1048587)
    expect(since(mark)).toEqual({
      "Player(1)",
      'BlzTriggerRegisterPlayerSyncEvent(trigger#1048586, player#1048578, "T", false)',
      "GetHandleId(event#1048587)",
    })
    expect(trigger.actions).toBeUndefined()
  end)
end)
