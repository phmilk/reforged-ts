---
"reforged-ts": major
---

Init stages under `pcall`, `Reforged.configure({ devMode })`, and no library Handle born in the Lua root.

**The `Init` stages.** `Init.onGlobals`, `Init.onTriggers`, `Init.onInitTriggers` and `Init.onGameStart` register a callback for the stage after the Blizzard function of that name (`InitGlobals`, `InitCustomTriggers`, `RunInitializationTriggers`, `MarkGameStarted`); the editor's code runs first and unchanged. Every callback runs under `pcall`, in registration order, after the library's own callbacks for the stage: a failure prints one line on screen, `reforged-ts: globals callback "spawn heroes" failed: <message>` (the stage, the optional label given at registration or the callback's ordinal, and the message), and the next callback still runs. A callback registered after its stage ran runs at once; one registered during the stage's run joins it. `Init.hasRun(stage)` and `Init.current` read where initialization stands. Both load positions work: from the Template bundle every function exists and is wrapped in place; from the map header the missing ones are captured on their first assignment through the library's `_G` metatable, which composes with the map's own metatable and restores it. Wrapping is idempotent, and at `MarkGameStarted` any stage whose function never ran runs first, in order, so nothing registered is lost. The library keeps its Init state under the global `reforged-ts` (a table), so a Lua root that executes twice keeps one set of wrappers and queues; maps must not touch it.

**`Reforged.configure({ devMode })`.** The one flag the runtime Guards read, off by default, read at registration time and never on the hot path. `Reforged.devMode` reads it. The Template's generated environment object can be passed as is. A call that changes the flag after a callback was registered prints a warning and affects only later registrations.

**The deprecated alias.** `addScriptHook` and `W3TS_HOOK` stay for this one release, marked `@deprecated` with the stage that replaces each entry point (`main::before` is `Init.onGlobals`, later by design; `main::after` is `Init.onInitTriggers`, the same moment; the two `config` entry points have no stage yet), at their old timing, now each under `pcall` and working in both load positions. Both are removed in 2.0.

**Removed** (each listed in `migration/renames.json`): the old Hook code's internal functions `hookedMain`, `hookedConfig`, `executeHooksMainBefore`, `executeHooksMainAfter`, `executeHooksConfigBefore` and `executeHooksConfigAfter`.

**Behaviour changes** (detailed in `migration/behaviour-changes.md`):

- `tsGlobals.Players` is empty until the `globals` stage, so it is no longer readable at module top level;
- `addScriptHook` hooks run under `pcall` with a printed line instead of ending initialization silently;
- the game-time Timer starts after `MarkGameStarted` (the host detection, opt-in since build step 6, has no Timer until `Host.detectHost()` runs), and the sync Trigger and its events are created at the `globals` stage;
- requiring the library makes no Handle-creating Native call;
- from the map header, the library is no longer inert: it captures `main`, `config` and the init functions as the editor's script defines them.
