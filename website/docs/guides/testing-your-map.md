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

A test starts the game, makes something happen in it and checks what the player observes:

{@includeCode ../../../packages/reforged-test/examples/first.test.ts}

- **`startGame()`** runs the map's initialization, so the handler the map registers when the game starts is in place, and returns the test's `game`.
- **`game.kill(footman)`** says what happens in the game. Every death Trigger the game would fire runs, the map's handler among them, with the footman already dead: the test never looks for a Trigger.
- **`expect(game.printed)`** checks what the map printed, with Vitest's matchers.

The units are created with the map's own API, `Unit.create` here: the test and the map speak the same language. In a Map project the handler lives in `src`, and the test imports the map's entry file in its place.

## A game per test

Each test runs in a Test game of its own, and starts that game itself:

{@includeCode ../../../packages/reforged-test/examples/welcome.test.ts}

- **A fresh game for each test.** The file is loaded again for each test, in a Lua state of its own, so its top-level code runs once per test, and no test sees the units, the Native calls or the printed lines of another. The order of the tests changes nothing.
- **`startGame()`** runs the map's initialization as the game does, through the Init stages, and returns the test's `game`. Call it once per test, in the test, in a `beforeEach` or at the top of the file; a second call in the same test throws, saying the game already started.
- **`beforeEach` and `afterEach`** run around each test of their `describe`, or of the file at the top, as Vitest's do: the `beforeEach` hooks from the outer `describe` inwards, the `afterEach` hooks from the inner outwards and even when the test failed. A `beforeEach` that throws fails the test and skips its body; an `afterEach` that throws fails a test that had passed; the test reports its first error. A `beforeEach` can start the game for every test of its `describe`. There is no `beforeAll` or `afterAll`: each test is a game of its own.

{@includeCode ../../../packages/reforged-test/examples/before-each.test.ts}

## Making the game happen

**A Game action says what happens in the game.** It takes its subject, then what else it needs, a unit or a player being its Handle or anything with `.handle`, as a `Unit` or a `MapPlayer` of the library. It fires every event the game would fire, with every response the game gives, writes the state its name states and nothing derived, and returns nothing. What the game refuses is an error, so a test cannot describe a game that cannot happen:

| Game action                   | Fires, in this order                                                                                                                              | A handler reads                                                                                                                                                                                                                                                         | Writes                                                              | Refuses                                                                   |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `game.kill(unit, { by? })`    | the widget death (`TriggerRegisterDeathEvent`), `EVENT_PLAYER_UNIT_DEATH`, `EVENT_UNIT_DEATH`                                                     | `GetTriggerUnit` the unit, already dead (`UnitAlive` false, its life 0); in the two death events of the unit, `GetDyingUnit` the unit, `GetTriggerPlayer` its owner and `GetKillingUnit` the unit given as `by`, nil without it; in the widget death, none of the three | the unit dead                                                       | a unit already dead or removed, and a removed killer                      |
| `game.chat(player, text)`     | every Trigger whose chat registration of the player matches the message, once per matching registration, in the order the registrations were made | `GetEventPlayerChatString` the message as given, `GetEventPlayerChatStringMatched` the registration's filter in lower case, `GetTriggerPlayer` the player; `GetTriggerEventId` the event of id 96, as in the game, not `EVENT_PLAYER_CHAT`                              | nothing                                                             | a player who is not playing                                               |
| `game.select(player, unit)`   | `EVENT_PLAYER_UNIT_SELECTED` of the player who selects, `EVENT_UNIT_SELECTED`                                                                     | `GetTriggerUnit` the unit; `GetTriggerPlayer` the player in the first event and the unit's owner in the second; `IsUnitSelected` already true, and the unit in `GroupEnumUnitsSelected` only after the handlers                                                         | the unit in the player's selection, after the units selected before | a unit already selected, dead or removed, and a player who is not playing |
| `game.deselect(player, unit)` | `EVENT_PLAYER_UNIT_DESELECTED` of the player who deselects, `EVENT_UNIT_DESELECTED`                                                               | `GetTriggerUnit` the unit, still selected; `GetTriggerPlayer` the player in the first event and the unit's owner in the second                                                                                                                                          | the unit out of the player's selection                              | a unit that is not in the selection                                       |
| `game.leave(player)`          | `EVENT_PLAYER_LEAVE` of the player                                                                                                                | `GetTriggerPlayer` the player, its slot still `PLAYER_SLOT_STATE_PLAYING`                                                                                                                                                                                               | the slot as `PLAYER_SLOT_STATE_LEFT`, after the handlers            | a player who is not playing                                               |

