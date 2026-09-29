// The TimerEvents descriptor through on(): `TimerEvents.expired(timer)`
// runs a handler when one Timer expires, on its own Trigger, beside the
// handler the Timer was started with. The payload's `timer` is always set.
// on() returns the Subscription whose destroy() ends the handler; the Timer
// stays, its owner's to destroy.
import { Init, on, Timer, TimerEvents } from "reforged-ts";

Init.onGameStart(() => {
  const round = Timer.create().start(60, false, () => {
    print("The round is over");
  });

  // A second listener, from another part of the map, for this round only.
  const warning = on(TimerEvents.expired(round), ({ timer }) => {
    print(`Time is up after ${String(timer.timeout)} seconds`);
    warning.destroy();
  });
});
