-- Hand-written stand-in for a compiled dispatching.test.ts on
-- reforged-test/map: the Dispatching Natives. Each case copies a case of the
-- Probe of unit event timing, docs/research/unit-event-timing.md ("The
-- firings, per case" and "What the response Natives answer in a handler"):
-- the events each Native fires inside the call, their order, what a handler
-- reads, and nothing where the game fires nothing.
local map = require("lua_modules.reforged-test.map.index")
local it, describe, expect, startGame = map.it, map.describe, map.expect, map.startGame

local PLAYER_EVENTS = {
  "EVENT_PLAYER_UNIT_DEATH", "EVENT_PLAYER_UNIT_CHANGE_OWNER",
  "EVENT_PLAYER_UNIT_PICKUP_ITEM", "EVENT_PLAYER_UNIT_DROP_ITEM",
}
local UNIT_EVENTS = {
  "EVENT_UNIT_DEATH", "EVENT_UNIT_CHANGE_OWNER", "EVENT_UNIT_PICKUP_ITEM", "EVENT_UNIT_DROP_ITEM",
}

-- A trigger that appends `name` to `log` when its condition runs and again
-- when its action runs, as the Probe's triggers counted conditions and
-- actions apart, and calls `read` in its action.
local function watch(log, name, read)
  local trigger = CreateTrigger()
  TriggerAddCondition(trigger, Condition(function()
    log[#log + 1] = name .. " condition"
    return true
  end))
  TriggerAddAction(trigger, function()
    log[#log + 1] = name .. " action"
    if read ~= nil then
      read(name)
    end
  end)
  return trigger
end

-- Registers, as the Probe did, the player unit events of Player(0) and
-- Player(1) first, then the unit events and the widget death of each unit
-- given. Returns the log, one name per condition and per action, and the
-- readings each action took, by name.
local function watchAll(...)
  local log, readings = {}, {}
  local function read(name)
    readings[name] = {
      triggerUnit = GetTriggerUnit(),
      triggerWidget = GetTriggerWidget(),
      triggerPlayer = GetTriggerPlayer(),
      dyingUnit = GetDyingUnit(),
      killingUnit = GetKillingUnit(),
      changingUnit = GetChangingUnit(),
      previousOwner = GetChangingUnitPrevOwner(),
      manipulatingUnit = GetManipulatingUnit(),
      manipulatedItem = GetManipulatedItem(),
      eventId = GetTriggerEventId(),
    }
    local unit = GetTriggerUnit()
    if unit ~= nil then
      readings[name].alive = UnitAlive(unit)
      readings[name].owner = GetOwningPlayer(unit)
      local item = GetManipulatedItem()
      if item ~= nil then
        readings[name].hasItem = UnitHasItem(unit, item)
      end
    end
  end
  for slot = 0, 1 do
    for _, event in ipairs(PLAYER_EVENTS) do
      TriggerRegisterPlayerUnitEvent(watch(log, event .. " of " .. slot, read), Player(slot), _G[event], nil)
    end
  end
  for _, unit in ipairs({ ... }) do
    for _, event in ipairs(UNIT_EVENTS) do
      TriggerRegisterUnitEvent(watch(log, event, read), unit, _G[event])
    end
    TriggerRegisterDeathEvent(watch(log, "widget death", read), unit)
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

local function footman(slot)
  return CreateUnit(Player(slot or 0), FourCC("hfoo"), 0, 0, 0)
end

describe("KillUnit", function()
  it("dispatches the widget death, the player unit death and the unit death, the unit already dead", function()
    startGame()
    local unit = footman()
    local log, readings = watchAll(unit)
    KillUnit(unit)
    expect(log).toEqual(fired("widget death", "EVENT_PLAYER_UNIT_DEATH of 0", "EVENT_UNIT_DEATH"))
    expect(readings["widget death"]).toEqual({
      triggerUnit = unit, triggerWidget = unit, eventId = EVENT_WIDGET_DEATH, alive = false, owner = Player(0),
    })
    for _, name in ipairs({ "EVENT_PLAYER_UNIT_DEATH of 0", "EVENT_UNIT_DEATH" }) do
      expect(readings[name]).toEqual({
        triggerUnit = unit, triggerPlayer = Player(0), dyingUnit = unit,
        eventId = name == "EVENT_UNIT_DEATH" and EVENT_UNIT_DEATH or EVENT_PLAYER_UNIT_DEATH,
        alive = false, owner = Player(0),
      })
    end
  end)

  it("fires nothing for a unit already dead", function()
    startGame()
    local unit = footman()
    KillUnit(unit)
    local log = watchAll(unit)
    KillUnit(unit)
    expect(log).toEqual({})
  end)

  it("leaves the unit dead: UnitAlive false, its life 0", function()
    startGame()
    local unit = footman()
    expect(UnitAlive(unit)).toBe(true)
    KillUnit(unit)
    expect(UnitAlive(unit)).toBe(false)
    expect(GetWidgetLife(unit)).toEqual(0)
    expect(GetUnitState(unit, UNIT_STATE_LIFE)).toEqual(0)
  end)

  it("keeps no hit points: a live unit's life has no answer", function()
    startGame()
    local unit = footman()
    expect(function() GetWidgetLife(unit) end).toThrow("GetWidgetLife: the stubs keep no hit points")
    expect(function() GetUnitState(unit, UNIT_STATE_LIFE) end).toThrow("GetUnitState: the stubs keep no hit points")
  end)

  it("runs a chain of handlers inside the call: a death handler that kills", function()
    startGame()
    local first, second = footman(), footman()
    local order = {}
    local trigger = CreateTrigger()
    TriggerAddAction(trigger, function()
      local dying = GetDyingUnit()
      order[#order + 1] = dying
      if dying == first then
        KillUnit(second)
      end
    end)
    TriggerRegisterPlayerUnitEvent(trigger, Player(0), EVENT_PLAYER_UNIT_DEATH, nil)
    KillUnit(first)
    expect(order).toEqual({ first, second })
  end)

  it("leaves RemoveUnit dispatching nothing", function()
    startGame()
    local unit = footman()
    local log = watchAll(unit)
    RemoveUnit(unit)
    expect(log).toEqual({})
    expect(UnitAlive(unit)).toBe(true)
  end)
end)

describe("SetUnitOwner", function()
  it("dispatches the change of owner of the new owner, then the unit's, the owner already changed", function()
    startGame()
    local unit = footman()
    local log, readings = watchAll(unit)
    SetUnitOwner(unit, Player(1), true)
    expect(log).toEqual(fired("EVENT_PLAYER_UNIT_CHANGE_OWNER of 1", "EVENT_UNIT_CHANGE_OWNER"))
    for _, name in ipairs({ "EVENT_PLAYER_UNIT_CHANGE_OWNER of 1", "EVENT_UNIT_CHANGE_OWNER" }) do
      expect(readings[name]).toEqual({
        triggerUnit = unit, triggerPlayer = Player(1), changingUnit = unit, previousOwner = Player(0),
        eventId = name == "EVENT_UNIT_CHANGE_OWNER" and EVENT_UNIT_CHANGE_OWNER or EVENT_PLAYER_UNIT_CHANGE_OWNER,
        alive = true, owner = Player(1),
      })
    end
    expect(GetOwningPlayer(unit)).toBe(Player(1))
  end)

  it("fires nothing for the owner the unit has", function()
    startGame()
    local unit = footman()
    local log = watchAll(unit)
    SetUnitOwner(unit, Player(0), true)
    expect(log).toEqual({})
    expect(GetOwningPlayer(unit)).toBe(Player(0))
  end)
end)

describe("UnitAddItem and UnitAddItemById", function()
  it("dispatch the pickup, the item already carried in the handler", function()
    startGame()
    local paladin = CreateUnit(Player(0), FourCC("Hpal"), 0, 0, 0)
    local claws = CreateItem(FourCC("ratc"), 0, 0)
    local log, readings = watchAll(paladin)
    expect(UnitAddItem(paladin, claws)).toBe(true)
    expect(log).toEqual(fired("EVENT_PLAYER_UNIT_PICKUP_ITEM of 0", "EVENT_UNIT_PICKUP_ITEM"))
    for _, name in ipairs({ "EVENT_PLAYER_UNIT_PICKUP_ITEM of 0", "EVENT_UNIT_PICKUP_ITEM" }) do
      expect(readings[name]).toEqual({
        triggerUnit = paladin, triggerPlayer = Player(0), manipulatingUnit = paladin, manipulatedItem = claws,
        eventId = name == "EVENT_UNIT_PICKUP_ITEM" and EVENT_UNIT_PICKUP_ITEM or EVENT_PLAYER_UNIT_PICKUP_ITEM,
        alive = true, owner = Player(0), hasItem = true,
      })
    end
    expect(UnitHasItem(paladin, claws)).toBe(true)
  end)

  it("dispatch the drop, then the pickup, for an item the unit carries", function()
    startGame()
    local paladin = CreateUnit(Player(0), FourCC("Hpal"), 0, 0, 0)
    local claws = CreateItem(FourCC("ratc"), 0, 0)
    UnitAddItem(paladin, claws)
    local log, readings = watchAll(paladin)
    expect(UnitAddItem(paladin, claws)).toBe(true)
    expect(log).toEqual(fired(
      "EVENT_PLAYER_UNIT_DROP_ITEM of 0", "EVENT_UNIT_DROP_ITEM",
      "EVENT_PLAYER_UNIT_PICKUP_ITEM of 0", "EVENT_UNIT_PICKUP_ITEM"
    ))
    expect(readings["EVENT_UNIT_DROP_ITEM"].hasItem).toBe(true)
    expect(UnitItemInSlot(paladin, 0)).toBe(claws)
  end)

  it("UnitAddItemById dispatches the pickup before it returns the item", function()
    startGame()
    local paladin = CreateUnit(Player(0), FourCC("Hpal"), 0, 0, 0)
    local log, readings = watchAll(paladin)
    local item = UnitAddItemById(paladin, FourCC("ratc"))
    expect(log).toEqual(fired("EVENT_PLAYER_UNIT_PICKUP_ITEM of 0", "EVENT_UNIT_PICKUP_ITEM"))
    expect(readings["EVENT_UNIT_PICKUP_ITEM"].manipulatedItem).toBe(item)
    expect(readings["EVENT_UNIT_PICKUP_ITEM"].hasItem).toBe(true)
  end)

  it("fire nothing for a unit without an inventory, UnitAddItem returning false", function()
    startGame()
    map.stubNative("UnitInventorySize", function() return 0 end)
    local unit = footman()
    local claws = CreateItem(FourCC("ratc"), 0, 0)
    local log = watchAll(unit)
    expect(UnitAddItem(unit, claws)).toBe(false)
    expect(UnitHasItem(unit, claws)).toBe(false)
    local made = UnitAddItemById(unit, FourCC("ratc"))
    expect(UnitHasItem(unit, made)).toBe(false)
    expect(log).toEqual({})
  end)
end)

describe("UnitRemoveItem", function()
  it("dispatches the drop, the item still carried in the handler and gone after", function()
    startGame()
    local paladin = CreateUnit(Player(0), FourCC("Hpal"), 0, 0, 0)
    local claws = CreateItem(FourCC("ratc"), 0, 0)
    UnitAddItem(paladin, claws)
    local log, readings = watchAll(paladin)
    UnitRemoveItem(paladin, claws)
    expect(log).toEqual(fired("EVENT_PLAYER_UNIT_DROP_ITEM of 0", "EVENT_UNIT_DROP_ITEM"))
    for _, name in ipairs({ "EVENT_PLAYER_UNIT_DROP_ITEM of 0", "EVENT_UNIT_DROP_ITEM" }) do
      expect(readings[name]).toEqual({
        triggerUnit = paladin, triggerPlayer = Player(0), manipulatingUnit = paladin, manipulatedItem = claws,
        eventId = name == "EVENT_UNIT_DROP_ITEM" and EVENT_UNIT_DROP_ITEM or EVENT_PLAYER_UNIT_DROP_ITEM,
        alive = true, owner = Player(0), hasItem = true,
      })
    end
    expect(UnitHasItem(paladin, claws)).toBe(false)
    expect(UnitItemInSlot(paladin, 0)).toBeUndefined()
  end)

  it("fires nothing for an item the unit does not carry", function()
    startGame()
    local paladin = CreateUnit(Player(0), FourCC("Hpal"), 0, 0, 0)
    local log = watchAll(paladin)
    UnitRemoveItem(paladin, CreateItem(FourCC("ratc"), 0, 0))
    expect(log).toEqual({})
  end)
end)

describe("a Dispatching Native under stubNative", function()
  it("dispatches nothing: the replacement is whole", function()
    startGame()
    map.stubNative("KillUnit")
    local unit = footman()
    local log = watchAll(unit)
    KillUnit(unit)
    expect(log).toEqual({})
    expect(UnitAlive(unit)).toBe(true)
  end)
end)
