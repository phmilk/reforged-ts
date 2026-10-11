---
title: Testing your map
sidebar_position: 12
description: Run map logic on the Lua harness of reforged-test, real Lua 5.3 with the Natives stubbed, without opening the game.
---

# Testing your map

Opening the game to check a change takes minutes. Most map logic (a score, a spawn rule, a handler's reaction to an event) can be checked in a second instead, on the Lua harness of [`reforged-test`](https://github.com/phmilk/reforged-ts/tree/master/packages/reforged-test): your code compiled by typescript-to-lua exactly as the build compiles it, run on real Lua 5.3 with the game's Natives replaced by stubs, and reported to vitest like any other test.

A test observes what the game would see of your code: the Native calls it makes with their arguments, the Handles it creates, and what it prints. It fires the triggers and the timers your code registered, as the game would, and checks what happened.

## In a Map project

The Template sets the harness up; there is nothing to install or configure.

| Where                  | What                                                                                                                                                             |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tests/lua/`           | The map's tests, `*.test.ts`, compiled with `src` into `dist-test` by `tests/lua/tsconfig.json`.                                                                 |
| `tests/stubs/`         | The Native stubs the map needs beyond the ones `reforged-test` ships, plain Lua files.                                                                           |
| `tests/lua/stubs.d.ts` | The TypeScript declarations of the firing helpers the tests call (`__stub_fire_trigger`, `__stub_fire_timer`, `__stub_format`).                                  |
| `tests/harness/`       | The wiring: a vitest global setup that compiles the tests before each run, and the vitest file that hands the compiled tests to the harness. You do not edit it. |

`pnpm test` runs them with the rest of the Template's tests, `pnpm test:lua` alone, and `pnpm check` runs them before you call a change done. A failing test shows the Lua error and the line, in the terminal and in the vitest panel of the editor.

## A first test

Take a module that counts the kills of each player:

```ts title="src/score.ts"
import { Init, on, UnitEvents } from "reforged-ts";

/** The kills of each player, by player id. */
export const kills: number[] = [];

Init.onGameStart(() => {
  on(UnitEvents.death, ({ killer }) => {
    if (killer === undefined) return;
    const id = killer.getOwner().id;
    kills[id] = (kills[id] ?? 0) + 1;
  });
});
```

Its test starts the game, finds the Trigger the Subscription registered, fires it with a killer, and reads the count:

```ts title="tests/lua/score.test.ts"
/** @noSelfInFile */
import { describe, expect, it } from "reforged-test/lua";
import { MapPlayer, Unit } from "reforged-ts";
import { kills } from "../../src/score";

// The arguments of every call of a Native, oldest first.
declare function __stub_args(name: string): (unknown[] & { n: number })[];

const globals = _G as unknown as Record<string, unknown>;

// Starts the game as the editor's script would: the library wraps
// MarkGameStarted when it is defined, so calling it runs the game start stage.
globals.MarkGameStarted = () => undefined;
MarkGameStarted();

describe("the score", () => {
  it("counts a kill for the killer's owner", () => {
    const deaths = __stub_args("TriggerRegisterPlayerUnitEvent").filter(
      (call) => call[2] === EVENT_PLAYER_UNIT_DEATH,
    );
    const trigger = deaths[0]?.[0] as trigger;
    const owner = MapPlayer.fromIndex(0);
    if (owner === undefined) throw new Error("no player in slot 0");
    // A Footman, `FourCC("hfoo")`, kills a Peasant, `FourCC("hpea")`.
    const killer = Unit.create(owner, FourCC("hfoo"), 0, 0);
    const victim = Unit.create(owner, FourCC("hpea"), 0, 0);

    __stub_fire_trigger(trigger, {
      GetTriggerUnit: victim.handle,
      GetKillingUnit: killer.handle,
    });

    expect(kills[0]).toEqual(1);
  });
});
```

What the test relies on:

- **The runner.** `describe`, `it` and `expect` come from `reforged-test/lua`: they run inside Lua, not in Node. The matchers are `toEqual` (deep equality on tables), `toBe` (identity), `toBeTruthy`, `toBeFalsy`, `toBeUndefined`, `toThrow` and `toContainCall`.
- **One Lua state per file.** Each test file runs in a fresh Lua state: the stubs load, then the file, then its `it`s in order. The `it`s of one file share the state, its Handles and its call log.
- **Nothing fires on its own.** No time passes and no event happens: the test enters an Init stage by calling the editor's entry point, and fires triggers and timers with the helpers below.

## Driving the game

The shipped stubs record every Native call and give the test these helpers. They are Lua globals, not Natives; the Template declares the first three in `tests/lua/stubs.d.ts`, and a test declares any other it calls, as the test above declares `__stub_args`.

| Helper                                   | What it does                                                                                                                                     |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `__stub_fire_trigger(trigger, context?)` | Runs the trigger's conditions, then its actions, with `context` as what the event response Natives answer (`{ GetTriggerUnit: u.handle }`).      |
| `__stub_fire_timer(timer)`               | Runs the handler `TimerStart` stored, once, with the timer as `GetExpiredTimer`'s answer.                                                        |
| `__stub_format(value)`                   | Renders a value as the call log does: a Handle as `timer#1048577`.                                                                               |
| `stubCalls()` (from `reforged-test/lua`) | The call log, one `Name(arg, arg)` line per Native call: `expect(stubCalls()).toContainCall("TimerStart(timer#1048580, 60, true, <function>)")`. |
| `__stub_args(name)`                      | The arguments of every call of the Native `name`, each the very value it was given (a callback, a Handle).                                       |
| `__stub_init_globals()`                  | Enters the globals Init stage, as the editor's `main` does.                                                                                      |
| `__stub_set_local_player(slot)`          | Makes the player in `slot` the local player, to run the code as another client; returns the slot it replaced.                                    |
| `__stub_printed()`, `__stub_displayed()` | What `print` and the display Natives showed, oldest first.                                                                                       |
| `__stub_dispatch_damage(damage)`         | Dispatches a damage event to the triggers registered for it, as `UnitDamageTarget` does.                                                         |

Slots 0 and 1 are playing users and every other slot is empty, until a test overrides the Natives that say so. The [`reforged-test` README](https://github.com/phmilk/reforged-ts/tree/master/packages/reforged-test#stubs) lists every stubbed Native, each helper's exact behaviour and the stub authoring rules.

## Stubbing a Native

A Native that no stub defines fails the test that calls it:

```text
LuaError: score_test.lua:12: Native SetUnitX is not stubbed
```

Add it to a Lua file in `tests/stubs/`. A stub records its call with `__stub_record`, keeps only the state its Natives read back, and never simulates a game rule. The Template's `tests/stubs/units.lua` stubs `GetUnitName`:

```lua
-- The harness's units carry no name, so a unit answers the rawcode
-- CreateUnit was given: FourCC("hfoo") -> "hfoo".
function GetUnitName(whichUnit)
  __stub_record("GetUnitName", whichUnit)
  return string.pack(">I4", whichUnit.typeId)
end
```

Never edit the stubs `reforged-test` ships: a stub the whole ecosystem needs belongs in the package, through a pull request.

## What the harness cannot tell you

The harness stands in for the Natives, not for the game:

- **Integers are 64-bit** on the harness and 32-bit in the game ([Runtime facts](runtime-facts.md#integers-are-32-bit)). A test must not depend on the width: no overflow, no bit operation above 31 bits, no `math.maxinteger`. A test that needs 32-bit semantics carries `[32-bit]` in its name and is skipped until the harness gains a 32-bit run.
- **No engine.** Pathing, combat, orders, object data, rendering and frame layout are absent. A stub hands back what the code gave it, nothing more.
- **One client.** The harness is one machine. It can run code as another local player, but it cannot show a desync.
- **The Lua is stock 5.3.** The globals the game removes (`debug`, `require`, `io`) exist on the harness, and the Typings declare the whole 5.3 standard library, so a call to one compiles, passes a test and fails in the game: keep them out of map code ([Runtime facts](runtime-facts.md#missing-globals)).

What only the game can answer, check with `pnpm test:map`.
