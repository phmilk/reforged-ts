-- reforged-test stubs for the groups family. A group stores the units
-- GroupAddUnit was given, in added order; index 0 is the first.

function CreateGroup()
  __stub_record("CreateGroup")
  local group = __stub_new_handle("group")
  group.units = {}
  return group
end

function GroupAddUnit(whichGroup, whichUnit)
  __stub_record("GroupAddUnit", whichGroup, whichUnit)
  whichGroup.units[#whichGroup.units + 1] = whichUnit
  return true
end

function BlzGroupGetSize(whichGroup)
  __stub_record("BlzGroupGetSize", whichGroup)
  return #whichGroup.units
end

-- Whether the group holds the unit.
local function holds(whichGroup, whichUnit)
  for i = 1, #whichGroup.units do
    if whichGroup.units[i] == whichUnit then
      return true
    end
  end
  return false
end

-- As measured in the game (3.0.0, phmilk/reforged-ts#260), both Natives
-- iterate their first group and change their second. This one appends the
-- units of whichGroup to addGroup, in order, as GroupAddUnit does, and
-- returns how many it appended.
function BlzGroupAddGroupFast(whichGroup, addGroup)
  __stub_record("BlzGroupAddGroupFast", whichGroup, addGroup)
  local count = #whichGroup.units
  for i = 1, count do
    addGroup.units[#addGroup.units + 1] = whichGroup.units[i]
  end
  return count
end

-- Removes the units of whichGroup from removeGroup, keeping the order of the
-- rest, and returns how many it removed.
function BlzGroupRemoveGroupFast(whichGroup, removeGroup)
  __stub_record("BlzGroupRemoveGroupFast", whichGroup, removeGroup)
  local kept, removed = {}, 0
  for i = 1, #removeGroup.units do
    local unit = removeGroup.units[i]
    if holds(whichGroup, unit) then
      removed = removed + 1
    else
      kept[#kept + 1] = unit
    end
  end
  removeGroup.units = kept
  return removed
end

-- The first unit, or nil for an empty group.
function FirstOfGroup(whichGroup)
  __stub_record("FirstOfGroup", whichGroup)
  return whichGroup.units[1]
end

-- The unit at a 0-based index, or nil past the end.
function BlzGroupUnitAt(whichGroup, index)
  __stub_record("BlzGroupUnitAt", whichGroup, index)
  return whichGroup.units[index + 1]
end

-- The unit ForGroup is enumerating, nil outside ForGroup.
local enumUnit = nil

-- ForGroup runs the callback at once, as the game does, once per unit in
-- added order with GetEnumUnit returning that unit. It keeps no callback, so
-- it needs no firing helper.
function ForGroup(whichGroup, callback)
  __stub_record("ForGroup", whichGroup, callback)
  local outer = enumUnit
  for i = 1, #whichGroup.units do
    enumUnit = whichGroup.units[i]
    callback()
  end
  enumUnit = outer
end

function GetEnumUnit()
  __stub_record("GetEnumUnit")
  return enumUnit
end

function DestroyGroup(whichGroup)
  __stub_record("DestroyGroup", whichGroup)
  whichGroup.destroyed = true
end
