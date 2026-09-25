# no-unordered-iteration

Reports the iteration that typescript-to-lua compiles to Lua's `pairs`, whose order differs between clients: `for...in`, `Object.keys`, `Object.values`, `Object.entries`, direct calls to `pairs` and `next`, and `for...of` over a `LuaTable`, `LuaMap` or `LuaSet`. A warning in the recommended config; the replacement is a `SyncedMap` or `SyncedSet` for a keyed collection, or `for...of` over an array.

## Why

Pitfall D4 of the catalogue (#15). Lua does not specify the order of `pairs`: "The order in which the indices are enumerated is not specified, even for numeric indices" ([Lua 5.3 manual](https://www.lua.org/manual/5.3/manual.html#pdf-next)). In a multiplayer game the order differs per client: "iteration order is not guaranteed to be the same for every player in a multiplayer game" ([SyncedTable](https://www.hiveworkshop.com/threads/syncedtable.332894/)), and iterating Lua tables with `pairs` is listed as a certain cause of desync ([Known causes of desync](https://www.hiveworkshop.com/threads/known-causes-of-desync.317486/)). A loop whose side effects depend on the order (which unit is revived first, which player gets the last item) makes the clients disagree and the game desyncs ([desync problems (lua)](https://www.hiveworkshop.com/threads/desync-problems-lua.323176/), fixed by switching to an indexed table and `ipairs`).

What typescript-to-lua 1.37.1 compiles to `pairs`:

- `for...in` becomes `for k in pairs(obj) do`;
- `Object.keys`, `Object.values` and `Object.entries` call lualib helpers that each loop with `pairs`;
- `for...of` over `LuaTable`, `LuaMap`, `LuaSet`, `ReadonlyLuaMap` and `ReadonlyLuaSet` (the language extensions) becomes a `pairs` loop;
- `pairs(t)` and `next(t)` are Lua's own.

`Map` and `Set` are not reported: typescript-to-lua's runtime library keeps their entries in a linked list in insertion order, so iterating them gives the same order on every client. Arrays iterate by index.

The rule asks the checker: `Object` must be the global one, `pairs` and `next` the globals of `lua-types`, and a project function of the same name is not reported.

## Incorrect

```ts
const bounties: Record<string, number> = {};

for (const name in bounties) {
  // order differs per client
  grantBounty(name, bounties[name]);
}

Object.entries(bounties).forEach(([name, gold]) => grantBounty(name, gold)); // pairs inside

const revived = new LuaTable<unit, boolean>();
for (const [u] of revived) ReviveHero(u, 0, 0, false); // pairs loop
```

## Correct

```ts
// An array iterates by index, the same on every client.
const bounties: { name: string; gold: number }[] = [];
for (const { name, gold } of bounties) {
  grantBounty(name, gold);
}

// A Map keeps insertion order; a SyncedMap or SyncedSet keeps a synced order for keyed data.
const revived = new Map<unit, boolean>();
for (const [u] of revived) ReviveHero(u, 0, 0, false);
```

## Options

None.

## Suggestions and fixes

None: the replacement changes the data structure, which the author chooses.

## When not to use it

When the order cannot matter: the loop only sums, counts or reads without side effects, or `next(t) === undefined` tests emptiness. Silence that one line and say why:

```ts
// eslint-disable-next-line reforged/no-unordered-iteration -- sums the values, the order does not change the total
for (const k in bounties) total += bounties[k];
```
