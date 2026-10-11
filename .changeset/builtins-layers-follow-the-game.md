---
"reforged-builtins": major
---

The Game data sets follow the layers the game reads, measured in game on 3.0.0.24268 ([#575](https://github.com/phmilk/reforged-ts/issues/575)). A map's objects depend on its Game Data Version as well as its Game Data Set, so the index now has one Game data set per pair: `custom-fk`, `melee-fk`, `custom-tft`, `melee-tft`, `custom-roc` and `melee-roc`, in place of `default`, `custom` and `melee`. Each set reads `_Balance/<Set>_V<version>` where the install has that layer, else the base layer, and leaves out the units, items and abilities of a later Game Data Version. Default has no set of its own, since it reads Custom on a map that is not a melee map.

A map of Forsaken Kingdom, which the World Editor gives a new map, holds every object whatever its set, so the hover of an object such as `Units.GuardLieutenant_Hct1` no longer says it is missing from Custom and Melee. A tool that reads `index.json` finds the new ids in `gameDataSets` and in each object's `sets`.

`Items.Unnamed_spur` is removed: the item is in no set the game reads. Only Reign of Chaos layers list it, and a Reign of Chaos map leaves it out, since it belongs to The Frozen Throne.
