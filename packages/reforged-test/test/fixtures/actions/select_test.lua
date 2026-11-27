-- Hand-written stand-in for a compiled select.test.ts on reforged-test/map:
-- game.select, game.deselect and the selection Natives. The cases copy the
-- Probe of the selection events, docs/research/selection-events.md: which
-- Triggers a selection and a deselection fire and in which order, what a
-- handler reads, what SelectUnit and ClearSelection write and fire, and
-- what GroupEnumUnitsSelected answers.
local map = require("lua_modules.reforged-test.map.index")
local it, describe, expect, startGame = map.it, map.describe, map.expect, map.startGame

local function footman(slot)
  return CreateUnit(Player(slot or 0), FourCC("hfoo"), 0, 0, 0)
end

-- The units GroupEnumUnitsSelected answers for a player, in a new group.
local function selection(player, filter)
  local group = CreateGroup()
  GroupEnumUnitsSelected(group, player, filter)
  local units = {}
  for index = 0, BlzGroupGetSize(group) - 1 do
    units[#units + 1] = BlzGroupUnitAt(group, index)
  end
  return units
end

-- A trigger that appends `name` to `log` when its condition runs and again
-- when its action runs, as the Probe's triggers did, and reads the
-- responses and the selection of Player(0) in its action.
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
      triggerPlayer = GetTriggerPlayer(),
      eventId = GetTriggerEventId(),
      isUnitSelected = IsUnitSelected(GetTriggerUnit(), Player(0)),
      enumerated = selection(Player(0)),
    }
  end)
  return trigger
end

local function watchPlayers(log, readings)
  for slot = 0, 1 do
    TriggerRegisterPlayerUnitEvent(
      watch(log, readings, "EVENT_PLAYER_UNIT_SELECTED of " .. slot), Player(slot), EVENT_PLAYER_UNIT_SELECTED, nil)
    TriggerRegisterPlayerUnitEvent(
      watch(log, readings, "EVENT_PLAYER_UNIT_DESELECTED of " .. slot), Player(slot), EVENT_PLAYER_UNIT_DESELECTED, nil)
  end
end

local function watchUnit(log, readings, unit)
  TriggerRegisterUnitEvent(watch(log, readings, "EVENT_UNIT_SELECTED"), unit, EVENT_UNIT_SELECTED)
  TriggerRegisterUnitEvent(watch(log, readings, "EVENT_UNIT_DESELECTED"), unit, EVENT_UNIT_DESELECTED)
end

-- Registers the selection events of Player(0) and Player(1), then those of
-- the unit; with `unitFirst`, the unit's before the players', the two
-- orders of the Probe. Returns the log and the readings, by name.
local function watchSelection(unit, unitFirst)
  local log, readings = {}, {}
  if unitFirst then
    watchUnit(log, readings, unit)
    watchPlayers(log, readings)
  else
    watchPlayers(log, readings)
    watchUnit(log, readings, unit)
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

local SELECTED = fired("EVENT_PLAYER_UNIT_SELECTED of 0", "EVENT_UNIT_SELECTED")
local DESELECTED = fired("EVENT_PLAYER_UNIT_DESELECTED of 0", "EVENT_UNIT_DESELECTED")


