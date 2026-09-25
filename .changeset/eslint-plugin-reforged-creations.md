---
"eslint-plugin-reforged": minor
---

Two rules on creations, the Handles a Map project makes: a Wrapper's `create*` static, or a Native listed in the plugin's reviewed `data/creation-natives.json` (`Create*`, `BlzCreate*`, `AddSpecialEffect*`, `AddLightning*`, `DialogCreate`, `Location`, ...) that returns a Handle type other than a registration type. Lookups and conversions (`Player`, `GetTriggerUnit`, `Convert*`) are never creations.

**`no-handles-at-module-top-level`** (error). Reports a creation at module top level, which a TSTL bundle runs in the Lua root: top-level initialisers, class static initialisers, immediately invoked functions and object literals evaluated at load. The message points to the `Init.onGlobals` stage. No fix and no suggestion.

**`no-unused-handle-result`** (error). Reports an expression statement that discards a creation or a `Filter`/`Condition` boolexpr, which then leaks. `Timer.after` and the other statics not named `create*` are never reported. No fix.
