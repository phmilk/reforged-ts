-- reforged-test stubs for the units family. A unit handle stores what
-- CreateUnit (or BlzCreateUnitWithSkin) was given; the getters return it.

function CreateUnit(id, unitid, x, y, face)
  __stub_record("CreateUnit", id, unitid, x, y, face)
  local unit = __stub_new_handle("unit")
  unit.owner = id
  unit.typeId = unitid
  unit.x = x
  unit.y = y
  unit.facing = face
  return unit
end

function GetOwningPlayer(whichUnit)
  __stub_record("GetOwningPlayer", whichUnit)
  return whichUnit.owner
end

function GetUnitTypeId(whichUnit)
  __stub_record("GetUnitTypeId", whichUnit)
  return whichUnit.typeId
end

function BlzCreateUnitWithSkin(id, unitid, x, y, face, skinId)
  __stub_record("BlzCreateUnitWithSkin", id, unitid, x, y, face, skinId)
  local unit = __stub_new_handle("unit")
  unit.owner = id
  unit.typeId = unitid
  unit.x = x
  unit.y = y
  unit.facing = face
  unit.skin = skinId
  return unit
end

-- The coordinates the unit was created at.
function GetUnitX(whichUnit)
  __stub_record("GetUnitX", whichUnit)
  return whichUnit.x
end

function GetUnitY(whichUnit)
  __stub_record("GetUnitY", whichUnit)
  return whichUnit.y
end

-- A new location per call, at the unit's coordinates.
function GetUnitLoc(whichUnit)
  __stub_record("GetUnitLoc", whichUnit)
  local location = __stub_new_handle("location")
  location.x = whichUnit.x
  location.y = whichUnit.y
  return location
end

-- No order sets a rally in a stub, so a unit has no rally point, unit or
-- destructable.
function GetUnitRallyPoint(whichUnit)
  __stub_record("GetUnitRallyPoint", whichUnit)
  return nil
end

function GetUnitRallyUnit(whichUnit)
  __stub_record("GetUnitRallyUnit", whichUnit)
  return nil
end

function GetUnitRallyDestructable(whichUnit)
  __stub_record("GetUnitRallyDestructable", whichUnit)
  return nil
end

-- The inventory: an item is carried in a slot, slot 0 first, in added order;
-- a freed slot is not refilled. UnitItemInSlot reads a slot and
-- UnitRemoveItemFromSlot empties it, returning what it held.
--
-- Giving and taking an item are Dispatching Natives: the game fires their
-- events inside the call (docs/research/unit-event-timing.md), so the stubs
-- dispatch them through the Event dispatch (__stub_dispatch, triggers.lua),
-- the player unit event of the unit's owner before the unit event. A
-- handler reads the unit and the item from GetTriggerUnit,
-- GetManipulatingUnit, GetTriggerPlayer (the owner) and GetManipulatedItem.

-- The slot the unit carries `whichItem` in, nil when it does not.
local function slotOf(whichUnit, whichItem)
  for slot, held in pairs(whichUnit.inventory or {}) do
    if rawequal(held, whichItem) then
      return slot
    end
  end
  return nil
end

-- Puts the item in the unit's next slot.
local function carry(whichUnit, whichItem)
  local slot = whichUnit.itemCount or 0
  whichUnit.itemCount = slot + 1
  whichUnit.inventory = whichUnit.inventory or {}
  whichUnit.inventory[slot] = whichItem
end

-- Dispatches one event of the unit with `context`: the player unit event
-- `playerEvent` to the registrations of `player`, then the unit event
-- `unitEvent` to the unit's, the order the Probe measured for every
-- Dispatching Native (docs/research/unit-event-timing.md, "Limits": it could
-- not tell that order from registration order, as the Probe registered the
-- player Triggers first).
local function dispatchUnitEvent(whichUnit, player, playerEvent, unitEvent, context)
  __stub_dispatch(playerEvent, player, context)
  __stub_dispatch(unitEvent, whichUnit, context)
end

-- Dispatches one item event of the unit, to its owner then to the unit.
local function dispatchItemEvent(whichUnit, whichItem, playerEvent, unitEvent)
  dispatchUnitEvent(whichUnit, whichUnit.owner, playerEvent, unitEvent, {
    GetTriggerUnit = whichUnit,
    GetTriggerPlayer = whichUnit.owner,
    GetManipulatingUnit = whichUnit,
    GetManipulatedItem = whichItem,
  })
end

local function dispatchPickup(whichUnit, whichItem)
  dispatchItemEvent(whichUnit, whichItem, EVENT_PLAYER_UNIT_PICKUP_ITEM, EVENT_UNIT_PICKUP_ITEM)
end

