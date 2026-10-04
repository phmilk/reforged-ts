---
"reforged-types": minor
---

15 enum-like getters and intrinsic properties seeded nullable (`GetPlayerRace`, `GetItemType`, `GetGameDifficulty`, `GetWorldBounds`, `GetCameraTargetPositionLoc`, ...) now return their handle type, no longer `| undefined`: the Nullability sweep saw each return a handle in every case on 3.0.0.24268, empty and neutral players, dead and removed items and units included. A `?.` or `!` on their result is no longer needed. They and 10 getters already non-null carry a `@remarks` with what was measured, which says what a handle of id 0 stands for (a `common.j` constant of integer 0, or for `GetPlayerRace` of a neutral player no constant), and `GetItemPlayer`, still nullable, notes that it returned nothing for a removed item.
