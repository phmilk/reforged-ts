---
"reforged-types": patch
---

The 8 callback getters (`GetFilterUnit`, `GetEnumUnit`, `GetEnumPlayer`, ...) and the 6 optional properties (`GetUnitRallyPoint`, `GetUnitRallyUnit`, `GetUnitRallyDestructable`, `PlayerGetLeaderboard`, `BlzFrameGetParent`, `BlzGetMouseFocusUnit`) measured by the Nullability sweep carry a `@remarks` with what was measured on 3.0.0.24268: each returned nothing outside its callback, or for an object that has none (a unit with no rally point, a player with no leaderboard, the parent of the game UI frame, a game with no mouse input). Their types stay `| undefined`.