A killer already dead is accepted. A handler reads the killer the test names:

{@includeCode ../../../packages/reforged-test/examples/kill.test.ts}

**A chat message matches as the game matches it.** A registration matches when its filter is empty, or when, both in lower case, it equals the message (an exact match) or is found anywhere in it; nothing is trimmed. A Trigger runs once per matching registration, and a handler reads the message as typed:

{@includeCode ../../../packages/reforged-test/examples/chat.test.ts}

**A selection is the player's own.** `game.select` says a unit entered a player's selection, and `game.deselect` that it left: it adds to the selection and clears nothing, and the event is the selecting player's, whoever owns the unit. `IsUnitSelected` and `GroupEnumUnitsSelected` read the selection:

{@includeCode ../../../packages/reforged-test/examples/select.test.ts}

**Players 0 and 1 are playing**, and every other slot is empty. A player who is not playing types, selects and leaves nothing: naming one is an error, as it is for a player after `game.leave`, and in a handler of its leave. `game.leave` copies [a Probe run of two clients](https://github.com/phmilk/reforged-ts/blob/master/docs/research/player-leave.md): the handlers run first, the slot still playing, then the slot is written, and nothing else, no defeat, no victory, the units, the controller and the selection kept. The [chat](https://github.com/phmilk/reforged-ts/blob/master/docs/research/chat-event-matching.md) and the [selection](https://github.com/phmilk/reforged-ts/blob/master/docs/research/selection-events.md) each copy a Probe run too:

{@includeCode ../../../packages/reforged-test/examples/leave.test.ts}

There is no `game.createUnit`: a test creates its units as the map does.

**A Native the map calls fires its event inside the call**, where the game does: a Dispatching Native. When the map's code kills a unit, changes its owner or gives and takes an item, every Trigger the game would fire runs before the call returns, a handler that calls one of them runs its own chain inside it, and the test fires nothing by hand. A player's event reaches the Triggers of the unit's owner (the new owner for a change of owner), before the unit's own event, whichever Trigger was registered first, as two Probe runs measured the game ([which Natives fire inside the call](https://github.com/phmilk/reforged-ts/blob/master/docs/research/unit-event-timing.md), [what their handlers read](https://github.com/phmilk/reforged-ts/blob/master/docs/research/dispatching-natives.md)):

| Native                                     | Fires, in this order                                                                                               | A handler reads                                                                                                                 | Fires nothing for                                                                      |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `KillUnit`                                 | the widget death (`TriggerRegisterDeathEvent`), `EVENT_PLAYER_UNIT_DEATH`, `EVENT_UNIT_DEATH`                      | `GetTriggerUnit` and `GetDyingUnit` the unit, already dead (`UnitAlive` false, its life 0); `GetKillingUnit` nil                | a unit already dead                                                                    |
| `SetUnitOwner`                             | `EVENT_PLAYER_UNIT_CHANGE_OWNER` of the new owner, `EVENT_UNIT_CHANGE_OWNER`                                       | `GetChangingUnit` the unit, `GetTriggerPlayer` and `GetOwningPlayer` the new owner, `GetChangingUnitPrevOwner` the previous one | the owner the unit has                                                                 |
| `UnitAddItem`, `UnitAddItemById`           | `EVENT_PLAYER_UNIT_PICKUP_ITEM`, `EVENT_UNIT_PICKUP_ITEM`; for an item the unit carries, the two drop events first | `GetManipulatingUnit` the unit, `GetManipulatedItem` the item, already carried (`UnitHasItem` true)                             | a unit without an inventory: `UnitAddItem` returns false and `UnitAddItemById` nothing |
| `UnitRemoveItem`, `UnitRemoveItemFromSlot` | `EVENT_PLAYER_UNIT_DROP_ITEM`, `EVENT_UNIT_DROP_ITEM`                                                              | `GetManipulatingUnit` the unit, `GetManipulatedItem` the item, still carried (`UnitHasItem` true until the call returns)        | an item the unit does not carry, an empty slot                                         |

- **Dead or alive, no hit points.** A unit is alive until it dies; after its death `UnitAlive` is false and its life reads 0. The harness keeps no life for a live unit: a test that reads one gives it with `stubNative`.
- **An inventory for every unit.** The harness holds no object data, so every unit has one; a test makes a unit without one by answering `UnitInventorySize` with 0.
- **Nothing else fires on its own.** `RemoveUnit` fires nothing, and a lethal `UnitDamageTarget` fires its damage events but no death. `SelectUnit` and `ClearSelection` write the local player's selection, the one `game.select` writes, and fire nothing: in the game their selection events come after the call, so a test that needs them says `game.select` or `game.deselect`. A Dispatching Native replaced with `stubNative` fires nothing either.

**Every other event goes through `game.fire`.** An event no Game action and no Dispatching Native covers (a spell, an order, a construction, a hero's level) is fired with `game.fire`, the one way to fire it. It takes the event and its Firing context: what each response Native answers while the event's Triggers run, by name. Every Trigger the game would fire for the event runs, the map's handlers among them, and the test never picks one:

{@includeCode ../../../packages/reforged-test/examples/fire.test.ts}

- **The Triggers the game would fire.** They run in registration order, each Trigger's conditions before its actions; a disabled or destroyed Trigger is skipped, and a registration's filter is asked first. No registered Trigger is no error.
- **Whose event it is.** The context names it by the event's family: `GetTriggerUnit` for a unit's event, the `EVENT_PLAYER_UNIT_` ones reaching the Triggers registered for its owner, and `GetTriggerPlayer` for a player's event. A game event needs neither. A context without the one its event needs is an error that names it.
- **Nothing else happens.** `game.fire` changes nothing in the game: it fires the event, and the context answers for its length only. A Native the context names answers its value during the event, even one no Stub answers, and nil after it.

## Time

Game time is the Test game's own. It starts at 0 and nothing expires on its own: `game.advanceTime` moves it, and every timer that expires on the way fires, the library's own included. A test of a countdown never looks for its timer:

{@includeCode ../../../packages/reforged-test/examples/advance-time.test.ts}

- **In the game's order.** The timers fire in the order of their instants, those of one instant in the order they were started. Each handler runs with the clock at its instant, so a timer it starts fires in the same advance when it expires before the advance ends.
- **Exact counts.** A periodic timer fires once per period, without drift: 120 times in `game.advanceTime(120)` at a period of 1, however the test splits the 120 seconds.
- **Stopped timers stay quiet.** A destroyed or paused timer does not fire, and starting a timer again drops what it had pending.
- **Readings as in the game.** A timer's elapsed and remaining time follow the clock: a paused timer reads what it read at the pause, and a one-shot timer its timeout and 0 from its handler on.
- **Expire events.** The Triggers of a timer's expire event fire at each of its expiries, before its handler.
- **An error stops the clock.** An error a handler throws leaves `game.advanceTime`, the clock at that instant and the later timers still pending.
- **Timers, and nothing else.** An advance fires timers, their expire events and the Triggers of `TriggerRegisterTimerEvent`. Nothing else has a duration on the harness: a wait (`TriggerSleepAction`), a cooldown, a buff and a unit's life span do not move, and neither does `os.clock`.

**A timeout of 0 is deferred work.** A one-shot timer of timeout 0 never fires inside the call that starts it, [as in the game](https://github.com/phmilk/reforged-ts/blob/master/docs/research/timer-answers.md#a-timer-of-timeout-0): it fires on the next advance, `game.advanceTime(0)` included. A periodic one fires every 0.0001 s, the period the game runs it at, so one second of it is 10000 handlers.

{@includeCode ../../../packages/reforged-test/examples/deferred.test.ts}

**A resumed timer does what it does in the game.** A timer the game's `ResumeTimer` resumes fires when what was left at the pause runs out, once more a full timeout later, then never again, one-shot or periodic alike ([the findings](https://github.com/phmilk/reforged-ts/blob/master/docs/research/timer-resume-cases.md)).

## Assertions

`expect` has Vitest's matchers where typescript-to-lua compiles them, with `.not` and the asymmetric matchers (`expect.anything()`, `expect.any("number")`, `expect.objectContaining(…)`); [`GameMatchers`](../api/reforged-test/interfaces/GameMatchers.md) lists them. `game.printed` holds every line printed since the game began, the library's included, one entry per `print` call with its arguments joined by a tab. `game.displayed` holds every message shown on a player's screen, as `{ text, player, duration }`. Each read is a copy, taken at the moment you read it.

{@includeCode ../../../packages/reforged-test/examples/expect.test.ts}

**Every Native is already a Spy.** Hand the Native itself to `expect`, and the spy matchers (`toHaveBeenCalled`, `toHaveBeenCalledTimes`, `toHaveBeenCalledWith`, `toHaveBeenLastCalledWith` and `toHaveBeenNthCalledWith`, which [`GameMatchers`](../api/reforged-test/interfaces/GameMatchers.md) describes) read the calls its Stub recorded. The arguments are typed from the Native's parameters, so a wrong one is a compile error, and nothing is replaced to watch the Native, so there is nothing to restore:

{@includeCode ../../../packages/reforged-test/examples/spies.test.ts}

**A Spy of your own.** `fn()` makes a Spy: a real function, to hand the library as a callback, whose calls the same matchers read. Given a function, the Spy calls it and returns what it returned. There is no `spyOn` and no `mockReturnValue`: a Native's answer is given with [`stubNative`](#a-native-without-a-stub). There is no reset either, each test being a game of its own:

{@includeCode ../../../packages/reforged-test/examples/fn.test.ts}

**A value out of a call.** `calls` returns the arguments of each call of a Spy or of a Native, oldest first, typed as its parameters: the handler a Native received, for instance, which the test can then call as the game would:

{@includeCode ../../../packages/reforged-test/examples/calls.test.ts}

A failure says what was compared, with Handles rendered as `kind#id`, and a spy matcher's lists the calls received, one per line. Vitest draws the diff of the two values compared, in the terminal and in the editor's panel:

```text
AssertionError: Expected TimerStart to have been called with (expect.anything(), 60, true, expect.anything()); it received 1 call:
  1: TimerStart(timer#1048577, 30, false, <function>)
```

## Errors

**A Caught error fails the test.** The library catches an error of the map's code in an Init stage's callback, and in Dev mode in a handler: it prints the line `reforged-ts: <origin> failed: <message>` and the game goes on, as in the game. A test that leaves one unexpected fails at its end, after its last `afterEach`, so a broken callback is never a green test:

```text
LuaError: The map's code raised an error the library caught, and the test did not expect it with game.expectError:
  gameStart callback #1 failed: war3map.lua:11: attempt to index a nil value (local 'third')
```

- **Each listed, the cause first.** The failure lists every Caught error the test did not expect, as `<origin> failed: <message>`, a repeat counted `×N` on the line of its first, before the test's own failure when it has one.
- **For the whole test.** One raised during `startGame()`, a `beforeEach` or an `afterEach` counts for the test too. A warning the library prints is no Caught error, and fails nothing.

**A map meant to report an error says so after the act.** `game.expectError(text)` expects every Caught error so far whose message contains `text`, as plain text, its repeats included, and throws at once when there is none. A Caught error after the call needs another call. There is no `game.errors`: the test states the error it expects, and the harness fails it for the others.

{@includeCode ../../../packages/reforged-test/examples/expect-error.test.ts}

**With Dev mode off, a handler's error fails the test at once, thrown out of the Game action.** The Test game forces no Dev mode: as in a release build, the library catches no handler's error, so the test sees it where the game would stop the handler:

{@includeCode ../../../packages/reforged-test/examples/handler-error.test.ts}

## A Native without a Stub

The harness answers the Natives a map most often calls with its Shipped stubs, and not every one: it holds no object data, so nothing answers `GetUnitName`. Calling a Native without a Stub fails the test with a message that says what to write:

```text
GetUnitName is a Native reforged-test does not stub: give it an answer with stubNative("GetUnitName", …)
```

A test gives such a Native its answer with `stubNative`:

{@includeCode ../../../packages/reforged-test/examples/stub-native.test.ts}

- **Typed from the Typings.** The name is a Native of `common.j`, and the answer has that Native's signature: its parameters need no annotation, and a wrong return is a compile error. The answer may be left out only for a Native that returns nothing: `stubNative("PauseGame")`.
- **Recorded.** Every call is recorded before the answer runs, as a Shipped stub records its own.
- **Anywhere, for this test.** Call it at the top of the file, for every test of it, or inside one test, before or after `startGame()`. The last call for a name wins, and an answer lives in its test's game only.
- **Whole.** A `stubNative` replacement is whole: over a Native a Shipped stub covers, the Shipped stub does not run, so the state it kept and its Event dispatch are gone; keep `stubNative` for the Natives that answer a value.

An answer that creates a Handle returns one made with `newHandle(kind)`, the kind being the Handle type's name in the Typings. It takes the next handle id of the test's game, as a Handle a Shipped stub creates does:

{@includeCode ../../../packages/reforged-test/examples/new-handle.test.ts}

`game.setLocalPlayer(player)` makes the test act as another client: `GetLocalPlayer` answers that player from then on, `Player(0)` until the first call. It takes a `MapPlayer` or its Handle, and may be called more than once in a test:

{@includeCode ../../../packages/reforged-test/examples/set-local-player.test.ts}

A Lua stub file listed in the `stubs` option of the harness loads after the shipped ones; `stubNative` replaces it where a test needs the answer in TypeScript.

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
