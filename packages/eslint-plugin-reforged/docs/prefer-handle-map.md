# prefer-handle-map

Reports `new Map` and `new Set` whose key type is a Wrapper (`Map<Unit, number>`, `Set<Effect>`), whether written or inferred. A warning in the recommended config; the suggestion changes the constructor to `HandleMap`/`HandleSet`.

## Why

Pitfall L2 of the catalogue (#15). "(Key,value)-pairs containing an Wc3 object will remain in the table even after the object has been destroyed or removed. A famous example is when you use units as keys" ([A comprehensive guide to mapping in Lua](https://www.hiveworkshop.com/threads/a-comprehensive-guide-to-mapping-in-lua.341880/), "General Tables"). A `Map` or `Set` compiles to a Lua table that holds its keys strongly: an entry for a dead unit or a destroyed effect stays until the Map project deletes it, and the table grows for the rest of the game.

`HandleMap` and `HandleSet`, safe collections of `reforged-ts` that ship with its runtime Guards, drop an entry when its Handle is destroyed (see [Desync safety and guards](../../../website/docs/guides/desync-safety-and-guards.md)). `WeakMap` and `WeakSet` are not reported: they do not keep their keys alive.

## Incorrect

```ts
import { Unit } from "reforged-ts";

const kills = new Map<Unit, number>(); // keyed by a Wrapper
const selected: Set<Unit> = new Set(); // inferred from the annotation
```

## Correct

```ts
import { HandleMap, HandleSet, Unit } from "reforged-ts";

const kills = new HandleMap<Unit, number>();
const selected: HandleSet<Unit> = new HandleSet();
```

## Options

None.

## Suggestions and fixes

A suggestion changes the constructor: `new Map<Unit, number>()` becomes `new HandleMap<Unit, number>()`, `new Set<Unit>()` becomes `new HandleSet<Unit>()`. Add the import from `reforged-ts` yourself, and change a type annotation that names `Map` or `Set` if the code relies on it. No fix: the entry's lifetime changes, which changes behaviour.

## When not to use it

When the Map project removes every entry itself, for instance a table cleared when the round ends. Silence the line and say why:

```ts
// eslint-disable-next-line reforged/prefer-handle-map -- cleared in onRoundEnd
const roundKills = new Map<Unit, number>();
```
