# What a timer's expire event answers, and what a timer's own handler can do to it

What a Trigger registered with `TriggerRegisterTimerExpireEvent` answers and when it fires, and what `ResumeTimer`, `PauseTimer` and `TimerStart` do when a timer's own handler calls them, measured for [#986](https://github.com/phmilk/reforged-ts/issues/986), a Ticket of the Spec [#970](https://github.com/phmilk/reforged-ts/issues/970). The timers stub of `reforged-test` copies the game under the Game clock, and neither [timer-answers.md](timer-answers.md) nor [timer-resume-cases.md](timer-resume-cases.md) measured these cases.

## TL;DR

Everything below is Observed, in two runs that agree on every value.

| Question                                                             | Answer                                                                                               |
| -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `GetTriggerEventId()`, in the condition and in the action            | `EVENT_GAME_TIMER_EXPIRED` (the same Handle, id 4)                                                   |
| `GetTriggeringTrigger()`                                             | the Trigger                                                                                          |
| `GetExpiredTimer()`                                                  | the timer, one never started and resumed included                                                    |
| The condition, the action and the timer's handler                    | the condition, the action, then the handler, at the same instant                                     |
| A one-shot timer                                                     | one expire event, at its expiry                                                                      |
| A periodic timer                                                     | one expire event per expiry, each before the handler                                                 |
| Two Triggers of one timer                                            | in the order they were registered, both before the handler                                           |
| A Trigger registered twice for one timer                             | fires twice per expiry                                                                               |
| A disabled Trigger                                                   | skipped; enabled later, it fires at the next expiries                                                |
| A destroyed Trigger                                                  | skipped silently                                                                                     |
| A timer's expire event among the timers of one instant               | in the timer's turn, right before its handler                                                        |
| `ResumeTimer` in the first fire of a resumed timer                   | it reads 0 and the remaining of the pause after the call; the fires do not change                    |
| `PauseTimer` in the first fire of a resumed timer                    | nothing changes: no reading, and the second fire still comes                                         |
| `TimerStart` in the first fire of a resumed timer                    | an ordinary start: the second fire of the resume never comes                                         |
| `ResumeTimer` in the second fire of a resumed timer                  | the rule again: a fire when the remaining of the pause runs out, one more a timeout later, the stop  |
| `PauseTimer` in the second fire of a resumed timer                   | nothing changes                                                                                      |
| `ResumeTimer` in a periodic timer's handler                          | nothing changes                                                                                      |
| `ResumeTimer` in a one-shot timer's handler                          | a second fire 0.0001 s later, a third a full timeout later, then the stop                            |
| `PauseTimer` in a periodic timer's handler, `ResumeTimer` afterwards | paused, it reads the timeout and 0; resumed, it fires 0.0001 s later and a full timeout later, stops |

