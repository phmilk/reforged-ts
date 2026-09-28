---
"reforged-ts": patch
---

`File.read` now reads back a file whose contents equal the icon path of the `Amls` ability (`ReplaceableTextures\CommandButtons\BTNMagicLariet.blp`). It used to return `undefined` for such a file, as for a missing one; a missing file still reads `undefined`.
