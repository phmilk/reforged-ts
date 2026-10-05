---
"reforged-types": minor
"reforged-ts": patch
---

28 constructors typed nullable now return their handle type, no longer `| undefined`: the Nullability sweep saw each return a handle on 3.0.0.24268 for typical arguments, odd numbers, empty or unknown names and rawcodes, and stale handle arguments alike. They are `CreateGroup`, `CreateForce`, `DialogCreate`, `InitHashtable`, `CreateQuest`, `QuestCreateItem`, `CreateDefeatCondition`, `CreateTimerDialog`, `CreateLeaderboard`, `CreateMultiboard`, `CreateUpgradeCommandButtonEffect`, `CreateLearnCommandButtonEffect`, `CreateUnitPool`, `CreateItemPool`, `CreateMinimapIcon`, `CreateMinimapIconOnUnit`, `CreateTextTag`, `CreateTrackable`, `CreateSound`, `CreateSoundFilenameWithLabel`, `CreateSoundFromLabel`, `CreateMIDISound`, `TerrainDeformCrater`, `TerrainDeformRipple`, `TerrainDeformWave`, `TerrainDeformRandom`, `AddSpecialEffect` and `CreateBlightedGoldmine`. A `?.` or `!` on their result is no longer needed.

The 108 constructors the sweep measured carry a `@remarks` with what was measured. The 62 that stay `| undefined` for a case that returned nothing name those cases, such as a removed location or rect, a destroyed trigger or dialog, an unknown unit, item or destructable rawcode, or an unknown frame name, or that crashed the game (`CreateFogModifierRadius`, `CreateFogModifierRadiusLoc` and `CreateImage` with a radius or image type of `2147483647`).

`Force.fromPlayer` adds no player when it throws: before, in Dev mode, a Guard that raised (a call before the globals Init stage or inside `MapPlayer.runLocal`) left the player added to a force the game had created.
