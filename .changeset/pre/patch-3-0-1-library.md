---
"reforged-ts": minor
---

Support Patch 3.0.1.24370: the library compiles against `reforged-types/3.0.1`.

- `Unit#heal(source, amount, isItem, applyStatBonuses)` restores life and returns the life restored (`BlzUnitHeal`).
- `Unit#resetTalents()` resets a hero's talents and refunds its talent points (`BlzResetUnitTalents`).
- `Effect#remove()` removes an effect at once, without the death animation `destroy()` plays (`BlzRemoveEffect`).
- `Unit#isAlive()` calls `BlzUnitIsAlive`, of `common.j`, instead of `UnitAlive`, of `common.ai`; both answered alike in every case measured.
- The equipment members of `Unit` and `Item` call the `Blz` Natives Patch 3.0.1 added in place of the unprefixed ones, which the Patch notes say a future Patch removes: their names and behaviour are unchanged. `Item#equipmentType` and `Item#tag` still never return `undefined`.
