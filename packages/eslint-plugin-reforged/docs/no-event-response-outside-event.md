# no-event-response-outside-event

Reports an event response (`GetTriggerUnit`, `GetEnumUnit`, `GetEventDamage`, `Unit.fromEvent()`, ...) called where its context certainly does not hold: at module top level, in an Init stage callback, or in a timer's callback. A warning in the recommended config; read the value in the handler and capture it, or take it from the `on()` payload.

## Why

Pitfall C1 of the catalogue (#15). An event response answers only inside the event or callback it belongs to: `common.j` lists each one under the comment naming its event, and says of `GetTriggerUnit` that it "returns null handle when used incorrectly". Outside its context it returns nothing, and the code goes on with a nil Handle, which a later Native may crash on; `GetExpiredTimer` "might crash the game if called when there is no expired timer" ([jassdoc](https://github.com/lep/jassdoc)).

The context of an event holds through every synchronous call from its handler, so a helper function the handler calls reads it fine. The rule reports only the places where no context can hold:

- module top level, as [`no-handles-at-module-top-level`](no-handles-at-module-top-level.md) defines it: no event runs while the module loads;
- the body of a function literal passed directly to an Init stage (`Init.onGlobals`, `Init.onTriggers`, `Init.onInitTriggers`, `Init.onGameStart`): it runs from the map's init, in no event;
- the body of a function literal passed directly as a timer's callback (`TimerStart`, `Timer.after`, `Timer.every`, `timer.start`): it runs later, in its own thread, after the handler that started the timer has returned. Only `GetExpiredTimer` and `Timer.fromExpired()` answer there.

The innermost enclosing function literal decides: `ForGroup(group, () => GetEnumUnit())` inside a timer's callback is fine. A call in a named function, a method, or a literal passed anywhere else is never reported.

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
