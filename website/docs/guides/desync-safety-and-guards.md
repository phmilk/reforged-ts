---
title: Desync safety and guards
sidebar_label: Desync safety and guards
description: What the type layer, the lint and Dev mode catch of the classic Warcraft III scripting pitfalls, every runtime Guard with its message, and the four safe collections.
---

# Desync safety and guards

A Warcraft III map that makes one of the classic scripting mistakes usually gets no signal from the game. A callback that throws is killed silently. A Handle created for one player desyncs the lobby minutes later. A destroyed unit's Wrapper keeps calling Natives on a dead object. A damage handler that damages back loops until the client crashes. A leaked group slows the game down over an hour. A table iterated with `pairs` runs in a different order on each client.

reforged-ts catches these mistakes with Guards in three layers:

| Layer              | What it is                                                                                                                               | When it runs                    |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| The type layer     | Branded Handles, creation members typed non-null, lookups typed `X \| undefined`, `@async` on the Natives whose value differs per client | In the editor, at compile time  |
| The lint layer     | `eslint-plugin-reforged`, type-aware rules the Template enables by default (see the Lint rules guide)                                    | In the editor and in CI         |
| The runtime Guards | Checks inside the library, active only in Dev mode                                                                                       | While the map runs, in Dev mode |

This page covers the runtime Guards, how Dev mode is switched, what `Reforged.debug.report()` counts, and the four collections that replace the unsafe patterns. Every runtime message starts with `reforged-ts:`, so searching this page for the text on your screen finds its explanation.

## Dev mode

Dev mode is one flag. Set it with `Reforged.configure`, as the first statement of the Map project's entry point:

```ts
import { Reforged } from "reforged-ts";

Reforged.configure({ devMode: true });
```

The Template generates this call from its build mode: a development build turns Dev mode on, a release build turns it off. A Map project never configures individual Guards. The library defaults to off, so a map that never calls `configure` runs as a release build.

- **Decided at registration, never per call.** Every Guard is decided at one of three moments: when a callback is registered (it is wrapped or handed to the Native as is), when a Wrapper is created, and when it is destroyed. Wrapper methods that call Natives contain no Guard code.
- **Callbacks keep their mode.** A callback registered before `configure` keeps the mode it was registered under, and a later call does not wrap it again. So in Dev mode (on before the call or after it), any call after the Map project registered a callback prints a warning naming the first registration, because it usually means `configure` is in the wrong place:

  ```text
  reforged-ts: Reforged.configure({ devMode: true }) called after a callback was registered (the first: Timer#1048580 Timer.start): call it first in the entry point; a callback keeps the mode it was registered under
  ```

  With Dev mode off before and after the call, nothing is printed. The first call of a second execution of the Lua root (which the game can run twice in one game) that keeps the mode is the same statement run again, and prints nothing either.

- **`damageDepthLimit`.** `Reforged.configure({ devMode: true, damageDepthLimit: 4 })` sets how deep damage handlers may nest before the re-entrancy Guard stops them (eight until a call sets it; a call without it keeps the current limit). It is read when damage is dealt, so a new limit applies at once.
- **`Reforged.devMode`** reads the flag.

### What a release build pays

With Dev mode off, the runtime layer costs nothing per call. A test of the library (`release-cost.test.ts`) asserts this definition:

- the function the library hands a Native is the very function you passed: `TriggerAddAction`, `Condition`, `Filter` (every `Trigger` registration member and every `Group`, `Force` and `Rectangle` enumeration member that takes a function), `ForGroup`, `ForForce`, and the actions of `Rectangle.enumItems` and `Rectangle.enumDestructables`;
- `MapPlayer.runLocal` is the bare `GetLocalPlayer()` comparison;
- `destroy()` calls its Native, removes the Wrapper from the registry and tells the collections holding its Handle, and nothing else;
- nothing is counted.

One exception: `Timer.start`, `Timer.after` and `Timer.every` pass their handler its Timer, so `TimerStart` receives a small closure around your handler in both modes. With Dev mode off that closure has no `pcall`, reports nothing and lets an error propagate, as a raw `TimerStart` handler does. `on()` handlers are the same: the Trigger action is the library's payload adapter, without `pcall` in release.

## The runtime Guards

Each Guard below is active in Dev mode only, unless the entry says otherwise. The pitfall codes (C4, D1, ...) refer to the pitfall catalogue the Guards were designed from.

### Protected callbacks (C4: a callback error kills the thread silently)

**What it catches.** A timer handler, trigger action, condition, filter or enumeration callback that throws. The game kills the thread without a message, and the rest of the callback never runs.

