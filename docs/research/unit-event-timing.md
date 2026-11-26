# Which unit Natives fire their event inside the call

Whether `KillUnit`, `RemoveUnit`, `SetUnitOwner` and `UnitAddItem` fire their event before they return, measured for [#938](https://github.com/phmilk/reforged-ts/issues/938), a ticket of the wayfinder map [#931](https://github.com/phmilk/reforged-ts/issues/931). It decides which Native stubs of `reforged-test` dispatch through the Event dispatch ([#933](https://github.com/phmilk/reforged-ts/issues/933)). A lethal `UnitDamageTarget`, `UnitAddItemById` and `UnitRemoveItem` were measured in the same run.

## TL;DR

Everything below is Observed, in one run.

| Native                                     | Its event                                                                        | When                                  |
| ------------------------------------------ | -------------------------------------------------------------------------------- | ------------------------------------- |
| `KillUnit`, a live unit                    | widget death, `EVENT_PLAYER_UNIT_DEATH`, `EVENT_UNIT_DEATH`                      | synchronous, in that order            |
| `KillUnit`, a dead unit                    | none                                                                             | no event                              |
| `UnitDamageTarget`, lethal                 | the two damaging events, the two damaged events, then the three death events     | synchronous, in that order            |
| `RemoveUnit`, a live or a dead unit        | none inside the call; later, the widget death (`TriggerRegisterDeathEvent`) only | deferred, and no unit or player event |
| `SetUnitOwner`, another player             | `EVENT_PLAYER_UNIT_CHANGE_OWNER` of the **new** owner, `EVENT_UNIT_CHANGE_OWNER` | synchronous, in that order            |
| `SetUnitOwner`, the same player            | none                                                                             | no event                              |
| `UnitAddItem`, a unit with an inventory    | `EVENT_PLAYER_UNIT_PICKUP_ITEM`, `EVENT_UNIT_PICKUP_ITEM`                        | synchronous, in that order            |
| `UnitAddItem`, an item the unit carries    | the two drop events, then the two pickup events                                  | synchronous, in that order            |
| `UnitAddItem`, a unit without an inventory | none; it returns `false`                                                         | no event                              |
| `UnitAddItemById`                          | the two pickup events, before it returns the item                                | synchronous                           |
| `UnitRemoveItem`                           | `EVENT_PLAYER_UNIT_DROP_ITEM`, `EVENT_UNIT_DROP_ITEM`                            | synchronous, in that order            |

- **A Trigger's condition runs before its action, and both run inside the call**, for every synchronous event above.
- **`RemoveUnit` removes nothing before it returns**: on the line after it, `UnitAlive` of a live unit is still `true` and its life 420. The unit's widget death fires later, with life 0, and for a unit that was already dead it fires a second time.
- **The state is written before the event**, except for a drop: in a death handler the unit is dead (`UnitAlive` `false`, life 0), in a change-owner handler `GetOwningPlayer` is the new owner, in a pickup handler `UnitHasItem` is `true`; in a drop handler `UnitHasItem` is still `true`, and `false` once the Native returned. In the damaging and damaged handlers the life is still the one before the damage.

## The run

- Probe: `probe/probes/unit-event-timing.ts`, on this branch.
- Run `e5b1e37c-9f90-449f-97aa-94d622d08864`, 2026-11-26, `finished`, 147 records.
- Typings of Patch 3.0.1.24370; client on Build 3.0.1.24371, accepted with `--client-build 3.0.1.24371` (a hotfix of the same Game version, `probe/README.md`, "Running a Probe run").
- Command: `pnpm probe:run unit-event-timing --client-build 3.0.1.24371`.

The Probe registers, before any case:

- for `Player(0)` and `Player(1)`, one Trigger per player unit event (`TriggerRegisterPlayerUnitEvent`): death, decay, hidden, deselected, change owner, pickup item, drop item, use item, damaging, damaged;
- for every unit it creates, one Trigger per unit event (`TriggerRegisterUnitEvent`): death, decay, hidden, change owner, pickup item, drop item, damaging, damaged; and one widget death Trigger (`TriggerRegisterDeathEvent`).

Every Trigger has a condition and an action. Each records, when it runs, whether the Native of the case is still running, its place among all firings, and what the response Natives answer. Every unit belongs to `Player(0)` and is created at the map's origin: footmen (`hfoo`, 420 life), a knight (`hkni`), a paladin (`Hpal`) for the inventory; the items are Claws of Attack (`ratc`). Each case reads the state on the line after the Native returns. A last record, 3 seconds later, counts what fired after a return.

## The firings, per case

"Inside" is the number of firings before the Native returned, conditions and actions counted apart (two per Trigger).

| Case                                                               | Inside | The Triggers, in the order they fired                                                                                                                                                                   | After the return                                                                |
| ------------------------------------------------------------------ | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `KillUnit(live)`                                                   | 6      | widget death; `EVENT_PLAYER_UNIT_DEATH` of player 0; `EVENT_UNIT_DEATH`                                                                                                                                 | `UnitAlive` `false`, life 0                                                     |
| `KillUnit(dead)`, the same unit again                              | 0      | none                                                                                                                                                                                                    | unchanged                                                                       |
| `UnitDamageTarget(knight, footman, 10000, attack, normal, normal)` | 14     | `EVENT_PLAYER_UNIT_DAMAGING` of player 0; `EVENT_UNIT_DAMAGING`; `EVENT_PLAYER_UNIT_DAMAGED` of player 0; `EVENT_UNIT_DAMAGED`; widget death; `EVENT_PLAYER_UNIT_DEATH` of player 0; `EVENT_UNIT_DEATH` | returned `true`; `UnitAlive` `false`, life 0                                    |
| `RemoveUnit(live)`                                                 | 0      | none                                                                                                                                                                                                    | `UnitAlive` `true`, life 420, owner 0, on the next line; the widget death later |
| `RemoveUnit(dead)`, a unit killed first                            | 0      | none                                                                                                                                                                                                    | `UnitAlive` `false`, life 0; the widget death later, a second time              |
| `SetUnitOwner(footman, Player(1), true)`                           | 4      | `EVENT_PLAYER_UNIT_CHANGE_OWNER` of player 1; `EVENT_UNIT_CHANGE_OWNER`                                                                                                                                 | owner 1                                                                         |
| `SetUnitOwner(footman, Player(0), true)`, its owner                | 0      | none                                                                                                                                                                                                    | owner 0                                                                         |
| `UnitAddItem(paladin, claws)`                                      | 4      | `EVENT_PLAYER_UNIT_PICKUP_ITEM` of player 0; `EVENT_UNIT_PICKUP_ITEM`                                                                                                                                   | returned `true`; `UnitHasItem` `true`                                           |
| `UnitAddItem(paladin, claws)`, the item it carries                 | 8      | `EVENT_PLAYER_UNIT_DROP_ITEM` of player 0; `EVENT_UNIT_DROP_ITEM`; `EVENT_PLAYER_UNIT_PICKUP_ITEM` of player 0; `EVENT_UNIT_PICKUP_ITEM`                                                                | returned `true`                                                                 |
| `UnitAddItem(footman, claws)`, no inventory                        | 0      | none                                                                                                                                                                                                    | returned `false`; `UnitHasItem` `false`                                         |
| `UnitAddItemById(paladin, 'ratc')`                                 | 4      | `EVENT_PLAYER_UNIT_PICKUP_ITEM` of player 0; `EVENT_UNIT_PICKUP_ITEM`                                                                                                                                   | returned the item; `UnitHasItem` `true`                                         |
| `UnitRemoveItem(paladin, claws)`                                   | 4      | `EVENT_PLAYER_UNIT_DROP_ITEM` of player 0; `EVENT_UNIT_DROP_ITEM`                                                                                                                                       | `UnitHasItem` `false`                                                           |

No Trigger of `Player(1)` fired for a unit of `Player(0)`, and none of `Player(0)` fired for the unit that changed owner: the change-owner event belongs to the new owner. No decay, hidden, deselected or use-item event fired in any case.

After the returns, within the 3 seconds, two things fired:

- the widget death of the two removed units (four firings), before anything else: `GetTriggerUnit` is the removed unit, `UnitAlive` `false`, life 0, `GetOwningPlayer` still player 0. No `EVENT_UNIT_DEATH` and no `EVENT_PLAYER_UNIT_DEATH` came with it;
- 80 damaging and damaged firings of a fight: the footman given to `Player(1)` stood among the units of `Player(0)`, and they attacked each other. They are the Probe's own doing, not a deferred event of a case.

## What the response Natives answer in a handler

The same in the condition and in the action. "nil" is `nil`; a Native not listed for an event answered `nil` there. `GetTriggerEventId` is the registered event in every handler.

| Event                                                       | `GetTriggerUnit` | `GetTriggerPlayer` | The event's own responses                                                                                    | The unit's state in the handler                          |
| ----------------------------------------------------------- | ---------------- | ------------------ | ------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------- |
| widget death (`TriggerRegisterDeathEvent`)                  | the dying unit   | nil                | `GetDyingUnit` nil, `GetKillingUnit` nil, also under a lethal `UnitDamageTarget`                             | `UnitAlive` `false`, life 0                              |
| `EVENT_PLAYER_UNIT_DEATH`, `EVENT_UNIT_DEATH`               | the dying unit   | its owner          | `GetDyingUnit` the unit; `GetKillingUnit` nil under `KillUnit`, the damage's source under `UnitDamageTarget` | `UnitAlive` `false`, life 0                              |
| `EVENT_PLAYER_UNIT_DAMAGING`, `EVENT_UNIT_DAMAGING`         | the target       | its owner          | `GetEventDamage` 10000, the amount passed                                                                    | `UnitAlive` `true`, life 420, the life before the damage |
| `EVENT_PLAYER_UNIT_DAMAGED`, `EVENT_UNIT_DAMAGED`           | the target       | its owner          | `GetEventDamage` 8928.571, the amount after the footman's armor                                              | `UnitAlive` `true`, life 420, the life before the damage |
| `EVENT_PLAYER_UNIT_CHANGE_OWNER`, `EVENT_UNIT_CHANGE_OWNER` | the unit         | the new owner      | `GetChangingUnit` the unit; `GetChangingUnitPrevOwner` the previous owner                                    | `GetOwningPlayer` the new owner                          |
| `EVENT_PLAYER_UNIT_PICKUP_ITEM`, `EVENT_UNIT_PICKUP_ITEM`   | the unit         | its owner          | `GetManipulatingUnit` the unit; `GetManipulatedItem` the item                                                | `UnitHasItem` `true`                                     |
| `EVENT_PLAYER_UNIT_DROP_ITEM`, `EVENT_UNIT_DROP_ITEM`       | the unit         | its owner          | `GetManipulatingUnit` the unit; `GetManipulatedItem` the item                                                | `UnitHasItem` `true`: the item leaves after the handlers |

`GetTriggerWidget`, `GetEventDamageSource`, `GetEventDamageTarget` and the other damage responses were not read.

## What this settles for the Event dispatch

- `KillUnit`, `SetUnitOwner`, `UnitAddItem`, `UnitAddItemById` and `UnitRemoveItem` fire synchronously: their stubs can dispatch inside the call, as `UnitDamageTarget`'s does for damage, and a lethal `UnitDamageTarget` dispatches the death after the damage, with the source as `GetKillingUnit`.
- Each of them fires nothing when the game refuses or has nothing to do: a dead unit killed, an owner set to itself, an item added to a unit without an inventory.
- `RemoveUnit` dispatches no unit and no player event; the only firing is the widget death, after the call. A stub that dispatched a death on `RemoveUnit` would be wrong.
- A dispatch runs each Trigger's condition, then its actions, before the next Trigger.

## Limits

- One run, on one Build, in single player.
- **The order between registrations is the one measured, not a rule proved**: the player's Triggers were registered before the unit's, and fired before them, so the run cannot tell "player events first" from "in registration order". The widget death Trigger was registered last for its unit and fired first, so that one is the game's order.
- When the deferred widget death of `RemoveUnit` fires was not timed: after the Probe's `run` returned and before the first damage of the fight, so within about a second.
- `KillUnit` and `RemoveUnit` were measured on a footman; a hero, a building or a unit with a death ability may differ.
