# Design review: principles to keep, improvements to propose

Ticket: [#12](https://github.com/phmilk/reforged-ts/issues/12). Reviewed commit: `831ab74` (master, "fix wrong unit handle in group (#45)"), package `w3ts@3.0.2`.
Date: 2026-09-23. Vocabulary: Native, Handle, Typings, Wrapper, System, Hook, Map project (as defined in the ticket series); Module / Interface / Depth / Seam / Adapter as in the `codebase-design` skill.

Facts and proposals only. The keep/evolve/rewrite decision belongs to later tickets.

## 1. Summary

The library is 43 TypeScript files, 8,397 lines; 30 Wrapper classes under `handles/`, 7 System modules under `system/`, one Hook module, a `globals/` folder and `utils/`. Its shape is a thin 1:1 layer over Natives with two pieces of real depth: the Handle-to-Wrapper identity registry (`handles/handle.ts`) and the two network/IO Systems (`system/sync.ts`, `system/file.ts`). Everything else is a pass-through whose value is naming, typing and the `boolexpr | (() => boolean)` convenience.

Judged by the deletion test: deleting the registry would re-create identity bookkeeping in every Map project (the library itself relies on it at `system/sync.ts:289`); deleting a typical Wrapper method (`Unit.wakeUp` -> `UnitWakeUp`) removes nothing but a name. That is fine for a binding library, but it means the interface is nearly as wide as the implementation, so documentation *is* most of the product, and TSDoc coverage is 19%.

Verdict in one line: the design is sound and consistent across all 30 Wrappers; nothing found is a reason to rewrite; the highest-value work is (1) documentation, (2) finishing the 2023 factory migration so the registry can lose its global-state trick, (3) unifying the factory error mode, (4) additive lifecycle stages. Everything else is small and local.

### Ranked proposals (benefit / cost)

| # | Proposal | Benefit | Cost / breakage | Where |
|---|----------|---------|-----------------|-------|
| P1 | Document exported members (TSDoc), starting with `Handle`, factories, `Trigger`, `MapPlayer`, `hooks` | 19% -> usable API reference; directly addresses the dev's "under-documented" | Zero API change; effort only | all `handles/*.ts`, `hooks/index.ts` (0/8) |
| P2 | Finish the `create`/`fromHandle` migration: delete deprecated constructors, replace 30 copies of `fromHandle` + `create` boilerplate with one generic `Handle.fromHandle` (pattern in upstream PR #38) | About -600 lines (PR #38 is +189/-616); removes the `Handle.initHandle` global-state trick; lets the registry become class-aware (see 3.1) | Breaking for anyone still calling `new Unit(...)` (deprecated since Feb 2023, commit `f3f1647`) | `handles/handle.ts:9-37`, every `handles/*.ts` constructor |
| P3 | One error mode for factories: today 5 factories return non-optional, ~24 return `X \| undefined`, and `error()` fires only in the deprecated constructors | Callers stop guessing which factories need `?.`; one documented rule | Signature change on whichever side is picked; small | `handles/timer.ts:19`, `handles/point.ts:26`, `handles/rect.ts:22`, `handles/region.ts:24`, `handles/trigger.ts:25` vs `handles/unit.ts:61-83` etc. |
| P4 | Lifecycle stages beyond `main`/`config` (`InitGlobals`, `InitCustomTriggers`, `RunInitializationTriggers`, `MarkGameStarted`) with `pcall`, as in PR #38, keeping `addScriptHook` as an alias | Matches what Lua users have in Total Initialization; safe error reporting in init | Additive; `hookedMain`/`executeHooks*` exports become dead | `hooks/index.ts` |
| P5 | Stop creating Handles at Lua-root load time (`Players` array, `SyncRequest.eventTrigger`) and do it in a Hook instead | Removes a class of load-order hazards; Total Initialization's author states root-time object creation "causes desyncs" (claim not verified here) | Tiny; `Players` becomes lazily filled or filled in `config::before` | `globals/index.ts:4-11`, `system/sync.ts:139` |
| P6 | Make `Trigger` event registration typed end-to-end: accept `Timer` not `timer`, add `registerFrameEvent` (current name `triggerRegisterFrameEvent`), add typed `fromEvent` accessors where missing | Removes the last raw-Handle leaks in the most-used class | Additive; rename is a deprecation | `handles/trigger.ts:325,329,333,401` |
| P7 | `@noSelfInFile` on the 10 files that lack it (or prove `noImplicitSelf` covers the emitted `.d.ts`) | Prevents the `self`-argument shift for consumers compiling against the `.d.ts` | Trivial | `utils/index.ts`, `system/gametime.ts`, `utils/color.ts`, `globals/*`, `system/binary*.ts` |
| P8 | Fix small System defects: `BinaryReader.readDouble` advances 4 bytes for an 8-byte `d`; `SyncRequest.then/.catch` are not thenable; `MapPlayer.fromLocal` debug spam; 4 wrong `error()` messages | Correctness; no design change | Trivial | `system/binaryreader.ts:48-50`, `system/sync.ts:194,264`, `handles/player.ts:324-332`, `handles/point.ts:16`, `handles/region.ts:19`, `handles/weathereffect.ts:15`, `handles/timerdialog.ts:15` |
| P9 | Modernize the build the way voces/w3ts did (TS 5.9/6, tstl 1.36, `lua-types/5.3`, `moduleResolution: node16`, optional ESM build) | Current toolchain; an ESM build lets pure Systems (`base64`, `binary*`, `color`) be unit-tested in Node | Every relative import gains `.js` and a tstl resolver plugin is needed (18 lines) | `tsconfig.json`, `package.json` |
| P10 | Keep names (`MapPlayer`, `Point`, `Rectangle`); write the naming rule down instead | Renames would break every Map project for no capability gain | n/a | `handles/player.ts:7`, `handles/point.ts:5`, `handles/rect.ts:6` |

## 2. Method and sources

- Read every file listed in the ticket plus all other `handles/*.ts` heads, `system/*.ts`, `globals/*.ts`, `utils/*.ts`, `tsconfig.json`, `.eslintrc.json`, and the commits `f3f1647` (static factories, 2023-02-03), `5e2082a` (cyclic dependency fix, 2021-11-03), `831ab74` (#45).
- Compared against: [voces/w3ts](https://github.com/voces/w3ts) via the GitHub compare API `cipherxof:master...voces:master` (3 commits ahead, 1 behind, "diverged"); [eiriksgata/wc3ts](https://github.com/eiriksgata/wc3ts) `src/handles/handle.ts`, `timer.ts`, `trigger.ts`, `unit.ts`, `index.ts`; upstream [PR #38](https://github.com/cipherxof/w3ts/pull/38) (BribeFromTheHive, opened 2024-01-15, still OPEN, +189/-616) and issues [#39](https://github.com/cipherxof/w3ts/issues/39), [#35](https://github.com/cipherxof/w3ts/issues/35), [#31](https://github.com/cipherxof/w3ts/issues/31); [Total Initialization](https://www.hiveworkshop.com/threads/total-initialization.317099/) (v5.3.1, Bribe) and [Lua-Infused GUI](https://www.hiveworkshop.com/threads/lua-infused-gui-automatic-group-location-rect-leak-handler-with-hooks.317084/) (Bribe) for lifecycle/object-model perspective; [TSTL compiler annotations](https://typescripttolua.github.io/docs/advanced/compiler-annotations) and [TSTL configuration](https://typescripttolua.github.io/docs/configuration).
- TSDoc coverage measured with a throwaway Python script (section 13) over the working tree; no dependencies installed, no build run. Consequently anything that needs a compile (`.d.ts` emission of `@noSelfInFile`, Lua output shape) is marked "not verified".

## 3. `Handle` base and the WeakMap registry

**What it is.** `handles/handle.ts` (38 lines). A module-level `WeakMap<handle, any>` (`:4`) maps each game Handle to exactly one Wrapper. The constructor registers `this` (`:11-14`). `getObject(handle)` (`:28-37`) returns the cached Wrapper or constructs one. `id` (`:20-22`) is `GetHandleId`.

**What it does well.**
- Identity: the same Handle always yields the same Wrapper, so `===` works on Wrappers. The library itself depends on it: `system/sync.ts:289` compares `this.from === MapPlayer.fromLocal()`; `handles/player.ts:212` compares raw Handles. This is the one truly deep piece of the design: a 38-line implementation that every one of the 30 Wrappers and every Map project leans on.
- Weak keys: when the Map project drops all references, the entry can be collected; no manual unregister on `destroy()` is needed (no Wrapper calls anything on destroy beyond the Native, e.g. `handles/timer.ts:44-47`).
- Both comparison libraries kept it verbatim: voces/w3ts `handles/handle.ts` is byte-identical; wc3ts extends it with a second `Map<number, any>` for integer Frame handles from the KKWE engine (`src/handles/handle.ts`, `numberMap`, `store`, `release`, `uncache`) and otherwise leaves the mechanism alone. That is evidence the mechanism is the accepted baseline for this ecosystem.

**What could be improved.**
1. The registry is not class-aware. `getObject` returns whatever object was cached first for a Handle. `Widget.fromHandle(h)` followed by `Unit.fromHandle(h)` (`handles/unit.ts:1505-1509`, cast `as Unit`) returns the `Widget`, missing every `Unit` method, with no runtime or type error. `Widget.fromEvent()` (`handles/widget.ts:34`) makes this reachable from ordinary event code. Fix: in `getObject`, if the cached object is not `instanceof this`, replace it (or throw). Cost: a few lines. PR #38's generic `fromHandle` (below) is the natural place.
2. `id` is overridden by `MapPlayer.id` (`handles/player.ts:64`) to mean `GetPlayerId`, so `Handle.id` has two meanings across the hierarchy. Documenting it is enough; renaming would break `system/host.ts:52,72,77-79`.
3. The comment on `id` ("recycled once you destroy the object", `:17`) is the only place the recycling caveat is written down. The library's assumption that a live Handle maps to a stable Lua value (needed for WeakMap keys and `===`) is not documented anywhere and was not independently verified in this review; the `wc3-facts` ticket is the right place to pin it.

**Deletion test:** passes. Remove the registry and every Map project re-implements it or loses identity. Keep.

## 4. `initFromHandle` constructor trick versus static `create` / `fromHandle`

**What it is.** To construct a Wrapper around an existing Handle without running the "create a new game object" path, `getObject` sets a static `Handle.initHandle` (`handles/handle.ts:9,33-35`), calls `new this()` with no arguments, and every subclass constructor starts with `if (Handle.initFromHandle()) { super(); return; }` (e.g. `handles/timer.ts:8-11`, `handles/unit.ts:34-37`, `handles/frame.ts:89-92`). Commit `f3f1647` (2023-02-03, upstream PR #33) then added static `create(...)` factories and marked every constructor `@deprecated`, but kept the constructors because `getObject` still needs `new this()`.

**What it does well.** It works with TypeScript's rule that a subclass constructor must call `super()`, it needs no per-class registration, and it is applied uniformly in all 30 classes. The uniformity is worth keeping whatever replaces it.

**What could be improved.** The trick is global mutable state threaded through every constructor, and the migration is half done:
- Every `create` still contains 6 lines of ritual (`getObject`, `values.handle = handle`, `Object.assign`) that re-sets a field the constructor already set (`handles/timer.ts:19-27`, `handles/point.ts:26-34`, and 28 more).
- Every class re-declares `fromHandle` with the same body (`handles/timer.ts:71-73`, `handles/point.ts:71-73`, `handles/unit.ts:1505-1509`, ...): 30 copies.
- `MapPlayer`'s constructor and `create` are `private` (`handles/player.ts:11,23`), which is what upstream issue #35 asks to relax so the class can be extended.
- Upstream PR #38 (open since 2024-01) shows the end state: one generic `static fromHandle<C>(this: new () => C, handle, values?)` on `Handle` that performs the registry lookup, the `initHandle` dance, and an optional `Object.assign`, so `Timer.create()` becomes `return this.fromHandle(CreateTimer())!;` and the per-class `fromHandle` overrides disappear. Net -427 lines. The constructors remain (still needed for `new this()`), but the trick is confined to one method.
- Alternative not taken by anyone in this ecosystem: a `protected static` "raw" constructor path (`Object.create(this.prototype)` then set `handle`) that avoids calling the constructor at all. It removes `initHandle` entirely, at the cost of one tstl-specific idiom (`setmetatable` semantics under the hood). Worth a spike in the prototype ticket, not a recommendation yet.

**Concrete benefit:** ~600 fewer lines, one place to make the registry class-aware (3.1), constructors can go `protected` (fixes #35). **Cost:** removing deprecated constructors is a major-version break for `new X(...)` callers; keeping them makes it non-breaking.

## 5. Factories returning `undefined`

**What it is.** `create` returns `X | undefined` in most classes (Unit `handles/unit.ts:68`, Frame `:129`, Group `:28`, Effect, Item, Sound, Dialog, Force, Quest, Leaderboard, Multiboard, GameCache, TimerDialog, TextTag, FogModifier, WeatherEffect, Destructable, CameraSetup, DialogButton, MultiboardItem, QuestItem) because the strict Typings (`war3-types-strict`) type every Native's return as possibly `undefined`. Five factories return non-optional and skip the check: `Timer.create` (`handles/timer.ts:19`), `Trigger.create` (`:25`), `Point.create` (`handles/point.ts:26`), `Rectangle.create` (`handles/rect.ts:22`), `Region.create` (`handles/region.ts:24`).

**What it does well.** It is honest about Natives that really can fail (`CreateUnit` with a bad rawcode, `BlzCreateFrame` with a missing FDF), and `strict` mode forces callers to handle it. The `fromX` accessors (`fromEvent`, `fromEnum`, `fromFilter`, `fromHandle`) correctly return `undefined` when the Native has nothing to give; upstream issue #31 (`getItemInSlot` crashing on an empty slot) is already fixed in this tree (`handles/unit.ts:823-825` goes through `Item.fromHandle`).

**What could be improved.** The split is undocumented and looks accidental: `CreateTimer`/`CreateTrigger` "never fail" is folklore, not a typed guarantee, and the Typings declare `Rect(...)`, `Location(...)` and `CreateRegion()` as possibly `undefined` like every other creator. Callers cannot predict from the name which factories need `?.`. Two consistent options:
- (a) all factories `X | undefined` (matches the Typings; cheapest);
- (b) all factories non-optional and throw via `error()` when the Native returns nothing (matches the deprecated constructors, section 6; nicer call sites, but a throw inside a WC3 Lua thread silently kills the thread unless the code is under `pcall`).
PR #38 chose (b)-lite: `this.fromHandle(CreateTimer())!` with a non-null assertion and no runtime check.

**Benefit:** one rule, documentable in one sentence. **Cost:** signature churn on whichever side changes; (a) changes 5 signatures, (b) changes ~24.

## 6. `error()` on failed creation

**What it is.** 29 call sites of `error("w3ts failed to create <x> handle.", 3)` (`handles/*.ts`, listed by grep), all inside the deprecated constructors. No non-deprecated path calls `error()`.

**What it does well.** Level 3 points the Lua error at the caller of `new X(...)`, which is the right frame.

**What could be improved.**
- Four messages name the wrong Handle type: `handles/point.ts:16` says "player", `handles/region.ts:19` says "rect", `handles/weathereffect.ts:15` says "unit", `handles/timerdialog.ts:15` says "timer" (it is a timerdialog). Copy-paste artefacts; trivial fix (P8).
- Once P2 deletes the constructors, this error mode disappears entirely unless P3 option (b) re-introduces it in `create`. Decide the two together.
- `MapPlayer.fromLocal` (`handles/player.ts:324-332`) uses `print` ten times instead of `error()`; it is the only diagnostic that goes to the screen. `system/base64.ts:27,51` and `system/sync.ts:292` also `print` on failure. A single documented error channel (return `undefined` / `error()`) would be consistent with the rest.

## 7. Naming (`MapPlayer`, `Point`, `Rectangle`, `DialogButton`)

**What it is.** Class names diverge from Native type names where the obvious name collides with a Native *function* in the global namespace: `Player(i)` is a Native (`globals/index.ts:7`), so the Wrapper is `MapPlayer` (`handles/player.ts:7`); `Location(x, y)` is a Native, so `location` is wrapped as `Point` (`handles/point.ts:5,14`); `Rect(...)` is a Native, so `rect` is `Rectangle` (`handles/rect.ts:6,15`). `button` is wrapped as `DialogButton` (`handles/dialog.ts:6`) for clarity. All other 26 classes use the capitalised Native type name (`Unit`, `Timer`, `Trigger`, `Frame`, `Force`, `Group`, ...).

**What it does well.** The rule is consistent once stated: "Native type name, capitalised, unless that name is a global Native function; then a descriptive noun". voces/w3ts and wc3ts kept every name, so the ecosystem's tutorials and Map projects use them.

**What could be improved.** The rule is not written anywhere; it should be, in the class TSDoc (P1) and in the contributor guide. Renaming (`MapPlayer` -> `Player`) is impossible without shadowing the Native in every Map project that imports `*`, and would break every consumer for no capability gain (P10: keep).

## 8. Event and trigger ergonomics

**What it is.** `Trigger` (`handles/trigger.ts`, 412 lines, 50 exported members, 6 documented) exposes 28 `register*` methods that mirror `TriggerRegister*` Natives, accept Wrappers where a Handle is needed (`MapPlayer`, `Unit`, `Region`, `Frame`, `Dialog`), and accept `boolexpr | (() => boolean)` filters, converting functions with `Filter(...)` (`:165-174` etc.). `addCondition` does the same with `Condition` (`:97-103`). Event data is read through static accessors on the object classes: `Unit.fromEvent()` (`GetTriggerUnit`), `Unit.fromFilter()`, `Unit.fromEnum()` (`handles/unit.ts:1493-1503`), `MapPlayer.fromEvent()` (`handles/player.ts:305`), `Widget.fromEvent()`, `Trigger.fromEvent()`, `Frame.fromEvent()`/`getEventHandle`/`getEventText`/`getEventValue` (`handles/frame.ts:467-493`), `Timer.fromExpired()`.

**What it does well.**
- It is a faithful, complete map of the Native trigger API, so any JASS/Lua tutorial translates line by line. No hidden dispatcher, no per-event subscription registry, no ordering rules to learn. Predictability is the feature.
- The `() => boolean` acceptance is the one place the layer adds leverage: it hides `Filter`/`Condition` allocation in 22 methods: `Trigger` (6, `handles/trigger.ts:97-103,165-352`), every `Group.enum*` (10, `handles/group.ts:57-193`), `Force` (4, `handles/force.ts:58-86`) and `Rectangle` (2, `handles/rect.ts:71-79`).
- Commit `831ab74` (#45) shows the accessor family being used correctly (`Group.getUnits` must use `fromEnum`, not `fromFilter`).

**What could be improved.**
1. Raw Handles still leak on the input side: `registerTimerExpireEvent(t: timer)` (`:325`), `registerTrackableHitEvent(whichTrackable: trackable)` (`:329`), `registerTrackableTrackEvent` (`:333`), `registerPlayerMouseEvent(..., whichMouseEvent: number)` (`:267`). There is no `Trackable` Wrapper. (P6)
2. One method escaped the naming convention: `triggerRegisterFrameEvent` (`:401`) beside `registerFrameEvent`-style siblings.
3. Duplicated accessors: `Group.getEnumUnit()`/`Group.getFilterUnit()` (`handles/group.ts:277-283`) are `Unit.fromEnum()`/`Unit.fromFilter()` under another name.
4. `Trigger.eventId` is a static getter (`:51`) while `evalCount`/`execCount` are instance getters; the asymmetry is correct (the Native is context-global) but undocumented.
5. Ergonomic gap relative to Lua frameworks: everything is "make a Trigger, register, add an action, read globals in the action". Lua-Infused GUI (Bribe) goes the other way for *data* objects, replacing `location`/`group`/`rect`/`force` Handles with plain Lua tables so they are garbage-collected and never leak; `RemoveLocation` becomes a no-op. That is a different design point (no Handle at all) and would not fit a 1:1 binding library, but it is the strongest argument for keeping `Point` marginal (its own doc says "raw coordinates should be used instead", `handles/point.ts:22`) and for never adding "leak-safe" magic into `Group`/`Point` here.
6. A typed event helper layer (e.g. `Trigger.onAnyUnit(EVENT_PLAYER_UNIT_DEATH, (dying, killer) => ...)`) is the obvious next depth to add. Neither voces/w3ts nor wc3ts added one, and PR #38 did not either; it would be new surface with its own lifecycle questions (who owns the Trigger, when is it destroyed). Recommend: prototype it in a Map project first, not in the library.

## 9. Systems API

### 9.1 `sync` (`system/sync.ts`, 357 lines, 14 exported members, 7 documented)
- Chunks data into 244-byte packets (`:13`) because `BlzSendSyncData` is capped at 255 chars (`:99-100`), reassembles by request id, supports a timeout via a throwaway `Timer` (`:241-255`). Real depth: this is exactly the code every Map project would otherwise copy.
- Improvements: `then`/`catch` (`:194,264`) mimic Promise names but the object is not thenable (`await` would not work, and TSTL's `Promise` polyfill exists: `utils/index.ts:5-13` already uses it). Either return a real Promise from `start` or rename. `SyncRequest.eventTrigger = Trigger.create()` (`:139`) runs at module load, i.e. in the Lua root (P5). `init()` (`:307-326`) registers the sync event only for players present at first use; players who join... cannot in WC3, so this is fine but should be stated. `fromIndex` returns `undefined` for unknown ids without saying so in its type (`:300-302`).

### 9.2 `file` (`system/file.ts`, 136 lines, 4/4 documented)
- Static-only class with a private constructor and a clear header comment listing every caveat (`:6-28`). This is the best-documented module in the library and the template for P1. The `Preload` exploit and the `escape`/`unescape` pair are the depth. Nothing to change.

### 9.3 `gametime` (`system/gametime.ts`, 16 lines, 0/1 documented)
- A 30-second periodic `Timer` started in `main::after` (`:12-16`) plus `elapsed`. Correct and minimal. Undocumented: `getElapsedTime()` returns `0` before `main` has run (`:8`). Historically the file that caused the cyclic import (section 11).

### 9.4 `host` (`system/host.ts`, 104 lines, 0/1 documented)
- Detects the host as "the player with the longest lobby time" by syncing `os.clock()` deltas. Imports `MapPlayer` from the `handles/index` barrel (`:3`) instead of the module, the only barrel import inside the library. `isChecking` is written (`:34,94`) but never read; voces/w3ts added `if (isChecking) return;` at the top of `findHost` (compare API, `system/host.ts` patch). `onHostDetect` is exported with no doc.

### 9.5 `BinaryReader` / `BinaryWriter` (`system/binaryreader.ts`, `system/binarywriter.ts`, 12 members each, 1 documented each)
- Thin over `string.pack`/`string.unpack` with big-endian formats. Bug: `readDouble` uses format `>d` (8 bytes) but advances `pos` by 4 (`system/binaryreader.ts:48-50`), so any read after a double is misaligned; `writeDouble` (`system/binarywriter.ts:39-42`) writes 8. Both files lack `@noSelfInFile` (P7).

### 9.6 `base64` (`system/base64.ts`, 2/2 documented)
- Latin-1 only; failures go to `print` (`:27,51`). Fine as a System; the error channel is the inconsistency noted in section 6.

### 9.7 `utils` (`utils/color.ts`, `utils/index.ts`)
- `Color` (12 members, 8 documented) is a value type with `lerp`, `code`, player-colour lookup. Commit `8a11908` (#41) typed components as `ColorValue = NumberRange<0, 256>` via a recursive tuple type (`utils/color.ts:193-207`); it gives literal-checking at call sites at the cost of a 256-deep type instantiation and forces `as ColorValue` casts inside `lerp` (`:79-82`). `sleep` (`utils/index.ts:5-13`) wraps `Timer` in a Promise; `reject` is unused (voces removed it).

## 10. Hooks (`hooks/index.ts`) and lifecycle

**What it is.** At module load the file captures the global `main` and `config` (`:3-7`) and replaces them with wrapped versions (`:38-39`) that run before/after callback lists. `addScriptHook(entryPoint, hook)` (`:61-70`) is the public API; `W3TS_HOOK` enum and a string-literal union both exist (`:41-52`). Eight exports, none documented; `executeHooks*`, `hookedMain`, `hookedConfig` are exported implementation details.

**What it does well.** It is 70 lines, has no dependencies, and is what makes the Systems self-initialising (`system/gametime.ts:12`, `system/host.ts:103-104`). The requirement it imposes on Map projects (the library's Lua must be `require`d before `main` runs, i.e. from the Lua root) is the same requirement Total Initialization has.

**What could be improved.**
- Only two of the game's six initialisation points are exposed. Total Initialization (v5.3.1) exposes `OnInit.root`, `.config`, `.main`, `.global` (after `InitGlobals`), `.trig` (after `InitCustomTriggers`), `.map` (after `RunInitializationTriggers`), `.final` (after `MarkGameStarted`), plus `Require` for ordering between libraries. PR #38 ports the function-hooking half of that to w3ts: `addInitHook(name: "main" | "config" | "InitGlobals" | "InitCustomTriggers" | "RunInitializationTriggers" | "MarkGameStarted", fn, callBefore?)`, wraps the callback in `pcall` (so an error in one Hook does not kill init), and keeps `addScriptHook`/`W3TS_HOOK` as deprecated shims. It also makes hooking after the function was already called an `error()` instead of silently doing nothing. (P4)
- Total Initialization's author documents the reason to avoid doing work in the Lua root: objects created there "cause desyncs", `print` does not work, and crashes report nothing. This library creates Handles in the root in two places: `globals/index.ts:4-11` (`Player(i)` x 28 to fill `Players`) and `system/sync.ts:139` (`Trigger.create()` as a static initialiser). `Player(i)` is widely used at root in practice and the desync claim was not verified in this review; the cheap fix is to fill `Players` in a `config::before` Hook and create the sync Trigger lazily in `init()` (P5).
- `Require`-style dependency ordering is not needed here: TypeScript module imports already order initialisation.

## 11. `@noSelfInFile` usage and tstl-specific patterns

**Facts.**
- `tsconfig.json:39` sets `"noImplicitSelf": true`, which per the TSTL docs "treats all project files as if they were prefixed with `/** @noSelfInFile **/`". 33 of 43 files also carry the directive explicitly; 10 do not: `index.ts`, `handles/index.ts`, `system/index.ts`, `globals/index.ts`, `globals/order.ts`, `utils/index.ts`, `utils/color.ts`, `system/gametime.ts`, `system/binaryreader.ts`, `system/binarywriter.ts`.
- For the library's own Lua build the explicit directives are therefore redundant. They matter for consumers: `package.json:38-41` publishes only `**/*.lua` and `**/*.d.ts`, so a Map project compiles against the `.d.ts`. If a `.d.ts` for a file with exported free functions (`sleep`, `getElapsedTime`, `onHostDetect`, `base64Encode`) lacks the directive, the consumer's tstl emits calls with a leading `self` argument and the library's Lua receives shifted parameters. voces/w3ts's commit `219f677` "fix: restore @noSelfInFile directive across sources" (2026-05-17) added the directive to these files (the compare shows `+2` lines on each), which suggests it was found to matter. Whether `tsc` preserves the top-of-file comment into `.d.ts` was **not verified** here (no build run).
- No other TSTL annotations are used (`@noSelf`, `@customConstructor`, `@compileMembersOnly`, `LuaMultiReturn`, `$multi`: none found). `string.pack`/`unpack`, `string.gsub`, `os.clock`, `math.*` are called directly (lua-types), e.g. `system/file.ts:56-57`, `system/host.ts:29`.
- `tsconfig.json`: `moduleResolution: "Classic"` (`:5`), an explicit list of nine `lua-types/core/*` entries plus `lua-types/special/5.3` (`:7-19`) rather than the single `lua-types/5.3`, `war3-types-strict/1.33.0` (`:18`), tstl `buildMode: "library"`, `luaTarget: "5.3"`, `noHeader`, `sourceMapTraceback: false` (`:35-41`). `include` omits `utils` (`:24-30`) which is reached only transitively via `index.ts`. Dev toolchain is TS 5.0 / tstl 1.15 / ESLint 7 / airbnb-base (`package.json`, `.eslintrc.json`).
- Upstream issue #39 (source maps): the maintainer answers that tstl source mapping needs `debug.traceback`, "which is not enabled in Reforged"; so `sourceMapTraceback: false` is deliberate.
- voces/w3ts (commit `5cf8c6d`, 2026-05-17, "feat!: dual-target ESM/Lua, rebase on cipherxof@8a11908"): same sources, but `moduleResolution/module: node16`, `.js` suffixes on every relative import (hence an 18-line tstl `moduleResolution` plugin `tstl-strip-js.cjs`), `lua-types/5.3`, TS `^5.9 || ^6`, tstl `^1.36`, two build configs (`tsconfig.build.json`, `tsconfig.buildLua.json`), `exports` map with a `"tstl"` condition, package renamed `@voces/w3ts@4.0.1`. Its message and its `git diff` contain no API changes: all 31 source-file diffs are import suffixes, the directive restore, the `host.ts` re-entrancy guard and the unused `reject`. (P9)
- wc3ts (`@eiriksgata/wc3ts`, pushed 2026-08-21) forks the same code, moves it under `src/`, ships its own Typings (`src/types/*.d.ts`, including `japi.d.ts`, KKWE `Blizzard/DzAPI/KKAPI.j`), imports constants like `bj_UNIT_FACING` from a `globals/define` module instead of relying on ambient globals, and replaces `error(...)` with `Error(...)` in constructors (a no-op call, so failed creation is silently ignored there). Its distinctive design change is the dual registry for integer Frame handles; it is targeted at the Chinese KK platform, not Reforged.

**What to keep.** `noImplicitSelf` plus explicit directives on every file (belt and braces, cost zero). `buildMode: library`. Direct use of lua-types over polyfills.

## 12. Module layout and the cyclic-dependency history

**What it is.** Four folders with barrel files: `handles/index.ts` (28 re-exports), `system/index.ts` (7), `globals/index.ts` (order enum + `Players`), `utils/index.ts` (color + `sleep`); root `index.ts` re-exports all and namespaces globals as `tsGlobals`.

**History.** Commit `5e2082a` (2021-11-03, "fix cyclic dependency") changed one line: `system/gametime.ts` imported `addScriptHook` from `"../index"` (the root barrel), which re-exports `system/index`, which imports `gametime` again. The fix imports `"../hooks/index"` directly. That is the only cycle-related commit in the history.

**Current state.**
- Library-internal code imports concrete modules (`./player`, `../handles/timer`) except `system/host.ts:3` which imports from the `handles` barrel. Harmless today (handles never import system) but it is the pattern that bit in 2021.
- Genuine cycles remain among Wrappers, e.g. `handles/unit.ts:7` imports `Group` and `handles/group.ts:7` imports `Unit`. They are safe because the cross-references are used only inside method bodies, never at module top level (no `extends` across a cycle; `Unit extends Widget`, `Widget` imports only `Handle`). This is an unwritten invariant; one top-level use (a static field initialised from a cyclic import) would fail at Lua `require` time. Write it down (contributor doc), and consider an ESLint `import/no-cycle` warn to surface new ones.
- Folder taxonomy matches the ticket vocabulary exactly (handles = Wrappers, system = Systems, hooks = Hooks), which is a good property for AI navigation and for the docs. Keep.

## 13. TSDoc coverage today

Measured with a script (scratchpad, not committed) that counts exported top-level declarations plus public members of exported classes (methods, getters, setters, static members, public fields; getter/setter pairs count as two) and treats a member as documented when the nearest preceding non-blank line closes a `/** ... */` block. Private/protected members, constructors and re-export barrels are excluded.

**Total: 185 of 990 counted members documented (19%).**

| File | Members | Documented | % |
|------|--------:|-----------:|--:|
| handles/unit.ts | 243 | 42 | 17% |
| handles/frame.ts | 67 | 5 | 7% |
| handles/camera.ts | 64 | 29 | 45% |
| handles/player.ts | 62 | 4 | 6% |
| handles/item.ts | 54 | 6 | 11% |
| handles/trigger.ts | 50 | 6 | 12% |
| handles/effect.ts | 34 | 8 | 24% |
| handles/multiboard.ts | 32 | 5 | 16% |
| handles/sound.ts | 31 | 12 | 39% |
| handles/group.ts | 30 | 6 | 20% |
| handles/leaderboard.ts | 29 | 1 | 3% |
| handles/gamecache.ts | 27 | 6 | 22% |
| handles/quest.ts | 25 | 1 | 4% |
| handles/destructable.ts | 24 | 4 | 17% |
| handles/rect.ts | 18 | 0 | 0% |
| handles/texttag.ts | 16 | 0 | 0% |
| handles/force.ts | 14 | 1 | 7% |
| handles/region.ts | 14 | 0 | 0% |
| system/sync.ts | 14 | 7 | 50% |
| handles/dialog.ts | 13 | 2 | 15% |
| handles/image.ts | 12 | 9 | 75% |
| system/binaryreader.ts | 12 | 1 | 8% |
| system/binarywriter.ts | 12 | 1 | 8% |
| utils/color.ts | 12 | 8 | 67% |
| handles/timer.ts | 11 | 2 | 18% |
| handles/timerdialog.ts | 11 | 2 | 18% |
| handles/point.ts | 10 | 2 | 20% |
| handles/ubersplat.ts | 8 | 2 | 25% |
| hooks/index.ts | 8 | 0 | 0% |
| handles/fogmodifier.ts | 7 | 1 | 14% |
| handles/widget.ts | 7 | 4 | 57% |
| handles/weathereffect.ts | 5 | 1 | 20% |
| system/file.ts | 4 | 4 | 100% |
| handles/handle.ts | 3 | 1 | 33% |
| system/base64.ts | 2 | 2 | 100% |
| globals/index.ts, globals/order.ts, system/gametime.ts, system/host.ts, utils/index.ts | 1 each | 0 | 0% |

Observations: what documentation exists is mostly inherited from the JASS common.j annotations (`@bug`, `@note`, `@async` tags, e.g. `handles/timer.ts:33-35`, `handles/group.ts:200-205`, `handles/point.ts:52-58`), which is valuable and should be kept in that style. Class-level docs exist only on `Frame` (`handles/frame.ts:5-36`), `File`, `SyncRequest`, `BinaryReader/Writer`. No class documents its factory error mode, and `Handle`, the Hook API and all `fromX` accessors are undocumented. The `jassdoc-reuse` ticket is the natural source for the Native-level text; the library-level text (factory semantics, identity, lifecycle) has to be written here.

## 14. Principles worth keeping (stated so later tickets can test changes against them)

1. **One Wrapper per Handle, identity via a weak registry.** Wrappers compare with `===`; no manual unregistration. (`handles/handle.ts`)
2. **1:1 Native mapping, no hidden state in Wrappers.** A Wrapper method is the Native plus naming; no caching of game state, no leak management. Lua-Infused GUI is the counter-model and is explicitly out of scope for a binding library.
3. **Static factories (`create*`, `from*`), never `new`.** Uniform across all 30 classes since `f3f1647`.
4. **Strict Typings drive the surface.** `war3-types-strict` `| undefined` returns propagate to `fromX` accessors; do not paper over them with casts (the two remaining casts are `handles/unit.ts:320` in a deprecated getter and `handles/player.ts:331`).
5. **Convenience only where it removes a Native allocation the caller would otherwise have to manage** (`() => boolean` -> `Filter`/`Condition`).
6. **Systems are separate modules with Hooks for self-initialisation**, never coupled into Wrappers.
7. **Folder = concept** (handles/system/hooks/globals/utils); concrete-module imports inside the library, barrels only at the public edge.
8. **`noImplicitSelf` everywhere**; no `this` in the Lua output.

## 15. Things not verified in this review

- Whether `tsc` keeps `/** @noSelfInFile */` in emitted `.d.ts` (section 11); needs a build.
- Total Initialization's claim that creating game objects in the Lua root desyncs (section 10, P5).
- Stability of Handle identity as a Lua table key across the Handle's lifetime (section 3); the design assumes it.
- Lua output size/shape differences between this tree's tstl 1.15 and voces' tstl 1.36 build.

## 16. Sources

- This repo at `831ab74`: files cited inline; commits `f3f1647`, `5e2082a`, `831ab74`, `8a11908`.
- voces/w3ts: https://github.com/voces/w3ts (compare `cipherxof:master...voces:master`, commits `f042e23`, `5cf8c6d`, `219f677`; `handles/handle.ts`, `package.json`, `tsconfig.json`, `tstl-strip-js.cjs`).
- eiriksgata/wc3ts: https://github.com/eiriksgata/wc3ts (`src/handles/handle.ts`, `src/handles/timer.ts`, `src/handles/trigger.ts`, `src/handles/unit.ts`, `src/index.ts`, `README.md`).
- Upstream PR #38 "Refactoring and New Init Features": https://github.com/cipherxof/w3ts/pull/38 (patches for `handles/handle.ts`, `hooks/index.ts`, `handles/timer.ts`, `handles/unit.ts`, `globals/index.ts`).
- Upstream issues: https://github.com/cipherxof/w3ts/issues/39 (source maps; `debug.traceback` not enabled in Reforged), https://github.com/cipherxof/w3ts/issues/35 (`MapPlayer` private constructor), https://github.com/cipherxof/w3ts/issues/31 (`getItemInSlot` crash).
- Total Initialization v5.3.1 (Bribe): https://www.hiveworkshop.com/threads/total-initialization.317099/
- Lua-Infused GUI (Bribe): https://www.hiveworkshop.com/threads/lua-infused-gui-automatic-group-location-rect-leak-handler-with-hooks.317084/
- TSTL compiler annotations: https://typescripttolua.github.io/docs/advanced/compiler-annotations
- TSTL configuration (`noImplicitSelf`, `buildMode`): https://typescripttolua.github.io/docs/configuration
