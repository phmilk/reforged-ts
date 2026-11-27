---
"reforged-test": minor
---

Timers read and resume under the Game clock as they do in the game, so a map that pauses and resumes a timer fails its test as it fails in the game.

- `TimerGetElapsed` and `TimerGetRemaining` follow the clock: a running timer reads the time since `TimerStart` and the timeout minus it, a paused one what it read at the pause, a one-shot timer its timeout and 0 from its handler on. A test that read 0.0 from a running timer now reads these.
- `ResumeTimer` copies the game: on a timer that is not running it counts what was left, fires, counts the timeout, fires once more and stops, one-shot or periodic alike. A test that expects a resumed timer to carry on as before fails, as the map does in the game.
- The Triggers of a timer's expire event (`TriggerRegisterTimerExpireEvent`) fire at each expiry of the timer, before its handler.
