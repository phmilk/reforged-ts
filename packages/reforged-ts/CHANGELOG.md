# reforged-ts

## 1.0.0-alpha.0

### Major Changes

- [#159](https://github.com/phmilk/reforged-ts/pull/159) [`05eda1a`](https://github.com/phmilk/reforged-ts/commit/05eda1a99bce016ef10483143216260bd706e482) Thanks [@phmilk](https://github.com/phmilk)! - First release under this name, for Warcraft III 3.0.0 and later. `reforged-ts` is the fork of w3ts 3.0.2; `reforged-types`, `reforged-test` and `eslint-plugin-reforged` are new packages.

- [#82](https://github.com/phmilk/reforged-ts/pull/82) [`70d7b4d`](https://github.com/phmilk/reforged-ts/commit/70d7b4d7f67efca2c5ff0e7d0c1721390971b5da) Thanks [@phmilk](https://github.com/phmilk)! - One Handle base for every Wrapper, one error rule, and no constructors.

  **Creation throws, lookup returns `undefined`.** Every member whose Native allocates a new Handle (every `create*`, and `Rectangle.fromPoint`, `Rectangle.getWorldBounds`, `Force.fromPlayer`, `FogModifier.fromRect`, `unit.getPoint()`, `unit.addItemById()`, `cameraSetup.destPoint`, `Camera.eyePoint`, `Camera.targetPoint`) is typed non-null and throws `reforged-ts: failed to create <Wrapper> (<detail>)` at the calling line when the game returns nothing. Every lookup (`fromHandle`, `fromEvent`, `fromEnum`, `fromFilter`, `fromIndex`, `getItemInSlot`, `getParent`, ...) is typed `X | undefined`. `unit.getOwner()` and `MapPlayer.fromLocal()` are typed non-null and throw should the game ever break their invariant.

  **Removed** (each listed with its replacement in `migration/renames.json`):

  - the deprecated constructor of every Wrapper (`new Unit(...)` is `Unit.create(...)`; `Frame`'s and `Effect`'s overloads map to their `create*` variants by argument shape); constructors are protected and only store the Handle;
  - the accessors `Frame.parent`, `Unit.owner` and `Unit.point` (use the get/set pairs);
  - `Group.getEnumUnit` and `Group.getFilterUnit` (use `Unit.fromEnum` and `Unit.fromFilter`);
  - `MapPlayer.create` (use `MapPlayer.fromIndex`);
  - `Handle.getObject` and `Handle.initFromHandle`: `Handle` is abstract, a Wrapper subclass inherits `fromHandle` and the protected creation helper `expect`.

  **Behaviour changes** (detailed in `migration/behaviour-changes.md`):

  - `Timer.create`, `Trigger.create`, `Point.create`, `Rectangle.create` and `Region.create` now throw instead of wrapping nothing;
  - `MultiboardItem.fromHandle` and `WeatherEffect.fromHandle` return `undefined` for `undefined`, like every other lookup;
  - a frame the game did not find (handle id 0) is `undefined` from every `Frame` lookup, and `Frame.create*` throws for a missing frame definition;
  - a lookup through a more specific class replaces the cached Wrapper (`Unit.fromHandle` after `Widget.fromEvent` gives a `Unit`, the one Wrapper for that Handle from then on);
  - `MapPlayer` and every other Wrapper can be extended by a Map project;
  - `MapPlayer.fromLocal()` no longer prints, and `Force.fromPlayer` no longer calls Blizzard.j.

- [#100](https://github.com/phmilk/reforged-ts/pull/100) [`71b1c1c`](https://github.com/phmilk/reforged-ts/commit/71b1c1cd64316b1f42e58f4643902afd87f32d47) Thanks [@phmilk](https://github.com/phmilk)! - Init stages under `pcall`, `Reforged.configure({ devMode })`, and no library Handle born in the Lua root.

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

- [#145](https://github.com/phmilk/reforged-ts/pull/145) [`ab8b7ba`](https://github.com/phmilk/reforged-ts/commit/ab8b7ba6d1c4cecaf2a8a91b7f194e8880106f4b) Thanks [@wyller](https://github.com/wyller)! - Runtime Guards in Dev mode, `MapPlayer.runLocal`, `Reforged.debug`, and four safe collections: `SyncedMap`, `SyncedSet`, `HandleMap` and `HandleSet`.

  **Runtime Guards.** With `Reforged.configure({ devMode: true })`, the library catches the classic Warcraft III scripting pitfalls while the map runs. Each Guard is decided when a callback is registered or when a Wrapper is created or destroyed, never per call, and with Dev mode off none of them runs: the Natives receive the Map project's own functions (`TimerStart` gets a closure that passes the handler its Timer, without `pcall`), `runLocal` is a `GetLocalPlayer()` comparison, `destroy()` calls its Native and forgets the Wrapper, and nothing is counted. Every message starts with `reforged-ts:`.

  - **Protected callbacks.** Timer handlers, trigger actions, conditions, filters, `Group.for`, `Force.for`, the `Rectangle` enumerations and `on()` handlers run under `pcall`. A failure is shown on screen for thirty seconds and printed as `reforged-ts: <origin> failed: <Lua error>`, the origin naming the Wrapper and the registering member (`Timer#<id> Timer.start`) or the Event descriptor (`UnitEvents.death`). The other callbacks still run, a failing condition or filter evaluates false, and a repeated failure is counted instead of shown again.
  - **Local-only code.** `MapPlayer.runLocal(player, fn)` runs `fn` on that player's client only. In Dev mode, inside it, creating or destroying a Wrapper, `Group.for`, `Force.for` and the first `Frame.fromName` of a frame raise `reforged-ts: <action> inside MapPlayer.runLocal changes game state for one client, which desyncs the game: only visuals belong inside runLocal`.
  - **Creation before the globals Init stage** raises, naming `Init.onGlobals`.
  - **Use after destroy.** A destroyed Wrapper is a tombstone: any access, a second `destroy()` included, raises `reforged-ts: used after destroy: <Class>#<id>`.
  - **Damage re-entrancy.** `Unit.damageTarget` raises when damage handlers nest past a limit, eight by default, set with `Reforged.configure({ damageDepthLimit })`; a single bounce passes.
  - **`Reforged.debug`.** `report()` prints and returns the Wrappers created, destroyed and live per class (a heuristic: only what the library saw) and the callback failures with their counts; `reset()` zeroes both.

  **Safe collections**, in both modes, with the `Map` and `Set` surface:

  - `SyncedMap` and `SyncedSet` iterate in sorted key order (numbers, strings, or any key with a comparator), the same on every client, and never compile to `pairs`. In Dev mode a key of the wrong kind raises where it is inserted.
  - `HandleMap` and `HandleSet` are keyed by Wrappers through their Handle: an entry disappears when its key is destroyed, is found through the Wrapper the registry upgraded (`Widget` to `Unit`), and iterates in insertion order.

  **Behaviour change, in both modes** (detailed in `migration/behaviour-changes.md`, with the Dev-mode changes): `destroy()` removes the Wrapper from the Handle registry, so `fromHandle` with the Handle of a destroyed object returns a new Wrapper, not the destroyed one.

  The "Desync safety and guards" guide lists every Guard with its message, what it catches, how Dev mode is switched and what the report counts.

- [#132](https://github.com/phmilk/reforged-ts/pull/132) [`789a5f5`](https://github.com/phmilk/reforged-ts/commit/789a5f5111dfac5adc7dc1ee8d47811e3a6623f3) Thanks [@phmilk](https://github.com/phmilk)! - The Systems with real `Promise`s: a sync API that `await` works with over a fixed-width wire format, host detection as `Host.detectHost()`, and binary, base64 and file fixes, each with one error mode.

  **Sync.** `new SyncRequest(from, options?)` creates a request and never starts it; `start(data)` returns a real `Promise` of a `SyncResponse` (the joined `data`, the sender as `from`, the game time as `time`, and the `request`), and `SyncRequest.send(from, data, options?)` creates and starts in one call. A request starts once: a second `start` throws at the calling line. `cancel()` rejects a pending request. The `Promise` rejects with a string naming the request and the cause: a timeout (`SyncOptions.timeout`, in seconds), a cancellation or a network error. `SyncStatus` gains `Cancelled` and `NetworkError`. Every packet has the one prefix `"rts"` and an 8-character header (the request id, chunk index and chunk count as unsigned 16-bit fields, base64-encoded), then at most 244 bytes of raw data, so the sender's data may hold no zero byte (encode binary data, for example with `base64Encode`) and `start` throws on one; a packet the System did not send is ignored, never thrown on. Request ids are a 16-bit counter every client allocates in the same order.

  **`Host`.** `Host.detectHost(options?)` returns a `Promise` of the elected `MapPlayer`, the same `Promise` for every call, and `Host.host` reads the result once it resolved. The election syncs each client's lobby time and elects the longest, ties to the lowest player index; it settles when every playing user answered or left, or at its timeout (10 seconds by default). It is opt-in: nothing runs until `detectHost` is called. The lobby time is measured at `config` through the library's own registration point, no longer through `addScriptHook`.

  **Binary.** `BinaryReader` advances by what `string.unpack` consumed, so `readDouble` no longer misaligns what follows; it reads `position` and `remaining`, and a read past the end throws with the position. `BinaryWriter` range-checks every integer width at write, and `writeUInt32`/`readUInt32` round-trip 0 to 2^32 − 1 on the 32-bit game and the 64-bit test VM alike. Strings are length-prefixed, so any byte, zero included, round-trips.

  **base64, file, time.** `base64Decode` throws on malformed input, naming the offset, and neither function prints. `File.read` reads the escape character followed by `q` correctly, and `File`'s doc states its escape contract and the two cases left unspecified until verified in game. `sleep` runs on `Timer.after` and resolves with no value. `Item.getField` and `Item.setField` now reach the item field Natives.

  **Removed or renamed** (each listed with its replacement in `migration/renames.json`): `SyncRequest.then` and `SyncRequest.catch` (use the `Promise`), `SyncCallback`, `ISyncResponse` (now `SyncResponse`), `ISyncOptions` (now `SyncOptions`), `SyncRequest.destroy` (now `cancel`), `SyncRequest.fromIndex`, the `SyncRequest` constructor overloads that took the data (use `SyncRequest.send`), `onHostDetect` (now `Host.detectHost`), `BinaryReader.read`, `BinaryReader.data` and `BinaryWriter.values`.

  **Behaviour changes** (detailed in `migration/behaviour-changes.md`):

  - `SyncRequest.start` returns a `Promise`, a second `start` throws, and rejections are strings; a network failure rejects instead of printing;
  - the sync prefix is `"rts"` instead of `"T"` and `"S"`, and the wire format is fixed-width with a raw payload;
  - host detection is opt-in, has a timeout and handles leavers;
  - binary strings are length-prefixed, a read past the end throws, and every integer write outside its range throws;
  - `base64Decode` throws on malformed input instead of printing and returning an empty string;
  - `File.write` and `File.writeRaw` return nothing, and `sleep` resolves with no value;
  - `Item.getField` and `Item.setField` read and write item fields, where they returned 0 and `false`.

- [#111](https://github.com/phmilk/reforged-ts/pull/111) [`4c0b745`](https://github.com/phmilk/reforged-ts/commit/4c0b74595133bf19df2a45875f1f5c5bd2519c9b) Thanks [@phmilk](https://github.com/phmilk)! - A chainable `Trigger` over Wrappers, the `Trackable` Wrapper, Timer handlers that receive their Timer, and Event descriptors with owned Subscriptions.

  **The `Trigger` Wrapper.** It stays one to one with the Natives whose first parameter is a trigger, and every input is a Wrapper: `registerTimerExpire(timer: Timer)`, `registerFrameEvent(frame, event)`, `registerTrackableHit(trackable: Trackable)` and `registerTrackableTrack(trackable: Trackable)` join the registrations that already took `Unit`, `MapPlayer`, `Region`, `Dialog`, `DialogButton` and `Widget`. Every registration, `addAction` and `addCondition` return the Trigger, so a Trigger is one chained expression. `addCondition` takes a `boolexpr` or a plain function, and the five filtered registrations take a `boolexpr`, a plain function or nothing. `isRunning()` and `interrupt()` cover `BlzTriggerIsRunning` and `BlzTriggerInterrupt`. `registerAnyUnitEvent` and `registerPlayerMouseEvent` go through Natives instead of Blizzard.j, the latter with the new `MouseEventKind` (`Down`, `Up`, `Move`): the library makes no Blizzard.j call.

  **The `Trackable` Wrapper.** `Trackable.create(modelPath, x, y, facing)` throws when the game creates nothing, `Trackable.fromEvent()` is the hit or tracked trackable, and `Trackable.fromHandle` is the base's. The game cannot destroy a trackable, so the class has no `destroy`.

  **Timers.** The `start` handler receives the Timer that was started, so a periodic handler pauses or destroys itself without `Timer.fromExpired()`. `Timer.after(timeout, handler)` runs a handler once on a Timer it creates and destroys; `Timer.every(interval, handler)` starts a periodic Timer and returns it to the caller, who owns it.

  **Event descriptors and `on()`.** `on(descriptor, handler, when?)` creates one Trigger, lets the descriptor register its event on it, runs `when`, if given, as the trigger's condition and the handler as its action, each with the event's typed payload, and returns a `Subscription` whose `destroy()` destroys that Trigger only. A payload field the event guarantees is typed non-null and raises `reforged-ts: missing <field> in the <event> payload` should the game give nothing; a field the game may leave empty is typed `| undefined`. The first release ships:

  - `UnitEvents`: `death`, `attacked`, `damaged` and `damaging` (flagged as damage events), `spellChannel`, `spellCast`, `spellEffect`, `spellFinish`, `spellEndcast`, `orderIssued`, `orderPoint`, `orderTarget`, `orderUnit`, `pickupItem`, `dropItem`, `useItem`, `sellItem`, `pawnItem`, the 3.0.0 `equip` and `unequip`, `trainFinish`, `constructFinish`, `researchFinish`, `upgradeFinish`, `heroLevel`, `heroSkill`, `changeOwner`, `summon`, `selected`, `deselected` and `loaded`, registered for every player's units, each with an `Of(unit)` twin for one Unit (`deathOf(hero)`) except `orderUnit`, whose event the Patch has no unit event for;
  - `PlayerEvents`: `chat`, `leave`, `keyDown`, `keyUp`, `mouseDown`, `mouseUp`, `mouseMove`, `syncData`, `allianceChanged`, `victory` and `defeat`;
  - `TimerEvents.expired(timer)`, `DialogEvents.click(dialog)` and `buttonClick(button)`, `FrameEvents.of(frame, event)`, `RegionEvents.enter(region, filter?)` and `leave(region, filter?)`, and `TrackableEvents.hit(trackable)` and `track(trackable)`.

  Every other event stays reachable through `Trigger`; the package README lists the ones that are not descriptors yet and why.

  **Event lookups.** Every response Native a descriptor reads for a Wrapper is also a static lookup on it, `undefined` when the game has nothing: `Unit.fromKilling`, `fromAttacker`, `fromDamageSource`, `fromDamageTarget`, `fromSpellTarget`, `fromOrdered`, `fromOrderTarget`, `fromTrained`, `fromConstructed`, `fromLeveling`, `fromChanging`, `fromSummoning`, `fromSummoned`, `fromTransport`, `fromLoaded`, `fromEntering` and `fromLeaving`; `Item.fromSpellTarget`, `fromSold`, `fromEquipped` and `fromUnequipped`; `Destructable.fromSpellTarget`.

  **Removed** (each listed with its replacement in `migration/renames.json`): `Trigger.registerTimerExpireEvent`, `Trigger.triggerRegisterFrameEvent`, `Trigger.registerTrackableHitEvent` and `Trigger.registerTrackableTrackEvent`, and the numeric argument of `Trigger.registerPlayerMouseEvent`.

  **Behaviour changes** (detailed in `migration/behaviour-changes.md`):

  - the Timer handler receives its Timer, and `Timer.destroy` returns nothing;
  - registration, `addAction` and `addCondition` return the Trigger instead of the `event`, `triggeraction` and `triggercondition` handles;
  - filter parameters are optional, and `addCondition` takes a plain function without `Condition`;
  - `registerAnyUnitEvent` and `registerPlayerMouseEvent` no longer call Blizzard.j;
  - `Frame.getEventText()` returns the frame event's text, typed `string | undefined`, instead of its number.

### Minor Changes

- [#159](https://github.com/phmilk/reforged-ts/pull/159) [`fc96e92`](https://github.com/phmilk/reforged-ts/commit/fc96e92caf9e6ef69a0db9ebf42f1476ed413461) Thanks [@phmilk](https://github.com/phmilk)! - The rename map has a no-renames marker. A major that removes and renames no public symbol records `{ "kind": "noRenames", "versions": { "from", "to" }, "note" }` in `migration/renames.json` instead of entries, so its version pair is seen as considered; `migration/renames.schema.json` accepts it. `no-legacy-w3ts-names` skips the marker when it reads the map.

  For `eslint-plugin-reforged` this is a major: the shape of a data file it reads from another package changed, and an earlier version of the plugin throws a `DataFileError` at load on a rename map that holds the marker. For `reforged-ts` it is a minor: the schema accepts one more kind of item and every existing entry keeps its shape.

- [#121](https://github.com/phmilk/reforged-ts/pull/121) [`09037e0`](https://github.com/phmilk/reforged-ts/commit/09037e0899ea6cf5c2c82f6b9cc1c6c7ecf23ed9) Thanks [@wyller](https://github.com/wyller)! - The rename map names the package rename. `migration/renames.json` has a `package` entry, `w3ts` to `reforged-ts`, one to one, so the legacy-names lint rule rewrites `import … from "w3ts"`. The schema, `migration/renames.schema.json`, accepts the new kind `package`, whose `old` and `new` are package names.

### Patch Changes

- Updated dependencies [[`8c2a87a`](https://github.com/phmilk/reforged-ts/commit/8c2a87a88822a03abba648aa6f0f22b143146151), [`05eda1a`](https://github.com/phmilk/reforged-ts/commit/05eda1a99bce016ef10483143216260bd706e482), [`73ca570`](https://github.com/phmilk/reforged-ts/commit/73ca570f95953c1a6d3a2715ed5b847a27db0885), [`f3043a4`](https://github.com/phmilk/reforged-ts/commit/f3043a4c6fd69509a824a6e6988c85d2147b00af), [`f62784d`](https://github.com/phmilk/reforged-ts/commit/f62784de6aa1812a69155d9acf9e02f72101ca73), [`af9eade`](https://github.com/phmilk/reforged-ts/commit/af9eade51298d78853f33da6349a4d0d415fb6d9), [`2d69302`](https://github.com/phmilk/reforged-ts/commit/2d6930269672240ba0389872feddd7225f0c56f5)]:
  - reforged-types@1.0.0-alpha.0
  - reforged-test@1.0.0-alpha.0
