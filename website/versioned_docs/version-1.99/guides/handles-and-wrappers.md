---
title: Handles and Wrappers
sidebar_position: 1
description: How a Wrapper owns one Handle, why the same Handle always gives the same object, and the one error rule of the library, creation throws and lookup returns undefined.
---

# Handles and Wrappers

A Handle is the game's opaque reference to an engine object: a `unit`, a `timer`, a `framehandle`. The Natives take and return Handles, and the [Typings](typings.md) declare each Handle type as a branded type, so a timer is never accepted where a unit is expected. A Wrapper is a library class that owns one Handle and exposes the Natives of its type as typed members: [`Unit`](../api/reforged-ts/classes/Unit.md) wraps a `unit`, [`Timer`](../api/reforged-ts/classes/Timer.md) a `timer`, [`Frame`](../api/reforged-ts/classes/Frame.md) a `framehandle`. Every Wrapper extends the [`Handle`](../api/reforged-ts/classes/Handle.md) base, which holds the rules on this page.

```ts
import { Init, MapPlayer, Unit } from "reforged-ts";

Init.onGameStart(() => {
  const owner = MapPlayer.fromIndex(0);
  if (owner === undefined) {
    return;
  }
  // A Footman, `FourCC("hfoo")`, at the centre of the map.
  const footman = Unit.create(owner, FourCC("hfoo"), 0, 0);
  footman.moveSpeed = 400;
  footman.issueOrderAt("move", 512, 512);
});
```

## Names

A Wrapper is named after its Handle type, capitalised: `timer` is `Timer`, `unit` is `Unit`, `effect` is `Effect`. When that name is already a Native function, the Wrapper takes a descriptive noun instead: `player` is [`MapPlayer`](../api/reforged-ts/classes/MapPlayer.md) because `Player` is a Native, `rect` is [`Rectangle`](../api/reforged-ts/classes/Rectangle.md) because `Rect` is one, and `location` is [`Point`](../api/reforged-ts/classes/Point.md).

A Wrapper is never built with `new`: its constructor is protected and only stores the Handle. Objects come from the Wrapper's statics, the creation members and the lookups below.

## One object per Handle

The library keeps a registry of one Wrapper object per Handle. The same Handle always gives the same object, whichever member returned it, so `===` compares game objects:

```ts
import { Init, on, UnitEvents, type Unit } from "reforged-ts";

export function watchBoss(boss: Unit): void {
  Init.onTriggers(() => {
    on(UnitEvents.death, ({ unit }) => {
      if (unit === boss) {
        print("The boss is dead.");
      }
    });
  });
}
```

