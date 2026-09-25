# no-handle-id-as-data

Reports a call to `GetHandleId` and a read of a Wrapper's `id` accessor whose value does not reach a text-display Native. A warning in the recommended config; key by the Handle or Wrapper itself instead.

## Why

Pitfall D5 of the catalogue (#15). "GetHandleId is synchronous in JASS-mode, but asyncronous in Lua-mode" ([A comprehensive guide to mapping in Lua](https://www.hiveworkshop.com/threads/a-comprehensive-guide-to-mapping-in-lua.341880/)); "Sometimes the handle ID may be different between clients" ([jassdoc](https://github.com/lep/jassdoc), `GetHandleId`); "basing gameplay logic off handle IDs" is a reported desync in Lua maps ([Known causes of desync](https://www.hiveworkshop.com/threads/known-causes-of-desync.317486/)). A table keyed by the id, a comparison or arithmetic on it, or state that stores it can hold different values on each client, and the game desyncs.

The `id` accessor of the Wrappers returns `GetHandleId(this.handle)`, so it has the same problem. `MapPlayer#id` is the player's slot (`GetPlayerId`), the same on every client, and is not reported.

Displaying an id changes no game state, so a value that reaches a text sink is fine. A text sink is a call listed with kind `text` in `data/local-safe.json` (`print`, `BJDebugMsg`, `DisplayTextToPlayer` and the other display Natives, the frame text setters and their `Frame` members). The rule follows the id into the sink through a template literal, a string concatenation, `String()`, `tostring`, the converters `I2S`, `R2S` and `R2SW` (their first argument), and one `const`. It does not follow calls into project functions.

## Incorrect

```ts
import { Unit } from "reforged-ts";

declare const unit: Unit;

const kills = new LuaTable<number, number>();
kills.set(unit.id, 0); // the id as a table key

const slot = GetHandleId(unit.handle) % 12; // arithmetic on the id
```

## Correct

```ts
import { Unit } from "reforged-ts";

declare const unit: Unit;

const kills = new LuaTable<Unit, number>();
kills.set(unit, 0); // keyed by the Wrapper

print(`unit ${unit.id} spawned`); // displaying the id is fine
BJDebugMsg(I2S(GetHandleId(unit.handle))!); // through a converter too
```

## Options

None.

## Suggestions and fixes

None: the replacement key (the Handle or its Wrapper, a counter the Map project assigns) depends on what the id was for.

## When not to use it

When the id never feeds game state, for instance a debug counter logged through a project function the rule does not follow. Silence the line and say why:

```ts
// eslint-disable-next-line reforged/no-handle-id-as-data -- passed to the debug logger, which only prints it
log(unit.id);
```
