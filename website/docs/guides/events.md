---
title: Events
sidebar_position: 2
description: The two ways to react to a game event, the Trigger Wrapper and the Event descriptors with on(), what a Subscription owns, and how payloads are read.
---

# Events

The game reports what happens (a unit dies, a player types, a timer expires) through triggers: a `trigger` Handle has events registered on it, conditions that decide whether it fires, and actions that run when it does. The library gives two ways to use them:

- **The [`Trigger`](../api/reforged-ts/classes/Trigger.md) Wrapper**, the first surface: every game event, registered and read through the Natives' own vocabulary.
- **Event descriptors with [`on()`](../api/reforged-ts/functions/on.md)**, the second: the events Map projects register most, with a typed payload and one Trigger per handler.

Both run the same triggers underneath and can be mixed in one Map project. Register events in [`Init.onTriggers`](init-stages.md) or later, never at module top level.

## Event descriptors and `on()`

An Event descriptor is a value that knows how to register one game event on a Trigger and how to read that event's payload. `on(descriptor, handler)` creates a Trigger, registers the event on it, and calls `handler` with the payload each time the event fires:

```ts
import { Init, on, UnitEvents } from "reforged-ts";

Init.onTriggers(() => {
  on(UnitEvents.death, ({ unit, killer }) => {
    if (killer !== undefined && killer.getOwner() !== unit.getOwner()) {
      print(`${killer.getOwner().name} scored a kill.`);
    }
  });
});
```

The payload is typed per event, and a field the game may not give is typed `| undefined`: a unit that dies of nothing has no `killer`, a spell without a unit target has no `targetUnit`. A field the event always carries is non-null. The payload is read from the trigger context before the handler runs, so its fields stay valid in code that runs later (a Timer, after `await sleep(...)`); the response Natives (`GetTriggerUnit`, `Unit.fromEvent()`) do not, because the trigger context is gone by then.

### The namespaces

| Namespace                                                                               | Descriptors                                                                                                                                                                                                                                                                                                                                                             |
| --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`UnitEvents`](../api/reforged-ts/reforged-ts/namespaces/UnitEvents/index.md)           | `attacked`, `damaged`, `damaging`, `death`, `pickupItem`, `dropItem`, `useItem`, `sellItem`, `pawnItem`, `equip`, `unequip`, `orderIssued`, `orderPoint`, `orderTarget`, `orderUnit`, `changeOwner`, `trainFinish`, `constructFinish`, `researchFinish`, `upgradeFinish`, `heroLevel`, `heroSkill`, `selected`, `deselected`, the five spell events, `summon`, `loaded` |
| [`PlayerEvents`](../api/reforged-ts/reforged-ts/namespaces/PlayerEvents/index.md)       | `chat`, `leave`, `keyDown`, `keyUp`, `mouseDown`, `mouseUp`, `mouseMove`, `syncData`, `allianceChanged`, `victory`, `defeat`                                                                                                                                                                                                                                            |
| [`TimerEvents`](../api/reforged-ts/reforged-ts/namespaces/TimerEvents/index.md)         | `expired`                                                                                                                                                                                                                                                                                                                                                               |
| [`RegionEvents`](../api/reforged-ts/reforged-ts/namespaces/RegionEvents/index.md)       | `enter`, `leave`                                                                                                                                                                                                                                                                                                                                                        |
| [`FrameEvents`](../api/reforged-ts/reforged-ts/namespaces/FrameEvents/index.md)         | `of`                                                                                                                                                                                                                                                                                                                                                                    |
| [`DialogEvents`](../api/reforged-ts/reforged-ts/namespaces/DialogEvents/index.md)       | `click`, `buttonClick`                                                                                                                                                                                                                                                                                                                                                  |
| [`TrackableEvents`](../api/reforged-ts/reforged-ts/namespaces/TrackableEvents/index.md) | `hit`, `track`                                                                                                                                                                                                                                                                                                                                                          |

A descriptor that needs no argument is the member itself (`UnitEvents.death`, `PlayerEvents.leave`, registered for every player slot). One that needs arguments is a function of them: `PlayerEvents.chat(player, text, exactMatch)`, `TimerEvents.expired(timer)`, `RegionEvents.enter(region, filter?)`, `FrameEvents.of(frame, frameEventType)`. A unit event also has an `Of` form registered on one unit when the game has a unit event for it, `UnitEvents.deathOf(unit)` or `UnitEvents.damagedOf(unit)`, which fires for that unit only.

An event without a descriptor is still reachable through the Trigger Wrapper (below). The descriptors cover the events Map projects register most, the events whose payload needs more than one Native, and those whose response Natives are easy to misuse; game state limits, unit state limits, train and construct starts, and the generic player key event, among others, are Trigger-only in this release.

### `when`: a condition

