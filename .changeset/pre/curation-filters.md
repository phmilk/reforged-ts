---
"reforged-types": patch
---

The 16 Natives that take a `filter` outside the trigger registrations (`GroupEnumUnitsInRange`, `ForceEnumPlayers`, `EnumItemsInRect`, ...) carry a `@remarks` with what the Nullability sweep measured on 3.0.0.24268: a nil filter is accepted, and in 15 of them it keeps every unit, player, item or destructable an always-true filter keeps (`ForceEnumEnemies` found no enemy to compare on the sweep's one-player map). Their `filter` parameters still accept `undefined`.
