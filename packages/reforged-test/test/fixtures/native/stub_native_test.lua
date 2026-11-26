-- Hand-written stand-in for a compiled stub-native.test.ts on
-- reforged-test/map: a Native answered by stubNative. The call log is read
-- through reforged-test/lua, which shares the file's Test game.
local map = require("lua_modules.reforged-test.map.index")
local runner = require("lua_modules.reforged-test.lua.index")
local describe, it, expect = map.describe, map.it, map.expect
local startGame, stubNative = map.startGame, map.stubNative

-- The calls recorded since `mark`, a length of the call log.
local function since(mark)
  local calls = runner.stubCalls()
  return table.move(calls, mark + 1, #calls, 1, {})
end

describe("a Native without a Stub", function()
  it("is not answered by the shipped units stub", function()
    local unit = CreateUnit(Player(0), FourCC("hfoo"), 0, 0, 0)
    expect(pcall(function() return GetUnitName(unit) end)).toEqual(false)
  end)

  it("answers what stubNative was given, with the Native's arguments", function()
    local seen
    stubNative("GetUnitName", function(unit)
      seen = unit
      return "Footman"
    end)
    local unit = CreateUnit(Player(0), FourCC("hfoo"), 0, 0, 0)
    expect(GetUnitName(unit)).toEqual("Footman")
    expect(seen).toBe(unit)
  end)

  it("records the call before the answer runs, as a Shipped stub does", function()
    local logged
    stubNative("GetUnitName", function()
      local calls = runner.stubCalls()
      logged = calls[#calls]
      return "Footman"
    end)
    local unit = CreateUnit(Player(0), FourCC("hfoo"), 0, 0, 0)
    local mark = #runner.stubCalls()
    GetUnitName(unit)
    expect(logged).toEqual("GetUnitName(unit#" .. GetHandleId(unit) .. ")")
    expect(since(mark)[1]).toEqual(logged)
  end)

  it("records every argument, a nil one included", function()
    stubNative("SetUnitColor")
    SetUnitColor(nil, PLAYER_COLOR_RED)
    expect(runner.stubCalls()).toContainCall("SetUnitColor(nil, PLAYER_COLOR_RED)")
  end)

  it("answers nothing without an answer, for a Native that returns nothing", function()
    stubNative("PauseGame")
    expect(PauseGame(true)).toBeUndefined()
    expect(runner.stubCalls()).toContainCall("PauseGame(true)")
  end)

  it("keeps the last answer given for a name", function()
    stubNative("GetUnitName", function() return "Footman" end)
    stubNative("GetUnitName", function() return "Knight" end)
    expect(GetUnitName(nil)).toEqual("Knight")
  end)

  it("answers before the game starts and after it", function()
    stubNative("GetUnitName", function() return "before" end)
    function InitGlobals() print(GetUnitName(nil)) end
    local game = startGame()
    stubNative("GetUnitName", function() return "after" end)
    print(GetUnitName(nil))
    expect(game.printed).toEqual({ "before", "after" })
  end)

  it("answers in this Test game only", function()
    expect(pcall(function() return GetUnitName(nil) end)).toEqual(false)
  end)
end)

describe("a Native a Shipped stub covers", function()
  it("is replaced whole: no state kept, no original handed over", function()
    local count
    stubNative("DisplayTextToPlayer", function(...)
      count = select("#", ...)
    end)
    local game = startGame()
    DisplayTextToPlayer(Player(0), 0, 0, "welcome")
    expect(count).toEqual(4)
    expect(game.displayed).toEqual({})
    expect(runner.stubCalls()).toContainCall('DisplayTextToPlayer(player#' .. GetHandleId(Player(0)) .. ', 0, 0, "welcome")')
  end)

  it("no longer dispatches its events", function()
    local trigger = CreateTrigger()
    local damaged = false
    local unit = CreateUnit(Player(0), FourCC("hfoo"), 0, 0, 0)
    TriggerRegisterUnitEvent(trigger, unit, EVENT_UNIT_DAMAGED)
    TriggerAddAction(trigger, function() damaged = true end)
    stubNative("UnitDamageTarget", function() return true end)
    expect(UnitDamageTarget(unit, unit, 10, true, false, nil, nil, nil)).toEqual(true)
    expect(damaged).toEqual(false)
  end)
end)
