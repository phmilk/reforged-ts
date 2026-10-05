---
"eslint-plugin-reforged": minor
"reforged-ts": patch
---

`no-event-response-outside-event` reports `GetExpiredTimer` and `Timer.fromExpired()` written directly in a trigger's handler (a callback given to `on(...)`, `trigger.addAction` or `TriggerAddAction`), with a message of its own: there the call crashes the game, even when the trigger fires from a timer's callback, since a trigger's handler runs in a new thread (measured by the Nullability sweep on 3.0.0.24268). Use the Timer that `Timer.start` passes its handler instead, kept where the trigger's handler can read it. A helper called from the handler is still not reported. `Timer.fromExpired`'s documentation says what the sweep measured: it crashes the game in a trigger's handler, and returns `undefined` in the callback of a destroyed timer.
