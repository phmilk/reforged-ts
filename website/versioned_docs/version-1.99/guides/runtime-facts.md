---
title: Runtime facts
sidebar_position: 11
description: What the Lua of Warcraft III 3.0.0 has and lacks, measured in the game, and what to do about each fact.
---

# Runtime facts

The game runs map scripts on its own build of Lua, and most of what it changes from stock Lua is documented nowhere. The facts on this page were measured in Warcraft III 3.0.0 on 2026-09-23 with a probe script pasted into a blank Lua map, in three separate runs of the game ([probe map, #9](https://github.com/phmilk/reforged-ts/issues/9); the script is [`docs/research/probe-map.lua`](https://github.com/phmilk/reforged-ts/blob/master/docs/research/probe-map.lua)). Each fact comes with what to do about it.

## Summary

This summary is the source of the "Runtime constraints" section of the library's `AGENTS.md` (the DX baseline, [#41](https://github.com/phmilk/reforged-ts/issues/41), mirrors it there). Change a line here first.

1. The game runs Lua 5.3, not 5.4: no `<const>`, no `<close>`, no `coroutine.close`, no `warn`.
2. Integers are 32-bit and wrap at 2^31 (`math.maxinteger + 1` is `-2147483648`); floats are doubles.
3. `debug`, `require`, `package`, `io`, `collectgarbage`, `loadstring`, `dofile`, `loadfile`, `os.getenv` and `warn` do not exist.
4. `load`, `coroutine`, `os.clock`, `os.time`, `os.date`, `print`, `FourCC`, `__jarray` and `TypeDefine` exist; the `os` values are local to each client.
5. `pairs` order is deterministic per game build but not guaranteed: iterate the synced collections.
6. `config` runs before `main`; `InitGlobals`, `MarkGameStarted` and `InitBlizzard` exist before the map script, the other entry points after it: start map code from the Init stages.
7. Handle identity is stable across Natives: a Handle is a safe table key.
8. Handle ids are not recycled immediately, and are never data.
9. The World Editor crashes on save when a script pasted into it contains a `%` character.
10. Async Natives (`GetLocalPlayer` and every Native the Typings mark `@async`) feed visuals only, never game state.

## The Lua version

**The fact.** `_VERSION` is `Lua 5.3`. The two 5.4 fingerprints fail: `coroutine.close` is nil, and `local x <const> = 1` does not parse. `utf8`, `string.pack`, `string.unpack`, `math.type`, `math.tointeger`, `math.ult` and the integer division `//` are there, as in stock 5.3.

**What to do.** Compile for Lua 5.3: the Template sets typescript-to-lua's `luaTarget` to `5.3`, and the Typings declare the 5.3 standard library (through `lua-types/5.3`), so a 5.4-only function is a compile error. Lua code you write by hand (a stub, a snippet you paste into the editor) must be 5.3 too.

## Integers are 32-bit

**The fact.** `math.maxinteger` is `2147483647`, and `math.maxinteger + 1` is `-2147483648`: the game's Lua is built with 32-bit integers, which wrap on overflow. Floats are doubles (`7 / 2` is `3.5`). `string.format` with an integer format and a float without an integer value (`1.5`) raises an error, as in stock 5.3.

**What to do.**

- Keep integer arithmetic under 2^31: a sum, a product or a shift that passes it wraps to a negative number without an error. Counters of game time in milliseconds pass it after about 24 days; a product of two ids passes it at once.
- Keep bit operations to 31 bits.
- Turn a float into an integer on purpose (`math.floor`) before formatting it as one.
- A test on the harness does not catch an overflow: the harness's Lua has 64-bit integers ([Testing your map](testing-your-map.md#what-the-harness-cannot-tell-you)).
- The Typings' parameter docs say `integer (32-bit)` for the Jass `integer`.

## Missing globals

**The fact.** These are nil in the game: `debug`, `require`, `package`, `loadstring`, `dofile`, `loadfile`, `io`, `collectgarbage`, `warn` and `os.getenv`. The Typings still declare the 5.3 standard library, so using one compiles and fails at run time.

**What to do.**

- **No modules at run time.** typescript-to-lua bundles every module of the map into one Lua file (the Template's `luaBundle`), so the map never calls `require`. Do not compile a Map project without a bundle.
- **No tracebacks.** Without `debug`, an error carries its message and its `war3map.lua` line only. In Dev mode the library names the origin of a failing callback, the Wrapper and the member that registered it ([Desync safety and guards](desync-safety-and-guards.md)).
- **No files.** Without `io`, a map reads and writes files through the game's preload files: the `File` System ([API](../api/reforged-ts/classes/File.md)).
- **No garbage collector control.** Memory is released by destroying what you created (`destroy()` on the Wrapper) and by letting go of references.

## What exists

**The fact.** `load` works (`load("return 1+1")()` is `2`). `coroutine`, metatables, `rawlen`, `select` and `next` are there. `os.clock`, `os.time` and `os.date` exist, and `os.clock` counts from the start of the process. `print` prints on the screen. Blizzard adds `FourCC`, `__jarray` and `TypeDefine`.

**What to do.** Treat the `os` values as async: each client reads its own clock, so a value from `os.clock`, `os.time` or `os.date` is a different number on every client and must never reach game state ([Async Natives](#async-natives)). Use `print` for debugging only: it shows on every player's screen.

## `pairs` order

**The fact.** An identical eight-key table iterated with `pairs` gave the same order (`dcbahgfe`) in three separate runs of the game, with different heap addresses each time, and a different order from stock Lua 5.3.6 (`fedcbahg`). Blizzard's build uses a fixed hash seed or a table layout of its own. Whether the order is also identical on two machines was not measured, and the Lua manual leaves it unspecified.

**What to do.** Treat `pairs` order as deterministic per game build, not as guaranteed: a loop whose effect depends on the order can run differently on two clients and desync the game. Iterate a `SyncedMap` or `SyncedSet` (sorted keys) or a `HandleMap` or `HandleSet` (insertion order), or an array with `for...of`. The lint reports the TypeScript that compiles to `pairs` ([`no-unordered-iteration`](lint-rules/no-unordered-iteration.md)).

`tostring` of a table or a Handle prints its address (`timer: 0000023285CD33E0`), which changes with every process: never use it as a key, an order or data.

## The entry points

**The fact.** Seen from a script pasted into the map header in the World Editor, `InitGlobals`, `MarkGameStarted` and `InitBlizzard` are already defined; `main`, `config`, `InitCustomTriggers` and `RunInitializationTriggers` are nil and defined later in the editor's script. `config` runs before `main`. Replacing a global through a metatable on `_G` works in the game.

**What to do.** Start map code from the [Init stages](../api/reforged-ts/variables/Init.md), never from the top level of a module:

- The library intercepts the editor's entry points (it wraps those that exist and captures the others when the script defines them) and runs each stage's callbacks under `pcall` after its Blizzard function: `onGlobals` after `InitGlobals`, `onTriggers` after `InitCustomTriggers`, `onInitTriggers` after `RunInitializationTriggers`, `onGameStart` after `MarkGameStarted`.
- The Template appends the bundle after the editor's script, so every entry point exists when the bundle loads; a script pasted into the header sees them in the order above. The Init stages behave the same in both positions.
- Module top level runs while the script loads, before `InitGlobals`: creating a Handle there is unsafe. The lint reports it ([`no-handles-at-module-top-level`](lint-rules/no-handles-at-module-top-level.md)).

```ts
import { Init, Timer } from "reforged-ts";

Init.onGlobals(() => {
  // The game is ready for Handles from here on.
  Timer.every(1, () => {
    print("one second");
  });
});
```

## Handle identity

**The fact.** The same Handle reached through two Natives is the same Lua value: the result of `CreateTimer()` and `GetExpiredTimer()` inside its callback compare equal, and a table keyed by one finds the entry through the other.

**What to do.** Key a table by a Handle, or by its Wrapper: the library's registry relies on this and gives back the same Wrapper for the same Handle. A `HandleMap` or `HandleSet` also drops the entry when the Wrapper is destroyed ([Desync safety and guards](desync-safety-and-guards.md)).

## Handle ids

**The fact.** Creating a timer, destroying it and creating another gave the ids `1048807` then `1048808`: ids are not recycled at once. The sequence was the same in every run.

**What to do.** Never keep a handle id as data (a key, a comparison, a saved value). A destroyed object's id may come back later, and in Lua the id of the same object can differ between clients. Key by the Handle itself; display an id for debugging only. The lint reports the other uses ([`no-handle-id-as-data`](lint-rules/no-handle-id-as-data.md)).

## The `%` editor crash

**The fact.** The World Editor of 3.0.0 crashes on save when the custom script of the map contains a `%` character. The fix the 2.0.4 notes announced is partial, or regressed. Code the Template compiles into `war3map.lua` at build time does not go through the editor's save.

**What to do.** Keep `%` out of any script you paste into the editor (build a format string at run time with `string.char(37)` if you need one there). A Map project's code goes through the build, not the editor, and is not affected in the same way. A `%` in a string the game displays is a separate pitfall: the game formats it ([`no-percent-in-display-strings`](lint-rules/no-percent-in-display-strings.md)).

## Async Natives

**The fact.** Some values are computed on each client for itself: `GetLocalPlayer`, the Natives the Typings mark `@async` (the camera, a frame's text or size, the locale), and the `os` clock and date. The probe confirmed `GetLocalPlayer` returns a player Handle like any other; what makes it async is that each client gets its own player.

**What to do.** Use these values for visuals only (a frame, a sound, a camera, a message for the local player) and run local-only code inside `MapPlayer.runLocal` ([API](../api/reforged-ts/classes/MapPlayer.md)). To act on a local value, send it to every client with the sync System first. The lint follows an async value into game state ([`no-async-value-as-state`](lint-rules/no-async-value-as-state.md)), and Dev mode catches game-state changes inside `runLocal` ([Desync safety and guards](desync-safety-and-guards.md)).

```ts
import { Frame, MapPlayer } from "reforged-ts";

export function showHint(player: MapPlayer, hint: Frame): void {
  MapPlayer.runLocal(player, () => {
    hint.visible = true; // visuals only
  });
}
```
