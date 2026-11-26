---
title: Testing your map
sidebar_position: 12
description: Test map logic without opening the game, on reforged-test/map, each test a game of its own on real Lua 5.3.
---

# Testing your map

Opening the game to check a change takes minutes. Most map logic (a score, a spawn rule, a handler's reaction to an event) can be checked in a second instead, with [`reforged-test`](https://github.com/phmilk/reforged-ts/tree/master/packages/reforged-test): your code compiled by typescript-to-lua exactly as the build compiles it, run on real Lua 5.3 with the game's Natives answered by Stubs, and reported to Vitest like any other test.

A test of a Map project imports everything it needs from `reforged-test/map`. It reads as a Vitest test and acts as the game does: it starts a game, makes things happen in it, and checks what the player observes.

## In a Map project

The Template sets the harness up; there is nothing to install or configure.

| Where            | What                                                                                                                                                             |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tests/lua/`     | The map's tests, `*.test.ts`, compiled with `src` into `dist-test` by `tests/lua/tsconfig.json`.                                                                 |
| `tests/harness/` | The wiring: a Vitest global setup that compiles the tests before each run, and the Vitest file that hands the compiled tests to the harness. You do not edit it. |

`pnpm test` runs them with the rest of the Template's tests, `pnpm test:lua` alone, and `pnpm check` runs them before you call a change done. A failing test shows the Lua error and the line, in the terminal and in the Vitest panel of the editor.

## A first test

{/* Written with game.kill, the first Game action (#983): startGame, game.kill, expect(game.printed). */}

## A game per test

Each test runs in a Test game of its own, and starts that game itself:

{@includeCode ../../../packages/reforged-test/examples/welcome.test.ts}

- **A fresh game for each test.** The file is loaded again for each test, in a Lua state of its own, so its top-level code runs once per test, and no test sees the units, the Native calls or the printed lines of another. The order of the tests changes nothing.
- **`startGame()`** runs the map's initialization as the game does, through the Init stages, and returns the test's `game`. Call it once per test, in the test, in a `beforeEach` or at the top of the file; a second call in the same test throws, saying the game already started.
- **`beforeEach` and `afterEach`** run around each test of their `describe`, or of the file at the top, as Vitest's do: the `beforeEach` hooks from the outer `describe` inwards, the `afterEach` hooks from the inner outwards and even when the test failed. A `beforeEach` that throws fails the test and skips its body; an `afterEach` that throws fails a test that had passed; the test reports its first error. A `beforeEach` can start the game for every test of its `describe`. There is no `beforeAll` or `afterAll`: each test is a game of its own.

{@includeCode ../../../packages/reforged-test/examples/before-each.test.ts}

## Making the game happen

{/* The table of Game actions, written with game.kill (#983) and game.chat, game.select, game.deselect and game.leave (#984), and the table of Dispatching Natives (#982). */}

**Every other event goes through `game.fire`.** An event no Game action and no Dispatching Native covers (a spell, an order, a construction, a hero's level) is fired with `game.fire`, the one way to fire it. It takes the event and its Firing context: what each response Native answers while the event's Triggers run, by name. Every Trigger the game would fire for the event runs, the map's handlers among them, and the test never picks one:

{@includeCode ../../../packages/reforged-test/examples/fire.test.ts}

- **The Triggers the game would fire.** They run in registration order, each Trigger's conditions before its actions; a disabled or destroyed Trigger is skipped, and a registration's filter is asked first. No registered Trigger is no error.
- **Whose event it is.** The context names it by the event's family: `GetTriggerUnit` for a unit's event, the `EVENT_PLAYER_UNIT_` ones reaching the Triggers registered for its owner, and `GetTriggerPlayer` for a player's event. A game event needs neither. A context without the one its event needs is an error that names it.
- **Nothing else happens.** `game.fire` changes nothing in the game: it fires the event, and the context answers for its length only. A Native the context names answers its value during the event, even one no Stub answers, and nil after it.

## Time

{/* Written with the Game clock and game.advanceTime (#985) and the timer readings under it (#986). */}

## Assertions

`expect` has Vitest's matchers where typescript-to-lua compiles them, with `.not` and the asymmetric matchers (`expect.anything()`, `expect.any("number")`, `expect.objectContaining(…)`); [`GameMatchers`](../api/reforged-test/interfaces/GameMatchers.md) lists them. `game.printed` holds every line printed since the game began, the library's included, one entry per `print` call with its arguments joined by a tab. `game.displayed` holds every message shown on a player's screen, as `{ text, player, duration }`. Each read is a copy, taken at the moment you read it.

{/* Completed with every Native a Spy, fn and calls (#987). */}

## Errors

{/* Written with the Caught error and game.expectError (#988). */}

## A Native without a Stub

The harness answers the Natives a map most often calls with its Shipped stubs, and not every one: it holds no object data, so nothing answers `GetUnitName`. A test gives such a Native its answer with `stubNative`:

{@includeCode ../../../packages/reforged-test/examples/stub-native.test.ts}

- **Typed from the Typings.** The name is a Native of `common.j`, and the answer has that Native's signature: its parameters need no annotation, and a wrong return is a compile error. The answer may be left out only for a Native that returns nothing: `stubNative("PauseGame")`.
- **Recorded.** Every call is recorded before the answer runs, as a Shipped stub records its own.
- **Anywhere, for this test.** Call it at the top of the file, for every test of it, or inside one test, before or after `startGame()`. The last call for a name wins, and an answer lives in its test's game only.
- **A `stubNative` replacement is whole: over a Native a Shipped stub covers, the Shipped stub no longer runs, so the state it kept and its Event dispatch are gone; keep `stubNative` for the Natives that answer a value.**

An answer that creates a Handle returns one made with `newHandle(kind)`, the kind being the Handle type's name in the Typings. It takes the next handle id of the test's game, as a Handle a Shipped stub creates does:

{@includeCode ../../../packages/reforged-test/examples/new-handle.test.ts}

`game.setLocalPlayer(player)` makes the test act as another client: `GetLocalPlayer` answers that player from then on, `Player(0)` until the first call. It takes a `MapPlayer` or its Handle, and may be called more than once in a test:

{@includeCode ../../../packages/reforged-test/examples/set-local-player.test.ts}

A Lua stub file listed in the `stubs` option of the harness still loads, after the shipped ones; `stubNative` replaces it where a test needs the answer in TypeScript.

{/* Completed with the message that names stubNative (#990). */}

## Focus and skip

`it.skip`, `it.only`, `it.todo`, `describe.skip` and `describe.only` are Vitest's own: the report, the nesting and the failure of a forgotten `only` are Vitest's.

{@includeCode ../../../packages/reforged-test/examples/it-skip.test.ts}

- **Skip.** `it.skip` and `describe.skip` keep a test that is not ready in the file: Vitest reports it as skipped, and it opens no Test game and runs no `beforeEach` or `afterEach`.
- **Todo.** `it.todo(name)` names a test still to write. It takes no body: passing one is a type error.
- **Only.** `it.only` and `describe.only` focus on the tests you are writing:

  ```ts
  import { it } from "reforged-test/map";
  it.only("announces the first wave", () => {});
  ```

  `only` reaches every Lua test of the Map project: the tests of every other test file are reported as skipped too, and open no Test game.

- **A forgotten `only` fails in CI.** Under `CI`, Vitest refuses `only` and fails the run, so a focus never hides the other tests of a pull request.

`skipIf`, `runIf`, `fails`, `concurrent` and `each` have no form on `reforged-test/map`.

## What the harness cannot tell you

The harness stands in for the Natives, not for the game:

- **Integers are 64-bit** on the harness and 32-bit in the game ([Runtime facts](runtime-facts.md#integers-are-32-bit)). A test must not depend on the width: no overflow, no bit operation above 31 bits, no `math.maxinteger`.
- **No engine.** Pathing, combat, orders, object data, rendering and frame layout are absent. A Stub answers what the code gave it and what the test set, nothing more.
- **One client.** The harness is one machine. It can run code as another local player, but it cannot show a desync.
- **The Lua is stock 5.3.** The globals the game removes (`debug`, `require`, `io`) exist on the harness, and the Typings declare the whole 5.3 standard library, so a call to one compiles, passes a test and fails in the game: keep them out of map code ([Runtime facts](runtime-facts.md#missing-globals)).

What only the game can answer, check with `pnpm test:map`.
