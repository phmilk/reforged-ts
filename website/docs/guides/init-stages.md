---
title: Init stages
sidebar_position: 4
description: The four points of a map's initialization where library and Map project code runs, what exists at each, how failures are reported, and why nothing starts at module top level.
---

# Init stages

A Warcraft III map initializes in steps the World Editor's script drives: its `main` function creates the globals, then the triggers, then runs the initialization triggers, and the game starts a moment later. An Init stage is one of those points. The library runs its own setup and the Map project's code there, each callback under `pcall`, through [`Init`](../api/reforged-ts/variables/Init.md):

| Stage          | Register with         | Runs after                  | What exists                                                                                     |
| -------------- | --------------------- | --------------------------- | ----------------------------------------------------------------------------------------------- |
| `globals`      | `Init.onGlobals`      | `InitGlobals`               | The editor's globals and preplaced units, `tsGlobals.Players` filled                            |
| `triggers`     | `Init.onTriggers`     | `InitCustomTriggers`        | The editor's triggers, created but not run                                                      |
| `initTriggers` | `Init.onInitTriggers` | `RunInitializationTriggers` | Everything the editor's "Map Initialization" triggers did: the end of `main`                    |
| `gameStart`    | `Init.onGameStart`    | `MarkGameStarted`           | A running game: Blizzard.j calls `MarkGameStarted` from a 0.01-second Timer, so the clock ticks |

```ts
import { Init, MapPlayer, Unit } from "reforged-ts";

Init.onGlobals(() => {
  // Create the Handles the map needs from the start.
}, "setup");

Init.onGameStart(() => {
  const owner = MapPlayer.fromIndex(0);
  if (owner !== undefined) {
    Unit.create(owner, FourCC("hpea"), 0, 0).issueOrderAt("move", 256, 0);
  }
}, "first worker");
```

Pick the earliest stage that has what the code needs. Handles and state the rest of the map reads: `onGlobals`. Event registrations: `onTriggers`, or later. Code that depends on what the editor's own initialization triggers did: `onInitTriggers`. Anything that needs the game running (Timers counting, [sync](systems.md#sync), the [host election](systems.md#host)): `onGameStart`.

## How callbacks run

- **Once, in order.** Each stage runs once. The library's callbacks for a stage run first, then the Map project's, in the order they were registered.
- **Under `pcall`, always.** A callback that throws does not stop the stage: the failure is printed on one line, naming the stage and the callback, and the next callback runs. The optional second argument is the label that names it; without one, the callback's number in the stage's queue does:

  ```text
  reforged-ts: gameStart callback "first worker" failed: <Lua error>
  reforged-ts: globals callback #2 failed: <Lua error>
  ```

  This does not depend on Dev mode: without `pcall`, an error in `main` would end the map's initialization silently.

- **Late registration runs at once.** A callback registered for a stage that already ran runs immediately, under the same `pcall`. A callback registered during its own stage's run joins that run.
- **No stage is lost.** When the game starts and a stage never ran (its editor function was missing or never called), it runs first, in stage order.

`Init.hasRun(stage)` tells whether a stage ran, and `Init.current` names the stage in progress, `undefined` between stages and after the last.

## Nothing at module top level

A module's top level runs when the Lua script loads, before `InitGlobals`: the players, the editor's globals and most Natives are not ready, and a Handle created there can desync the game ([Runtime facts](runtime-facts.md#the-entry-points)). Keep module top level to declarations, constants and registrations, and start everything else from a stage:

```ts
import { Init, Timer } from "reforged-ts";

// Declared at top level, created in a stage.
let ticker: Timer | undefined;

Init.onGlobals(() => {
  ticker = Timer.create();
});

Init.onGameStart(() => {
  ticker?.start(1, true, () => {
    print("tick");
  });
});
```

In Dev mode a creation before the `globals` stage raises at the calling line ([Creation before the globals Init stage](desync-safety-and-guards.md#creation-before-the-globals-init-stage-d7)), and the lint reports it in the editor.

## Dev mode comes first

`Reforged.configure({ devMode })` is read when a callback is registered, so it goes first in the Map project's entry point, before any `Init` call. A later call prints a warning naming the first registration ([Dev mode](desync-safety-and-guards.md#dev-mode)).

## Where the library hooks in

The library does not ask the Map project to call anything from `main`. It wraps the editor's functions (`InitGlobals`, `InitCustomTriggers`, `RunInitializationTriggers`, `MarkGameStarted`) when they exist, and captures them when the editor's script defines them later, so the stages behave the same whether the Map project's Lua is appended after the editor's script (the Template's layout) or pasted into the map header. A failure inside the editor's own function is not caught: the stage's callbacks run after it returns.

## `addScriptHook`

w3ts 3.x registered initialization code with `addScriptHook(W3TS_HOOK.MAIN_AFTER, fn)`. [`addScriptHook`](../api/reforged-ts/functions/addScriptHook.md) is kept as a deprecated alias for one release, its callbacks under `pcall` too:

| w3ts 3.x                                            | Replacement                                                     |
| --------------------------------------------------- | --------------------------------------------------------------- |
| `W3TS_HOOK.MAIN_BEFORE`                             | `Init.onGlobals`: after `InitGlobals`, later than before        |
| `W3TS_HOOK.MAIN_AFTER`                              | `Init.onInitTriggers`: the same moment, the end of `main`       |
| `W3TS_HOOK.CONFIG_BEFORE`, `W3TS_HOOK.CONFIG_AFTER` | No stage in this release: keep `addScriptHook` for lobby timing |

## Lint rules

- [`no-handles-at-module-top-level`](lint-rules/no-handles-at-module-top-level.md): a creation that runs when the module loads.
- [`no-legacy-w3ts-names`](lint-rules/no-legacy-w3ts-names.md): the w3ts names of the old Hook code, with their replacements.
