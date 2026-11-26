# How test libraries phrase a test, and what typescript-to-lua compiles of it

How the most used test libraries and the test frameworks of comparable game platforms phrase a test, and which of those phrasings typescript-to-lua compiles to Lua that runs on Lua 5.3 without `debug`, researched for [#932](https://github.com/phmilk/reforged-ts/issues/932) of the map [#931](https://github.com/phmilk/reforged-ts/issues/931) (a readable test API for Map projects). Each claim is marked **Run** (compiled with typescript-to-lua and run on the Lua VM of the harness, under "How the typescript-to-lua claims were checked"), **Read** (read in the source the claim links, not run) or **Inferred** (follows from the two, not measured).

## TL;DR

- **Every surveyed framework splits a test in the same four parts**: an action named after what happens (`user.click`, `Press(gamepad.buttonSouth)`, `test.spawn`, `pullLever`), a clock the test moves by hand (`advanceTimersByTime`, `test.idle(ticks)`, `yield return null`), a fresh world per test or per file, and assertions on what the user of the software observes (Read).
- **`expect(x).not.toBe(y)` compiles and runs** (Run): typescript-to-lua writes a property named after a Lua reserved word as `["not"]`. Jest-Lua and TestEZ say `never` because they are written in Lua by hand, where `x.not` is a syntax error (Read); a TypeScript API has no such reason.
- **A getter works in a class, not in an object literal** (Run): `get not()` in an object literal is the compile error `TS100025`. A lazy `not` through a metatable `__index` works too. An eager `not` field is the cheapest and the plainest; the three cost between 1 and 6 microseconds per expectation.
- **Asymmetric matchers work as marked tables** (Run), with one deviation Jest-Lua also made: `expect.any(Number)` cannot exist, since `Number`, `String`, `Boolean`, `Function`, `Object` and `Array` compile to `nil` as values, with no diagnostic. Take a type name (`"number"`) or a class.
- **A spy can be a callable table, but a callable table is not a function** (Run): `pcall` and a plain call accept it; `type` says `"table"`, `coroutine.create` refuses it, and the library's `typeof x === "function"` branches (`Trigger.addCondition`, `filterOf`, `wrapGlobal`) take it for a boolexpr or skip it. Jest-Lua's `jest.fn()` returns a forwarding function beside the table for this reason (Read).
- **`toHaveBeenCalledWith` types from `Parameters<typeof Native>`** (Run, type level): a wrong argument type, a missing argument and a misspelt Native name are compile errors.
- **A rest parameter loses trailing `nil` arguments unless it is counted first** (Run): `(...args) => { calls.push(args) }` cannot tell `f(1, 2)` from `f(1, 2, nil)`. `select("#", ...args)` as the first statement can.
- **Replacing a module's export does not reach the modules that already imported it by name** (Run); replacing a global does. A Native is a global, so a spy over a Native works where a spy over a library function does not.

## How a test is phrased

One row per framework and question. The sources follow the table, one subsection per framework.

| Framework                                | Makes an event happen                                                                                            | Advances time                                                                                                                  | Isolates                                                                                                           | Asserts on                                                                                                               |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| Vitest, Jest                             | Calls the code under test; replaces collaborators with `vi.fn()` and `vi.spyOn(object, key)`                     | `vi.useFakeTimers()`, then `advanceTimersByTime(ms)`, `advanceTimersToNextTimer()`, `runAllTimers()`, `runOnlyPendingTimers()` | One environment per test file; inside a file, `beforeEach`/`afterEach` and `restoreMocks`, off by default          | Values (`toBe`, `toEqual`, `toContain`), calls of a spy (`toHaveBeenCalledWith`), negated by `.not`                      |
| Testing Library                          | `userEvent`: a whole interaction (`user.click`, `user.type`); `fireEvent` for one DOM event, as the escape hatch | Not its concern (the test runner's fake timers)                                                                                | The test runner's                                                                                                  | What the user perceives: role, label, text; a test id last                                                               |
| Jest-Lua (Roblox)                        | As Jest; `jest.fn()` returns a callable table and a function                                                     | As Jest, over Roblox's timers (`delay`, `task.delay`, `task.wait`, `os.clock`, …), in steps of an engine frame time            | As Jest (`resetModules`, `isolateModules`); only a whitelist of globals can be mocked                              | As Jest, with `.never` for `.not` and `expect.any("number")`                                                             |
| TestEZ (Roblox)                          | Calls the code under test; no spies                                                                              | Nothing                                                                                                                        | `beforeEach`/`afterEach` hooks                                                                                     | Values, in a chain: `expect(x).to.equal(y)`, `expect(x).never.to.be.ok()`                                                |
| busted (Lua)                             | Calls the code under test; `spy.on(t, "name")`, `stub(t, "name")`, `mock(t)`                                     | Nothing (`async()` and `done()` only)                                                                                          | `insulate` blocks save and restore `_G` and `package.loaded`; `before_each`/`after_each`; `spy:revert()`           | Values and calls, in a chain: `assert.are.equal`, `assert.spy(s).was.called_with(1, match.is_string())`                  |
| Minecraft GameTest (Bedrock, Java)       | Verbs of the world: `test.spawn`, `pressButton`, `pullLever`, `pulseRedstone`; a simulated player that attacks   | Real ticks: `await test.idle(ticks)`, `runAfterDelay`, `succeedWhen` polled every tick, under a `maxTicks` timeout             | One structure per test, coordinates relative to it; the environment is torn down after the test                    | The world's state: `assertEntityPresent`, `assertRedstonePower`, `assertEntityState`                                     |
| Unity Test Framework, Input System tests | `Press(gamepad.buttonSouth)`, `Set(gamepad.leftStick, value)` on a device the test added                         | Real frames (`yield return null`, `WaitForSeconds`, `WaitForFixedUpdate`), or the fixture's clock (`runtime.currentTime`)      | `InputTestFixture`: a blank Input System per test, the previous state restored after; NUnit `[SetUp]`/`[TearDown]` | Values (`Assert.That(x, Is.EqualTo(2))`); any unexpected error log fails the test unless `LogAssert.Expect` announced it |

### Vitest and Jest

- **`expect` and `.not`** (Read): "`expect` is used to create assertions", "Using `not` will negate the assertion". `toBe` is for "primitives are equal or that objects share the same reference", `toEqual` for "equal to received one or has the same structure". Source: <https://vitest.dev/api/expect.html>.
- **Asymmetric matchers** (Read): `expect.anything()` "matches anything except `null` or `undefined`"; `expect.any(constructor)` is true "only if the value is an instance of a specified constructor"; `expect.objectContaining` "if the value has a similar shape"; `expect.not.objectContaining` negates it. Each is a value that stands inside the expected side of `toEqual` or `toHaveBeenCalledWith`. Source: <https://vitest.dev/api/expect.html>.
- **Spies** (Read): `vi.fn(fn?)` "Creates a spy on a function, but can also be initiated without one", and returns `undefined` when called without one. `vi.spyOn<T, K extends keyof T>(object: T, key: K): Mock<T[K]>` "Creates a spy on a method or getter/setter of an object": the spy is typed after the member it replaces, and it replaces a member of an object, never a local binding. `vi.stubGlobal(name, value)` replaces a global and `vi.unstubAllGlobals()` restores it. Source: <https://vitest.dev/api/vi.html>.
- **Call assertions** (Read): `toHaveBeenCalledWith` "checks if a function was called at least once with certain parameters", `toHaveBeenCalledTimes` "a certain amount of times", `toHaveBeenLastCalledWith` "at its last invocation". Source: <https://vitest.dev/api/expect.html>.
- **Fake timers** (Read): the reason is "instead of having our tests wait it out or timeout", "we can speed up our tests by using "fake" timers" (<https://vitest.dev/guide/mocking/timers>). `vi.useFakeTimers()` must be called first. `advanceTimersByTime(ms)` "will invoke every initiated timer until the specified number of milliseconds is passed or the queue is empty"; `advanceTimersToNextTimer()` "Will call next available timer. Useful to make assertions between each timer call"; `runAllTimers()` runs "until the timer queue is empty" and "If you have an infinite interval, it will throw after 10 000 tries"; `runOnlyPendingTimers()` "will not fire any timer that was initiated during its call". Source: <https://vitest.dev/api/vi.html>.
- **Why two "run" verbs** (Read): Jest names the trap: "a recursive timer – that is a timer that sets a new timer in its own callback. For these, running all the timers would be an endless loop, throwing the following error: "Aborting after running 100000 timers, assuming an infinite loop!"". A repeating Timer, as the Template starts every 60 seconds, is that case: only `advanceTimersByTime` and `runOnlyPendingTimers` are safe on it. Source: <https://jestjs.io/docs/timer-mocks>.
- **Isolation** (Read): "By default Vitest runs every test file in an isolated environment" (<https://vitest.dev/guide/improving-performance.html>). Inside a file nothing is reset unless the test asks: `restoreMocks`, "Should Vitest automatically call vi.restoreAllMocks() before each test", defaults to `false` (<https://vitest.dev/config/restoremocks>). `clearAllMocks` clears the call history, `resetAllMocks` also resets implementations, `restoreAllMocks` puts back what `spyOn` replaced: three verbs for three depths (<https://vitest.dev/api/vi.html>).

The harness already stands where Vitest stands on isolation: one Lua state per compiled test file, the `it`s of a file sharing it (`packages/reforged-test/README.md`, "Writing a test").

### Testing Library

- **The principle** (Read): "The more your tests resemble the way your software is used, the more confidence they can give you." Source: <https://testing-library.com/docs/guiding-principles>.
- **`fireEvent` against `userEvent`** (Read): "`fireEvent` dispatches DOM events, whereas `user-event` simulates full interactions". `fireEvent` is a thin wrapper over `dispatchEvent`, while one action of a user is several events. `user-event` "adds visibility and interactability checks along the way" and "factors in that the browser e.g. wouldn't let a user click a hidden element or type in a disabled text box". Source: <https://testing-library.com/docs/user-event/intro>.
- **`fireEvent` stays, as the escape hatch** (Read): for an interaction `user-event` does not cover, "you can use `fireEvent` to dispatch the concrete events that your software relies on", at the price that the test then depends on its own assumptions about the concrete events. Source: <https://testing-library.com/docs/user-event/intro>.
- **Queries have a priority** (Read): "your test should resemble how users interact with your code"; queries by role, label and text come first, and `getByTestId` last, because "The user cannot see (or hear) these". Source: <https://testing-library.com/docs/queries/about>.

The mapping to a Map project (Inferred): `__stub_fire_trigger(trigger, { GetTriggerUnit: … })` is `fireEvent`, one concrete event with a context the test invents; `game.kill(footman)` is `userEvent`, an action that fires what the game would fire (the death event of that unit, with the responses the game would give) and refuses what the game would refuse (killing a unit already dead or removed). What the player perceives is the text on screen, the units and their state; the call log of Natives is the test id.

### Jest-Lua (Roblox)

Jest ported to Luau by hand. Its deviations page is the list of what a Lua port of Jest could not keep. Source for every line below unless another is given: <https://jsdotlua.github.io/jest-lua/deviations>.

- **`.never` for `.not`** (Read): "Since `not` is a reserved keyword in Lua, Jest Lua uses `never` to test the opposite of a matcher." The reason is Lua's syntax for whoever writes the test in Lua.
- **`jest.fn()` returns two values** (Read): "The first return value is the mock object, which is a callable table"; "For cases where the tested code requires a function, pass in the second return value of `jest.fn()`", a function that forwards to the table.
- **`expect.any` takes a type name** (Read): "Lua doesn't have constructors for primitive types, so `expect.any` accepts either a typename string" or a class table: `expect(5).toEqual(expect.any("number"))`.
- **Truthiness is Lua's** (Read): "`.toBeFalsy()` checks for Lua falsy values, which are only `false` and `nil`"; `toBeNil` is the encouraged nil check. The runner of `reforged-test` already says the same of `toBeTruthy` and `toBeFalsy` (`packages/reforged-test/README.md`, "Writing a test").
- **`toHaveLength` is `#`** (Read): "`.toHaveLength` **cannot** be used to check the argument count of a function."
- **`.each` takes a list of tables** (Read): "Tagged templates are not available in Lua."
- **Custom matchers take `self` first** (Read): "The first argument that a custom matcher takes in `expect.extend(matchers)` always needs to be a `self`."
- **Fake timers replace the platform's timers** (Read): `jest.useFakeTimers()` "Instructs Jest Lua to use fake versions of the standard Lua and Roblox timer functions" (`delay`, `tick`, `time`, `os.time`, `os.clock`, `task.delay`, `task.cancel`, `task.wait`, `DateTime`); `advanceTimersByTime`, `runOnlyPendingTimers` and `advanceTimersToNextTimer(steps)` keep Jest's names and meaning. `jest.setEngineFrameTime(frameTimeMs)` "sets the frame time, in milliseconds, by which all advance timer methods process timers": time moves in steps of a frame, as the engine's does. Source: <https://jsdotlua.github.io/jest-lua/jest-object>.
- **Globals are mocked through a whitelist** (Read): "Jest Roblox does not support mocking all globals - only a few are whitelisted." Source: <https://jsdotlua.github.io/jest-lua/jest-object>.

### TestEZ (Roblox)

- **A chain read as English** (Read): expectations "are intended to be read like English assertions": `expect(1).to.equal(1)`, `expect(1).to.be.a("number")`, `expect(5).to.be.near(5 + 1e-8)`, `expect(function() error("nope") end).to.throw("nope")`. Negation is `never`, before `to`: `expect(1).never.to.equal(2)`.
- **`describe` is the thing, `it` is the behavior** (Read): `describe` blocks "correspond to the **things** that are being tested", `it` blocks "to the **behaviors** that should be expected".
- **Hooks, focus and skip; nothing else** (Read): `beforeAll`, `beforeEach`, `afterEach`, `afterAll`, `itFOCUS`, `itSKIP`, `itFIXME`. The API reference documents no spy, no mock and no clock.

Source: <https://roblox.github.io/testez/api-reference/>.

### busted (Lua)

- **Assertions chain modifiers** (Read): "Asserts in busted work by chaining a modifier value by using `is` or `is_not`": `assert.are.equal(1, 1)`, `assert.is_true(true)`, `assert.are_not.equals(1, "1")`, `assert.has_error(function() error("Wat") end, "Wat")`. Lua's reserved words are dodged with an underscore or a capital (`is_not`, `assert.True`).
- **Three depths of replacement** (Read): a spy wraps and still calls ("keep track of data about how the function was called"), a stub replaces ("Stubs act similarly to spies, except they do not call the function they replace"), `mock(t)` wraps every function of a table. `spy.on(t, "greet")` replaces a member of a table in place; `t.greet:revert()` restores it, `t.greet:clear()` clears the history.
- **Call assertions and argument matchers** (Read): `assert.spy(s).was.called(1)`, `assert.spy(s).was.called_with(1, 2, 3)`, and matchers in place of arguments: `match._` for any, `match.is_string()`, `match.is_ref(t)` for the same table.
- **`insulate` isolates what Lua shares** (Read): an `insulate` block "saves the global table `_G` and any currently loaded packages `package.loaded`" and restores them after; `expose` does the opposite.
- **No clock** (Read): the page documents `async()` and `done()` and no time mocking.

Source: <https://lunarmodules.github.io/busted/>.

### Minecraft GameTest

The framework closest to a Map project's case: tests of game content that run in the game.

- **What a test is** (Read): "A GameTest is a miniature environment along with a set of starting conditions, such as a set of mobs or items. After that environment plays out in the Minecraft world for a period of time, a GameTest has conditional code that evaluates whether expected conditions were met." Source: <https://learn.microsoft.com/en-us/minecraft/creator/documents/gametestgettingstarted>.
- **The canonical test** (Read): spawn a fox and a chicken, pass when the chicken is gone.

  ```js
  function simpleMobTest(test) {
    test.spawn("fox", { x: 5, y: 2, z: 5 });
    test.spawn("chicken", { x: 2, y: 2, z: 2 });
    test.assertEntityPresentInArea("chicken", true);
    test.succeedWhen(() => {
      test.assertEntityPresentInArea("chicken", false);
    });
  }
  GameTest.register("StarterTests", "simpleMobTest", simpleMobTest)
    .maxTicks(410)
    .structureName("startertests:mediumglass");
  ```

  Source: <https://learn.microsoft.com/en-us/minecraft/creator/documents/gametestbuildyourfirstgametest>.

- **Actions are verbs of the world on one `test` object** (Read): `spawn` "Spawns an entity at a location", `pressButton` "Presses a button at a block location", `pullLever`, `pulseRedstone` "Sends a Redstone pulse at a particular location by creating a temporary Redstone block", `killAllEntities`, `spawnSimulatedPlayer`. The simulated player acts as a player: `attackEntity(entity)`, `interactWithBlock`, `useItem`, `chat(message)`, `jump`. Sources: <https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server-gametest/test>, <https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server-gametest/simulatedplayer>.
- **Time is ticks, and waiting has a name** (Read): `idle(tickDelay): Promise<void>` "will wait for the specified time in ticks before continuing execution"; `runAfterDelay(delayTicks, callback)`; `succeedWhen(callback)` "Runs the given callback every tick. When the callback successfully executes, the test is marked as a success"; `until(callback): Promise<void>`; every test ends by `maxTicks`. Source: <https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server-gametest/test>.
- **Assertions name the world's state** (Read): `assertEntityPresent`, `assertRedstonePower` "Tests that Redstone power at a particular location matches a particular value", `assertEntityState(location, type, callback)`, and a plain `assert(condition, message)`. Source: the same page.
- **Isolation is a place** (Read): each test owns a structure, and "Coordinates used in APIs like spawn are relative to the structure block". The Java edition says the same of its templates, "Game Tests are performed within scenes loaded by structures, or templates", and "once the test has finished, the environment is tore down". Sources: <https://learn.microsoft.com/en-us/minecraft/creator/documents/gametestbuildyourfirstgametest>, <https://docs.neoforged.net/docs/misc/gametest/>.
- **A simulated actor is not the real one** (Read): "many types of events that may be available for entities more broadly, such as item use events, may not fire in the same capacity for simulated players". Source: <https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server-gametest/simulatedplayer>.

GameTest runs in the real game on real ticks; a Map project's test runs on stubs, with no game. The phrasing carries over, not the engine (Inferred).

### Unity Test Framework

- **A test that spans frames is a coroutine** (Read): `[UnityTest]` is "the main addition to the standard NUnit library"; in Play Mode "a test runs as a coroutine", and "If you `yield return null`, you skip a frame"; `WaitForSeconds` waits real time ("Be careful about creating long-running tests") and `WaitForFixedUpdate` one physics step. Source: <https://docs.unity3d.com/Packages/com.unity.test-framework@1.4/manual/reference-attribute-unitytest.html>.
- **Input tests get a fixture that owns the system** (Read): `InputTestFixture` exists "to create an isolated version of the Input System for tests": "The fixture sets up a blank, default-initialized version of the Input System for each test", and restores the previous state after. The test adds its own device and acts on it by name:

  ```csharp
  var gamepad = InputSystem.AddDevice<Gamepad>();
  Press(gamepad.buttonSouth);
  Set(gamepad.leftStick, new Vector2(0.123f, 0.234f));
  ```

  The fixture's clock is set by the test: `runtime.currentTime = 0.234f;`. Source: <https://docs.unity3d.com/Packages/com.unity.inputsystem@1.11/manual/Testing.html>.

- **An unexpected error log fails the test** (Read): "A test fails if Unity logs a message other than a regular log or warning message", unless `LogAssert.Expect(LogType.Error, "Error message")` announced it. Source: <https://docs.unity3d.com/Packages/com.unity.test-framework@1.4/manual/reference-custom-assertion.html>.

The last point answers a pain of the Template's test: the library catches a failing callback and prints one line, so the test wrote `expectGameStartCallbackRan()` to find out (`reforged-ts-template`, `tests/lua/main.test.ts` at `8917d6d`). A harness that fails a test on that line, unless the test expected it, needs no such helper (Inferred).

## What typescript-to-lua compiles

### How the typescript-to-lua claims were checked

- typescript-to-lua 1.37.3 with TypeScript 6.0.2, the versions installed for `packages/reforged-test`, through `transpileFiles` with `luaTarget: "5.3"`, `strict`, `luaLibImport: "inline"` and the types `@typescript-to-lua/language-extensions` and `lua-types/5.3`.
- The emitted Lua ran on `lua-wasm-bindings` 0.5.3 at its Lua 5.3.6 build (`lua-wasm-bindings/dist/lua.53.js`), the VM `packages/reforged-test/src/lua-state.ts` uses, after `debug=nil io=nil collectgarbage=nil dofile=nil loadfile=nil os.getenv=nil`, and `require=nil package=nil` for a single file: the globals `AGENTS.md` ("Runtime constraints") says the game lacks. `load` stayed.
- The snippets are quoted below, shortened. Each stood in a file beginning with `/** @noSelfInFile */`, as the runner does (`packages/reforged-test/runner/index.ts`), unless its row says otherwise. They were run on 2026-11-25 and are not kept in the repository.

### A property named `not`

**Run.** A property, a method, a getter and an export named after a Lua reserved word compile to the bracket form, and a local to a renamed identifier:

```ts
expect(1).not.toBe(2);
const plain = { not: 1, end: 2, nil: 3, function: 4, until: 5 };
const not = 5;
export const end = 1;
```

```lua
expect(1)["not"]:toBe(2)
plain = {["not"] = 1, ["end"] = 2, ["nil"] = 3, ["function"] = 4, ["until"] = 5}
____not = 5
____exports["end"] = 1
```

All twelve tried (`not`, `end`, `nil`, `function`, `until`, `and`, `or`, `local`, `then`, `elseif`, `repeat`, `goto`) read back their values, and `expect(1).not.not.toBe(1)` passed. Jest-Lua's reason for `never` does not apply to a test written in TypeScript (Inferred).

### Getters on what `expect` returns

| Form                                                 | Result                                                                                                                                                         | Status |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| `class Expectation { get not() { … } }`              | Works. Emits `__TS__SetDescriptor(Expectation.prototype, "not", { get = … }, true)`, which pulls the lualib class and descriptor helpers into the test bundle. | Run    |
| `{ toBe() { … }, get not() { … } }` (object literal) | Compile error `TS100025: Accessors in object literal are not supported.`                                                                                       | Run    |
| `Object.defineProperty(matchers, "not", { get: … })` | Works, through `__TS__ObjectDefineProperty`.                                                                                                                   | Run    |
| `setmetatable(matchers, { __index: (t, k) => … })`   | Works: `not` is built at its first read and stored with `rawset`.                                                                                              | Run    |
| An eager field: `matchers.not = make(true)`          | Works, with no metatable.                                                                                                                                      | Run    |

Cost, 200 000 expectations each, two runs (Run): a class instance 1.4 to 3.1 µs per `expect(i).toBe(i)` and 2.6 to 6.1 µs with `.not`; eager closures 1.3 to 2.0 µs and 1.3 to 2.1 µs; the lazy metatable 1.0 to 1.5 µs and 1.9 to 2.9 µs. Against the 9 ms a test file's Lua state costs (#931), none matters; the choice is about readable emitted Lua and failure messages.

The runner today is written "in Lua-shaped TypeScript (table.\*, string.\*, pcall) so the emitted Lua needs no lualib_bundle" (`packages/reforged-test/runner/tsconfig.json`): a class with a getter breaks that property, an eager field or a metatable keeps it (Run for the emitted helpers, Read for the rule).

### `expect.anything`, `it.each`: members on a function

**Run.** typescript-to-lua turns a function declaration that gets properties assigned into a callable table by itself:

```ts
function expect(value: unknown) {
  return { value };
}
expect.anything = () => "anything";
```

```lua
expect = setmetatable({}, {__call = function(____, value) return {value = value} end})
expect.anything = function() return "anything" end
```

A merged namespace (`namespace expect { export const any = … }`) adds to the same table. `Object.assign((name) => …, { skip: … })` compiles and fails at run time with `attempt to index a function value`: the function is not converted there.

A hand-written callable table works as well, with one trap: `lua-types` declares `__call?(this: T, ...args: any[])`, so the metamethod must be a method (`__call(value) { … }`, which emits `function(self, value)`), not an arrow function, which emits `function(____, _self, value)` and shifts every argument by one with no diagnostic (Run).

### Asymmetric matchers

**Run.** A table carrying a marker field and a `matches(actual)` function, which the deep equality checks before comparing, gives `anything()`, `objectContaining(part)`, `stringContaining(part)` and `any(kind)`, nested in one another and inside `toHaveBeenCalledWith`-style argument lists:

```ts
equals(
  { a: 1, b: { c: "hello world", d: 4 } },
  { a: anything(), b: objectContaining({ c: stringContaining("world") }) },
); // true
equals([new Hero("x")], [any(Unit)]); // true: instanceof, through the class chain
equals({ a: 1 }, { a: any("number") }); // true: type(a) == "number"
```

- **`expect.any(Number)` is impossible** (Run): `Number`, `String`, `Boolean`, `Function`, `Object`, `Array`, `Date`, `Proxy` and `RegExp` each compile to a global read that is `nil`, with no diagnostic, and `x instanceof Number` raises `Right-hand side of 'instanceof' is not an object`. `any` must take a type name or a class, as Jest-Lua's does. Types do not close the hole: with the overloads `any(kind: "string" | "number" | …): any` and `any<T>(kind: new (...args: any[]) => T): T`, `any(Number)` still compiles, `NumberConstructor` being a constructor type, and passes `nil`. `any` must raise on a `nil` argument, naming the type name to write instead (Run).
- **`anything()` and a nil field** (Run): `{ a: undefined }` has no key `a` in Lua, so `anything()` cannot tell "present and nil" from "absent"; it fails on both, which is what Jest's "anything except `null` or `undefined`" asks.
- **A regular expression is a compile error** (Run): `/died$/` gives `TS100013: Unsupported node kind RegularExpressionLiteral`, and `string.match` in its JavaScript form `TS100029`. `toMatch` and `stringMatching` take a Lua pattern or plain text, as the runner's `toThrow(message)` already takes plain text (`packages/reforged-test/README.md`).
- **`new Proxy` compiles and fails at run time** (Run): `attempt to index a nil value`. A metatable does a Proxy's work.
- **`Symbol` works** (Run): `Symbol.for("asymmetricMatch")` is usable as a key. A string marker does the same with no lualib.
- **The typing trick carries over** (Run, type level): `objectContaining<T>(part: Partial<T>): T` stands where a `T` is expected, as Jest types its matchers.

### Spies as callable tables

**Run.** `fn()` returning `setmetatable(spy, { __call(...args) { … } })`, typed as an interface with a call signature and members under `@noSelf`:

| What is done with the spy                                            | Result                                                               |
| -------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Called: `spy(1, 2)`, `const f = spy; f(1)`, `{ run: spy }.run(1)`    | Works.                                                               |
| Put over a global: `_G.CreateUnit = spy`, then `CreateUnit(…)`       | Works, and restoring puts the function back.                         |
| Handed as a handler to a function that calls it (`TimerStart` shape) | Works.                                                               |
| `pcall(spy)`, `xpcall(spy, handler)`                                 | Works.                                                               |
| `type(spy)`, and `typeof spy === "function"` in TypeScript           | `"table"`; the comparison is false.                                  |
| `coroutine.create(spy)`                                              | Error: `bad argument #1 to 'create' (function expected, got table)`. |

- **The library tells a function from a Handle by `typeof`** (Read): `Trigger.addCondition` (`packages/reforged-ts/src/handles/trigger.ts`, line 389), `filterOf` (`packages/reforged-ts/src/handles/boolexpr.ts`, line 35), `SyncedMap` and `SyncedSet` constructors, and `wrapGlobal` (`packages/reforged-ts/src/init/wrapping.ts`, line 135) branch on `typeof value === "function"` or `type(current) === "function"`. A callable-table spy passed as a condition is taken for a boolexpr; one installed as `MarkGameStarted` is not wrapped (Inferred from the run above).
- **The shipped stubs do not** (Read): no file of `packages/reforged-test/stubs/` compares `type(…)` to `"function"`, so a stub that stores a handler calls a callable table as it calls a function (Inferred; the `TimerStart`-shaped run above used a stand-in, not the shipped stub).
- **So a spy handed to code under test must be a function** (Inferred): either `fn()` returns a real function and keeps its record in a side table keyed by that function ("a Handle is a safe table key" holds for functions as well), read by `expect(spy)` and by a `calls(spy)` helper; or it returns Jest-Lua's pair. With TypeScript the first reads as Vitest does except for `spy.mock.calls`, which a function cannot carry.

### Typed `toHaveBeenCalledWith` over a Native's parameters

**Run, type level** (the checks are `@ts-expect-error` lines that compile only if the error is there):

```ts
type Fn = (...args: any[]) => any;
/** @noSelf */
interface Mock<F extends Fn> {
  (...args: Parameters<F>): ReturnType<F>;
  mock: { calls: Parameters<F>[] };
}
/** @noSelf */
interface MockMatchers<F extends Fn> {
  toHaveBeenCalledWith(...args: Parameters<F>): void;
  toHaveBeenCalledTimes(n: number): void;
  not: MockMatchers<F>;
}
declare function expect<F extends Fn>(spy: Mock<F>): MockMatchers<F>;
declare function expect<T>(value: T): Matchers<T>;
declare function spyOnNative<K extends keyof NativeTable>(
  name: K,
): Mock<NativeTable[K]>;

const created = spyOnNative("CreateUnit");
expect(created).toHaveBeenCalledWith(0, 1, 2, 3, 4); // compiles
expect(created).toHaveBeenCalledWith(0, 1); // error: too few arguments
expect(created).toHaveBeenCalledWith(0, "hfoo", 2, 3, 4); // error: a string for the unit type id
expect(created).toBe(1); // error: a spy has no toBe
expect(5).toHaveBeenCalledWith(1); // error: a number has no toHaveBeenCalledWith
spyOnNative("KillUnitt"); // error: no such Native
```

- `Parameters<typeof CreateUnit>` reads a Native's declaration as the Typings write one (`declare function CreateUnit(this: void, …)`), and a spy made with `spyOn(_G as { CreateUnit: typeof CreateUnit }, "CreateUnit")` carries it (Run).
- `NativeTable` above was written by hand. Whether the Typings can give the map from a Native's name to its type (`typeof globalThis`, or a generated interface) was not checked: it belongs to the ticket on shipped types.
- **Asymmetric matchers defeat nothing** (Run): since `objectContaining<T>` returns `T` and `anything()` returns `any`, they fit a typed argument list.

### Arguments that are `nil`

**Run.** A rest parameter compiles to `local args = {...}`, and a later spread of it to `table.unpack(args)`, which stops at the border `#args` finds. typescript-to-lua emits the real `...` only when the spread comes before any other use of the array:

| Body of `(...args: unknown[]) =>`              | `f(1, nil, 3)` | `f(1, 2, nil)` | `f(1, nil, nil)` |
| ---------------------------------------------- | -------------- | -------------- | ---------------- |
| `args.length`                                  | 3              | 2              | 1                |
| `select("#", ...args)` as the first statement  | 3              | 3              | 3                |
| `table.pack(...args).n` as the first statement | 3              | 3              | 3                |
| `calls.push(args); select("#", ...args)`       | 3              | 2              | 1                |
| `select("#", ...args)` inside a nested closure | 3              | 2              | 1                |

A spy that records calls must count its arguments first and keep the count beside the list; `toHaveBeenCalledWith` must compare up to the larger count. A Native called with a trailing `nil`, as `CreateUnit(…, undefined)` compiles, is then told from one called without it, which the call log already does by rendering every argument.

### Replacing a module's export

**Run.** A named import is copied into a local when the importing module loads:

```ts
import * as mod from "./mod";
import { greet, api } from "./mod";
mod.greet = () => "replaced";
api.greet = () => "replaced method";
print(greet(), mod.greet(), api.greet()); // original  replaced  replaced method
```

```lua
local ____mod = require("mod")
local greet = ____mod.greet
```

`vi.spyOn(module, "export")` therefore cannot reach the map's code, which imported the library's functions by name before the test ran. What a test can replace is a global (every Native, `print`) and a member of an object or a class prototype read at call time (Run).

### The `self` parameter

**Run**, and the largest source of wrong Lua in these experiments, each time with no error at compile time once a cast was in the way:

- `@noSelfInFile` does not reach a method written in an object literal: `{ toBe(expected) { … } }` emits `function(self, expected)` in such a file, while a call through a `@noSelf` interface emits `m.toBe(2)`. The two meet only through `as unknown as Matchers`, and the matcher then receives its argument as `self`. An arrow function property (`toBe: (expected) => { … }`) has no `self`.
- A function whose type comes from a declaration takes that declaration's `this`: an arrow function given as `__call` gets a context parameter from `lua-types` (above).
- typescript-to-lua's own rule (Read): "All functions, by default, have a `self` parameter to preserve JavaScript behaviour"; `@noSelf` on an interface says its functions "should not have a context parameter"; and `noImplicitSelf` is ignored by "Ambient functions (functions described, not implemented) as well as classes and interfaces". Source: <https://typescripttolua.github.io/docs/the-self-parameter>.

The published declarations of the test API decide how a Map project's call compiles: `@noSelf` on every interface, as the runner does today, and no cast between the implementation and its interface, so that the compiler's "Unable to convert function with a 'this' parameter to function with no 'this'" stays able to fire (Inferred).

### Errors, promises and table-driven tests

- **`new Error` works without `debug`; `tostring` of one does not** (Run): `throw new Error("boom")`, `instanceof Error`, a subclass and `.message` work with `debug` removed (`.stack` is `nil`). `tostring(new Error("x"))` raises `attempt to index a nil value (global 'debug')`: the lualib's `__tostring` calls `debug.getinfo` unguarded, where its stack capture guards with `if debug == nil`. With `debug` present it gives `Error: x`. The harness's Lua state keeps `debug` (`packages/reforged-test/src/lua-state.ts` opens every standard library), so a test passes there on code that fails in the game: a failure message must read `.message`, as the runner's `errorMessage` does, and never call `tostring` on a thrown table.
- **`async` and `await` work without `debug`** (Run): an `async` test suspended on a promise resumes when it resolves, in order (`start, sync end, after await, done`), and a rejection reaches `.catch`. typescript-to-lua's promises "will simply immediately resolve or reject promises as soon as the resolve or reject function is called" (Read, <https://typescripttolua.github.io/docs/caveats>): there is no event loop to wait on. `await game.advanceTime(120)` would compile, but nothing in a stubbed game is asynchronous, so a synchronous `advanceTime` says the same with less (Inferred).
- **`it.each` with rows works; the tagged template compiles too** (Run): `each([[1, 2, 3], [2, 3, 5]])("adds %d and %d to %d", (a, b, sum) => …)` runs with `string.format` for the name, and a tagged template reaches its tag function with its strings and values, so Jest-Lua's reason for dropping it does not apply. Parsing the template's table is work with no reader asking for it.
- **Truthiness and equality are Lua's** (Read): "TypeScriptToLua adheres to the Lua evaluations" (`0`, `""` and `NaN` are truthy), `null` and `undefined` are both `nil`, and "`Array.prototype.length` is translated to Lua's `#` operator". Source: <https://typescripttolua.github.io/docs/caveats>.

## Take-aways for a Map project test API

### Copy

- **Vitest's vocabulary, unchanged where it compiles**: `describe`, `it`, `beforeEach`, `afterEach`, `expect(x).toBe/toEqual/toContain/toThrow`, `.not`, `expect.anything()`, `expect.objectContaining()`, `toHaveBeenCalledWith`, `toHaveBeenCalledTimes`. `.not` needs no `never`. Sources: "A property named `not`", "Asymmetric matchers" above; <https://vitest.dev/api/expect.html>.
- **Testing Library's two levels, named as such**: actions that are whole interactions (`game.kill(unit)`, what the sketch of #931 calls "act as the game does") as the documented way, and the firing of one concrete event with an invented context (`__stub_fire_trigger`) as the escape hatch, documented as one. Source: <https://testing-library.com/docs/user-event/intro>.
- **An action that refuses what the game refuses**: `user-event` will not click a hidden element; an action over a removed unit or a paused Timer should fail the test rather than fire. Source: the same page.
- **One object that owns the world of the test**, as GameTest's `test` and Unity's `InputTestFixture`: `spawn`, the actions, the clock and the observations hang from what `startGame()` returns, and its creation is the reset. Sources: <https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server-gametest/test>, <https://docs.unity3d.com/Packages/com.unity.inputsystem@1.11/manual/Testing.html>.
- **Jest's clock verbs, in the game's unit**: `advanceTime(seconds)` for `advanceTimersByTime`, and a step to the next Timer for `advanceTimersToNextTimer`. A map's repeating Timers make `runAllTimers` an endless loop: leave it out, or give it Jest's limit and error. Sources: <https://vitest.dev/api/vi.html>, <https://jestjs.io/docs/timer-mocks>.
- **Assertions on what the player perceives first**: printed and displayed text, units and their state; the call log of Natives last, as Testing Library ranks the test id. Source: <https://testing-library.com/docs/queries/about>.
- **Unity's rule on error logs**: a callback the library caught and reported fails the test unless the test expected it, which removes the Template's `expectGameStartCallbackRan`. Source: <https://docs.unity3d.com/Packages/com.unity.test-framework@1.4/manual/reference-custom-assertion.html>.
- **Jest-Lua's deviations where Lua forces them**: `expect.any("number")` or `expect.any(Unit)`; Lua truthiness in `toBeTruthy`; plain text or a Lua pattern where Jest takes a regular expression. Source: <https://jsdotlua.github.io/jest-lua/deviations>, each confirmed under "Asymmetric matchers".
- **Types from the Typings**: `toHaveBeenCalledWith(...args: Parameters<F>)` and a spy typed after the Native it replaces. Source: "Typed `toHaveBeenCalledWith`" above.
- **Three depths of reset with three names**, if spies are offered: clear the history, reset the implementation, restore the original. Sources: <https://vitest.dev/api/vi.html>, <https://lunarmodules.github.io/busted/>.

### Avoid

- **`never` instead of `not`, and TestEZ's `to.be` chain**: both answer a constraint of hand-written Lua that TypeScript does not have, and the standing preference of #931 is Vitest's syntax.
- **A getter in an object literal, `Object.assign` on a function, `new Proxy`, a regular expression literal, `expect.any(Number)`**: the first and the fourth are compile errors, the others compile and fail at run time or pass `nil`. Source: the tables above.
- **A callable table where the code under test receives the spy**: the library's `typeof x === "function"` branches and `coroutine.create` reject it. Keep callable tables for the API's own entry points (`expect`, `it`), where the test is the only caller. Source: "Spies as callable tables".
- **Recording arguments with `calls.push(args)` alone**: trailing `nil`s vanish. Count with `select("#", ...args)` first. Source: "Arguments that are `nil`".
- **`spyOn` over a module's export**: it does not reach code that imported the export by name. Spy on globals (Natives, `print`) and on members. Source: "Replacing a module's export".
- **A cast between the implementation of a matcher and its `@noSelf` interface**: it hides the one diagnostic that catches a shifted `self`. Source: "The `self` parameter".
- **`tostring` on a thrown value in a failure message**: it raises without `debug`, and passes in the harness, which has it. Source: "Errors, promises and table-driven tests".
- **Asynchronous tests and polled success (`succeedWhen`, `expect.poll`, `await idle`)**: they exist because GameTest and Unity run on real ticks; on stubs nothing happens between two statements of a test, so a synchronous clock says the same. Sources: <https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server-gametest/test>, <https://typescripttolua.github.io/docs/caveats>.
- **Resets that are off by default**: Vitest leaves `restoreMocks` at `false` and the `it`s of a file share their state, which is the reason the Template's test starts the game at module level. A world made by `startGame()` per test, or reset before each `it`, avoids copying that default. Source: <https://vitest.dev/config/restoremocks>.
- **A simulated actor passed off as the real one**: Minecraft warns that events "may not fire in the same capacity for simulated players". Each action should say which events and responses it fires, since a stub "never simulates game rules" (`packages/reforged-test/README.md`, "Stub authoring rules"). Source: <https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server-gametest/simulatedplayer>.

## Not verified

- Whether the Typings can provide a map from each Native's name to its function type for `spyOnNative`-style typing: the run used a hand-written interface.
- A callable-table spy against the shipped stubs (`__stub_fire_timer`, `__stub_fire_trigger`): the run used stand-ins of the same shape, and the stubs were read, not exercised.
- The behaviour inside the game: every run was on `lua-wasm-bindings`' Lua 5.3.6 with the missing globals removed, not on the game's Lua. Nothing here depends on a fact only the game can settle, so no Probe was run.
- Unity's `Press(control, time)` time arguments and Jest-Lua's reason for an engine frame time: the pages read name them without explaining them.
- Minecraft Java's `GameTestHelper` action methods (`spawn`, `pressButton`, `pullLever`): the NeoForge page read documents its success and timing methods only; the Bedrock reference is the source for the actions.
