---
"reforged-test": minor
---

A new entry point for a Map project's tests, `reforged-test/map`: `describe`, `it`, `expect` and `startGame()`. Each test of a file that loads it runs in a Test game of its own, a fresh Lua state in which the file is loaded again, so no test sees the units, the calls or the printed lines of another. `startGame()` runs the map's initialization through the Init stages and returns the test's `game`, whose `printed` and `displayed` hold what the map printed and showed on a player's screen. A file on `reforged-test/lua` alone runs as before, its tests sharing one Lua state.