local function dispatchDrop(whichUnit, whichItem)
  dispatchItemEvent(whichUnit, whichItem, EVENT_PLAYER_UNIT_DROP_ITEM, EVENT_UNIT_DROP_ITEM)
end

-- The stubs keep no object data, so every unit has an inventory of six
-- slots, a hero's, and nothing fills it: UnitInventorySize answers 6. A test
-- makes a unit without an inventory by giving UnitInventorySize another
-- answer (stubNative, or a stub of its own) that is 0 for that unit; the
-- Natives that give an item ask that answer, and the shipped one without a
-- call-log line.
local INVENTORY_SIZE = 6

local function shippedInventorySize(whichUnit)
  __stub_record("UnitInventorySize", whichUnit)
  return INVENTORY_SIZE
end

UnitInventorySize = shippedInventorySize

-- Asking the shipped stub adds no call-log line, as the map made no such
-- call; a test's own answer is asked, and records its call.
local function hasInventory(whichUnit)
  local inventorySize = UnitInventorySize
  if rawequal(inventorySize, shippedInventorySize) then
    return true
  end
  return inventorySize(whichUnit) ~= 0
end

-- UnitAddItemById creates a new item and gives it to the unit as UnitAddItem
-- does, the pickup dispatched before it returns the item. A unit without an
-- inventory gets nothing and nothing fires: the item is created all the
-- same, and returned.
function UnitAddItemById(whichUnit, itemId)
  __stub_record("UnitAddItemById", whichUnit, itemId)
  local item = __stub_new_handle("item")
  item.typeId = itemId
  if not hasInventory(whichUnit) then
    return item
  end
  carry(whichUnit, item)
  dispatchPickup(whichUnit, item)
  return item
end

-- UnitAddItem puts the item in the next slot, dispatches the pickup, the
-- item already carried in the handler, and returns true. For an item the
-- unit already carries, the item stays in its slot and the drop is
-- dispatched, then the pickup, as the game does. A unit without an
-- inventory gets nothing, nothing fires, and it returns false.
function UnitAddItem(whichUnit, whichItem)
  __stub_record("UnitAddItem", whichUnit, whichItem)
  if not hasInventory(whichUnit) then
    return false
  end
  if slotOf(whichUnit, whichItem) ~= nil then
    dispatchDrop(whichUnit, whichItem)
  else
    carry(whichUnit, whichItem)
  end
  dispatchPickup(whichUnit, whichItem)
  return true
end

-- UnitRemoveItem dispatches the drop of an item the unit carries, the item
-- still carried in the handler, then empties its slot. An item the unit
-- does not carry fires nothing.
function UnitRemoveItem(whichUnit, whichItem)
  __stub_record("UnitRemoveItem", whichUnit, whichItem)
  if slotOf(whichUnit, whichItem) == nil then
    return
  end
  dispatchDrop(whichUnit, whichItem)
  -- Read again: a drop handler may have moved or removed the item.
  local slot = slotOf(whichUnit, whichItem)
  if slot ~= nil then
    whichUnit.inventory[slot] = nil
  end
end

-- Whether the unit carries the item.
function UnitHasItem(whichUnit, whichItem)
  __stub_record("UnitHasItem", whichUnit, whichItem)
  return slotOf(whichUnit, whichItem) ~= nil
end

function UnitItemInSlot(whichUnit, itemSlot)
  __stub_record("UnitItemInSlot", whichUnit, itemSlot)
  return (whichUnit.inventory or {})[itemSlot]
end

function UnitRemoveItemFromSlot(whichUnit, itemSlot)
  __stub_record("UnitRemoveItemFromSlot", whichUnit, itemSlot)
  local inventory = whichUnit.inventory or {}
  local item = inventory[itemSlot]
  inventory[itemSlot] = nil
  return item
end

-- A hero's level is the one SetHeroLevel stored, 0 before any.
function SetHeroLevel(whichHero, level, showEyeCandy)
  __stub_record("SetHeroLevel", whichHero, level, showEyeCandy)
  whichHero.heroLevel = level
end

function GetHeroLevel(whichHero)
  __stub_record("GetHeroLevel", whichHero)
  return whichHero.heroLevel or 0
end

-- A hero's unspent skill points: UnitModifySkillPoints adds its delta to
-- them, 0 before any, and returns true; GetHeroSkillPoints reads them.
function UnitModifySkillPoints(whichHero, skillPointDelta)
  __stub_record("UnitModifySkillPoints", whichHero, skillPointDelta)
  whichHero.skillPoints = (whichHero.skillPoints or 0) + skillPointDelta
  return true
end

function GetHeroSkillPoints(whichHero)
  __stub_record("GetHeroSkillPoints", whichHero)
  return whichHero.skillPoints or 0
end

