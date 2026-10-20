---
"reforged-map": minor
---

`openObjectData(mapFolder, { projectRoot })` opens a map folder's Object data for a tool that edits it: `objects(kind)` lists its objects as the Object Editor shows them, base and Skin files merged and names resolved, and `save(folder)` saves it to the map folder or to another folder, byte for byte (every Object data file, Skin file and `war3map.wts` comes back with the same bytes when nothing was edited). A save refuses with an `ObjectDataWriterError` of reason `"changed-on-disk"` when a file it would rewrite changed since it was read. The package now reads and writes Object data, and only reads the rest of the map folder (ADR 0015).
