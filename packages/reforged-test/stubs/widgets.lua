-- reforged-test stubs for the widgets family: the coordinates a unit, item
-- or destructable stub stored when it was created.

function GetWidgetX(whichWidget)
  __stub_record("GetWidgetX", whichWidget)
  return whichWidget.x
end

function GetWidgetY(whichWidget)
  __stub_record("GetWidgetY", whichWidget)
  return whichWidget.y
end
