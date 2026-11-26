---
"reforged-test": minor
---

The Game clock: `game.advanceTime(seconds)` moves game time by hand, on `reforged-test/map`, and every timer that expires in the window fires, the library's own included, so a countdown is tested without finding its timer.

- Game time starts at 0 and nothing expires on its own. The timers fire in the order of their instants, those of one instant in the order of `TimerStart`, each handler with the clock at its instant; a periodic timer fires once per period without drift, and a timer a handler starts fires in the same advance when it expires inside the window.
- A one-shot timer of timeout 0 fires on the next advance, `game.advanceTime(0)` included, never inside `TimerStart`; a periodic one fires every 0.0001 s, as in the game.
- A Trigger of `TriggerRegisterTimerEvent` fires through the Event dispatch, once or once per period.
- `DestroyTimer`, `PauseTimer` and a new `TimerStart` cancel the pending expiry. An error a handler throws leaves the advance, the clock stopped at that instant; a negative advance is an error.
- On `reforged-test/lua`, `__stub_advance_time(seconds)` is the same advance, declared in `reforged-test/stubs` with `__stub_schedule(timeout, periodic, expire)`, which arms an expiry of a stub file of your own on the Game clock. A test that never advances the clock reads what it read before, and `__stub_fire_timer` is unchanged.
