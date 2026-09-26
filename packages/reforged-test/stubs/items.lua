-- reforged-test stubs for the items family. An item handle stores what
-- CreateItem was given.

function CreateItem(itemid, x, y)
  __stub_record("CreateItem", itemid, x, y)
  local item = __stub_new_handle("item")
  item.typeId = itemid
  item.x = x
  item.y = y
  return item
end

function BlzCreateItemWithSkin(itemid, x, y, skinId)
  __stub_record("BlzCreateItemWithSkin", itemid, x, y, skinId)
  local item = __stub_new_handle("item")
  item.typeId = itemid
  item.x = x
  item.y = y
  item.skin = skinId
  return item
end

-- The item types, in the order the Typings declare them. ITEM_TYPE_TOME is
-- converted from the same integer as ITEM_TYPE_POWERUP, so it is the same
-- value.
__stub_constants("itemtype", {
  "ITEM_TYPE_PERMANENT", "ITEM_TYPE_CHARGED", "ITEM_TYPE_POWERUP", "ITEM_TYPE_ARTIFACT",
  "ITEM_TYPE_PURCHASABLE", "ITEM_TYPE_CAMPAIGN", "ITEM_TYPE_MISCELLANEOUS", "ITEM_TYPE_EQUIPMENT",
  "ITEM_TYPE_UNKNOWN", "ITEM_TYPE_ANY",
})
ITEM_TYPE_TOME = ITEM_TYPE_POWERUP

-- The equipment converters. As in the game, a converter returns one value
-- per integer, the same on every call, and the named constants are the
-- values of their integers, so ConvertEquipmentType(1) is
-- EQUIPMENT_TYPE_HEAD. An integer with no named constant gets a value of its
-- own, rendered as the call that made it (ConvertEquipmentType(42)): how a
-- test builds a value the code under test does not know. No value takes a
-- handle id.
local function converter(name, kind, names)
  local values = {}
  for i = 0, #names do
    values[i] = __stub_constant(kind, names[i])
    _G[names[i]] = values[i]
  end
  _G[name] = function(i)
    __stub_record(name, i)
    if values[i] == nil then
      values[i] = __stub_constant(kind, name .. "(" .. tostring(i) .. ")")
    end
    return values[i]
  end
end

converter("ConvertEquipmentType", "equipmentType", {
  [0] = "EQUIPMENT_TYPE_NONE", "EQUIPMENT_TYPE_HEAD", "EQUIPMENT_TYPE_CHEST", "EQUIPMENT_TYPE_GLOVES",
  "EQUIPMENT_TYPE_BOOTS", "EQUIPMENT_TYPE_RING", "EQUIPMENT_TYPE_PRIMARY", "EQUIPMENT_TYPE_OFFHAND",
  "EQUIPMENT_TYPE_TRINKET", "EQUIPMENT_TYPE_ANY",
})
converter("ConvertItemTag", "itemTag", {
  [0] = "ITEMTAG_TYPE_UNDEFINED", "ITEMTAG_TYPE_DROPPABLE", "ITEMTAG_TYPE_QUESTREWARD",
  "ITEMTAG_TYPE_BOSSDROP", "ITEMTAG_TYPE_SECRET", "ITEMTAG_TYPE_PUZZLE", "ITEMTAG_TYPE_WORLD",
  "ITEMTAG_TYPE_SHOP", "ITEMTAG_TYPE_ANY",
})
converter("ConvertLoadoutSlot", "loadoutslot", {
  [0] = "EQUIPMENT_LOADOUT_SLOT_HEAD", "EQUIPMENT_LOADOUT_SLOT_CHEST", "EQUIPMENT_LOADOUT_SLOT_GLOVES",
  "EQUIPMENT_LOADOUT_SLOT_BOOTS", "EQUIPMENT_LOADOUT_SLOT_RING", "EQUIPMENT_LOADOUT_SLOT_RINGALT",
  "EQUIPMENT_LOADOUT_SLOT_PRIMARY", "EQUIPMENT_LOADOUT_SLOT_OFFHAND", "EQUIPMENT_LOADOUT_SLOT_TRINKET",
})