A Wrapper is also a safe key. A Handle keeps its identity across Natives ([Runtime facts](runtime-facts.md#handle-identity)), and so does its Wrapper. Key a collection by the Wrapper with [`HandleMap`](../api/reforged-ts/classes/HandleMap.md) or [`HandleSet`](../api/reforged-ts/classes/HandleSet.md), which drop the entry when its Wrapper is destroyed ([Desync safety and guards](desync-safety-and-guards.md#handlemap-and-handleset)). A `Map` or `Set` keyed by Wrappers keeps a removed unit's entry until you delete it, and iterates in an order that can differ between clients.

**The id is not data.** The `id` accessor returns `GetHandleId`, which is not guaranteed to be the same on every client ([Runtime facts](runtime-facts.md#handle-ids)). Display it, never store it, compare it or key by it: key by the Wrapper. `MapPlayer.id` is the exception: it is the player's slot, the same everywhere ([Players](players.md)).

### A more specific class replaces a less specific one

`Unit`, `Item` and `Destructable` extend [`Widget`](../api/reforged-ts/classes/Widget.md), and a Map project can extend a Wrapper with its own class. When the registry holds a Wrapper of a less specific class than the one asked for, it replaces it: a `Widget` cached by `Widget.fromEvent()`, then `Unit.fromEvent()` for the same Handle, gives a new `Unit`, which the registry keeps from then on. The old `Widget` object stays valid, but it is no longer the canonical object for `===`.

`fromHandle` called on a subclass gives an instance of it, typed for it, so a Map project can attach its own model to a game object:

```ts
import { Unit } from "reforged-ts";

export class Hero extends Unit {
  public kills = 0;
}

/** The Hero of `unit`: the same object on every later call. */
export function asHero(unit: Unit): Hero | undefined {
  return Hero.fromHandle(unit.handle);
}
```

`MapPlayer` is meant to be extended the same way ([Players](players.md#your-own-player-model)).

## Creation throws, lookup returns `undefined`

The library applies one error rule to every Wrapper ([ADR 0003](../contributing/adr/0003-creation-throws-lookup-returns-undefined.md)):

| Kind of member                                                                  | Type             | When the game gives nothing                    |
| ------------------------------------------------------------------------------- | ---------------- | ---------------------------------------------- |
| Creation: `create`, `createAttachment`, ... (`Unit.create`, `Frame.create`)     | `X`              | Throws `reforged-ts: failed to create X (...)` |
| Lookup: `fromHandle`, `fromEvent`, `fromKilling`, `fromIndex`, `getItemInSlot`… | `X \| undefined` | Returns `undefined`                            |

**A creation that fails is a programmer error**: a rawcode that does not exist, a frame name with no FDF definition, a missing model. The error names the Wrapper and what identified the request, and points at the line that called the creation member:

```text
reforged-ts: failed to create Unit (hfoo)
reforged-ts: failed to create Frame (ScorePanel)
```

So a creation needs no `?.`: its result is always a Wrapper.

**A lookup that finds nothing is a normal case**: an event with no killing unit, an empty inventory slot, a player slot the game has no player for. The type makes you handle it:

```ts
import { Trigger, Unit } from "reforged-ts";

export function announceDeath(boss: Unit): Trigger {
  return Trigger.create()
    .registerDeathEvent(boss)
    .addAction(() => {
      const killer = Unit.fromKilling();
      if (killer === undefined) {
        print("The boss died.");
      } else {
        print(`${killer.getOwner().name} slew the boss.`);
      }
    });
}
```

Two lookups are typed non-null because the game guarantees a result the Typings cannot express: `unit.getOwner()` (a live unit has an owner) and `MapPlayer.fromLocal()` (`GetLocalPlayer` never returns nothing). Their doc comments say so.

A thrown error kills the game thread it runs in, silently, unless something catches it. The [Init stages](init-stages.md) run every callback under `pcall` and print the failure, and in Dev mode every callback the library hands a Native runs under `pcall` too ([Desync safety and guards](desync-safety-and-guards.md#protected-callbacks-c4-a-callback-error-kills-the-thread-silently)).

## Destroying

A Wrapper that owns something the game allocates has a `destroy()` member: it calls the Native (`DestroyTimer`, `RemoveUnit`, `DestroyEffect`), removes the registry entry, and removes the Handle from every `HandleMap` and `HandleSet`. A later lookup of the same Handle gives a new Wrapper. Lua's garbage collector frees Lua values, not engine objects: what you create and never destroy leaks for the rest of the game.

In Dev mode a destroyed Wrapper becomes a tombstone: any later access raises `reforged-ts: used after destroy: Timer#1048580` at the offending line ([Use after destroy](desync-safety-and-guards.md#use-after-destroy-s3)), and [`Reforged.debug.report()`](desync-safety-and-guards.md#reforgeddebugreport) counts the Wrappers created and destroyed per class.

## Natives the Wrapper does not cover

`handle` is the Wrapper's Handle, typed with its Handle type. Pass it to a Native the Wrapper has no member for:

```ts
import type { Unit } from "reforged-ts";

export function turnSlowly(unit: Unit, facing: number): void {
  SetUnitFacingTimed(unit.handle, facing, 2);
}
```

Every Native whose first parameter is a Wrapper's Handle type is meant to become a member of that Wrapper, and the library never mirrors the `*BJ` functions of `blizzard.j` ([ADR 0008](../contributing/adr/0008-wrapper-coverage-rule-and-no-bj-mirroring.md)); the [3.0.0 systems](3-0-0-systems.md) guide covers the step that closes the remaining gaps.

## Lint rules

- [`no-unused-handle-result`](lint-rules/no-unused-handle-result.md): a creation whose result is dropped can never be destroyed.
- [`no-handles-at-module-top-level`](lint-rules/no-handles-at-module-top-level.md): create Handles in an Init stage, not when the module loads.
- [`no-handle-id-as-data`](lint-rules/no-handle-id-as-data.md): the id is not the same on every client.
- [`prefer-handle-map`](lint-rules/prefer-handle-map.md): a `Map` or `Set` keyed by Wrappers keeps dead entries.
- [`no-legacy-w3ts-names`](lint-rules/no-legacy-w3ts-names.md): the w3ts 3.x constructors (`new Unit(...)`) and renamed members, with their replacements.
