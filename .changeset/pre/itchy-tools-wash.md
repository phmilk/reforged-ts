---
"reforged-test": minor
---

`game.expectError(text)` on `reforged-test/map`: a Caught error, an error the library caught from the map's code and reported through `__reforged_caught_error`, now fails the test at its end, after its last `afterEach`, unless the test expected it. The failure lists each as `<origin> failed: <message>`, `×N` after a repeat, before the test's own failure. `reforged-test/map` defines that global in every Test game; a file on `reforged-test/lua` alone does not.
