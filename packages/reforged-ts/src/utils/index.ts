/** @noSelfInFile */

import { Timer } from "../handles/timer";

export * from "./color";

/**
 * Waits for `seconds` of game time, on a one-shot Timer
 * ({@link Timer.after}): `await sleep(2)` inside an `async` function.
 * @remarks
 * Resolves with no value: it is typed `Promise<void>`, where w3ts typed it
 * `Promise<null>`; the value at run time is nil either way.
 * @param seconds - The game time to wait, in seconds.
 * @returns A `Promise` that resolves once the time has passed.
 */
export async function sleep(seconds: number): Promise<void> {
  return new Promise((resolve) => {
    Timer.after(seconds, () => {
      resolve();
    });
  });
}
