# reforged-test

Runs TypeScript tests for Warcraft III Reforged map code on real Lua 5.3, with the game's Natives stubbed in Lua, and reports every test to [vitest](https://vitest.dev/).

**Supported Patch: 3.0.0.24268.** The `reforged.patch` field of `package.json` carries the same Build.

The tests are compiled by [typescript-to-lua](https://typescripttolua.github.io/) exactly like map code, then run on Lua 5.3.6 compiled to WebAssembly ([lua-wasm-bindings](https://www.npmjs.com/package/lua-wasm-bindings), the VM typescript-to-lua's own suite uses). What a test observes is the Lua your code emits, the Native calls it makes and the objects it returns.

The package has three parts:

| Part       | Reached as          | What it is                                                                                                                             |
| ---------- | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| The runner | `reforged-test/lua` | `describe`, `it` and `expect` for the test files, compiled to Lua.                                                                     |
| The glue   | `reforged-test`     | The Node entry point a vitest file calls. It runs every compiled test file in a fresh Lua state and registers the results with vitest. |
| The stubs  | `stubs/*.lua`       | Plain Lua files that define the Natives and globals the code under test calls. The glue loads them by path.                            |

## Writing a test

A test file is TypeScript, named `*.test.ts`, and imports the runner from `reforged-test/lua`:

```ts
/** @noSelfInFile */
import { describe, expect, it, stubCalls } from "reforged-test/lua";
import { MapPlayer, Unit } from "../src/index";

describe("Unit", () => {
  it("passes the recorded arguments to CreateUnit", () => {
    const owner = MapPlayer.fromIndex(0)!;
    const unit = Unit.create(owner, FourCC("hfoo"), 10, 20, 270)!;
    expect(stubCalls()).toContainCall(
      "CreateUnit(player#1048577, 1751543663, 10, 20, 270)",
    );
    expect(unit.getOwner()).toBe(owner);
  });
});
```

The runner exports:

- `describe(name, body)`: groups the `it` blocks registered by `body`. Nesting is allowed.
- `it(name, fn)`: registers one test. Tests run after the file has loaded, in registration order. The tests of one file share its Lua state, and so its stub call log and handle ids.
- `expect(value)`, with these matchers:
  - `toEqual(expected)`: strict equality (`==`) on primitives, deep equality on tables. Metatables are ignored.
  - `toBe(expected)`: identity (`rawequal`), so two equal tables are not the same.
  - `toBeTruthy()` and `toBeFalsy()`: Lua truthiness, where only `nil` and `false` are falsy (`0` and `""` are truthy).
  - `toBeUndefined()`: the value is `nil`.
  - `toThrow(message?)`: the value is a function that throws when called. With `message`, the error's message contains it as plain text.
  - `toContainCall(call)`: the value is a call log that holds exactly this line.
- `stubCalls()`: the stub call log, one `Name(arg, arg)` line per Native call.
- `run()`: runs the registered tests and returns the JSON results. The glue calls it through the global `__reforged_test_run`, so a test file never calls it.

A failed expectation fails its test with a message such as `Expected {a = {1, 2}} to deeply equal {a = {1, 3}} (first difference at .a[2]: 2 vs 3)`. Any other error fails it with the Lua message, location included.

Compile the tests with a typescript-to-lua project of their own: `luaTarget` `5.3`, `moduleResolution` `bundler`, the language extensions and `lua-types/5.3` (or `reforged-types/3.0.0`) in `types`. typescript-to-lua copies the runner's Lua into the output folder under `lua_modules/reforged-test/lua/`.

## Running the tests with vitest

Add one vitest file that calls the glue with the output folder of that compile:

```ts
// test/lua.spec.ts
import { runLuaTests } from "reforged-test";

runLuaTests({
  outDir: "dist-test",
  stubs: ["test/stubs/units.lua"],
});
```

`runLuaTests(options)` registers one vitest `describe` per compiled test file, named after its TypeScript file (`handles/unit.test.ts`). Inside it, each `it` becomes one vitest `test`, and nested `describe`s are kept. A failed test shows the Lua message and no JavaScript stack.

The options are:

- `outDir`: the folder typescript-to-lua emitted the tests and the code they import to.
- `stubs`: extra stub files, executed after the shipped ones, in the order given.

Relative paths in both options resolve against the current working directory.

Each compiled test file runs in a fresh Lua state, in this order:

1. The standard libraries are opened.
2. The shipped stub files run: `base.lua` first, then the others by name.
3. The stub files listed in `stubs` run, in the order given.
4. Every `.lua` file under `outDir` is preloaded into `package.preload` under its module name.
5. The test module is required, which registers its tests.
6. The runner runs the tests and returns the results.

A fresh state costs a few milliseconds: about 9 ms with the whole reforged-ts library preloaded. lua-wasm-bindings loads once per process.

Other exports of the glue:

- `runLuaTestFiles(options)`: runs the same files and returns their results without registering anything with vitest. Each result carries the Lua `moduleName` (`handles.unit_test`), the `testFile` it was compiled from (`handles/unit.test.ts`), its `tests` and, when the module failed to load, its `error`.
- `compileLuaProject(tsconfigPath)`: compiles a typescript-to-lua project and returns its errors as text, or `""` when it compiled. A Map project's vitest global setup calls it to build the tests before they run. `typescript` and `typescript-to-lua` are peer dependencies for it.
- `MARKER_32_BIT`: the `[32-bit]` marker described under the integer width policy.
- `LOAD_TEST_NAME`: the name of the one failing test that stands for a file that failed to load, for example on a Native called at module load that no stub defines. The other files still run.
- The types `LuaTestOptions`, `LuaTestFile`, `LuaTestResult` and `LuaTestStatus`.

### Error messages

The glue rewrites the VM's `attempt to call a nil value (global 'X')` into `Native X is not stubbed`:

```text
LuaError: handles/unit_test.lua:12: Native SetUnitX is not stubbed
```

The fix is a stub for `X` in a stub file. Every error the VM raises is caught and reported with its Lua message only.

## The module naming contract

- typescript-to-lua replaces the dots in a file name with underscores, so `unit.test.ts` is emitted as `unit_test.lua`.
- The glue discovers test modules by the `_test.lua` suffix, anywhere under `outDir` except `lua_modules/`.
- It reports each module under its TypeScript name: `handles/unit_test.lua` is shown as `handles/unit.test.ts`.
- A module's name is its path relative to `outDir` without the extension, with separators turned into dots. That is the name typescript-to-lua emits in `require` (`handles.unit`).
- A file whose name ends in `_test.lua` is always treated as a test module, so keep that ending for test files.

## The results contract

The runner and the glue share nothing but this JSON string, returned by the global `__reforged_test_run`:

```json
{
  "tests": [
    {
      "message": "Expected 2 to equal 3",
      "name": "adds",
      "status": "fail",
      "suite": ["arithmetic"]
    }
  ]
}
```

- `suite` lists the enclosing `describe` names, outermost first.
- `status` is `pass`, `fail` (an expectation did not hold) or `error` (anything else was thrown).
- `message` is present on `fail` and `error`.

The runner writes it with its own encoder, with keys sorted, because the game's Lua has no JSON library. The glue rejects results of any other shape.

## Stubs

### The shipped baseline

`stubs/base.lua` defines the baseline every test can rely on, before any test runs:

- the globals `bj_MAX_PLAYER_SLOTS` (28), `bj_MAX_PLAYERS` (24) and `bj_UNIT_FACING` (270.0), which the library reads when its modules load;
- the slot-state constants `PLAYER_SLOT_STATE_EMPTY`, `PLAYER_SLOT_STATE_PLAYING` and `PLAYER_SLOT_STATE_LEFT`, and the controller constants `MAP_CONTROL_USER`, `MAP_CONTROL_COMPUTER`, `MAP_CONTROL_RESCUABLE`, `MAP_CONTROL_NEUTRAL`, `MAP_CONTROL_CREEP` and `MAP_CONTROL_NONE`: opaque values a test compares by identity (`toBe`), rendered by name in the call log;
- the Natives `Player`, `GetPlayerId`, `GetHandleId` and `CreateTrigger`: what the library's `globals` stage calls to fill `Players` and create the sync Trigger once a test runs `InitGlobals`, and what every Wrapper reads its ids with;
- `FourCC`, a Lua helper of the game rather than a Native.

The editor's entry points (`config`, `main`, `InitGlobals`, `InitCustomTriggers`, `RunInitializationTriggers`, `MarkGameStarted`) stay nil. The library wraps the ones that exist when it loads and captures the others on their first assignment, so it loads with none of them defined, and a test defines the ones it drives, in the load position it stands in for. The library makes no Handle-creating Native call when it loads: requiring it adds no `Player`, `CreateTrigger` or `CreateTimer` line to the call log. The glue does not make an undefined global an error either: which entry points exist is the test's decision.

It also holds the shared machinery the other stub files use:

- `__stub_calls` is the call log, a list of strings.
- `__stub_record(name, ...)` appends one line, `Name(arg, arg)`, to the call log. Handles are rendered as `kind#id`, constants by their name, strings are quoted and functions are shown as `<function>`.
- `__stub_new_handle(kind)` returns a new handle. A handle is a table carrying `__kind` and `__handleId`. Ids are sequential from a fixed base, so the first handle of a state is `1048577`.
- `__stub_constant(kind, name)` returns a constant of the game: a table carrying `__kind` and `__name` and no handle id, so defining one leaves the handle sequence alone.
- `__stub_format(value)` renders one argument as `__stub_record` does.
- `__stub_player(number)` returns the player handle of a slot, the one `Player` returns, without a call-log line. Stubs that return a player use it.
- `__stub_response(name)` defines the event response Native `name` (`GetTriggerUnit`, `GetExpiredTimer`): it records its call and answers with the firing context's value for its name, nil when the context has none or outside a firing. A Map project's stub file uses it for a response Native the shipped families leave out.
- `__stub_with_context(context, body)` runs `body` with `context` as the firing context and returns what `body` returned. The previous context comes back afterwards, also when `body` throws, so a firing inside a firing hands the outer context back when it ends. The firing helpers use it.

The baseline also replaces the standard library's `os.clock` with a clock the test sets: it answers 0.0 until `__stub_set_clock(seconds)` sets a value, keeps that value until the next set, and `__stub_set_clock` returns the value it replaced. The game's `os.clock` is a local, async value (it differs between clients), so a test controls lobby and start times exactly. `os.clock` is not a Native: reading it adds no call-log line.

### The shipped families

One file per Native family, loaded after `base.lua` by name:

| File                 | Natives                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Firing helper                                                                                                                                                                                                                                    |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `abilities.lua`      | `BlzGetAbilityIcon` and `BlzSetAbilityIcon`: an ability id keeps the icon it was set to, and one never set answers the game's placeholder icon, `ReplaceableTextures\CommandButtons\BTNTemp.blp`                                                                                                                                                                                                                                                                                                                                                 |                                                                                                                                                                                                                                                  |
| `cameras.lua`        | `CreateCameraSetup`, `CameraSetupGetDestPositionLoc`, `GetCameraEyePositionLoc`, `GetCameraTargetPositionLoc` (a new location per call)                                                                                                                                                                                                                                                                                                                                                                                                          |                                                                                                                                                                                                                                                  |
| `destructables.lua`  | `CreateDestructable`, `CreateDestructableZ`, `BlzCreateDestructableWithSkin`, `BlzCreateDestructableZWithSkin`                                                                                                                                                                                                                                                                                                                                                                                                                                   |                                                                                                                                                                                                                                                  |
| `dialogs.lua`        | `DialogCreate`, `DialogAddButton`, `DialogAddQuitButton`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |                                                                                                                                                                                                                                                  |
| `effects.lua`        | `AddSpecialEffect`, `AddSpecialEffectTarget`, `AddSpellEffectById`, `AddSpellEffectTargetById`, `ConvertEffectType`                                                                                                                                                                                                                                                                                                                                                                                                                              |                                                                                                                                                                                                                                                  |
| `fogmodifiers.lua`   | `ConvertFogState`, `CreateFogModifierRadius`, `CreateFogModifierRect` (a new fog modifier per call)                                                                                                                                                                                                                                                                                                                                                                                                                                              |                                                                                                                                                                                                                                                  |
| `forces.lua`         | `CreateForce`, `ForceAddPlayer` (a force stores the players added to it)                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |                                                                                                                                                                                                                                                  |
| `frames.lua`         | `BlzCreateFrame*`, `BlzGetFrameByName` and the other lookups                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | `__stub_frame_not_found()` returns the "not found" frame, whose handle id is 0.                                                                                                                                                                  |
| `gamecaches.lua`     | `InitGameCache`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |                                                                                                                                                                                                                                                  |
| `groups.lua`         | `CreateGroup`, `GroupAddUnit`, `BlzGroupGetSize`, `FirstOfGroup`, `BlzGroupUnitAt`, `ForGroup` (runs the callback at once, per unit), `GetEnumUnit`                                                                                                                                                                                                                                                                                                                                                                                              |                                                                                                                                                                                                                                                  |
| `images.lua`         | `CreateImage`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |                                                                                                                                                                                                                                                  |
| `items.lua`          | `CreateItem`, `BlzCreateItemWithSkin`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |                                                                                                                                                                                                                                                  |
| `leaderboards.lua`   | `CreateLeaderboard`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |                                                                                                                                                                                                                                                  |
| `locations.lua`      | `Location`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |                                                                                                                                                                                                                                                  |
| `multiboards.lua`    | `CreateMultiboard`, `MultiboardGetItem` (a new item per call)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |                                                                                                                                                                                                                                                  |
| `players.lua`        | `GetLocalPlayer`, which returns the player in slot 0 until a test sets another; `GetPlayerSlotState` and `GetPlayerController`, which report slots 0 and 1 as playing users (`PLAYER_SLOT_STATE_PLAYING`, `MAP_CONTROL_USER`) and every other slot as empty with no controller (`PLAYER_SLOT_STATE_EMPTY`, `MAP_CONTROL_NONE`)                                                                                                                                                                                                                   | `__stub_set_local_player(slot)` makes the player in `slot` the local player and returns the slot it replaced; `__stub_local_player()` returns the local player's handle without a call-log line.                                                 |
| `preloads.lua`       | `PreloadGenClear`, `PreloadGenStart`, `Preload`, `PreloadGenEnd` and `Preloader`, each recorded with its argument. `PreloadGenEnd` keeps the strings `Preload` was given since the last `PreloadGenClear` under the file's name; `Preloader` only records                                                                                                                                                                                                                                                                                        | `__stub_preload_file(filename)` returns the strings the last `PreloadGenEnd` of `filename` wrote, in order, or nil for a file never written.                                                                                                     |
| `quests.lua`         | `CreateQuest`, `QuestCreateItem`, `QuestItemSetDescription`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |                                                                                                                                                                                                                                                  |
| `rects.lua`          | `Rect`, `RectFromLoc`, `GetWorldBounds` (a new rect per call)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |                                                                                                                                                                                                                                                  |
| `regions.lua`        | `CreateRegion`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |                                                                                                                                                                                                                                                  |
| `sounds.lua`         | `CreateSound`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |                                                                                                                                                                                                                                                  |
| `sync.lua`           | `BlzSendSyncData`, recorded; it keeps the packet (its prefix, its data and the local player that sent it) and returns true                                                                                                                                                                                                                                                                                                                                                                                                                       | `__stub_sync_packets()` returns the packets sent so far, oldest first. `__stub_deliver_sync(packet, options?)` (in `triggers.lua`) delivers one (below).                                                                                         |
| `texttags.lua`       | `CreateTextTag`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |                                                                                                                                                                                                                                                  |
| `timerdialogs.lua`   | `CreateTimerDialog`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |                                                                                                                                                                                                                                                  |
| `timers.lua`         | `CreateTimer`, `TimerStart`, `TimerGetTimeout`, `TimerGetElapsed` and `TimerGetRemaining` (0.0: no time passes), `PauseTimer`, `ResumeTimer`, `DestroyTimer`; `GetExpiredTimer`, answering from the firing context                                                                                                                                                                                                                                                                                                                               | `__stub_fire_timer(timer)` runs the handler `TimerStart` stored, once, with the timer as `GetExpiredTimer`'s answer.                                                                                                                             |
| `trackables.lua`     | `CreateTrackable`; `GetTriggeringTrackable`, answering from the firing context                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |                                                                                                                                                                                                                                                  |
| `triggers.lua`       | Every `TriggerRegister*` Native of the Patch (below); `TriggerAddAction`, `TriggerRemoveAction`, `TriggerClearActions`; `Condition` and `Filter`; `TriggerAddCondition`, `TriggerRemoveCondition`, `TriggerClearConditions`; `TriggerEvaluate`, `TriggerExecute`, `TriggerExecuteWait`; `EnableTrigger`, `DisableTrigger`, `IsTriggerEnabled`, `TriggerWaitOnSleeps`, `IsTriggerWaitOnSleeps`, `GetTriggerEvalCount` and `GetTriggerExecCount` (0), `ResetTrigger`, `DestroyTrigger`; the event response Natives and the event constants (below) | `__stub_fire_trigger(trigger, context?)` runs the conditions, then the actions if every condition returned true, with `context` as the firing context. `__stub_deliver_sync(packet, options?)` fires the sync registrations of a packet (below). |
| `ubersplats.lua`     | `CreateUbersplat`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |                                                                                                                                                                                                                                                  |
| `units.lua`          | `CreateUnit`, `BlzCreateUnitWithSkin`, `GetOwningPlayer`, `GetUnitTypeId`, `GetUnitLoc` (a new location per call), `GetUnitRally*` (nil), `UnitAddItemById`, `UnitItemInSlot`, `UnitRemoveItemFromSlot`, `SetHeroLevel`, `GetHeroLevel` (0 before any level is set)                                                                                                                                                                                                                                                                              |                                                                                                                                                                                                                                                  |
| `weathereffects.lua` | `AddWeatherEffect`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |                                                                                                                                                                                                                                                  |
| `widgets.lua`        | `GetWidgetX`, `GetWidgetY`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |                                                                                                                                                                                                                                                  |

A timer or trigger never fires on its own, and a sent sync packet reaches no one: a test fires or delivers it with the helper. The helpers are not Natives, so they add no call-log line. A TypeScript test declares the ones it calls, for example `declare function __stub_fire_timer(whichTimer: timer): void;`.

### Triggers, conditions and the firing context

**Registrations.** The triggers family defines all 26 `TriggerRegister*` Natives of the Patch, the `Blz` ones included: `TriggerRegisterVariableEvent`, `TriggerRegisterTimerEvent`, `TriggerRegisterTimerExpireEvent`, `TriggerRegisterGameStateEvent`, `TriggerRegisterDialogEvent`, `TriggerRegisterDialogButtonEvent`, `TriggerRegisterGameEvent`, `TriggerRegisterEnterRegion`, `TriggerRegisterLeaveRegion`, `TriggerRegisterTrackableHitEvent`, `TriggerRegisterTrackableTrackEvent`, `TriggerRegisterCommandEvent`, `TriggerRegisterUpgradeCommandEvent`, `TriggerRegisterPlayerEvent`, `TriggerRegisterPlayerUnitEvent`, `TriggerRegisterPlayerAllianceChange`, `TriggerRegisterPlayerStateEvent`, `TriggerRegisterPlayerChatEvent`, `TriggerRegisterDeathEvent`, `TriggerRegisterUnitStateEvent`, `TriggerRegisterUnitEvent`, `TriggerRegisterFilterUnitEvent`, `TriggerRegisterUnitInRange`, `BlzTriggerRegisterFrameEvent`, `BlzTriggerRegisterPlayerSyncEvent` and `BlzTriggerRegisterPlayerKeyEvent`. Each records the trigger and one argument per parameter of the Native, so an omitted filter shows as `nil`, and returns a new `event` handle:

```text
TriggerRegisterPlayerUnitEvent(trigger#1048578, player#1048577, EVENT_PLAYER_UNIT_DEATH, filterfunc#1048579)
TriggerRegisterEnterRegion(trigger#1048578, region#1048581, nil)
```

The trigger keeps nothing of a registration beyond that line: no stub decides which event fires, the test does, by firing the trigger. The one exception is `BlzTriggerRegisterPlayerSyncEvent`, which also remembers its trigger, player and prefix, because a delivery must find the triggers the game would fire for a packet (below).

**The event constants.** The constants these Natives take and the response Natives answer with are defined, in the order the Typings declare them, as opaque values rendered by name: every `playerunitevent`, `unitevent`, `playerevent`, `gameevent`, `widgetevent`, `dialogevent` and `frameeventtype` (`EVENT_PLAYER_UNIT_DEATH`, `EVENT_UNIT_EQUIP_ITEM`, `EVENT_PLAYER_MOUSE_DOWN`, `FRAMEEVENT_CONTROL_CLICK`), the `limitop`s, the game, player and unit states, the `alliancetype`s, and the `attacktype`, `damagetype`, `weapontype` and `oskeytype` values. A test compares them by identity.

**Conditions.** `Condition(func)` and `Filter(func)` are recorded and each call returns a new handle, of kind `conditionfunc` or `filterfunc`, that remembers `func`: a test sees whether the code under test wrapped a plain function, and with which factory. `TriggerAddCondition` stores the condition on the trigger and returns a `triggercondition` handle; `TriggerAddAction` stores the action and returns a `triggeraction` handle. `TriggerRemoveCondition` and `TriggerRemoveAction` remove the one with that handle, `TriggerClearConditions` and `TriggerClearActions` remove them all. `TriggerEvaluate` runs every condition and returns their conjunction; `TriggerExecute` and `TriggerExecuteWait` run the actions without the conditions. Both run at once, in the current firing context.

**Trigger state.** `DisableTrigger` and `EnableTrigger` set what `IsTriggerEnabled` answers (enabled until disabled), `TriggerWaitOnSleeps` what `IsTriggerWaitOnSleeps` answers (false until set). The stubs count nothing: `GetTriggerEvalCount` and `GetTriggerExecCount` answer 0 and `ResetTrigger` only records. `DestroyTrigger` and `DestroyTimer` are recorded and mark the handle destroyed.

**Firing a trigger.** `__stub_fire_trigger(trigger, context)` fires the trigger as one event would. `context` is an optional table keyed by response Native name: for the length of the firing, every response Native answers with the context's value for its name, and nil for a name the context leaves out. Every condition runs first, in added order, even after one returned false; the actions run, in added order, only if every condition returned true. It returns whether the actions ran. A disabled trigger does not fire (it returns false), and firing a destroyed trigger is an error. Outside a firing, every response Native answers nil.

```ts
declare function __stub_fire_trigger(
  whichTrigger: trigger,
  context?: { [native: string]: unknown },
): boolean;

const ran = __stub_fire_trigger(trigger.handle, {
  GetTriggerUnit: dying.handle,
  GetKillingUnit: killer.handle,
});
```

A firing inside a firing (an action that fires another trigger) has its own context, and the outer one is back when it ends. Actions or conditions added or removed while the trigger runs take effect at its next firing.

**Delivering a sync packet.** `__stub_deliver_sync(packet, options)` delivers a packet as the game would: it fires every trigger registered with `BlzTriggerRegisterPlayerSyncEvent` for the packet's prefix and sender, once per registration and in registration order, with the context `{ BlzGetTriggerSyncPrefix = prefix, BlzGetTriggerSyncData = data, GetTriggerPlayer = from, GetTriggeringTrigger = trigger }`. A disabled or destroyed trigger is skipped. `packet` is a table `{ prefix, data, from }`: one `__stub_sync_packets()` recorded, or one the test builds, which is how a packet from another library or a corrupted one is simulated. Packets are delivered in whatever order the test chooses, each as often as it chooses. With `{ cString = true }` as `options`, the data is cut at its first zero byte, as the game cuts a C string. It returns how many triggers ran their actions.

```ts
BlzSendSyncData("P", "payload"); // recorded, from the local player
const [packet] = __stub_sync_packets();
__stub_deliver_sync(packet, { cString: true });
```

`BlzSendSyncData` returns true; a test that needs a network failure overrides it to return false for the length of that test.

**Firing a timer.** `__stub_fire_timer(timer)` runs the handler `TimerStart` stored with the context `{ GetExpiredTimer = timer }`, so `GetExpiredTimer` answers the fired timer inside the handler and nil after. Firing a timer that was never started, or was destroyed, is an error.

**The response Natives**, each recorded and answering from the context:

| Of                       | Natives                                                                                                                                                                                                                                                                                 |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| the trigger and event    | `GetTriggeringTrigger`, `GetTriggerEventId`, `GetTriggerWidget`, `GetTriggerDestructable`, `GetExpiredTimer` (timers), `GetTriggeringTrackable` (trackables)                                                                                                                            |
| units: death, attack     | `GetTriggerUnit`, `GetKillingUnit`, `GetAttacker`                                                                                                                                                                                                                                       |
| damage                   | `GetEventDamageSource`, `BlzGetEventDamageTarget`, `GetEventDamage`, `BlzGetEventAttackType`, `BlzGetEventDamageType`, `BlzGetEventWeaponType`, `BlzGetEventIsAttack`                                                                                                                   |
| spells                   | `GetSpellAbilityUnit`, `GetSpellAbilityId`, `GetSpellTargetUnit`, `GetSpellTargetItem`, `GetSpellTargetDestructable`, `GetSpellTargetX`, `GetSpellTargetY`                                                                                                                              |
| orders                   | `GetOrderedUnit`, `GetIssuedOrderId`, `GetOrderPointX`, `GetOrderPointY`, `GetOrderTargetUnit`, `GetOrderTarget`                                                                                                                                                                        |
| items                    | `GetManipulatedItem`, `GetEquippedItem`, `GetUnequippedItem`, `GetSoldItem`                                                                                                                                                                                                             |
| other unit events        | `GetTrainedUnit`, `GetConstructedStructure`, `GetResearched`, `GetLevelingUnit`, `GetLearnedSkill`, `GetChangingUnit`, `GetChangingUnitPrevOwner`, `GetSummoningUnit`, `GetSummonedUnit`, `GetTransportUnit`, `GetLoadedUnit`                                                           |
| players                  | `GetTriggerPlayer`, `GetEventPlayerChatString`, `GetEventPlayerChatStringMatched`, `BlzGetTriggerPlayerKey`, `BlzGetTriggerPlayerMetaKey`, `BlzGetTriggerPlayerIsKeyDown`, `BlzGetTriggerPlayerMouseX`, `BlzGetTriggerPlayerMouseY`, `BlzGetTriggerSyncPrefix`, `BlzGetTriggerSyncData` |
| dialogs, frames, regions | `GetClickedDialog`, `GetClickedButton`, `BlzGetTriggerFrame`, `BlzGetTriggerFrameEvent`, `BlzGetTriggerFrameValue`, `BlzGetTriggerFrameText`, `GetTriggeringRegion`, `GetEnteringUnit`, `GetLeavingUnit`                                                                                |

The two playing slots are state the stubs hold, not a game rule: a test relies on slots 0 and 1 being playing users and on slot 2 (or any later slot) being empty, and overrides the two Natives for the length of a test when it needs another lobby.

### Stub authoring rules

- Stubs are plain Lua 5.3 and must run on stock Lua without `debug`, `require`, `package` beyond `preload`, `io`, `collectgarbage`, `os.getenv` or `load`. The game lacks the first six.
- Every stub appends one readable line to the global call log, `Name(arg, arg)`, with handles rendered as `kind#id`. Use `__stub_record`.
- Handles are tables carrying a kind and a sequential id from a fixed base, so ids are deterministic. Use `__stub_new_handle`.
- A stub that holds a callback exposes a manual firing helper (`__stub_fire_timer`, `__stub_fire_trigger`) instead of any scheduler.
- A stub keeps only the state its Natives were given and hands it back through the Natives that read it: enumerating a stored group (`ForGroup`), reading a stored inventory slot, a frame's parent or child, a frame by the name it was created under. What no Native reads back in the game (a sent sync packet, the strings a file was written with) is handed to the test through a helper (`__stub_sync_packets`, `__stub_preload_file`). It never simulates game rules: no inventory size or first-free-slot rule, no order, no event, no frame layout.
- There is one stub file per Native family: players, timers, triggers, units, frames, as they are needed. The glue loads the shipped set, then the extra stub files a Map project lists in the `stubs` option.

## Integer width policy

The VM has 64-bit integers and the game has 32-bit integers. Tests must not depend on integer width:

- no overflow;
- no bit operations above 31 bits;
- no `math.maxinteger`.

A test that needs 32-bit semantics carries `[32-bit]` in its name, or in the name of an enclosing `describe`. The glue skips it until a 32-bit run is added; the first such test decides that addition.

```ts
it("wraps around at 2^31 [32-bit]", () => {
  // ...
});
```

## License

MIT. See [LICENSE](./LICENSE).
