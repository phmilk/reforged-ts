---
"reforged-test": minor
---

Focus and skip on `reforged-test/map` and `reforged-test/lua`: `it.skip`, `it.only`, `it.todo(name)`, `describe.skip` and `describe.only`, registered in Vitest's native form by `runLuaTests`, so Vitest reports each and a forgotten `only` fails the run under `CI`. A test skipped, todo or out of focus opens no Test game and runs no `beforeEach` or `afterEach`; `only` reaches every Lua test of the Map project. On `reforged-test/lua` the body of a skip or todo test does not run, and `only` hides the report only. The results contract gains the status `skip` and the keys `mode` and `suiteModes`.
