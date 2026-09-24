-- reforged-test stubs for the multiboards family. Every call returns a new
-- handle: the game allocates a multiboard item per MultiboardGetItem call,
-- which MultiboardReleaseItem releases.

function CreateMultiboard()
  __stub_record("CreateMultiboard")
  return __stub_new_handle("multiboard")
end

function MultiboardGetItem(lb, row, column)
  __stub_record("MultiboardGetItem", lb, row, column)
  return __stub_new_handle("multiboarditem")
end
