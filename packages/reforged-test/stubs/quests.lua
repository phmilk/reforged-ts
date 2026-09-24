-- reforged-test stubs for the quests family. Every creation returns a new
-- quest or quest item handle, as the game allocates one per call.

function CreateQuest()
  __stub_record("CreateQuest")
  return __stub_new_handle("quest")
end

function QuestCreateItem(whichQuest)
  __stub_record("QuestCreateItem", whichQuest)
  return __stub_new_handle("questitem")
end

function QuestItemSetDescription(whichQuestItem, description)
  __stub_record("QuestItemSetDescription", whichQuestItem, description)
end
