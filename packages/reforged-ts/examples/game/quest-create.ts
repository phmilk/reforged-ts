// A main quest with two requirements, set up with the map. Its description
// is set right away: the quest menu crashes on an enabled, discovered quest
// without one. When a hero picks up the relic, the first requirement is
// completed and the menu updated to show it.
import { Init, Item, Quest, Trigger } from "reforged-ts";

Init.onTriggers(() => {
  const quest = Quest.create();
  quest.setTitle("The Lost Relic");
  quest.setDescription("Find the relic and bring it back to the village.");
  quest.setIcon("ReplaceableTextures\\CommandButtons\\BTNAnkh.blp");

  const find = quest.addItem("Find the relic");
  quest.addItem("Bring it back to the village");

  Trigger.create()
    .registerAnyUnitEvent(EVENT_PLAYER_UNIT_PICKUP_ITEM)
    .addAction(() => {
      if (Item.fromEvent()?.typeId === FourCC("ankh") && !find.completed) {
        find.completed = true;
        Quest.forceQuestDialogUpdate();
        Quest.flashQuestDialogButton();
      }
    });
});
