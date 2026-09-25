-- The test controls of the shipped stubs on a fresh state: the local player,
-- output capture, the globals Init stage, nested damage dispatch and the
-- arguments a Native was handed.
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

describe("the local player", function()
  it("answers the local player a test set and hands the previous slot back", function()
    expect(GetLocalPlayer()).toBe(Player(0))
    expect(__stub_set_local_player(1)).toEqual(0)
    expect(GetLocalPlayer()).toBe(Player(1))
    expect(__stub_local_player()).toBe(__stub_player(1))
    expect(__stub_set_local_player(0)).toEqual(1)
    expect(GetLocalPlayer()).toBe(Player(0))
  end)
  it("sets the local player without a call-log line", function()
    local mark = #runner.stubCalls()
    __stub_set_local_player(1)
    __stub_local_player()
    __stub_set_local_player(0)
    expect(since(mark)).toEqual({})
  end)
end)

describe("output capture", function()
  it("captures what print wrote, one line per call, arguments joined by a tab", function()
    local mark = #__stub_printed()
    print("reforged-ts: one")
    print("a", 1, nil, true)
    local printed = __stub_printed()
    expect(#printed - mark).toEqual(2)
    expect(printed[mark + 1]).toEqual("reforged-ts: one")
    expect(printed[mark + 2]).toEqual("a\t1\tnil\ttrue")
  end)
  it("adds no call-log line for print", function()
    local mark = #runner.stubCalls()
    print("quiet")
    expect(since(mark)).toEqual({})
  end)
  it("records the display Natives and captures what they showed and to which player", function()
    local mark = #__stub_displayed()
    DisplayTimedTextToPlayer(Player(1), 0, 0, 30, "timed")
    DisplayTextToPlayer(Player(0), 0.5, 0.25, "plain")
    DisplayTimedTextFromPlayer(Player(0), 0, 0, 5, "from %s")
    ClearTextMessages()
    local shown = __stub_displayed()
    expect(#shown - mark).toEqual(3)
    expect(shown[mark + 1]).toEqual({
      native = "DisplayTimedTextToPlayer", player = Player(1), x = 0, y = 0, duration = 30, text = "timed",
    })
    expect(shown[mark + 1].player).toBe(Player(1))
    expect(shown[mark + 2]).toEqual({
      native = "DisplayTextToPlayer", player = Player(0), x = 0.5, y = 0.25, text = "plain",
    })
    expect(shown[mark + 3].native).toEqual("DisplayTimedTextFromPlayer")
    expect(shown[mark + 3].text).toEqual("from %s")
    local calls = runner.stubCalls()
    expect(calls).toContainCall('DisplayTimedTextToPlayer(player#1048578, 0, 0, 30, "timed")')
    expect(calls).toContainCall("ClearTextMessages()")
  end)
end)

describe("the globals Init stage", function()
  it("defines InitGlobals through an assignment when it is nil, then calls it", function()
    expect(InitGlobals).toBeUndefined()
    local assigned = {}
    local entered = 0
    -- stands in for the library's interception of _G, which wraps the
    -- editor's InitGlobals on its first assignment
    setmetatable(_G, {
      __newindex = function(t, key, value)
        assigned[#assigned + 1] = key
        if key == "InitGlobals" then
          rawset(t, key, function()
            entered = entered + 1
            value()
          end)
        else
          rawset(t, key, value)
        end
      end,
    })
    __stub_init_globals()
    setmetatable(_G, nil)
    expect(assigned).toEqual({ "InitGlobals" })
    expect(entered).toEqual(1)
  end)
  it("calls the InitGlobals a test or the library already defined", function()
    local entered = 0
    local previous = InitGlobals
    InitGlobals = function() entered = entered + 1 end
    local mark = #runner.stubCalls()
    __stub_init_globals()
    expect(entered).toEqual(1)
    expect(since(mark)).toEqual({})
    InitGlobals = previous
  end)
end)

describe("nested damage dispatch", function()
  it("fires a trigger registered for damage on the target, with the damage as its context", function()
    local source = CreateUnit(Player(0), 1, 0, 0, 0)
    local target = CreateUnit(Player(1), 1, 0, 0, 0)
    local trigger = CreateTrigger()
    TriggerRegisterUnitEvent(trigger, target, EVENT_UNIT_DAMAGED)
    local seen = nil
    TriggerAddAction(trigger, function()
      seen = {
        source = GetEventDamageSource(),
        target = BlzGetEventDamageTarget(),
        unit = GetTriggerUnit(),
        amount = GetEventDamage(),
        attackType = BlzGetEventAttackType(),
        isAttack = BlzGetEventIsAttack(),
        trigger = GetTriggeringTrigger(),
        event = GetTriggerEventId(),
      }
    end)
    local mark = #runner.stubCalls()
    expect(UnitDamageTarget(source, target, 25, true, false, ATTACK_TYPE_HERO, DAMAGE_TYPE_NORMAL, WEAPON_TYPE_WHOKNOWS)).toEqual(true)
    expect(since(mark)[1]).toEqual(
      "UnitDamageTarget(unit#" .. source.__handleId .. ", unit#" .. target.__handleId
        .. ", 25, true, false, ATTACK_TYPE_HERO, DAMAGE_TYPE_NORMAL, WEAPON_TYPE_WHOKNOWS)"
    )
    expect(seen.source).toBe(source)
    expect(seen.target).toBe(target)
    expect(seen.unit).toBe(target)
    expect(seen.amount).toEqual(25)
    expect(seen.attackType).toBe(ATTACK_TYPE_HERO)
    expect(seen.isAttack).toEqual(true)
    expect(seen.trigger).toBe(trigger)
    expect(seen.event).toBe(EVENT_UNIT_DAMAGED)
  end)
  it("leaves a trigger registered on another unit or for another event alone", function()
    local target = CreateUnit(Player(1), 1, 0, 0, 0)
    local other = CreateUnit(Player(1), 1, 0, 0, 0)
    local trigger = CreateTrigger()
    TriggerRegisterUnitEvent(trigger, other, EVENT_UNIT_DAMAGED)
    TriggerRegisterUnitEvent(trigger, target, EVENT_UNIT_DEATH)
    local ran = 0
    TriggerAddAction(trigger, function() ran = ran + 1 end)
    expect(__stub_dispatch_damage({ source = other, target = target, amount = 1 })).toEqual(0)
    expect(ran).toEqual(0)
  end)
  it("fires a player-unit registration for the target's owner, damaging before damaged", function()
    local target = CreateUnit(Player(1), 1, 0, 0, 0)
    local order = {}
    local damaged = CreateTrigger()
    for slot = 0, 1 do
      TriggerRegisterPlayerUnitEvent(damaged, Player(slot), EVENT_PLAYER_UNIT_DAMAGED, nil)
    end
    TriggerAddAction(damaged, function() order[#order + 1] = "damaged" end)
    local damaging = CreateTrigger()
    TriggerRegisterPlayerUnitEvent(damaging, Player(1), EVENT_PLAYER_UNIT_DAMAGING, nil)
    TriggerAddAction(damaging, function() order[#order + 1] = "damaging" end)
    expect(__stub_dispatch_damage({ source = target, target = target, amount = 3 })).toEqual(2)
    expect(order).toEqual({ "damaging", "damaged" })
    -- every later target is owned by slot 0 or 1
    DestroyTrigger(damaged)
    DestroyTrigger(damaging)
  end)
  it("runs a registration's filter with the target as GetFilterUnit", function()
    local target = CreateUnit(Player(1), 1, 0, 0, 0)
    local trigger = CreateTrigger()
    local filtered = nil
    TriggerRegisterPlayerUnitEvent(trigger, Player(1), EVENT_PLAYER_UNIT_DAMAGED, Filter(function()
      filtered = GetFilterUnit()
      return false
    end))
    local ran = 0
    TriggerAddAction(trigger, function() ran = ran + 1 end)
    expect(__stub_dispatch_damage({ source = target, target = target, amount = 3 })).toEqual(0)
    expect(filtered).toBe(target)
    expect(ran).toEqual(0)
    DestroyTrigger(trigger)
  end)
  it("skips a disabled or destroyed trigger", function()
    local target = CreateUnit(Player(1), 1, 0, 0, 0)
    local disabled, destroyed = CreateTrigger(), CreateTrigger()
    TriggerRegisterUnitEvent(disabled, target, EVENT_UNIT_DAMAGED)
    TriggerRegisterUnitEvent(destroyed, target, EVENT_UNIT_DAMAGED)
    DisableTrigger(disabled)
    DestroyTrigger(destroyed)
    expect(__stub_dispatch_damage({ source = target, target = target, amount = 3 })).toEqual(0)
  end)
  it("dispatches again inside an action that damages, with the inner context in the inner firing", function()
    local a = CreateUnit(Player(0), 1, 0, 0, 0)
    local b = CreateUnit(Player(1), 1, 0, 0, 0)
    local trigger = CreateTrigger()
    TriggerRegisterUnitEvent(trigger, a, EVENT_UNIT_DAMAGED)
    TriggerRegisterUnitEvent(trigger, b, EVENT_UNIT_DAMAGED)
    local log = {}
    TriggerAddAction(trigger, function()
      local source, target = GetEventDamageSource(), BlzGetEventDamageTarget()
      log[#log + 1] = GetHandleId(target)
      if #log < 3 then
        -- damage back: a nested dispatch inside this action
        UnitDamageTarget(target, source, 1, true, false, ATTACK_TYPE_NORMAL, DAMAGE_TYPE_NORMAL, WEAPON_TYPE_WHOKNOWS)
      end
      -- the outer firing's context is back after the nested one ended
      log[#log + 1] = rawequal(BlzGetEventDamageTarget(), target)
    end)
    UnitDamageTarget(a, b, 1, true, false, ATTACK_TYPE_NORMAL, DAMAGE_TYPE_NORMAL, WEAPON_TYPE_WHOKNOWS)
    expect(log).toEqual({
      b.__handleId, a.__handleId, b.__handleId, true, true, true,
    })
  end)
  it("stops a runaway loop at a fixed depth with an error naming it", function()
    local unit = CreateUnit(Player(0), 1, 0, 0, 0)
    local trigger = CreateTrigger()
    TriggerRegisterUnitEvent(trigger, unit, EVENT_UNIT_DAMAGED)
    local dispatches = 0
    TriggerAddAction(trigger, function()
      dispatches = dispatches + 1
      UnitDamageTarget(unit, unit, 1, true, false, ATTACK_TYPE_NORMAL, DAMAGE_TYPE_NORMAL, WEAPON_TYPE_WHOKNOWS)
    end)
    expect(function()
      __stub_dispatch_damage({ source = unit, target = unit, amount = 1 })
    end).toThrow("damage dispatch nested more than 32 deep")
    expect(dispatches).toEqual(32)
    -- the depth is back to zero: a new dispatch runs
    TriggerClearActions(trigger)
    expect(__stub_dispatch_damage({ source = unit, target = unit, amount = 1 })).toEqual(1)
  end)
end)

describe("the arguments of a Native call", function()
  it("hands back every call's arguments by identity, oldest first", function()
    local handler = function() end
    local timer = CreateTimer()
    TimerStart(timer, 1, false, handler)
    TimerStart(timer, 2, true, nil)
    local calls = __stub_args("TimerStart")
    expect(#calls).toEqual(2)
    expect(calls[1][1]).toBe(timer)
    expect(calls[1][4]).toBe(handler)
    expect(calls[2][2]).toEqual(2)
    expect(calls[2].n).toEqual(4)
    expect(calls[2][4]).toBeUndefined()
  end)
  it("hands back the functions Condition and TriggerAddAction were given", function()
    local condition, action = function() return true end, function() end
    local trigger = CreateTrigger()
    TriggerAddCondition(trigger, Condition(condition))
    TriggerAddAction(trigger, action)
    local conditions = __stub_args("Condition")
    expect(conditions[#conditions][1]).toBe(condition)
    local actions = __stub_args("TriggerAddAction")
    expect(actions[#actions][2]).toBe(action)
  end)
  it("answers an empty list for a Native never called", function()
    expect(__stub_args("NeverCalled")).toEqual({})
  end)
end)
