---
"reforged-test": minor
---

The first Game action: `game.kill(unit, { by })`, on the `game` that `startGame()` of `reforged-test/map` returns. It kills the unit as the game does: the unit is dead, then every death Trigger the game would fire runs (the widget death, `EVENT_PLAYER_UNIT_DEATH` of its owner, `EVENT_UNIT_DEATH`), and a handler reads `by` as `GetKillingUnit`, nil without it. It takes a unit as its Handle or anything with `.handle`, and refuses with an error a unit already dead or removed and a removed killer. The Shipped stubs gain the helper `__stub_kill_unit(unit, killer?)`, the death `KillUnit` fires, with a killer.
