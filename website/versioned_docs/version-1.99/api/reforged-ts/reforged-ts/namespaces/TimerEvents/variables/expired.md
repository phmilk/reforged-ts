# Variable: expired

> `readonly` **expired**: (...`args`) => [`EventDescriptor`](../../../../interfaces/EventDescriptor.md)\<\{ `timer`: [`Timer`](../../../../classes/Timer.md); \}\>

Defined in: [events/timer.ts:22](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/events/timer.ts#L22)

`timer` expires; the payload reads it back as the expired Timer.

## Parameters

### args

...\[[`Timer`](../../../../classes/Timer.md)\]

## Returns

[`EventDescriptor`](../../../../interfaces/EventDescriptor.md)\<\{ `timer`: [`Timer`](../../../../classes/Timer.md); \}\>

## Example

**A second listener on a Timer**

```ts
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
```

## Native

[TriggerRegisterTimerExpireEvent](/typings/3.0.0/functions/TriggerRegisterTimerExpireEvent) ([jassbot](https://lep.duckdns.org/jassbot/doc/TriggerRegisterTimerExpireEvent))
