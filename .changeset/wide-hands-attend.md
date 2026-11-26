---
"reforged-test": minor
---

The Dispatching Natives fire their events inside the call, as the game does: `KillUnit` (the widget death, the player unit death and the unit death, the unit already dead), `SetUnitOwner` (the change of owner of the new owner, then the unit's), `UnitAddItem` and `UnitAddItemById` (the pickup; for an item the unit carries, the drop first) and `UnitRemoveItem` (the drop, the item still carried in the handler), each firing nothing where the game fires nothing. A chain of handlers runs in a test as it runs in the game, with no manual fire. `KillUnit`, `SetUnitOwner`, `UnitRemoveItem`, `UnitHasItem`, `UnitInventorySize` (6) and `UnitAlive` get a Shipped stub; after a death `GetWidgetLife` and `GetUnitState(UNIT_STATE_LIFE)` answer 0, and a live unit's life is an error that asks for `stubNative`, as the stubs keep no hit points. A unit whose `UnitInventorySize` the test answers 0 has no inventory: `UnitAddItem` returns false and nothing fires. `GetDyingUnit` and `GetManipulatingUnit` answer from the Firing context.

**Behaviour change on `reforged-test/lua` too:** these Natives fire the Triggers registered for their events there as well. A library test that registers a death, change-owner, pickup or drop Trigger and then calls one of them now sees it run inside the call.
