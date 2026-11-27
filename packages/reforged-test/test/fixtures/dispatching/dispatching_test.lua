-- Hand-written stand-in for a compiled dispatching.test.ts on
-- reforged-test/map: the Dispatching Natives. Each case copies a case of the
-- Probe of unit event timing, docs/research/unit-event-timing.md ("The
-- firings, per case" and "What the response Natives answer in a handler"):
-- the events each Native fires inside the call, their order, what a handler
-- reads, and nothing where the game fires nothing. The cases that say so
-- copy the Probe of the Dispatching Natives,
-- docs/research/dispatching-natives.md: the player's event before the
-- unit's whatever was registered first, UnitAddItemById on a unit without
-- an inventory, UnitRemoveItem of an item the unit does not carry,
-- UnitRemoveItemFromSlot, and GetTriggerWidget in the death handlers.
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

-- A trigger per name of `created`, made in that order, each appending its
-- name to the log it returns when its condition runs and when its action
-- runs; `register[name]` then registers each, in the order of `registered`.
-- `fire` then fires the event, and the triggers are destroyed, as the Probe
-- destroyed each case's, so the cases of one test share its game.
local function ordered(created, registered, register, fire)
  local log, triggers = {}, {}
  for _, name in ipairs(created) do
    triggers[name] = watch(log, name)
  end
  for _, name in ipairs(registered) do
    register[name](triggers[name])
  end
  fire()
  for _, trigger in pairs(triggers) do
    DestroyTrigger(trigger)
  end
  return log
end

-- Every order of the names given.
local function permutations(names)
  if #names <= 1 then
    return { names }
  end
  local all = {}
  for i = 1, #names do
    local rest = {}
    for j = 1, #names do
      if j ~= i then
        rest[#rest + 1] = names[j]
      end
    end
    for _, tail in ipairs(permutations(rest)) do
      table.insert(tail, 1, names[i])
      all[#all + 1] = tail
    end
  end
  return all
end

local function reversed(names)
  local back = {}
  for i = #names, 1, -1 do
    back[#back + 1] = names[i]
  end
  return back
end

-- The cases KillUnit(live), KillUnit(dead), RemoveUnit(live) and
-- RemoveUnit(dead) of docs/research/unit-event-timing.md.
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

  -- "GetTriggerWidget in the death handlers" of
  -- docs/research/dispatching-natives.md: the unit in the widget death, nil
  -- in the player's and in the unit's death. The game's answer is equal to
  -- the unit by `==`, which is all this case reads of it ("A unit read as a
  -- widget").
  it("answers GetTriggerWidget in the widget death alone", function()
    startGame()
    local unit = footman()
    local _, readings = watchAll(unit)
    KillUnit(unit)
    expect(readings["widget death"].triggerWidget == unit).toBe(true)
    expect(readings["EVENT_PLAYER_UNIT_DEATH of 0"].triggerWidget).toBeUndefined()
    expect(readings["EVENT_UNIT_DEATH"].triggerWidget).toBeUndefined()
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

  it("leaves RemoveUnit dispatching nothing for a dead unit", function()
    startGame()
    local unit = footman()
    KillUnit(unit)
    local log = watchAll(unit)
    RemoveUnit(unit)
    expect(log).toEqual({})
    expect(UnitAlive(unit)).toBe(false)
  end)
end)

-- The cases SetUnitOwner(footman, Player(1)) and SetUnitOwner(footman,
-- Player(0)), its owner, of docs/research/unit-event-timing.md.
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

-- The cases UnitAddItem(paladin, claws), the item it carries, no inventory, and
-- UnitAddItemById(paladin, 'ratc') of docs/research/unit-event-timing.md.
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
    expect(log).toEqual({})
  end)

  -- The case UnitAddItemById(footman, 'ratc'), no inventory, of
  -- docs/research/dispatching-natives.md: the game makes the item, leaves it
  -- on the ground and returns nothing.
  it("UnitAddItemById returns nothing for a unit without an inventory, and fires nothing", function()
    startGame()
    map.stubNative("UnitInventorySize", function() return 0 end)
    local unit = footman()
    local log = watchAll(unit)
    local before = __stub_new_handle("mark").__handleId
    expect(UnitAddItemById(unit, FourCC("ratc"))).toBeUndefined()
    expect(log).toEqual({})
    expect(UnitItemInSlot(unit, 0)).toBeUndefined()
    -- The item exists, though nothing reads it back: it took a handle id.
    expect(__stub_new_handle("mark").__handleId).toBe(before + 2)
  end)
end)

-- The case UnitRemoveItem(paladin, claws) of docs/research/unit-event-timing.md.
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

  -- The three cases of UnitRemoveItem of an item the unit does not carry of
  -- docs/research/dispatching-natives.md: nothing fires and nothing moves.
  it("fires nothing for an item the unit does not carry", function()
    startGame()
    local paladin = CreateUnit(Player(0), FourCC("Hpal"), 0, 0, 0)
    local log = watchAll(paladin)
    local ground = CreateItem(FourCC("ratc"), 0, 0)
    UnitRemoveItem(paladin, ground)
    expect(log).toEqual({})
    expect(UnitHasItem(paladin, ground)).toBe(false)
  end)

  it("fires nothing for an item another unit carries, which keeps it", function()
    startGame()
    local paladin = CreateUnit(Player(0), FourCC("Hpal"), 0, 0, 0)
    local carrier = CreateUnit(Player(0), FourCC("Hpal"), 0, 0, 0)
    local claws = CreateItem(FourCC("ratc"), 0, 0)
    UnitAddItem(carrier, claws)
    local log = watchAll(paladin, carrier)
    UnitRemoveItem(paladin, claws)
    expect(log).toEqual({})
    expect(UnitHasItem(carrier, claws)).toBe(true)
    expect(UnitItemInSlot(carrier, 0)).toBe(claws)
  end)

  it("fires nothing for a unit without an inventory", function()
    startGame()
    map.stubNative("UnitInventorySize", function() return 0 end)
    local unit = footman()
    local log = watchAll(unit)
    UnitRemoveItem(unit, CreateItem(FourCC("ratc"), 0, 0))
    expect(log).toEqual({})
  end)
end)

-- The cases of UnitRemoveItemFromSlot of
-- docs/research/dispatching-natives.md: a filled slot, an empty slot beside
-- a filled one, an empty inventory and a unit without an inventory.
describe("UnitRemoveItemFromSlot", function()
  it("dispatches the drop of a filled slot, the item still in its slot in the handler, and returns it", function()
    startGame()
    local paladin = CreateUnit(Player(0), FourCC("Hpal"), 0, 0, 0)
    local claws = CreateItem(FourCC("ratc"), 0, 0)
    UnitAddItem(paladin, claws)
    local log, readings = watchAll(paladin)
    local inSlot = {}
    local trigger = CreateTrigger()
    TriggerAddAction(trigger, function()
      inSlot[#inSlot + 1] = UnitItemInSlot(GetManipulatingUnit(), 0)
    end)
    TriggerRegisterUnitEvent(trigger, paladin, EVENT_UNIT_DROP_ITEM)
    expect(UnitRemoveItemFromSlot(paladin, 0)).toBe(claws)
    expect(log).toEqual(fired("EVENT_PLAYER_UNIT_DROP_ITEM of 0", "EVENT_UNIT_DROP_ITEM"))
    for _, name in ipairs({ "EVENT_PLAYER_UNIT_DROP_ITEM of 0", "EVENT_UNIT_DROP_ITEM" }) do
      expect(readings[name]).toEqual({
        triggerUnit = paladin, triggerPlayer = Player(0), manipulatingUnit = paladin, manipulatedItem = claws,
        eventId = name == "EVENT_UNIT_DROP_ITEM" and EVENT_UNIT_DROP_ITEM or EVENT_PLAYER_UNIT_DROP_ITEM,
        alive = true, owner = Player(0), hasItem = true,
      })
    end
    expect(inSlot).toEqual({ claws })
    expect(UnitHasItem(paladin, claws)).toBe(false)
    expect(UnitItemInSlot(paladin, 0)).toBeUndefined()
  end)

  it("fires nothing and returns nothing for an empty slot beside a filled one", function()
    startGame()
    local paladin = CreateUnit(Player(0), FourCC("Hpal"), 0, 0, 0)
    local claws = CreateItem(FourCC("ratc"), 0, 0)
    UnitAddItem(paladin, claws)
    local log = watchAll(paladin)
    expect(UnitRemoveItemFromSlot(paladin, 1)).toBeUndefined()
    expect(log).toEqual({})
    expect(UnitItemInSlot(paladin, 0)).toBe(claws)
  end)

  it("fires nothing and returns nothing for an empty inventory, and for a unit without one", function()
    startGame()
    local paladin = CreateUnit(Player(0), FourCC("Hpal"), 0, 0, 0)
    local log = watchAll(paladin)
    expect(UnitRemoveItemFromSlot(paladin, 0)).toBeUndefined()
    map.stubNative("UnitInventorySize", function() return 0 end)
    expect(UnitRemoveItemFromSlot(paladin, 0)).toBeUndefined()
    expect(log).toEqual({})
  end)
end)

-- "The order of the player's and the unit's event" of
-- docs/research/dispatching-natives.md: for one event, the Trigger of the
-- player's event runs before the Trigger of the unit's, whichever was
-- registered first and whichever was created first; the widget death runs
-- before both.
describe("the player's event and the unit's", function()
  it("run the widget death, the player's death, then the unit's, in each of the six registration orders", function()
    startGame()
    for _, registered in ipairs(permutations({ "player", "unit", "widget" })) do
      for _, created in ipairs({ registered, reversed(registered) }) do
        local unit = footman()
        local log = ordered(created, registered, {
          player = function(trigger) TriggerRegisterPlayerUnitEvent(trigger, Player(0), EVENT_PLAYER_UNIT_DEATH, nil) end,
          unit = function(trigger) TriggerRegisterUnitEvent(trigger, unit, EVENT_UNIT_DEATH) end,
          widget = function(trigger) TriggerRegisterDeathEvent(trigger, unit) end,
        }, function() KillUnit(unit) end)
        expect(log).toEqual(fired("widget", "player", "unit"))
      end
    end
  end)

  -- One case per event: its registrations, and the Native that fires it.
  local EVENTS = {
    {
      name = "the change of owner",
      playerEvent = "EVENT_PLAYER_UNIT_CHANGE_OWNER", unitEvent = "EVENT_UNIT_CHANGE_OWNER",
      -- The change of owner is the new owner's event.
      player = 1,
      make = function() return footman() end,
      fire = function(unit) SetUnitOwner(unit, Player(1), true) end,
    },
    {
      name = "the pickup",
      playerEvent = "EVENT_PLAYER_UNIT_PICKUP_ITEM", unitEvent = "EVENT_UNIT_PICKUP_ITEM",
      player = 0,
      make = function() return CreateUnit(Player(0), FourCC("Hpal"), 0, 0, 0) end,
      fire = function(unit) UnitAddItem(unit, CreateItem(FourCC("ratc"), 0, 0)) end,
    },
    {
      name = "the drop",
      playerEvent = "EVENT_PLAYER_UNIT_DROP_ITEM", unitEvent = "EVENT_UNIT_DROP_ITEM",
      player = 0,
      make = function()
        local unit = CreateUnit(Player(0), FourCC("Hpal"), 0, 0, 0)
        UnitAddItem(unit, CreateItem(FourCC("ratc"), 0, 0))
        return unit
      end,
      fire = function(unit) UnitRemoveItem(unit, UnitItemInSlot(unit, 0)) end,
    },
  }
  for _, event in ipairs(EVENTS) do
    it("run the player's before the unit's for " .. event.name .. ", in both registration orders", function()
      startGame()
      for _, registered in ipairs(permutations({ "player", "unit" })) do
        for _, created in ipairs({ registered, reversed(registered) }) do
          local unit = event.make()
          local log = ordered(created, registered, {
            player = function(trigger)
              TriggerRegisterPlayerUnitEvent(trigger, Player(event.player), _G[event.playerEvent], nil)
            end,
            unit = function(trigger) TriggerRegisterUnitEvent(trigger, unit, _G[event.unitEvent]) end,
          }, function() event.fire(unit) end)
          expect(log).toEqual(fired("player", "unit"))
        end
      end
    end)
  end
end)

-- The stubs keep no hit points, so lethal damage kills nothing: in the game
-- a lethal UnitDamageTarget fires the three deaths after the damage
-- (docs/research/unit-event-timing.md), and a test that needs that death
-- writes game.kill(target, { by = attacker }).
describe("UnitDamageTarget", function()
  it("dispatches the damage only: no death, whatever the amount", function()
    startGame()
    local attacker, target = footman(1), footman()
    local log = watchAll(target)
    TriggerRegisterUnitEvent(watch(log, "EVENT_UNIT_DAMAGING"), target, EVENT_UNIT_DAMAGING)
    TriggerRegisterUnitEvent(watch(log, "EVENT_UNIT_DAMAGED"), target, EVENT_UNIT_DAMAGED)
    expect(UnitDamageTarget(attacker, target, 10000, true, false,
      ATTACK_TYPE_NORMAL, DAMAGE_TYPE_NORMAL, WEAPON_TYPE_WHOKNOWS)).toBe(true)
    expect(log).toEqual(fired("EVENT_UNIT_DAMAGING", "EVENT_UNIT_DAMAGED"))
    expect(UnitAlive(target)).toBe(true)
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
