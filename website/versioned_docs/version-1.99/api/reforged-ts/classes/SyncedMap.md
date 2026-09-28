# Class: SyncedMap\<K, V\>

Defined in: [system/syncedmap.ts:37](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/system/syncedmap.ts#L37)

A `Map` whose every loop runs in sorted key order, the same on every client.

## Remarks

A Lua table iterated with `pairs` (what a plain object or `Object.keys`
compiles to) visits its keys in an order the game does not guarantee to be
the same on every client, and code that changes game state in that order
desyncs the lobby. `SyncedMap` never uses `pairs`: its `forEach`, `keys`,
`values`, `entries` and `for...of` walk the keys sorted, numbers
numerically, strings by byte, other keys by the comparator given to the
constructor. Swapping a `Map` for a `SyncedMap` is a type change.

Without a comparator the keys of one instance must be all numbers or all
strings: in Dev mode a key of another kind raises where it is inserted, in
release the sort raises when it compares them. A loop walks a snapshot of
the keys taken when it starts, so deleting any key during it is safe: a key
deleted before the loop reaches it is skipped, and a key set during the
loop is visited by the next one. Iteration sorts once after a burst of
mutations, not per insertion.

## Example

```ts
// Scores kept by player id and a set of player names, looped over in sorted
// order: the same order on every client, whatever order they were set in.
import { Init, MapPlayer, SyncedMap, SyncedSet } from "reforged-ts";

const scores = new SyncedMap<number, number>();
const finished = new SyncedSet<string>();

/** Adds points to a player's score. */
export function score(player: MapPlayer, points: number): void {
  scores.set(player.id, (scores.get(player.id) ?? 0) + points);
}

Init.onGameStart(() => {
  for (const [index, points] of [
    [2, 5],
    [0, 3],
  ]) {
    const player = MapPlayer.fromIndex(index);
    if (player !== undefined) {
      score(player, points);
    }
  }
  finished.add("Zed").add("Ann");

  // Player 0 first, then player 2: sorted by id, not by insertion.
  for (const [id, points] of scores) {
    print(`Player ${String(id + 1)}: ${String(points)}`);
  }
  // "Ann", then "Zed".
  finished.forEach((name) => {
    print(`${name} finished`);
  });
});
```

## Type Parameters

### K

`K` *extends* `AnyNotNil`

The type of the keys: numbers or strings, or any value
with a comparator.

### V

`V`

The type of the values.

## Constructors

### Constructor

> **new SyncedMap**\<`K`, `V`\>(`comparator?`): `SyncedMap`\<`K`, `V`\>

Defined in: [system/syncedmap.ts:52](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/system/syncedmap.ts#L52)

An empty map, ordering its keys with `comparator`, or with Lua's `<` when
none is given (number or string keys only).

#### Parameters

##### comparator?

[`KeyComparator`](../type-aliases/KeyComparator.md)\<`K`\>

Orders two keys: negative, zero or positive, as for
`Array.prototype.sort`.

#### Returns

`SyncedMap`\<`K`, `V`\>

#### Remarks

The comparator must be a total order that gives the same answer on every
client (compare ids or names, never handle addresses or `tostring`), or
the sorted order is not the same everywhere.

### Constructor

> **new SyncedMap**\<`K`, `V`\>(`entries`, `comparator?`): `SyncedMap`\<`K`, `V`\>

Defined in: [system/syncedmap.ts:64](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/system/syncedmap.ts#L64)

A map holding `entries`, inserted in their order, then iterated sorted
by `comparator`, or by Lua's `<` when none is given.

#### Parameters

##### entries

`Iterable`\<readonly \[`K`, `V`\], `any`, `any`\> \| `null` \| `undefined`

The first entries, each a key and its value.

##### comparator?

[`KeyComparator`](../type-aliases/KeyComparator.md)\<`K`\>

Orders two keys: negative, zero or positive, as for
`Array.prototype.sort`.

#### Returns

`SyncedMap`\<`K`, `V`\>

#### Remarks

The comparator must be a total order that gives the same answer on every
client, or the sorted order is not the same everywhere.

## Accessors

### size

#### Get Signature

> **get** **size**(): `number`

Defined in: [system/syncedmap.ts:92](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/system/syncedmap.ts#L92)

Counts the keys, those whose value is undefined included.

##### Remarks

Kept as a count, so reading it walks nothing and is the same on every
client.

##### Returns

`number`

The number of keys present, 0 for an empty map.

## Methods

### \[iterator\]()

> **\[iterator\]**(): `IterableIterator`\<\[`K`, `V`\]\>

Defined in: [system/syncedmap.ts:257](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/system/syncedmap.ts#L257)

Iterates over the entries, in sorted key order: what `for...of` walks.

#### Returns

`IterableIterator`\<\[`K`, `V`\]\>

An iterator of `[key, value]` pairs.

#### Remarks

The order is the same on every client, unlike `pairs` over a table.

***

### clear()

> **clear**(): `void`

Defined in: [system/syncedmap.ts:172](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/system/syncedmap.ts#L172)

Removes every key.

#### Returns

`void`

#### Remarks

Walks the key array by index, never with `pairs`, so its cost does not
depend on a client-specific order either.

***

### delete()

> **delete**(`key`): `boolean`

Defined in: [system/syncedmap.ts:157](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/system/syncedmap.ts#L157)

Removes `key` and its value.

#### Parameters

##### key

`K`

The key to remove.

#### Returns

`boolean`

True when it was present.

#### Remarks

Safe during a loop over this map: the loop skips the key if it has not
reached it yet and visits every other key once.

***

### entries()

> **entries**(): `IterableIterator`\<\[`K`, `V`\]\>

Defined in: [system/syncedmap.ts:241](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/system/syncedmap.ts#L241)

Iterates over the entries, in sorted key order.

#### Returns

`IterableIterator`\<\[`K`, `V`\]\>

An iterator of `[key, value]` pairs.

#### Remarks

The order is the same on every client. The iterator walks a snapshot
taken when it starts, skipping keys deleted before their turn.

***

### forEach()

> **forEach**(`callback`): `void`

Defined in: [system/syncedmap.ts:190](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/system/syncedmap.ts#L190)

Calls `callback` for each key, in sorted key order.

#### Parameters

##### callback

(`value`, `key`, `map`) => `void`

Called with the value, its key and this map.

#### Returns

`void`

#### Remarks

The order is the same on every client, so the callback may change game
state. It walks a snapshot of the keys: deleting any key meanwhile
neither skips nor repeats one, and a key deleted before its turn is not
visited.

***

### get()

> **get**(`key`): `V` \| `undefined`

Defined in: [system/syncedmap.ts:106](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/system/syncedmap.ts#L106)

Gets the value stored for `key`.

#### Parameters

##### key

`K`

The key to look up.

#### Returns

`V` \| `undefined`

The value, or `undefined` when the key is absent or its value
is undefined.

#### Remarks

A lookup does not depend on iteration order, so it is multiplayer-safe as
on a `Map`.

***

### has()

> **has**(`key`): `boolean`

Defined in: [system/syncedmap.ts:119](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/system/syncedmap.ts#L119)

Tells whether `key` is present, including when its value is undefined.

#### Parameters

##### key

`K`

The key to look up.

#### Returns

`boolean`

True when it is present.

#### Remarks

A lookup does not depend on iteration order, so it is multiplayer-safe as
on a `Map`.

***

### keys()

> **keys**(): `IterableIterator`\<`K`\>

Defined in: [system/syncedmap.ts:207](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/system/syncedmap.ts#L207)

Iterates over the keys, in sorted order.

#### Returns

`IterableIterator`\<`K`\>

An iterator of the keys.

#### Remarks

The order is the same on every client. The iterator walks a snapshot
taken when it starts, skipping keys deleted before their turn.

***

### set()

> **set**(`key`, `value`): `this`

Defined in: [system/syncedmap.ts:142](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/system/syncedmap.ts#L142)

Stores `value` for `key`.

#### Parameters

##### key

`K`

The key; without a comparator, a number or a string of the
same kind as the present keys.

##### value

`V`

The value to store; undefined too, which keeps the key
present.

#### Returns

`this`

This map, for chaining.

#### Remarks

A new key takes its sorted place, not the end: the next loop visits it
in the same position on every client. In Dev mode, without a comparator,
a key that is not of the kind of the present keys (all numbers or all
strings) raises here, where it is inserted, instead of in a later sort.

#### Throws

In Dev mode, without a comparator, when `key` is neither a number
nor a string, at the calling line:
`reforged-ts: SyncedMap without a comparator takes number or string keys, got a <kind>: pass a comparator to the constructor to order other keys`;
and when it is not of the kind of the present keys:
`reforged-ts: SyncedMap without a comparator takes keys of one kind, got a <kind> after <kind> keys: the sorted order that keeps iteration identical on every client cannot compare them`.

***

### values()

> **values**(): `IterableIterator`\<`V`\>

Defined in: [system/syncedmap.ts:224](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/system/syncedmap.ts#L224)

Iterates over the values, in the sorted order of their keys.

#### Returns

`IterableIterator`\<`V`\>

An iterator of the values.

#### Remarks

The order is the same on every client. The iterator walks a snapshot
taken when it starts, skipping keys deleted before their turn.
