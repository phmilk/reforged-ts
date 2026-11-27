# What a selection fires and writes

What the game does when a unit enters or leaves a player's selection: which Triggers fire, in which order, what a handler reads, and what `SelectUnit`, `ClearSelection`, `IsUnitSelected` and `GroupEnumUnitsSelected` do. Measured for [#984](https://github.com/phmilk/reforged-ts/issues/984), a Ticket of the Spec [#970](https://github.com/phmilk/reforged-ts/issues/970). It decides what `game.select` and `game.deselect` of `reforged-test/map` dispatch, and what the selection Natives of the Shipped stubs write.

## TL;DR

Everything below is Observed, in three runs that agree on every step they share. Every selection is the local player's, `Player(0)`, made with `SelectUnit` or `ClearSelection`: no Native selects for another player.

- **`SelectUnit` and `ClearSelection` fire nothing before they return.** The selection events come later, within the 1.5 seconds the Probe waits between two steps.
- **A selection fires `EVENT_PLAYER_UNIT_SELECTED`, then `EVENT_UNIT_SELECTED`**, and a deselection `EVENT_PLAYER_UNIT_DESELECTED`, then `EVENT_UNIT_DESELECTED`: the player's Trigger before the unit's, whichever was registered first. In each Trigger the condition runs before the action, and both before the next Trigger.
- **The player unit event is the selecting player's, not the owner's.** When `Player(0)` selected a unit of `Player(1)`, the Trigger registered for `Player(0)` fired and the one registered for `Player(1)` did not.
- **`GetTriggerPlayer` answers the selecting player in the player unit event, and the unit's owner in the unit event**: `Player(0)`, then `Player(1)`, for that unit of `Player(1)`. `GetTriggerUnit` answers the unit in both, and `GetTriggerEventId` the event the Trigger was registered for.
- **In a selection handler, `IsUnitSelected` already answers `true` and `GroupEnumUnitsSelected` does not hold the unit yet**; after the handlers it does. **In a deselection handler the unit is still selected for both**; after the handlers it is for neither.
- **`IsUnitSelected` and `GroupEnumUnitsSelected` do not read the same thing on the line after the Native.** After `SelectUnit(unit, true)`, `IsUnitSelected` is `true` at once and `GroupEnumUnitsSelected` holds the unit only once the events have fired. After `SelectUnit(unit, false)` and after `ClearSelection`, both still read the unit as selected on the next line, and neither does once the events have fired.
- **`SelectUnit(unit, true)` on a unit already selected fires the two selection events again** and changes nothing. `SelectUnit(unit, false)` on a unit that is not selected, and `ClearSelection` with nothing selected, fire nothing.
- **A dead unit and a removed unit are not selected**: `SelectUnit` on either writes nothing and fires nothing.
- **A unit that dies or is removed while selected leaves the selection without a deselection event**: still selected on the line after `KillUnit` or `RemoveUnit`, gone 1.5 seconds later, with no Trigger fired.
- **`ClearSelection` fires the two deselection events of the unit it takes out.** One unit was selected each time.
- **`GroupEnumUnitsSelected` empties the group first**, then holds the player's selection in the order the units entered it, through its filter: the filter runs once per selected unit, with the unit as `GetFilterUnit`, and the group keeps the units it accepts. For a player who selected nothing the group ends empty.
- **Another player's unit entered the selection in one case of three** ([Another player's unit](#another-players-unit)).

## The runs

- Probe: `probe/probes/selection-events.ts`.
- Run `c95c34a5-ed4c-42bf-8a68-04b5965fe5e8`, 2026-11-27, `finished`, 126 records: the tables below.
- Run `0e936e02-6bc3-4489-8344-1a7fafa84f7e`, 2026-11-27, `finished`, 126 records: the same Probe before two edits that change no call it makes, and the same 126 records, field for field.
- Run `27d249f3-46f5-4259-b423-f941ef8a87a6`, 2026-11-27, `finished`, 96 records: an earlier form of the Probe, without the reading of `GroupEnumUnitsSelected` inside the handlers, the unit `third` and three of the steps. It answers the same in every step it shares with the two others.
- Typings of Patch 3.0.1.24370; client on Build 3.0.1.24371, accepted with `--client-build 3.0.1.24371` (a hotfix of the same Game version, `probe/README.md`, "Running a Probe run").
- Command: `pnpm probe:run selection-events --client-build 3.0.1.24371`.

The run is single-player. Six footmen (`hfoo`) stand in a line: `own`, `dead`, `second`, `removed` and `third` of `Player(0)`, and `foe` of `Player(1)`. The watchers are registered once, each a Trigger with a condition that answers `true` and an action:

- for `own` and `dead`, the unit's `EVENT_UNIT_SELECTED` and `EVENT_UNIT_DESELECTED`, registered first;
- then, for `Player(0)` and for `Player(1)`, `EVENT_PLAYER_UNIT_SELECTED` and `EVENT_PLAYER_UNIT_DESELECTED`;
- then the two unit events of `foe`, `second`, `removed` and `third`.

So the unit's Trigger is registered before the player's for `own`, and after it for the others. Each step calls one Native, reads the state on the next line, then waits 1.5 seconds and reads it again. Each firing records its Trigger, whether the Native was still running, `GetTriggerUnit`, `GetTriggerPlayer`, `GetTriggerEventId`, `IsUnitSelected(unit, Player(0))`, `UnitAlive` and what `GroupEnumUnitsSelected` holds for `Player(0)`.

## The steps

"Fired" names the Triggers in the order they ran, each a condition then an action. No firing came before a Native returned, in any step. `IsUnitSelected` and `GroupEnumUnitsSelected` are read for `Player(0)`; for `Player(1)` `GroupEnumUnitsSelected` held nothing in every reading.

| Step                                       | On the next line: `IsUnitSelected`; `GroupEnumUnitsSelected` | Fired, after the return                       | 1.5 s later, both readers |
| ------------------------------------------ | ------------------------------------------------------------ | --------------------------------------------- | ------------------------- |
| `ClearSelection`, nothing selected         | none; none                                                   | none                                          | none                      |
| `SelectUnit(own, true)`                    | `own`; none                                                  | player 0 selected; unit `own` selected        | `own`                     |
| `SelectUnit(own, true)`, already selected  | `own`; `own`                                                 | player 0 selected; unit `own` selected        | `own`                     |
| `SelectUnit(foe, true)`                    | `own`, `foe`; `own`                                          | player 0 selected; unit `foe` selected        | `own`, `foe`              |
| `SelectUnit(second, true)`                 | `own`, `foe`, `second`; `own`, `foe`                         | player 0 selected; unit `second` selected     | `own`, `second`           |
| `SelectUnit(own, false)`                   | `own`, `second`; `own`, `second`                             | player 0 deselected; unit `own` deselected    | `second`                  |
| `SelectUnit(own, false)`, not selected     | `second`; `second`                                           | none                                          | `second`                  |
| `ClearSelection`                           | `second`; `second`                                           | player 0 deselected; unit `second` deselected | none                      |
| `ClearSelection`, nothing selected         | none; none                                                   | none                                          | none                      |
| `SelectUnit(foe, true)`, nothing selected  | none; none                                                   | none                                          | none                      |
| `SelectUnit(foe, false)`                   | none; none                                                   | none                                          | none                      |
| `SelectUnit(second, true)`                 | `second`; none                                               | player 0 selected; unit `second` selected     | `second`                  |
| `SelectUnit(foe, true)`, `second` selected | `second`; `second`                                           | none                                          | `second`                  |
| `ClearSelection`                           | `second`; `second`                                           | player 0 deselected; unit `second` deselected | none                      |
| `KillUnit(dead)`                           | none; none                                                   | none                                          | none                      |
| `SelectUnit(dead, true)`, a dead unit      | none; none                                                   | none                                          | none                      |
| `SelectUnit(dead, false)`, a dead unit     | none; none                                                   | none                                          | none                      |
| `SelectUnit(removed, true)`                | `removed`; none                                              | player 0 selected; unit `removed` selected    | `removed`                 |
| `RemoveUnit(removed)`, selected            | `removed`; `removed`                                         | none                                          | none                      |
| `SelectUnit(removed, true)`, removed       | none; none                                                   | none                                          | none                      |
| `SelectUnit(own, true)`                    | `own`; none                                                  | player 0 selected; unit `own` selected        | `own`                     |
| `KillUnit(own)`, selected                  | `own`; `own`                                                 | none                                          | none                      |
| `SelectUnit(second, true)`                 | `second`; none                                               | player 0 selected; unit `second` selected     | `second`                  |
| `SelectUnit(third, true)`                  | `second`, `third`; `second`                                  | player 0 selected; unit `third` selected      | `second`, `third`         |

No Trigger registered for `Player(1)` fired in the run. The death Triggers of `KillUnit` were not watched here ([unit-event-timing.md](unit-event-timing.md) measured them).

## What a handler reads

The same in the condition and in the action of each Trigger.

| Handler                                                    | `GetTriggerUnit` | `GetTriggerPlayer`                      | `GetTriggerEventId`            | `IsUnitSelected(unit, Player(0))` | `GroupEnumUnitsSelected` of `Player(0)`    |
| ---------------------------------------------------------- | ---------------- | --------------------------------------- | ------------------------------ | --------------------------------- | ------------------------------------------ |
| `EVENT_PLAYER_UNIT_SELECTED`, registered for `Player(0)`   | the unit         | `Player(0)`, who selects                | `EVENT_PLAYER_UNIT_SELECTED`   | `true`                            | the selection before, without the unit     |
| `EVENT_UNIT_SELECTED`                                      | the unit         | the unit's owner: `Player(1)` for `foe` | `EVENT_UNIT_SELECTED`          | `true`                            | the selection before, without the unit     |
| `EVENT_PLAYER_UNIT_DESELECTED`, registered for `Player(0)` | the unit         | `Player(0)`                             | `EVENT_PLAYER_UNIT_DESELECTED` | `true`                            | the selection before, the unit still in it |
| `EVENT_UNIT_DESELECTED`                                    | the unit         | the unit's owner                        | `EVENT_UNIT_DESELECTED`        | `true`                            | the selection before, the unit still in it |

The ids `GetHandleId` gives the four events are 24, 25, 57 and 58, those of the constants.

The unit event's `GetTriggerPlayer` was told apart from the selecting player on `foe` alone, the one unit of another player that entered the selection, and on its selection alone: `foe` left the selection without a deselection event ([Another player's unit](#another-players-unit)), so no deselection of another player's unit was read. For the units of `Player(0)` the owner and the selecting player are the same.

When a unit already selected is selected again, `GroupEnumUnitsSelected` holds it in the handlers, since it was there before.

## Another player's unit

`SelectUnit(foe, true)` was called three times, `foe` being a footman of `Player(1)` that `Player(0)` sees:

| Selection before | What happened                                                                                                  |
| ---------------- | -------------------------------------------------------------------------------------------------------------- |
| `own`            | `foe` entered the selection: `IsUnitSelected` at once, the two selection events, then `GroupEnumUnitsSelected` |
| nothing          | nothing: no state on the next line, no event, no state later                                                   |
| `second`         | nothing                                                                                                        |

The three runs agree on the first and the third case; the second is in the two last runs only. What tells the first case from the others was not found: `own` is the unit created first, the one selected twice before, and the one whose unit events were registered before the players' events.

In the first case the next step, `SelectUnit(second, true)`, left `own` and `second` selected: `foe` had left the selection, and no deselection event fired for it.

So another player's unit can enter a selection, and its events are those of the table above. When the game lets it in, and how a player's own click differs from `SelectUnit`, were not measured.

## `GroupEnumUnitsSelected`

Read at the end, with `second` and `third` selected, in that order:

| Call                                                           | The group afterwards                                                   |
| -------------------------------------------------------------- | ---------------------------------------------------------------------- |
| on a group that held `dead`, for `Player(0)`, no filter        | `second`, `third`: `dead` is gone                                      |
| on the same group, for `Player(1)`, no filter                  | empty                                                                  |
| on a new group, for `Player(0)`, a filter that accepts `third` | `third`; the filter ran for `second`, then `third`, as `GetFilterUnit` |

## What the Shipped stubs copy

- `game.select(player, unit)` dispatches `EVENT_PLAYER_UNIT_SELECTED` to the registrations of `player`, then `EVENT_UNIT_SELECTED` to the unit's, with `GetTriggerPlayer` the player in the first and the unit's owner in the second. In the handlers `IsUnitSelected` answers `true` and `GroupEnumUnitsSelected` does not hold the unit; after them it does.
- `game.deselect(player, unit)` dispatches the two deselection events the same way, the unit still selected in the handlers, then takes it out.
- `game.select` refuses a dead unit and a removed one, which `SelectUnit` does not select.
- `SelectUnit` and `ClearSelection` write the local player's selection and dispatch nothing. `SelectUnit` leaves a unit already selected where it is, and selects no dead and no removed unit.
- `GroupEnumUnitsSelected` empties the group, then holds the selection in the order the units entered it, through its filter.

## Where the Shipped stubs differ

The harness simulates only on the test's order ([ADR 0030](../adr/0030-the-harness-simulates-only-on-the-tests-order.md)), so nothing happens "later" in a Test game. Three things the game does are not copied:

- **The selection events of `SelectUnit` and `ClearSelection`.** The game fires them after the Native returned; the stubs fire none, and a test that needs them says `game.select` or `game.deselect`. So `SelectUnit(unit, true)` on a unit already selected, which fires the events again in the game, does nothing in the stubs, and `game.select` of such a unit is an error.
- **The lag of the two readers.** In the stubs `SelectUnit` and `ClearSelection` write at once what both `IsUnitSelected` and `GroupEnumUnitsSelected` read. In the game `GroupEnumUnitsSelected` reads a selection only once its events have fired, and both readers still hold a unit on the line after its deselection.
- **A unit that dies or is removed while selected.** The game takes it out of the selection, without an event, within 1.5 seconds; the stubs keep it selected, as a death writes nothing derived.

`game.fire` reaches the registrations of the owner of `GetTriggerUnit` for every `playerunitevent`. For `EVENT_PLAYER_UNIT_SELECTED` and `EVENT_PLAYER_UNIT_DESELECTED` the game reaches the registrations of the player who selects, so a `game.fire` of either on another player's unit reaches the owner's Triggers, which the game does not fire. `game.select` and `game.deselect` reach the right ones.

## Limits

- Three runs, on one Build, in single player. Every selection was made by `SelectUnit` or `ClearSelection` from the script's own thread, for the local player: a selection a player makes with the mouse, a drag, a control group or a double click was not measured, and is a check on the screen.
- Another player's selection: `Player(1)` has no client in the run, so what its own selection fires, and whether `IsUnitSelected` and `GroupEnumUnitsSelected` read another player's selection, wait for two clients.
- How long after the Native the events fire was not timed: within 1.5 seconds.
- When a unit that died leaves the selection was not timed either, and its deselection events were looked for during 1.5 seconds only.
- Only footmen were selected: a building, a hero, a hidden unit, a unit in a transport and a unit the player does not see were not.
- `ClearSelection` was measured with one unit selected: the order of the deselections of several units was not.
- More than twelve units selected, the size of a selection in the game's interface, was not tried.
