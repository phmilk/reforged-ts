-- reforged-test stubs for the destructables family. A destructable handle
-- stores its type and coordinates.

local function newDestructable(objectid, x, y)
  local destructable = __stub_new_handle("destructable")
  destructable.typeId = objectid
  destructable.x = x
  destructable.y = y
  return destructable
end

function CreateDestructable(objectid, x, y, face, scale, variation)
  __stub_record("CreateDestructable", objectid, x, y, face, scale, variation)
  return newDestructable(objectid, x, y)
end

function CreateDestructableZ(objectid, x, y, z, face, scale, variation)
  __stub_record("CreateDestructableZ", objectid, x, y, z, face, scale, variation)
  return newDestructable(objectid, x, y)
end

function BlzCreateDestructableWithSkin(objectid, x, y, face, scale, variation, skinId)
  __stub_record("BlzCreateDestructableWithSkin", objectid, x, y, face, scale, variation, skinId)
  return newDestructable(objectid, x, y)
end

function BlzCreateDestructableZWithSkin(objectid, x, y, z, face, scale, variation, skinId)
  __stub_record("BlzCreateDestructableZWithSkin", objectid, x, y, z, face, scale, variation, skinId)
  return newDestructable(objectid, x, y)
end
