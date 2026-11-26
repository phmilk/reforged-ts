---
"reforged-test": minor
---

`reforged-test/map` gains `stubNative`, `newHandle` and `game.setLocalPlayer`.

- `stubNative(name, impl)` answers a Native in TypeScript, in the test's own game: `stubNative("GetUnitName", (unit) => "Footman")`. The name is typed as a Native of `common.j` and `impl` by its signature, optional only for a Native that returns nothing; each call is recorded before `impl` runs. Over a Native the harness already answers, the replacement is whole: its Stub no longer runs.
- `newHandle(kind)` returns a Handle of the test's game, typed from `kind` (`newHandle("unit")` is a `unit`), for an answer that creates one.
- `game.setLocalPlayer(player)` makes the test act as another client: `GetLocalPlayer` answers that player from then on. It takes a player's Handle or anything with `.handle`.
- `__stub_set_local_player` of `reforged-test/stubs` takes a player handle in place of the slot.
