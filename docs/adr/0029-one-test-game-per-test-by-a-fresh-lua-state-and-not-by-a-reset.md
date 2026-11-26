---
status: accepted
date: 2026-11-26
---

# One Test game per test, by a fresh Lua state and not by a reset

On `reforged-test/lua`, the tests of one file share one Lua state, so each test sees the units, the Recorded calls and the printed lines of the ones before it, and a Map project's test starts the game at module level because it can start only once per file. A map author expects each test to begin from nothing, as Vitest's tests do.

A test file that loads `reforged-test/map` runs each `it` in a Test game of its own: a fresh Lua state, in which the Shipped stubs run, the modules are preloaded and the test file is required again, and only that `it`'s body runs. A file of N tests costs N+1 states: one load lists the tests, at collection, and each test opens its own state inside its Vitest `test`. A test's identity across loads is its position in the list, its full name checked, so a file that registers different tests on each load fails the test at that position, saying so. It is the default for the file and has no switch, even when the file imports from `reforged-test/lua` too; a file on `reforged-test/lua` alone keeps one state per file.

## Considered options

- A reset between tests in one state: clearing the call log, the printed lines, the stubs' tables and the handle id sequence. Every stub would need its reset and the next stub could forget its own; the library's state (the Init stages run once, the Systems' tables, the wrapped editor functions) and the Map project's module-level state are not the harness's to clear; and a global or a `require` cache a test left behind stays. A fresh state leaves nothing behind by construction.
- Vitest's own default, one module environment per file, as the tests of `reforged-test/lua` have it. It is the problem itself: the units of one test reach the next, and the order of the tests changes what each sees.

## Consequences

- A fresh state costs about 9 ms with the whole library preloaded (#931), so a file of N tests costs N+1 of them; the load that lists the tests is the extra one.
- A test's module-level code runs once per test, and once more in the load that lists them: it must not depend on how many times it ran.
- Each test's body runs inside its Vitest `test`, so its time and its console lines are that test's, not the collection's.
- The test registry of `reforged-test/lua` serves both entry points; the mode belongs to the file, set when it loads `reforged-test/map`.
- A file that registers its tests from data that changes between loads (a counter kept outside the state, a random name) fails each test whose name moved, rather than running the wrong body.

Decision record: https://github.com/phmilk/reforged-ts/issues/970
