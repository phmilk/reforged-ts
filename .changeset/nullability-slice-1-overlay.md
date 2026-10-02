---
"reforged-types": minor
"reforged-ts": patch
---

`BlzFrameGetParent` now returns `framehandle | undefined`: the Nullability sweep saw it return nothing for a destroyed frame on 3.0.0.24268. Check its result before you use it, as `Frame.getParent()` already does. Sixteen more Natives keep their non-null return, now backed by the sweep: `CreateTimer`, `CreateTrigger`, `CreateRegion`, `CreateCameraSetup`, `GetLocalPlayer`, `Location`, `Rect`, `Condition`, `Filter`, `And`, `Or`, `Not`, `GetOwningPlayer`, `GetUnitLoc`, `CameraSetupGetDestPositionLoc` and `TriggerAddAction`. Each carries a `@remarks` with the cases measured. `Trigger.addAction` drops a check for a `nil` the game never returned.
