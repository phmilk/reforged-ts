# What a player's leave fires and writes

What the game does when a player leaves a game of two human players: which Triggers fire, what a handler reads, and what the leaver's slot, controller and selection read afterwards. Measured for [#1040](https://github.com/phmilk/reforged-ts/issues/1040), for `game.leave` of `reforged-test/map` ([#984](https://github.com/phmilk/reforged-ts/issues/984), a Ticket of the Spec [#970](https://github.com/phmilk/reforged-ts/issues/970)). It decides what `__stub_leave_player` dispatches and writes, and in which order.

## TL;DR

Everything below is Observed, in four games that agree on every record they share, one for each way of leaving: the game's menu, Alt+F4, the network cut, and the game's process killed.

- **`EVENT_PLAYER_LEAVE` fires once, on the Trigger registered for the leaver alone.** The one registered for the other player does not fire. `GetTriggerPlayer` answers the leaver and `GetTriggerEventId` `EVENT_PLAYER_LEAVE`.
- **In the handler the leaver's slot still reads `PLAYER_SLOT_STATE_PLAYING`**, on its first line and after its work. **At a timer of timeout 0 started in the handler it reads `PLAYER_SLOT_STATE_LEFT`**, and still does 5 seconds later.
- **The controller stays `MAP_CONTROL_USER`**, in the handler and for the 5 seconds after.
- **No defeat and no victory fire**: neither `EVENT_PLAYER_DEFEAT` nor `EVENT_PLAYER_VICTORY`, for either player, in a game without the melee rules (the runner turns `MeleeInitVictoryDefeat` into a no-op, #348).
- **The leaver's selection stays**: `IsUnitSelected(footman, leaver)` answers `true` and `GroupEnumUnitsSelected` of the leaver holds the footman, in the handler and for the 5 seconds after. No `EVENT_PLAYER_UNIT_DESELECTED` fires.
- **The four ways of leaving give the same records** on the client that stays.
- **The leaver's own client runs the handler of its own leave when it leaves by the menu**, reading its slot as playing, and writes nothing after it; Alt+F4, the network cut and the killed process write nothing after the leaver's last record before the leave.

## The runs

- Probe: `probe/probes/player-leave.ts`, built with `pnpm probe:build player-leave --players 2` (#1043): the map's second slot a user slot.
- Run `ad7c1679-c774-4e30-806e-4370285d7d46`, 2026-11-27: four games on the same build, each named in chat (`teste <name>`), so each client wrote one Result file per game, `player-leave-<name>.txt`.
- Typings of Patch 3.0.1.24370; both clients on Build 3.0.1.24371, hosted from the Battle.net app, `Player(0)` the host's slot and `Player(1)` the leaver's.
- Read with `pnpm probe:read player-leave --label <name>`; the leaver's files from a copy of them, with `WC3_USER_FOLDER`.

Each player has one footman (`hfoo`), `footman0` and `footman1`, at its start. Before the leave the leaver selected `footman1` by hand; the host selected nothing. The watchers are one Trigger per player for `EVENT_PLAYER_LEAVE`, `EVENT_PLAYER_DEFEAT`, `EVENT_PLAYER_VICTORY`, `EVENT_PLAYER_UNIT_SELECTED` and `EVENT_PLAYER_UNIT_DESELECTED`. Each read records `GetPlayerSlotState` and `GetPlayerController` of both players, `IsUnitSelected` of both footmen for each player, and what `GroupEnumUnitsSelected` holds for each player. `t` is the elapsed time of a timer started at the Probe's start, in seconds of game time.

## The records

On the host's client, every game:

| Read                                        | `slot1`   | `controller1` | `isSelected1` | `enum1`      |
| ------------------------------------------- | --------- | ------------- | ------------- | ------------ |
| Before the selection                        | `PLAYING` | `USER`        | none          | `0:none`     |
| After the selection, before the leave       | `PLAYING` | `USER`        | `footman1`    | `1:footman1` |
| `LEAVE`, the handler's first line           | `PLAYING` | `USER`        |               |              |
| The handler, after its work                 | `PLAYING` | `USER`        | `footman1`    | `1:footman1` |
| A timer of timeout 0 started in the handler | `LEFT`    | `USER`        | `footman1`    | `1:footman1` |
| 1, 2.5 and 5 seconds later                  | `LEFT`    | `USER`        | `footman1`    | `1:footman1` |

`slot0` reads `PLAYING`, `controller0` `USER`, and the host's selection none, at every read. The one `SELECTION` record of each game is `EVENT_PLAYER_UNIT_SELECTED` on the Trigger of `Player(1)`, `GetTriggerPlayer` `Player(1)`, unit `footman1`; there is no deselection, and no `OUTCOME` record.

| Game           | Selection, `t` | Leave, `t` | Records |
| -------------- | -------------- | ---------- | ------- |
| `menu`         | 71.7           | 77.87      | 18      |
| `alt-f4`       | 14.3           | 19.12      | 12      |
| `disconect`    | 17.0           | 42.04      | 15      |
| `kill-process` | 36.25          | 59.83      | 16      |

The leaver's files hold the same records as the host's, field for field, up to where they end. In `menu` they end with the `LEAVE` record and the handler's read after its work, both reading `slot1=PLAYING`. In the three others they end before the leave, at the leaver's last checkpoint. `probe:read` reports them as `crashed`: the client stopped without the run's `END` line.

## Not measured

- What the screens showed: the host's waiting dialog in the network cut, and how long the game waited before the leave. The network cut's leave came 25 seconds of game time after the selection, against 5 to 6 in the other games.
- A game of more than two players, a leaver on a team, and a game with the melee rules, where `MeleeInitVictoryDefeat` reacts to a leave.
- Whether the slot reads `PLAYER_SLOT_STATE_LEFT` before the timer of timeout 0: no read sits between the end of the handler and that timer.
