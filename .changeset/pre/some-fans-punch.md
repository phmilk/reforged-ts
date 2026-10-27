---
"reforged-map": minor
---

Object release: `releaseObjects(mapFolder, projectRoot, rawcodes, options)` hands objects the code owns back to the map folder, what `pnpm objects:release` runs. Object sync runs for those objects only, so that each is left in the map folder as the code last defined it, its placements kept; then the Object manifest drops them, with no removed entry, and their definition files are deleted. Each Rawcode must be owned and defined, its definition the only one of its file; a Rawcode two kinds share is named with its kind, `buff:B000`. `ObjectDefinitionsError` gains the reason `"not-releasable"`; a released object changed outside the code refuses with `"changed-outside-code"` unless `force`, and unsaved edits in the World Editor refuse it with `ObjectDataWriterError` `"modified-in-world-editor"`, `force` or not. Given `worldEditorExecutable`, it reloads a World Editor holding the map after writing, as Object sync does.
