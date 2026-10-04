---
"reforged-types": patch
---

The 56 lookups measured by the Nullability sweep (`FirstOfGroup`, `UnitItemInSlot`, `Player`, the `Load*Handle` functions, ...) carry a `@remarks` with what was measured on 3.0.0.24268: 47 returned nothing when nothing was found (an empty group, an empty slot, an index out of range, an unsaved key); 9 returned a handle rather than nothing, so a nil check does not tell that nothing was found: the 8 `Load*Handle` of a type that extends `handle` (`LoadTriggerActionHandle`, `LoadUnitPoolHandle`, `LoadImageHandle`, ...) return a handle of id 0 for an unsaved key, and `MultiboardGetItem` returns a multiboard item for a cell outside the board. Their types stay `| undefined`.
