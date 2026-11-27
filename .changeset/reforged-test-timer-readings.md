---
"reforged-test": minor
---

Timers read and resume under the Game clock as they do in the game, so a map that pauses and resumes a timer fails its test as it fails in the game.

- `TimerGetElapsed` and `TimerGetRemaining` follow the clock, where they answered 0.0: a running timer reads the time since `TimerStart` and the timeout minus it, a paused one what it read at the pause, a one-shot timer its timeout and 0 from its handler on, a periodic one the timeout and 0 in its handler and a new count after it. A timer that is not running reads the remaining its last pause stored, kept across `TimerStart`.
- `ResumeTimer` copies the game, where it armed nothing: on a timer that is not running it counts what was left, fires, counts the timeout, fires once more and stops, one-shot or periodic alike. On a running timer it does nothing, an expired one-shot timer resumed fires on the next advance, and `TimerStart` drops what a resume had left to do.
- The Triggers of a timer's expire event (`TriggerRegisterTimerExpireEvent`) fire at each expiry of the timer, before its handler, with the timer as `GetExpiredTimer`'s answer. A timer never started, resumed, fires them once.
- A test that reads a running timer without advancing the clock now reads its timeout as the remaining time, not 0.0. Inside a handler `__stub_fire_timer` runs, the timer reads as in the handler of an expiry.
