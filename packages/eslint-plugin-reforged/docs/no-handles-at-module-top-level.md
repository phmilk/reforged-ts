# no-handles-at-module-top-level

Reports a creation at module top level: a Wrapper's `create*` static (`Unit.create`, `Effect.createAttachment`) or a creation Native (`CreateTimer`, `CreateUnit`, `AddSpecialEffect`, `Location`, ...) that runs when the module loads. An error in the recommended config; create the object in an `Init.onGlobals` callback, or a later Init stage.

## Why

Pitfall D7 of the catalogue (#15). A TSTL bundle runs module top-level code in the Lua root, before `InitGlobals`. "Don't use Warcraft objects in the Lua root! At the time the Lua root is executed, many Warcraft natives are not yet functioning properly. Creating warcraft objects in the Lua root can even lead to desyncs" ([A comprehensive guide to mapping in Lua](https://www.hiveworkshop.com/threads/a-comprehensive-guide-to-mapping-in-lua.341880/), "The Lua Root"); "Creating WarCraft 3 objects in the Lua root is dangerous as it causes desyncs" ([Total Initialization](https://www.hiveworkshop.com/threads/total-initialization.317099/)). A location created in the map root and overwritten during init is a reported desync ([Known causes of desync](https://www.hiveworkshop.com/threads/known-causes-of-desync.317486/)), and several Natives, `CreateTrackable` among them, crash the game when used during map initialisation ([jassdoc](https://github.com/lep/jassdoc)).

Module top level covers the module body: top-level variable initialisers, class static initialisers and static blocks, immediately invoked functions, object literal values evaluated at load and namespace bodies. The bodies of functions, methods, accessors, arrow functions and callbacks run later, and are not reported.

A creation is:

- a static member of a Wrapper whose name starts with `create` (`create`, `createZ`, `createAttachment`, ...), also through a project class that extends a Wrapper;
- a Native listed in the plugin's `data/creation-natives.json` that returns a Handle type. The list holds the families `Create*`, `BlzCreate*`, `AddSpecialEffect*`, `AddSpellEffect*`, `AddLightning*`, `AddWeatherEffect*`, `DialogCreate`, `Location`, `Rect`, `InitHashtable*`, `TerrainDeform*` and a few more, one entry per Native.

Lookups and conversions (`Player`, `GetTriggerUnit`, `GetLocalPlayer`, `Convert*`), the registration Natives (their types `event`, `triggeraction` and `triggercondition` are never creations) and the other Wrapper statics (`Timer.after`, `Unit.fromEvent`) are not reported.

## Incorrect

```ts
import { MapPlayer, Unit } from "reforged-ts";

const ticker = CreateTimer(); // runs in the Lua root
export const footman = Unit.create(
  MapPlayer.fromIndex(0)!,
  FourCC("hfoo"),
  0,
  0,
); // runs in the Lua root

export class Pools {
  static readonly spawns = CreateGroup(); // a static initialiser runs at load
}
```

## Correct

```ts
import { Init, MapPlayer, Timer, Unit } from "reforged-ts";

let ticker: Timer | undefined;

Init.onGlobals(() => {
  ticker = Timer.create();
  Unit.create(MapPlayer.fromIndex(0)!, FourCC("hfoo"), 0, 0).kill();
});
```

## Options

None.

## Suggestions and fixes

None: moving the creation into an Init callback changes when it runs, and every reference to it.

## When not to use it

When the object is known to be safe in the Lua root, such as a hashtable with no engine state, silence that one line and say why:

```ts
// eslint-disable-next-line reforged/no-handles-at-module-top-level -- a hashtable has no engine state to desync
export const table = InitHashtable();
```
