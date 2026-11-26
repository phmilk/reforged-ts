---
"reforged-test": minor
---

A Map project's test arranges each test once, in `beforeEach`, and cleans up in `afterEach`, both imported from `reforged-test/map` (and from `reforged-test/lua`). They are scoped by `describe` and fail as Vitest's do: `beforeEach` runs from the outer `describe` inwards and `afterEach` from the inner outwards, even after a failure; a failing `beforeEach` skips the test's body; a failing `afterEach` fails a test that had passed; the test reports its first error. A function a `beforeEach` returns runs after the `afterEach` hooks, and `startGame()` works in a `beforeEach`. There is no `beforeAll` or `afterAll`.
