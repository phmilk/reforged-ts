---
"reforged-map": patch
"reforged-builtins": patch
---

Object sync, the Object data editor and the build's merge list a locale table in `war3map.imp` with flag `0x1d`, the 3.0.1 World Editor's fixed point (its first save keeps `0x15`, its next one sets `0x1d`), so a World Editor save after a sync leaves the map folder byte for byte: the World Editor contract of Object sync (#713), a map folder synced from definitions of every kind and saved twice by the editor, holds it. A table listed earlier keeps its flag. The READMEs of `reforged-map` and `reforged-builtins` link the new Object definitions guide of the docs site.
