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
