-- reforged-test stubs for the destructables family. A destructable handle
-- stores its type and coordinates.

local function newDestructable(objectid, x, y)
  local destructable = __stub_new_handle("destructable")
  destructable.typeId = objectid
  destructable.x = x
  destructable.y = y
  return destructable
end

-- Every destructable creation Native of the Patch, with its arity: the
-- plain, dead, Z, pitch-roll, with-skin and with-colour families and their
-- combinations. Each records one argument per parameter, in the Native's
-- order (an omitted one as nil), and returns a new destructable. objectid,
-- x and y come first in every one of them.
local CREATORS = {
  CreateDestructable = 6,
  CreateDestructableZ = 7,
  CreateDeadDestructable = 6,
  CreateDeadDestructableZ = 7,
  BlzCreateDestructableWithSkin = 7,
  BlzCreateDestructableZWithSkin = 8,
  BlzCreateDeadDestructableWithSkin = 7,
  BlzCreateDeadDestructableZWithSkin = 8,
  BlzCreateDestructablePitchRoll = 8,
  BlzCreateDestructableZPitchRoll = 9,
  BlzCreateDeadDestructablePitchRoll = 8,
  BlzCreateDeadDestructableZPitchRoll = 9,
  BlzCreateDestructableWithSkinPitchRoll = 9,
  BlzCreateDestructableZWithSkinPitchRoll = 10,
  BlzCreateDeadDestructableWithSkinPitchRoll = 9,
  BlzCreateDeadDestructableZWithSkinPitchRoll = 10,
  BlzCreateDestructableWithColor = 7,
  BlzCreateDestructableZWithColor = 8,
  BlzCreateDeadDestructableWithColor = 7,
  BlzCreateDeadDestructableZWithColor = 8,
  BlzCreateDestructableWithSkinColor = 8,
  BlzCreateDestructableZWithSkinColor = 9,
  BlzCreateDeadDestructableWithSkinColor = 8,
  BlzCreateDeadDestructableZWithSkinColor = 9,
  BlzCreateDestructablePitchRollWithColor = 9,
  BlzCreateDestructableZPitchRollWithColor = 10,
  BlzCreateDeadDestructablePitchRollWithColor = 9,
  BlzCreateDeadDestructableZPitchRollWithColor = 10,
  BlzCreateDestructableWithSkinPitchRollColor = 10,
  BlzCreateDestructableZWithSkinPitchRollColor = 11,
  BlzCreateDeadDestructableWithSkinPitchRollColor = 10,
  BlzCreateDeadDestructableZWithSkinPitchRollColor = 11,
}

for name, arity in pairs(CREATORS) do
  _G[name] = function(...)
    local args = table.pack(...)
    __stub_record(name, table.unpack(args, 1, arity))
    return newDestructable(args[1], args[2], args[3])
  end
end
