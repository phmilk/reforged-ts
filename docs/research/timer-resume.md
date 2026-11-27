# What Timer.resume does over TimerStart

What the library's `Timer.resume` does once it no longer calls `ResumeTimer` but starts the Timer again with `TimerStart` for what was left at the pause, and the facts of the game it relies on, measured for [#962](https://github.com/phmilk/reforged-ts/issues/962). Why `ResumeTimer` is not used: [timer-answers.md](timer-answers.md), "What `ResumeTimer` leaves behind" ([#947](https://github.com/phmilk/reforged-ts/issues/947)), and [timer-resume-cases.md](timer-resume-cases.md) ([#961](https://github.com/phmilk/reforged-ts/issues/961)): a timer `ResumeTimer` resumes fires when what was left runs out, once more a full timeout later, then stops, one-shot or periodic alike.

## TL;DR

Everything below is Observed, in two runs that agree on every value they share.

- **`TimerStart` on a timer `PauseTimer` stopped is an ordinary start for its fires**: a one-shot timer fires once at the new timeout, a periodic one every new timeout, the old handler never again. Its readings are a fresh timer's while it counts. One reading is not: a one-shot timer started so reads, once it expired, the remaining of the old pause and the new timeout minus it (remaining 1.5, elapsed -0.75 for a new timeout of 0.75), as #961 found. The Wrapper answers the timeout and 0 there instead.
- **A one-shot timer started again inside its own handler, periodic, keeps firing**: `TimerStart(timer, 0.5, false, …)` whose handler calls `TimerStart(timer, 1, true, …)` fires at 0.5, then every second to the end of the run. That is how `resume` restores the period of a periodic Timer.
- **`PauseTimer` inside a periodic timer's handler stops it**: it fired twice and never again in the 10 s that followed, reading elapsed 1 and remaining 0.
- **The library's `Timer`**, every case of the issue:

| Case (timeout 2, `pause` at 0.5, `resume` at 1, unless noted)                        | Fires at `t`                                             |
| ------------------------------------------------------------------------------------ | -------------------------------------------------------- |
| one-shot, paused then resumed                                                        | 2.5, and no other                                        |
| periodic, paused then resumed                                                        | 2.5, 4.5, 6.5, 8.5, 10.5, 12.5: still firing at the end  |
| one-shot, paused again at 1.5 and resumed at 2                                       | 3, and no other                                          |
| periodic, paused again at 1.5 and resumed at 2, then at 5.5 and 6                    | 3, 5, then 7.5, 9.5, 11.5                                |
| `resume` at 1 on a running one-shot                                                  | 2, and no other                                          |
| `resume` at 1 on a running periodic                                                  | 2, 4, 6, 8, 10, 12                                       |
| `resume` at 1 on a Timer never started (an expire event registered)                  | none                                                     |
| `resume` at 2 on a one-shot of 1 that expired at 1, alone or after `pause` at 1.5    | 1, and no other                                          |
| `start(0.75, true, …)` at 1 on a paused one-shot                                     | the new handler every 0.75 from 1.75; the old never      |
| `start(0.75, false, …)` at 1 on a paused periodic                                    | the new handler at 1.75, and no other                    |
| `start(0.75, true, …)` at 1.5 on a resumed one-shot                                  | the new handler every 0.75 from 2.25; the old never      |
| `start(0.75, false, …)` at 1.5 on a resumed periodic                                 | the new handler at 2.25, and no other                    |
| periodic of 1, `pause` in its second handler (at 2), `resume` at 3.25                | 1, 2, then 4.25, 5.25 … 12.25                            |
| `Timer.every(1, …)` failing from the resume on, in Dev mode, `pause` 1.5, `resume` 2 | 1, 2.5, 3.5 … 12.5; each failure caught as `Timer.every` |

- **The readings** (`elapsed`, `remaining`, `timeout` of the Wrapper) of a resumed Timer: `timeout` is the timeout `start` was given (2) throughout, where `TimerGetTimeout` reads what was left (1.5); `elapsed` goes on from the pause (0.5 right after the resume, 1.25 at 1.75), where `TimerGetElapsed` counts from the resume; `elapsed + remaining` is `timeout` at every sample. A one-shot Timer reads 2 and 0 from its handler on, where the Natives read 0 and 1.5. A paused Timer reads what it read at the pause.
- **One reading differs from an ordinary periodic expiry**: in the handler of the fire that ends what was left, a resumed periodic Timer reads elapsed 0 and remaining 2, the Timer having been started again for its timeout just before the handler; an ordinary periodic expiry reads 2 and 0.

## The runs

- Probe: `probe/probes/timer-resume.ts`.
- Run `2db83985-3cda-4f6c-8334-872d83b1b50e`, 2026-11-26, `finished`, 673 records.
- Run `3c490d96-edfd-465c-961a-f7bae8c7eacf`, 2026-11-26, `finished`, 672 records, after one change to the library: a `pause` in a periodic Timer's handler now stores a full timeout as what is left (below). Every fire and every reading of the other cases is identical to the first run's.
- Typings of Patch 3.0.1.24370; client on Build 3.0.1.24371, accepted with `--client-build 3.0.1.24371` (a hotfix of the same Game version, `probe/README.md`, "Running a Probe run").
- Command: `pnpm probe:run timer-resume --client-build 3.0.1.24371`.

Every record carries `t`, the `TimerGetElapsed` of a reference timer of timeout 1000 started first, which resolves 0.00006 s. Each timer is read before and after every call made on it, in its handler, and every 0.5 s from 0.25 on, so no sample falls on a call. A `lib-*` timer is read through the Wrapper's getters and through the Natives, side by side. The calls run from the runner's `p.after`. Dev mode is on for the whole run, and the Probe defines `__reforged_caught_error` to record each Caught error (ADR 0028).

## The pause in a periodic handler

The first run paused a periodic Timer of 1 in its second handler, at 2, and resumed it at 3.25. A periodic timer reads 0 left in its handler, so `pause` stored 0, and `resume` fired the handler 0.0001 s later, at 3.25, a fire the countdown did not owe: counted time since the fire at 2 was 0 at 3.25, so the next fire was due at 4.25. The game had kept its side of it: the raw timer paused in its handler never fired again, so the timer stays paused. The library now stores the full timeout when a periodic Timer reads 0 left at `pause`, and the second run fired at 4.25, 5.25 … 12.25, reading elapsed 0 and remaining 1 while paused.

## A resumed one-shot Timer, read

`lib-resumed-one-shot`, second run:

| `t`   | Moment         | `elapsed` | `remaining` | `timeout` | `TimerGetElapsed` | `TimerGetRemaining` | `TimerGetTimeout` |
| ----- | -------------- | --------- | ----------- | --------- | ----------------- | ------------------- | ----------------- |
| 0.5   | after `pause`  | 0.5       | 1.5         | 2         | 0.5               | 1.5                 | 2.0               |
| 1     | after `resume` | 0.5       | 1.5         | 2         | 1.2e-07           | 1.5                 | 1.5               |
| 1.75  | sample         | 1.25      | 0.75        | 2         | 0.75              | 0.75                | 1.5               |
| 2.5   | in its handler | 2         | 0           | 2         | 0.0               | 1.5                 | 1.5               |
| 12.25 | sample         | 2         | 0           | 2         | 0.0               | 1.5                 | 1.5               |

The Natives' columns are the game's: the timer started for 1.5 and expired, reading the remaining of the pause (#961). The Wrapper's are what `Timer` answers from what it remembers of the start and the pause.
