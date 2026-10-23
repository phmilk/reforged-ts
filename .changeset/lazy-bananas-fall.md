---
"reforged-map": minor
---

Add Object sync and the Object manifest: `syncObjectDefinitions` writes a Map project's Object definitions into its map folder in the Editor form, adding, changing and removing the objects the code owns, with a warning when a removed Custom object's placements are dropped, and records them in `object-manifest.json` at the Map project's root, written byte-stably. It refuses while the World Editor shows unsaved edits for the map, and warns to reload it there when it has the map open. `mergeObjectDefinitions` now reads the manifest: a definition replaces an owned object and an owned object no definition defines is removed from the staged copy. `ObjectDefinitionsError` gains the reason `"manifest-unreadable"`.
