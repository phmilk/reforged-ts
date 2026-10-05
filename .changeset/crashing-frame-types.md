---
"eslint-plugin-reforged": minor
"reforged-ts": minor
---

Guard the Crashing case of `BlzCreateFrameByType`: on 3.0.0.24268, creating a `SIMPLEMESSAGEFRAME` or `CONTROL` frame by type with `inherits` `""` crashes the game for every player.

**`no-crashing-arguments`** (error), a new lint rule. It reports a call whose literal arguments crashed the game in a Crashing case of the Nullability sweep, read from the plugin's new data file `data/crashing-arguments.json`: today `BlzCreateFrameByType` and `Frame.createType` with the type `SIMPLEMESSAGEFRAME` or `CONTROL` and `inherits` `""`. Arguments match by the callee's parameter name, and only literals are reported: a template, another type or a value computed at run time is not. The message names the Crashing case, its Build and the replacement: inherit an FDF template that defines the type's fields.

**`Frame.createType`** throws in Dev mode for the same arguments, before it calls the Native: `reforged-ts: Frame.createType of a CONTROL frame with inherits "" crashes the game (a Crashing case on 3.0.0.24268): inherit an FDF template that defines the type's fields`, at the calling line.
