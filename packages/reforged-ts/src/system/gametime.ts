/** @noSelfInFile */

import { Timer } from "../handles/timer";
import { onStage } from "../init/stages";

let elapsedTime = 0.0;
let gameTimer: Timer | undefined;

export function getElapsedTime() {
  if (!gameTimer) return 0;
  return elapsedTime + gameTimer.elapsed;
}

// The elapsed-time Timer is born at the `gameStart` stage, not at the end of
// `main`: timers do not tick during initialization, so the difference is
// invisible, and no Handle is created in the Lua root.
onStage(
  "gameStart",
  "library",
  () => {
    gameTimer = Timer.create().start(30, true, () => {
      elapsedTime += 30;
    });
  },
  "game time",
);