The third argument of `on()` is a predicate over the same payload. It runs first, as the trigger's condition, and the handler runs only when it returns `true`:

```ts
import { Init, on, UnitEvents } from "reforged-ts";

const HOLY_LIGHT = FourCC("AHhb");

Init.onTriggers(() => {
  on(
    UnitEvents.spellEffect,
    ({ caster, targetUnit }) => {
      if (targetUnit !== undefined) {
        print(`${caster.getOwner().name} healed a unit.`);
      }
    },
    ({ abilityId }) => abilityId === HOLY_LIGHT,
  );
});
```

A condition cannot sleep: the sleeping Natives kill the thread there. Keep `when` to a test.

### Subscriptions

`on()` returns a [`Subscription`](../api/reforged-ts/interfaces/Subscription.md): it holds the one Trigger `on()` created for this handler, and the caller owns it. `destroy()` destroys that Trigger and no other, so ending one handler never touches another handler of the same event:

```ts
import { on, UnitEvents, type Subscription, type Unit } from "reforged-ts";

/** Reports the damage `boss` takes until `stop` is called. */
export function trackDamage(boss: Unit): () => void {
  let total = 0;
  const subscription: Subscription = on(
    UnitEvents.damagedOf(boss),
    ({ amount }) => {
      total += amount;
    },
  );
  return () => {
    subscription.destroy();
    print(`The boss took ${String(total)} damage.`);
  };
}
```

A Subscription never destroyed keeps its Trigger for the rest of the game. `subscription.trigger` is that Trigger, for what the descriptor does not offer (`trigger.enabled = false` to pause the handler).

Across Subscriptions to the same event, the library promises no order. The game fires triggers in registration order in practice, but it does not guarantee it: when two handlers depend on each other, make them one handler.

## The Trigger Wrapper

`Trigger` wraps the `trigger` Handle and covers every event registration Native as a `register*` member. Each member returns the Trigger, so a whole trigger is one chain. The handler reads the event with the Wrappers' lookups (`Unit.fromEvent()`, `Unit.fromKilling()`, `MapPlayer.fromEvent()`), each typed `| undefined`:

```ts
import { Init, MapPlayer, Trigger } from "reforged-ts";

Init.onTriggers(() => {
  const first = MapPlayer.fromIndex(0);
  if (first === undefined) {
    return;
  }
  // A game state limit: an event with no descriptor.
  Trigger.create()
    .registerPlayerStateEvent(
      first,
      PLAYER_STATE_RESOURCE_GOLD,
      GREATER_THAN_OR_EQUAL,
      1000,
    )
    .addCondition(() => first.getState(PLAYER_STATE_RESOURCE_LUMBER) < 500)
    .addAction(() => {
      print("Rich in gold, poor in lumber.");
    });
});
```

- `addCondition` takes a plain function (or a `boolexpr`) and wraps it itself; conditions join by AND.
- `addAction` adds an action; a Trigger can have several, run in order.
- `enabled`, `eval()`, `exec()`, `reset()`, `removeActions()` and the counters follow the Natives. `interrupt()` and `isRunning()` are the 3.0.0 additions.
- `destroy()` destroys the Trigger. Do not destroy a Trigger from its own action while it waits: the game's handle stack can break.

## In Dev mode

The functions a trigger runs are protected in Dev mode: an `on()` handler or `when` that throws is reported under the descriptor's name (`reforged-ts: UnitEvents.death failed: <error>`), a Trigger action or condition under the Trigger (`Trigger#1048581 Trigger.addAction`), and the game thread survives. A `when` or a condition that throws evaluates `false`. With Dev mode off, the functions run as the game runs any function ([Protected callbacks](desync-safety-and-guards.md#protected-callbacks-c4-a-callback-error-kills-the-thread-silently)).

The damage events (`UnitEvents.damaged`, `UnitEvents.damaging`, and a Trigger registering one of the four damage events) run inside a damage context: in Dev mode, `Unit.damageTarget` called from their handlers raises past a nesting limit, so a handler that deals damage back cannot loop until the client crashes ([Damage re-entrancy](desync-safety-and-guards.md#damage-re-entrancy-c6)).

## Lint rules

- [`no-unsafe-natives`](lint-rules/no-unsafe-natives.md): `TriggerSleepAction` and `PolledWait` kill the thread outside a trigger action; wait with [`sleep`](timers.md#waiting-in-code) instead.
- [`no-unused-handle-result`](lint-rules/no-unused-handle-result.md): a `Filter(...)` or `Condition(...)` whose result is dropped leaks.
- [`no-handles-at-module-top-level`](lint-rules/no-handles-at-module-top-level.md): `Trigger.create()` at module top level. `on()` creates a Trigger too, so it belongs in an Init stage as well, though the rule does not report it.
