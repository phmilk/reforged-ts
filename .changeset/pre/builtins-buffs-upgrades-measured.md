---
"reforged-builtins": patch
---

The README says how the Game data sets treat buffs, upgrades and doodads, now measured in game ([#622](https://github.com/phmilk/reforged-ts/issues/622)). A map still gives a unit a buff of a later Game Data Version, so every set keeps its buffs. Upgrades follow their layer, which holds none of a later version. Doodads, which no Native creates, stay unmeasured. The objects and their sets do not change.
