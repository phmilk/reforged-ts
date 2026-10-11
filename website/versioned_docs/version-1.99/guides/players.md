---
title: Players
sidebar_position: 6
description: The MapPlayer Wrapper, one per slot and never created, the players in the game, the local player and runLocal, forces, and a Map project's own player model.
---

# Players

The game has one `player` Handle per slot, from the first player to the neutral ones, and never creates or destroys them. [`MapPlayer`](../api/reforged-ts/classes/MapPlayer.md) wraps it (the name `Player` is taken by the Native that looks one up). A MapPlayer is never created: it is looked up.

| Lookup                                 | Gives                                                                             |
| -------------------------------------- | --------------------------------------------------------------------------------- |
| `MapPlayer.fromIndex(slot)`            | The player of a slot, from `0`; `undefined` outside the slots                     |
| `tsGlobals.Players[slot]`              | The same, as an array filled at the `globals` [Init stage](init-stages.md)        |
| `MapPlayer.fromEvent()`                | The triggering player of a player event; the `on()` payloads carry it as `player` |
| `MapPlayer.fromEnum()`, `fromFilter()` | The player of a `Force` enumeration or filter                                     |
| `unit.getOwner()`                      | A unit's owner, typed non-null                                                    |
| `MapPlayer.fromLocal()`                | This client's player: a different player on every client                          |

```ts
import { Init, tsGlobals } from "reforged-ts";

Init.onGameStart(() => {
  for (const player of tsGlobals.Players) {
    if (
      player.slotState === PLAYER_SLOT_STATE_PLAYING &&
      player.controller === MAP_CONTROL_USER
    ) {
      player.setState(PLAYER_STATE_RESOURCE_GOLD, 500);
    }
  }
});
```

`tsGlobals.Players` is empty until the `globals` stage: read it from a stage, never at module top level.

## The slot is the id

`player.id` is the slot, from `GetPlayerId`, the same on every client. Unlike the `id` of the other Wrappers, it is data: keep state per player in a [`SyncedMap`](../api/reforged-ts/classes/SyncedMap.md) keyed by it, whose loops run in the same order everywhere ([The four collections](desync-safety-and-guards.md#the-four-collections)). `player.name` is the player's name, `""` when the game has none.

## The local player

Every client runs the same script, and `MapPlayer.fromLocal()` is the one value that tells them apart: it is a different player on each client, which its doc comment marks `@async`. Code that runs for the local player only runs on one client, so it may change what that client shows, and nothing else: a Handle created, a unit moved, a random number drawn there exists on one client only, and the game desyncs ([Runtime facts](runtime-facts.md#async-natives)).

[`MapPlayer.runLocal(player, fn)`](../api/reforged-ts/classes/MapPlayer.md) is the one way to run code for one player. It runs `fn` on the client whose local player is `player`, and does nothing on the others:

```ts
import { MapPlayer, type Effect } from "reforged-ts";

/** Hides `effect` from everyone but `viewer`. */
export function showOnlyTo(viewer: MapPlayer, effect: Effect): void {
  effect.setAlpha(0);
  MapPlayer.runLocal(viewer, () => {
    effect.setAlpha(255);
  });
}
```

Create and look up everything `fn` needs before the call, on every client, and keep only visuals inside: text, frames, sounds, the camera, colours and transparency. In Dev mode, creating or destroying a Wrapper, `Group.for`, `Force.for` and the first `Frame.fromName` of a frame raise inside `runLocal`, at the offending line ([Local-only code](desync-safety-and-guards.md#local-only-code-d1-game-state-changed-for-one-client)). A `GetLocalPlayer()` comparison or `player.isLocal()` works too, but the runtime Guards cannot see it; the lint checks all three forms.

To act on something only one client knows (its local player's choice, a file on its disk), send it to every client first with the [sync System](systems.md#sync).

## Forces

A [`Force`](../api/reforged-ts/classes/Force.md) is a set of players, the game's own grouping for alliances, victory and messages. Create one, add players, and run code for each with `for` (the player is `MapPlayer.fromEnum()` inside) or filter them with `enumPlayers`, `enumAllies` and `enumEnemies`:

```ts
import { Force, Init, MapPlayer, tsGlobals } from "reforged-ts";

Init.onGameStart(() => {
  const team = Force.create();
  for (const player of tsGlobals.Players) {
    if (player.team === 0) {
      team.addPlayer(player);
    }
  }
  team.for(() => {
    const member = MapPlayer.fromEnum();
    if (member !== undefined) {
      member.setState(PLAYER_STATE_RESOURCE_LUMBER, 200);
    }
  });
  team.destroy();
});
```

## Player events

[`PlayerEvents`](../api/reforged-ts/reforged-ts/namespaces/PlayerEvents/index.md) holds the player Event descriptors: `chat(player, text, exactMatch)`, `leave`, `keyDown(player, key, metaKey)` and `keyUp`, the three mouse events, `syncData(player, prefix)`, `allianceChanged(player, allianceType)`, `victory` and `defeat`. Each payload's `player` is the triggering player ([Events](events.md)):

```ts
import { Init, on, PlayerEvents, tsGlobals } from "reforged-ts";

Init.onTriggers(() => {
  for (const player of tsGlobals.Players) {
    on(PlayerEvents.chat(player, "-gold", true), ({ player: speaker }) => {
      speaker.setState(
        PLAYER_STATE_RESOURCE_GOLD,
        speaker.getState(PLAYER_STATE_RESOURCE_GOLD) + 100,
      );
    });
  }
  on(PlayerEvents.leave, ({ player }) => {
    print(`${player.name} left the game.`);
  });
});
```

Keyboard and mouse events reach every client, so their handlers may change game state; the mouse position they carry is the one the game synced with the event.

## Your own player model

`MapPlayer` is meant to be extended. The registry keeps one object per slot, and `fromHandle` called on the subclass gives an instance of it, typed for it, so per-player state can live on the player itself:

```ts
import { MapPlayer } from "reforged-ts";

export class Contestant extends MapPlayer {
  public score = 0;
}

/** The Contestant of a slot: the same object on every call. */
export function contestant(slot: number): Contestant | undefined {
  return Contestant.fromHandle(Player(slot));
}

export function addScore(slot: number, points: number): void {
  const player = contestant(slot);
  if (player !== undefined) {
    player.score += points;
  }
}
```

The other lookups (`fromIndex`, `fromEvent`, `unit.getOwner()`) are typed `MapPlayer`, but they return the cached object, which is a `Contestant` once one was made for the slot: make the Contestants early, in an `Init.onGlobals` callback, and the lookups after give them ([Handles and Wrappers](handles-and-wrappers.md#a-more-specific-class-replaces-a-less-specific-one)). `tsGlobals.Players` is the exception: it keeps the `MapPlayer` objects the library made before your callbacks ran.

## Lint rules

- [`no-game-state-in-local-branch`](lint-rules/no-game-state-in-local-branch.md): game state changed inside `runLocal`, a `GetLocalPlayer()` comparison or a `player.isLocal()` branch.
- [`no-async-value-as-state`](lint-rules/no-async-value-as-state.md): `MapPlayer.fromLocal()` or another client-local value flowing into game state.
- [`no-handle-id-as-data`](lint-rules/no-handle-id-as-data.md): reports the Handle ids of the other Wrappers, never `MapPlayer.id`.
