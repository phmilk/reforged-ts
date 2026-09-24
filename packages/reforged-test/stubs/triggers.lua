-- reforged-test stubs for the triggers family. CreateTrigger is in base.lua
-- because the library calls it at module load. A trigger never fires on its
-- own: TriggerAddAction stores the action, and a test runs the actions with
-- __stub_fire_trigger.

function TriggerAddAction(whichTrigger, actionFunc)
  __stub_record("TriggerAddAction", whichTrigger, actionFunc)
  local actions = whichTrigger.actions
  if actions == nil then
    actions = {}
    whichTrigger.actions = actions
  end
  actions[#actions + 1] = actionFunc
  return __stub_new_handle("triggeraction")
end

-- Runs the trigger's actions, once each, in the order they were added, as
-- one event would. Not a Native, so it adds no call-log line.
function __stub_fire_trigger(whichTrigger)
  local actions = whichTrigger.actions or {}
  for i = 1, #actions do
    actions[i]()
  end
end
