/** @noSelfInFile */

import { Timer } from "../handles/timer";

export * from "./color";

/**
 * Resolves with no value after `seconds` of game time, on a one-shot Timer
 * (`Timer.after`).
 * @param seconds The game time to wait, in seconds.
 */
export async function sleep(seconds: number): Promise<void> {
  return new Promise((resolve) => {
    Timer.after(seconds, () => {
      resolve();
    });
  });
}
