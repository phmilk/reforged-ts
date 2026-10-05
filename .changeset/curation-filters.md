---
"reforged-types": patch
---

The 16 Natives that take a `filter` outside the trigger registrations (`GroupEnumUnitsInRange`, `ForceEnumPlayers`, `EnumItemsInRect`, ...) carry a `@remarks` with what the Nullability sweep measured on 3.0.0.24268: a nil filter is accepted and keeps every unit, player, item or destructable an always-true filter keeps. Their `filter` parameters stay optional.
