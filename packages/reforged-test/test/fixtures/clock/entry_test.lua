-- The Game clock on reforged-test/lua: one clock for the Lua state of the
-- file, moved by __stub_advance_time, and a timer that reads as before when
-- no test advances it.
local runner = require("lua_modules.reforged-test.lua.index")
local it, describe, expect = runner.it, runner.describe, runner.expect

describe("the Game clock, on reforged-test/lua", function()
  it("reads as before when never advanced", function()
    local timer = CreateTimer()
    local fired = 0
    TimerStart(timer, 1.5, true, function() fired = fired + 1 end)
    expect(TimerGetTimeout(timer)).toEqual(1.5)
    expect(TimerGetElapsed(timer)).toEqual(0.0)
    expect(TimerGetRemaining(timer)).toEqual(0.0)
    expect(fired).toEqual(0)
    __stub_fire_timer(timer)
    expect(fired).toEqual(1)
    DestroyTimer(timer)
    local ref = __stub_format(timer)
    expect(runner.stubCalls()).toEqual({
      "CreateTimer()",
      "TimerStart(" .. ref .. ", 1.5, true, <function>)",
      "TimerGetTimeout(" .. ref .. ")",
      "TimerGetElapsed(" .. ref .. ")",
      "TimerGetRemaining(" .. ref .. ")",
      "DestroyTimer(" .. ref .. ")",
    })
  end)

  it("moves through __stub_advance_time, which adds no call-log line", function()
    local log = {}
    TimerStart(CreateTimer(), 1, true, function() log[#log + 1] = "tick" end)
    __stub_advance_time(2.5)
    expect(log).toEqual({ "tick", "tick" })
    for _, call in ipairs(runner.stubCalls()) do
      expect(string.find(call, "advance", 1, true)).toBeUndefined()
    end
  end)

  it("keeps the clock of the Lua state from one test to the next", function()
    -- The test above left the clock at 2.5 and its timer armed for 3.
    local log = {}
    TimerStart(CreateTimer(), 1, false, function() log[#log + 1] = "at 3.5" end)
    __stub_advance_time(1)
    expect(log).toEqual({ "at 3.5" })
  end)

  it("refuses a negative and an endless advance", function()
    expect(function() __stub_advance_time(-0.5) end).toThrow(
      "__stub_advance_time: expected a number of seconds, 0 or more, and got -0.5")
    expect(function() __stub_advance_time(math.huge) end).toThrow(
      "__stub_advance_time: expected a number of seconds, 0 or more, and got inf")
  end)

  it("leaves os.clock to __stub_set_clock", function()
    __stub_advance_time(10)
    expect(os.clock()).toEqual(0.0)
  end)
end)
