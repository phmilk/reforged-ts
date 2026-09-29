// A greeting that runs on the first chat message only: the action removes
// itself, by the function addAction was given.
import { Init, MapPlayer, Trigger } from "reforged-ts";

Init.onTriggers(() => {
  const first = MapPlayer.fromIndex(0);
  if (first === undefined) {
    return;
  }
  const trigger = Trigger.create().registerPlayerChatEvent(first, "", false);
  const greet = () => {
    print("Welcome!");
    trigger.removeAction(greet);
  };
  trigger.addAction(greet);
});
