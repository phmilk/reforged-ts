---
"reforged-ts": patch
---

`File.read` now reads back a file whose contents equal the icon path of the `Amls` ability (`ReplaceableTextures\CommandButtons\BTNMagicLariet.blp`). It used to return `undefined` for such a file, as for a missing one. A read now sets that icon to a sentinel no file written by `File.write` can hold, so it tells any contents from a missing file, and puts the original icon back afterwards.
