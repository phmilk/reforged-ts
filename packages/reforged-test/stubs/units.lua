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

-- The inventory: UnitAddItemById creates a new item in the next slot (slot 0
-- first, in added order, a freed slot is not refilled); UnitItemInSlot reads
-- a slot and UnitRemoveItemFromSlot empties it, returning what it held.
function UnitAddItemById(whichUnit, itemId)
  __stub_record("UnitAddItemById", whichUnit, itemId)
  local item = __stub_new_handle("item")
  item.typeId = itemId
  local slot = whichUnit.itemCount or 0
  whichUnit.itemCount = slot + 1
  whichUnit.inventory = whichUnit.inventory or {}
  whichUnit.inventory[slot] = item
  return item
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
