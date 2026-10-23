---
"reforged-map": minor
---

Object adoption: `adoptObjects(mapFolder, projectRoot, rawcodes | "all", options)` hands objects of the map folder to the code, what `pnpm objects:adopt` runs. Each Custom object, or Built-in object the map folder changes, gets a definition file `src/objects/<kind>/<Name>_<rawcode>.ts` holding its Rawcode, its base and every modification the map folder holds (strings as their text, flags as booleans, references as `FourCC`, levelled fields by level, unknown fields through the raw escape with a warning), and an owned entry in the Object manifest with its current snapshot, so that the next Object sync writes no byte. The map folder is never written. A Rawcode two kinds share is named with its kind, `buff:B000`. `ObjectDefinitionsError` gains the reasons `"not-adoptable"` and `"target-exists"`; unsaved edits in the World Editor refuse it with `ObjectDataWriterError` `"modified-in-world-editor"`, unless `force`.