-- KillUnit and SetUnitOwner are Dispatching Natives: the game fires their
-- events inside the call (docs/research/unit-event-timing.md), so the stubs
-- dispatch them through the Event dispatch (__stub_dispatch, triggers.lua).

-- The unit keeps dead or alive, and no hit points. KillUnit marks a live
-- unit dead, then dispatches the widget death (the registrations of
-- TriggerRegisterDeathEvent), the player unit death of its owner and the
-- unit death, in that order, the unit already dead in every handler. The
-- widget death answers GetTriggerUnit and GetTriggerWidget, the two others
-- GetTriggerUnit, GetDyingUnit and GetTriggerPlayer (the owner); nothing
-- answers GetKillingUnit, as the game answers nil under KillUnit. A unit
-- already dead fires nothing.
function KillUnit(whichUnit)
  __stub_record("KillUnit", whichUnit)
  if whichUnit.dead then
    return
  end
  whichUnit.dead = true
  __stub_dispatch(EVENT_WIDGET_DEATH, whichUnit, {
    GetTriggerUnit = whichUnit,
    GetTriggerWidget = whichUnit,
  })
  dispatchUnitEvent(whichUnit, whichUnit.owner, EVENT_PLAYER_UNIT_DEATH, EVENT_UNIT_DEATH, {
    GetTriggerUnit = whichUnit,
    GetTriggerPlayer = whichUnit.owner,
    GetDyingUnit = whichUnit,
  })
end

-- Whether the unit is alive: true until it died. A removed unit is not
-- dead, as the game answers on the line after RemoveUnit.
function UnitAlive(whichUnit)
  __stub_record("UnitAlive", whichUnit)
  return not whichUnit.dead
end

-- What a reading of life answers: 0 for a dead unit. The stubs keep no hit
-- points, so a live unit's life, or any other widget's, is an error, as it
-- was before the stubs knew death: the test gives it with stubNative, or a
-- stub of its own.
local function lifeOrError(name, whichWidget)
  if whichWidget.__kind == "unit" and whichWidget.dead then
    return 0.0
  end
  error(name .. ": the stubs keep no hit points, only whether a unit died; "
    .. "give the life of " .. __stub_format(whichWidget) .. " with stubNative", 2)
end

function GetWidgetLife(whichWidget)
  __stub_record("GetWidgetLife", whichWidget)
  return lifeOrError("GetWidgetLife", whichWidget)
end

function GetUnitState(whichUnit, whichUnitState)
  __stub_record("GetUnitState", whichUnit, whichUnitState)
  if not rawequal(whichUnitState, UNIT_STATE_LIFE) then
    error("GetUnitState: the stubs keep no unit state; give "
      .. __stub_format(whichUnitState) .. " with stubNative", 2)
  end
  return lifeOrError("GetUnitState", whichUnit)
end

-- SetUnitOwner gives the unit to another player, then dispatches the player
-- unit change of owner of the new owner and the unit change of owner, in
-- that order, the new owner already set in every handler. GetTriggerUnit and
-- GetChangingUnit answer the unit, GetTriggerPlayer the new owner and
-- GetChangingUnitPrevOwner the previous one. The same owner fires nothing.
-- The colour is not kept.
function SetUnitOwner(whichUnit, whichPlayer, changeColor)
  __stub_record("SetUnitOwner", whichUnit, whichPlayer, changeColor)
  local previous = whichUnit.owner
  if rawequal(previous, whichPlayer) then
    return
  end
  whichUnit.owner = whichPlayer
  dispatchUnitEvent(whichUnit, whichPlayer, EVENT_PLAYER_UNIT_CHANGE_OWNER, EVENT_UNIT_CHANGE_OWNER, {
    GetTriggerUnit = whichUnit,
    GetTriggerPlayer = whichPlayer,
    GetChangingUnit = whichUnit,
    GetChangingUnitPrevOwner = previous,
  })
end

function RemoveUnit(whichUnit)
  __stub_record("RemoveUnit", whichUnit)
  whichUnit.destroyed = true
end

-- Damage is dispatched at once, inside the call, as the game dispatches it:
-- the triggers registered for a damage event on the target fire before
-- UnitDamageTarget returns (__stub_dispatch_damage, in triggers.lua), so an
-- action that deals damage causes a nested dispatch. The stub keeps no life
-- and applies no armor: the target is unchanged. It returns true.
function UnitDamageTarget(whichUnit, target, amount, attack, ranged, attackType, damageType, weaponType)
  __stub_record("UnitDamageTarget", whichUnit, target, amount, attack, ranged, attackType, damageType, weaponType)
  __stub_dispatch_damage({
    source = whichUnit,
    target = target,
    amount = amount,
    attack = attack,
    attackType = attackType,
    damageType = damageType,
    weaponType = weaponType,
  })
  return true
end
