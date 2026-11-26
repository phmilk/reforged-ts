---
"reforged-test": minor
---

A Map project's test arranges each test once, in `beforeEach`, and cleans up in `afterEach`, both imported from `reforged-test/map` (and from `reforged-test/lua`). They are scoped by `describe` and fail as Vitest's do: the `beforeEach` hooks run from the outer `describe` inwards and the `afterEach` hooks from the inner outwards; a `beforeEach` that throws fails the test and skips its body; the `afterEach` hooks run even then, and one that throws fails a test that had passed; the test reports its first error. `startGame()` works in a `beforeEach`. There is no `beforeAll` or `afterAll`.
