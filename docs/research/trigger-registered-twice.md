# Whether a Trigger registered twice runs twice

Whether a Trigger registered twice for the same event and subject runs twice on one event, measured for [#981](https://github.com/phmilk/reforged-ts/issues/981), a Ticket of the Spec [#970](https://github.com/phmilk/reforged-ts/issues/970). It decides whether the Event dispatch of `reforged-test` fires a Trigger once per matching registration or once per event.

## TL;DR

Everything below is Observed, in one run.

| Question                                                        | Answer                                                              |
| --------------------------------------------------------------- | ------------------------------------------------------------------- |
| A Trigger registered twice for one event and subject, one event | runs twice: its condition and its action, twice each                |
| When each run happens                                           | in the turn of its registration, among the other Triggers           |
| `GetTriggerEvalCount` and `GetTriggerExecCount` of that Trigger | 2 and 2                                                             |
| The registrations it holds for                                  | player unit, unit, widget death, timer, sync and player events      |
| The registrations it was not measured for                       | `TriggerRegisterGameEvent`, and `TriggerRegisterFilterUnitEvent`    |
| A filter given to `TriggerRegisterPlayerUnitEvent`              | never ran, and its Trigger ran whatever the filter would answer     |
| A Trigger registered with `TriggerRegisterFilterUnitEvent`      | never ran, with a filter that answers `true`, `false`, or no filter |

- **The game fires registrations, not Triggers.** With the Trigger `twice` registered, then `between`, then `twice` again, one event ran `twice`, `between`, `twice`, each condition before its action. The Event dispatch, `__stub_dispatch_damage` and `__stub_deliver_sync` of `reforged-test` already do this: the stub did not change.
- **The filters disagree with the stub, which this run was not made for.** The Event dispatch evaluates a registration's filter and fires a registration of `TriggerRegisterFilterUnitEvent`; the game did neither here. See [The filters](#the-filters).

## The run

- Probe: `probe/probes/trigger-registered-twice.ts`.
- Run `05006439-2502-4c3c-9126-2829336ccb31`, 2026-11-26, `finished`, 23 records.
- Typings of Patch 3.0.1.24370; client on Build 3.0.1.24371, accepted with `--client-build 3.0.1.24371` (a hotfix of the same Game version, `probe/README.md`, "Running a Probe run").
- Command: `pnpm probe:run trigger-registered-twice --client-build 3.0.1.24371`.

Two earlier runs of the Probe, before its filter cases were added (`e824c8be-6336-41d8-9390-7e328906f6cb`, 13 records) and completed (`8eb77ccd-ce18-421a-a3a3-93cc5a53be0b`, 19 records), gave the same answer in every case they share with this one.

Every case makes two Triggers, `twice` and `between`, each with a condition that answers `true` and an action; both write to the case's log. It registers `twice`, then `between`, then `twice` again, the three for one event and one subject, fires the event once, and reads the log, `GetTriggerEvalCount(twice)` and `GetTriggerExecCount(twice)`. Then it destroys both Triggers. Every unit is a footman (`hfoo`) of `Player(0)`, created at the map's origin.

## The cases

| Registration, three times                                                | Fired by                               | `twice` ran | `between` ran |
| ------------------------------------------------------------------------ | -------------------------------------- | ----------- | ------------- |
| `TriggerRegisterPlayerUnitEvent`, `EVENT_PLAYER_UNIT_DEATH`              | `KillUnit`                             | 2           | 1             |
| the same, each registration with a filter that answers `true`            | `KillUnit`                             | 2           | 1             |
| `TriggerRegisterUnitEvent`, `EVENT_UNIT_DEATH`                           | `KillUnit`                             | 2           | 1             |
| `TriggerRegisterFilterUnitEvent`, `EVENT_UNIT_DEATH`, each filter `true` | `KillUnit`                             | 0           | 0             |
| `TriggerRegisterDeathEvent`                                              | `KillUnit`                             | 2           | 1             |
| `TriggerRegisterUnitEvent`, `EVENT_UNIT_DAMAGED`                         | `UnitDamageTarget`, 10 damage          | 2           | 1             |
| `TriggerRegisterPlayerUnitEvent`, `EVENT_PLAYER_UNIT_DAMAGED`            | `UnitDamageTarget`, 10 damage          | 2           | 1             |
| `TriggerRegisterTimerEvent`, one-shot, a timeout of 1 each               | the game's clock                       | 2           | 1             |
| `BlzTriggerRegisterPlayerSyncEvent`, one prefix, `Player(0)`             | `BlzSendSyncData`, one packet          | 2           | 1             |
| `TriggerRegisterPlayerEvent`, `EVENT_PLAYER_END_CINEMATIC`, `Player(0)`  | `ForceUICancel`                        | 2           | 1             |
| `TriggerRegisterPlayerEvent`, `EVENT_PLAYER_DEFEAT`, `Player(1)`         | `RemovePlayer`, of a slot nobody plays | 0           | 0             |

In every case where a Trigger ran, the log is, in this order: `twice` condition, `twice` action, `between` condition, `between` action, `twice` condition, `twice` action. `GetTriggerEvalCount(twice)` and `GetTriggerExecCount(twice)` both answer 2.

- The death and the damage cases are read on the line after the Native that fires them, which fires its event inside the call ([unit-event-timing.md](unit-event-timing.md)).
- The timer, the sync and the player event cases are read 2 seconds after what fires them. `BlzSendSyncData` returned `true`.
- `ForceUICancel` fired `EVENT_PLAYER_END_CINEMATIC` for `Player(0)`: the run pressed no key after the screens before the map.
- `RemovePlayer(Player(1), PLAYER_GAME_RESULT_DEFEAT)` fired nothing: `Player(1)` is not a playing slot in the Probe's map. That case measures nothing.

## The filters

The two cases with a filter stood out: the filter of `TriggerRegisterPlayerUnitEvent` ran 0 times while its Triggers ran, and the Triggers of `TriggerRegisterFilterUnitEvent` did not run at all. So the run measures each kind of filter on one registration of one Trigger: how often the filter ran, and whether the Trigger did. The filter is made with `Filter`, and records `GetFilterUnit`.

| Registration                                                | Filter answers | Filter ran | Trigger ran |
| ----------------------------------------------------------- | -------------- | ---------- | ----------- |
| `TriggerRegisterPlayerUnitEvent`, `EVENT_PLAYER_UNIT_DEATH` | `true`         | 0          | 1           |
| `TriggerRegisterPlayerUnitEvent`, `EVENT_PLAYER_UNIT_DEATH` | `false`        | 0          | 1           |
| `TriggerRegisterPlayerUnitEvent`, `EVENT_PLAYER_UNIT_DEATH` | no filter      |            | 1           |
| `TriggerRegisterFilterUnitEvent`, `EVENT_UNIT_DEATH`        | `true`         | 0          | 0           |
| `TriggerRegisterFilterUnitEvent`, `EVENT_UNIT_DEATH`        | `false`        | 0          | 0           |
| `TriggerRegisterFilterUnitEvent`, `EVENT_UNIT_DEATH`        | no filter      |            | 0           |
| `TriggerRegisterFilterUnitEvent`, `EVENT_UNIT_DAMAGED`      | `true`         | 0          | 0           |
| `TriggerRegisterFilterUnitEvent`, `EVENT_UNIT_DAMAGED`      | `false`        | 0          | 0           |
| `TriggerRegisterFilterUnitEvent`, `EVENT_UNIT_DAMAGED`      | no filter      |            | 0           |

No filter ran later either: the count of every filter's runs, read at the end of the run, 4 seconds after the cases, is 0.

- **`TriggerRegisterPlayerUnitEvent` ignored its filter**: the Trigger ran with a filter that answers `false`.
- **`TriggerRegisterFilterUnitEvent` fired nothing**, for a death or a damage, with or without a filter, where `TriggerRegisterUnitEvent` on the same events fired.

The stub answers otherwise: the Event dispatch and `__stub_dispatch_damage` run a registration's filter with the unit as `GetFilterUnit` and skip the Trigger when it answers `false`, and the Event dispatch fires a registration of `TriggerRegisterFilterUnitEvent`. This run was made for the question above, so the stub's filters were left as they are, for a piece of work of their own.

## Limits

- One run, one client, one player: the events were fired from the script's own thread, by `KillUnit`, `UnitDamageTarget`, `BlzSendSyncData` and `ForceUICancel`, never by an order a player gave or by combat.
- `TriggerRegisterGameEvent` was not measured: no Native is known to fire a game event without ending or saving the game.
- `EVENT_PLAYER_DEFEAT` was not measured: `RemovePlayer` fired nothing for a slot nobody plays.
- The filters were measured on a death and on a damage only, each made with `Filter` from a Lua function; a filter made with `Condition`, and another event, were not.
