---
"reforged-test": minor
---

The Dispatching Natives answer as a Probe run measured the game (`docs/research/dispatching-natives.md`). `UnitRemoveItemFromSlot` is a Dispatching Native: on a filled slot it dispatches `EVENT_PLAYER_UNIT_DROP_ITEM` and `EVENT_UNIT_DROP_ITEM` inside the call, the item still in its slot in the handler, and returns the item; an empty slot fires nothing and returns nil. It fires those Triggers on `reforged-test/lua` too. `UnitAddItemById` returns nil for a unit without an inventory (one whose `UnitInventorySize` the test answers 0), where it returned the item.
