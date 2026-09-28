# Class: SyncedSet\<T\>

Defined in: [system/syncedset.ts:34](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/system/syncedset.ts#L34)

A `Set` whose every loop runs in sorted order, the same on every client.

## Remarks

A Lua table iterated with `pairs` (what a plain object or `Object.keys`
compiles to) visits its keys in an order the game does not guarantee to be
the same on every client, and code that changes game state in that order
desyncs the lobby. `SyncedSet` never uses `pairs`: its `forEach`, `keys`,
`values`, `entries` and `for...of` walk the values sorted, numbers
numerically, strings by byte, other values by the comparator given to the
constructor. Swapping a `Set` for a `SyncedSet` is a type change.

Without a comparator the values of one instance must be all numbers or all
strings: in Dev mode a value of another kind raises where it is added, in
release the sort raises when it compares them. A loop walks a snapshot
taken when it starts, so deleting any value during it is safe: a value
deleted before the loop reaches it is skipped, and a value added during
the loop is visited by the next one. Iteration sorts once after a burst of
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

### T

`T` *extends* `AnyNotNil`

The type of the values: numbers or strings, or any value
with a comparator.

## Constructors

### Constructor

> **new SyncedSet**\<`T`\>(`comparator?`): `SyncedSet`\<`T`\>

Defined in: [system/syncedset.ts:48](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/system/syncedset.ts#L48)

An empty set, ordering its values with `comparator`, or with Lua's `<`
when none is given (number or string values only).

#### Parameters

##### comparator?

[`KeyComparator`](../type-aliases/KeyComparator.md)\<`T`\>

Orders two values: negative, zero or positive, as
for `Array.prototype.sort`.

#### Returns

`SyncedSet`\<`T`\>

#### Remarks

The comparator must be a total order that gives the same answer on every
client (compare ids or names, never handle addresses or `tostring`), or
the sorted order is not the same everywhere.

### Constructor

> **new SyncedSet**\<`T`\>(`values`, `comparator?`): `SyncedSet`\<`T`\>

Defined in: [system/syncedset.ts:60](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/system/syncedset.ts#L60)

A set holding `values`, then iterated sorted by `comparator`, or by
Lua's `<` when none is given.

#### Parameters

##### values

`Iterable`\<`T`, `any`, `any`\> \| `null` \| `undefined`

The values to add at once; the set sorts them.

##### comparator?

[`KeyComparator`](../type-aliases/KeyComparator.md)\<`T`\>

Orders two values: negative, zero or positive, as
for `Array.prototype.sort`.

#### Returns

`SyncedSet`\<`T`\>

#### Remarks

The comparator must be a total order that gives the same answer on every
client, or the sorted order is not the same everywhere.

## Accessors

### size

#### Get Signature

> **get** **size**(): `number`

Defined in: [system/syncedset.ts:88](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/system/syncedset.ts#L88)

Counts the values the set holds.

##### Remarks

Kept as a count, so reading it walks nothing and is the same on every
client.

##### Returns

`number`

The number of values, 0 for an empty set.

## Methods

### \[iterator\]()

> **\[iterator\]**(): `IterableIterator`\<`T`\>

Defined in: [system/syncedset.ts:223](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/system/syncedset.ts#L223)

Iterates over the values, in sorted order: what `for...of` walks.

#### Returns

`IterableIterator`\<`T`\>

An iterator of the values.

#### Remarks

The order is the same on every client, unlike `pairs` over a table.

***

### add()

> **add**(`value`): `this`

Defined in: [system/syncedset.ts:121](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/system/syncedset.ts#L121)

Adds `value`.

#### Parameters

##### value

`T`

The value to add.

#### Returns

`this`

This set, for chaining.

#### Remarks

A new value takes its sorted place, not the end: the next loop visits it
in the same position on every client. In Dev mode, without a comparator,
a value that is not of the kind of the present values (all numbers or
all strings) raises here, where it is added, instead of in a later sort.

#### Throws

In Dev mode, without a comparator, when `value` is neither a
number nor a string, at the calling line:
`reforged-ts: SyncedSet without a comparator takes number or string keys, got a <kind>: pass a comparator to the constructor to order other keys`;
and when it is not of the kind of the present values:
`reforged-ts: SyncedSet without a comparator takes keys of one kind, got a <kind> after <kind> keys: the sorted order that keeps iteration identical on every client cannot compare them`.

***

### clear()

> **clear**(): `void`

Defined in: [system/syncedset.ts:146](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/system/syncedset.ts#L146)

Removes every value.

#### Returns

`void`

#### Remarks

Walks the value array by index, never with `pairs`, so its cost does not
depend on a client-specific order either.

***

### delete()

> **delete**(`value`): `boolean`

Defined in: [system/syncedset.ts:135](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/system/syncedset.ts#L135)

Removes `value`.

#### Parameters

##### value

`T`

The value to remove.

#### Returns

`boolean`

True when it was in the set.

#### Remarks

Safe during a loop over this set: the loop skips the value if it has not
reached it yet and visits every other value once.

***

### entries()

> **entries**(): `IterableIterator`\<\[`T`, `T`\]\>

Defined in: [system/syncedset.ts:207](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/system/syncedset.ts#L207)

Iterates over the values as `[value, value]` pairs, in sorted order, as
`Set.entries` does.

#### Returns

`IterableIterator`\<\[`T`, `T`\]\>

An iterator of the pairs.

#### Remarks

The order is the same on every client. The iterator walks a snapshot
taken when it starts, skipping values deleted before their turn.

***

### forEach()

> **forEach**(`callback`): `void`

Defined in: [system/syncedset.ts:160](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/system/syncedset.ts#L160)

Calls `callback` for each value, in sorted order.

#### Parameters

##### callback

(`value`, `value2`, `set`) => `void`

Called with the value twice (as `Set.forEach` does)
and this set.

#### Returns

`void`

#### Remarks

The order is the same on every client, so the callback may change game
state. It walks a snapshot: deleting any value meanwhile neither skips
nor repeats one, and a value deleted before its turn is not visited.

***

### has()

> **has**(`value`): `boolean`

Defined in: [system/syncedset.ts:101](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/system/syncedset.ts#L101)

Tells whether `value` is in the set.

#### Parameters

##### value

`T`

The value to look up.

#### Returns

`boolean`

True when it is in the set.

#### Remarks

A lookup does not depend on iteration order, so it is multiplayer-safe as
on a `Set`.

***

### keys()

> **keys**(): `IterableIterator`\<`T`\>

Defined in: [system/syncedset.ts:194](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/system/syncedset.ts#L194)

Iterates over the values, in sorted order, as `values()` does and
`Set.keys` is.

#### Returns

`IterableIterator`\<`T`\>

An iterator of the values.

#### Remarks

The order is the same on every client.

***

### values()

> **values**(): `IterableIterator`\<`T`\>

Defined in: [system/syncedset.ts:177](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/system/syncedset.ts#L177)

Iterates over the values, in sorted order.

#### Returns

`IterableIterator`\<`T`\>

An iterator of the values.

#### Remarks

The order is the same on every client. The iterator walks a snapshot
taken when it starts, skipping values deleted before their turn.
