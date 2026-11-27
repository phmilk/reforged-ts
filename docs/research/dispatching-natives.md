# Five facts of the Dispatching Natives

Five facts the Shipped stubs of the Dispatching Natives rested on with no Probe run behind them, measured for [#982](https://github.com/phmilk/reforged-ts/issues/982), a Ticket of the Spec [#970](https://github.com/phmilk/reforged-ts/issues/970). They complete [Which unit Natives fire their event inside the call](unit-event-timing.md), whose run did not read them.

## TL;DR

Everything below is Observed, in one run.

| Fact                                                                  | The game                                                                                                                                  | The Shipped stub before this run |
| --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| One unit event, a Trigger on the player's event and one on the unit's | the player's runs first, whichever was registered first and whichever was created first; the widget death runs before both                | the same                         |
| `UnitAddItemById`, a unit without an inventory                        | returns `nil`; the item is made all the same and left on the ground; no event                                                             | **returned the item**            |
| `UnitRemoveItem`, an item the unit does not carry                     | no event, and nothing moves: an item on the ground stays there, an item another unit carries stays with it                                | the same                         |
| `UnitRemoveItemFromSlot`, a filled slot                               | returns the item; `EVENT_PLAYER_UNIT_DROP_ITEM`, then `EVENT_UNIT_DROP_ITEM`, inside the call, the item still in its slot in the handlers | **fired nothing**                |
| `UnitRemoveItemFromSlot`, an empty slot                               | returns `nil`; no event                                                                                                                   | the same                         |
| `GetTriggerWidget` in a handler of the widget's death                 | the dying unit in the widget death (`TriggerRegisterDeathEvent`); `nil` in `EVENT_PLAYER_UNIT_DEATH` and in `EVENT_UNIT_DEATH`            | the same                         |

- **The two disagreements are fixed in the Shipped stubs** by the pull request of #982: `UnitAddItemById` returns `nil` for a unit without an inventory, and `UnitRemoveItemFromSlot` is a Dispatching Native, which dispatches the drop as `UnitRemoveItem` does.
- **A unit read as a `widget` is another Lua value than the unit**, equal to it by `==` and not by `rawequal`, so it does not find the unit's entry in a table. The run was not made for this, and the Shipped stubs answer the unit itself: see [A unit read as a widget](#a-unit-read-as-a-widget).

## The run

- Probe: `probe/probes/dispatching-natives.ts`.
- Run `e1ea76a2-ca1f-4a62-9e24-ec5f0c806238`, 2026-11-26, `finished`, 71 records.
- Typings of Patch 3.0.1.24370; client on Build 3.0.1.24371, accepted with `--client-build 3.0.1.24371` (a hotfix of the same Game version, `probe/README.md`, "Running a Probe run").
- Command: `pnpm probe:run dispatching-natives --client-build 3.0.1.24371`.

Two earlier runs of the Probe, before it read the item left on the ground (`8858367f-b38e-4d40-be02-0b89ca0726d2`, 70 records) and before it read a unit as a widget from a hashtable (`0919aaa9-05d5-444b-bd09-c5558595db81`, 70 records), gave the same answer in every case they share with this one.

Every unit belongs to `Player(0)` and is created at the map's origin: footmen (`hfoo`), whose `UnitInventorySize` is 0, and paladins (`Hpal`), whose `UnitInventorySize` is 6. The items are Claws of Attack (`ratc`). Every Trigger has a condition that answers `true` and an action.

## The order of the player's and the unit's event

Each case creates one Trigger per registration, registers them for one event of one new unit, fires the event once with the Native of the table, reads the order the conditions and actions ran in, then destroys its Triggers. The cases vary the order the Triggers were registered in and, for each, the order they were created in: the same as the registration, and its reverse.

| Event                                             | Fired by                           | Registrations                 | Orders tried                                     | Ran, in every case         |
| ------------------------------------------------- | ---------------------------------- | ----------------------------- | ------------------------------------------------ | -------------------------- |
| the death                                         | `KillUnit`                         | player, unit and widget death | the six registration orders, two creation orders | widget death, player, unit |
| the change of owner, registered for the new owner | `SetUnitOwner(footman, Player(1))` | player and unit               | the two registration orders, two creation orders | player, unit               |
| the pickup                                        | `UnitAddItem`                      | player and unit               | the two registration orders, two creation orders | player, unit               |
| the drop                                          | `UnitRemoveItem`                   | player and unit               | the two registration orders, two creation orders | player, unit               |

In each of the 24 cases a Trigger's condition ran before its action, and both before the next Trigger.

- **The player's event runs before the unit's**: `TriggerRegisterPlayerUnitEvent`'s Trigger before `TriggerRegisterUnitEvent`'s, for the four events, in both registration orders and both creation orders. This closes the Limit of [unit-event-timing.md](unit-event-timing.md), whose run registered the player's Triggers first.
- **The widget death runs before both**, wherever its Trigger was registered or created.
- The order between two registrations of the same kind is the registration order, as [trigger-registered-twice.md](trigger-registered-twice.md) measured.

## The other cases

These cases share watchers registered once: for `Player(0)`, one Trigger per player unit event among death, pickup item, drop item, use item, pawn item, sell item and stack item; for each of the four units below, one Trigger per unit event among death, pickup item, drop item and use item, and one widget death Trigger. Each records, when it runs, whether the Native of the case is still running and what the response Natives answer. The units are `footman` and `dying` (footmen), `paladin` and `carrier` (paladins). Each case reads the state on the line after the Native returns. "Inside" counts the firings before the return, conditions and actions apart (two per Trigger).

| Case                                                                 | Inside | The Triggers, in the order they fired                       | Returned | After the return                                                                                     |
| -------------------------------------------------------------------- | ------ | ----------------------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------- |
| `KillUnit(dying)`                                                    | 6      | widget death; `EVENT_PLAYER_UNIT_DEATH`; `EVENT_UNIT_DEATH` |          | `UnitAlive` `false`                                                                                  |
| `UnitAddItemById(footman, 'ratc')`, no inventory                     | 0      | none                                                        | `nil`    | one more item on the map: Claws of Attack, not owned, visible, at (48, 48), the footman at (0, 0)    |
| `UnitAddItem(footman, claws)`, no inventory                          | 0      | none                                                        | `false`  | `UnitHasItem` `false`; the item on the ground, as many items on the map as before                    |
| `UnitAddItemById(paladin, 'ratc')`                                   | 4      | `EVENT_PLAYER_UNIT_PICKUP_ITEM`; `EVENT_UNIT_PICKUP_ITEM`   | the item | `UnitHasItem` `true`, the item in slot 0, owned                                                      |
| `UnitRemoveItem(paladin, ground)`, an item on the ground             | 0      | none                                                        |          | the item not owned, visible, where it was; slot 0 of the paladin unchanged                           |
| `UnitRemoveItem(paladin, others)`, an item `carrier` carries         | 0      | none                                                        |          | `UnitHasItem(carrier, others)` `true`, the item in slot 0 of `carrier`, owned; the paladin unchanged |
| `UnitRemoveItem(footman, ground)`, no inventory                      | 0      | none                                                        |          | the item not owned, visible, where it was                                                            |
| `UnitRemoveItemFromSlot(paladin, 0)`, a filled slot                  | 4      | `EVENT_PLAYER_UNIT_DROP_ITEM`; `EVENT_UNIT_DROP_ITEM`       | the item | `UnitHasItem` `false`, `UnitItemInSlot(paladin, 0)` `nil`, the item not owned, visible               |
| `UnitRemoveItemFromSlot(paladin, 0)`, an empty inventory             | 0      | none                                                        | `nil`    | unchanged                                                                                            |
| `UnitRemoveItemFromSlot(paladin, 1)`, slot 0 filled and slot 1 empty | 0      | none                                                        | `nil`    | the item of slot 0 still carried, in slot 0                                                          |
| `UnitRemoveItemFromSlot(footman, 0)`, no inventory                   | 0      | none                                                        | `nil`    |                                                                                                      |

`UnitAddItem(footman, claws)` and `UnitAddItemById(paladin, 'ratc')` repeat cases of [unit-event-timing.md](unit-event-timing.md), beside the case they are compared with, and answer as they did there.

### `UnitAddItemById` on a unit without an inventory

It returned `nil` and fired nothing. The item exists afterwards: `EnumItemsInRect` over the world bounds found 4 items before the call and 5 after it, and the new one is a Claws of Attack on the ground, not owned and visible, with a life of 75, at (48, 48) while the footman stood at (0, 0). The call leaves the map's code no way to reach that item but an enumeration. The library's `Unit.addItemById` already avoids the Native for this reason (`packages/reforged-ts/src/handles/unit.ts`).

### `UnitRemoveItem` of an item the unit does not carry

Nothing fired, in the three cases, so no handler ran and there is nothing a handler reads. Nothing moved either: the item on the ground stayed at its place, and the item another unit carried stayed in that unit's slot. The Native does not take an item from the unit that carries it when it is given another unit.

### `UnitRemoveItemFromSlot`

On a filled slot it is a drop, as `UnitRemoveItem` of that item is: the two drop events fired inside the call, the player's before the unit's, and it returned the item. In the four firings (two conditions, two actions):

| Response Native or reading              | Answer                                     |
| --------------------------------------- | ------------------------------------------ |
| `GetTriggerUnit`, `GetManipulatingUnit` | the unit                                   |
| `GetTriggerPlayer`                      | its owner                                  |
| `GetManipulatedItem`                    | the item                                   |
| `UnitHasItem(unit, item)`               | `true`: the item leaves after the handlers |
| `UnitItemInSlot(unit, 0)`               | the item                                   |
| `IsItemOwned(item)`                     | `true`                                     |
| `GetTriggerWidget`                      | `nil`                                      |

On an empty slot it returned `nil` and fired nothing: in an empty inventory, beside a filled slot, and on a unit without an inventory.

### `GetTriggerWidget` in the death handlers

Under `KillUnit(dying)`, the same in the condition and in the action:

| Handler                                    | `GetTriggerWidget`            | `GetTriggerUnit` | `GetDyingUnit` |
| ------------------------------------------ | ----------------------------- | ---------------- | -------------- |
| widget death (`TriggerRegisterDeathEvent`) | the dying unit, as a `widget` | the dying unit   | `nil`          |
| `EVENT_PLAYER_UNIT_DEATH`                  | `nil`                         | the dying unit   | the dying unit |
| `EVENT_UNIT_DEATH`                         | `nil`                         | the dying unit   | the dying unit |

`GetTriggerWidget` answered `nil` in every pickup and drop handler of the run too.

## A unit read as a widget

In the widget death handler, `GetTriggerWidget()` and `GetTriggerUnit()` are the same unit and not the same Lua value:

| Reading                                                             | Answer                                         |
| ------------------------------------------------------------------- | ---------------------------------------------- |
| `tostring(GetTriggerWidget())`, `tostring(GetTriggerUnit())`        | `widget: <address>`, `unit: <another address>` |
| `GetTriggerWidget() == GetTriggerUnit()`                            | `true`                                         |
| `rawequal(GetTriggerWidget(), GetTriggerUnit())`                    | `false`                                        |
| `GetHandleId` of each                                               | the same                                       |
| a table keyed by the unit, read with the widget                     | `nil`: the entry is not found                  |
| `GetTriggerWidget()` in the condition and in the action, `rawequal` | `true`                                         |

The same holds with no event, through a hashtable, which stores a Handle under either type: after `SaveUnitHandle` and `SaveWidgetHandle` of one paladin, `LoadUnitHandle` answered the very value of the unit (`rawequal` `true`, and it finds the unit's entry in a table), while `LoadWidgetHandle` answered a `widget: <address>` that is `==` to the unit, not `rawequal` to it, and does not find its entry; two `LoadWidgetHandle` calls answered the same value (`rawequal` `true`).

So a Handle is one Lua value per type it is read as, and the values of one Handle are equal by `==` alone. This is outside the five facts of #982, and the Shipped stubs were left as they are: their `GetTriggerWidget` answers the unit's own value, so a table keyed by the unit is found with it in a test and not in the game. The rule "Handle identity is stable across Natives: a Handle is a safe table key" (`AGENTS.md`, "Runtime constraints") holds for one type only.

## After the returns

Within the 3 seconds after the last case, eight firings came: `EVENT_PLAYER_UNIT_DROP_ITEM` of `Player(0)`, a condition and an action for each of the four paladins of the pickup cases of the order, which the Probe removed with `RemoveUnit` while they carried their item. In them `GetManipulatingUnit` is the removed paladin, `GetManipulatedItem` its item, `UnitAlive` `false`, `UnitHasItem` `false` and `IsItemOwned` `true`. They are the Probe's own doing, the deferred removal of [unit-event-timing.md](unit-event-timing.md) with an item in the inventory; whether the unit's own drop event fires with them was not measured, as those Triggers were destroyed. No case of the tables above fired anything after its return.

## What this settles for the Shipped stubs

- The dispatch of a unit event to the player's registrations, then to the unit's, is the game's order, not an accident of the first Probe's registration order.
- `UnitAddItemById` returns `nil` for a unit without an inventory. The item it makes has no Shipped stub that reads it back.
- `UnitRemoveItem` of an item the unit does not carry does nothing.
- `UnitRemoveItemFromSlot` is a Dispatching Native: the drop of the item in the slot, the item still carried in the handlers, and nothing for an empty slot.
- `GetTriggerWidget` answers the unit in the widget death alone.

## Limits

- One run, on one Build, in single player; the events were fired from the script's own thread, never by an order a player gave.
- The order was measured for the death, the change of owner, the pickup and the drop, on one Trigger per registration; the damage events and every other unit event were not.
- A unit with a full inventory was not measured, for `UnitAddItem` or `UnitAddItemById`; nor a slot out of the inventory's range for `UnitRemoveItemFromSlot`.
- Where `UnitAddItemById` leaves the item was read once: 48 away from the unit on each axis, among other units and items at the origin.
- `GetTriggerWidget` was read for a unit's death under `KillUnit`; the death of an item or of a destructable was not.
- A Handle read as another type was measured for a unit read as a `widget` only.
