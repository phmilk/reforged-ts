---
"reforged-ts": patch
---

The `UnitEvents` table tells a twin from a row by its shape: an entry with `twinOf` is a twin, and must be keyed after the row it names (`attackedOf` for `twinOf: "attacked"`); any other entry is a row, whatever its name, one ending in `Of` included. `UnitEvents` keeps the same members, types and behavior.
