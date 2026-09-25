/** @noSelfInFile */

import { Timer } from "../handles/timer";

export * from "./color";

export async function sleep(howMuch: number): Promise<null> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- an unused variable or parameter, whose removal changes the emitted Lua; step 6 (#53) removes it
  return new Promise((resolve, reject) => {
    Timer.create().start(howMuch, false, (timer) => {
      timer.destroy();
      resolve(null);
    });
  });
}
