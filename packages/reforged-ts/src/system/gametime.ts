/** @noSelfInFile */

import { Timer } from "../handles/timer";
import { onStage } from "../init/stages";

let elapsedTime = 0.0;
let gameTimer: Timer | undefined;

/**
 * Gets the game time since the game started, from a periodic Timer the
 * library starts at the `gameStart` stage.
 * @remarks
 * The Timer is created after `MarkGameStarted`, where w3ts created it at
 * the end of `main`. Timers do not tick during initialization, so the value
 * is the same on a running game.
 * @returns The elapsed game time, in seconds; 0 before the `gameStart`
 * stage.
 */
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