**What it does.** Every function the library hands a Native runs under `pcall`:

- `Timer.start`, `Timer.after`, `Timer.every`;
- `Trigger.addAction`, `Trigger.addCondition`, and the filters of `Trigger.registerEnterRegion`, `registerLeaveRegion`, `registerFilterUnitEvent`, `registerPlayerUnitEvent` and `registerUnitInRange`;
- the filters of the `Group.enumUnits*` members, `Force.enumAllies`, `enumEnemies`, `enumPlayers` and `enumPlayersCounted`, and `Rectangle.enumItems` and `enumDestructables` (filter and action);
- `Group.for` and `Force.for`;
- `on()` handlers and `when` predicates, and the sync System's callbacks, which run inside trigger actions.

A failure is shown on screen to the local player for thirty seconds and printed, on one line:

```text
reforged-ts: <origin> failed: <Lua error>
```

The origin is the Wrapper's class and id and the member that registered the callback (`Timer#1048580 Timer.start`, `Trigger#1048581 Trigger.addAction`, `Group#1048582 Group.enumUnitsInRange`), or the Event descriptor's name for an `on()` subscription (`UnitEvents.death`). The Lua error text is unchanged and carries the `war3map.lua` line. The game has no `debug` library, so there is no stack trace.

- The other callbacks of the same trigger or timer still run.
- A condition or filter that throws evaluates `false`, as the game evaluates a crashed condition, so Dev mode does not change what the trigger fires on or which unit an enumeration includes.
- The same callback failing again with the same message is not shown again: it is counted, and `Reforged.debug.report()` prints the count. A different message from the same callback is shown.

With Dev mode off, errors propagate as they do in plain Lua.

### Local-only code (D1: game state changed for one client)

**What it catches.** Code that runs for one player only (a local-player branch) and changes game state: creating or destroying a Handle, enumerating a group or a force, allocating a frame handle. The other clients never see the change, and the game desyncs, sometimes minutes later.

**What it does.** `MapPlayer.runLocal(player, fn)` is the one sanctioned way to run code for one player: it runs `fn` on the client whose local player is `player`, and does nothing elsewhere.

```ts
MapPlayer.runLocal(player, () => {
  frame.visible = true; // visuals only
});
```

In Dev mode, inside `fn`, these raise at the line that called them:

| Inside `runLocal`                                                    | Message                                                                                                                                                                        |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Creating a Wrapper (`Unit.create`, `Timer.create`, ...)              | `reforged-ts: creating a Unit inside MapPlayer.runLocal changes game state for one client, which desyncs the game: only visuals belong inside runLocal`                        |
| Destroying one (`unit.destroy()`, ...)                               | `reforged-ts: destroying Unit#1048583 inside MapPlayer.runLocal changes game state for one client, which desyncs the game: only visuals belong inside runLocal`                |
| `Group.for`, `Force.for`                                             | `reforged-ts: Group.for inside MapPlayer.runLocal changes game state for one client, which desyncs the game: only visuals belong inside runLocal`                              |
| The first `Frame.fromName` of a frame the library has no Wrapper for | `reforged-ts: the first Frame.fromName("ScorePanel") inside MapPlayer.runLocal changes game state for one client, which desyncs the game: only visuals belong inside runLocal` |

A creation or destruction raises after its Native ran: the Guard does not undo the change or stop it from happening. It raises at the offending line while you test in Dev mode, so the bug is found and fixed before a release build, which has no Guard, reaches a lobby. The same holds for the creation Guard of the next section.

Create and look up what `fn` needs before calling `runLocal`, on every client. An error inside `fn` is reported like a failing callback, once per function and message, and does not escape:

```text
reforged-ts: MapPlayer#1048576 MapPlayer.runLocal failed: <Lua error>
```

With Dev mode off, `runLocal` is the bare comparison and nothing inside it raises.

A raw `if (GetLocalPlayer() === p)` branch bypasses the library, so the runtime layer cannot see it: the lint rule `no-game-state-in-local-branch` covers raw branches, `player.isLocal()` branches and `runLocal` functions alike, and also reports random-number calls in local code (D2), which the runtime layer does not check.

### Creation before the globals Init stage (D7)

**What it catches.** A Handle created at module top level, before the game has set up the map (for example `const t = Timer.create()` next to the imports). It runs before the players and the editor's globals exist, and desyncs sporadically.

**What it does.** A creation member called before the globals Init stage was entered raises at the calling line:

```text
reforged-ts: Timer created before the globals Init stage: create Handles in Init.onGlobals or a later stage, not at module top level
```

