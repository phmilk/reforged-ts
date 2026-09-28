---
"reforged-ts": patch
---

Every public member of `Item`, and each member of `EquipmentType`, `ItemTag` and `LoadoutSlot`, has a doc comment: what it does, its parameters with their units, what it returns (a lookup says when it is `undefined`), the error `Item.create` raises and the Natives and game constants behind it. The class comment of `Item` includes a compiled example. `item.icon` no longer carries `@async`: `BlzGetItemIconPath` is not an async Native. The comments ship in the `.d.ts` files, so the editor's hover shows them.
