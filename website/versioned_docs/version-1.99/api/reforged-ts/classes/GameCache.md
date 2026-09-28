# Class: GameCache

Defined in: [handles/gamecache.ts:19](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/gamecache.ts#L19)

A game cache: values stored under a mission key and a key, which a
campaign saves to the player's campaign file to carry heroes and progress
to its next map.

## Remarks

- Each value type has its own slots: `getInteger` does not read what
  `store` stored as a number, which `getNumber` reads.
- The `sync*` members send a stored value to every player. To share a
  value only one client has, [SyncRequest](SyncRequest.md) is the library's way.

## Example

**Carrying a hero to the next map of a campaign**

```ts
// Carrying the hero and the gold from one map of a campaign to the next. The
// first map calls saveProgress when its chapter is won; the next map opens
// the same cache and restores the hero at its start.
import { GameCache, Init, Unit, tsGlobals } from "reforged-ts";

const CAMPAIGN = "MyCampaign.w3v";
const CHAPTER = "chapter1";

/** Stores the hero and the gold, and saves the cache to disk. */
export function saveProgress(hero: Unit, gold: number): void {
  const cache = GameCache.create(CAMPAIGN);
  cache.store(CHAPTER, "hero", hero.handle);
  cache.storeInteger(CHAPTER, "gold", gold);
  cache.save();
}

Init.onGameStart(() => {
  const cache = GameCache.create(CAMPAIGN);
  if (!cache.hasUnit(CHAPTER, "hero")) {
    return;
  }
  const hero = Unit.fromHandle(
    cache.restoreUnit(CHAPTER, "hero", tsGlobals.Players[0], 0, 0, 270),
  );
  if (hero !== undefined) {
    print(
      `The hero returns with ${String(cache.getInteger(CHAPTER, "gold"))} gold`,
    );
  }
});
```

## Native

[gamecache](/typings/3.0.0/interfaces/gamecache) ([jassbot](https://lep.duckdns.org/jassbot/doc/gamecache))

## Extends

- [`Handle`](Handle.md)\<`gamecache`\>

## Properties

### filename?

> `readonly` `optional` **filename?**: `string`

Defined in: [handles/gamecache.ts:21](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/gamecache.ts#L21)

The campaign file the cache was created with.

***

### handle

> `readonly` **handle**: `gamecache`

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

### flush()

> **flush**(): `void`

Defined in: [handles/gamecache.ts:47](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/gamecache.ts#L47)

Removes every value of the cache, under every mission key.

#### Returns

`void`

#### Native

[FlushGameCache](/typings/3.0.0/functions/FlushGameCache) ([jassbot](https://lep.duckdns.org/jassbot/doc/FlushGameCache))

***

### flushBoolean()

> **flushBoolean**(`missionKey`, `key`): `void`

Defined in: [handles/gamecache.ts:57](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/gamecache.ts#L57)

Removes the boolean stored under the key.

#### Parameters

##### missionKey

`string`

The mission key, the group the key belongs to.

##### key

`string`

The value's name within the mission key.

#### Returns

`void`

#### Native

[FlushStoredBoolean](/typings/3.0.0/functions/FlushStoredBoolean) ([jassbot](https://lep.duckdns.org/jassbot/doc/FlushStoredBoolean))

***

### flushInteger()

> **flushInteger**(`missionKey`, `key`): `void`

Defined in: [handles/gamecache.ts:67](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/gamecache.ts#L67)

Removes the integer stored under the key.

#### Parameters

##### missionKey

`string`

The mission key, the group the key belongs to.

##### key

`string`

The value's name within the mission key.

#### Returns

`void`

#### Native

[FlushStoredInteger](/typings/3.0.0/functions/FlushStoredInteger) ([jassbot](https://lep.duckdns.org/jassbot/doc/FlushStoredInteger))

***

### flushMission()

> **flushMission**(`missionKey`): `void`

Defined in: [handles/gamecache.ts:77](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/gamecache.ts#L77)

Removes every value stored under a mission key.

#### Parameters

##### missionKey

`string`

The mission key whose keys to empty, of every value
type.

#### Returns

`void`

#### Native

[FlushStoredMission](/typings/3.0.0/functions/FlushStoredMission) ([jassbot](https://lep.duckdns.org/jassbot/doc/FlushStoredMission))

***

### flushNumber()

> **flushNumber**(`missionKey`, `key`): `void`

Defined in: [handles/gamecache.ts:87](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/gamecache.ts#L87)

Removes the number stored under the key.

#### Parameters

##### missionKey

`string`

The mission key, the group the key belongs to.

##### key

`string`

The value's name within the mission key.

#### Returns

`void`

#### Native

[FlushStoredReal](/typings/3.0.0/functions/FlushStoredReal) ([jassbot](https://lep.duckdns.org/jassbot/doc/FlushStoredReal))

***

### flushString()

> **flushString**(`missionKey`, `key`): `void`

Defined in: [handles/gamecache.ts:97](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/gamecache.ts#L97)

Removes the string stored under the key.

#### Parameters

##### missionKey

`string`

The mission key, the group the key belongs to.

##### key

`string`

The value's name within the mission key.

#### Returns

`void`

#### Native

[FlushStoredString](/typings/3.0.0/functions/FlushStoredString) ([jassbot](https://lep.duckdns.org/jassbot/doc/FlushStoredString))

***

### flushUnit()

> **flushUnit**(`missionKey`, `key`): `void`

Defined in: [handles/gamecache.ts:107](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/gamecache.ts#L107)

Removes the unit stored under the key.

#### Parameters

##### missionKey

`string`

The mission key, the group the key belongs to.

##### key

`string`

The value's name within the mission key.

#### Returns

`void`

#### Native

[FlushStoredUnit](/typings/3.0.0/functions/FlushStoredUnit) ([jassbot](https://lep.duckdns.org/jassbot/doc/FlushStoredUnit))

***

### getBoolean()

> **getBoolean**(`missionKey`, `key`): `boolean`

Defined in: [handles/gamecache.ts:118](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/gamecache.ts#L118)

Gets the boolean stored under the key.

#### Parameters

##### missionKey

`string`

The mission key, the group the key belongs to.

##### key

`string`

The value's name within the mission key.

#### Returns

`boolean`

The boolean, or `false` when none is stored under the key.

#### Native

[GetStoredBoolean](/typings/3.0.0/functions/GetStoredBoolean) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetStoredBoolean))

***

### getInteger()

> **getInteger**(`missionKey`, `key`): `number`

Defined in: [handles/gamecache.ts:129](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/gamecache.ts#L129)

Gets the integer stored under the key by `storeInteger`.

#### Parameters

##### missionKey

`string`

The mission key, the group the key belongs to.

##### key

`string`

The value's name within the mission key.

#### Returns

`number`

The integer, or 0 when none is stored under the key.

#### Native

[GetStoredInteger](/typings/3.0.0/functions/GetStoredInteger) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetStoredInteger))

***

### getNumber()

> **getNumber**(`missionKey`, `key`): `number`

Defined in: [handles/gamecache.ts:140](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/gamecache.ts#L140)

Gets the number stored under the key by `store`.

#### Parameters

##### missionKey

`string`

The mission key, the group the key belongs to.

##### key

`string`

The value's name within the mission key.

#### Returns

`number`

The number, or 0 when none is stored under the key.

#### Native

[GetStoredReal](/typings/3.0.0/functions/GetStoredReal) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetStoredReal))

***

### getString()

> **getString**(`missionKey`, `key`): `string` \| `undefined`

Defined in: [handles/gamecache.ts:152](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/gamecache.ts#L152)

Gets the string stored under the key.

#### Parameters

##### missionKey

`string`

The mission key, the group the key belongs to.

##### key

`string`

The value's name within the mission key.

#### Returns

`string` \| `undefined`

The string, or `""` when none is stored under the key; the
Typings also allow `undefined`.

#### Native

[GetStoredString](/typings/3.0.0/functions/GetStoredString) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetStoredString))

***

### hasBoolean()

> **hasBoolean**(`missionKey`, `key`): `boolean`

Defined in: [handles/gamecache.ts:163](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/gamecache.ts#L163)

Checks whether a boolean is stored under the key.

#### Parameters

##### missionKey

`string`

The mission key, the group the key belongs to.

##### key

`string`

The value's name within the mission key.

#### Returns

`boolean`

`true` when one is stored.

#### Native

[HaveStoredBoolean](/typings/3.0.0/functions/HaveStoredBoolean) ([jassbot](https://lep.duckdns.org/jassbot/doc/HaveStoredBoolean))

***

### hasInteger()

> **hasInteger**(`missionKey`, `key`): `boolean`

Defined in: [handles/gamecache.ts:174](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/gamecache.ts#L174)

Checks whether an integer is stored under the key.

#### Parameters

##### missionKey

`string`

The mission key, the group the key belongs to.

##### key

`string`

The value's name within the mission key.

#### Returns

`boolean`

`true` when one is stored.

#### Native

[HaveStoredInteger](/typings/3.0.0/functions/HaveStoredInteger) ([jassbot](https://lep.duckdns.org/jassbot/doc/HaveStoredInteger))

***

### hasNumber()

> **hasNumber**(`missionKey`, `key`): `boolean`

Defined in: [handles/gamecache.ts:185](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/gamecache.ts#L185)

Checks whether a number is stored under the key.

#### Parameters

##### missionKey

`string`

The mission key, the group the key belongs to.

##### key

`string`

The value's name within the mission key.

#### Returns

`boolean`

`true` when one is stored.

#### Native

[HaveStoredReal](/typings/3.0.0/functions/HaveStoredReal) ([jassbot](https://lep.duckdns.org/jassbot/doc/HaveStoredReal))

***

### hasString()

> **hasString**(`missionKey`, `key`): `boolean`

Defined in: [handles/gamecache.ts:196](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/gamecache.ts#L196)

Checks whether a string is stored under the key.

#### Parameters

##### missionKey

`string`

The mission key, the group the key belongs to.

##### key

`string`

The value's name within the mission key.

#### Returns

`boolean`

`true` when one is stored.

#### Native

[HaveStoredString](/typings/3.0.0/functions/HaveStoredString) ([jassbot](https://lep.duckdns.org/jassbot/doc/HaveStoredString))

***

### hasUnit()

> **hasUnit**(`missionKey`, `key`): `boolean`

Defined in: [handles/gamecache.ts:207](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/gamecache.ts#L207)

Checks whether a unit is stored under the key, through `HaveStoredUnit`.

#### Parameters

##### missionKey

`string`

The mission key, the group the key belongs to.

##### key

`string`

The value's name within the mission key.

#### Returns

`boolean`

`true` when one is stored.

#### Native

[HaveStoredUnit](/typings/3.0.0/functions/HaveStoredUnit) ([jassbot](https://lep.duckdns.org/jassbot/doc/HaveStoredUnit))

***

### restoreUnit()

> **restoreUnit**(`missionKey`, `key`, `forWhichPlayer`, `x`, `y`, `face`): `unit` \| `undefined`

Defined in: [handles/gamecache.ts:226](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/gamecache.ts#L226)

Creates a unit from the description `store` stored under the key.

#### Parameters

##### missionKey

`string`

The mission key, the group the key belongs to.

##### key

`string`

The value's name within the mission key.

##### forWhichPlayer

[`MapPlayer`](MapPlayer.md)

The player who owns the new unit.

##### x

`number`

The x-coordinate, in world units.

##### y

`number`

The y-coordinate, in world units.

##### face

`number`

The facing, in degrees.

#### Returns

`unit` \| `undefined`

The new unit, or `undefined` when no unit is stored under the
key.

#### Remarks

It returns the Native `unit`, not a `Unit`: wrap it with
`Unit.fromHandle`.

#### Native

[RestoreUnit](/typings/3.0.0/functions/RestoreUnit) ([jassbot](https://lep.duckdns.org/jassbot/doc/RestoreUnit))

***

### save()

> **save**(): `boolean`

Defined in: [handles/gamecache.ts:251](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/gamecache.ts#L251)

Saves the cache to the player's campaign file, for the next maps of the
campaign to open with `create`.

#### Returns

`boolean`

`true` when the game saved it.

#### Native

[SaveGameCache](/typings/3.0.0/functions/SaveGameCache) ([jassbot](https://lep.duckdns.org/jassbot/doc/SaveGameCache))

***

### store()

> **store**(`missionKey`, `key`, `value`): `void`

Defined in: [handles/gamecache.ts:271](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/gamecache.ts#L271)

Stores a value under the key, through the Native for its type: a number
as a real, which `getNumber` reads, and a unit as a description of it,
which `restoreUnit` recreates.

#### Parameters

##### missionKey

`string`

The mission key, the group the key belongs to.

##### key

`string`

The value's name within the mission key.

##### value

`string` \| `number` \| `boolean` \| `unit`

The value: a number, a string, a boolean, or a Native
`unit` (a `Unit`'s `handle`).

#### Returns

`void`

#### Remarks

A stored unit keeps its type, and for a hero its level, experience,
attributes, items and skills.

#### Native

[StoreString](/typings/3.0.0/functions/StoreString) ([jassbot](https://lep.duckdns.org/jassbot/doc/StoreString))

#### Native

[StoreBoolean](/typings/3.0.0/functions/StoreBoolean) ([jassbot](https://lep.duckdns.org/jassbot/doc/StoreBoolean))

#### Native

[StoreReal](/typings/3.0.0/functions/StoreReal) ([jassbot](https://lep.duckdns.org/jassbot/doc/StoreReal))

#### Native

[StoreUnit](/typings/3.0.0/functions/StoreUnit) ([jassbot](https://lep.duckdns.org/jassbot/doc/StoreUnit))

***

### storeInteger()

> **storeInteger**(`missionKey`, `key`, `value`): `void`

Defined in: [handles/gamecache.ts:296](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/gamecache.ts#L296)

Stores `value` as an integer, through `StoreInteger`, where `getInteger`
reads it; `store` stores a number as a real.

#### Parameters

##### missionKey

`string`

The mission key, the group the key belongs to.

##### key

`string`

The value's name within the mission key.

##### value

`number`

The whole number to store, within the 32-bit integer
range.

#### Returns

`void`

#### Native

[StoreInteger](/typings/3.0.0/functions/StoreInteger) ([jassbot](https://lep.duckdns.org/jassbot/doc/StoreInteger))

***

### syncBoolean()

> **syncBoolean**(`missionKey`, `key`): `void`

Defined in: [handles/gamecache.ts:307](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/gamecache.ts#L307)

Sends the boolean stored under the key to every player: the game keeps
the first value to arrive, often the host's.

#### Parameters

##### missionKey

`string`

The mission key, the group the key belongs to.

##### key

`string`

The value's name within the mission key.

#### Returns

`void`

#### Native

[SyncStoredBoolean](/typings/3.0.0/functions/SyncStoredBoolean) ([jassbot](https://lep.duckdns.org/jassbot/doc/SyncStoredBoolean))

***

### syncInteger()

> **syncInteger**(`missionKey`, `key`): `void`

Defined in: [handles/gamecache.ts:318](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/gamecache.ts#L318)

Sends the integer stored under the key to every player: the game keeps
the first value to arrive, often the host's.

#### Parameters

##### missionKey

`string`

The mission key, the group the key belongs to.

##### key

`string`

The value's name within the mission key.

#### Returns

`void`

#### Native

[SyncStoredInteger](/typings/3.0.0/functions/SyncStoredInteger) ([jassbot](https://lep.duckdns.org/jassbot/doc/SyncStoredInteger))

***

### syncNumber()

> **syncNumber**(`missionKey`, `key`): `void`

Defined in: [handles/gamecache.ts:329](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/gamecache.ts#L329)

Sends the number stored under the key to every player: the game keeps
the first value to arrive, often the host's.

#### Parameters

##### missionKey

`string`

The mission key, the group the key belongs to.

##### key

`string`

The value's name within the mission key.

#### Returns

`void`

#### Native

[SyncStoredReal](/typings/3.0.0/functions/SyncStoredReal) ([jassbot](https://lep.duckdns.org/jassbot/doc/SyncStoredReal))

***

### syncString()

> **syncString**(`missionKey`, `key`): `void`

Defined in: [handles/gamecache.ts:340](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/gamecache.ts#L340)

Sends the string stored under the key to every player: the game keeps
the first value to arrive, often the host's.

#### Parameters

##### missionKey

`string`

The mission key, the group the key belongs to.

##### key

`string`

The value's name within the mission key.

#### Returns

`void`

#### Native

[SyncStoredString](/typings/3.0.0/functions/SyncStoredString) ([jassbot](https://lep.duckdns.org/jassbot/doc/SyncStoredString))

***

### syncUnit()

> **syncUnit**(`missionKey`, `key`): `void`

Defined in: [handles/gamecache.ts:351](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/gamecache.ts#L351)

Sends the unit stored under the key to every player: the game keeps the
first value to arrive, often the host's.

#### Parameters

##### missionKey

`string`

The mission key, the group the key belongs to.

##### key

`string`

The value's name within the mission key.

#### Returns

`void`

#### Native

[SyncStoredUnit](/typings/3.0.0/functions/SyncStoredUnit) ([jassbot](https://lep.duckdns.org/jassbot/doc/SyncStoredUnit))

***

### create()

> `static` **create**(`campaignFile`): `GameCache`

Defined in: [handles/gamecache.ts:37](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/gamecache.ts#L37)

Opens the game cache saved under a campaign file name, or a new empty
one.

#### Parameters

##### campaignFile

`string`

The cache's file name, such as `"MyCampaign.w3v"`;
two calls with one name give caches of the same data.

#### Returns

`GameCache`

The game cache, holding what was saved under `campaignFile`, or
empty when nothing was.

#### Remarks

The game allows at most 255 game caches.

#### Throws

When the game returns no handle:
`reforged-ts: failed to create GameCache (<campaignFile>)`, at the
calling line. In Dev mode, also when called before the globals Init stage
or inside `MapPlayer.runLocal`.

#### Native

[InitGameCache](/typings/3.0.0/functions/InitGameCache) ([jassbot](https://lep.duckdns.org/jassbot/doc/InitGameCache))

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

### reloadFromDisk()

> `static` **reloadFromDisk**(): `boolean`

Defined in: [handles/gamecache.ts:360](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/gamecache.ts#L360)

Reloads every game cache from the campaign files on disk.

#### Returns

`boolean`

`true` when the game reloaded them.

#### Native

[ReloadGameCachesFromDisk](/typings/3.0.0/functions/ReloadGameCachesFromDisk) ([jassbot](https://lep.duckdns.org/jassbot/doc/ReloadGameCachesFromDisk))
