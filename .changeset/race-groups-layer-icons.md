---
"reforged-studio": patch
---

The tree's race groups read Human, Orc, Undead and Night Elf: `GameData.text` resolves a `WESTRING_` key whose value is another key through that key, as the editor strings label the races (`WESTRING_UE_UNITRACE_HUMAN=WESTRING_RACE_HUMAN`), and gives none for a key that leads back to itself. The objects whose icon the profile files give under an art layer's keys only, such as the Dragonhawk Rider, the Priest and the Sorceress (`Art:sd`, `Art:hd`, no `Art`), show their icon: `GameObject.layerValues` holds the values of each art layer's own keys, DE taking HD's where it has none, and `ListedObject.layerIcons` the icon's path in each art layer, which the page shows in the session's layer.
