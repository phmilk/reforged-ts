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
