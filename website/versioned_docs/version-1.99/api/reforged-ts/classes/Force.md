# Class: Force

Defined in: [handles/force.ts:20](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/force.ts#L20)

A set of players, such as a team, that Natives take as a whole: to show
them something, to reveal buildings to them, or to run code once per
player.

## Remarks

A player is in a force at most once, and the game runs through a force in
slot order, whatever order the players were added in.

## Example

**Making a force of the users in the game**

```ts
// A force of the users in the game, made once the globals stage has filled
// tsGlobals.Players. A second after the game starts, each of them reads how
// many users play.
import { Force, Init, MapPlayer, Timer, tsGlobals } from "reforged-ts";

Init.onGlobals(() => {
  const users = Force.create();
  for (const player of tsGlobals.Players) {
    if (
      player.slotState === PLAYER_SLOT_STATE_PLAYING &&
      player.controller === MAP_CONTROL_USER
    ) {
      users.addPlayer(player);
    }
  }

  Timer.after(1, () => {
    const count = users.getPlayers().length;
    users.for(() => {
      MapPlayer.fromEnum()?.displayTimedText(
        0,
        0,
        10,
        `${String(count)} users are playing.`,
      );
    });
  });
});
```

## Native

[force](/typings/3.0.0/interfaces/force) ([jassbot](https://lep.duckdns.org/jassbot/doc/force))

## Extends

- [`Handle`](Handle.md)\<`force`\>

## Properties

### handle

> `readonly` **handle**: `force`

Defined in: [handles/handle.ts:132](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/handle.ts#L132)

The Handle this Wrapper owns, to pass to a Native the library does not
wrap.

#### Remarks

Do not keep it after `destroy()`: the game frees the object behind it.

#### Inherited from

[`Handle`](Handle.md).[`handle`](Handle.md#handle)

## Accessors

### id

#### Get Signature

> **get** **id**(): `number`

Defined in: [handles/handle.ts:148](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/handle.ts#L148)

Gets the game's numeric id of the Handle.

##### Remarks

Ids are not recycled immediately when the object is destroyed (a new
Handle created right after gets the next id), and they are allocated
deterministically from map start. An id is never data: key a collection
on the Handle (or use `HandleMap` and `HandleSet`), never on its id.

##### Native

[GetHandleId](/typings/3.0.0/functions/GetHandleId) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetHandleId))

##### Returns

`number`

The id, unique among the live Handles.

#### Inherited from

[`Handle`](Handle.md).[`id`](Handle.md#id)

## Methods

### addPlayer()

> **addPlayer**(`whichPlayer`): `void`

Defined in: [handles/force.ts:41](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/force.ts#L41)

Adds a player to the force; a player already in it stays in it once.

#### Parameters

##### whichPlayer

[`MapPlayer`](MapPlayer.md)

The player to add.

#### Returns

`void`

#### Native

[ForceAddPlayer](/typings/3.0.0/functions/ForceAddPlayer) ([jassbot](https://lep.duckdns.org/jassbot/doc/ForceAddPlayer))

***

### clear()

> **clear**(): `void`

Defined in: [handles/force.ts:49](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/force.ts#L49)

Removes every player from the force.

#### Returns

`void`

#### Native

[ForceClear](/typings/3.0.0/functions/ForceClear) ([jassbot](https://lep.duckdns.org/jassbot/doc/ForceClear))

***

### destroy()

> **destroy**(): `void`

Defined in: [handles/force.ts:64](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/force.ts#L64)

Destroys the Force through its Native.

#### Returns

`void`

#### Remarks

In Dev mode the destroyed Wrapper becomes a tombstone: any later access,
a second `destroy()` included, raises
`reforged-ts: used after destroy: <Class>#<id>`, and
`Reforged.debug.report()` counts it destroyed.

#### Throws

In Dev mode, inside `MapPlayer.runLocal`:
`reforged-ts: destroying Force#<id> inside MapPlayer.runLocal changes game state for one client, which desyncs the game: only visuals belong inside runLocal`.

#### Native

[DestroyForce](/typings/3.0.0/functions/DestroyForce) ([jassbot](https://lep.duckdns.org/jassbot/doc/DestroyForce))

***

### enumAllies()

> **enumAllies**(`whichPlayer`, `filter`): `void`

Defined in: [handles/force.ts:81](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/force.ts#L81)

Adds to the force every ally of `whichPlayer` that `filter` accepts.

#### Parameters

##### whichPlayer

[`MapPlayer`](MapPlayer.md)

The player whose allies are candidates.

##### filter

`boolexpr` \| (() => `boolean`)

A `boolexpr`, or a function returning `true` to add the
candidate.

#### Returns

`void`

#### Remarks

The filter reads the candidate with [MapPlayer.fromFilter](MapPlayer.md#fromfilter). In Dev
mode a function filter runs under `pcall`: one that throws is reported
as `Force#<id> Force.enumAllies` and leaves its candidate out.

#### Native

[ForceEnumAllies](/typings/3.0.0/functions/ForceEnumAllies) ([jassbot](https://lep.duckdns.org/jassbot/doc/ForceEnumAllies))

#### Native

[Filter](/typings/3.0.0/functions/Filter) ([jassbot](https://lep.duckdns.org/jassbot/doc/Filter))

***

### enumEnemies()

> **enumEnemies**(`whichPlayer`, `filter`): `void`

Defined in: [handles/force.ts:104](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/force.ts#L104)

Adds to the force every enemy of `whichPlayer` that `filter` accepts.

#### Parameters

##### whichPlayer

[`MapPlayer`](MapPlayer.md)

The player whose enemies are candidates.

##### filter

`boolexpr` \| (() => `boolean`)

A `boolexpr`, or a function returning `true` to add the
candidate.

#### Returns

`void`

#### Remarks

The filter reads the candidate with [MapPlayer.fromFilter](MapPlayer.md#fromfilter). In Dev
mode a function filter runs under `pcall`: one that throws is reported
as `Force#<id> Force.enumEnemies` and leaves its candidate out.

#### Native

[ForceEnumEnemies](/typings/3.0.0/functions/ForceEnumEnemies) ([jassbot](https://lep.duckdns.org/jassbot/doc/ForceEnumEnemies))

#### Native

[Filter](/typings/3.0.0/functions/Filter) ([jassbot](https://lep.duckdns.org/jassbot/doc/Filter))

***

### enumPlayers()

> **enumPlayers**(`filter`): `void`

Defined in: [handles/force.ts:129](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/force.ts#L129)

Adds to the force every player that `filter` accepts, the neutral
players left out.

#### Parameters

##### filter

`boolexpr` \| (() => `boolean`)

A `boolexpr`, or a function returning `true` to add the
candidate.

#### Returns

`void`

#### Remarks

The filter reads the candidate with [MapPlayer.fromFilter](MapPlayer.md#fromfilter). In Dev
mode a function filter runs under `pcall`: one that throws is reported
as `Force#<id> Force.enumPlayers` and leaves its candidate out.
[Force.for](#for) visits the players of the force and leaves it as it
is.

#### Native

[ForceEnumPlayers](/typings/3.0.0/functions/ForceEnumPlayers) ([jassbot](https://lep.duckdns.org/jassbot/doc/ForceEnumPlayers))

#### Native

[Filter](/typings/3.0.0/functions/Filter) ([jassbot](https://lep.duckdns.org/jassbot/doc/Filter))

***

### enumPlayersCounted()

> **enumPlayersCounted**(`filter`, `countLimit`): `void`

Defined in: [handles/force.ts:148](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/force.ts#L148)

Adds to the force the players that `filter` accepts, up to `countLimit`
of them.

#### Parameters

##### filter

`boolexpr` \| (() => `boolean`)

A `boolexpr`, or a function returning `true` to add the
candidate.

##### countLimit

`number`

The most players to add.

#### Returns

`void`

#### Remarks

- jassdoc reports that `countLimit` probably has no effect: expect the
  result of [Force.enumPlayers](#enumplayers).
- The filter reads the candidate with [MapPlayer.fromFilter](MapPlayer.md#fromfilter). In Dev
  mode a function filter runs under `pcall`: one that throws is reported
  as `Force#<id> Force.enumPlayersCounted` and leaves its candidate out.

#### Native

[ForceEnumPlayersCounted](/typings/3.0.0/functions/ForceEnumPlayersCounted) ([jassbot](https://lep.duckdns.org/jassbot/doc/ForceEnumPlayersCounted))

#### Native

[Filter](/typings/3.0.0/functions/Filter) ([jassbot](https://lep.duckdns.org/jassbot/doc/Filter))

***

### for()

> **for**(`callback`): `void`

Defined in: [handles/force.ts:170](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/force.ts#L170)

Runs `callback` once per player of the force,
[MapPlayer.fromEnum](MapPlayer.md#fromenum) answering that player.

#### Parameters

##### callback

() => `void`

The function to run for each player, in slot order.

#### Returns

`void`

#### Remarks

In Dev mode the callback runs under `pcall`: a call that throws
is reported as `Force#<id> Force.for` and the enumeration continues with
the next player. With Dev mode off `ForForce` receives `callback` itself.

#### Throws

In Dev mode, inside `MapPlayer.runLocal`:
`reforged-ts: Force.for inside MapPlayer.runLocal changes game state for one client, which desyncs the game: only visuals belong inside runLocal`.

#### Native

[ForForce](/typings/3.0.0/functions/ForForce) ([jassbot](https://lep.duckdns.org/jassbot/doc/ForForce))

***

### getPlayers()

> **getPlayers**(): [`MapPlayer`](MapPlayer.md)[]

Defined in: [handles/force.ts:181](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/force.ts#L181)

Lists the players of the force.

#### Returns

[`MapPlayer`](MapPlayer.md)[]

A new array of the players, in slot order; empty for an empty
force.

#### Native

[ForForce](/typings/3.0.0/functions/ForForce) ([jassbot](https://lep.duckdns.org/jassbot/doc/ForForce))

***

### hasPlayer()

> **hasPlayer**(`whichPlayer`): `boolean`

Defined in: [handles/force.ts:203](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/force.ts#L203)

Checks whether a player is in the force.

#### Parameters

##### whichPlayer

[`MapPlayer`](MapPlayer.md)

The player to look for.

#### Returns

`boolean`

`true` when the player is in the force.

#### Remarks

It gives the same result as [MapPlayer.inForce](MapPlayer.md#inforce), which calls
`IsPlayerInForce`.

#### Native

[BlzForceHasPlayer](/typings/3.0.0/functions/BlzForceHasPlayer) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzForceHasPlayer))

***

### removePlayer()

> **removePlayer**(`whichPlayer`): `void`

Defined in: [handles/force.ts:212](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/force.ts#L212)

Removes a player from the force; a player not in it is ignored.

#### Parameters

##### whichPlayer

[`MapPlayer`](MapPlayer.md)

The player to remove.

#### Returns

`void`

#### Native

[ForceRemovePlayer](/typings/3.0.0/functions/ForceRemovePlayer) ([jassbot](https://lep.duckdns.org/jassbot/doc/ForceRemovePlayer))

***

### create()

> `static` **create**(): `Force`

Defined in: [handles/force.ts:32](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/force.ts#L32)

Creates an empty force.

#### Returns

`Force`

The new force.

#### Throws

When the game returns no handle:
`reforged-ts: failed to create Force`, at the calling line.

#### Throws

In Dev mode, when called before the globals Init stage:
`reforged-ts: Force created before the globals Init stage: create Handles in Init.onGlobals or a later stage, not at module top level`.

#### Throws

In Dev mode, inside `MapPlayer.runLocal`:
`reforged-ts: creating a Force inside MapPlayer.runLocal changes game state for one client, which desyncs the game: only visuals belong inside runLocal`.

#### Native

[CreateForce](/typings/3.0.0/functions/CreateForce) ([jassbot](https://lep.duckdns.org/jassbot/doc/CreateForce))

***

### fromHandle()

> `static` **fromHandle**\<`C`\>(`this`, `handle`): `C` \| `undefined`

Defined in: [handles/handle.ts:195](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/handle.ts#L195)

Gets the Wrapper for `handle`, making it on first use. The same Handle
always gives the same object; when the object cached for it is of a less
specific class than the one asked for (a `Timer` cached,
`MyTimer.fromHandle` asked), a new object of the class asked for replaces
it. `Unit.fromHandle(h)` is typed `Unit | undefined`.

#### Type Parameters

##### C

`C` *extends* [`Handle`](Handle.md)\<`handle`\>

The Wrapper of the class it is called on.

#### Parameters

##### this

[`WrapperClass`](../type-aliases/WrapperClass.md)\<`C`\>

##### handle

`C`\[`"handle"`\] \| `undefined`

A Handle of the class's Native type.

#### Returns

`C` \| `undefined`

The Wrapper, or `undefined` when `handle` is undefined.

#### Remarks

It creates no Handle, so none of the creation Guards of Dev mode apply:
wrap a Handle that Native code outside the library returned.

#### Inherited from

[`Handle`](Handle.md).[`fromHandle`](Handle.md#fromhandle)

***

### fromPlayer()

> `static` **fromPlayer**(`whichPlayer`): `Force`

Defined in: [handles/force.ts:233](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/force.ts#L233)

Creates a force holding `whichPlayer`: a new force on every call, which
the caller destroys.

#### Parameters

##### whichPlayer

[`MapPlayer`](MapPlayer.md)

The player the force holds.

#### Returns

`Force`

The new force.

#### Remarks

It creates the force and adds the player with Natives; w3ts 3.x called
the Blizzard.j function `GetForceOfPlayer`, with the same result.

#### Throws

When the game returns no handle:
`reforged-ts: failed to create Force`, at the calling line.

#### Throws

In Dev mode, when called before the globals Init stage:
`reforged-ts: Force created before the globals Init stage: create Handles in Init.onGlobals or a later stage, not at module top level`.

#### Throws

In Dev mode, inside `MapPlayer.runLocal`:
`reforged-ts: creating a Force inside MapPlayer.runLocal changes game state for one client, which desyncs the game: only visuals belong inside runLocal`.

#### Native

[CreateForce](/typings/3.0.0/functions/CreateForce) ([jassbot](https://lep.duckdns.org/jassbot/doc/CreateForce))

#### Native

[ForceAddPlayer](/typings/3.0.0/functions/ForceAddPlayer) ([jassbot](https://lep.duckdns.org/jassbot/doc/ForceAddPlayer))
