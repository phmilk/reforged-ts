# What ResumeTimer does to a timer never started, restarted or paused again

The cases of `ResumeTimer` the resume study of [timer-answers.md](https://github.com/phmilk/reforged-ts/blob/research/timer-answers/docs/research/timer-answers.md) left out, measured for [#961](https://github.com/phmilk/reforged-ts/issues/961), a ticket of the wayfinder map [#931](https://github.com/phmilk/reforged-ts/issues/931). The timers stub of `reforged-test` copies the game under the Game clock ([#955](https://github.com/phmilk/reforged-ts/issues/955)), so this is what it does in these cases.

## TL;DR

Everything below is Observed, in two runs that agree on every value they share. "The rule" is what [#947](https://github.com/phmilk/reforged-ts/issues/947) found: a resumed timer fires when what was left runs out, once more a full timeout later, then stops, one-shot or periodic alike.

| Case                                                             | What the game does                                                                                                                                |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ResumeTimer` on a timer never started                           | one expire event, 0.0001 s later, never inside the call; no second one; it reads 0, 0 and a timeout of 0 before and after                         |
| `PauseTimer`, then `ResumeTimer`, on a timer never started       | the same                                                                                                                                          |
| `TimerStart` on that timer afterwards                            | an ordinary start: one fire a timeout later                                                                                                       |
| `TimerStart` on a resumed timer, in its first countdown          | an ordinary start: the resume is forgotten, a periodic timer fires for ever, a one-shot timer fires once                                          |
| `TimerStart` on a resumed timer, in its second countdown         | the same                                                                                                                                          |
| `TimerStart` on a resumed timer, after it stopped                | the same                                                                                                                                          |
| a one-shot timer started so, once it expired                     | it reads the remaining of the old pause, and an elapsed of the timeout minus it (negative here), not the timeout and 0                            |
| `ResumeTimer` on that expired timer                              | it counts the remaining of the old pause, fires, counts the new timeout, fires, stops                                                             |
| a second `PauseTimer` and `ResumeTimer`, in the first countdown  | the rule again, from the second pause: it fires when what was left at the second pause runs out, a full timeout later, then stops; 2 fires in all |
| a second `PauseTimer` and `ResumeTimer`, in the second countdown | the rule again, after the first fire: what was left of the second countdown, then a full timeout, then stops; 3 fires in all                      |
| `PauseTimer`, then `ResumeTimer`, on an expired one-shot timer   | as `ResumeTimer` alone: a fire 0.0001 s later, one more a full timeout later, then stops                                                          |
| `ResumeTimer` twice in a row on a paused timer                   | as one `ResumeTimer`                                                                                                                              |
| `ResumeTimer` on a resumed timer that is counting                | nothing changes                                                                                                                                   |
| `ResumeTimer` on a resumed timer that stopped                    | the rule again, with the remaining of the same pause: it fires that long after the call, a full timeout later, then stops                         |
| `ResumeTimer` on an expired one-shot timer of timeout 0          | two fires, 0.0001 s and 0.0002 s later                                                                                                            |

The periodic flag changed nothing in any case of `ResumeTimer`: each periodic timer did what its one-shot twin did. An expire event (`TriggerRegisterTimerExpireEvent`) fires at both fires of a resumed timer, each time before the handler. `GetExpiredTimer()` was the timer in every handler.

## The runs

- Probe: `probe/probes/timer-resume-cases.ts`, on this branch.
- Run `ea27e63e-9f7d-4307-9584-81a4c85f21b7`, 2026-11-26, `finished`, 652 records: the cases of the ticket.
- Run `f3798351-e10c-4e26-bfb0-8be5e14f78c8`, 2026-11-26, `finished`, 750 records: the same cases, every fire and every reading identical, with four changes. The second pause of the second countdown moved from 3.0 to 3.1 and its resume from 3.5 to 3.6, since at 3.0 what was left of the second countdown was by chance the remaining of the first pause, 1.5. Three timers were added: one resumed after a `TimerStart` on it expired, an expired one-shot timer of timeout 0 resumed, and a control with an expire event beside its handler.
- Typings of Patch 3.0.1.24370; client on Build 3.0.1.24371, accepted with `--client-build 3.0.1.24371` (a hotfix of the same Game version, `probe/README.md`, "Running a Probe run").
- Command: `pnpm probe:run timer-resume-cases --client-build 3.0.1.24371`.

Every record carries `t`, the `TimerGetElapsed` of a reference timer of timeout 1000 started first, which resolves 0.00006 s; the times below are rounded to the millisecond. Each timer is read before and after every call made on it, in its handler, and every 0.5 s from 0.25 on, so no sample falls on a call. The calls run from the runner's `p.after`. Unless a row says otherwise, a timer has a timeout of 2, `PauseTimer` at 0.5 (elapsed 0.5, remaining 1.5) and `ResumeTimer` at 1.

## The control

One pause, one resume, a one-shot timer and a periodic one: both fire at 2.5 and at 4.5 and never again in the 12 s read, as #947 found.

| `t`          | Elapsed      | Remaining    | What it is doing                                     |
| ------------ | ------------ | ------------ | ---------------------------------------------------- |
| 0.5 to 1     | 0.5          | 1.5          | paused                                               |
| 1            | 0            | 1.5          | right after `ResumeTimer`                            |
| 1.25 to 2.25 | 0.25 to 1.25 | 1.25 to 0.25 | counting what was left, elapsed from `ResumeTimer`   |
| 2.5          | 0.5          | 1.5          | first fire; in the handler, the values of the pause  |
| 2.75 to 4.25 | 0.25 to 1.75 | 1.75 to 0.25 | counting a full timeout                              |
| 4.5          | 0.5          | 1.5          | second fire; in the handler, the values of the pause |
| 4.75 to 12   | 0.5          | 1.5          | stopped                                              |

With an expire event on the same timer: the event at 2.5, then the handler, and the event at 4.5, then the handler, each reading 0.5 and 1.5.

## TimerStart on a timer that was resumed

`TimerStart(timer, 0.75, …)` with a new handler, with the other flag than the timer's first start: a timer first started one-shot is started again periodic, and the reverse. Right after the call every one of them reads elapsed 0, remaining 0.75 and a timeout of 0.75.

| `TimerStart` at              | New start | Fires of the first start | Fires of the new start                  |
| ---------------------------- | --------- | ------------------------ | --------------------------------------- |
| 1.5, in the first countdown  | periodic  | none                     | 2.25, 3, 3.75 … 12: every 0.75, 14      |
| 1.5, in the first countdown  | one-shot  | none                     | 2.25, and no other                      |
| 3, in the second countdown   | periodic  | 2.5                      | 3.75, 4.5 … 12: every 0.75, 12          |
| 3, in the second countdown   | one-shot  | 2.5                      | 3.75, and no other                      |
| 5.5, after the timer stopped | periodic  | 2.5, 4.5                 | 6.25, 7 … 12.25: every 0.75, to the end |
| 5.5, after the timer stopped | one-shot  | 2.5, 4.5                 | 6.25, and no other                      |

So a `TimerStart` is an ordinary start whatever `ResumeTimer` did before: the fires the resume still owed never come, the old handler never runs again, a periodic timer is periodic again and a one-shot timer fires once.

One thing survives the new start: **the remaining the pause stored**. The periodic timers read as any periodic timer (0.75 and 0 in the handler, counting between the fires). The one-shot timers, in their handler and for ever after, read **elapsed -0.75, remaining 1.5, timeout 0.75**: the remaining of the pause at 0.5, and an elapsed that is the new timeout minus it. An ordinary expired one-shot timer reads the timeout and 0 (#947).

And `ResumeTimer` uses it. The timer of the second run started again one-shot at 5.5, which fired at 6.25, then `ResumeTimer` at 7:

| `t`  | Event                 | Elapsed | Remaining | Timeout |
| ---- | --------------------- | ------- | --------- | ------- |
| 6.25 | fire of the new start | -0.75   | 1.5       | 0.75    |
| 7    | before `ResumeTimer`  | -0.75   | 1.5       | 0.75    |
| 7    | after `ResumeTimer`   | 0       | 1.5       | 0.75    |
| 8.5  | fire, the new handler | -0.75   | 1.5       | 0.75    |
| 9.25 | fire, the new handler | -0.75   | 1.5       | 0.75    |
| 9.75 | stopped, to the end   | -0.75   | 1.5       | 0.75    |

It counted 1.5, the remaining of a pause made before the `TimerStart`, then the new timeout, 0.75, then stopped.

## A second pause and resume

In the first countdown: `PauseTimer` at 1.5, `ResumeTimer` at 2. One-shot and periodic alike.

| `t`          | Event                   | Elapsed      | Remaining    |
| ------------ | ----------------------- | ------------ | ------------ |
| 1.5          | before the second pause | 0.5          | 1            |
| 1.5          | after the second pause  | 1            | 1            |
| 2            | after the second resume | 0            | 1            |
| 3            | first fire              | 1            | 1            |
| 3.25 to 4.75 | counting a full timeout | 0.25 to 1.75 | 1.75 to 0.25 |
| 5            | second fire             | 1            | 1            |
| 5.25 to 12   | stopped                 | 1            | 1            |

The second pause replaces the first: the timer fires when what was left at the second pause runs out (1 s after the second resume), once more a full timeout later, and stops, two fires in all. While it counts after a resume the elapsed time runs from that resume (0.5 before the second pause); once paused it reads the timeout minus what is left (1).

In the second countdown: `PauseTimer` at 3.1, `ResumeTimer` at 3.6 (second run). One-shot and periodic alike.

| `t`  | Event                      | Elapsed | Remaining |
| ---- | -------------------------- | ------- | --------- |
| 2.5  | first fire                 | 0.5     | 1.5       |
| 3.1  | before and after the pause | 0.6     | 1.4       |
| 3.6  | after the resume           | 0       | 1.4       |
| 5    | second fire                | 0.6     | 1.4       |
| 7    | third fire                 | 0.6     | 1.4       |
| 7.25 | stopped, to the end        | 0.6     | 1.4       |

The pause stores what is left of the second countdown (1.4, not the 1.5 of the first pause), and the resume starts the rule over: a fire when that runs out, one more a full timeout later, then the stop. Three fires in all, the one before the second pause included. The first run, with the pause at 3 and the resume at 3.5, fired at 2.5, 5 and 7 too.

## The doubled calls

- **`PauseTimer`, then `ResumeTimer`, on an expired one-shot timer** (timeout 1, expired at 1, `PauseTimer` at 1.5, `ResumeTimer` at 2): fires at 2.0001 and at 3, then stops, exactly as the twin that got `ResumeTimer` alone at 2. The pause changed no reading (1 and 0 before and after it). Right after `ResumeTimer` both read elapsed 0 and remaining 0.0001, with the fire still to come: it is never inside the call.
- **`ResumeTimer` twice in a row on a paused timer**: fires at 2.5 and 4.5, the readings of the control, one-shot and periodic alike.
- **`ResumeTimer` again at 1.5, in the first countdown**: no reading changes across the call (elapsed 0.5, remaining 1), and the fires stay at 2.5 and 4.5.
- **`ResumeTimer` again at 5.5, after the timer stopped**: it reads 0 and 1.5 after the call, fires at 7 (1.5 later, the remaining of the pause at 0.5) and at 9 (a full timeout later), then stops. Four fires in all.
- **An expired one-shot timer of timeout 0, `ResumeTimer` at 2**: its handler runs at 2.0001 and at 2.0002, and never again: the two fires of the rule, a timeout of 0 being a period of 0.0001 s (#947).

## A timer never started

Three timers created and never given to `TimerStart`, so with no handler: an expire event counts their fires. Each reads elapsed 0 (`-0.0`), remaining 0 and timeout 0 once created.

| Timer                              | Right after `ResumeTimer`              | Expire events       | From then on             |
| ---------------------------------- | -------------------------------------- | ------------------- | ------------------------ |
| `ResumeTimer`                      | elapsed 0, remaining 0.0001, timeout 0 | one, 0.0001 s later | 0, 0, 0 for the 5 s read |
| `PauseTimer`, then `ResumeTimer`   | the same; the pause changed no reading | one, 0.0001 s later | 0, 0, 0 for the 5 s read |
| `ResumeTimer`, `TimerStart` 2 s on | the same                               | one, 0.0001 s later | see below                |

Nothing crashed. The third timer, given `TimerStart(timer, 1, false, handler)` 2 s after its resume, read 0, 1 and 1 after the call, fired once 1 s later (the expire event, then the handler) and read 1 and 0 from then on, as any one-shot timer.

A timer never started gave **one** expire event where the expired timer of timeout 0 gave two fires. The run cannot say why: the second one may need a handler, or a `TimerStart` to have happened.

## One rule that fits every case

An interpretation, not an observation: the game's code was not read. Every reading and every fire of both runs, and of #947, follows from it, the single expire event of a timer never started excepted.

- A timer keeps **one stored remaining**: 0 at first, and what is left each time `PauseTimer` stops a running timer. Nothing else writes it: not a fire, not `TimerStart`, not `ResumeTimer`, not a `PauseTimer` on a timer that is not running.
- A timer that is **not running** (never started, paused, expired, stopped after a resume) reads the stored remaining as `TimerGetRemaining`, and the timeout minus it as `TimerGetElapsed`. Hence the timeout and 0 of an ordinary expired one-shot timer, the frozen values of a paused one, "the values of the pause" in a resumed timer's handlers and after its stop, and the -0.75 of a one-shot timer started again after a pause.
- **`ResumeTimer` on a timer that is not running** counts the stored remaining, 0.0001 s at the least, with the elapsed time from 0; fires; counts the timer's current timeout, 0.0001 s at the least; fires; and stops. The periodic flag is ignored and the handler is the last one given to `TimerStart`.
- **`ResumeTimer` on a running timer** does nothing, resumed or not.
- **`TimerStart`** is always an ordinary start and ends whatever `ResumeTimer` had left to do.

## What it means for the Game clock

[#955](https://github.com/phmilk/reforged-ts/issues/955) decided the stub copies the game and follows this result. Under `game.advanceTime`, then:

- **A timer never started, resumed**: its `TriggerRegisterTimerExpireEvent` Triggers fire once, on the next advance, `advanceTime(0)` included, never inside the call; no error. Nothing else happens.
- **`TimerStart` on a resumed timer**: an ordinary start, which drops the fires the resume still owed.
- **A second pause and resume**: the same two fires, counted from the latest pause's remaining; a pause in the second countdown stores what is left of that countdown.
- **`ResumeTimer` on a resumed timer that stopped**, or on a one-shot timer that expired after a pause: two fires again, the first after the remaining of the last pause, however old.
- **The readings**: a timer that is not running answers the last pause's remaining and the timeout minus it, a negative elapsed included where the game gives one. A stub that keeps the one stored remaining gets all of them without a special case.
- **A doubled `ResumeTimer`, and a `PauseTimer` on an expired timer**, change nothing.

Left unmeasured: why a timer never started gives one expire event and not two. The stub copies the one event.
