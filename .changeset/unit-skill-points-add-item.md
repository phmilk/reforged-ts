---
"reforged-ts": major
"reforged-test": minor
---

`Unit.skillPoints = n` sets the hero's unspent skill points to `n`, where it added `n` before; `Unit.modifySkillPoints` still adds. `Unit.addItemById` returns the item it created when the inventory has no room, the item then lying at the unit's feet, where it threw before: it calls `CreateItem` and `UnitAddItem` instead of `UnitAddItemById`, which returns nothing for that item, and still throws for a removed unit. The test harness stubs `GetUnitX`, `GetUnitY`, `UnitAddItem`, `UnitModifySkillPoints` and `GetHeroSkillPoints`.
