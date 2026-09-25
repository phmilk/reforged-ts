---
"reforged-test": minor
---

Test controls for the runtime Guards, so a test can run code as another client, read what reached the log and the screen, enter the globals Init stage, re-enter a damage handler, and check which function a Native was handed.

- **`players.lua`**: `__stub_set_local_player(slot)` makes another slot the local player (slot 0 until then) and returns the slot it replaced; `__stub_local_player()` returns its handle without a call-log line.
- **Output capture.** The baseline's `print` writes to a capture instead of the terminal; `__stub_printed()` returns the lines. **`display.lua`**, a new family: `DisplayTextToPlayer`, `DisplayTimedTextToPlayer` and `DisplayTimedTextFromPlayer` are recorded and keep what they showed to which player, returned by `__stub_displayed()`; `ClearTextMessages` is recorded.
- **The globals Init stage.** `__stub_init_globals()` calls the global `InitGlobals`, defining it first by a plain assignment when nothing did, so the library's wrapper runs the stage.
- **Nested damage dispatch.** `UnitDamageTarget` is recorded, returns true and dispatches the damage at once through `__stub_dispatch_damage(damage)`, which fires the triggers registered for a damaging and then a damaged event on the target (its unit, or its owner through a player-unit registration whose filter accepts it, with `GetFilterUnit`, now stubbed, answering the target) with the damage response Natives in the firing context. An action that deals damage dispatches again inside its own firing; past 32 nested dispatches the harness throws, instead of the client crashing as the game does.
- **Call arguments.** `__stub_args(name)` returns the arguments of every recorded call of a Native by identity, so a test sees which function `TimerStart`, `TriggerAddAction`, `Condition` or `Filter` received.
