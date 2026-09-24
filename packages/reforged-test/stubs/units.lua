-- reforged-test stubs for the units family. A unit handle stores what
-- CreateUnit was given; the getters return it.

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
