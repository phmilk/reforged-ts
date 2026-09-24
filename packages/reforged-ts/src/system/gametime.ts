/** @noSelfInFile */

import { Timer } from "../handles/timer";
import { onEntryPoint } from "../init/entry-points";

let elapsedTime = 0.0;
let gameTimer: Timer | undefined;

export function getElapsedTime() {
  if (!gameTimer) return 0;
  return elapsedTime + gameTimer.elapsed;
}

onEntryPoint(
  "main::after",
  "library",
  () => {
    gameTimer = Timer.create().start(30, true, () => {
      elapsedTime += 30;
    });
  },
  "game time",
);
