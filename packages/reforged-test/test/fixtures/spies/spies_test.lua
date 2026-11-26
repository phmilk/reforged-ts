-- Hand-written stand-in for a compiled spies.test.ts on reforged-test/map:
-- every Native a Spy, the Spies fn makes, calls, and the failures of the
-- spy matchers. Each test is a Test game of its own, so the first handle a
-- test creates has the id 1048577.
local map = require("lua_modules.reforged-test.map.index")
local describe, it, expect = map.describe, map.it, map.expect
local fn, calls, stubNative = map.fn, map.calls, map.stubNative

local function noop() end

describe("pass", function()
  it("reads a Native's Recorded calls, nothing replaced", function()
    local original = TimerStart
    local timer = CreateTimer()
    TimerStart(timer, 60, true, noop)
    expect(TimerStart).toBe(original)
    expect(TimerStart).toHaveBeenCalled()
    expect(TimerStart).toHaveBeenCalledTimes(1)
    expect(TimerStart).toHaveBeenCalledWith(timer, 60, true, expect.anything())
    expect(TimerStart)["not"].toHaveBeenCalledWith(timer, 30, true, noop)
    expect(PauseTimer)["not"].toHaveBeenCalled()
    expect(PauseTimer).toHaveBeenCalledTimes(0)
  end)

  it("compares the last and the nth call", function()
    local timer = CreateTimer()
    TimerStart(timer, 10, false, noop)
    TimerStart(timer, 20, false, noop)
    expect(TimerStart).toHaveBeenNthCalledWith(1, timer, 10, false, noop)
    expect(TimerStart).toHaveBeenNthCalledWith(2, timer, 20, false, noop)
    expect(TimerStart)["not"].toHaveBeenNthCalledWith(3, timer, 20, false, noop)
    expect(TimerStart).toHaveBeenLastCalledWith(timer, 20, false, noop)
    expect(TimerStart)["not"].toHaveBeenLastCalledWith(timer, 10, false, noop)
  end)

  it("reads the calls of a response Native defined after the seal", function()
    __stub_response("GetSpellTargetX")
    GetSpellTargetX()
    expect(GetSpellTargetX).toHaveBeenCalledTimes(1)
  end)

  it("reads the calls of a Native stubNative answers", function()
    stubNative("GetUnitName", function() return "Footman" end)
    GetUnitName(nil)
    expect(GetUnitName).toHaveBeenCalledTimes(1)
  end)

  it("keeps each Spy's calls apart, a trailing nil counted", function()
    local first, second = fn(), fn()
    first(1, nil)
    expect(type(first)).toEqual("function")
    expect(first).toHaveBeenCalledWith(1, nil)
    expect(first)["not"].toHaveBeenCalledWith(1)
    expect(second)["not"].toHaveBeenCalled()
  end)

  it("calls impl and returns what it returned", function()
    local spy = fn(function(a, b) return a + b, "sum" end)
    local sum, label = spy(1, 2)
    expect(sum).toEqual(3)
    expect(label).toEqual("sum")
    expect(select("#", fn()())).toEqual(0)
  end)

  it("gives each call's arguments with calls, oldest first", function()
    local spy = fn()
    spy("a", 1)
    spy("b")
    expect(calls(spy)).toEqual({ { "a", 1 }, { "b" } })
    local timer = CreateTimer()
    TimerStart(timer, 5, false, noop)
    expect(calls(TimerStart)[1][1]).toBe(timer)
    expect(calls(TimerStart)[1][4]).toBe(noop)
    local trailing = fn()
    trailing(1, nil)
    expect(trailing).toHaveBeenLastCalledWith(1, nil)
    expect(trailing).toHaveBeenNthCalledWith(1, 1, nil)
    expect(trailing)["not"].toHaveBeenLastCalledWith(1)
    expect(trailing)["not"].toHaveBeenNthCalledWith(1, 1)
  end)
end)

describe("fail", function()
  it("a Native never called", function()
    expect(PauseTimer).toHaveBeenCalled()
  end)

  it("a call with other arguments", function()
    TimerStart(CreateTimer(), 30, false, noop)
    expect(TimerStart).toHaveBeenCalledWith(expect.anything(), 60, true, expect.anything())
  end)

  it("a Spy called, negated", function()
    local spy = fn()
    spy(1, "a")
    expect(spy)["not"].toHaveBeenCalled()
  end)

  it("a count of calls", function()
    local spy = fn()
    spy()
    spy(nil)
    expect(spy).toHaveBeenCalledTimes(1)
  end)

  it("the nth call", function()
    local spy = fn()
    spy(1)
    expect(spy).toHaveBeenNthCalledWith(2, 1)
  end)

  it("the last call", function()
    local spy = fn()
    spy(1)
    spy(2)
    expect(spy).toHaveBeenLastCalledWith(1)
  end)

  it("a function of the Lua library", function()
    expect(print).toHaveBeenCalled()
  end)

  it("a function of the map", function()
    function InitGlobals() end
    expect(InitGlobals).toHaveBeenCalled()
  end)

  it("a value that is no function", function()
    expect(3).toHaveBeenCalled()
  end)

  it("a deep difference", function()
    expect({ 1, { x = 2 } }).toEqual({ 1, { x = 3 } })
  end)

  it("a constant and a Handle", function()
    expect({ PLAYER_SLOT_STATE_PLAYING, CreateTimer() }).toEqual({ PLAYER_SLOT_STATE_EMPTY })
  end)
end)

describe("raise", function()
  it("calls of a value that is no Spy", function()
    calls(3)
  end)

  it("a thrown table with a message", function()
    error({ message = "the wave did not come" })
  end)
end)
