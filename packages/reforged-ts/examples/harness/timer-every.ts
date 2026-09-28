// A ten-second countdown printed each second: the Timer returned by every
// is the caller's to destroy. Then a one-off call, whose Timer destroys
// itself.
import { Init, Timer } from "reforged-ts";

Init.onGameStart(() => {
  let left = 10;
  Timer.every(1, (timer) => {
    left -= 1;
    print(`${String(left)} seconds left`);
    if (left === 0) {
      timer.destroy();
    }
  });

  Timer.after(10.5, () => {
    print("Go!");
  });
});
