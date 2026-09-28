# Class: HandleSet\<K\>

Defined in: [system/handleset.ts:34](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/system/handleset.ts#L34)

A `Set` of Wrappers, for per-unit (per-Handle) membership, whose members
disappear when they are destroyed: `unit.destroy()` removes the unit from
every `HandleSet` holding it, in Dev mode and in release.

It holds Handles, not Wrapper objects, so membership is answered through
whatever Wrapper is canonical for that Handle: a `Widget` added from
`Widget.fromEvent()` is a member when asked through the `Unit` the
registry upgraded it to. The members it returns are the canonical Wrapper
when the loop reaches them.

A `HandleSet` keeps its members alive until they are deleted or
destroyed. A unit the game removed on its own (a decayed corpse) stays
until it is deleted, because the library sees no `destroy()` for it.

## Remarks

In multiplayer, iteration order must be the same on every client, or code
that loops and changes game state desyncs. A `Set` or a plain table of
Wrapper objects is iterated with `pairs`, whose order depends on the
table's memory layout. A `HandleSet` iterates in insertion order and never
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

The Wrapper class of the members, `Unit` or `Widget`.

## Constructors

### Constructor

> **new HandleSet**\<`K`\>(`values?`): `HandleSet`\<`K`\>

Defined in: [system/handleset.ts:51](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/system/handleset.ts#L51)

A set holding `values`, added in their order, or an empty set: the
constructor of `Set`, so swapping a `Set` of Wrappers for a `HandleSet`
is a change of the class name only.

#### Parameters

##### values?

`Iterable`\<`K`, `any`, `any`\> \| `null`

The Wrappers to add at once, in the iteration order.

#### Returns

`HandleSet`\<`K`\>

## Accessors

### size

#### Get Signature

> **get** **size**(): `number`

Defined in: [system/handleset.ts:68](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/system/handleset.ts#L68)

Counts the members: `delete`, `clear` and a member's `destroy()` lower
it.

##### Remarks

Kept in step on every client by the same additions, deletions and
destructions, so it is safe to branch on in multiplayer.

##### Returns

`number`

The number of members, 0 for an empty set.

## Methods

### \[iterator\]()

> **\[iterator\]**(): `IterableIterator`\<`K`\>

Defined in: [system/handleset.ts:206](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/system/handleset.ts#L206)

Iterates over the members, as `values()` does: `for (const unit of set)`.

#### Returns

`IterableIterator`\<`K`\>

An iterator of the members.

#### Remarks

Insertion order, never `pairs`: safe to iterate in multiplayer.

***

### add()

> **add**(`member`): `this`

Defined in: [system/handleset.ts:97](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/system/handleset.ts#L97)

Adds `member`'s Handle. A new member goes last in the iteration order;
one already there keeps its place.

#### Parameters

##### member

`K`

A Wrapper of the game object; the canonical one is
returned in loops.

#### Returns

`this`

This set, for chaining.

#### Remarks

The insertion order is the iteration order, so call it from synchronous
code, never inside `MapPlayer.runLocal`, for loops to agree across
clients.

***

### clear()

> **clear**(): `void`

Defined in: [system/handleset.ts:133](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/system/handleset.ts#L133)

Removes every member.

#### Returns

`void`

#### Remarks

Clearing is a game-state change like `add`: call it from synchronous
code, never inside `MapPlayer.runLocal`.

***

### delete()

> **delete**(`member`): `boolean`

Defined in: [system/handleset.ts:117](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/system/handleset.ts#L117)

Removes `member`'s Handle. After it, destroying the member has nothing
left to do for this set.

#### Parameters

##### member

`K`

A Wrapper of the game object.

#### Returns

`boolean`

True when it was in the set.

#### Remarks

Deleting is a game-state change like `add`: call it from synchronous
code, never inside `MapPlayer.runLocal`.

***

### entries()

> **entries**(): `IterableIterator`\<\[`K`, `K`\]\>

Defined in: [system/handleset.ts:192](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/system/handleset.ts#L192)

Iterates over the members as `[member, member]` pairs, in insertion
order, as `Set.entries` does.

#### Returns

`IterableIterator`\<\[`K`, `K`\]\>

An iterator of the pairs.

#### Remarks

Insertion order, never `pairs`: safe to iterate in multiplayer.

***

### forEach()

> **forEach**(`callback`): `void`

Defined in: [system/handleset.ts:152](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/system/handleset.ts#L152)

Calls `callback` for each member, in insertion order. A member deleted
during the loop, by `delete` or by being destroyed, is skipped if not
yet reached, and the loop goes on; a member added during the loop is not
visited.

#### Parameters

##### callback

(`value`, `key`, `set`) => `void`

Called with the canonical Wrapper twice (as
`Set.forEach` does) and this set.

#### Returns

`void`

#### Remarks

Insertion order, never `pairs`: the loop runs in the same order on every
client, so it may change game state in multiplayer.

***

### has()

> **has**(`member`): `boolean`

Defined in: [system/handleset.ts:81](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/system/handleset.ts#L81)

Tells whether `member`'s Handle is in the set.

#### Parameters

##### member

`K`

A Wrapper of the game object.

#### Returns

`boolean`

True when the Handle is a member.

#### Remarks

Looks up by Handle, so any Wrapper of the same game object answers the
same, on every client alike.

***

### keys()

> **keys**(): `IterableIterator`\<`K`\>

Defined in: [system/handleset.ts:180](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/system/handleset.ts#L180)

Iterates over the members, as `values()` does and `Set.keys` is.

#### Returns

`IterableIterator`\<`K`\>

An iterator of the members.

#### Remarks

Insertion order, never `pairs`: safe to iterate in multiplayer.

***

### values()

> **values**(): `IterableIterator`\<`K`\>

Defined in: [system/handleset.ts:167](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/system/handleset.ts#L167)

Iterates over the members, in insertion order. Deleting during the
iteration is safe, as for `forEach`.

#### Returns

`IterableIterator`\<`K`\>

An iterator of the members, each the canonical Wrapper of its
Handle when the iteration reaches it.

#### Remarks

Insertion order, never `pairs`: safe to iterate in multiplayer.
