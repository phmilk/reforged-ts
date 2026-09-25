-- The shipped baseline stub on a fresh state.
local runner = require("lua_modules.reforged-test.lua.index")
local describe, it, expect = runner.describe, runner.it, runner.expect

describe("load-time globals", function()
  it("defines the constants", function()
    expect(bj_MAX_PLAYER_SLOTS).toEqual(28)
    expect(bj_MAX_PLAYERS).toEqual(24)
    expect(bj_UNIT_FACING).toEqual(270.0)
  end)
  it("defines the functions", function()
    expect(type(Player)).toEqual("function")
    expect(type(GetPlayerId)).toEqual("function")
    expect(type(GetHandleId)).toEqual("function")
    expect(type(CreateTrigger)).toEqual("function")
    expect(type(FourCC)).toEqual("function")
  end)
  it("leaves main and config nil", function()
    expect(main).toBeUndefined()
    expect(config).toBeUndefined()
  end)
  it("defines the slot-state and controller constants as distinct values", function()
    local slotStates = { PLAYER_SLOT_STATE_EMPTY, PLAYER_SLOT_STATE_PLAYING, PLAYER_SLOT_STATE_LEFT }
    local controllers = {
      MAP_CONTROL_USER, MAP_CONTROL_COMPUTER, MAP_CONTROL_RESCUABLE,
      MAP_CONTROL_NEUTRAL, MAP_CONTROL_CREEP, MAP_CONTROL_NONE,
    }
    expect(#slotStates).toEqual(3)
    expect(#controllers).toEqual(6)
    local seen = {}
    for _, constant in ipairs(slotStates) do
      expect(seen[constant]).toBeUndefined()
      seen[constant] = true
    end
    for _, constant in ipairs(controllers) do
      expect(seen[constant]).toBeUndefined()
      seen[constant] = true
    end
    expect(PLAYER_SLOT_STATE_PLAYING).toBe(PLAYER_SLOT_STATE_PLAYING)
    expect(PLAYER_SLOT_STATE_PLAYING == PLAYER_SLOT_STATE_EMPTY).toEqual(false)
  end)
end)

describe("machinery", function()
  it("starts with an empty call log", function()
    expect(runner.stubCalls()).toEqual({})
  end)
  it("records one line per call, handles as kind#id", function()
    local player = Player(0)
    GetPlayerId(player)
    GetHandleId(player)
    FourCC("hfoo")
    expect(runner.stubCalls()).toEqual({
      "Player(0)",
      "GetPlayerId(player#1048577)",
      "GetHandleId(player#1048577)",
      'FourCC("hfoo")',
    })
  end)
  it("gives handles sequential ids from a fixed base", function()
    expect(GetHandleId(Player(0))).toEqual(1048577)
    expect(GetHandleId(CreateTrigger())).toEqual(1048578)
    expect(GetHandleId(Player(1))).toEqual(1048579)
  end)
  it("returns the same player handle for a slot", function()
    expect(Player(3)).toBe(Player(3))
    expect(GetPlayerId(Player(3))).toEqual(3)
  end)
  it("computes FourCC as the game does", function()
    expect(FourCC("hfoo")).toEqual(1751543663)
  end)
  it("exposes the helpers to later stub files", function()
    local h = __stub_new_handle("timer")
    __stub_record("TimerStart", h, 1.5, false, function() end, "s", nil)
    expect(runner.stubCalls()).toContainCall('TimerStart(timer#1048581, 1.5, false, <function>, "s", nil)')
    expect(__stub_player(3)).toBe(Player(3))
  end)
  it("renders a constant by its name and gives it no handle id", function()
    local constant = __stub_constant("mapcontrol", "MAP_CONTROL_USER")
    expect(constant).toBe(constant)
    expect(constant == MAP_CONTROL_USER).toEqual(false)
    expect(constant.__handleId).toBeUndefined()
    __stub_record("SetPlayerController", Player(3), MAP_CONTROL_COMPUTER)
    expect(runner.stubCalls()).toContainCall("SetPlayerController(player#1048580, MAP_CONTROL_COMPUTER)")
    expect(GetHandleId(CreateTrigger())).toEqual(1048582)
  end)
  it("answers a response Native from the firing context, nil outside it", function()
    __stub_response("GetTriggerEventId")
    expect(GetTriggerEventId()).toBeUndefined()
    local inner
    local outer = __stub_with_context({ GetTriggerEventId = "outer" }, function()
      inner = __stub_with_context({}, function() return GetTriggerEventId() end)
      return GetTriggerEventId()
    end)
    expect(outer).toEqual("outer")
    expect(inner).toBeUndefined()
    expect(GetTriggerEventId()).toBeUndefined()
    expect(runner.stubCalls()).toContainCall("GetTriggerEventId()")
  end)
  it("puts the previous context back when the body throws", function()
    __stub_with_context({ GetTriggerEventId = "outer" }, function()
      expect(function()
        __stub_with_context({ GetTriggerEventId = "inner" }, function() error("body failed") end)
      end).toThrow("body failed")
      expect(GetTriggerEventId()).toEqual("outer")
    end)
    expect(GetTriggerEventId()).toBeUndefined()
  end)
end)
