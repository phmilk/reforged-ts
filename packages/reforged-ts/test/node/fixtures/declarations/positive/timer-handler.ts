// A Timer handler receives its Timer, `Timer.every` returns the Timer the
// caller owns, and `destroy` and `Timer.after` return `void`.
import { Timer } from "reforged-ts";

type Exactly<T, U> = [T] extends [U] ? ([U] extends [T] ? true : false) : false;

const started: Timer = Timer.create().start(1, true, (timer: Timer) => {
  timer.pause();
});

const periodic: Timer = Timer.every(0.5, (timer) => {
  const received: Timer = timer;
  received.destroy();
});

const destroyReturnsVoid: Exactly<ReturnType<Timer["destroy"]>, void> = true;
const afterReturnsVoid: Exactly<ReturnType<typeof Timer.after>, void> = true;

export { started, periodic, destroyReturnsVoid, afterReturnsVoid };
