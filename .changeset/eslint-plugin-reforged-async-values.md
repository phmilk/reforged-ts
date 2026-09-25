---
"eslint-plugin-reforged": minor
---

**`no-async-value-as-state`** (warning). Reports a value that differs between clients flowing into game state. The sources are a call whose resolved declaration carries the `@async` doc tag (the Natives of `reforged-types`, and `reforged-ts` members such as `MapPlayer.fromLocal`), a read of an `@async` getter of `reforged-ts`, and Lua's `os.clock`, `os.time`, `os.date` and `os.difftime`. The value is state when it reaches, directly or through one `const`, an argument of a call that is neither a text sink nor a visual entry of `data/local-safe.json`, a module-level or exported variable, or a table key. An argument of `new SyncRequest(...)` or `request.start(...)` is not state. The message names the sync System. No fix.

**`async-natives.json`.** The plugin reads the list of async Natives from the Map project's own installation of `reforged-types`. Without it, the plugin warns once at load and disables the rule; a list with an unexpected shape throws a `DataFileError` naming the field.
