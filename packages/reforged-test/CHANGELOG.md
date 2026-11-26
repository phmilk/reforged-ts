# reforged-test

## 1.0.0-alpha.14

### Minor Changes

- [#1021](https://github.com/phmilk/reforged-ts/pull/1021) [`c5870ec`](https://github.com/phmilk/reforged-ts/commit/c5870ec064073449095aeccdae0f24455a3f2c33) Thanks [@wyller](https://github.com/wyller)! - Every Native is a Spy on `reforged-test/map` and `reforged-test/lua`: `expect(TimerStart).toHaveBeenCalledWith(expect.anything(), 60, true, expect.anything())` reads the calls the Native's Stub recorded, typed from its parameters, with nothing replaced and nothing to restore. `fn(impl?)` makes a Spy for a callback and `calls(spy)` returns the arguments of each call of a Spy or a Native. The five spy matchers are `toHaveBeenCalled`, `toHaveBeenCalledTimes`, `toHaveBeenCalledWith`, `toHaveBeenLastCalledWith` and `toHaveBeenNthCalledWith`. A spy matcher's failure lists the calls received, and `toEqual`, `toBe`, `toMatchObject` and the spy matchers comparing arguments now show Vitest's diff. A constant of the game is shown by its name in a failure, and compared by identity. The asymmetric matchers (`expect.anything()` and the others) are typed `never` in place of `any`: they still stand where any value is expected, and handing one to a typed parameter no longer raises `no-unsafe-argument`. The guide "Testing your map" gains its section "Assertions".

- [#1023](https://github.com/phmilk/reforged-ts/pull/1023) [`224af4a`](https://github.com/phmilk/reforged-ts/commit/224af4a6dca157a6bb2c83683d02b7d4753e4a88) Thanks [@phmilk](https://github.com/phmilk)! - A Native without a Stub says what to write. Calling a Native of `common.j` that no Shipped stub covers now throws `GetUnitName is a Native reforged-test does not stub: give it an answer with stubNative("GetUnitName", …)`, at the line that called it (through a tail call, the nearest caller still on the stack), where Lua said `attempt to call a nil value`. Such a Native is now a function and no longer `nil`: a stub file of the `stubs` option still defines over it, and `__stub_unstubbed(name)` tells whether a Native is still without a Stub. The functions of `blizzard.j` and `common.ai` stay undefined.

- [#1022](https://github.com/phmilk/reforged-ts/pull/1022) [`df59d21`](https://github.com/phmilk/reforged-ts/commit/df59d2100a0fcd6fa817c213543b1cc4dfd75dd1) Thanks [@wyller](https://github.com/wyller)! - The Dispatching Natives fire their events inside the call, as the game does: `KillUnit` (the widget death, the player unit death and the unit death, the unit already dead), `SetUnitOwner` (the change of owner of the new owner, then the unit's), `UnitAddItem` and `UnitAddItemById` (the pickup; for an item the unit carries, the drop first) and `UnitRemoveItem` (the drop, the item still carried in the handler), each firing nothing where the game fires nothing. A chain of handlers runs in a test as it runs in the game, with no manual fire. `KillUnit`, `SetUnitOwner`, `UnitRemoveItem`, `UnitHasItem`, `UnitInventorySize` (6) and `UnitAlive` get a Shipped stub; after a death `GetWidgetLife` and `GetUnitState(UNIT_STATE_LIFE)` answer 0, and a live unit's life is an error that asks for `stubNative`, as the stubs keep no hit points. A unit whose `UnitInventorySize` the test answers 0 has no inventory: `UnitAddItem` returns false and nothing fires. `GetDyingUnit` and `GetManipulatingUnit` answer from the Firing context.

  **Behaviour change on `reforged-test/lua` too:** these Natives fire the Triggers registered for their events there as well. A library test that registers a death, change-owner, pickup or drop Trigger and then calls one of them now sees it run inside the call.

## 1.0.0-alpha.13

### Minor Changes

- [#1019](https://github.com/phmilk/reforged-ts/pull/1019) [`376198c`](https://github.com/phmilk/reforged-ts/commit/376198ca7e3e3693fd319e1eba007a2e7e91a744) Thanks [@wyller](https://github.com/wyller)! - Focus and skip on `reforged-test/map` and `reforged-test/lua`: `it.skip`, `it.only`, `it.todo(name)`, `describe.skip` and `describe.only`, registered in Vitest's native form by `runLuaTests`, so Vitest reports each and a forgotten `only` fails the run under `CI`. A test skipped, todo or out of focus opens no Test game and runs no `beforeEach` or `afterEach`; `only` reaches every Lua test of the Map project. On `reforged-test/lua` the body of a skip or todo test does not run, and `only` hides the report only. The results contract gains the status `skip` and the keys `mode` and `suiteModes`.

- [#1016](https://github.com/phmilk/reforged-ts/pull/1016) [`1fccd2f`](https://github.com/phmilk/reforged-ts/commit/1fccd2f96870739dd901324f293afba06cd1b28b) Thanks [@wyller](https://github.com/wyller)! - On `reforged-test/map`, `game.fire(event, context)` fires one event as the game would: every Trigger registered for it runs, in registration order, a disabled or destroyed Trigger skipped and a registration's filter evaluated, with `context` as the Firing context. The subject comes from the context by the event's family (the owner of `GetTriggerUnit`, `GetTriggerUnit`, `GetTriggerPlayer`, or none for a game event); a context without it is an error naming the Native. It is the way to fire any event no Game action covers, a spell among them. The entry point exports the type `FiringContext`. The triggers stub now remembers every registration that names its event, and `__stub_dispatch(event, subject, context)` of `reforged-test/stubs` makes the same Event dispatch on `reforged-test/lua`; `__stub_fire_trigger` is unchanged.

## 1.0.0-alpha.12

### Minor Changes

- [#1013](https://github.com/phmilk/reforged-ts/pull/1013) [`8996a3b`](https://github.com/phmilk/reforged-ts/commit/8996a3b933860fde4fd6617d52c36d0911e2be25) Thanks [@phmilk](https://github.com/phmilk)! - `reforged-test/map` gains `stubNative`, `newHandle` and `game.setLocalPlayer`.

  - `stubNative(name, impl)` answers a Native in TypeScript, in the test's own game: `stubNative("GetUnitName", (unit) => "Footman")`. The name is typed as a Native of `common.j` and `impl` by its signature, optional only for a Native that returns nothing; each call is recorded before `impl` runs. Over a Native a Shipped stub covers, the replacement is whole: the Shipped stub no longer runs, its state and its Event dispatch with it.
  - `newHandle(kind)` returns a Handle of the test's game, typed from `kind` (`newHandle("unit")` is a `unit`), for an answer that creates one.
  - `game.setLocalPlayer(player)` makes the test act as another client: `GetLocalPlayer` answers that player from then on. It takes the Handle of a player of the test's game or anything with `.handle`, and throws for anything else, a Handle of `newHandle("player")` included.

## 1.0.0-alpha.11

### Patch Changes

- [#1010](https://github.com/phmilk/reforged-ts/pull/1010) [`533f444`](https://github.com/phmilk/reforged-ts/commit/533f444a5b987c8481d47d3563ee4e6133b64162) Thanks [@wyller](https://github.com/wyller)! - The README splits into "Testing a map", which sends a Map project to the guide "Testing your map", and "Testing a library", the harness level of the library's own tests. A helper a map's test needs that `reforged-test/map` does not export is a gap of the package, to file as an issue.

## 1.0.0-alpha.10

### Patch Changes

- [#1006](https://github.com/phmilk/reforged-ts/pull/1006) [`898ccc5`](https://github.com/phmilk/reforged-ts/commit/898ccc577bdb83d219d3792ed9c3a6f4741f471d) Thanks [@wyller](https://github.com/wyller)! - Every export of `reforged-test/map` now carries an example in its doc comment, which the editor shows on hover: a complete test file the package compiles and runs. The docs site gains a `reforged-test` section in its API reference, generated from `reforged-test/map` alone.

## 1.0.0-alpha.9

### Minor Changes

- [#1005](https://github.com/phmilk/reforged-ts/pull/1005) [`e348c42`](https://github.com/phmilk/reforged-ts/commit/e348c42a8430edc530ee0cb2a97c30d555b92db7) Thanks [@wyller](https://github.com/wyller)! - A Map project's test arranges each test once, in `beforeEach`, and cleans up in `afterEach`, both imported from `reforged-test/map` (and from `reforged-test/lua`). They are scoped by `describe` and fail as Vitest's do: `beforeEach` runs from the outer `describe` inwards and `afterEach` from the inner outwards, even after a failure; a failing `beforeEach` skips the test's body; a failing `afterEach` fails a test that had passed; the test reports its first error. A function a `beforeEach` returns runs after the `afterEach` hooks, and `startGame()` works in a `beforeEach`. There is no `beforeAll` or `afterAll`.

## 1.0.0-alpha.8

### Minor Changes

- [#998](https://github.com/phmilk/reforged-ts/pull/998) [`d370001`](https://github.com/phmilk/reforged-ts/commit/d3700011ea2a3b27bb17a790ec0741c580fd1bc3) Thanks [@wyller](https://github.com/wyller)! - A new entry point for a Map project's tests, `reforged-test/map`: `describe`, `it`, `expect` and `startGame()`. Each test of a file that loads it runs in a Test game of its own, a fresh Lua state in which the file is loaded again, so no test sees the units, the calls or the printed lines of another. `startGame()` runs the map's initialization through the Init stages and returns the test's `game`, whose `printed` and `displayed` hold what the map printed and showed on a player's screen. A file on `reforged-test/lua` alone runs as before, its tests sharing one Lua state.

## 1.0.0-alpha.7

### Minor Changes

- [#994](https://github.com/phmilk/reforged-ts/pull/994) [`8ce0689`](https://github.com/phmilk/reforged-ts/commit/8ce0689f551319c2bd51e0c2198fd04931ae1d4a) Thanks [@wyller](https://github.com/wyller)! - Ship the declarations of every `__stub_*` helper of the Shipped stubs, the stub authoring ones included, as `reforged-test/stubs`: add `"reforged-test/stubs"` to the `types` of a test's tsconfig, next to the Typings, and delete any declarations of the helpers you copied by hand. The firing context keeps its type name, `StubContext`.

- [#996](https://github.com/phmilk/reforged-ts/pull/996) [`3c1c5cb`](https://github.com/phmilk/reforged-ts/commit/3c1c5cb1515431b51b22dc09609d4160cc85120a) Thanks [@wyller](https://github.com/wyller)! - The `expect` of `reforged-test/lua` gains Vitest's `.not`, `toBeDefined`, `toContain`, `toContainEqual`, `toHaveLength`, `toMatchObject`, `toBeGreaterThan`, `toBeGreaterThanOrEqual`, `toBeLessThan`, `toBeLessThanOrEqual`, `toBeCloseTo`, `toBeInstanceOf` and `toMatch`, and the asymmetric matchers `expect.anything()`, `expect.any(kind)`, `expect.objectContaining()`, `expect.arrayContaining()` and `expect.stringContaining()` inside `toEqual`, `toMatchObject` and `toContainEqual`. Every text a matcher takes is plain text and means "contains"; `expect.any` takes a Lua type name or a class.

## 1.0.0-alpha.6

### Patch Changes

- [#818](https://github.com/phmilk/reforged-ts/pull/818) [`96f5dcf`](https://github.com/phmilk/reforged-ts/commit/96f5dcfc2b0f3d910f35f3c75d3e2ec4a2d13a71) Thanks [@wyller](https://github.com/wyller)! - `reforged-types` no longer ships the Typings of Game version 3.0.0: `reforged-types/3.0.0` and `reforged-types/3.0.0/common.ai` are gone, since the package's minimum Patch is 3.0.1.24370. The package now ships only the Game versions from its minimum Patch up, and no longer vendors Patch 3.0.0.24268. A Map project that lists `reforged-types/3.0.0` in `types` moves it to `reforged-types/3.0.1` (and `reforged-types/3.0.0/common.ai` to `reforged-types/3.0.1/common.ai`); the breaking changes of that move are in the changelog entry that added `3.0.1`. The supported Patch of `reforged-test` and `reforged-map` (`reforged.patch`) moves from 3.0.0.24268 to 3.0.1.24370, the Typings' minimum, and the `reforged-test` README names `reforged-types/3.0.1`.

## 1.0.0-alpha.5

### Minor Changes

- [#643](https://github.com/phmilk/reforged-ts/pull/643) [`f2644a6`](https://github.com/phmilk/reforged-ts/commit/f2644a6dea0120599dae7f2dfc5353b1d08675fa) Thanks [@reforged-ts-bot](https://github.com/apps/reforged-ts-bot)! - The trigger stubs answer `BlzGetEquippedItem` and `BlzGetUnequippedItem`, the event responses Patch 3.0.1.24370 added for the equipment events.

## 1.0.0-alpha.4

### Minor Changes

- [#302](https://github.com/phmilk/reforged-ts/pull/302) [`c055b24`](https://github.com/phmilk/reforged-ts/commit/c055b248b658b36f6ba11b8edc13ceb09ac60cfc) Thanks [@wyller](https://github.com/wyller)! - `Unit.skillPoints = n` sets the hero's unspent skill points to `n`, where it added `n` before; `Unit.modifySkillPoints` still adds. `Unit.addItemById` returns the item it created when the inventory has no room, the item then lying at the unit's feet, where it threw before: it calls `CreateItem` and `UnitAddItem` instead of `UnitAddItemById`, which returns nothing for that item, and still throws for a removed unit. The test harness stubs `GetUnitX`, `GetUnitY`, `UnitAddItem`, `UnitModifySkillPoints` and `GetHeroSkillPoints`.

## 1.0.0-alpha.3

### Minor Changes

- [#275](https://github.com/phmilk/reforged-ts/pull/275) [`c48d56a`](https://github.com/phmilk/reforged-ts/commit/c48d56a54a92c5bb4d06be7cecec9416f4adc928) Thanks [@wyller](https://github.com/wyller)! - The Trigger remove members take what the add members were given: `trigger.removeAction(fn)` removes the actions `trigger.addAction(fn)` added, and `trigger.removeCondition(fnOrBoolexpr)` the conditions `addCondition` added, destroying the `Condition` the Trigger made for a function (never a `boolexpr` you passed). `removeActions()`, `removeConditions()` and `destroy()` also destroy those `Condition`s, which used to leak. Every function condition now gets a `Condition` of its own, around a closure the Trigger makes with Dev mode on or off, so two adds of one function never share a handle, and a `Condition(fn)` of yours is never destroyed. A condition removed from inside its own evaluation has its `Condition` destroyed when that evaluation returns. A raw `triggeraction` or `triggercondition` still goes straight to the Native, and every remove member now returns the Trigger. The `BoolexprInput` type the condition members name is exported. The test harness stubs `DestroyCondition`; its `Condition` and `Filter` return the same handle for the same function until it is destroyed, as JASS caches one per code; and a stub handle's `tostring` now begins with its kind and a colon, as in the game.

## 1.0.0-alpha.2

### Minor Changes

- [#267](https://github.com/phmilk/reforged-ts/pull/267) [`6aee802`](https://github.com/phmilk/reforged-ts/commit/6aee802a12d2ad0f735ac168a324d0ae83e2ca75) Thanks [@phmilk](https://github.com/phmilk)! - Stubs for `BlzGroupAddGroupFast` and `BlzGroupRemoveGroupFast`, which change their second group as the game does, so a test can call `Group.addGroupFast` and `Group.removeGroupFast` on the harness.

## 1.0.0-alpha.1

### Minor Changes

- [#208](https://github.com/phmilk/reforged-ts/pull/208) [`f48fefd`](https://github.com/phmilk/reforged-ts/commit/f48fefdad0268131d273c64b5ccf2c07b5d1f56e) Thanks [@phmilk](https://github.com/phmilk)! - Stubs and constants for the 3.0.0 systems, so a test can call the equipment, destructable, colour, input, camera and pathing members on the harness and see the calls they made.

  - **Equipment converters** (`items.lua`): `ConvertEquipmentType`, `ConvertItemTag` and `ConvertLoadoutSlot` are recorded and return one cached sentinel per integer, as in the game. The named constants `EQUIPMENT_TYPE_*` (0 to 9), `ITEMTAG_TYPE_*` (0 to 8) and `EQUIPMENT_LOADOUT_SLOT_*` (0 to 8, `RINGALT` 5 included) are those sentinels, so `ConvertEquipmentType(1)` is `EQUIPMENT_TYPE_HEAD`. An integer with no named constant gets a distinct sentinel rendered as `ConvertEquipmentType(42)`, which is how a test builds an unknown value. The README explains the sentinel rule.
  - **Destructable constructors** (`destructables.lua`): all 32 creation Natives of the Patch, the 28 new ones being the dead, Z, pitch-roll, with-skin and with-colour families and their combinations. Each records one argument per parameter in the Native's order, and any extra argument after them, and returns a new destructable.
  - **Constant families**, opaque values rendered by name: `PLAYER_COLOR_*` (`PLAYER_COLOR_BLACK` included) and `RACE_PREF_*` (`RACE_PREF_FORSAKEN` included) in `players.lua`; `ITEM_TYPE_*` (`ITEM_TYPE_EQUIPMENT` included, `ITEM_TYPE_TOME` being `ITEM_TYPE_POWERUP`) in `items.lua`; `CAMERA_FIELD_*` in `cameras.lua`; `MOUSE_BUTTON_TYPE_*` in `triggers.lua`; `PATHING_TYPE_*` in `terrain.lua`, a new family. The baseline gains `__stub_constants(kind, names)`, which defines a family of constants in one call.

### Patch Changes

- [#209](https://github.com/phmilk/reforged-ts/pull/209) [`7aa0ede`](https://github.com/phmilk/reforged-ts/commit/7aa0edeb5ec49bb767985ef5d42abb709281c0ce) Thanks [@phmilk](https://github.com/phmilk)! - The README's "For AI agents" line links the documentation of this version as Markdown for a language model: `llms.txt`, one link per page, and `llms-full.txt`, every page in one file. A prerelease links the working tree's docs, `https://phmilk.github.io/reforged-ts/docs/next/llms.txt`; a stable release links the docs version of its library minor, `/docs/<major.minor>/llms.txt`.

## 1.0.0-alpha.0

### Major Changes

- [#159](https://github.com/phmilk/reforged-ts/pull/159) [`05eda1a`](https://github.com/phmilk/reforged-ts/commit/05eda1a99bce016ef10483143216260bd706e482) Thanks [@phmilk](https://github.com/phmilk)! - First release under this name, for Warcraft III 3.0.0 and later. `reforged-ts` is the fork of w3ts 3.0.2; `reforged-types`, `reforged-test` and `eslint-plugin-reforged` are new packages.

### Minor Changes

- [#145](https://github.com/phmilk/reforged-ts/pull/145) [`73ca570`](https://github.com/phmilk/reforged-ts/commit/73ca570f95953c1a6d3a2715ed5b847a27db0885) Thanks [@wyller](https://github.com/wyller)! - Test controls for the runtime Guards, so a test can run code as another client, read what reached the log and the screen, enter the globals Init stage, re-enter a damage handler, and check which function a Native was handed.

  - **`players.lua`**: `__stub_set_local_player(slot)` makes another slot the local player (slot 0 until then) and returns the slot it replaced; `__stub_local_player()` returns its handle without a call-log line.
  - **Output capture.** The baseline's `print` writes to a capture instead of the terminal; `__stub_printed()` returns the lines. **`display.lua`**, a new family: `DisplayTextToPlayer`, `DisplayTimedTextToPlayer` and `DisplayTimedTextFromPlayer` are recorded and keep what they showed to which player, returned by `__stub_displayed()`; `ClearTextMessages` is recorded.
  - **The globals Init stage.** `__stub_init_globals()` calls the global `InitGlobals`, defining it first by a plain assignment when nothing did, so the library's wrapper runs the stage.
  - **Nested damage dispatch.** `UnitDamageTarget` is recorded, returns true and dispatches the damage at once through `__stub_dispatch_damage(damage)`, which fires the triggers registered for a damaging and then a damaged event on the target (its unit, or its owner through a player-unit registration whose filter accepts it, with `GetFilterUnit`, now stubbed, answering the target) with the damage response Natives in the firing context. An action that deals damage dispatches again inside its own firing; past 32 nested dispatches the harness throws, instead of the client crashing as the game does.
  - **Call arguments.** `__stub_args(name)` returns the arguments of every recorded call of a Native by identity, so a test sees which function `TimerStart`, `TriggerAddAction`, `Condition` or `Filter` received.

- [#100](https://github.com/phmilk/reforged-ts/pull/100) [`f3043a4`](https://github.com/phmilk/reforged-ts/commit/f3043a4c6fd69509a824a6e6988c85d2147b00af) Thanks [@phmilk](https://github.com/phmilk)! - Slot-state and sync-event stubs, so a test can run a Map project's host scan and sync registration on the harness.

  - **`players.lua`** gains `GetPlayerSlotState` and `GetPlayerController`: slots 0 and 1 are playing users, every other slot is empty with no controller. This is state the stubs hold, named in the README, not a game rule.
  - **The baseline** gains the constants they answer with, `PLAYER_SLOT_STATE_EMPTY`, `PLAYER_SLOT_STATE_PLAYING`, `PLAYER_SLOT_STATE_LEFT`, `MAP_CONTROL_USER`, `MAP_CONTROL_COMPUTER`, `MAP_CONTROL_RESCUABLE`, `MAP_CONTROL_NEUTRAL`, `MAP_CONTROL_CREEP` and `MAP_CONTROL_NONE`, defined before any library module loads as opaque values compared by identity. `__stub_constant(kind, name)` builds one without taking a handle id, and `__stub_record` renders a constant by its name.
  - **`triggers.lua`** gains `BlzTriggerRegisterPlayerSyncEvent`, recorded with the trigger, the player, the prefix and the flag and returning an event handle. The trigger keeps nothing of it beyond the call-log line; sync events never fire on the harness.

- [#82](https://github.com/phmilk/reforged-ts/pull/82) [`f62784d`](https://github.com/phmilk/reforged-ts/commit/f62784de6aa1812a69155d9acf9e02f72101ca73) Thanks [@phmilk](https://github.com/phmilk)! - Stubs for every Native family the reforged-ts Wrappers create or look up through.

  - **New stub families**: `cameras`, `destructables`, `dialogs`, `effects`, `fogmodifiers`, `forces`, `frames`, `gamecaches`, `groups`, `images`, `items`, `leaderboards`, `locations`, `multiboards`, `quests`, `rects`, `regions`, `sounds`, `texttags`, `timerdialogs`, `ubersplats`, `weathereffects` and `widgets`, loaded with the shipped set; `units.lua` gains `BlzCreateUnitWithSkin`, `GetUnitLoc`, the rally getters and the inventory Natives. The README's table lists each file's Natives.
  - **`__stub_frame_not_found()`** returns the frame the game hands back when it finds none (handle id 0), for a test to return from a Native it overrides for one call.
  - **The stub authoring rule** now reads: a stub keeps only the state its Natives were given and hands it back through the Natives that read it; it never simulates game rules.

- [#132](https://github.com/phmilk/reforged-ts/pull/132) [`af9eade`](https://github.com/phmilk/reforged-ts/commit/af9eade51298d78853f33da6349a4d0d415fb6d9) Thanks [@phmilk](https://github.com/phmilk)! - Sync send and delivery, a settable clock and local player, the Preload family and ability icon stubs, so a test can watch what the sync, host and file Systems would do in the game: which packets a client sent, what the sync event delivers back, how long a client sat in the lobby, and what a file write was given.

  - **`sync.lua`**, a new family: `BlzSendSyncData` is recorded, keeps the packet with its prefix, its data and the local player that sent it, and returns true (a test that needs a network failure overrides it). `__stub_sync_packets()` returns the packets sent so far.
  - **`triggers.lua`**: `BlzTriggerRegisterPlayerSyncEvent` also remembers its trigger, player and prefix, a deliberate exception to the rule that a registration keeps nothing beyond its call-log line, because a delivery must find the triggers the game would fire. `__stub_deliver_sync(packet, options?)` fires every enabled trigger registered for the packet's prefix and sender, with `BlzGetTriggerSyncPrefix`, `BlzGetTriggerSyncData`, `GetTriggerPlayer` and `GetTriggeringTrigger` answering from the firing context; `{ cString = true }` cuts the data at its first zero byte, as the game cuts a C string. A packet the test builds simulates one from another library.
  - **The baseline**: `os.clock` answers what `__stub_set_clock(seconds)` set, 0.0 until then, and keeps it until the next set.
  - **`players.lua`**: `__stub_set_local_player(slot)` makes another slot the local player (slot 0 until then), and `__stub_local_player()` returns its handle without a call-log line.
  - **`preloads.lua`**, a new family: `PreloadGenClear`, `PreloadGenStart`, `Preload`, `PreloadGenEnd` and `Preloader` are recorded with their arguments; `__stub_preload_file(filename)` returns the strings the last write of that file was given. `Preloader` only records; a test that emulates a read overrides it.
  - **`abilities.lua`**, a new family: `BlzGetAbilityIcon` and `BlzSetAbilityIcon` keep an icon per ability id, with the game's placeholder icon for an id never set.

- [#111](https://github.com/phmilk/reforged-ts/pull/111) [`2d69302`](https://github.com/phmilk/reforged-ts/commit/2d6930269672240ba0389872feddd7225f0c56f5) Thanks [@phmilk](https://github.com/phmilk)! - Trigger registration recording, conditions, firing with a context, timer expiry and trackable stubs, so a test can observe what the game would observe of event code: which registration Native a trigger called with which arguments, which conditions and actions it was handed, and what a handler read when the trigger fired.

  - **`triggers.lua`** gains every `TriggerRegister*` Native of Patch 3.0.0.24268 (26, the `Blz` ones included), each recorded with the trigger and one argument per parameter (an omitted filter as `nil`) and returning a new `event` handle; the trigger keeps nothing of a registration. `Condition` and `Filter` are recorded and each call returns a new `conditionfunc` or `filterfunc` handle that remembers its function. `TriggerAddCondition` stores the condition and returns a `triggercondition` handle; `TriggerRemoveAction`, `TriggerRemoveCondition`, `TriggerClearActions` and `TriggerClearConditions` remove what they name; `TriggerEvaluate` runs the conditions and returns their conjunction; `TriggerExecute` and `TriggerExecuteWait` run the actions. `EnableTrigger`, `DisableTrigger`, `IsTriggerEnabled`, `TriggerWaitOnSleeps`, `IsTriggerWaitOnSleeps`, `GetTriggerEvalCount`, `GetTriggerExecCount` (0), `ResetTrigger` and `DestroyTrigger` are recorded.
  - **Firing with a context.** `__stub_fire_trigger(trigger, context?)` takes an optional table keyed by response Native name: for the length of the firing every response Native answers with the context's value for its name (nil when absent); every condition runs first, in added order, and the actions run only if every condition returned true. It returns whether the actions ran. Outside a firing every response Native answers nil. A disabled trigger does not fire, and firing a destroyed one is an error.
  - **The response Natives** every shipped event descriptor reads, one recorded stub each (units, damage, spells, orders, items, players, dialogs, frames, regions, the triggering trigger and event), and the event constants they take and answer with (`EVENT_PLAYER_UNIT_DEATH`, `EVENT_PLAYER_MOUSE_DOWN`, `FRAMEEVENT_CONTROL_CLICK`, `ATTACK_TYPE_HERO`, `OSKEY_A` and the rest of their kinds), rendered by name.
  - **`timers.lua`** gains `GetExpiredTimer`, which answers the fired timer inside the handler `__stub_fire_timer` runs and nil outside it, and `PauseTimer`, `ResumeTimer`, `TimerGetElapsed` and `TimerGetRemaining` (0.0: no time passes). `DestroyTimer` marks the timer, and firing a destroyed timer is an error.
  - **`units.lua`** gains `SetHeroLevel` and `GetHeroLevel`: a unit keeps the level it was given and hands it back, 0 before any, for the hero-level event's payload.
  - **`trackables.lua`**, a new family: `CreateTrackable`, returning a `trackable` handle, and `GetTriggeringTrackable`, answering from the firing context.
  - **The baseline** gains `__stub_response(name)`, which defines a response Native answering from the firing context, and `__stub_with_context(context, body)`, which runs `body` with a firing context and hands the previous one back afterwards, also on error.
