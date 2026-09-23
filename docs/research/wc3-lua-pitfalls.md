# Catalogue of common WC3 Lua pitfalls (desync, crash, leaks) and existing mitigations

Research note for ticket #15 (wayfinder:research). Feeds the ticket "Guard mechanisms for the first release". Facts only; no decision is made here.

Vocabulary: **Native** = a function/type/constant the game exposes to Lua map scripts. **Handle** = the game's opaque reference to an engine object. **Wrapper** = a library class owning one Handle. **System** = a library utility without a Handle. **Map project** = a repo consuming the library.

## Method and sources

Every claim below is tagged with a source key. Where a forum thread is the source, the poster and date are named so the claim can be traced to the post that owns it. Sources were read directly (thread HTML, the jassdoc repository at a pinned commit, the Lua 5.3 manual and interpreter source, the npm tarball of the typings package, and this repository's own files).

| Key | Source |
|---|---|
| [G] | Eikonium, *A comprehensive guide to mapping in Lua*, Hive Workshop thread 341880, post #1 (guide; author asked for community proofread of "Appendix - Desync Causes" in post #2, Sep 18 2022). https://www.hiveworkshop.com/threads/a-comprehensive-guide-to-mapping-in-lua.341880/ |
| [KC] | Ricola3D, *Known causes of desync*, Hive thread 317486, first post Jul 27 2019, with later additions by Ricola3D (Jul 6 2020), GrapesOfWath (Apr 26 2024), Insanity_AI (Oct 9 2024), Luashine (Aug 18-19 2025), riky (Oct 4 2025), Tomotz (Nov 15 2025). https://www.hiveworkshop.com/threads/known-causes-of-desync.317486/ |
| [JD] | lep/jassdoc, `common.j` and `Blizzard.j` annotation blocks (`@async`, `@bug`, `@note`, `@patch`), commit `8610958b3b77b8213f9db45ab664458650a07294` (Sep 17 2026). https://github.com/lep/jassdoc |
| [DU] | Eikonium, *Debug Utils (Ingame Console etc.)* v2.0a, Hive thread 330758. https://www.hiveworkshop.com/threads/debug-utils-ingame-console-etc.330758/ |
| [TI] | Bribe, *Total Initialization* v5.3.1, Hive thread 317099 (Jul 12 2019, last updated Aug 24 2023). https://www.hiveworkshop.com/threads/total-initialization.317099/ |
| [ST] | Eikonium, *SyncedTable*, Hive thread 332894 (May 30 2021). https://www.hiveworkshop.com/threads/syncedtable.332894/ |
| [LIG] | Bribe (with Tasyen, Dr Super Good, HerlySQR), *Lua-Infused GUI + Automatic Memory Leak Prevention*, Hive thread 317084 (updated Nov 7 2022). https://www.hiveworkshop.com/threads/lua-infused-gui-automatic-memory-leak-prevention.317084/ |
| [AL] | Antares, *ALICE 2.13 (Missiles, Physics & More)*, Hive thread 353126 (Sep 20 2026 version). https://www.hiveworkshop.com/threads/alice-2-12-3-missiles-physics-more.353126/ |
| [B30] | Wareditor, *Warcraft III 3.0 Bugs & issues*, Hive thread 374131 (first post Sep 13 2026; post #36 by Spacebuns Sep 15 2026). https://www.hiveworkshop.com/threads/warcraft-iii-3-0-bugs-issues.374131/ |
| [UH] | *[Lua] Units are created with different handles*, Hive thread 323619 (LazZ Mar 28 2020; Tasyen Feb 24 2022; Eikonium Feb 25 2022). https://www.hiveworkshop.com/threads/lua-units-are-created-with-different-handles.323619/ |
| [DP] | *desync problems (lua)*, Hive thread 323176 (bigbull Mar 9 2020; Uncle and TriggerHappy Mar 26-27 2020; bigbull Mar 28 2020). https://www.hiveworkshop.com/threads/desync-problems-lua.323176/ |
| [GLP] | *"GetLocalPlayer" causes DeSync??*, Hive thread 285913 (ZerGreenOne Jun 26 2016; PurgeandFire Jun 27 2016). https://www.hiveworkshop.com/threads/getlocalplayer-causes-desync.285913/ |
| [DD] | *[Lua] Does this desync?*, Hive thread 351545 (Bloodheaven_, Uncle, HerlySQR, Antares). https://www.hiveworkshop.com/threads/does-this-desync.351545/ |
| [MD] | *[lua] [desync] map desyncs*, Hive thread 357871 (Nichilus, Uncle, Tomotz, Jan 4 2025). https://www.hiveworkshop.com/threads/lua-desync-map-desyncs.357871/ |
| [UI] | Tasyen, *The Big UI-Frame Tutorial*, Hive thread 335296. https://www.hiveworkshop.com/threads/the-big-ui-frame-tutorial.335296/ |
| [LM] | Lua 5.3 Reference Manual. https://www.lua.org/manual/5.3/manual.html |
| [LS] | Lua 5.3 interpreter source, tag `v5.3`: `llimits.h`, `luaconf.h`, `ldo.c`. https://github.com/lua/lua/tree/v5.3 |
| [WTS] | `war3-types-strict` 0.1.3, npm tarball (`1.29.2/`, `1.32.10/`, `1.33.0/` declaration sets). This repo's `tsconfig.json` uses `war3-types-strict/1.33.0`. |
| [W3TS] | This repository at `831ab74` (`system/sync.ts`, `system/host.ts`, `handles/handle.ts`, `handles/player.ts`, `handles/timer.ts`, `handles/frame.ts`, `handles/widget.ts`, `hooks/index.ts`, `.eslintrc.json`, `tsconfig.json`). |

## Detection layers used in this note

- **Type**: the TypeScript compiler can reject the program (return types, nullability, `@noSelf`, branded types).
- **Lint**: an ESLint/TSTL-level static rule could flag the pattern without running the game.
- **Runtime dev-mode**: a check that only fires in-game with a debug flag (hooking a Native, asserting, printing).
- **Docs only**: nothing short of documentation can catch it (behaviour depends on other clients, timing, or asset content).

A pitfall can sit in more than one layer; the tables list the strongest layer that can reach it today plus what would be needed.

## Summary by detection layer

| Layer | Pitfalls (ids below) |
|---|---|
| Type (already or plausibly) | C1 nil Handles (partly: `war3-types-strict` returns `T \| undefined`), D3 async Natives (only if the typings carry a marker; today they carry none) |
| Lint (plausible) | D1 game-state change inside a local branch (needs data-flow), D4 `pairs`-compiling iteration (`for...in`, `Object.keys`, `Map`), D5 `GetHandleId`/`tostring` of objects as keys or logic, D6 `os.*`, C3 `%` in string literals, C2 sleep Natives / BJ sleepers in callbacks, S1 BJ timer globals |
| Runtime dev-mode (existing tools prove it) | C4 silent callback errors (Debug Utils `try` hooks), C5 invalid frames (Tasyen's frame-type probe), D7 Handles created in the Lua root / before `main` (Total Initialization stages), L1-L3 unreleased Handles (Lua-Infused GUI replaces the types; handle-index heuristics are weak [JD]) |
| Docs only | D2 RNG use in local blocks (semantic), D8 GC-timing desyncs, D9 async Native values reused as game state, C6 recursion limits, C7 model/asset paths and 3.0.0 ability-field defaults, D10 low-probability engine causes from [KC] |

## Part A: Desyncs

### D1. Changing game state inside a `GetLocalPlayer()` branch

- **Cause.** `GetLocalPlayer` is `@async` [JD, `GetLocalPlayer`]. jassdoc: "anything that's only visual (like unit color) will not desync... unless your code relies on the exact value later in the game" and "manipulating handles or creating units locally, changing their health, attack, invisibility etc. - anything that changes the game will desync" with the example `if (GetLocalPlayer() == whichPlayer) then call KillUnit(someUnit)` marked "INSTANTLY DESYNCS!" [JD, `GetLocalPlayer`]. ZerGreenOne: "You cannot create or destroy any type that extends agent locally without causing desync" (the thread's flashbang used `CinematicFadeBJ`, which "creates and destroys timers" locally); PurgeandFire: timers "are created/destroyed/started globally rather than locally. Only the displays are dealt with locally" [GLP].
- **Frame-specific forms.** "Calling subfunctions in BlzFrameSetText() arguments in GetLocalPlayer condition" desyncs at 100% [KC, Ricola3D]. jassdoc: "The first time a frame enters the map script it takes a handle ID. Never acquire this handle for the first time inside a `GetLocalPlayer()` block" [JD, `BlzGetFrameByName`]; "Frame creation allocates a handle ID. In multiplayer, create frames synchronously for all players and only make visibility or appearance local" [JD, `BlzCreateFrame`]; "Never destroy a frame only for one local player" [JD, `BlzDestroyFrame`]. "Destroying user-created frames" is listed as a low-probability cause [KC].
- **Group/force enumeration.** "Calling ForGroup/ForForce inside Local Player code" desyncs [KC, Insanity_AI Oct 9 2024].
- **Safe pattern (documented).** Uncle: "Always call functions for everyone - but modify the function's variables locally"; HerlySQR: frame functions "only affect visual stuff and not the outcome of the game" so `BlzFrameSetTexture` inside a local block is acceptable [DD].
- **Symptom.** Desync (players dropped to score screen).
- **Repro gist.** `if (GetLocalPlayer() == p) { KillUnit(u) }`, or `if (GetLocalPlayer() == p) { BlzFrameSetText(f, GetSomething()) }` where the argument call allocates a Handle.
- **Existing mitigation.** This library: `MapPlayer.fromLocal()` is JSDoc-tagged `@async`, `MapPlayer.isLocal()` exists [W3TS `handles/player.ts`]; the sync System is the sanctioned route for async-to-sync data (see D9). Community: documentation only [JD, G, KC, GLP, DD].
- **Detectable at.** Lint (a rule that flags Handle-creating/destroying Natives and non-visual Natives lexically inside a branch whose condition reads `GetLocalPlayer`/`isLocal`/`fromLocal`); full precision needs data-flow. Not type-level today.

### D2. Random-number generator used in a local block

- **Cause.** "**Desyncs!** The random number generator is a global, shared resource. Do not change its state in local blocks asynchronously" [JD, `GetRandomInt`, `SetRandomSeed`]. "GetRandomX inside GetLocalPlayer block" desyncs [KC, riky Oct 4 2025]. Lua's `math.random` and `math.randomseed` are listed as synchronous "as long as you don't use it in GetLocalPlayer-blocks" [G, "Synchronous Functions"].
- **Symptom.** Desync, possibly delayed until the next RNG-dependent action.
- **Existing mitigation.** Documentation only.
- **Detectable at.** Lint, same rule family as D1 (flag `GetRandomInt/Real`, `SetRandomSeed`, `math.random*` inside local branches).

### D3. Async Natives whose value feeds game state

- **Cause.** jassdoc tags 56 Natives `@async` at the pinned commit [JD]. The full list: `BlzFrameGetAlpha BlzFrameGetChild BlzFrameGetChildrenCount BlzFrameGetEnable BlzFrameGetHeight BlzFrameGetParent BlzFrameGetText BlzFrameGetValue BlzFrameGetWidth BlzFrameIsVisible BlzGetAbilityActivatedExtendedTooltip BlzGetAbilityActivatedTooltip BlzGetAbilityExtendedTooltip BlzGetAbilityResearchExtendedTooltip BlzGetAbilityResearchTooltip BlzGetAbilityTooltip BlzGetItemDescription BlzGetItemExtendedTooltip BlzGetItemTooltip BlzGetLocalClientHeight BlzGetLocalClientWidth BlzGetLocalSpecialEffectX BlzGetLocalSpecialEffectY BlzGetLocalSpecialEffectZ BlzGetLocalUnitZ BlzGetLocale BlzGetMouseFocusUnit BlzGetUnitZ BlzIsLocalClientActive GetAllyColorFilterState GetCameraBoundMaxX GetCameraBoundMaxY GetCameraBoundMinX GetCameraBoundMinY GetCameraEyePositionLoc GetCameraEyePositionX GetCameraEyePositionY GetCameraEyePositionZ GetCameraField GetCameraTargetPositionLoc GetCameraTargetPositionX GetCameraTargetPositionY GetCameraTargetPositionZ GetCreepCampFilterState GetDestructableName GetItemName GetLocalPlayer GetLocalizedHotkey GetLocalizedString GetLocationZ GetObjectName GetSoundDuration GetSoundFileDuration GetSoundIsPlaying IsMultiboardMinimized`. [KC] independently lists `GetCameraTargetPosition` X/Y/Z as returning "asynchronous value" and `GetLocationZ` "during terrain deformations or on animated destructables" as a low-probability cause; jassdoc's `GetLocationZ` note gives "terrain-deformations" as a reason for different values between players [JD]. `EnableWeatherEffect`'s note: graphics settings differ, "Thus reading data like terrain height might lead to async values" [JD].
- **Symptom.** Desync only when the value changes game state; visual use is fine [G, "They desync, if and only if you use them to change game state"].
- **Existing mitigation.** This library's sync System (`SyncRequest` over `BlzSendSyncData`, chunked at 244 characters because the Native "only allows 255 characters per request") is the documented way to make a local value shared [W3TS `system/sync.ts`]; `system/host.ts` is the in-repo example: it measures `os.clock()` locally (async, see D6) and syncs it via `SyncRequest` before choosing a host [W3TS]. The jassdoc note for `BlzSendSyncData` (Reforged 2.0.4) says splitting text at the byte limit can split a multi-byte character; "Rejoining the chunks before display preserves the text" [JD]; `sync.ts` joins all chunks before invoking the callback [W3TS].
- **Detectable at.** Type, if the typings carried the marker: `war3-types-strict` 0.1.3 contains zero `@async` tags [WTS]; this library carries one, on `MapPlayer.fromLocal` [W3TS]. Otherwise lint (flag any use of the 56 names outside a display/sync context) or docs.

### D4. `pairs`/`next` iteration order

- **Cause.** Lua: "The order in which the indices are enumerated is not specified, even for numeric indices" [LM, `next`]. In WC3 multiplayer the order differs per client: "iteration order is not guaranteed to be the same for every player in a multiplayer game" [ST]; "The order of pairs is undefined so yes it can desync depending on how you are using it" [DP, TriggerHappy Mar 27 2020]; "Iterating over Lua tables with pairs (not ipairs)" is a 100% cause [KC]; `#` on non-sequences "has undefined behaviour ... so the output might be different for different players" [G]. Object keys make it worse: "the LuaObject-Keys are async and then the order of execution is not the same anymore" [UH, Tasyen Feb 24 2022]; "using the object itself as a key can cause desync when you loop through the table. They're not guaranteed to have the same order" [G thread, Wrda Apr 21 2023, post #31].
- **Symptom.** Desync when the loop's side effects depend on order (the resolved case in [DP] was a resurrection spell over a keyed table; fix was "changed deathUnits table from key value to index value and used ipair" [DP, bigbull Mar 28 2020]).
- **Existing mitigation.** SyncedTable: `T = SyncedTable.create()` gives a `__pairs` metamethod that iterates in sorted key order; keys must be numbers, strings or objects with `__lt` [ST, G]. `next(T) == nil` as an emptiness check is safe [G]. `ipairs` is synchronous [G]. Lua-Infused GUI documents its own caveat: do not `ipairs` `__jarray` tables, use `for i=1,#myArr` [LIG].
- **TSTL relevance.** In this library the only iteration constructs are array `forEach` calls (`system/host.ts`, `hooks/index.ts`), which compile to numeric loops; no `for...in`, `Object.keys/entries`, `Map` or `Set` is used [W3TS]. A Map project can still write `for (const k in obj)`, `Object.keys(obj)`, `new Map()` iteration, which typescript-to-lua lowers to `pairs`/`next`.
- **Detectable at.** Lint (ban `for...in`, `Object.keys/values/entries`, `Map`/`Set` iteration, or require an allow-comment). Not type-level.

### D5. Handle ids and `tostring` of objects used as data

- **Cause.** "GetHandleId is synchronous in JASS-mode, but asyncronous in Lua-mode" [G]; jassdoc: "Sometimes the handle ID may be different between clients" [JD, `GetHandleId`]; "basing gameplay logic off handle IDs" desyncs in Lua maps [KC, GrapesOfWath Apr 26 2024]. `tostring` "is asynchronous on non-primitive data types (Tables, Functions, Warcraft Objects, ...), because it translates them to `<type>: <hexCode>`, where `<hexCode>` refers to the object's memory location on player's local machines" [G]; `print` applies `tostring` but "there is absolutely no possibility of changing the game state by using print" [G]. `FlushChildHashtable` is reported as a desync source "potentially related to using GetHandleId for hashtable keys" [G, Eikonium; also UH, Eikonium Feb 25 2022].
- **Why ids diverge.** [UH]: objects created in the Lua root run twice ("executes during Lobby and when map started (2 Times)") and the garbage collector "runs asynchronously per client", so Handle ids allocated around collection differ [UH, Tasyen Feb 24 2022]. LazZ's own conclusion: varying ids are acceptable "so long as the ids still point to the same game objects" [UH, Feb 23 2022]. jassdoc's `GetHandleId` example shows the id persists after `RemoveUnit` until the Lua reference is dropped (`uf = nil` then `GetHandleId(uf) --> 0`) [JD].
- **Existing mitigation.** Guide: use the object itself as a table key, never its id [G]. This library: `Handle.id` still exposes `GetHandleId` [W3TS `handles/handle.ts`]; the Wrapper registry is a `WeakMap<handle, wrapper>` keyed by the userdata, not by id [W3TS]. Debug Utils' name cache overrides `tostring`/`print` for display only [DU].
- **Detectable at.** Lint (flag `GetHandleId`, `Handle.id`, `tostring(<non-primitive>)` used outside `print`/string display). Not type-level.

### D6. `os.clock`, `os.date`, `os.time`, `os.difftime`

- **Cause.** "Functions inside this library are asynchronous by design ... The only enabled ones are os.clock, os.date, os.time and os.difftime" [G, "Libraries"]; "Avoid using those except for maybe debugging and performance analysis" [G, "Asynchronous Functions"].
- **Existing mitigation.** `system/host.ts` uses `os.clock()` only as a locally measured value that is then synced through `SyncRequest` [W3TS].
- **Detectable at.** Lint (flag `os.*` outside allow-listed files). Type-level would need the `os` declarations removed or branded; today they are plain Lua-lib typings.

### D7. Creating Handles in the Lua root or during blocking initialization

- **Cause.** "Don't use Warcraft objects in the Lua root! At the time the Lua root is executed, many Warcraft natives are not yet functioning properly. Creating warcraft objects in the Lua root can even lead to desyncs" [G, "The Lua Root"]; "Creating WarCraft 3 objects in the Lua root is dangerous as it causes desyncs" [TI]. Specific reports: "Location created in map root, overwritten during init" desyncs [KC, Luashine Aug 2025]; "BlzCreateFrame from OnInit.global" causes sporadic desync, resolved by moving later [KC, Tomotz Nov 15 2025]; jassdoc: "Do not create frames during blocking map initialization. Create custom UI at elapsed game time `0.00` or later" [JD, `BlzCreateFrame`]; "Timers with delay ≤0.01s on map initialization (~25% desync chance)" [KC]; several Natives "crash the game" if used "in a global initialisation (on map init)": `AbilityId2String`, `CreateTrackable`, `TimerDialogSetRealTimeRemaining`, `LeaderboardSetItemValueColor`'s neighbour block, and mouse events "crash when registered and used during map initialization" (confirmed v2.0.3.23175) [JD]. `Blizzard.j` itself creates `bj_lastStartedTimer` during the root, so `CreateTimerBJ`/`StartTimerBJ`/`GetLastCreatedTimerBJ` are discouraged ("StartTimerBJ" is also in [KC, GrapesOfWath]) [G].
- **Symptom.** Desync or crash at load.
- **Existing mitigation.** Total Initialization: seven stages (`OnInit.root`, `.config`, `.main`, `.global` after `InitGlobals`, `.trig` after `InitCustomTriggers`, `.map` after `RunInitializationTriggers`, `.final` after `MarkGameStarted`), each initializer in its own `pcall`, optional `Debug.try`, `Require.strict/optional` for ordering [TI]. This library: `hooks/index.ts` reassigns `main` and `config` and runs `MAIN_BEFORE/AFTER`, `CONFIG_BEFORE/AFTER` hook lists in plain `forEach` with no `pcall` [W3TS]; module top-level code in a TSTL bundle is Lua-root code. Note that `system/sync.ts` and `system/host.ts` create `Trigger.create()` and `Timer.create()` lazily (in `SyncRequest.init()` and the `MAIN_AFTER` hook), not at module load [W3TS].
- **Detectable at.** Lint (flag Handle-creating Natives/Wrapper constructors at module top level). Runtime dev-mode (a "phase" flag asserted by Wrapper constructors). Not type-level.

### D8. Garbage-collection timing

- **Cause.** "if you create a global trigger outside of any scope it will get garbage collected (maybe at different times for each player)" [DP, TriggerHappy Mar 26 2020]; the collector "runs asynchronously per client" [UH, Tasyen Feb 24 2022]; Tasyen recommended `collectgarbage("stop")` plus manual `collectgarbage()` at fixed intervals [UH, Feb 24 2022]; the guide states `collectgarbage` "has been disabled ... in Warcraft 3 Reforged (at least after a certain patch). As per patch 1.32.x, the garbage collector runs a fixed number of times per game tick, probably to keep the process synchronized across players" [G, "Memory Leaks"]. These two statements conflict on whether `collectgarbage` is callable; not resolved here. The guide also warns: "don't make a static table hold weak references, if you plan to loop over it (might cause desyncs)" [G, "OOP Pt. 2"].
- **Detectable at.** Docs only (timing). A lint could flag `collectgarbage` and weak-table iteration.

### D9. Async-by-design engine behaviour (from [KC], not Lua-specific)

`SelectGroupForPlayerBJ` ("systematic desync" on 1.32+), `SmartCameraPanBJ` (fixed in 1.31), `GameCacheSync` more than 344 times per frame, `SetSkyModel` with an invalid path, editing the Creep Guard/Return/Camp-Radius game constants; low-probability: many player slot/controller comparisons, weapon-upgrade dice overflow, badly made models/textures, "Huge amount of memory leaks", periodic trigger with null period [KC]. `PlayCinematic`/`ForceUICancel` outcome "is affected by local player's hotkey layout" [JD]. Detectable at: docs only, except the BJ names, which a lint can ban.

## Part B: Crashes and silently killed threads

### C1. Nil Handles passed to Natives

- **Cause.** In Lua a not-found frame "is a valid framehandle with a HandleId of 0" [UI]; `GetPlayerScore`: "Passing nil as otherPlayer crashes the game (might happen if you try getting the owning player of a unit that doesn't exist)" (v2.0.4.23745) [JD]; `GetExpiredTimer`: "Returns `null` if timer is destroyed right before callback call" and "Might crash the game if called when there is no expired timer" [JD]; `CreateImage`: "May crash the game if an invalid image is used (null, before the first image is created)" [JD]; `BlzSetItemIconPath` to an empty string crashes (v2.0.4.23556) [JD]; `QuestSetTitle` with null/empty description crashes when the quest is rendered [JD].
- **Symptom.** Crash, or (for Lua `nil` passed where a Lua-level error is raised) a silently killed thread (see C4).
- **Existing mitigation.** Type level: `war3-types-strict` 0.1.3 declares `CreateUnit(...): unit | undefined`, `FirstOfGroup(...): unit | undefined`, `GetExpiredTimer(): timer | undefined` [WTS]; this repo compiles with `strict: true` and the `war3-types-strict/1.33.0` set [W3TS `tsconfig.json`], and its lookup helpers propagate it: `Widget.fromHandle(handle: widget | undefined): Widget | undefined`, `Frame.fromHandle(...): Frame | undefined`, `Frame.fromName` returns that, `Timer.fromExpired()` is annotated with jassdoc's `@bug` text [W3TS]. Runtime: `MapPlayer.fromLocal()` prints a loud message if `GetLocalPlayer()` is undefined [W3TS `handles/player.ts`]; Tasyen's `WhatTypeOfFrame(frame)` probe returns nil for invalid frames [UI]; Debug Utils `assert`/`Debug.assert` [DU].
- **Detectable at.** Type (already, for the returns the typings mark nullable; `Handle.handle` itself is non-nullable in the Wrapper). Runtime dev-mode for Natives that crash the process rather than raise (the compiler cannot see a 0-id frame).

### C2. Sleeping Natives in the wrong context (`TriggerSleepAction`, `PolledWait`, 3.0.0 `DestroyEffectAfterTimeBJ`)

- **Cause.** `TriggerSleepAction` "works only in a trigger action execution context, not in trigger conditions nor for example in timer functions or `ForGroup` functions. However, it also works in `ExecuteFunc` contexts ... If this is called in the wrong context, it crashes the thread" [JD, `@bug`]. Related: "If an action execution crashes after a `TriggerSleepAction` in the same action execution, subsequent actions will not be run" [JD, `TriggerAddAction`]; `PolledWait` "Leaks handle `t`" [JD, Blizzard.j]. Lua's own yield errors are "attempt to yield across a C-call boundary" and "attempt to yield from outside a coroutine" [LS, `ldo.c` lines 700-702]. In 3.0.0, `Blizzard.j` adds `DestroyEffectAfterTimeBJ`, which stores its arguments in `bj_destroyEffectAsyncEffect/Time` and calls `ExecuteFunc("DestroyEffectAsyncBJ")`, whose body is `TriggerSleepAction(localTime)` then `DestroyEffect(localEffect)` [JD, Blizzard.j lines 6414-6433, `@patch 3.0.0.24268`]; Spacebuns: "one of the new Blizzard.j functions that automatically destroys a Special Effect after a set time calls TriggerSleepAction(), so it's not very good" [B30, post #36], repeated in the OP's issue list [B30]. Because the two BJ globals are overwritten on every call, concurrent calls before `ExecuteFunc` reads them are a race on the same globals (inference from the listed source; not separately tested). `TriggerSleepAction`-heavy loops also caused LAN drops in a converted map; replacing with timers / Precise Wait fixed it [MD, Tomotz Jan 4 2025].
- **Symptom.** Thread killed silently (timer/condition/ForGroup contexts); effects not destroyed; delayed desync/drops in the reported case.
- **Existing mitigation.** This library documents the context rules on `Trigger.execute`/`TriggerExecuteWait` wrappers [W3TS `handles/trigger.ts` lines 60, 130-139] but does not wrap `TriggerSleepAction`; `Effect.destroy()` calls `DestroyEffect` immediately [W3TS `handles/effect.ts`]. Community: Precise Wait / timer-based waits [MD].
- **Detectable at.** Lint (ban `TriggerSleepAction`, `PolledWait`, `DestroyEffectAfterTimeBJ`, `TriggerSleepAction`-calling BJs outside trigger-action callbacks; a coarse rule can ban them everywhere). Runtime dev-mode (Debug Utils-style hook that checks an "in trigger action" flag). Not type-level.

### C3. `%` in strings, comments and format strings

- **Cause.** "Warcraft escapes two %-characters to one, so you would need to write `x %% y` for the modulo operator"; "prior to patch 2.0.4 forgetting to put in the second % can crash the world editor. This is even true for percent-characters inside comments" [G, "Differences between JASS and Lua" and "Strings"]; recommended: `\x25` in strings [G]. `DisplayTimedTextFromPlayer`: "Only the first "%s" will be replaced correctly. Following "%s" will be printed as garbage or (v1.32.10, Lua) crash the game" [JD]. `string.format` follows ISO C `sprintf` minus `*, h, L, l, n, p` [LM].
- **Symptom.** Editor crash on save (pre-2.0.4), wrong output, game crash (1.32.10 case).
- **Existing mitigation.** Documentation only [G, JD].
- **Detectable at.** Lint (flag `%` in string literals and comments that will end up in `war3map.lua`; TSTL emits `%` from `string.format`-equivalents such as template literals only if the source contains it).

### C4. Errors inside timer/trigger/coroutine callbacks fail silently

- **Cause.** "If a trigger fails to execute, it will fail silently. You will simply see that nothing happens, when it should" [DU]; "If a condition-function crashes the thread or does not return any value `TriggerEvaluate` will return `false`" and "If an action execution crashes, subsequent actions will be unaffected and still be called" [JD, `TriggerEvaluate`/`TriggerAddAction` notes]. Root errors are different: "If the code written to the root causes an error, it prevents the map from loading and instead lets you return to the Warcraft main menu" with the message in `%USERPROFILE%\Documents\Warcraft III\Logs\War3log.txt` [G, "The Lua Root"].
- **Symptom.** Silent bug (callback stops mid-way).
- **Existing mitigation.** Debug Utils wraps callbacks in `Debug.try` by overriding `TriggerAddAction`, `Condition`, `Filter`, `TimerStart`, `coroutine.create`, `coroutine.wrap` (config flags `USE_TRY_ON_TRIGGERADDACTION/CONDITION/TIMERSTART/COROUTINES`), prints file/line/stack, offers `Debug.beginFile/endFile` to map `war3map.lua` lines back to source files, warns on undeclared-global reads (`WARNING_FOR_UNDECLARED_GLOBALS`), and caches loading-screen `print` [DU]. Total Initialization runs each initializer in its own `pcall` and can use `Debug.try` [TI]. ALICE catches errors in callbacks in protected mode and reports thread crashes [AL]. This library: no `pcall`/`xpcall` wrapper anywhere; `hooks/index.ts` runs hooks unprotected [W3TS].
- **Detectable at.** Runtime dev-mode only (a `try` wrapper around callbacks handed to `TimerStart`, `TriggerAddAction`, `Condition`, `Filter`, `ForGroup`).

### C5. Invalid or wrong-kind frames

- **Cause.** `BlzFrameSetVisible`/`BlzFrameSetAllPoints`/`BlzDestroyFrame`: "Do not call this native on `String` or `Texture` children of a SimpleFrame; doing so can crash the game" [JD]; `BlzCreateSimpleFrame`: "`BACKDROP`, `TEXTAREA`, `SIMPLEMESSAGEFRAME`, `DIALOG` and `CONTROL` frames can crash the game when created without their required FDF fields" [JD]; `BlzDestroyFrame` "crashes the game when used onto a variable that points to such a broken frame after loading" a saved game [UI]; 1.33 "big multiboards" freeze/crash [JD, multiboard note].
- **Existing mitigation.** Tasyen's `WhatTypeOfFrame` probe; frame save/load helpers [UI]. This library: `Frame` Wrapper exposes `destroy()` calling `BlzDestroyFrame` and `fromName` returning `Frame | undefined` [W3TS]; no kind check.
- **Detectable at.** Runtime dev-mode (probe frame kind before the crashing Natives). Type level could only model frame kinds if creation and lookup were typed by kind.

### C6. Recursion and stack limits

- **Cause.** "There is no op-limit in Lua" [G, "Differences between JASS and Lua"]; "Having too many function calls waiting on the stack can lead to a stack overflow. Good thing, Lua is optimized for Tail Recursion" [G, "Recursion"]. Stock Lua 5.3 limits: `LUAI_MAXCCALLS 200` ("C stack overflow") [LS, `llimits.h` line 153; `ldo.c` 483, 660] and `LUAI_MAXSTACK 1000000` slots ("stack overflow") [LS, `luaconf.h` line 729; `ldo.c` 202]. Whether Blizzard's build changes these values is not verified. Engine-level: calling `UnitDamageTarget` from within a damage-event trigger "will cause infinite loop and game will crash" [JD, note in the `BlzDecPlayerTechResearched` neighbourhood].
- **Detectable at.** Docs only for depth; lint could flag direct self-recursion but not the engine re-entrancy case.

### C7. Asset paths and 3.0.0 data defaults

- **Cause.** 3.0.0: "File paths containing a "." (outside of their extension) will NOT be read correctly by the game. For instance my_model_1.0.mdx will not be read correctly while my_model_1_0.mdx for the same model will work" and "For ALL abilities the default value will not apply to any field after level 4. Meaning If you have Storm Bolt (AHtb) with 10 levels, from level 5 to level 10 cast range, damage, etc. will be null. A custom value still work but not the default one" [B30, OP]. Also in 3.0.0: models with geosets "that contain only Vertices but no Faces" crash the editor [B30, Valdemar #39, Achille #47]; several doodad models need variation 1 to display [B30, P3in #42]. Older: `SetSkyModel` with an invalid path desyncs [KC]; `BlzSetSpecialEffectPosition` "Crashes the game if used on an attached effect (tested 1.36.2 SD)" [JD]; `AddSpecialEffect` with a missing model just shows nothing ("An effect is only visible if its center is within draw distance") [JD]; tree models under `doodads/terrain/` are unusable as effects in 1.36.2 [JD, `DestroyEffect` note].
- **Symptom.** Silent bug (missing model, null ability fields), desync (`SetSkyModel`), crash (attached-effect reposition).
- **Existing mitigation.** None in code; documentation. No fix is marked in [B30] as of Sep 15-16 2026.
- **Detectable at.** Docs only at the library level (paths and object data are Map-project assets). A Map-project lint over string literals ending in `.mdx`/`.mdl` could flag inner dots.

## Part C: Leaks

### L1. Locations, groups, forces, rects, boolexprs, multiboards, destructables

- **Cause.** Lua's collector frees Lua values, not engine objects: "you don't need to actively remove Lua objects. In fact you can't, because there are no destroy-methods for any type of data in native Lua" [G, "The Garbage Collector"], whereas engine Handles have explicit destroy Natives: "To avoid leaks, use `RemoveLocation`" [JD, `Location`]; `GetOrderPointLoc` "Returned location must be removed with `RemoveLocation`" [JD]; `boolexpr`/`conditionfunc`/`filterfunc` "must be explicitly destroyed with `DestroyBoolExpr`/`DestroyCondition`/`DestroyFilter` to prevent leaks. However, most functions from blizzard.j destroy passed boolexpr automatically" (Lua, 1.32.10) [JD, `Condition`, `Filter`, `And`, `Or`, `Not`]; "Multiboards must be destroyed to prevent leaks" [JD]; destructables: "use `RemoveDestructable` ... to avoid leaks" [JD]. Some unit events "leak 1 internal object every time this event is dispatched" [JD, `TriggerRegisterUnitEvent` family notes]. Handle-count diagnostics are weak: "The handle index returned here is only a weak and not a conclusive indicator of leaking game objects" [JD, `GetHandleId`]. [KC] lists "Huge amount of memory leaks" as a low-probability desync cause.
- **Existing mitigation.** Lua-Infused GUI "transforms rects, locations, groups, forces and BJ hashtable wrappers into Lua tables, which are automatically garbage collected", makes `RemoveLocation`/`DestroyGroup`/... no-ops, hooks special-effect BJs so they do not allocate temporary locations, and removes the 256-hashtable limit [LIG]. This library: every Wrapper with a destroy Native exposes `destroy()` (`Point`->`RemoveLocation`, `Group`->`DestroyGroup`, `Force`->`DestroyForce`, `Effect`->`DestroyEffect`, `Timer`->`DestroyTimer`, `Frame`->`BlzDestroyFrame`, `TimerDialog`->`DestroyTimerDialog`) and the sync System destroys its timeout `Timer` in the callback (`Timer.fromExpired()?.destroy()`) [W3TS]; nothing is automatic; `Group.getUnits()` materialises an array so a Map project can avoid `ForGroup` filters [W3TS `handles/group.ts`].
- **Detectable at.** Runtime dev-mode (count live Wrappers per type, or diff `GetHandleId` of a fresh `Location` between checkpoints; both heuristic [JD]). Lint can flag `Filter(`/`Condition(` results not stored or destroyed, and `Point.create` without a matching `destroy` only heuristically. Not type-level (ownership is not expressible in TS types without a linear-type discipline).

### L2. Lua tables keyed by engine objects

- **Cause.** "(Key,value)-pairs containing an Wc3 object will remain in the table even after the object has been destroyed or removed. A famous example is when you use units as keys" [G, "General Tables", further reading]; ALICE: "Not destroying an actor when its host is destroyed will keep the pairs attached to that actor inside the cycle indefinitely" [AL].
- **Existing mitigation.** Weak tables (with the D8 caveat about iterating them) [G]; ALICE auto-destroys actors on host death via generated death triggers [AL]. This library keeps its Wrapper registry in a `WeakMap`, so a Wrapper does not outlive the last Lua reference to its userdata [W3TS `handles/handle.ts`].
- **Detectable at.** Docs only / runtime heuristics.

### L3. Effects and 3.0.0 `DestroyEffectAfterTimeBJ`

- Covered under C2: the BJ's `ExecuteFunc`+sleep path means the destroy can be skipped when the thread is killed; `Effect.destroy()` in this library is immediate [W3TS].

## Part D: Silent bugs adjacent to the above

- **S1. BJ globals reused between calls** (`bj_lastStartedTimer`, `bj_destroyEffectAsyncEffect/Time`): see D7 and C2 [G, JD]. Lint can ban `*BJ` Natives.
- **S2. `__jarray`/GUI globals with `ipairs`**: Lua-Infused GUI's own caveat [LIG]. Docs only unless the Map project uses that resource.
- **S3. Handle id persists after removal while referenced** (`GetHandleId(uf)` unchanged after `RemoveUnit(uf)`) [JD]: a Wrapper that caches `id` keeps pointing at a removable slot. Docs only.
- **S4. Undeclared-global typos** (`CraeteUnit`) are silent in plain Lua; Debug Utils' `WARNING_FOR_UNDECLARED_GLOBALS` catches them at runtime [DU]. In this repo TypeScript's `strict`/`noImplicitAny` catch them at the type level for TS sources [W3TS `tsconfig.json`].

## What each existing tool covers (inventory)

| Tool | Layer | Covers | Source |
|---|---|---|---|
| Debug Utils 2.0a | Runtime dev-mode | C4 (try-hooks on `TriggerAddAction`, `Condition`, `Filter`, `TimerStart`, coroutines), stack traces, file/line mapping, undeclared-global warnings, in-game console, `tostring`/`print` name cache (display only) | [DU] |
| Total Initialization 5.3.1 | Runtime (init ordering) | D7 (stages after `InitGlobals`/`InitCustomTriggers`/`RunInitializationTriggers`/`MarkGameStarted`), C4 for initializers (per-initializer `pcall`), dependency ordering (`Require`) | [TI] |
| SyncedTable | Runtime (data structure) | D4 (`__pairs` with sorted keys; keys must be sortable) | [ST], [G] |
| Lua-Infused GUI | Runtime (Native replacement) | L1 (locations, groups, forces, rects, BJ hashtables become tables; removal Natives become no-ops), effect-position BJs without temp locations | [LIG] |
| ALICE 2.13 | Runtime | L2 (actor auto-destroy on host death), C4 (protected callbacks, crash reports), debug mode/visualisers; documents its own D1 exception (first actor on an item/destructable creates a death trigger, so doing it async desyncs) | [AL] |
| Precise Wait / timers | Runtime (replacement) | C2 (replaces `TriggerSleepAction` loops) | [MD] |
| jassdoc annotations | Docs (machine-readable) | D3 (`@async`, 56 Natives), C1/C2/C5/C7 (`@bug`), L1 (`@note`), D2 (`@note` on RNG) | [JD] |
| `war3-types-strict` 0.1.3 | Type | C1 (nullable returns such as `unit \| undefined`, `timer \| undefined`); no `@async` markers | [WTS] |
| This library (`w3ts` 3.0.2 fork) | Type + System | C1 (nullable `fromHandle`/`fromName`/`fromExpired`), D3/D6 (sync System; host System as worked example), D1 (`isLocal`, `@async`-tagged `fromLocal`), L1 (`destroy()` on Wrappers, timer cleanup in `sync.ts`), D4 (no `pairs`-compiling constructs in library code); no `pcall`, no dev-mode checks, `Handle.id` still exposed, `hooks/index.ts` unprotected | [W3TS] |

## Items not verified

- Whether WC3's Lua `math.random`/`math.randomseed` are engine-synced (the guide asserts it; no test or Blizzard statement was found) [G].
- Whether `collectgarbage` is callable in current patches ([G] says disabled; [UH] recommends calling it).
- Whether Blizzard's Lua build keeps stock `LUAI_MAXCCALLS`/`LUAI_MAXSTACK` [LS].
- The "~25% desync chance" for ≤0.01 s init timers and "destroying user-created frames" are listed without reproduction in [KC].
- The 3.0.0 ability-field-defaults and dotted-path bugs are from the OP of [B30]; no fix is recorded there as of Sep 16 2026.
- The BJ-global race in `DestroyEffectAfterTimeBJ` is inferred from the listed Blizzard.j source, not observed.
- Reports that Reforged 2.0's changed `consoleui.fdf` definitions make old frame names crash (Hive threads 356596, 356633) were surfaced by search only and not read; they are not cited above.
