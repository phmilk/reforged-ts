---
"eslint-plugin-reforged": minor
---

Initial release: the lint layer of the Guards. Twelve type-aware rules report the Warcraft III scripting pitfalls (desync, crash, leak) of a Map project before it compiles: six errors and six warnings, all enabled by `configs.recommended`.

**The plugin.** `eslint-plugin-reforged` exports the plugin object (`meta`, `rules`, `configs`). A Map project enables every rule by spreading `configs.recommended` after typescript-eslint's type-checked presets; the config registers the plugin as `reforged` and sets no parser and no project options. Every rule's `meta.docs.url` points to `https://phmilk.github.io/reforged-ts/<docs version>/lint/<rule>`, and one page per rule ships in `docs/`.

**Optional packages.** The plugin reads the data files of `reforged-ts` (`migration/renames.json`) and `reforged-types` (`async-natives.json`) from the Map project's own installation, found from the project root: the working directory, or `createPlugin({ projectRoot })`. When the package is missing, the plugin prints one warning at load naming the package and the rules, and registers those rules disabled. A file present with an unexpected shape throws a `DataFileError` naming the field.

Its cost over typescript-eslint's type-checked preset, measured on the fixture project (`pnpm --filter eslint-plugin-reforged measure-cost`), is about 10%.

### Errors

**`no-game-state-in-local-branch`** (error). Reports game state changed inside a branch that runs for the local player only: the consequent of an `if`, a conditional or `&&`/`||` whose test reads `GetLocalPlayer()`, `MapPlayer.fromLocal()` or `player.isLocal()` (directly, in an equality, or through one `const`), the `else` branch of a negated test, the function passed to `MapPlayer.runLocal`, and functions defined there. Inside it, the rule reports a Native or Wrapper member that `data/local-safe.json` does not list, a creation, `Filter`/`Condition`, `ForGroup`/`ForForce`, `GetRandomInt`/`GetRandomReal`/`SetRandomSeed` and `Math.random`. Visual calls (frames, camera, sound, vertex colours), text displays and the pure Natives (converters, math and string Natives, frame lookups) pass; pure computation and calls to project functions are not reported. A value getter such as `GetUnitX` is reported. The `allow` option adds names treated as visual. No fix and no suggestion.

**`no-dotted-asset-paths`** (error). Reports a string literal, or a template literal without substitutions, whose file name ends in `.mdx`, `.mdl`, `.blp`, `.dds` or `.tga` (case-insensitive) and holds another dot before the extension, which the game does not read since 3.0.0. A suggestion replaces the inner dots with underscores. Option `extensions` replaces the list.

**Creations.** Two rules report creations, the Handles a Map project makes: a Wrapper's `create*` static, or a Native listed in the plugin's reviewed `data/creation-natives.json` (`Create*`, `BlzCreate*`, `AddSpecialEffect*`, `AddLightning*`, `DialogCreate`, `Location`, ...) that returns a Handle type other than a registration type. Lookups and conversions (`Player`, `GetTriggerUnit`, `Convert*`) are never creations.

**`no-handles-at-module-top-level`** (error). Reports a creation at module top level, which a TSTL bundle runs in the Lua root: top-level initialisers, class static initialisers, immediately invoked functions and object literals evaluated at load. The message points to the `Init.onGlobals` stage. No fix and no suggestion.

**`no-legacy-w3ts-names`** (error). Reports the w3ts 3.x names reforged-ts renamed or removed, from the rename map the library publishes (`reforged-ts/migration/renames.json`): an import from `w3ts`, an imported export, a member or static access on a library class (matched through the type checker, so a project class of the same name is not reported), and a `new` of a library class. The message gives the replacement and the entry's note; a removed symbol reads as removed. One-to-one entries are fixed: the package name in imports, `new Unit(...)` to `Unit.create(...)`, and same-signature member renames, importing the class when the receiver changes. The other renames are suggestions, one per replacement.

