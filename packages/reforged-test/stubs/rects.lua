-- reforged-test stubs for the rects family. Every call returns a new rect
-- handle, as the game allocates one per call; a rect stores the bounds it was
-- given.

function Rect(minx, miny, maxx, maxy)
  __stub_record("Rect", minx, miny, maxx, maxy)
  local rect = __stub_new_handle("rect")
  rect.minX = minx
  rect.minY = miny
  rect.maxX = maxx
  rect.maxY = maxy
  return rect
end

function RectFromLoc(min, max)
  __stub_record("RectFromLoc", min, max)
  local rect = __stub_new_handle("rect")
  rect.minX = min.x
  rect.minY = min.y
  rect.maxX = max.x
  rect.maxY = max.y
  return rect
end

-- The stub map has no size, so the world bounds carry none.
function GetWorldBounds()
  __stub_record("GetWorldBounds")
  return __stub_new_handle("rect")
end
