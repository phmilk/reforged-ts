-- Hand-written stand-in for a compiled dispatch.test.ts on
-- reforged-test/map: game.fire and the Event dispatch under it.
local map = require("lua_modules.reforged-test.map.index")
local runner = require("lua_modules.reforged-test.lua.index")
local it, describe, expect, startGame = map.it, map.describe, map.expect, map.startGame

-- A trigger that appends `name .. " condition"` and `name .. " action"` to
-- `log` when it runs, its condition answering `passes`.
local function logged(log, name, passes)
  local trigger = CreateTrigger()
  TriggerAddCondition(trigger, Condition(function()
    log[#log + 1] = name .. " condition"
    return passes ~= false
  end))
  TriggerAddAction(trigger, function()
    log[#log + 1] = name .. " action"
  end)
  return trigger
end

local function caster(slot)
  return CreateUnit(Player(slot or 0), FourCC("Hmkg"), 0, 0, 0)
end

describe("the Event dispatch", function()
  it("runs every Trigger in registration order, each condition before its action", function()
    local game = startGame()
    local log = {}
    for _, name in ipairs({ "first", "second", "third" }) do
      TriggerRegisterPlayerUnitEvent(logged(log, name), Player(0), EVENT_PLAYER_UNIT_SPELL_EFFECT, nil)
    end
    game.fire(EVENT_PLAYER_UNIT_SPELL_EFFECT, { GetTriggerUnit = caster() })
    expect(log).toEqual({
      "first condition", "first action",
      "second condition", "second action",
      "third condition", "third action",
    })
  end)

  it("skips a disabled or destroyed Trigger, and a failed condition runs no action", function()
    local game = startGame()
    local log = {}
    local disabled = logged(log, "disabled")
    local destroyed = logged(log, "destroyed")
    local refused = logged(log, "refused", false)
    local kept = logged(log, "kept")
    for _, trigger in ipairs({ disabled, destroyed, refused, kept }) do
      TriggerRegisterPlayerUnitEvent(trigger, Player(0), EVENT_PLAYER_UNIT_SPELL_EFFECT, nil)
    end
    DisableTrigger(disabled)
    DestroyTrigger(destroyed)
    game.fire(EVENT_PLAYER_UNIT_SPELL_EFFECT, { GetTriggerUnit = caster() })
    expect(log).toEqual({ "refused condition", "kept condition", "kept action" })
  end)

  it("checks a Trigger disabled by an earlier one's action when its turn comes", function()
    local game = startGame()
    local log = {}
    local second = logged(log, "second")
    local first = CreateTrigger()
    TriggerAddAction(first, function() DisableTrigger(second) end)
    TriggerRegisterPlayerUnitEvent(first, Player(0), EVENT_PLAYER_UNIT_SPELL_EFFECT, nil)
    TriggerRegisterPlayerUnitEvent(second, Player(0), EVENT_PLAYER_UNIT_SPELL_EFFECT, nil)
    game.fire(EVENT_PLAYER_UNIT_SPELL_EFFECT, { GetTriggerUnit = caster() })
    expect(log).toEqual({})
  end)

  it("evaluates a registration's filter on the triggering unit, before the condition", function()
    local game = startGame()
    local log = {}
    local hero = caster()
    local seen
    local accepting = logged(log, "accepted")
    local refusing = logged(log, "refused")
    TriggerRegisterPlayerUnitEvent(accepting, Player(0), EVENT_PLAYER_UNIT_SPELL_EFFECT, Filter(function()
      seen = GetFilterUnit()
      log[#log + 1] = "filter"
      return true
    end))
    TriggerRegisterPlayerUnitEvent(refusing, Player(0), EVENT_PLAYER_UNIT_SPELL_EFFECT, Filter(function()
      return false
    end))
    game.fire(EVENT_PLAYER_UNIT_SPELL_EFFECT, { GetTriggerUnit = hero })
    expect(log).toEqual({ "filter", "accepted condition", "accepted action" })
    expect(seen).toBe(hero)
  end)

  it("runs a Trigger once per matching registration", function()
    local game = startGame()
    local log = {}
    local trigger = logged(log, "twice")
    TriggerRegisterPlayerUnitEvent(trigger, Player(0), EVENT_PLAYER_UNIT_SPELL_EFFECT, nil)
    TriggerRegisterPlayerUnitEvent(trigger, Player(0), EVENT_PLAYER_UNIT_SPELL_EFFECT, nil)
    game.fire(EVENT_PLAYER_UNIT_SPELL_EFFECT, { GetTriggerUnit = caster() })
    expect(#log).toEqual(4)
  end)

  it("is no error with no Trigger registered", function()
    local game = startGame()
    game.fire(EVENT_PLAYER_UNIT_SPELL_EFFECT, { GetTriggerUnit = caster() })
    game.fire(EVENT_GAME_LOADED, {})
  end)

  it("answers GetTriggeringTrigger and GetTriggerEventId", function()
    local game = startGame()
    local trigger = CreateTrigger()
    local answered = {}
    TriggerAddAction(trigger, function()
      answered.trigger = GetTriggeringTrigger()
      answered.event = GetTriggerEventId()
    end)
    TriggerRegisterPlayerUnitEvent(trigger, Player(0), EVENT_PLAYER_UNIT_SPELL_EFFECT, nil)
    game.fire(EVENT_PLAYER_UNIT_SPELL_EFFECT, { GetTriggerUnit = caster() })
    expect(answered.trigger).toBe(trigger)
    expect(answered.event).toBe(EVENT_PLAYER_UNIT_SPELL_EFFECT)
  end)

  it("leaves __stub_fire_trigger as it was: one Trigger the test holds", function()
    startGame()
    local log = {}
    local held = logged(log, "held")
    local other = logged(log, "other")
    TriggerRegisterPlayerUnitEvent(held, Player(0), EVENT_PLAYER_UNIT_SPELL_EFFECT, nil)
    TriggerRegisterPlayerUnitEvent(other, Player(0), EVENT_PLAYER_UNIT_SPELL_EFFECT, nil)
    expect(__stub_fire_trigger(held, { GetTriggerUnit = caster() })).toBe(true)
    expect(log).toEqual({ "held condition", "held action" })
  end)
end)

describe("the subject, by the event's family", function()
  it("reaches the owner of GetTriggerUnit for a playerunitevent", function()
    local game = startGame()
    local log = {}
    TriggerRegisterPlayerUnitEvent(logged(log, "owner"), Player(1), EVENT_PLAYER_UNIT_SPELL_EFFECT, nil)
    TriggerRegisterPlayerUnitEvent(logged(log, "other player"), Player(0), EVENT_PLAYER_UNIT_SPELL_EFFECT, nil)
    TriggerRegisterPlayerUnitEvent(logged(log, "other event"), Player(1), EVENT_PLAYER_UNIT_SPELL_CAST, nil)
    game.fire(EVENT_PLAYER_UNIT_SPELL_EFFECT, { GetTriggerUnit = caster(1) })
    expect(log).toEqual({ "owner condition", "owner action" })
  end)

  it("reaches GetTriggerUnit for a unitevent, a filtered registration included", function()
    local game = startGame()
    local log = {}
    local hero, other = caster(), caster()
    TriggerRegisterUnitEvent(logged(log, "unit"), hero, EVENT_UNIT_SPELL_EFFECT)
    TriggerRegisterFilterUnitEvent(logged(log, "filtered"), hero, EVENT_UNIT_SPELL_EFFECT, Filter(function()
      return GetFilterUnit() == hero
    end))
    TriggerRegisterUnitEvent(logged(log, "other unit"), other, EVENT_UNIT_SPELL_EFFECT)
    game.fire(EVENT_UNIT_SPELL_EFFECT, { GetTriggerUnit = hero })
    expect(log).toEqual({ "unit condition", "unit action", "filtered condition", "filtered action" })
  end)

  it("reaches GetTriggerPlayer for a playerevent", function()
    local game = startGame()
    local log = {}
    TriggerRegisterPlayerEvent(logged(log, "player"), Player(2), EVENT_PLAYER_END_CINEMATIC)
    TriggerRegisterPlayerEvent(logged(log, "other player"), Player(3), EVENT_PLAYER_END_CINEMATIC)
    game.fire(EVENT_PLAYER_END_CINEMATIC, { GetTriggerPlayer = Player(2) })
    expect(log).toEqual({ "player condition", "player action" })
  end)

  it("needs no subject for a gameevent", function()
    local game = startGame()
    local log = {}
    TriggerRegisterGameEvent(logged(log, "game"), EVENT_GAME_LOADED)
    TriggerRegisterGameEvent(logged(log, "other event"), EVENT_GAME_SAVE)
    game.fire(EVENT_GAME_LOADED, {})
    expect(log).toEqual({ "game condition", "game action" })
  end)

  it("names the response a context lacks", function()
    local game = startGame()
    local cases = {
      { EVENT_PLAYER_UNIT_SPELL_EFFECT, "game.fire: EVENT_PLAYER_UNIT_SPELL_EFFECT is a playerunitevent, so its Firing context needs GetTriggerUnit" },
      { EVENT_UNIT_SPELL_EFFECT, "game.fire: EVENT_UNIT_SPELL_EFFECT is a unitevent, so its Firing context needs GetTriggerUnit" },
      { EVENT_PLAYER_END_CINEMATIC, "game.fire: EVENT_PLAYER_END_CINEMATIC is a playerevent, so its Firing context needs GetTriggerPlayer" },
    }
    for _, case in ipairs(cases) do
      expect(function() game.fire(case[1], { GetSpellAbilityId = 1 }) end).toThrow(case[2])
    end
  end)

  it("refuses what is not an event of the four families", function()
    local game = startGame()
    local message = "game.fire: expected an event of the game, a playerunitevent, a unitevent, a playerevent or a gameevent"
    expect(function() game.fire(EVENT_WIDGET_DEATH, {}) end).toThrow(message)
    expect(function() game.fire(CreateTrigger(), {}) end).toThrow(message)
    expect(function() game.fire(nil, {}) end).toThrow(message)
  end)
end)

describe("the Firing context", function()
  it("answers every response it names during the dispatch and nil outside it", function()
    local game = startGame()
    local hero = caster()
    local answered = {}
    local trigger = CreateTrigger()
    TriggerAddAction(trigger, function()
      answered.unit = GetSpellAbilityUnit()
      answered.id = GetSpellAbilityId()
    end)
    TriggerRegisterPlayerUnitEvent(trigger, Player(0), EVENT_PLAYER_UNIT_SPELL_EFFECT, nil)
    game.fire(EVENT_PLAYER_UNIT_SPELL_EFFECT, {
      GetTriggerUnit = hero,
      GetSpellAbilityUnit = hero,
      GetSpellAbilityId = FourCC("AHtb"),
    })
    expect(answered.unit).toBe(hero)
    expect(answered.id).toBe(FourCC("AHtb"))
    expect(GetSpellAbilityUnit()).toBeUndefined()
    expect(GetSpellAbilityId()).toBeUndefined()
  end)

  it("answers a Native without a response Stub too, nil after the dispatch", function()
    local game = startGame()
    local buyer = caster(1)
    local answered
    local trigger = CreateTrigger()
    TriggerAddAction(trigger, function() answered = GetBuyingUnit() end)
    TriggerRegisterPlayerUnitEvent(trigger, Player(0), EVENT_PLAYER_UNIT_SELL, nil)
    game.fire(EVENT_PLAYER_UNIT_SELL, { GetTriggerUnit = caster(), GetBuyingUnit = buyer })
    expect(answered).toBe(buyer)
    expect(GetBuyingUnit()).toBeUndefined()
  end)

  it("gives a Native of another Stub its own answer back after the dispatch", function()
    local game = startGame()
    local answered
    local trigger = CreateTrigger()
    TriggerAddAction(trigger, function() answered = GetLocalPlayer() end)
    TriggerRegisterGameEvent(trigger, EVENT_GAME_LOADED)
    game.fire(EVENT_GAME_LOADED, { GetLocalPlayer = Player(2) })
    expect(answered).toBe(Player(2))
    expect(GetLocalPlayer()).toBe(Player(0))
  end)

  it("writes no state and records no call of its own", function()
    local game = startGame()
    local hero = caster()
    local mark = #runner.stubCalls()
    game.fire(EVENT_PLAYER_UNIT_DEATH, { GetTriggerUnit = hero })
    expect(#runner.stubCalls()).toEqual(mark)
    expect(GetOwningPlayer(hero)).toBe(Player(0))
    expect(GetTriggerUnit()).toBeUndefined()
  end)

  it("lets a handler's error out of game.fire, the context put back", function()
    local game = startGame()
    local trigger = CreateTrigger()
    TriggerAddAction(trigger, function() error("boom", 0) end)
    TriggerRegisterGameEvent(trigger, EVENT_GAME_LOADED)
    expect(function()
      game.fire(EVENT_GAME_LOADED, { GetLocalPlayer = Player(2) })
    end).toThrow("boom")
    expect(GetLocalPlayer()).toBe(Player(0))
  end)

  it("gives the game no emit", function()
    local game = startGame()
    expect(game.emit).toBeUndefined()
  end)
end)