The creation Native has run by then, so the Guard does not prevent the early Handle: it names the line in Dev mode, so the creation is moved before a release build ships. Creations inside `Init.onGlobals` callbacks or later pass. The documented non-null lookups (`MapPlayer.fromLocal()`, `unit.getOwner()`) are lookups, not creations, and pass. The lint rule `no-handles-at-module-top-level` reports the same mistake in the editor.

### Use after destroy (S3)

**What it catches.** A Wrapper used after `destroy()`: a stale reference kept in a variable or a table, or a second `destroy()` (a double free). The Natives keep running on a dead Handle without a word.

**What it does.** In Dev mode `destroy()` turns the Wrapper into a tombstone: its fields, the Handle included, are cleared, and any later access raises at the line of the access:

```text
reforged-ts: used after destroy: Unit#1048583
```

Reading a property or `.handle`, calling a method, writing a field and a second `destroy()` all raise. `tostring(unit)` renders `Unit#1048583 (destroyed)`. Read `.handle` or `.id` before destroying a Wrapper if you need them afterwards.

In both modes, `destroy()` removes the Wrapper from the Handle registry: a later `Unit.fromHandle` with the same Handle returns a new Wrapper, never the destroyed one. An older reference that the registry upgraded (a `Widget` looked up before the `Unit` of the same Handle) is not the canonical Wrapper and does not become a tombstone.

### Damage re-entrancy (C6)

**What it catches.** A damage handler that deals damage fires the damage events again, which runs the handler again, until the client crashes.

**What it does.** A Trigger registered for a damaged or damaging event (through `registerUnitEvent`, `registerFilterUnitEvent`, `registerPlayerUnitEvent` or `registerAnyUnitEvent`, so every `on()` damage subscription too) runs its actions and conditions one level deeper in a shared damage depth. `Unit.damageTarget` raises when the depth is past the limit:

```text
reforged-ts: Unit#1048583 Unit.damageTarget at damage depth 9, past the limit of 8: a damage handler that deals damage fires the damage events again, which loops until the client crashes
```

The error is reported as the failure of the handler that dealt the damage. The limit is eight nested dispatches by default, set with `Reforged.configure({ devMode: true, damageDepthLimit })`. A single bounce, the reflect-damage pattern, passes.

### Leak counters (L1: Handles never destroyed)

**What it catches.** Handles created and never destroyed: groups, points, effects, timers created in a loop and dropped. The game slows down over the match with nothing pointing at the leak.

**What it does.** In Dev mode every Wrapper the library creates is counted per class, and every `destroy()` too. `Reforged.debug.report()` prints and returns the counts (see below). A leak shows as a live count that keeps growing between two reports.

### Key kinds of `SyncedMap` and `SyncedSet` (D4)

**What it catches.** A `SyncedMap` or `SyncedSet` without a comparator whose keys mix numbers and strings, or hold other values: the sort that keeps iteration identical on every client cannot compare them.

**What it does.** In Dev mode the insertion raises at the line that inserted:

```text
reforged-ts: SyncedMap without a comparator takes keys of one kind, got a string after number keys: the sorted order that keeps iteration identical on every client cannot compare them
reforged-ts: SyncedMap without a comparator takes number or string keys, got a table: pass a comparator to the constructor to order other keys
```

With Dev mode off the sort itself raises when it compares them, at the next loop: still loud, and still the same on every client.

## `Reforged.debug.report()`

`Reforged.debug.report()` prints the report and returns it as `{ wrappers, failures }`:

```text
reforged-ts: debug report
reforged-ts: counts only the Wrappers the library created and destroyed: a unit that decayed or an effect the game removed stays live here
reforged-ts: Timer: created 3, destroyed 1, live 2
reforged-ts: Group: created 1, destroyed 1, live 0
reforged-ts: Timer#1048580 Timer.every failed 12x: war3map.lua:1234: attempt to index a nil value
```

- **`wrappers`**: one row per Wrapper class, `{ className, created, destroyed, live }`, most live first. `created` counts the creation members (`Timer.create`, `Unit.create`, `unit.getPoint()`, ...) and `destroyed` counts `destroy()` of a Wrapper counted created since the last reset, so no count goes below zero: destroying a Wrapper got by a lookup, or one created before the last reset or before Dev mode was on, counts nothing. Lookups (`fromHandle`, `fromEvent`, `MapPlayer.fromLocal()`, `unit.getOwner()`) are never counted: they wrap objects the library did not create.
- **`failures`**: each protected callback that failed, `{ origin, message, count }`, once per distinct message, in the order they first failed, with how many times it failed. Without failures the report prints `reforged-ts: no callback failed`.

