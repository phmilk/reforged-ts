-- Hand-written stand-in for a compiled kill.test.ts on reforged-test/map:
-- game.kill, the first Game action. The dispatch copies the case
-- KillUnit(live) of the Probe of unit event timing,
-- docs/research/unit-event-timing.md ("The firings, per case" and "What the
-- response Natives answer in a handler"): the three death events, their
-- order, the unit already dead in a handler, and the killer answered by the
-- player unit death and the unit death only, never by the widget death.
local map = require("lua_modules.reforged-test.map.index")
local it, describe, expect, startGame = map.it, map.describe, map.expect, map.startGame

-- A trigger that appends `name` to `log` when its condition runs and again
-- when its action runs, as the Probe's triggers counted conditions and
-- actions apart, and reads the responses in its action.
local function watch(log, readings, name)
  local trigger = CreateTrigger()
  TriggerAddCondition(trigger, Condition(function()
    log[#log + 1] = name .. " condition"
    return true
  end))
  TriggerAddAction(trigger, function()
    log[#log + 1] = name .. " action"
    readings[name] = {
      triggerUnit = GetTriggerUnit(),
      triggerWidget = GetTriggerWidget(),
      triggerPlayer = GetTriggerPlayer(),
      dyingUnit = GetDyingUnit(),
      killingUnit = GetKillingUnit(),
      eventId = GetTriggerEventId(),
      alive = UnitAlive(GetTriggerUnit()),
      life = GetWidgetLife(GetTriggerUnit()),
    }
  end)
  return trigger
end

-- Registers, as the Probe did, the player unit death of Player(0) and
-- Player(1) first, then the unit death and the widget death of each unit
-- given. Returns the log, one name per condition and per action, and the
-- readings each action took, by name.
local function watchDeaths(...)
  local log, readings = {}, {}
  for slot = 0, 1 do
    TriggerRegisterPlayerUnitEvent(
      watch(log, readings, "EVENT_PLAYER_UNIT_DEATH of " .. slot), Player(slot), EVENT_PLAYER_UNIT_DEATH, nil)
  end
  for _, unit in ipairs({ ... }) do
    TriggerRegisterUnitEvent(watch(log, readings, "EVENT_UNIT_DEATH"), unit, EVENT_UNIT_DEATH)
    TriggerRegisterDeathEvent(watch(log, readings, "widget death"), unit)
  end
  return log, readings
end

-- The log of a trigger per name: its condition, then its action.
local function fired(...)
  local log = {}
  for _, name in ipairs({ ... }) do
    log[#log + 1] = name .. " condition"
    log[#log + 1] = name .. " action"
  end
  return log
end

local THREE_DEATHS = fired("widget death", "EVENT_PLAYER_UNIT_DEATH of 0", "EVENT_UNIT_DEATH")

local function footman(slot)
  return CreateUnit(Player(slot or 0), FourCC("hfoo"), 0, 0, 0)
end

local function knight(slot)
  return CreateUnit(Player(slot or 1), FourCC("hkni"), 0, 0, 0)
end

describe("game.kill", function()
  it("dispatches the widget death, the player unit death and the unit death, the unit already dead", function()
    local game = startGame()
    local unit = footman()
    local log, readings = watchDeaths(unit)
    game.kill(unit)
    expect(log).toEqual(THREE_DEATHS)
    expect(readings["widget death"]).toEqual({
      triggerUnit = unit, triggerWidget = unit, eventId = EVENT_WIDGET_DEATH, alive = false, life = 0,
    })
    for _, name in ipairs({ "EVENT_PLAYER_UNIT_DEATH of 0", "EVENT_UNIT_DEATH" }) do
      expect(readings[name]).toEqual({
        triggerUnit = unit, triggerPlayer = Player(0), dyingUnit = unit,
        eventId = name == "EVENT_UNIT_DEATH" and EVENT_UNIT_DEATH or EVENT_PLAYER_UNIT_DEATH,
        alive = false, life = 0,
      })
    end
  end)

  it("answers by as GetKillingUnit in the player unit death and the unit death, and nil in the widget death", function()
    local game = startGame()
    local unit, killer = footman(), knight()
    local log, readings = watchDeaths(unit)
    game.kill(unit, { by = killer })
    expect(log).toEqual(THREE_DEATHS)
    expect(readings["widget death"].killingUnit).toBeUndefined()
    expect(readings["EVENT_PLAYER_UNIT_DEATH of 0"].killingUnit).toBe(killer)
    expect(readings["EVENT_UNIT_DEATH"].killingUnit).toBe(killer)
    -- The death is the dying unit's: the killer's owner hears nothing.
    expect(readings["EVENT_PLAYER_UNIT_DEATH of 1"]).toBeUndefined()
    expect(GetKillingUnit()).toBeUndefined()
  end)

  it("takes anything with .handle, for the unit and for the killer", function()
    local game = startGame()
    local unit, killer = footman(), knight()
    local _, readings = watchDeaths(unit)
    game.kill({ handle = unit }, { by = { handle = killer } })
    expect(UnitAlive(unit)).toBe(false)
    expect(readings["EVENT_UNIT_DEATH"]).toMatchObject({ dyingUnit = unit, killingUnit = killer })
  end)

  it("accepts a killer already dead", function()
    local game = startGame()
    local unit, killer = footman(), knight()
    local _, readings = watchDeaths(unit)
    game.kill(killer)
    game.kill(unit, { by = killer })
    expect(readings["EVENT_UNIT_DEATH"].killingUnit).toBe(killer)
  end)

  it("leaves the unit dead, the killer alive, and returns nothing", function()
    local game = startGame()
    local unit, killer = footman(), knight()
    expect(select("#", game.kill(unit, { by = killer }))).toBe(0)
    expect(UnitAlive(unit)).toBe(false)
    expect(GetWidgetLife(unit)).toBe(0)
    expect(UnitAlive(killer)).toBe(true)
    expect(GetOwningPlayer(unit)).toBe(Player(0))
  end)

  it("is not the Native: it records no KillUnit call", function()
    local game = startGame()
    game.kill(footman())
    expect(KillUnit)["not"].toHaveBeenCalled()
  end)

  it("runs a chain of handlers inside the action: a death handler that kills", function()
    local game = startGame()
    local first, second = footman(), footman()
    local order = {}
    local trigger = CreateTrigger()
    TriggerAddAction(trigger, function()
      order[#order + 1] = GetDyingUnit()
      if rawequal(GetDyingUnit(), first) then
        KillUnit(second)
      end
    end)
    TriggerRegisterPlayerUnitEvent(trigger, Player(0), EVENT_PLAYER_UNIT_DEATH, nil)
    game.kill(first)
    expect(order).toEqual({ first, second })
  end)

  it("throws a handler's error out of the action", function()
    local game = startGame()
    local unit = footman()
    local trigger = CreateTrigger()
    TriggerAddAction(trigger, function() error("the handler broke", 0) end)
    TriggerRegisterUnitEvent(trigger, unit, EVENT_UNIT_DEATH)
    expect(function() game.kill(unit) end).toThrow("the handler broke")
  end)

  it("has no createUnit: a test creates units with the map's own API", function()
    local game = startGame()
    expect(game.createUnit).toBeUndefined()
  end)
end)

describe("game.kill refuses what the game refuses", function()
  it("a unit already dead, by game.kill or by KillUnit", function()
    local game = startGame()
    local first, second = footman(), footman()
    game.kill(first)
    KillUnit(second)
    local log = watchDeaths(first, second)
    expect(function() game.kill(first) end).toThrow(
      "game.kill: " .. __stub_format(first) .. " is already dead, and the game kills no unit twice")
    expect(function() game.kill(second) end).toThrow(
      "game.kill: " .. __stub_format(second) .. " is already dead, and the game kills no unit twice")
    expect(log).toEqual({})
  end)

  it("a removed unit, alive or dead", function()
    local game = startGame()
    local alive, dead = footman(), footman()
    KillUnit(dead)
    RemoveUnit(alive)
    RemoveUnit(dead)
    local log = watchDeaths(alive, dead)
    expect(function() game.kill(alive) end).toThrow(
      "game.kill: " .. __stub_format(alive) .. " was removed from the game")
    expect(function() game.kill(dead) end).toThrow(
      "game.kill: " .. __stub_format(dead) .. " was removed from the game")
    expect(log).toEqual({})
    expect(UnitAlive(alive)).toBe(true)
  end)

  it("a removed killer, the unit left alive", function()
    local game = startGame()
    local unit, killer = footman(), knight()
    RemoveUnit(killer)
    local log = watchDeaths(unit)
    expect(function() game.kill(unit, { by = killer }) end).toThrow(
      "game.kill: the killer, " .. __stub_format(killer) .. ", was removed from the game")
    expect(log).toEqual({})
    expect(UnitAlive(unit)).toBe(true)
  end)

  it("what is not a unit: a bare number, nothing, a player", function()
    local game = startGame()
    local NOT_A_UNIT = "game.kill: expected a unit, its Handle or anything with .handle, such as a Unit of the library"
    expect(function() game.kill(GetHandleId(footman())) end).toThrow(NOT_A_UNIT)
    expect(function() game.kill(nil) end).toThrow(NOT_A_UNIT)
    expect(function() game.kill(Player(0)) end).toThrow(NOT_A_UNIT)
    expect(function() game.kill({ handle = Player(0) }) end).toThrow(NOT_A_UNIT)
  end)

  it("a killer that is not a unit, the unit left alive", function()
    local game = startGame()
    local unit = footman()
    local NOT_A_KILLER =
      'game.kill: expected "by" to be a unit, its Handle or anything with .handle, such as a Unit of the library'
    expect(function() game.kill(unit, { by = 7 }) end).toThrow(NOT_A_KILLER)
    expect(function() game.kill(unit, { by = Player(1) }) end).toThrow(NOT_A_KILLER)
    expect(UnitAlive(unit)).toBe(true)
  end)

  it("names the test's line, not the harness's", function()
    local game = startGame()
    local unit = footman()
    game.kill(unit)
    local ok, message = pcall(function() game.kill(unit) end)
    expect(ok).toBe(false)
    expect(message).toMatch("kill_test.lua:")
  end)
end)
