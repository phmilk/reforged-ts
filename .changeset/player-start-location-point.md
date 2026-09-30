---
"reforged-ts": major
---

`MapPlayer.startLocationPoint` returns a `Point` ([#258](https://github.com/phmilk/reforged-ts/issues/258)).

**Breaking change** (detailed in `migration/behaviour-changes.md`): the accessor returned the raw `location` handle `GetStartLocationLoc` allocates on each read, or `undefined` when the game returned none. It now returns a new `Point` wrapping that location, like `Camera.eyePoint`, and throws `reforged-ts: failed to create Point` when the game returns none. `RemoveLocation(player.startLocationPoint)` becomes `player.startLocationPoint.destroy()`.
