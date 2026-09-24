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

`stubs/base.lua` defines what the library reads when its modules load, before any test runs:

- the globals `bj_MAX_PLAYER_SLOTS` (28), `bj_MAX_PLAYERS` (24) and `bj_UNIT_FACING` (270.0);
- the Natives `Player`, `GetPlayerId`, `GetHandleId` and `CreateTrigger`;
- `FourCC`, a Lua helper of the game rather than a Native.

`main` and `config` stay nil, because the library's Hook code (`hooks/index.ts`) reads them before the game would define them. For the same reason the glue does not make undefined globals an error.

It also holds the shared machinery the other stub files use:

- `__stub_calls` is the call log, a list of strings.
- `__stub_record(name, ...)` appends one line, `Name(arg, arg)`, to the call log. Handles are rendered as `kind#id`, strings are quoted and functions are shown as `<function>`.
- `__stub_new_handle(kind)` returns a new handle. A handle is a table carrying `__kind` and `__handleId`. Ids are sequential from a fixed base, so the first handle of a state is `1048577`.
- `__stub_format(value)` renders one argument as `__stub_record` does.
- `__stub_player(number)` returns the player handle of a slot, the one `Player` returns, without a call-log line. Stubs that return a player use it.

### The shipped families

One file per Native family, loaded after `base.lua` by name:

| File                 | Natives                                                                                                                                 | Firing helper                                                                        |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `cameras.lua`        | `CreateCameraSetup`, `CameraSetupGetDestPositionLoc`, `GetCameraEyePositionLoc`, `GetCameraTargetPositionLoc` (a new location per call) |                                                                                      |
| `dialogs.lua`        | `DialogCreate`, `DialogAddButton`, `DialogAddQuitButton`                                                                                |                                                                                      |
| `effects.lua`        | `AddSpecialEffect`, `AddSpecialEffectTarget`, `AddSpellEffectById`, `AddSpellEffectTargetById`, `ConvertEffectType`                     |                                                                                      |
| `fogmodifiers.lua`   | `ConvertFogState`, `CreateFogModifierRadius`, `CreateFogModifierRect` (a new fog modifier per call)                                     |                                                                                      |
| `forces.lua`         | `CreateForce`, `ForceAddPlayer` (a force stores the players added to it)                                                                |                                                                                      |
| `frames.lua`         | `BlzCreateFrame*`, `BlzGetFrameByName` and the other lookups                                                                            | `__stub_frame_not_found()` returns the "not found" frame, whose handle id is 0.      |
| `gamecaches.lua`     | `InitGameCache`                                                                                                                         |                                                                                      |
| `images.lua`         | `CreateImage`                                                                                                                           |                                                                                      |
| `leaderboards.lua`   | `CreateLeaderboard`                                                                                                                     |                                                                                      |
| `locations.lua`      | `Location`                                                                                                                              |                                                                                      |
| `multiboards.lua`    | `CreateMultiboard`, `MultiboardGetItem` (a new item per call)                                                                           |                                                                                      |
| `players.lua`        | `GetLocalPlayer`, which returns the player in slot 0                                                                                    |                                                                                      |
| `quests.lua`         | `CreateQuest`, `QuestCreateItem`, `QuestItemSetDescription`                                                                             |                                                                                      |
| `rects.lua`          | `Rect`, `RectFromLoc`, `GetWorldBounds` (a new rect per call)                                                                           |                                                                                      |
| `regions.lua`        | `CreateRegion`                                                                                                                          |                                                                                      |
| `sounds.lua`         | `CreateSound`                                                                                                                           |                                                                                      |
| `texttags.lua`       | `CreateTextTag`                                                                                                                         |                                                                                      |
| `timerdialogs.lua`   | `CreateTimerDialog`                                                                                                                     |                                                                                      |
| `timers.lua`         | `CreateTimer`, `TimerStart`, `TimerGetTimeout`, `DestroyTimer`                                                                          | `__stub_fire_timer(timer)` runs the handler `TimerStart` stored, once.               |
| `triggers.lua`       | `TriggerAddAction`                                                                                                                      | `__stub_fire_trigger(trigger)` runs the trigger's actions once each, in added order. |
| `ubersplats.lua`     | `CreateUbersplat`                                                                                                                       |                                                                                      |
| `units.lua`          | `CreateUnit`, `GetOwningPlayer`, `GetUnitTypeId`                                                                                        |                                                                                      |
| `weathereffects.lua` | `AddWeatherEffect`                                                                                                                      |                                                                                      |

A timer or trigger never fires on its own: a test fires it with the helper. The helpers are not Natives, so they add no call-log line. A TypeScript test declares the ones it calls, for example `declare function __stub_fire_timer(whichTimer: timer): void;`.

### Stub authoring rules

- Stubs are plain Lua 5.3 and must run on stock Lua without `debug`, `require`, `package` beyond `preload`, `io`, `collectgarbage`, `os.getenv` or `load`. The game lacks the first six.
- Every stub appends one readable line to the global call log, `Name(arg, arg)`, with handles rendered as `kind#id`. Use `__stub_record`.
- Handles are tables carrying a kind and a sequential id from a fixed base, so ids are deterministic. Use `__stub_new_handle`.
- A stub that holds a callback exposes a manual firing helper (`__stub_fire_timer`, `__stub_fire_trigger`) instead of any scheduler.
- A stub never simulates game logic beyond storing what it was given.
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
