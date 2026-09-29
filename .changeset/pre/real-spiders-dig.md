---
"reforged-ts": patch
---

Check the UnitEvents table by the shape of its entries: a row may have a name ending in `Of`, a twin names exactly one row and is keyed after it, and `UnitEvents` raises an error when two groups give the same name.
