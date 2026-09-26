---
"reforged-test": minor
---

Stubs and constants for the 3.0.0 systems, so a test can call the equipment, destructable, colour, input, camera and pathing members on the harness and see the calls they made.

- **Equipment converters** (`items.lua`): `ConvertEquipmentType`, `ConvertItemTag` and `ConvertLoadoutSlot` are recorded and return one cached sentinel per integer, as in the game. The named constants `EQUIPMENT_TYPE_*` (0 to 9), `ITEMTAG_TYPE_*` (0 to 8) and `EQUIPMENT_LOADOUT_SLOT_*` (0 to 8, `RINGALT` 5 included) are those sentinels, so `ConvertEquipmentType(1)` is `EQUIPMENT_TYPE_HEAD`. An integer with no named constant gets a distinct sentinel rendered as `ConvertEquipmentType(42)`, which is how a test builds an unknown value. The README explains the sentinel rule.
- **Destructable constructors** (`destructables.lua`): all 32 creation Natives of the Patch, the 28 new ones being the dead, Z, pitch-roll, with-skin and with-colour families and their combinations. Each records one argument per parameter in the Native's order and returns a new destructable.
- **Constant families**, opaque values rendered by name: `PLAYER_COLOR_*` (`PLAYER_COLOR_BLACK` included) and `RACE_PREF_*` (`RACE_PREF_FORSAKEN` included) in `players.lua`; `ITEM_TYPE_*` (`ITEM_TYPE_EQUIPMENT` included, `ITEM_TYPE_TOME` being `ITEM_TYPE_POWERUP`) in `items.lua`; `CAMERA_FIELD_*` in `cameras.lua`; `MOUSE_BUTTON_TYPE_*` in `triggers.lua`; `PATHING_TYPE_*` in `terrain.lua`, a new family.
