---
"reforged-map": minor
---

`generateObjects` reads the Custom objects of every Object kind ([#585](https://github.com/phmilk/reforged-ts/issues/585)): items (`war3map.w3t`), abilities (`.w3a`), buffs (`.w3h`), destructables (`.w3b`), doodads (`.w3d`) and upgrades (`.w3q`), with their `war3mapSkin` counterparts, join the units. Each gets its `FourCC` overload, typed by its kind, and its constant in its kind's module: `CustomItems`, `CustomAbilities`, `CustomBuffs`, `CustomDestructables`, `CustomDoodads` and `CustomUpgrades`, so `UnitAddAbility(u, CustomAbilities.FrostStorm_A000)` compiles and a Custom item where a unit is expected does not. Names follow the Object Editor as `reforged-builtins` does: a buff without an editor name is named by its tooltip's title, and an upgrade by its first level's name.
