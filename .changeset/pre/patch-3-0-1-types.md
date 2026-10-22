---
"reforged-types": minor
---

Declare Patch 3.0.1.24370 as the Game version `3.0.1`, next to `3.0.0`: list `reforged-types/3.0.1` in `types` to compile against it. It adds 31 Natives to `common.j` (the `Blz` equipment Natives, `BlzUnitHeal`, `BlzUnitIsAlive`, `BlzResetUnitTalents`, `BlzRemoveEffect`, `BlzGetHUDScale` and `BlzGetCameraAllowsHotkeyTargetLock` among them, the last two `@async`), 133 ability field constants, and 8 functions and 2 globals to `blizzard.j`. `BlzGetItemEquipmentType` and `BlzGetItemTag` never return `undefined`, as the Nullability sweep found on Patch 3.0.1.24370 (client 3.0.1.24371).

Breaking for code that moves its `types` entry from `3.0.0` to `3.0.1`: `blizzard.j` renamed `bj_destroyEffectAsyncEffect` and `bj_destroyEffectAsyncTime` to `bj_destroyOrRemoveEffectAsyncEffect` and `bj_destroyOrRemoveEffectAsyncTime`, and `BlzSetTerrainFogStyleBJ` takes its style as a `number` instead of a `fogstyle`. The `3.0.0` entry is unchanged.
