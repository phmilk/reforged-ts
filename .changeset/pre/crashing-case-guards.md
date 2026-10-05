---
"eslint-plugin-reforged": minor
"reforged-ts": patch
---

Guards for the Crashing cases of the Nullability sweep: calls that crashed the game for every player on 3.0.0.24268.

**`no-crashing-arguments`** (error), a new lint rule. It reports a call whose literal arguments crashed the game in a Crashing case, read from the plugin's new data file `data/crashing-arguments.json`: today `BlzCreateFrameByType` and `Frame.createType` with the type `SIMPLEMESSAGEFRAME` or `CONTROL` and `inherits` `""`. Arguments match by the callee's parameter name, and only literals are reported: a template, another type or a value computed at run time is not. The message names the Crashing case, its Build and the replacement: inherit an FDF template that defines the type's fields.

**`no-event-response-outside-event`** reports `GetExpiredTimer` and `Timer.fromExpired()` written directly in a trigger's handler (a callback given to `on(...)`, `trigger.addAction` or `TriggerAddAction`), with a message of its own: there the call crashes the game, even when the trigger fires from a timer's callback, since a trigger's handler runs in a new thread. Use the Timer that `Timer.start` passes its handler instead, kept where the trigger's handler can read it. A helper called from the handler is still not reported.

In Dev mode, **`Frame.createType`** throws for the same arguments as `no-crashing-arguments`, before it calls the Native: `reforged-ts: Frame.createType of a CONTROL frame with inherits "" crashes the game (a Crashing case on 3.0.0.24268): inherit an FDF template that defines the type's fields`, at the calling line.

In Dev mode, **`Image.create`** throws at the calling line when the image type is not an integer from 1 to 4, before it calls `CreateImage`: image type 2147483647 crashed the game, and 0 returned a Placeholder handle.

`Timer.fromExpired`'s documentation says what the sweep measured: it crashes the game in a trigger's handler, and returns `undefined` in the callback of a destroyed timer. `FogModifier.create` and `FogModifier.createAtPoint` note that a radius of 2147483647 crashed the game.
