# What a paused, an expired and a zero-period timer answer

What `TimerGetElapsed`, `TimerGetRemaining` and `TimerGetTimeout` answer on a paused timer and on a one-shot timer that expired, and what a timer of timeout 0 does, measured for [#947](https://github.com/phmilk/reforged-ts/issues/947), a ticket of the wayfinder map [#931](https://github.com/phmilk/reforged-ts/issues/931). It decides what the timers stub of `reforged-test` answers once it has the Game clock ([#935](https://github.com/phmilk/reforged-ts/issues/935)). The run also measured what `ResumeTimer` leaves behind, which nobody had asked and which is the surprise of the run.

## TL;DR

Everything below is Observed, in two runs that agree on every value they share.

| Case                                             | `TimerGetElapsed`                | `TimerGetRemaining`        | `TimerGetTimeout` |
| ------------------------------------------------ | -------------------------------- | -------------------------- | ----------------- |
| a timer never started                            | 0                                | 0                          | 0                 |
| a running timer                                  | the time since `TimerStart`      | the timeout minus it       | the timeout       |
| a paused timer, for as long as it stays paused   | frozen at the pause              | frozen at the pause        | the timeout       |
| a one-shot timer, in its handler and ever after  | the timeout                      | 0                          | the timeout       |
| a periodic timer, in its handler                 | the timeout                      | 0                          | the timeout       |
| a periodic timer, right after its handler        | 0, counting again                | the timeout, counting down | the timeout       |
| a resumed timer, until what was left runs out    | the time since **`ResumeTimer`** | what is left               | the timeout       |
| a one-shot timer of timeout 0, right after start | 0                                | 0.0001                     | 0                 |
| a timer of timeout 0, in its handler             | 0                                | 0                          | 0                 |

- **A paused timer does not move and does not fire**: paused 1.5 s into a timeout of 4, it reads 1.5 and 2.5 at the pause, 1 s later and 5.5 s later, and its handler never runs.
- **A one-shot timer that expired keeps its last reading**: elapsed is the timeout and remaining 0 in the handler, 1 s after and 3 s after. `GetExpiredTimer()` is the timer, in the handler.
- **A timeout of 0 is a period of 0.0001 s.** A periodic timer of timeout 0 fired 10082 times in one second of game time, exactly as one of timeout 0.0001 did; 0.001 fired 1000 times and 0.01 fired 100 times. Nothing stalled. `TimerGetTimeout` still answers 0, while `TimerGetRemaining` right after `TimerStart` answers 0.0001.
- **A one-shot timer of timeout 0 never fires inside `TimerStart`**: the line after `TimerStart` runs first, and the handler runs with the game's clock at the same reading (a delay of 0 at the 1/128 s the reference clock resolves).
- **`ResumeTimer` does not take the countdown up as if nothing had happened.** A resumed timer fires when what was left runs out, **then once more a full timeout later, then stops**, whether it is one-shot or periodic: a one-shot timer fires twice, and a periodic timer stops being periodic. After the second fire it reads, forever, the elapsed and remaining it had at the pause.
- **`ResumeTimer` on a running timer that was never paused changes nothing.** On a one-shot timer that already expired, it fires it at once, then once more a full timeout later.

## The runs

- Probe: `probe/probes/timer-answers.ts`, on the throwaway branch `research/timer-answers` (never merged; this file was copied from it for [#985](https://github.com/phmilk/reforged-ts/issues/985)).
- Run `1619d5c6-af85-4699-bde5-801bfab8011a`, 2026-11-26, `finished`, 43 records: the three questions of the ticket.
- Run `af61abcf-a015-4c93-bba7-794fcdf3a771`, 2026-11-26, `finished`, 177 records: the same 43 records, every value identical, then the resume study, added because the first run showed a resumed periodic timer firing twice and stopping.
- Typings of Patch 3.0.1.24370; client on Build 3.0.1.24371, accepted with `--client-build 3.0.1.24371` (a hotfix of the same Game version, `probe/README.md`, "Running a Probe run").
- Command: `pnpm probe:run timer-answers --client-build 3.0.1.24371`.

Every record carries `now`, the `TimerGetElapsed` of a reference timer of timeout 100000 started first. It resolves 1/128 s (0.0078125), the precision of a 32-bit float near 100000, and its first reading is 0.0078125: every `now` below is 0.0078 late, and two instants closer than that read the same. The later steps run from the runner's `p.after`, each a timer of its own.

## A paused timer

A one-shot timer of timeout 4, `PauseTimer` at 1.5, `ResumeTimer` at 2.5; a second one paused at 1.5 and never resumed; a periodic timer of timeout 1, paused at 1.5 and resumed at 2.5.

| Timer                   | Moment                        | `now` | Elapsed | Remaining | Timeout |
| ----------------------- | ----------------------------- | ----- | ------- | --------- | ------- |
| one-shot 4              | right after `TimerStart`      | 0.008 | 4.8e-07 | 4.0       | 4.0     |
| one-shot 4              | before `PauseTimer`           | 1.508 | 1.5     | 2.5       | 4.0     |
| one-shot 4              | right after `PauseTimer`      | 1.508 | 1.5     | 2.5       | 4.0     |
| one-shot 4              | paused for 1 s                | 2.508 | 1.5     | 2.5       | 4.0     |
| one-shot 4              | right after `ResumeTimer`     | 2.508 | 0.0     | 2.5       | 4.0     |
| one-shot 4              | resumed for 1 s               | 3.508 | 1.0     | 1.5       | 4.0     |
| one-shot 4              | in its handler                | 5.008 | 1.5     | 2.5       | 4.0     |
| one-shot 4              | 2 s after its handler         | 7.008 | 2.0     | 2.0       | 4.0     |
| one-shot 4, not resumed | right after `PauseTimer`      | 1.508 | 1.5     | 2.5       | 4.0     |
| one-shot 4, not resumed | paused for 5.5 s, no fire     | 7.008 | 1.5     | 2.5       | 4.0     |
| periodic 1              | in its first handler          | 1.008 | 1.0     | 0.0       | 1.0     |
| periodic 1              | before and after `PauseTimer` | 1.508 | 0.5     | 0.5       | 1.0     |
| periodic 1              | paused for 1 s                | 2.508 | 0.5     | 0.5       | 1.0     |
| periodic 1              | right after `ResumeTimer`     | 2.508 | 0.0     | 0.5       | 1.0     |
| periodic 1              | in its second handler         | 3.008 | 0.5     | 0.5       | 1.0     |
| periodic 1              | in its third handler          | 4.008 | 0.5     | 0.5       | 1.0     |
| periodic 1              | at 7, after 3 fires in all    | 7.008 | 0.5     | 0.5       | 1.0     |

The pause itself is as expected: the two readings freeze, the timeout stays, and the handler of the timer never resumed did not run in the 5.5 s that followed. What is not expected is everything after `ResumeTimer`: the elapsed time restarts at 0, the handler reads the values of the pause, the one-shot timer is counting again 2 s after its handler (elapsed 2, remaining 2, of a timeout of 4), and the periodic timer fired at 3 and at 4 and never again. The second run looked at that alone.

## What `ResumeTimer` leaves behind

Five timers started together, each read every 0.5 s for 12 s, every fire recorded. `t` is the time since they started. `PauseTimer` at 1.25, `ResumeTimer` at 2.25, except where the row says otherwise.

| Timer                                                    | Fires at `t`           | After its last fire                       |
| -------------------------------------------------------- | ---------------------- | ----------------------------------------- |
| one-shot 4, paused for 1 s                               | 5.0, 9.0               | elapsed 1.25, remaining 2.75, to the end  |
| periodic 1, paused for 1 s                               | 1.0, then 3.0, 4.0     | elapsed 0.25, remaining 0.75, to the end  |
| periodic 1, paused and resumed on the same line, at 1.25 | 1.0, then 2.0, 3.0     | elapsed 0.25, remaining 0.75, to the end  |
| one-shot 1, expired at 1.0, `ResumeTimer` at 2.25        | 1.0, then 2.258, 3.258 | elapsed 1.0, remaining 0, to the end      |
| one-shot 4, never paused, `ResumeTimer` at 1.25          | 4.0                    | elapsed 4.0, remaining 0, as any one-shot |

What the readings between the fires show, for the one-shot timer of 4 paused for 1 s:

| `t`         | Elapsed      | Remaining  | What it is doing                                     |
| ----------- | ------------ | ---------- | ---------------------------------------------------- |
| 1.5, 2.0    | 1.25         | 2.75       | paused                                               |
| 2.5 to 5.0  | 0.25 to 2.75 | 2.5 to 0.0 | counting what was left, elapsed from `ResumeTimer`   |
| 5.0         | 1.25         | 2.75       | first fire; in the handler, the values of the pause  |
| 5.5 to 9.0  | 0.5 to 4.0   | 3.5 to 0.0 | counting a full timeout again                        |
| 9.0         | 1.25         | 2.75       | second fire; in the handler, the values of the pause |
| 9.5 to 12.0 | 1.25         | 2.75       | stopped                                              |

So, as observed, `ResumeTimer` on a timer that is not running (paused, or expired) starts it for what is left, with the elapsed time counted from the resume; when that runs out the handler runs and the timer starts once more for its full timeout; when that runs out the handler runs a second time and the timer stops for good, reading what it read at the pause. The periodic flag plays no part: the periodic timers fired twice after the resume and stopped, like the one-shot ones. A timer started again with `TimerStart` was not measured after a resume.

The library's `Timer.resume` says "Continues a paused countdown from where `pause` stopped it" (`packages/reforged-ts/src/handles/timer.ts`), which holds only up to the first fire.

## A one-shot timer that expired

A one-shot timer of timeout 1.

| Moment                   | `now` | Elapsed | Remaining | Timeout |
| ------------------------ | ----- | ------- | --------- | ------- |
| right after `TimerStart` | 0.008 | 1.2e-07 | 0.9999999 | 1.0     |
| in its handler           | 1.008 | 1.0     | 0.0       | 1.0     |
| 1 s after                | 2.008 | 1.0     | 0.0       | 1.0     |
| 3 s after                | 4.008 | 1.0     | 0.0       | 1.0     |

`GetExpiredTimer() == timer` in the handler. A timer never started reads 0, 0 and a timeout of 0 (its elapsed prints as `-0.0`).

## A timer of timeout 0

One-shot: `TimerStart(timer, 0, false, handler)` returned before the handler ran; right after it the timer read elapsed 3.4e-07, remaining 9.97e-05 and timeout 0. The handler ran with `now` unchanged (7.0078 at the start and at the fire), and read elapsed `-0.0`, remaining 0, timeout 0.

Periodic, each counted by its own handler until a one-shot timer of 1 s, started on the line before, paused it:

| Timeout given | Fires in 1 s | Fires inside `TimerStart` | Remaining right after `TimerStart` | `TimerGetTimeout` | First three fires at `now` |
| ------------- | ------------ | ------------------------- | ---------------------------------- | ----------------- | -------------------------- |
| 0.01          | 100          | 0                         | 0.0099993                          | 0.01              | +0.0156, +0.0234, +0.0313  |
| 0.001         | 1000         | 0                         | 0.00099945                         | 0.001             | +0.0078, +0.0078, +0.0078  |
| 0.0001        | 10082        | 0                         | 0.0000992                          | 0.0001            | +0.0078, +0.0078, +0.0078  |
| 0             | 10082        | 0                         | 0.0000992                          | 0                 | +0.0078, +0.0078, +0.0078  |

The rows of 0 and of 0.0001 are the same in every measured value but the timeout the game reports: the game runs a timeout of 0 as one of 0.0001 s. The 82 fires above 10000 are the same in both, so they come from how the game adds 0.0001 up, not from the zero. The fires are not spread one per frame: several run at one reading of the clock. The game did not stall or slow visibly at 10000 handlers a second, each a counter increment.

## What it means for the Game clock

For whoever writes the Spec; none of this is decided here.

- **Paused and expired**: the stub can answer exactly what the game does, from the table of the TL;DR: frozen readings while paused; the timeout and 0 from a one-shot timer's handler on; the timeout and 0 inside a periodic timer's handler, 0 and the timeout once it returns.
- **A periodic timer of timeout 0** has a period in the game, 0.0001 s, so "an error that names the timer" (the placeholder of #935) is no longer the only honest answer: `game.advanceTime(1)` over one would run 10000 handlers, which is what the game does. A one-shot timer of timeout 0 firing on the next advance, `advanceTime(0)` included, matches the game: it never fires inside `TimerStart`, and fires with the clock where it was.
- **`ResumeTimer`**: #935 settled "`ResumeTimer` takes it up again". The game fires a resumed timer twice and ends a periodic one. Whether the stub copies that, or keeps the countdown a reader expects and the docs say where the game differs, is a decision this run opens.