"The rule" is what [#947](https://github.com/phmilk/reforged-ts/issues/947) found: a resumed timer fires when what was left runs out, once more a full timeout later, then stops, one-shot or periodic alike.

## The runs

- Probe: `probe/probes/timer-expire-event.ts`.
- Run `c902d400-f6f3-42d2-bc54-51fc9cae4f7d`, 2026-11-26, `finished`, 438 records.
- Run `b0769e67-9c40-4504-bf49-abe19b121e5e`, 2026-11-26, `finished`, 438 records: the same Probe, unchanged, every fire and every reading identical.
- Between the two, run `56a553de-aa3f-4144-ac9e-42a889184549` ended `not-started`: the game showed "There was an error in handling the request. Please check your VPN" in place of the map, and was ended there.
- Typings of Patch 3.0.1.24370; client on Build 3.0.1.24371, accepted with `--client-build 3.0.1.24371` (a hotfix of the same Game version, `probe/README.md`, "Running a Probe run").
- Command: `pnpm probe:run timer-expire-event --client-build 3.0.1.24371`.

Every record carries `t`, the `TimerGetElapsed` of a reference timer of timeout 1000 started first, which resolves 0.00006 s; its first reading is 0.00006, so every `t` is that much late, and the times below are rounded to the millisecond. Each timer is read in its handler, before and after every call made on it, and every 0.5 s from 0.25 on, so no sample falls on a call. The calls made from outside a handler run from the runner's `p.after`.

## The expire event

Each Trigger has a condition and an action that record the same answers.

| Timer                                                   | Expire events at `t`         | Handler at `t`    |
| ------------------------------------------------------- | ---------------------------- | ----------------- |
| one-shot 1                                              | 1                            | 1                 |
| periodic 1                                              | 1, 2 … 10                    | 1, 2 … 10         |
| one-shot 1.5, two Triggers, the second registered twice | 1.5: first, second, second   | 1.5               |
| periodic 1, its Trigger disabled until 2.25             | 3, 4 … 10                    | 1, 2 … 10         |
| periodic 1, its Trigger destroyed after registration    | never, and no error          | 1, 2 … 10         |
| never started, `ResumeTimer` at 1                       | one, 0.0001 s after the call | none: it has none |

In all 46 records of a condition or an action, `GetTriggerEventId() == EVENT_GAME_TIMER_EXPIRED` (both Handles of id 4), `GetTriggeringTrigger()` is the Trigger and `GetExpiredTimer()` is the timer. Each expire event is two records, the condition then the action, and both come before the record of the timer's handler at that expiry. They read the timer as its handler does: the timeout and 0, and 0, 0 and 0 on the timer never started.

So a timer's expire event is the game's timer event, the one a Trigger of `TriggerRegisterTimerEvent` reads ([timer-event.md](timer-event.md)), with the timer as the expired one, where that Trigger reads nil.

The disabled Trigger lost the expiries at 1 and at 2 and nothing else: enabled at 2.25, it fired at 3, not at 2.25.

## The order of one instant

An expire event registered on `timer-2` before any timer started, then `TimerStart` on `timer-1`, `timer-2` and `timer-3`, in this order, each for 3 s.

| Position | Ran                | `t` |
| -------- | ------------------ | --- |
| 1        | `timer-1`          | 3   |
| 2        | `event-of-timer-2` | 3   |
| 3        | `timer-2`          | 3   |
| 4        | `timer-3`          | 3   |

The expire event has no place of its own among the expiries of an instant: it runs in its timer's turn, which `TimerStart` gave, right before the handler.

## A call a handler makes on its own timer

The resumed timers are the control of [timer-resume-cases.md](timer-resume-cases.md): one-shot, timeout 2, `PauseTimer` at 0.5 (elapsed 0.5, remaining 1.5), `ResumeTimer` at 1. Alone, such a timer fires at 2.5 and at 4.5, reading 0.5 and 1.5 in both handlers and after the second.

| The handler calls                                      | Reading right after the call            | Fires at `t`                      | From its last fire on        |
| ------------------------------------------------------ | --------------------------------------- | --------------------------------- | ---------------------------- |
| `ResumeTimer`, in the first fire (2.5)                 | elapsed 0, remaining 1.5                | 2.5, 4.5                          | elapsed 0.5, remaining 1.5   |
| `PauseTimer`, in the first fire (2.5)                  | elapsed 0.5, remaining 1.5, unchanged   | 2.5, 4.5                          | elapsed 0.5, remaining 1.5   |
| `TimerStart(timer, 0.75, false, …)`, in the first fire | elapsed 0, remaining 0.75, timeout 0.75 | 2.5, then the new handler at 3.25 | elapsed -0.75, remaining 1.5 |
| `ResumeTimer`, in the second fire (4.5)                | elapsed 0, remaining 1.5                | 2.5, 4.5, 6, 8                    | elapsed 0.5, remaining 1.5   |
| `PauseTimer`, in the second fire (4.5)                 | elapsed 0.5, remaining 1.5, unchanged   | 2.5, 4.5                          | elapsed 0.5, remaining 1.5   |

In its first fire a resumed timer is not running: it reads the values of the pause, a `PauseTimer` writes nothing, and a `ResumeTimer` starts it for the remaining of the pause, as the reading after the call shows. Yet 0.25 s after that fire every one of the first two reads elapsed 0.25 and remaining 1.75: the second countdown, a full timeout, started when the handler returned, over whatever the handler's `ResumeTimer` or `PauseTimer` did. Only `TimerStart` in the handler ends the resume: the timer then fires once, 0.75 s later, and reads as a one-shot timer started after a pause does (the remaining of the pause and the new timeout minus it, [timer-resume-cases.md](timer-resume-cases.md#timerstart-on-a-timer-that-was-resumed)).

In its second fire the timer has stopped, and a `ResumeTimer` there is one on any stopped timer: the rule again, with the remaining of the same pause.

The ordinary timers, each of timeout 1, the call made in the first fire:

| Timer and call                                                 | Reading right after the call | Fires at `t`           | From its last fire on  |
| -------------------------------------------------------------- | ---------------------------- | ---------------------- | ---------------------- |
| periodic, `ResumeTimer`                                        | elapsed 1, remaining 0       | 1, 2 … 10, as any      | counting, as any       |
| one-shot, `ResumeTimer`                                        | elapsed 0, remaining 0.0001  | 1, 1.0001, 2.0001      | elapsed 1, remaining 0 |
| periodic, `PauseTimer`, then `ResumeTimer` at 2.5 from outside | elapsed 1, remaining 0       | 1, then 2.5001, 3.5001 | elapsed 1, remaining 0 |

A periodic timer is running in its handler, at the end of its countdown (the timeout and 0): `ResumeTimer` does nothing to a running timer, and `PauseTimer` stores the 0 left, so the timer reads the timeout and 0 while paused and a later `ResumeTimer` counts 0.0001 s, the least the game counts, then the timeout. A one-shot timer is not running in its handler, so `ResumeTimer` there is the one on an expired timer ([timer-resume-cases.md](timer-resume-cases.md#the-doubled-calls)).

## What it means for the Game clock

All of it follows from the rule of [timer-resume-cases.md](timer-resume-cases.md#one-rule-that-fits-every-case) and two additions, which the stub copies:

- **The expire event is part of the timer's expiry.** At each expiry the stub dispatches the timer event to the Triggers registered for that timer, in registration order, with the timer as `GetExpiredTimer`'s answer, then runs the handler. A timer never started, resumed, has that event and no handler.
- **A one-shot timer stops running before its handler; a periodic one is still running in it, its countdown at its end.** So in a handler `PauseTimer` and `ResumeTimer` act as they do on a timer in that state.
- **The second countdown of a resumed timer starts when the handler of its first fire returns**, unless that handler called `TimerStart` or destroyed the timer.

The 0.0001 s of a countdown of 0 is not copied: under `game.advanceTime` it ends on the next advance, one of 0 seconds included, at the instant it began, as a one-shot timer of timeout 0 does.

## Limits

- Two runs, one client, timeouts of 0.75, 1, 1.5, 2 and 3.
- `DestroyTimer` in a handler was not measured: the stub fires a destroyed timer no more.
- A Trigger of the expire event that pauses, starts or destroys its timer, before the handler of that expiry, was not measured: the stub then runs the handler of the `TimerStart` before it, unless the timer was destroyed.
- `ResumeTimer` then `PauseTimer` on one line in the first fire of a resumed timer was not measured.