describe("game.select", function()
  for _, unitFirst in ipairs({ false, true }) do
    local order = unitFirst and "the unit's event registered first" or "the player's event registered first"

    it("dispatches the player unit event of the player who selects, then the unit's: " .. order, function()
      local game = startGame()
      local unit = footman()
      local log, readings = watchSelection(unit, unitFirst)
      game.select(Player(0), unit)
      expect(log).toEqual(SELECTED)
      -- In a handler IsUnitSelected already answers true, and
      -- GroupEnumUnitsSelected does not hold the unit yet.
      expect(readings["EVENT_PLAYER_UNIT_SELECTED of 0"]).toEqual({
        triggerUnit = unit, triggerPlayer = Player(0), eventId = EVENT_PLAYER_UNIT_SELECTED,
        isUnitSelected = true, enumerated = {},
      })
      expect(readings["EVENT_UNIT_SELECTED"]).toEqual({
        triggerUnit = unit, triggerPlayer = Player(0), eventId = EVENT_UNIT_SELECTED,
        isUnitSelected = true, enumerated = {},
      })
    end)
  end

  it("writes the player's selection, read by IsUnitSelected and GroupEnumUnitsSelected", function()
    local game = startGame()
    local unit = footman()
    expect(IsUnitSelected(unit, Player(0))).toBe(false)
    expect(game.select(Player(0), unit)).toBeUndefined()
    expect(IsUnitSelected(unit, Player(0))).toBe(true)
    expect(selection(Player(0))).toEqual({ unit })
    -- The selection is that player's alone.
    expect(IsUnitSelected(unit, Player(1))).toBe(false)
    expect(selection(Player(1))).toEqual({})
    expect(GetTriggerUnit()).toBeUndefined()
  end)

  it("adds to the selection and clears nothing", function()
    local game = startGame()
    local first, second, third = footman(), footman(), footman()
    game.select(Player(0), first)
    local log = watchSelection(first)
    game.select(Player(0), second)
    game.select(Player(0), third)
    expect(selection(Player(0))).toEqual({ first, second, third })
    -- No deselection of the unit selected before.
    expect(log).toEqual(fired("EVENT_PLAYER_UNIT_SELECTED of 0", "EVENT_PLAYER_UNIT_SELECTED of 0"))
  end)

  it("selects another player's unit: the selecting player's event, and the owner as the unit event's player", function()
    local game = startGame()
    local foe = footman(1)
    local log, readings = watchSelection(foe)
    game.select(Player(0), foe)
    -- The registration of Player(1), the owner, hears nothing.
    expect(log).toEqual(SELECTED)
    expect(readings["EVENT_PLAYER_UNIT_SELECTED of 0"].triggerPlayer).toBe(Player(0))
    expect(readings["EVENT_UNIT_SELECTED"].triggerPlayer).toBe(Player(1))
    expect(IsUnitSelected(foe, Player(0))).toBe(true)
    expect(IsUnitSelected(foe, Player(1))).toBe(false)
  end)

  it("keeps a selection per player", function()
    local game = startGame()
    local unit = footman()
    local log = watchSelection(unit)
    game.select(Player(0), unit)
    game.select(Player(1), unit)
    expect(log).toEqual(fired(
      "EVENT_PLAYER_UNIT_SELECTED of 0", "EVENT_UNIT_SELECTED",
      "EVENT_PLAYER_UNIT_SELECTED of 1", "EVENT_UNIT_SELECTED"))
    expect(selection(Player(0))).toEqual({ unit })
    expect(selection(Player(1))).toEqual({ unit })
  end)

  it("takes anything with .handle, for the player and for the unit", function()
    local game = startGame()
    local unit = footman()
    game.select({ handle = Player(0) }, { handle = unit })
    expect(IsUnitSelected(unit, Player(0))).toBe(true)
    game.deselect({ handle = Player(0) }, { handle = unit })
    expect(IsUnitSelected(unit, Player(0))).toBe(false)
  end)

  it("throws a handler's error out of the action", function()
    local game = startGame()
    local unit = footman()
    local trigger = CreateTrigger()
    TriggerRegisterUnitEvent(trigger, unit, EVENT_UNIT_SELECTED)
    TriggerAddAction(trigger, function()
      error("the handler broke", 0)
    end)
    expect(function() game.select(Player(0), unit) end).toThrow("the handler broke")
  end)
end)

describe("game.deselect", function()
  for _, unitFirst in ipairs({ false, true }) do
    local order = unitFirst and "the unit's event registered first" or "the player's event registered first"

    it("dispatches the player unit event of the player who deselects, then the unit's: " .. order, function()
      local game = startGame()
      local unit = footman()
      game.select(Player(0), unit)
      local log, readings = watchSelection(unit, unitFirst)
      game.deselect(Player(0), unit)
      expect(log).toEqual(DESELECTED)
      -- In a handler the unit is still selected, for both readers.
      expect(readings["EVENT_PLAYER_UNIT_DESELECTED of 0"]).toEqual({
        triggerUnit = unit, triggerPlayer = Player(0), eventId = EVENT_PLAYER_UNIT_DESELECTED,
        isUnitSelected = true, enumerated = { unit },
      })
      expect(readings["EVENT_UNIT_DESELECTED"]).toEqual({
        triggerUnit = unit, triggerPlayer = Player(0), eventId = EVENT_UNIT_DESELECTED,
        isUnitSelected = true, enumerated = { unit },
      })
    end)
  end

  it("takes the unit out of the player's selection, the others kept in their order", function()
    local game = startGame()
    local first, second, third = footman(), footman(), footman()
    game.select(Player(0), first)
    game.select(Player(0), second)
    game.select(Player(0), third)
    game.select(Player(1), second)
    expect(game.deselect(Player(0), second)).toBeUndefined()
    expect(IsUnitSelected(second, Player(0))).toBe(false)
    expect(selection(Player(0))).toEqual({ first, third })
    expect(selection(Player(1))).toEqual({ second })
  end)

  it("deselects another player's unit: the owner as the unit event's player", function()
    local game = startGame()
    local foe = footman(1)
    game.select(Player(0), foe)
    local log, readings = watchSelection(foe)
    game.deselect(Player(0), foe)
    expect(log).toEqual(DESELECTED)
    expect(readings["EVENT_PLAYER_UNIT_DESELECTED of 0"].triggerPlayer).toBe(Player(0))
    expect(readings["EVENT_UNIT_DESELECTED"].triggerPlayer).toBe(Player(1))
  end)

  it("deselects a unit that died or was removed while selected", function()
    local game = startGame()
    local dead, removed = footman(), footman()
    game.select(Player(0), dead)
    game.select(Player(0), removed)
    -- A death and a removal write nothing derived: the selection is kept.
    KillUnit(dead)
    RemoveUnit(removed)
    expect(selection(Player(0))).toEqual({ dead, removed })
    game.deselect(Player(0), dead)
    game.deselect(Player(0), removed)
    expect(selection(Player(0))).toEqual({})
  end)
end)

