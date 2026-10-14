---
"reforged-map": minor
---

`generateObjects` names the objects of a map saved by an older World Editor or by another tool ([#587](https://github.com/phmilk/reforged-ts/issues/587)): Object data files of format versions 1 and 2 are read beside version 3, and a levelled modification of an abilities, doodads or upgrades file is read with its value type before its level and data pointer, as the game writes it, so such a file is no longer misread. A coloured or non-ASCII name gives a clean constant: accents are folded and the characters of other scripts dropped.
