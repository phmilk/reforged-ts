---
"reforged-test": minor
"reforged-types": none
---

`reforged-test/map` gains `stubNative`, `newHandle` and `game.setLocalPlayer`.

- `stubNative(name, impl)` answers a Native in TypeScript, in the test's own game: `stubNative("GetUnitName", (unit) => "Footman")`. The name is typed as a Native of `common.j` and `impl` by its signature, optional only for a Native that returns nothing; each call is recorded before `impl` runs. Over a Native a Shipped stub covers, the replacement is whole: the Shipped stub no longer runs, its state and its Event dispatch with it.
- `newHandle(kind)` returns a Handle of the test's game, typed from `kind` (`newHandle("unit")` is a `unit`), for an answer that creates one.
- `game.setLocalPlayer(player)` makes the test act as another client: `GetLocalPlayer` answers that player from then on. It takes the Handle of a player of the test's game or anything with `.handle`, and throws for anything else, a Handle of `newHandle("player")` included.
