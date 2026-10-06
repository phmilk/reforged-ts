---
"reforged-types": major
"reforged-ts": major
---

A Rawcode the game returns carries its Object kind into the next call: `GetSpellAbilityId` returns a `Rawcode<"ability">`, `GetResearched` a `Rawcode<"upgrade">`, `GetItemTypeId` and `ChooseRandomItem` a `Rawcode<"item">`, and `BlzGetUnitSkin` a `Rawcode<"unit">`, so `CreateUnit(p, GetUnitTypeId(u), x, y, f)` compiles and `UnitAddAbility(u, GetUnitTypeId(v))` does not. The Rawcode globals carry their kind too: `common.ai`'s `FOOTMAN` is a `Rawcode<"unit">` and `HOLY_BOLT` a `Rawcode<"ability">`, so `SetProduce(1, FOOTMAN, town)` still compiles in an AI script. A returned Rawcode widens to `number` for arithmetic and comparisons. In the library, `unit.typeId`, `unit.skin`, `item.typeId`, `item.skin`, `destructable.typeId`, `Item.chooseRandomWithFilter` and the payloads of the spell, research and hero skill events carry their kind.
