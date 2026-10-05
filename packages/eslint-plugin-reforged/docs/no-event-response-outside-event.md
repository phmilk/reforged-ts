# no-event-response-outside-event

Reports an event response (`GetTriggerUnit`, `GetEnumUnit`, `GetEventDamage`, `Unit.fromEvent()`, ...) called where its context certainly does not hold: at module top level, in the callback of an Init stage registered at module top level, or in a timer's callback; and `GetExpiredTimer` (`Timer.fromExpired()`) in a trigger's handler, where it crashes the game. A warning in the recommended config; read the value where its context holds: a trigger's response in the handler (captured, or from the `on()` payload), an enumeration's or a filter's in its callback, a timer's in the timer's callback, or the Timer that `Timer.start` passes its handler.

## Why

Pitfall C1 of the catalogue (#15). An event response answers only inside the event or callback it belongs to: `common.j` lists each one under the comment naming its event, and says of `GetTriggerUnit` that it "returns null handle when used incorrectly". Outside its context it mostly returns nothing, and the code goes on with a nil Handle, which a later Native may crash on. `GetExpiredTimer` "might crash the game if called when there is no expired timer" ([jassdoc](https://github.com/lep/jassdoc)), and the Nullability sweep measured where on 3.0.0.24268 (`docs/research/nullability-sweep.md`): in a trigger's action it crashed the game, even with the trigger fired from a timer's callback; in the callback of a destroyed timer it returned nothing.

The context of an event holds through every synchronous call from its handler, so a helper function the handler calls reads it fine. The rule reports only the places where no context can hold, and the one place where an event response crashes the game:

- module top level, as [`no-handles-at-module-top-level`](no-handles-at-module-top-level.md) defines it: no event runs while the module loads;
- the body of a function literal passed directly to an Init stage (`Init.onGlobals`, `Init.onTriggers`, `Init.onInitTriggers`, `Init.onGameStart`) by a registration at module top level: no stage has run yet, so the callback runs later, from the map's initialization. `Init.onGameStart` runs it after `MarkGameStarted`, which blizzard.j calls from a timer, so `GetExpiredTimer` and `Timer.fromExpired()` answer there, and nothing else does. A registration inside a function may come after its stage ran, and the library then runs the callback at once, inside the caller's context: it is never reported;
- the body of a function literal passed directly as a timer's callback (`TimerStart`, `Timer.after`, `Timer.every`, `timer.start`): it runs later, in its own thread, after the handler that started the timer has returned. Only `GetExpiredTimer` and `Timer.fromExpired()` answer there;
- `GetExpiredTimer` and `Timer.fromExpired()` in the body of a function literal passed directly as a trigger's handler (`on(event, handler)`, `trigger.addAction`, `TriggerAddAction`): a trigger's handler runs in a new thread, where no Timer has expired even when the trigger fires from a timer's callback, and the call crashes the game. The rule reports it with its own message, which names the replacement: the Timer that `Timer.start` passes its handler, kept where the trigger's handler can read it. The other event responses of another context return nothing there and are not reported; `ForGroup` and filter callbacks run in the caller's thread instead.

The innermost enclosing function literal decides: `ForGroup(group, () => GetEnumUnit())` inside a timer's callback is fine. A type assertion around the literal (`(() => ...) as () => void`) does not hide it. A call in a named function, a method, or a literal passed anywhere else is never reported.

The message names the response, its context, and where to read it instead: a trigger's response in the handler, captured before a timer starts or taken from the `on()` payload; an enumeration's response inside the enumeration callback; a filter's inside the filter function; a timer's inside the timer's callback.

An event response is a Native listed in the plugin's `data/event-responses.json`, every event response of `common.j` with its context: `trigger` (a trigger's event), `timer` (a Timer's expiry), `enum` (the callback of `ForGroup`, `ForForce`, `EnumItemsInRect`, `EnumDestructablesInRect`) or `filter` (a filter function). A library member is one when the `@native` tags of its declaration all name listed Natives (`Unit.fromEvent()`, `Unit.fromFilter()`, `Trigger.eventId`); `group.getUnits()`, which opens its own `ForGroup`, is not.

## Incorrect

```ts
import { Init, on, Timer, Unit, UnitEvents } from "reforged-ts";

export const hero = GetTriggerUnit(); // module top level: no event

Init.onGameStart(() => {
  print(GetEventDamage()); // an Init stage: no event
});

on(UnitEvents.death, () => {
  Timer.after(2, () => {
    Unit.fromEvent()?.destroy(); // the death has ended when the timer expires
  });
});

on(UnitEvents.damaged, () => {
  Timer.fromExpired()?.destroy(); // a trigger's handler: crashes the game
});
```

## Correct

```ts
import { on, Timer, UnitEvents } from "reforged-ts";

on(UnitEvents.death, ({ unit }) => {
  // read in the handler, captured by the timer's callback
  Timer.after(2, () => {
    unit.destroy();
  });
});

const regeneration = Timer.create().start(1, true, (timer) => {
  print(timer); // the handler's own Timer, which Timer.start passes it
});

on(UnitEvents.damaged, () => {
  regeneration.pause(); // the Timer, kept where the trigger's handler reads it
});
```

## Options

None.

## Suggestions and fixes

None: the value has to be read in the handler that owns the context, and where that is depends on the code around it.

## When not to use it

The places the rule reports hold no context, so a report is a bug in nearly every case. When the call is there for its empty result, such as a check that no event is running, silence that one line and say why:

```ts
// eslint-disable-next-line reforged/no-event-response-outside-event -- asserts that no event runs at load
assert(GetTriggerUnit() === undefined);
```
