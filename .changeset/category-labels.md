---
"reforged-studio": patch
---

The Destructibles and Doodads trees group their objects under the World Editor's labels, Trees/Destructibles, Bridges/Ramps, Pathing Blockers, Props and the others, instead of the raw category codes (`D`, `B`, `P`, `O`), and the field table's Category (`bcat`, `dcat`) shows the same label. The labels come from `[DestructibleCategories]` and `[DoodadCategories]` of `UI/WorldEditData.txt`: `GameData.enumeration("destructableCategory")` and `GameData.enumeration("doodadCategory")` give them, and the category fields carry them as their enumeration.