The Wrapper counts are a heuristic, and the report says so on its second line. They count only the creations and destructions the library saw: a unit that decayed, a unit removed by the editor's triggers or an effect the game removed stays live in the report. They are exact for the classes only the library creates and destroys (`Point`, `Group`, `Force`, `Timer`, `Trigger`, `Effect`, `Frame`, `TimerDialog`, boards, dialogs).

`Reforged.debug.reset()` zeroes both: every Wrapper row stays, at zero, the failures are forgotten, and the next failure of each callback is shown on screen again. With Dev mode off, both print `reforged-ts: Dev mode is off: Reforged.debug has nothing to report` and `report()` returns empty lists.

## The four collections

Two unsafe patterns have a safe replacement in the library. The lint layer points at them by name: `no-unordered-iteration` names `SyncedMap` and `SyncedSet`, and `prefer-handle-map` names `HandleMap` and `HandleSet`. All four work the same in Dev mode and in release, and have the `Map` or `Set` surface: `get`, `set` or `add`, `has`, `delete`, `clear`, `size`, `forEach`, `keys`, `values`, `entries`, `for...of`, and a constructor taking the first entries.

| Instead of                                                                      | Use                      | Why                                                                                     |
| ------------------------------------------------------------------------------- | ------------------------ | --------------------------------------------------------------------------------------- |
| A plain object or `LuaTable` iterated with `for...in`, `Object.keys` or `pairs` | `SyncedMap`, `SyncedSet` | `pairs` order is not guaranteed to be the same on every client (D4)                     |
| A `Map` or `Set` keyed by Wrappers (`Map<Unit, number>`)                        | `HandleMap`, `HandleSet` | The entry outlives the destroyed unit and the table grows for the rest of the game (L2) |

### `SyncedMap` and `SyncedSet`

They iterate in sorted key order, whatever the order the keys were inserted in, so a loop runs identically on every client. Keys are numbers or strings (all of one kind per instance), or any value when you pass a comparator to the constructor:

```ts
import { SyncedMap, type Unit } from "reforged-ts";

const scores = new SyncedMap<number, number>(); // by player id
const byName = new SyncedMap<Unit, number>((a, b) =>
  a.name < b.name ? -1 : a.name > b.name ? 1 : 0,
);
```

A comparator must give the same answer on every client: compare ids or names, never `tostring` or handle addresses. A loop walks a snapshot of the keys, so deleting any key during it is safe. Swapping a `Map` for a `SyncedMap` is a type change. They never compile to `pairs`.

A plain `Map` or `Set` is not unordered: typescript-to-lua's runtime keeps their keys in insertion order, and the lint does not report them. Use `SyncedMap` when the order must not depend on the order of the insertions, for instance when some insertions happen in callbacks whose order you do not control.

### `HandleMap` and `HandleSet`

They are keyed by Wrappers, and an entry disappears when its key is destroyed: `unit.destroy()` removes the unit from every `HandleMap` and `HandleSet` holding it.

```ts
import { HandleMap, Unit } from "reforged-ts";

const kills = new HandleMap<Unit, number>();
kills.set(hero, (kills.get(hero) ?? 0) + 1);
```

- They are keyed by the Handle, not the Wrapper object, so an entry set through the `Widget` that `Widget.fromEvent()` returned is found through the `Unit` the registry upgraded it to. Keys come back as the current Wrapper.
- They iterate in insertion order and never through `pairs`: the order is the same on every client as long as the insertions ran in the same order, that is, in synchronous code, not inside `MapPlayer.runLocal`.
- They keep their keys alive until they are deleted or destroyed. A unit the game removed on its own (a decayed corpse) stays until you delete it, because the library sees no `destroy()` for it.

## What the Guards cannot catch

- **Code that bypasses the library.** Raw `GetLocalPlayer()` branches, raw `CreateGroup()` calls and raw Native callbacks are not seen by the runtime layer. The lint covers the raw local branches.
- **Destruction the library does not see.** A unit that decays or an effect the game removes is still live in the leak report, and still a key of a `HandleMap`.
- **Stack traces.** The game has no `debug` library: a report carries the Wrapper, the member and the `war3map.lua` line of the error, never a traceback.
- **Pitfalls with no runtime Guard.** Sleeping in a callback (`TriggerSleepAction`, `PolledWait`: the lint rule `no-unsafe-natives`) and asset paths with a dot in the file name (`no-dotted-asset-paths`) are lint-only; a frame Native called on the wrong frame kind, and frames created before the game started, are not guarded yet.
