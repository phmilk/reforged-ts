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
    expect(GetHeroLevel(unit)).toEqual(0)
    SetHeroLevel(unit, 3, false)
    expect(GetHeroLevel(unit)).toEqual(3)
    expect(since(mark)).toEqual({
      "CreateUnit(player#1048578, 1751543663, 10, 20.5, 270.0)",
      "GetOwningPlayer(unit#1048579)",
      "GetUnitTypeId(unit#1048579)",
      "GetHeroLevel(unit#1048579)",
      "SetHeroLevel(unit#1048579, 3, false)",
      "GetHeroLevel(unit#1048579)",
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

-- The trigger registrations, conditions and firing context, the expired timer
-- and the trackables. Lines name handles through __stub_format, so the ids
-- they take here do not matter.
local ref = __stub_format

-- Every TriggerRegister* Native of Patch 3.0.0.24268, with its arity after
-- the trigger.
local REGISTRATIONS = {
  TriggerRegisterVariableEvent = 3, TriggerRegisterTimerEvent = 2,
  TriggerRegisterTimerExpireEvent = 1, TriggerRegisterGameStateEvent = 3,
  TriggerRegisterDialogEvent = 1, TriggerRegisterDialogButtonEvent = 1,
  TriggerRegisterGameEvent = 1, TriggerRegisterEnterRegion = 2, TriggerRegisterLeaveRegion = 2,
  TriggerRegisterTrackableHitEvent = 1, TriggerRegisterTrackableTrackEvent = 1,
  TriggerRegisterCommandEvent = 2, TriggerRegisterUpgradeCommandEvent = 1,
  TriggerRegisterPlayerEvent = 2, TriggerRegisterPlayerUnitEvent = 3,
  TriggerRegisterPlayerAllianceChange = 2, TriggerRegisterPlayerStateEvent = 4,
  TriggerRegisterPlayerChatEvent = 3, TriggerRegisterDeathEvent = 1,
  TriggerRegisterUnitStateEvent = 4, TriggerRegisterUnitEvent = 2,
  TriggerRegisterFilterUnitEvent = 3, TriggerRegisterUnitInRange = 3,
  BlzTriggerRegisterFrameEvent = 2, BlzTriggerRegisterPlayerSyncEvent = 3,
  BlzTriggerRegisterPlayerKeyEvent = 4,
}

describe("trigger registrations", function()
  it("records every TriggerRegister* Native with one argument per parameter and returns an event", function()
    local trigger = CreateTrigger()
    local count = 0
    for name, arity in pairs(REGISTRATIONS) do
      count = count + 1
      local nils = {}
      for i = 1, arity do
        nils[i] = "nil"
      end
      local event = _G[name](trigger)
      expect(event.__kind).toEqual("event")
      expect(runner.stubCalls()).toContainCall(name .. "(" .. ref(trigger) .. ", " .. table.concat(nils, ", ") .. ")")
    end
    expect(count).toEqual(26)
    expect(trigger.actions).toBeUndefined()
    expect(trigger.conditions).toBeUndefined()
  end)
  it("renders the handles by kind and id and the constants by name", function()
    local trigger = CreateTrigger()
    local filter = Filter(function() return true end)
    local mark = #runner.stubCalls()
    local death = TriggerRegisterPlayerUnitEvent(trigger, Player(0), EVENT_PLAYER_UNIT_DEATH, filter)
    local mouse = TriggerRegisterPlayerEvent(trigger, Player(1), EVENT_PLAYER_MOUSE_DOWN)
    local region = CreateRegion()
    TriggerRegisterEnterRegion(trigger, region)
    expect(death == mouse).toEqual(false)
    expect(since(mark)).toEqual({
      "Player(0)",
      "TriggerRegisterPlayerUnitEvent(" .. ref(trigger) .. ", player#1048577, EVENT_PLAYER_UNIT_DEATH, " .. ref(filter) .. ")",
      "Player(1)",
      "TriggerRegisterPlayerEvent(" .. ref(trigger) .. ", player#1048578, EVENT_PLAYER_MOUSE_DOWN)",
      "CreateRegion()",
      "TriggerRegisterEnterRegion(" .. ref(trigger) .. ", " .. ref(region) .. ", nil)",
    })
  end)
  it("defines the event constants as distinct values of their kind", function()
    expect(EVENT_PLAYER_UNIT_DEATH.__kind).toEqual("playerunitevent")
    expect(EVENT_UNIT_DEATH.__kind).toEqual("unitevent")
    expect(EVENT_PLAYER_UNIT_EQUIP_ITEM.__kind).toEqual("playerunitevent")
    expect(EVENT_UNIT_UNEQUIP_ITEM.__kind).toEqual("unitevent")
    expect(EVENT_PLAYER_KEY_DOWN.__kind).toEqual("playerevent")
    expect(FRAMEEVENT_CONTROL_CLICK.__kind).toEqual("frameeventtype")
    expect(ATTACK_TYPE_HERO.__kind).toEqual("attacktype")
    expect(DAMAGE_TYPE_FIRE.__kind).toEqual("damagetype")
    expect(WEAPON_TYPE_WHOKNOWS.__kind).toEqual("weapontype")
    expect(OSKEY_A.__kind).toEqual("oskeytype")
    expect(LESS_THAN.__kind).toEqual("limitop")
    expect(EVENT_PLAYER_UNIT_DEATH == EVENT_UNIT_DEATH).toEqual(false)
    expect(EVENT_PLAYER_UNIT_DEATH.__handleId).toBeUndefined()
  end)
end)

describe("conditions", function()
  it("Condition and Filter return distinct handles that remember their function", function()
    local func = function() return true end
    local condition = Condition(func)
    local filter = Filter(func)
    expect(condition.__kind).toEqual("conditionfunc")
    expect(filter.__kind).toEqual("filterfunc")
    expect(condition == filter).toEqual(false)
    expect(Condition(func) == condition).toEqual(false)
    expect(condition.func).toBe(func)
    expect(filter.func).toBe(func)
    expect(runner.stubCalls()).toContainCall("Condition(<function>)")
    expect(runner.stubCalls()).toContainCall("Filter(<function>)")
  end)
  it("keeps the actions from running when a condition returns false, every condition still running", function()
    local trigger = CreateTrigger()
    local order = {}
    local blocking = Condition(function() order[#order + 1] = "false"; return false end)
    local handle = TriggerAddCondition(trigger, blocking)
    TriggerAddCondition(trigger, Condition(function() order[#order + 1] = "true"; return true end))
    TriggerAddAction(trigger, function() order[#order + 1] = "action" end)
    expect(handle.__kind).toEqual("triggercondition")
    expect(__stub_fire_trigger(trigger)).toEqual(false)
    expect(order).toEqual({ "false", "true" })
    expect(runner.stubCalls()).toContainCall("TriggerAddCondition(" .. ref(trigger) .. ", " .. ref(blocking) .. ")")
  end)
  it("runs the actions after the conditions when every condition returns true", function()
    local trigger = CreateTrigger()
    local order = {}
    TriggerAddAction(trigger, function() order[#order + 1] = "action" end)
    TriggerAddCondition(trigger, Filter(function() order[#order + 1] = "first"; return true end))
    TriggerAddCondition(trigger, Condition(function() order[#order + 1] = "second"; return true end))
    expect(__stub_fire_trigger(trigger)).toEqual(true)
    expect(order).toEqual({ "first", "second", "action" })
  end)
  it("evaluates the conditions to their conjunction and executes the actions without them", function()
    local trigger = CreateTrigger()
    local answer = true
    local runs = 0
    TriggerAddCondition(trigger, Condition(function() return answer end))
    TriggerAddAction(trigger, function() runs = runs + 1 end)
    expect(TriggerEvaluate(trigger)).toEqual(true)
    answer = false
    expect(TriggerEvaluate(trigger)).toEqual(false)
    TriggerExecute(trigger)
    TriggerExecuteWait(trigger)
    expect(runs).toEqual(2)
    expect(runner.stubCalls()).toContainCall("TriggerEvaluate(" .. ref(trigger) .. ")")
    expect(runner.stubCalls()).toContainCall("TriggerExecute(" .. ref(trigger) .. ")")
    expect(runner.stubCalls()).toContainCall("TriggerExecuteWait(" .. ref(trigger) .. ")")
  end)
  it("removes one action or condition by its handle and clears them all", function()
    local trigger = CreateTrigger()
    local order = {}
    local first = TriggerAddAction(trigger, function() order[#order + 1] = "first" end)
    TriggerAddAction(trigger, function() order[#order + 1] = "second" end)
    local blocking = TriggerAddCondition(trigger, Condition(function() return false end))
    TriggerRemoveCondition(trigger, blocking)
    TriggerRemoveAction(trigger, first)
    __stub_fire_trigger(trigger)
    expect(order).toEqual({ "second" })
    TriggerAddCondition(trigger, Condition(function() return false end))
    TriggerClearConditions(trigger)
    TriggerClearActions(trigger)
    expect(__stub_fire_trigger(trigger)).toEqual(true)
    expect(order).toEqual({ "second" })
    expect(runner.stubCalls()).toContainCall("TriggerRemoveAction(" .. ref(trigger) .. ", " .. ref(first) .. ")")
    expect(runner.stubCalls()).toContainCall("TriggerRemoveCondition(" .. ref(trigger) .. ", " .. ref(blocking) .. ")")
    expect(runner.stubCalls()).toContainCall("TriggerClearActions(" .. ref(trigger) .. ")")
    expect(runner.stubCalls()).toContainCall("TriggerClearConditions(" .. ref(trigger) .. ")")
  end)
end)

describe("firing a trigger with a context", function()
  it("answers the response Natives from the context inside the firing and nil outside", function()
    local trigger = CreateTrigger()
    local dying = CreateUnit(Player(0), 1751543663, 0, 0, 0)
    local seen = {}
    TriggerAddCondition(trigger, Condition(function()
      seen.condition = GetTriggerUnit()
      return true
    end))
    TriggerAddAction(trigger, function()
      seen.unit = GetTriggerUnit()
      seen.killer = GetKillingUnit()
      seen.trigger = GetTriggeringTrigger()
    end)
    expect(GetTriggerUnit()).toBeUndefined()
    __stub_fire_trigger(trigger, { GetTriggerUnit = dying, GetTriggeringTrigger = trigger })
    expect(seen.condition).toBe(dying)
    expect(seen.unit).toBe(dying)
    expect(seen.killer).toBeUndefined()
    expect(seen.trigger).toBe(trigger)
    expect(GetTriggerUnit()).toBeUndefined()
    expect(runner.stubCalls()).toContainCall("GetKillingUnit()")
  end)
  it("hands the outer context back after a firing inside a firing", function()
    local outer, inner = CreateTrigger(), CreateTrigger()
    local seen = {}
    TriggerAddAction(inner, function() seen.inner = GetEventDamage() end)
    TriggerAddAction(outer, function()
      __stub_fire_trigger(inner, { GetEventDamage = 5.0 })
      seen.outer = GetEventDamage()
    end)
    __stub_fire_trigger(outer, { GetEventDamage = 10.0 })
    expect(seen).toEqual({ inner = 5.0, outer = 10.0 })
  end)
  it("records the trigger-state Natives, skips a disabled trigger and refuses a destroyed one", function()
    local trigger = CreateTrigger()
    local runs = 0
    TriggerAddAction(trigger, function() runs = runs + 1 end)
    expect(IsTriggerEnabled(trigger)).toEqual(true)
    DisableTrigger(trigger)
    expect(IsTriggerEnabled(trigger)).toEqual(false)
    expect(__stub_fire_trigger(trigger)).toEqual(false)
    EnableTrigger(trigger)
    expect(__stub_fire_trigger(trigger)).toEqual(true)
    expect(runs).toEqual(1)
    expect(IsTriggerWaitOnSleeps(trigger)).toEqual(false)
    TriggerWaitOnSleeps(trigger, true)
    expect(IsTriggerWaitOnSleeps(trigger)).toEqual(true)
    expect(GetTriggerEvalCount(trigger)).toEqual(0)
    expect(GetTriggerExecCount(trigger)).toEqual(0)
    ResetTrigger(trigger)
    DestroyTrigger(trigger)
    expect(function() __stub_fire_trigger(trigger) end).toThrow(ref(trigger) .. " was destroyed")
    local t = ref(trigger)
    for _, line in ipairs({
      "DisableTrigger(" .. t .. ")", "EnableTrigger(" .. t .. ")", "IsTriggerEnabled(" .. t .. ")",
      "TriggerWaitOnSleeps(" .. t .. ", true)", "IsTriggerWaitOnSleeps(" .. t .. ")",
      "GetTriggerEvalCount(" .. t .. ")", "GetTriggerExecCount(" .. t .. ")",
      "ResetTrigger(" .. t .. ")", "DestroyTrigger(" .. t .. ")",
    }) do
      expect(runner.stubCalls()).toContainCall(line)
    end
  end)
end)

describe("timers", function()
  it("answers GetExpiredTimer with the fired timer inside the handler and nil after", function()
    local timer = CreateTimer()
    local seen
    TimerStart(timer, 1.0, true, function() seen = GetExpiredTimer() end)
    expect(GetExpiredTimer()).toBeUndefined()
    __stub_fire_timer(timer)
    expect(seen).toBe(timer)
    expect(GetExpiredTimer()).toBeUndefined()
    expect(runner.stubCalls()).toContainCall("GetExpiredTimer()")
  end)
  it("records pause, resume and the time reads, and refuses a destroyed timer", function()
    local timer = CreateTimer()
    TimerStart(timer, 2.0, false, function() end)
    PauseTimer(timer)
    ResumeTimer(timer)
    expect(TimerGetElapsed(timer)).toEqual(0.0)
    expect(TimerGetRemaining(timer)).toEqual(0.0)
    DestroyTimer(timer)
    expect(function() __stub_fire_timer(timer) end).toThrow(ref(timer) .. " was destroyed")
    for _, name in ipairs({ "PauseTimer", "ResumeTimer", "TimerGetElapsed", "TimerGetRemaining" }) do
      expect(runner.stubCalls()).toContainCall(name .. "(" .. ref(timer) .. ")")
    end
  end)
end)

describe("trackables", function()
  it("records CreateTrackable and answers GetTriggeringTrackable from the context", function()
    local trackable = CreateTrackable("model.mdx", 1.0, 2.0, 90.0)
    expect(trackable.__kind).toEqual("trackable")
    expect(runner.stubCalls()).toContainCall('CreateTrackable("model.mdx", 1.0, 2.0, 90.0)')
    local trigger = CreateTrigger()
    local seen
    TriggerRegisterTrackableHitEvent(trigger, trackable)
    TriggerAddAction(trigger, function() seen = GetTriggeringTrackable() end)
    __stub_fire_trigger(trigger, { GetTriggeringTrackable = trackable })
    expect(seen).toBe(trackable)
    expect(GetTriggeringTrackable()).toBeUndefined()
  end)
end)

describe("players", function()
  it("answers the local player a test set and hands the previous slot back", function()
    local mark = #runner.stubCalls()
    expect(__stub_set_local_player(1)).toEqual(0)
    expect(__stub_local_player()).toBe(__stub_player(1))
    expect(since(mark)).toEqual({})
    expect(GetLocalPlayer()).toBe(Player(1))
    expect(__stub_set_local_player(0)).toEqual(1)
    expect(GetLocalPlayer()).toBe(Player(0))
  end)
end)

-- The sync family: what BlzSendSyncData was given, and the delivery helper
-- that fires the sync registrations as the game would.
describe("sync", function()
  it("records a sent packet with its prefix, its data and the local player, and returns true", function()
    local before = #__stub_sync_packets()
    expect(BlzSendSyncData("P", "hello")).toEqual(true)
    __stub_set_local_player(1)
    expect(BlzSendSyncData("Q", "")).toEqual(true)
    __stub_set_local_player(0)
    local packets = __stub_sync_packets()
    expect(#packets).toEqual(before + 2)
    expect(packets[before + 1]).toEqual({ prefix = "P", data = "hello", from = __stub_player(0) })
    expect(packets[before + 2]).toEqual({ prefix = "Q", data = "", from = __stub_player(1) })
    expect(runner.stubCalls()).toContainCall('BlzSendSyncData("P", "hello")')
    expect(runner.stubCalls()).toContainCall('BlzSendSyncData("Q", "")')
  end)
  it("delivers a packet to a trigger registered for its prefix and sender, with the sync context", function()
    local trigger = CreateTrigger()
    local seen = {}
    BlzTriggerRegisterPlayerSyncEvent(trigger, Player(1), "P", false)
    TriggerAddAction(trigger, function()
      seen[#seen + 1] = {
        prefix = BlzGetTriggerSyncPrefix(),
        data = BlzGetTriggerSyncData(),
        player = GetTriggerPlayer(),
        trigger = GetTriggeringTrigger(),
      }
    end)
    expect(__stub_deliver_sync({ prefix = "P", data = "abc", from = Player(1) })).toEqual(1)
    expect(seen).toEqual({ { prefix = "P", data = "abc", player = Player(1), trigger = trigger } })
    expect(BlzGetTriggerSyncData()).toBeUndefined()
  end)
  it("delivers a recorded packet as it was sent", function()
    local trigger = CreateTrigger()
    local seen = {}
    BlzTriggerRegisterPlayerSyncEvent(trigger, Player(0), "R", false)
    TriggerAddAction(trigger, function() seen[#seen + 1] = BlzGetTriggerSyncData() end)
    BlzSendSyncData("R", "recorded")
    local packets = __stub_sync_packets()
    __stub_deliver_sync(packets[#packets])
    expect(seen).toEqual({ "recorded" })
  end)
  it("fires no trigger registered for another prefix or another player, nor a disabled or destroyed one", function()
    local otherPrefix, otherPlayer = CreateTrigger(), CreateTrigger()
    local disabled, destroyed = CreateTrigger(), CreateTrigger()
    local runs = 0
    for _, trigger in ipairs({ otherPrefix, otherPlayer, disabled, destroyed }) do
      TriggerAddAction(trigger, function() runs = runs + 1 end)
    end
    BlzTriggerRegisterPlayerSyncEvent(otherPrefix, Player(0), "other", false)
    BlzTriggerRegisterPlayerSyncEvent(otherPlayer, Player(1), "S", false)
    BlzTriggerRegisterPlayerSyncEvent(disabled, Player(0), "S", false)
    BlzTriggerRegisterPlayerSyncEvent(destroyed, Player(0), "S", false)
    DisableTrigger(disabled)
    DestroyTrigger(destroyed)
    expect(__stub_deliver_sync({ prefix = "S", data = "x", from = Player(0) })).toEqual(0)
    expect(runs).toEqual(0)
  end)
  it("fires every matching registration once, in registration order", function()
    local first, second = CreateTrigger(), CreateTrigger()
    local order = {}
    TriggerAddAction(first, function() order[#order + 1] = "first" end)
    TriggerAddAction(second, function() order[#order + 1] = "second" end)
    BlzTriggerRegisterPlayerSyncEvent(second, Player(0), "O", false)
    BlzTriggerRegisterPlayerSyncEvent(first, Player(0), "O", false)
    BlzTriggerRegisterPlayerSyncEvent(first, Player(1), "O", false)
    expect(__stub_deliver_sync({ prefix = "O", data = "", from = Player(0) })).toEqual(2)
    expect(order).toEqual({ "second", "first" })
  end)
  it("cuts the data at its first zero byte with the cString option, as the game cuts a C string", function()
    local trigger = CreateTrigger()
    local seen = {}
    BlzTriggerRegisterPlayerSyncEvent(trigger, Player(0), "Z", false)
    TriggerAddAction(trigger, function() seen[#seen + 1] = BlzGetTriggerSyncData() end)
    local packet = { prefix = "Z", data = "ab\0cd", from = Player(0) }
    __stub_deliver_sync(packet)
    __stub_deliver_sync(packet, { cString = true })
    __stub_deliver_sync({ prefix = "Z", data = "no zero", from = Player(0) }, { cString = true })
    expect(seen).toEqual({ "ab\0cd", "ab", "no zero" })
    expect(packet.data).toEqual("ab\0cd")
  end)
end)

describe("preloads", function()
  it("records the Preload family and keeps the strings a file write was given", function()
    local mark = #runner.stubCalls()
    PreloadGenClear()
    PreloadGenStart()
    Preload("first")
    Preload('sec"ond')
    PreloadGenEnd("save.txt")
    Preloader("save.txt")
    expect(since(mark)).toEqual({
      "PreloadGenClear()",
      "PreloadGenStart()",
      'Preload("first")',
      'Preload("sec\\"ond")',
      'PreloadGenEnd("save.txt")',
      'Preloader("save.txt")',
    })
    expect(__stub_preload_file("save.txt")).toEqual({ "first", 'sec"ond' })
    expect(__stub_preload_file("never.txt")).toBeUndefined()
  end)
  it("starts the strings afresh after PreloadGenClear", function()
    PreloadGenClear()
    Preload("old")
    PreloadGenEnd("again.txt")
    PreloadGenClear()
    Preload("new")
    PreloadGenEnd("again.txt")
    expect(__stub_preload_file("again.txt")).toEqual({ "new" })
  end)
end)

describe("abilities", function()
  it("keeps an icon per ability id, with a default icon for an id never set", function()
    local lariat, blizzard = FourCC("Amls"), FourCC("AHbz")
    local default = "ReplaceableTextures\\CommandButtons\\BTNTemp.blp"
    expect(BlzGetAbilityIcon(lariat)).toEqual(default)
    BlzSetAbilityIcon(lariat, "saved contents")
    expect(BlzGetAbilityIcon(lariat)).toEqual("saved contents")
    expect(BlzGetAbilityIcon(blizzard)).toEqual(default)
    expect(runner.stubCalls()).toContainCall("BlzSetAbilityIcon(" .. lariat .. ', "saved contents")')
    expect(runner.stubCalls()).toContainCall("BlzGetAbilityIcon(" .. blizzard .. ")")
  end)
end)