describe("game.select and game.deselect refuse what the game refuses", function()
  local NOT_A_UNIT = "expected a unit, its Handle or anything with .handle, such as a Unit of the library"
  local NOT_A_PLAYER =
    "expected a player of the Test game, its Handle or anything with .handle, such as Player(0)"

  it("selecting a unit already selected", function()
    local game = startGame()
    local unit = footman()
    game.select(Player(0), unit)
    local log = watchSelection(unit)
    expect(function() game.select(Player(0), unit) end).toThrow(
      "game.select: " .. __stub_format(unit) .. " is already in the selection of Player(0)")
    expect(log).toEqual({})
    expect(selection(Player(0))).toEqual({ unit })
  end)

  it("selecting a unit SelectUnit selected for the local player", function()
    local game = startGame()
    local unit = footman()
    SelectUnit(unit, true)
    expect(function() game.select(Player(0), unit) end).toThrow(
      "game.select: " .. __stub_format(unit) .. " is already in the selection of Player(0)")
  end)

  it("selecting a dead unit", function()
    local game = startGame()
    local unit = footman()
    KillUnit(unit)
    local log = watchSelection(unit)
    expect(function() game.select(Player(0), unit) end).toThrow(
      "game.select: " .. __stub_format(unit) .. " is dead, and the game selects no dead unit")
    expect(log).toEqual({})
    expect(IsUnitSelected(unit, Player(0))).toBe(false)
  end)

  it("selecting a removed unit, alive or dead", function()
    local game = startGame()
    local alive, dead = footman(), footman()
    KillUnit(dead)
    RemoveUnit(alive)
    RemoveUnit(dead)
    expect(function() game.select(Player(0), alive) end).toThrow(
      "game.select: " .. __stub_format(alive) .. " was removed from the game")
    expect(function() game.select(Player(0), dead) end).toThrow(
      "game.select: " .. __stub_format(dead) .. " was removed from the game")
    expect(selection(Player(0))).toEqual({})
  end)

  it("deselecting a unit that is not selected", function()
    local game = startGame()
    local unit = footman()
    game.select(Player(1), unit)
    local log = watchSelection(unit)
    expect(function() game.deselect(Player(0), unit) end).toThrow(
      "game.deselect: " .. __stub_format(unit) .. " is not in the selection of Player(0)")
    expect(log).toEqual({})
    expect(selection(Player(1))).toEqual({ unit })
  end)

  it("a player who is not playing: an empty slot", function()
    local game = startGame()
    local unit = footman()
    expect(function() game.select(Player(2), unit) end).toThrow(
      "game.select: Player(2) is not playing: its slot is empty")
    expect(function() game.deselect(Player(2), unit) end).toThrow(
      "game.deselect: Player(2) is not playing: its slot is empty")
    expect(IsUnitSelected(unit, Player(2))).toBe(false)
  end)

  it("what is not a player or not a unit", function()
    local game = startGame()
    local unit = footman()
    expect(function() game.select(0, unit) end).toThrow("game.select: " .. NOT_A_PLAYER)
    expect(function() game.select(unit, unit) end).toThrow("game.select: " .. NOT_A_PLAYER)
    expect(function() game.select(map.newHandle("player"), unit) end).toThrow("game.select: " .. NOT_A_PLAYER)
    expect(function() game.select(Player(0), GetHandleId(unit)) end).toThrow("game.select: " .. NOT_A_UNIT)
    expect(function() game.select(Player(0), nil) end).toThrow("game.select: " .. NOT_A_UNIT)
    expect(function() game.select(Player(0), Player(1)) end).toThrow("game.select: " .. NOT_A_UNIT)
    expect(function() game.deselect(nil, unit) end).toThrow("game.deselect: " .. NOT_A_PLAYER)
    expect(function() game.deselect(Player(0), 7) end).toThrow("game.deselect: " .. NOT_A_UNIT)
  end)

  it("names the test's line, not the harness's", function()
    local game = startGame()
    local unit = footman()
    for _, act in ipairs({ game.select, game.deselect }) do
      local ok, message = pcall(function() act(Player(2), unit) end)
      expect(ok).toBe(false)
      expect(message).toMatch("select_test.lua:")
    end
  end)
end)

