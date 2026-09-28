# Class: HandleMap\<K, V\>

Defined in: [system/handlemap.ts:43](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/system/handlemap.ts#L43)

A `Map` keyed by Wrappers, for per-unit (per-Handle) state, whose entries
disappear when their key is destroyed: `unit.destroy()` removes the unit's
entry from every `HandleMap` holding it, in Dev mode and in release.

It is keyed by the Wrapper's Handle, not by the Wrapper object, so an entry
is found through whatever Wrapper is canonical for that Handle: an entry
set through the `Widget` that `Widget.fromEvent()` returned is found
through the `Unit` the registry upgraded it to. The keys it returns
(`keys()`, `entries()`, `forEach`) are the canonical Wrapper when the loop
reaches them.

A `HandleMap` keeps its keys alive until they are deleted or destroyed:
that is its point. An entry for a unit the game removed on its own (a
decayed corpse) stays until it is deleted, because the library sees no
`destroy()` for it.

## Remarks

In multiplayer, iteration order must be the same on every client, or code
that loops and changes game state desyncs. A `Map` or a plain table keyed
by Wrapper objects is iterated with `pairs`, whose order depends on the
table's memory layout. A `HandleMap` iterates in insertion order and never
through `pairs`, so a loop runs identically on every client as long as the
insertions ran in the same order, which holds when they ran in
synchronous code (not inside `MapPlayer.runLocal`).

## Example

```ts
// Kills counted per unit, and the units marked for a bounty. A destroyed unit
// leaves both collections by itself, and a loop over them runs in the order
// the units were added, the same on every client.
import { HandleMap, HandleSet, Init, on, Unit, UnitEvents } from "reforged-ts";

const kills = new HandleMap<Unit, number>();
const bounties = new HandleSet<Unit>();

Init.onTriggers(() => {
  on(UnitEvents.death, ({ unit, killer }) => {
    if (killer !== undefined) {
      kills.set(killer, (kills.get(killer) ?? 0) + 1);
    }
    if (bounties.has(unit)) {
      print(`${unit.name} was worth a bounty`);
    }
  });
});

/** Removes a summoned unit; its kill count and bounty go with it. */
export function unsummon(summoned: Unit): void {
  summoned.destroy();
}

/** Prints every unit's kills, in the order the units first killed. */
export function printKills(): void {
  kills.forEach((count, killer) => {
    print(`${killer.name}: ${String(count)}`);
  });
}
```

## Type Parameters

### K

`K` *extends* [`Handle`](Handle.md)\<`handle`\>

The Wrapper class of the keys, `Unit` or `Widget`.

### V

`V`

The type of the values.

## Constructors

### Constructor

> **new HandleMap**\<`K`, `V`\>(`entries?`): `HandleMap`\<`K`, `V`\>

Defined in: [system/handlemap.ts:59](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/system/handlemap.ts#L59)

A map holding `entries`, set in their order, or an empty map: the
constructor of `Map`, so swapping a `Map` keyed by Wrappers for a
`HandleMap` is a change of the class name only.

#### Parameters

##### entries?

`Iterable`\<readonly \[`K`, `V`\], `any`, `any`\> \| `null`

The first entries, each a key Wrapper and its value.

#### Returns

`HandleMap`\<`K`, `V`\>

## Accessors

### size

#### Get Signature

> **get** **size**(): `number`

Defined in: [system/handlemap.ts:75](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/system/handlemap.ts#L75)

Counts the entries: `delete`, `clear` and a key's `destroy()` lower it.

##### Remarks

Kept in step on every client by the same insertions, deletions and
destructions, so it is safe to branch on in multiplayer.

##### Returns

`number`

The number of entries, 0 for an empty map.

## Methods

### \[iterator\]()

> **\[iterator\]**(): `IterableIterator`\<\[`K`, `V`\]\>

Defined in: [system/handlemap.ts:234](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/system/handlemap.ts#L234)

Iterates over the entries, as `entries()` does:
`for (const [unit, state] of map)`.

#### Returns

`IterableIterator`\<\[`K`, `V`\]\>

An iterator of `[key, value]` pairs.

#### Remarks

Insertion order, never `pairs`: safe to iterate in multiplayer.

***

### clear()

> **clear**(): `void`

Defined in: [system/handlemap.ts:158](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/system/handlemap.ts#L158)

Removes every entry.

#### Returns

`void`

#### Remarks

Clearing is a game-state change like `set`: call it from synchronous
code, never inside `MapPlayer.runLocal`.

***

### delete()

> **delete**(`key`): `boolean`

Defined in: [system/handlemap.ts:142](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/system/handlemap.ts#L142)

Removes the entry of `key`'s Handle. After it, destroying the key has
nothing left to do for this map.

#### Parameters

##### key

`K`

A Wrapper of the game object.

#### Returns

`boolean`

True when there was an entry to remove.

#### Remarks

Deleting is a game-state change like `set`: call it from synchronous
code, never inside `MapPlayer.runLocal`.

***

### entries()

> **entries**(): `IterableIterator`\<\[`K`, `V`\]\>

Defined in: [system/handlemap.ts:219](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/system/handlemap.ts#L219)

Iterates over the entries, in insertion order. Deleting during the
iteration is safe, as for `forEach`.

#### Returns

`IterableIterator`\<\[`K`, `V`\]\>

An iterator of `[key, value]` pairs, each key the canonical
Wrapper of its Handle when the iteration reaches it.

#### Remarks

Insertion order, never `pairs`: safe to iterate in multiplayer.

***

### forEach()

> **forEach**(`callback`): `void`

Defined in: [system/handlemap.ts:177](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/system/handlemap.ts#L177)

Calls `callback` for each entry, in insertion order. An entry deleted
during the loop, by `delete` or by destroying its key, is skipped if not
yet reached, and the loop goes on; an entry added during the loop is not
visited.

#### Parameters

##### callback

(`value`, `key`, `map`) => `void`

Called with the value, the canonical Wrapper of the
key and this map.

#### Returns

`void`

#### Remarks

Insertion order, never `pairs`: the loop runs in the same order on every
client, so it may change game state in multiplayer.

***

### get()

> **get**(`key`): `V` \| `undefined`

Defined in: [system/handlemap.ts:89](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/system/handlemap.ts#L89)

Gets the value stored for `key`'s Handle.

#### Parameters

##### key

`K`

A Wrapper of the game object.

#### Returns

`V` \| `undefined`

The value, or `undefined` when no entry is stored for the
Handle.

#### Remarks

Looks up by Handle, so any Wrapper of the same game object finds the
entry, on every client alike.

***

### has()

> **has**(`key`): `boolean`

Defined in: [system/handlemap.ts:102](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/system/handlemap.ts#L102)

Tells whether an entry is stored for `key`'s Handle.

#### Parameters

##### key

`K`

A Wrapper of the game object.

#### Returns

`boolean`

True when an entry is stored.

#### Remarks

Looks up by Handle, so any Wrapper of the same game object answers the
same, on every client alike.

***

### keys()

> **keys**(): `IterableIterator`\<`K`\>

Defined in: [system/handlemap.ts:192](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/system/handlemap.ts#L192)

Iterates over the keys, in insertion order. Deleting during the
iteration is safe, as for `forEach`.

#### Returns

`IterableIterator`\<`K`\>

An iterator of the keys, each the canonical Wrapper of its
Handle when the iteration reaches it.

#### Remarks

Insertion order, never `pairs`: safe to iterate in multiplayer.

***

### set()

> **set**(`key`, `value`): `this`

Defined in: [system/handlemap.ts:119](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/system/handlemap.ts#L119)

Stores `value` for `key`'s Handle. A new key goes last in the iteration
order; an existing one keeps its place.

#### Parameters

##### key

`K`

A Wrapper of the game object; the canonical one is
returned in loops.

##### value

`V`

The value to store, replacing the Handle's previous one.

#### Returns

`this`

This map, for chaining.

#### Remarks

The insertion order is the iteration order, so call it from synchronous
code, never inside `MapPlayer.runLocal`, for loops to agree across
clients.

***

### values()

> **values**(): `IterableIterator`\<`V`\>

Defined in: [system/handlemap.ts:206](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/system/handlemap.ts#L206)

Iterates over the values, in insertion order. Deleting during the
iteration is safe, as for `forEach`.

#### Returns

`IterableIterator`\<`V`\>

An iterator of the values.

#### Remarks

Insertion order, never `pairs`: safe to iterate in multiplayer.
