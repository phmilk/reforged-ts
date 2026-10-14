---
"reforged-map": minor
---

The Rawcode lookup reads the map's Game data set from `war3map.w3i` (its Game Data Set, Game Data Version and "Melee Map" flag, in the formats wc3libs reads, 39 the 3.0 World Editor's) and returns a Built-in object that set does not hold as `not-in-game-data-set`, with the map's set. `warnings()` gives the warnings of reading the map folder: a missing, truncated or unknown-format `war3map.w3i` gives one, and the check is then skipped.