-- The steps of the Probe made with SelectUnit and ClearSelection: no event
-- before the Native returns. In the game the selection events come later,
-- on no order of the test's; the stubs fire none.
describe("SelectUnit and ClearSelection", function()
  it("write the local player's selection, the one game.select writes, and dispatch nothing", function()
    local game = startGame()
    local own, foe = footman(), footman(1)
    local log = watchSelection(own)
    watchUnit(log, {}, foe)
    SelectUnit(own, true)
    SelectUnit(foe, true)
    expect(log).toEqual({})
    expect(IsUnitSelected(own, Player(0))).toBe(true)
    expect(selection(Player(0))).toEqual({ own, foe })
    expect(selection(Player(1))).toEqual({})
    -- The same selection: game.deselect takes out what SelectUnit put in.
    game.deselect(Player(0), own)
    expect(selection(Player(0))).toEqual({ foe })
    SelectUnit(foe, false)
    expect(selection(Player(0))).toEqual({})
    expect(log).toEqual(DESELECTED)
  end)

  it("SelectUnit leaves a unit already selected in its place, and one not selected out", function()
    startGame()
    local first, second = footman(), footman()
    SelectUnit(first, true)
    SelectUnit(second, true)
    SelectUnit(first, true)
    expect(selection(Player(0))).toEqual({ first, second })
    SelectUnit(first, false)
    SelectUnit(first, false)
    expect(selection(Player(0))).toEqual({ second })
  end)

  it("SelectUnit selects no dead and no removed unit", function()
    startGame()
    local dead, removed = footman(), footman()
    KillUnit(dead)
    RemoveUnit(removed)
    SelectUnit(dead, true)
    SelectUnit(removed, true)
    expect(IsUnitSelected(dead, Player(0))).toBe(false)
    expect(IsUnitSelected(removed, Player(0))).toBe(false)
    expect(selection(Player(0))).toEqual({})
  end)

  it("ClearSelection empties the local player's selection, and no other player's", function()
    local game = startGame()
    local first, second = footman(), footman()
    game.select(Player(0), first)
    game.select(Player(0), second)
    game.select(Player(1), first)
    local log = watchSelection(first)
    ClearSelection()
    expect(log).toEqual({})
    expect(selection(Player(0))).toEqual({})
    expect(IsUnitSelected(first, Player(0))).toBe(false)
    expect(selection(Player(1))).toEqual({ first })
  end)

  it("act for the local player the test set", function()
    local game = startGame()
    local unit = footman()
    game.setLocalPlayer(Player(1))
    SelectUnit(unit, true)
    expect(IsUnitSelected(unit, Player(1))).toBe(true)
    expect(IsUnitSelected(unit, Player(0))).toBe(false)
    ClearSelection()
    expect(selection(Player(1))).toEqual({})
  end)
end)

-- The three GROUP records of the Probe.
describe("GroupEnumUnitsSelected", function()
  it("empties the group first, then holds the selection in the order it was made", function()
    local game = startGame()
    local other, second, third = footman(), footman(), footman()
    game.select(Player(0), second)
    game.select(Player(0), third)
    local group = CreateGroup()
    GroupAddUnit(group, other)
    GroupEnumUnitsSelected(group, Player(0), nil)
    expect(BlzGroupGetSize(group)).toBe(2)
    expect(BlzGroupUnitAt(group, 0)).toBe(second)
    expect(BlzGroupUnitAt(group, 1)).toBe(third)
    -- A player who selected nothing leaves it empty.
    GroupEnumUnitsSelected(group, Player(1), nil)
    expect(BlzGroupGetSize(group)).toBe(0)
  end)

  it("asks its filter about each selected unit, as GetFilterUnit, and keeps the ones it accepts", function()
    local game = startGame()
    local second, third = footman(), footman()
    game.select(Player(0), second)
    game.select(Player(0), third)
    local asked = {}
    local kept = selection(Player(0), Filter(function()
      asked[#asked + 1] = GetFilterUnit()
      return GetFilterUnit() == third
    end))
    expect(asked).toEqual({ second, third })
    expect(kept).toEqual({ third })
    expect(GetFilterUnit()).toBeUndefined()
  end)
end)
