---
"reforged-types": major
---

Declare the Rawcode types as globals, through the `types` entry a Map project already lists: `Rawcode<K>`, a Rawcode of the Object kind `K` (`Rawcode<"unit">`, `Rawcode<"unit" | "upgrade">`, `Rawcode` alone for any kind), `ObjectKind` and `UnknownRawcode`. `FourCC` returns `UnknownRawcode`, which every Rawcode accepts and which widens to `number`: a variable initialised with `FourCC("hfoo")` and later assigned a plain `number` needs a `number` annotation. No Native takes or returns a `Rawcode` yet.
