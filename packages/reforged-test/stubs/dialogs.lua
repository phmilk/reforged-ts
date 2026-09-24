-- reforged-test stubs for the dialogs family. Every call returns a new dialog
-- or button handle, as the game allocates one per call.

function DialogCreate()
  __stub_record("DialogCreate")
  return __stub_new_handle("dialog")
end

function DialogAddButton(whichDialog, buttonText, hotkey)
  __stub_record("DialogAddButton", whichDialog, buttonText, hotkey)
  return __stub_new_handle("button")
end

function DialogAddQuitButton(whichDialog, doScoreScreen, buttonText, hotkey)
  __stub_record("DialogAddQuitButton", whichDialog, doScoreScreen, buttonText, hotkey)
  return __stub_new_handle("button")
end