**`no-unsafe-natives`** (error). Reports a call to a Native on the plugin's ban list, `data/unsafe-natives.json`: `TriggerSleepAction`, `PolledWait`, `DestroyEffectAfterTimeBJ`, `CreateTimerBJ`, `StartTimerBJ`, `GetLastCreatedTimerBJ`, `SelectGroupForPlayerBJ` and `SmartCameraPanBJ`. The message gives the entry's reason and replacement. The callee must resolve, through the type checker, to the Native declared in `reforged-types`: a project function of the same name is not reported. Option `allow` removes entries for a project. A ban list with an unexpected shape throws at plugin load, naming the field.

**`no-unused-handle-result`** (error). Reports an expression statement that discards a creation or a `Filter`/`Condition` boolexpr, which then leaks. `Timer.after` and the other statics not named `create*` are never reported. No fix.

### Warnings

**`no-async-value-as-state`** (warning). Reports a value that differs between clients flowing into game state. The sources are a call whose resolved declaration carries the `@async` doc tag (the Natives of `reforged-types`, and `reforged-ts` members such as `MapPlayer.fromLocal`), a read of an `@async` getter of `reforged-ts`, and Lua's `os.clock`, `os.time`, `os.date` and `os.difftime`. The value is state when it reaches, directly or through one `const`, an argument of a call that is neither a text sink nor a visual entry of `data/local-safe.json`, a module-level or exported variable, or a table key. A pure Native of the allowlist (`R2S`, `R2I`, ...) passes the value on through its result. An argument of `new SyncRequest(...)` or `request.start(...)` is not state. The message names the sync System. No fix.

**`no-unordered-iteration`** (warning). Reports what typescript-to-lua compiles to Lua's `pairs`, whose order differs between clients: `for...in`, `Object.keys`, `Object.values`, `Object.entries`, direct calls to `pairs` and `next`, and `for...of` over a `LuaTable`, `LuaMap` or `LuaSet`. `Map` and `Set` keep insertion order in the runtime library and are not reported. The message names `SyncedMap`/`SyncedSet` and `for...of` over an array.

**`no-handle-id-as-data`** (warning). Reports a call to `GetHandleId`, and a read of a Wrapper's `id` accessor, whose value does not reach a text-display Native: in a Lua map the id of the same Handle can differ between clients, so a key, a comparison or state built on it desyncs. Key by the Handle or Wrapper itself. The rule follows the value into a display call through a template, a concatenation, `String()`/`tostring`, `I2S`/`R2S`/`R2SW` and one `const`; `MapPlayer#id` (the player slot) is not reported.

**`no-percent-in-display-strings`** (warning). Reports a string literal or template with a lone `%` that reaches a text-display Native: the display Natives (`DisplayTextToPlayer`, `DisplayTimedTextToPlayer`, `DisplayTimedTextFromPlayer`, `DisplayTextToForce`, `DisplayTimedTextToForce`, `BJDebugMsg`), `print`, `BlzFrameSetText`, `BlzFrameAddText` and the `Frame` members `setText`, `addText` and `text`. The rule follows the string through a template literal, a concatenation, `String()`, `tostring` or `I2S`/`R2S`/`R2SW`, and one `const`. A suggestion doubles the `%`, which the game displays as `%`.

**`prefer-handle-map`** (warning). Reports `new Map` and `new Set` whose key type is a Wrapper, written or inferred: the table keeps its entry after the Handle is destroyed. A suggestion changes the constructor to `HandleMap`/`HandleSet`; the author adds the import. `WeakMap` and `WeakSet` are not reported.

**`no-self-recursion`** (warning). Reports a function declaration, function expression, `const` arrow or method that calls itself by name in its own body, outside nested functions. The message says the stock Lua 5.3 stack limits are unverified for the game's build.

### Data files

**The allowlist.** `data/local-safe.json` lists the Natives and library members that only change what the local player sees or hears (`visual`: frame setters, vertex colours, the camera, sounds and music) or that display a string (`text`), and the Natives whose result depends on their arguments alone (`pure`: `I2S`, `R2S`, `SquareRoot`, `SubString`, `BlzGetFrameByName`, ...), each with its reason. A file with an unexpected shape throws at plugin load, naming the field.

**`async-natives.json`.** The plugin reads the list of async Natives from the Map project's own installation of `reforged-types`. Without it, the plugin warns once at load and disables the rule; a list with an unexpected shape throws a `DataFileError` naming the field.
