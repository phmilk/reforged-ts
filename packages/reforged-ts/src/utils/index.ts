/** @noSelfInFile */

import { Timer } from "../handles/timer";

export * from "./color";

/**
 * Resolves with no value after `howMuch` seconds of game time, on a one-shot
 * Timer (`Timer.after`).
 */
export async function sleep(howMuch: number): Promise<void> {
  return new Promise((resolve) => {
    Timer.after(howMuch, () => {
      resolve();
    });
  });
}
