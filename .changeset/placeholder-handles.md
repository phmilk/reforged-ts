---
"reforged-types": minor
"reforged-ts": patch
---

`TriggerAddAction` now returns `triggeraction | undefined`, no longer `triggeraction`: on a destroyed trigger the game returns a placeholder handle of id 0 in place of nothing, and a later Patch may return nothing there. Check its result for `undefined` where you call it directly. Six more constructors that fail the same way stay `| undefined`: `CreateCommandButtonEffect` (an unknown order), `CreateMinimapIconAtLoc` (a removed location), `AddWeatherEffect` (an unknown effect rawcode, id -1, or a removed rect), `AddLightning` and `AddLightningEx` (an unknown code name, or `checkVisibility` with points the player cannot see) and `CreateUbersplat` (an unknown name, id -1). The `@remarks` of all seven name the cases that gave the placeholder, which a nil check does not catch on 3.0.0.24268.

`Trigger.addAction` keeps nothing for `removeAction` when `TriggerAddAction` returns nothing, and still returns the Trigger.
