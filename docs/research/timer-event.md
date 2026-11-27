# What a Trigger of `TriggerRegisterTimerEvent` does

What a Trigger registered with `TriggerRegisterTimerEvent` answers and when it fires, measured for [#985](https://github.com/phmilk/reforged-ts/issues/985), a Ticket of the Spec [#970](https://github.com/phmilk/reforged-ts/issues/970). It decides how the Game clock of `reforged-test` fires those Triggers: through the Event dispatch, in their turn among the timers.

## TL;DR

Everything below is Observed, in one run.

| Question                                                  | Answer                                                                    |
| --------------------------------------------------------- | ------------------------------------------------------------------------- |
| `GetTriggerEventId()`, in the condition and in the action | `EVENT_GAME_TIMER_EXPIRED` (the same Handle, id 4)                        |
| `GetTriggeringTrigger()`                                  | the Trigger                                                               |
| `GetExpiredTimer()`                                       | nil                                                                       |
| The condition and the action                              | the condition first, both at the same instant                             |
| A one-shot registration                                   | fires once, at its timeout                                                |
| A periodic registration                                   | fires once per timeout: at 1, 2, 3 and 4 for a timeout of 1               |
| Two registrations on one Trigger                          | each fires it, at its own instant                                         |
| A disabled Trigger                                        | skipped; enabled later, it fires at the next expiries of its registration |
| A destroyed Trigger                                       | skipped silently                                                          |
| A registration of timeout 0                               | fires nothing inside the call; it fired 0.01 s later                      |
| Timers and timer events of one instant                    | in the order they were started, timers and registrations in one order     |

- **A timer event is a game event to its Trigger**: `GetTriggerEventId` answers `EVENT_GAME_TIMER_EXPIRED`, and no timer is the expired one.
- **A disabled Trigger loses the expiries that pass while it is disabled, and nothing else**: disabled at registration and enabled at 2.25, a periodic registration of timeout 1 fired at 3 and at 4, not at 1 or 2, and not at 2.25.
- **One order for timers and timer events.** A timer, a registration, a timer and a registration, started in this order with a timeout of 3, ran in this order at 3. The two periodic registrations made before them, of timeout 1, ran before the four at that same instant, in the order they were made.

## The run

- Probe: `probe/probes/timer-event.ts`.
- Run `eba6848e-6727-467c-a196-2afce0eee1c6`, 2026-11-26, `finished`, 26 records.
- Typings of Patch 3.0.1.24370; client on Build 3.0.1.24371, accepted with `--client-build 3.0.1.24371` (a hotfix of the same Game version, `probe/README.md`, "Running a Probe run").
- Command: `pnpm probe:run timer-event --client-build 3.0.1.24371`.

Every record carries `t`, the `TimerGetElapsed` of a reference timer of timeout 1000 started first, which resolves 0.00006 s; its first reading is 0.00006, so every `t` below is that much late.

## The fires

| Trigger                                         | Registration          | Fires at `t`        |
| ----------------------------------------------- | --------------------- | ------------------- |
| `once-1`                                        | 1, one-shot           | 1.0                 |
| `every-1`                                       | 1, periodic           | 1.0, 2.0, 3.0, 4.0  |
| `two-registrations`                             | 1.5 and 2.5, one-shot | 1.5, 2.5            |
| `disabled-until-2.25`, enabled at 2.25          | 1, periodic           | 3.0, 4.0            |
| `destroyed`, destroyed right after registration | 1, periodic           | never, and no error |

Each fire is two records, the condition then the action, at the same `t`. In all twenty of them `GetTriggerEventId() == EVENT_GAME_TIMER_EXPIRED` (both Handles of id 4), `GetTriggeringTrigger()` is the Trigger and `GetExpiredTimer()` is nil.

## A timeout of 0

`TriggerRegisterTimerEvent(trigger, 0, false)` returned with the action not run (0 fires on the line after the call, `t` 0.00006). The action ran once, at `t` 0.01, and never again in the 4.5 s of the run.

A one-shot timer of timeout 0 ran its handler with the clock unchanged at the 1/128 s its run resolved ([timer-answers.md](timer-answers.md#a-timer-of-timeout-0)); this run resolves finer and shows the registration 0.01 s after the call. The stub fires both on the next advance, one of 0 seconds included, at the instant they were started: the 0.01 s is not copied.

## The order of one instant

Started in this order, each 3 s from the same instant: `TimerStart` (`timer-1`), `TriggerRegisterTimerEvent` (`event-2`), `TimerStart` (`timer-3`), `TriggerRegisterTimerEvent` (`event-4`).

| Position | Ran       | `t` |
| -------- | --------- | --- |
| 1        | `timer-1` | 3.0 |
| 2        | `event-2` | 3.0 |
| 3        | `timer-3` | 3.0 |
| 4        | `event-4` | 3.0 |

At that same `t`, `every-1` and `disabled-until-2.25`, registered before the four, ran before them, in the order they were registered: a periodic registration keeps the place of its start among the expiries of an instant.

## Limits

- One run, one client, a timeout of 1 and of 3: the order of one instant was not measured for timeouts that only add up to the same instant (0.1 three times against 0.3).
- `TriggerRegisterTimerExpireEvent` was not measured here: [timer-expire-event.md](timer-expire-event.md) measured it later ([#986](https://github.com/phmilk/reforged-ts/issues/986)), and the Game clock fires it at each expiry of its timer.
