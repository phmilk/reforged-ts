// A Map project's initialization, one stage at a time: the Handles are
// created once the globals exist, the trigger once the editor's own are
// made, and the round starts once the game has started.
import { Init, Timer, Trigger } from "reforged-ts";

let round: Timer | undefined;

Init.onGlobals(() => {
  round = Timer.create();
}, "round timer");

Init.onTriggers(() => {
  if (round === undefined) {
    return;
  }
  const trigger = Trigger.create();
  trigger.registerTimerExpire(round);
  trigger.addAction(() => {
    print("The round is over");
  });
}, "round end");

Init.onGameStart(() => {
  print(Init.hasRun("globals")); // true
  print(Init.current); // gameStart
  round?.start(60, false, () => undefined);
});
