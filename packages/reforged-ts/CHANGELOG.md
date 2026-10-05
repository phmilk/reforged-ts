# reforged-ts

## 1.0.0-alpha.16

### Patch Changes

- [#453](https://github.com/phmilk/reforged-ts/pull/453) [`b8be0ae`](https://github.com/phmilk/reforged-ts/commit/b8be0ae299cdbaaa13d77bd3d153209df9fd11e1) Thanks [@phmilk](https://github.com/phmilk)! - Guards for the Crashing cases of the Nullability sweep: calls that crashed the game for every player on 3.0.0.24268.

  **`no-crashing-arguments`** (error), a new lint rule. It reports a call whose literal arguments crashed the game in a Crashing case, read from the plugin's new data file `data/crashing-arguments.json`: today `BlzCreateFrameByType` and `Frame.createType` with the type `SIMPLEMESSAGEFRAME` or `CONTROL` and `inherits` `""`. Arguments match by the callee's parameter name, and only literals are reported: a template, another type or a value computed at run time is not. The message names the Crashing case, its Build and the replacement: inherit an FDF template that defines the type's fields.

  **`no-event-response-outside-event`** reports `GetExpiredTimer` and `Timer.fromExpired()` written directly in a trigger's handler (a callback given to `on(...)`, `trigger.addAction` or `TriggerAddAction`), with a message of its own: there the call crashes the game, even when the trigger fires from a timer's callback, since a trigger's handler runs in a new thread. Use the Timer that `Timer.start` passes its handler instead, kept where the trigger's handler can read it. A helper called from the handler is still not reported.

  In Dev mode, **`Frame.createType`** throws for the same arguments as `no-crashing-arguments`, before it calls the Native: `reforged-ts: Frame.createType of a CONTROL frame with inherits "" crashes the game (a Crashing case on 3.0.0.24268): inherit an FDF template that defines the type's fields`, at the calling line.

  In Dev mode, **`Image.create`** throws at the calling line when the image type is not an integer from 1 to 4, before it calls `CreateImage`: image type 2147483647 crashed the game, and 0 returned a Placeholder handle.

  `Timer.fromExpired`'s documentation says what the sweep measured: it crashes the game in a trigger's handler, and returns `undefined` in the callback of a destroyed timer. `FogModifier.create` and `FogModifier.createAtPoint` note that a radius of 2147483647 crashed the game.

## 1.0.0-alpha.15

### Patch Changes

- [#436](https://github.com/phmilk/reforged-ts/pull/436) [`8eab0d7`](https://github.com/phmilk/reforged-ts/commit/8eab0d772139939601acf5e3960a51741f9725e6) Thanks [@phmilk](https://github.com/phmilk)! - 28 constructors typed nullable now return their handle type, no longer `| undefined`: the Nullability sweep saw each return a handle on 3.0.0.24268 for typical arguments, odd numbers, empty or unknown names and rawcodes, and stale handle arguments alike. They are `CreateGroup`, `CreateForce`, `DialogCreate`, `InitHashtable`, `CreateQuest`, `QuestCreateItem`, `CreateDefeatCondition`, `CreateTimerDialog`, `CreateLeaderboard`, `CreateMultiboard`, `CreateUpgradeCommandButtonEffect`, `CreateLearnCommandButtonEffect`, `CreateUnitPool`, `CreateItemPool`, `CreateMinimapIcon`, `CreateMinimapIconOnUnit`, `CreateTextTag`, `CreateTrackable`, `CreateSound`, `CreateSoundFilenameWithLabel`, `CreateSoundFromLabel`, `CreateMIDISound`, `TerrainDeformCrater`, `TerrainDeformRipple`, `TerrainDeformWave`, `TerrainDeformRandom`, `AddSpecialEffect` and `CreateBlightedGoldmine`. A `?.` or `!` on their result is no longer needed.

  The 108 constructors the sweep measured carry a `@remarks` with what was measured. The 62 that stay `| undefined` for a case that returned nothing name those cases, such as a removed location or rect, a destroyed trigger or dialog, an unknown unit, item or destructable rawcode, or an unknown frame name, or that crashed the game (`CreateFogModifierRadius`, `CreateFogModifierRadiusLoc` and `CreateImage` with a radius or image type of `2147483647`).

  `Force.fromPlayer` adds no player when it throws: before, in Dev mode, a Guard that raised (a call before the globals Init stage or inside `MapPlayer.runLocal`) left the player added to a force the game had created.

- [#446](https://github.com/phmilk/reforged-ts/pull/446) [`4e0e404`](https://github.com/phmilk/reforged-ts/commit/4e0e4044af0d5d92405918d4d1344725a53b47fb) Thanks [@phmilk](https://github.com/phmilk)! - `TriggerAddAction` now returns `triggeraction | undefined`, no longer `triggeraction`: on a destroyed trigger the game returns a placeholder handle of id 0 in place of nothing, and a later Patch may return nothing there. Check its result for `undefined` where you call it directly. Six more constructors that fail the same way stay `| undefined`: `CreateCommandButtonEffect` (an unknown order), `CreateMinimapIconAtLoc` (a removed location), `AddWeatherEffect` (an unknown effect rawcode, id -1, or a removed rect), `AddLightning` and `AddLightningEx` (an unknown code name, or `checkVisibility` with points the player cannot see) and `CreateUbersplat` (an unknown name, id -1). The `@remarks` of all seven name the cases that gave the placeholder, which a nil check does not catch on 3.0.0.24268.

  `Trigger.addAction` keeps nothing for `removeAction` when `TriggerAddAction` returns nothing, and still returns the Trigger.

- Updated dependencies [[`c4a4aef`](https://github.com/phmilk/reforged-ts/commit/c4a4aef03feee0a9cab5182be3935c77fe8094f6), [`8eab0d7`](https://github.com/phmilk/reforged-ts/commit/8eab0d772139939601acf5e3960a51741f9725e6), [`5e96ca2`](https://github.com/phmilk/reforged-ts/commit/5e96ca25e45ddb8d1ec3fce3f663806b94a5080d), [`21e4534`](https://github.com/phmilk/reforged-ts/commit/21e45346ec0e3b71eb3c61c89db7c09dcafe7cfc), [`4c061da`](https://github.com/phmilk/reforged-ts/commit/4c061dadb5a1523b81253ab86e99730f65446388), [`dbdabc9`](https://github.com/phmilk/reforged-ts/commit/dbdabc958376b83800cda7b79bff8cf946bd27a9), [`8bdcd3a`](https://github.com/phmilk/reforged-ts/commit/8bdcd3a4a5c673655d0efae4bd35098b1cca2437), [`db51e02`](https://github.com/phmilk/reforged-ts/commit/db51e025837d423375feb52f062c5c07a53c033b), [`75378d0`](https://github.com/phmilk/reforged-ts/commit/75378d003976ddbfea59b488cbc4a05b2769890c), [`728953d`](https://github.com/phmilk/reforged-ts/commit/728953ddfb6f3b7ef683f7c49e62a82379986f8a), [`4e0e404`](https://github.com/phmilk/reforged-ts/commit/4e0e4044af0d5d92405918d4d1344725a53b47fb)]:
  - reforged-types@1.0.0-alpha.4

## 1.0.0-alpha.14

### Patch Changes

- [#355](https://github.com/phmilk/reforged-ts/pull/355) [`018c29d`](https://github.com/phmilk/reforged-ts/commit/018c29d978d87c7cb2d13d0212084ff8c58ff270) Thanks [@wyller](https://github.com/wyller)! - `OrderId.Instant1` to `Instant4` say in their docs whether the game's order tables confirm their ids. Every other `OrderId` member is now checked against the game's table of order ids, so a wrong value cannot ship unnoticed.

## 1.0.0-alpha.13

### Patch Changes

- [#352](https://github.com/phmilk/reforged-ts/pull/352) [`34afe2c`](https://github.com/phmilk/reforged-ts/commit/34afe2cace1a87a9b827952fa3c52ee29a0f49ba) Thanks [@wyller](https://github.com/wyller)! - `BlzFrameGetParent` now returns `framehandle | undefined`: the Nullability sweep saw it return nothing for a destroyed frame on 3.0.0.24268. Check its result before you use it, as `Frame.getParent()` already does. Sixteen more Natives keep their non-null return, now backed by the sweep: `CreateTimer`, `CreateTrigger`, `CreateRegion`, `CreateCameraSetup`, `GetLocalPlayer`, `Location`, `Rect`, `Condition`, `Filter`, `And`, `Or`, `Not`, `GetOwningPlayer`, `GetUnitLoc`, `CameraSetupGetDestPositionLoc` and `TriggerAddAction`. Each carries a `@remarks` with the cases measured. `Trigger.addAction` drops a check for a `nil` the game never returned.
- Updated dependencies [[`34afe2c`](https://github.com/phmilk/reforged-ts/commit/34afe2cace1a87a9b827952fa3c52ee29a0f49ba)]:
  - reforged-types@1.0.0-alpha.3

## 1.0.0-alpha.12

### Major Changes

- [#324](https://github.com/phmilk/reforged-ts/pull/324) [`7a64295`](https://github.com/phmilk/reforged-ts/commit/7a642954f76364491b8672238b067a09121184cd) Thanks [@wyller](https://github.com/wyller)! - `MapPlayer.getStartLocationPoint()` returns a `Point` ([#258](https://github.com/phmilk/reforged-ts/issues/258)).

  **Breaking change** (detailed in `migration/behaviour-changes.md`): the `MapPlayer.startLocationPoint` accessor returned the raw `location` handle `GetStartLocationLoc` allocates on each read, or `undefined` when the game returned none. It becomes the method `getStartLocationPoint()`, like `Unit.getPoint()`, which returns a new `Point` wrapping that location and throws `reforged-ts: failed to create Point` when the game returns none. `RemoveLocation(player.startLocationPoint)` becomes `player.getStartLocationPoint().destroy()`.

## 1.0.0-alpha.11

### Major Changes

- [#321](https://github.com/phmilk/reforged-ts/pull/321) [`d132365`](https://github.com/phmilk/reforged-ts/commit/d13236530b539324e2f91cca3412581fd0677f93) Thanks [@wyller](https://github.com/wyller)! - `OrderId.Battleroar` and `OrderId.Forkedlightning` hold the game's ids ([#255](https://github.com/phmilk/reforged-ts/issues/255)).

  **Breaking change** (detailed in `migration/behaviour-changes.md`): In w3ts 3.x `OrderId.Battleroar` held the id of `battlestations` (852099) and `OrderId.Forkedlightning` held the id of `elementalfury` (852586); the mix-up went one way only: `OrderId.Battlestations` and `OrderId.Elementalfury` always held the right ids. They are now 852599 and 852587, so both uses change. Code that issued `OrderId.Battleroar` or `OrderId.Forkedlightning` to issue `battlestations` or `elementalfury` issues `OrderId.Battlestations` or `OrderId.Elementalfury`. Code that compared an incoming order id (the order id of an order event, `GetIssuedOrderId`) with `OrderId.Battleroar` or `OrderId.Forkedlightning` to catch `battlestations` or `elementalfury` no longer matches them: it compares with `OrderId.Battlestations` or `OrderId.Elementalfury`.

## 1.0.0-alpha.10

### Major Changes

- [#314](https://github.com/phmilk/reforged-ts/pull/314) [`5678711`](https://github.com/phmilk/reforged-ts/commit/56787119433ac5778cdb871ce1bdcbd99f0af05c) Thanks [@wyller](https://github.com/wyller)! - `Item.invulnerable` sets the value it is given ([#256](https://github.com/phmilk/reforged-ts/issues/256)).

  **Breaking change** (detailed in `migration/behaviour-changes.md`): the setter passed `true` to `SetItemInvulnerable` whatever the value, so `item.invulnerable = false` made the item invulnerable. It now passes its value: `item.invulnerable = false` makes the item vulnerable again. Code that set `false` and relied on the item becoming invulnerable sets `true`.

- [#317](https://github.com/phmilk/reforged-ts/pull/317) [`bc110a5`](https://github.com/phmilk/reforged-ts/commit/bc110a524f604182d73a72ede454ba96dfef3bce) Thanks [@wyller](https://github.com/wyller)! - `Item.player` is renamed `Item.getOwner()`, named like `Item.setOwner` and `Unit.getOwner`; it returns the owner as a `MapPlayer`, or `undefined`, as `Item.player` did. The rename map lists `Item.player` as an accessor whose getter is `Item.getOwner`, so `no-legacy-w3ts-names` suggests the call `item.getOwner()` for a read of `item.player`. `Camera.setCameraOrientController` is renamed `Camera.setOrientController`, like its twin `Camera.setTargetController`; it takes the same arguments. The lint plugin's `local-safe.json` lists `Camera.setOrientController` in place of the old name, so `no-game-state-in-local-branch` still lets it through inside a local branch.

## 1.0.0-alpha.9

### Major Changes

- [#310](https://github.com/phmilk/reforged-ts/pull/310) [`0640604`](https://github.com/phmilk/reforged-ts/commit/064060406607068564994b44bdec8b63f3b6402e) Thanks [@wyller](https://github.com/wyller)! - `Camera.SetCinematicScene` is renamed `Camera.setCinematicScene`. `Camera.pan` and `Camera.panTimed` take `zOffsetDest` as an optional last parameter: left out, they call `PanCameraTo` and `PanCameraToTimed` as passing `undefined` did. `Camera.setCameraOrientController` and `Camera.setTargetController` take a `Unit` instead of the raw `unit` handle.

- [#310](https://github.com/phmilk/reforged-ts/pull/310) [`0640604`](https://github.com/phmilk/reforged-ts/commit/064060406607068564994b44bdec8b63f3b6402e) Thanks [@wyller](https://github.com/wyller)! - `Unit.getflyHeight` and `Unit.setflyHeight` are renamed `Unit.getFlyHeight` and `Unit.setFlyHeight`. `Unit.getIgnoreAlarm` is renamed `Unit.setIgnoreAlarm`, since it changes the setting. `Unit.dropItemFromSlot` is renamed `Unit.moveItemToSlot`, since it moves the item to another inventory slot. `Unit.setUnitAttackCooldown` is removed: `Unit.setAttackCooldown` does the same. Each renamed member calls the same Native with the same arguments. `Unit.removeUnitFromStock` names its parameter `unitId`, the unit type it takes.

- [#310](https://github.com/phmilk/reforged-ts/pull/310) [`0640604`](https://github.com/phmilk/reforged-ts/commit/064060406607068564994b44bdec8b63f3b6402e) Thanks [@wyller](https://github.com/wyller)! - `Item.player` returns the owner as a `MapPlayer`, or `undefined`, instead of the raw `player` handle. `MapPlayer.getTaxRate` takes the other player as a `MapPlayer`, as `MapPlayer.setTaxRate` does, instead of the raw `player` handle.

- [#310](https://github.com/phmilk/reforged-ts/pull/310) [`0640604`](https://github.com/phmilk/reforged-ts/commit/064060406607068564994b44bdec8b63f3b6402e) Thanks [@wyller](https://github.com/wyller)! - `GameCache.restoreUnit` returns the restored unit as a `Unit`, and throws `reforged-ts: failed to create Unit (<key>)` when the game creates none, instead of returning the raw `unit` handle or `undefined`. `GameCache.store` takes a `Unit` instead of the raw `unit` handle. `GetStoredString` is typed `string`, not `string | undefined`: the game returns `""` for a missing key.

- [#310](https://github.com/phmilk/reforged-ts/pull/310) [`0640604`](https://github.com/phmilk/reforged-ts/commit/064060406607068564994b44bdec8b63f3b6402e) Thanks [@wyller](https://github.com/wyller)! - `Frame.setTextAlignment` returns the `Frame`, as the other `Frame` setters do, instead of nothing. `MultiboardItem.create` and `Multiboard.createItem` name their parameters `row` and `column` instead of `x` and `y`, in the same order and with the same behaviour.

### Patch Changes

- Updated dependencies [[`0640604`](https://github.com/phmilk/reforged-ts/commit/064060406607068564994b44bdec8b63f3b6402e)]:
  - reforged-types@1.0.0-alpha.2

## 1.0.0-alpha.8

### Major Changes

- [#302](https://github.com/phmilk/reforged-ts/pull/302) [`c055b24`](https://github.com/phmilk/reforged-ts/commit/c055b248b658b36f6ba11b8edc13ceb09ac60cfc) Thanks [@wyller](https://github.com/wyller)! - `Unit.skillPoints = n` sets the hero's unspent skill points to `n`, where it added `n` before; `Unit.modifySkillPoints` still adds. `Unit.addItemById` returns the item it created when the inventory has no room, the item then lying at the unit's feet, where it threw before: it calls `CreateItem` and `UnitAddItem` instead of `UnitAddItemById`, which returns nothing for that item, and still throws for a removed unit. The test harness stubs `GetUnitX`, `GetUnitY`, `UnitAddItem`, `UnitModifySkillPoints` and `GetHeroSkillPoints`.

### Patch Changes

- [#304](https://github.com/phmilk/reforged-ts/pull/304) [`be027ab`](https://github.com/phmilk/reforged-ts/commit/be027ab19ba3193da82a2a1630d35350f5004a1c) Thanks [@wyller](https://github.com/wyller)! - `Region.containsPoint` and `Leaderboard.hasPlayerItem` return the boolean of their Native (`IsLocationInRegion`, `LeaderboardHasPlayerItem`), where they returned nothing.
- Updated dependencies [[`c055b24`](https://github.com/phmilk/reforged-ts/commit/c055b248b658b36f6ba11b8edc13ceb09ac60cfc)]:
  - reforged-test@1.0.0-alpha.4

## 1.0.0-alpha.7

### Patch Changes

- [#294](https://github.com/phmilk/reforged-ts/pull/294) [`ad09176`](https://github.com/phmilk/reforged-ts/commit/ad0917614b1dfe9ed26cf6a95689c91075f02131) Thanks [@phmilk](https://github.com/phmilk)! - `Host`'s doc comment and the Systems guide no longer call the host election unverified: it was checked in game on 3.0.0.24268 ([#131](https://github.com/phmilk/reforged-ts/issues/131)). A documentation change, with no behavior change in the game. `config` runs when the map loads in the lobby, `os.clock` tracks wall time there, and the countdown and loading screen that every client shares cancel out. With two clients, both elected the lobby creator, also when the creator sat in slot 1 and the other player in slot 0.

- [#290](https://github.com/phmilk/reforged-ts/pull/290) [`50133e7`](https://github.com/phmilk/reforged-ts/commit/50133e7a38c3ded5002368fadfe1b342b3e777ea) Thanks [@wyller](https://github.com/wyller)! - Check the UnitEvents table by the shape of its entries: a row may have a name ending in `Of`, a twin names exactly one row and is keyed after it, and `UnitEvents` raises an error when two groups give the same name.

## 1.0.0-alpha.6

### Patch Changes

- [#283](https://github.com/phmilk/reforged-ts/pull/283) [`ab82b2b`](https://github.com/phmilk/reforged-ts/commit/ab82b2b3e926f3027864e1322ca63a1d3a8f2822) Thanks [@phmilk](https://github.com/phmilk)! - Every `@async` member, Event descriptor and lifecycle member now shows a compiled example in its hover and on the docs site ([#279](https://github.com/phmilk/reforged-ts/issues/279)). A documentation change, with no behavior change in the game:

  - An `@async` member's example feeds its local value to visuals only, such as the local camera, a frame or a text tag, never to game state.
  - An Event descriptor's example shows its payload, the fields that can be `undefined`, and the Subscription `on()` returns.
  - A `destroy()` example shows when to call it and what becomes of the references to a destroyed Wrapper. `Sound.killWhenDone`, `Sound.stop` and `Subscription.destroy` show theirs too.

## 1.0.0-alpha.5

### Minor Changes

- [#275](https://github.com/phmilk/reforged-ts/pull/275) [`c48d56a`](https://github.com/phmilk/reforged-ts/commit/c48d56a54a92c5bb4d06be7cecec9416f4adc928) Thanks [@wyller](https://github.com/wyller)! - The Trigger remove members take what the add members were given: `trigger.removeAction(fn)` removes the actions `trigger.addAction(fn)` added, and `trigger.removeCondition(fnOrBoolexpr)` the conditions `addCondition` added, destroying the `Condition` the Trigger made for a function (never a `boolexpr` you passed). `removeActions()`, `removeConditions()` and `destroy()` also destroy those `Condition`s, which used to leak. Every function condition now gets a `Condition` of its own, around a closure the Trigger makes with Dev mode on or off, so two adds of one function never share a handle, and a `Condition(fn)` of yours is never destroyed. A condition removed from inside its own evaluation has its `Condition` destroyed when that evaluation returns. A raw `triggeraction` or `triggercondition` still goes straight to the Native, and every remove member now returns the Trigger. The `BoolexprInput` type the condition members name is exported. The test harness stubs `DestroyCondition`; its `Condition` and `Filter` return the same handle for the same function until it is destroyed, as JASS caches one per code; and a stub handle's `tostring` now begins with its kind and a colon, as in the game.

### Patch Changes

- [#273](https://github.com/phmilk/reforged-ts/pull/273) [`3b7cd90`](https://github.com/phmilk/reforged-ts/commit/3b7cd909d86b4f1e3481efb6fb9307c76be7b43d) Thanks [@wyller](https://github.com/wyller)! - Document the events namespaces member by member. `UnitEvents`, `PlayerEvents`, `DialogEvents`, `FrameEvents`, `RegionEvents`, `TimerEvents` and `TrackableEvents` show on the docs site as namespaces, each member with its summary and `@native` tags, instead of a variable of a computed type. Each `UnitEvents` twin (`attackedOf(unit)`, `deathOf(unit)` and the others) now has a doc comment of its own, with its `@native TriggerRegisterUnitEvent`, in the editor hover as on the site, and the fields of every `UnitEvents` payload are documented. The members, their registrations and their payloads are unchanged.
- Updated dependencies [[`c48d56a`](https://github.com/phmilk/reforged-ts/commit/c48d56a54a92c5bb4d06be7cecec9416f4adc928)]:
  - reforged-test@1.0.0-alpha.3

## 1.0.0-alpha.4

### Major Changes

- [#267](https://github.com/phmilk/reforged-ts/pull/267) [`6aee802`](https://github.com/phmilk/reforged-ts/commit/6aee802a12d2ad0f735ac168a324d0ae83e2ca75) Thanks [@phmilk](https://github.com/phmilk)! - `Group.addGroupFast` and `Group.removeGroupFast` change `this`, as their names say ([#260](https://github.com/phmilk/reforged-ts/issues/260)).

  **Breaking change** (detailed in `migration/behaviour-changes.md`): the game's `BlzGroupAddGroupFast` and `BlzGroupRemoveGroupFast` change their second group (measured in 3.0.0), and the members passed `this` first, so `a.addGroupFast(b)` added the units of `a` to `b`. They now pass their argument first: `a.addGroupFast(b)` adds the units of `b` to `a`, and `a.removeGroupFast(b)` removes them from `a`. Code that called `a.addGroupFast(b)` to fill `b` calls `b.addGroupFast(a)`, and code that called `a.removeGroupFast(b)` to empty `b` of the units of `a` calls `b.removeGroupFast(a)`.

### Patch Changes

- [#272](https://github.com/phmilk/reforged-ts/pull/272) [`e92c616`](https://github.com/phmilk/reforged-ts/commit/e92c616d5586f93d344d22f80070a3758dfdf198) Thanks [@wyller](https://github.com/wyller)! - `Color`'s documentation no longer claims that an alpha of 0 comes out opaque ([#264](https://github.com/phmilk/reforged-ts/issues/264)). A documentation fix, with no behavior change in the game: on Lua, `new Color(r, g, b, 0)` always kept its alpha of 0, and the constructor now gives 255 only to an alpha left out, as a default parameter value.

- [#271](https://github.com/phmilk/reforged-ts/pull/271) [`0a83de9`](https://github.com/phmilk/reforged-ts/commit/0a83de9d30ae4e269a96731df1877adfd321a99b) Thanks [@wyller](https://github.com/wyller)! - The editor hover of a titled `@example` keeps the indentation of its code: the declarations put the title on a line of its own after `@example` ([#265](https://github.com/phmilk/reforged-ts/issues/265)).
- Updated dependencies [[`6aee802`](https://github.com/phmilk/reforged-ts/commit/6aee802a12d2ad0f735ac168a324d0ae83e2ca75)]:
  - reforged-test@1.0.0-alpha.2

## 1.0.0-alpha.3

### Minor Changes

- [#254](https://github.com/phmilk/reforged-ts/pull/254) [`3ecdc3e`](https://github.com/phmilk/reforged-ts/commit/3ecdc3ea7a8eae50df084307a73769a22b21b217) Thanks [@phmilk](https://github.com/phmilk)! - Every public symbol of the library carries a doc comment, in the `.d.ts` files the editor reads: what it does, its parameters with their units and ranges, what it returns (a lookup says when it is `undefined`), the error each creation raises with its message, the Natives behind it with `@native`, and `@async` on each value read from the local client. Every Wrapper and System comes with an example, and the editor's hover shows the example's code. The API reference on the docs site is built from the same comments.

  Caveats use the standard `@remarks` tag instead of `@note`. The behaviour changes from w3ts 3.x (the `readDouble` alignment, the corrected error messages of `Point`, `Region`, `TimerDialog` and `WeatherEffect`, `Players` filled at the `globals` stage, the silent `MapPlayer.fromLocal`) are in the `@remarks` of the members they affect.

  New type exports, so code written apart from the call it serves can name its types:

  - The Event payloads: `ChatPayload`, `DialogClick`, `FramePayload`, `KeyPayload`, `MousePayload`, `PlayerPayload`, `RegionCrossing`, `SyncPayload` and `TrackablePayload`, for a handler written apart from its `on()` call.
  - The types the events namespaces are declared with: `EventDescriptors`, `EventRow`, `FixedRow` and `UnitEventDescriptors`.
  - `WrapperClass`, which `Handle.fromHandle`'s signature names, and `EntryPoint`, the type of `addScriptHook`'s first parameter.

  `item.icon` is no longer marked `@async`: `BlzGetItemIconPath` gives the same path on every client.

  `addScriptHook` and `W3TS_HOOK` stay deprecated and are removed in 2.0.0. Their deprecation notes now name the Init stage to move to: `Init.onGlobals` for `main::before`, `Init.onInitTriggers` for `main::after`. The two `config` entry points have no replacement: they work until 2.0.0.

## 1.0.0-alpha.2

### Patch Changes

- [#227](https://github.com/phmilk/reforged-ts/pull/227) [`d861008`](https://github.com/phmilk/reforged-ts/commit/d8610085834eee66b43fc627ba888b654bab4139) Thanks [@phmilk](https://github.com/phmilk)! - `File.read` now reads back a file whose contents equal the icon path of the `Amls` ability (`ReplaceableTextures\CommandButtons\BTNMagicLariet.blp`). It used to return `undefined` for such a file, as for a missing one; a missing file still reads `undefined`.

## 1.0.0-alpha.1

### Major Changes

- [#208](https://github.com/phmilk/reforged-ts/pull/208) [`4e6e5f4`](https://github.com/phmilk/reforged-ts/commit/4e6e5f4913f9a6a14a8de1eb60d7045ebdd22eb3) Thanks [@phmilk](https://github.com/phmilk)! - Wrappers for the 3.0.0 systems, and every Wrapper covers the Natives it owns: the Wrapper coverage report of ADR 0008 lists zero missing against Patch 3.0.0.24268, and `pnpm check` fails when a Native goes missing.

  **Equipment and the extended inventory.** Three enums, `EquipmentType`, `ItemTag` and `LoadoutSlot`, typed so that one is never passed as another. `Item` gains the getters `equipmentType`, `tag`, `isEquipped` and `isInBag`, a `color` setter and `Item.chooseRandomWithFilter(type, level, equipmentType, tag)`. `Unit` gains `equip(item)`, `unequip(item)`, `unequipSlot(slot)`, `equippedItem(slot)`, `bagItem(index)`, the getter `bagSize`, `hasEquipped(item)`, `hasBagged(item)`, `hasAnyEquipped()`, `hasEquipmentOfType(type)`, `canEquip(type)` and `hasEmptySlot(slot)`. A Native answer no enum member names throws `reforged-ts: <Native> returned a value <Enum> does not name` at the reading line.

  **The loose 3.0.0 members.** `Unit`: ability cooldowns in percent and remaining time, `getAnimationDuration`, `allowHeroGlow` with the getter `isHeroGlowAllowed`, `enableAuras` and `resetAttack`. `MapPlayer.setRaceSkin`. `Frame.setTextAreaAutoScroll` and the `@async` pixel conversions `Frame.pixelToFrameX/Y` and `frameToPixelX/Y`. `Effect.setAnimation`, `queueAnimation` and `setAnimationBlendTime`. Camera: `Camera.type`, `Camera.isFieldControlledByInput` and `setFieldControlledByInput`, `CameraSetup.type`, and the camera blockers `Rectangle.addCameraBlocker()` and `enableCameraBlocker(flag)`. `Sound`: `start(fadeIn?)`, the thematic music statics (`playThematicMusic(file, fromMs?)`, `endThematicMusic`, `setThematicMusicVolume`, `pauseThematicMusicOnFocusLost`) and the factories `createFilenameWithLabel`, `createFromLabel` and `createMIDI`.

  **Static namespaces.** `Input` polls raw input for the local player: `isKeyPressed`, `isMouseButtonPressed`, `isMetaKeyPressed(MetaKey.Shift)` with the new `MetaKey` enum, and the mouse screen position, every member `@async`. `Terrain` holds `isPathable` and `isPathableEx`. Both are classes of static members, like `Camera` and `File`.

  **`Destructable.create(options)`.** One factory over the game's 32 creation Natives: `Destructable.create({ typeId, x, y })` with the optional `z`, `face`, `scale`, `variation`, `pitch`, `roll`, `skin`, `color` and `dead`, the options given picking the Native. A destructable gains `setColor(color)` and `setVertexColor`.

  **The closed gaps.** Every owned Native the report listed has a member on the class that owns or calls it. Among them: the `Unit` statics `createByName`, `createAtPoint`, `createAtPointByName`, `createCorpse` and `createBlightedGoldmine`; the neutral orders (`issueNeutral*Order`, `queueNeutral*Order`) and the `queue*Order` family; `getWeaponField` and `setWeaponField`; `MapPlayer` setters and get/set pairs (`team`, `startLocation`, `controller`, `handicapDamage`, `handicapReviveTime`), fog, blight, AI and text members (`displayText`, `displayTimedText`, `displayChatMessage`); `FogModifier.createAtPoint`; `Effect.createAtPoint` and `createSpellAtPoint`, with `createSpell` and `createSpellAttachment` taking an ability name or id; `Rectangle.setDoodadAnimation` and `setDoodadColor`; `Frame.name`; `GameCache.storeInteger` and `hasUnit`; `Point.createMinimapIcon` and `Unit.createMinimapIcon`; `Widget.addIndicator`. The event and enumeration lookups return `| undefined`: `Unit.fromDying`, `fromBuying`, `fromSpellAbility` and the other `Unit.from*`, `Item.fromEnum`, `fromFilter`, `fromAbsorbing` and `fromStackingSource/Target`, `Destructable.fromEnum` and `fromFilter`, `Widget.fromOrderTarget` with its `Unit`, `Item` and `Destructable` overrides, `MapPlayer.fromWinning`, `fromPreviousOwner` and `fromDetecting`, and `Point.fromOrderPoint`, `fromSpellTarget` and `fromMousePosition`. `TriggerWaitForSound` and `SetImageRender` are excluded with a reason.

  **The coverage report.** `pnpm coverage:report` (in the workspace, not published) writes `wrapper-coverage/report.json` and `report.md`: per Wrapper, the Natives it owns, each covered (with the calling class), excluded or missing, and the unowned Natives by handle type. It exits 1 on a missing Native or a stale exclusion, and `pnpm check` runs it.

  **Breaking changes** (detailed in `migration/behaviour-changes.md`; the removed members are in `migration/renames.json`):

  - `Destructable.create` takes an options object instead of the rawcode, x, y, facing, scale, variation and skin in order; positional arguments are a type error;
  - `Destructable.createZ` is removed: pass `z` to `Destructable.create`;
  - `Trigger.isRunning` is a getter, `trigger.isRunning`, no longer the method `isRunning()` of 1.0.0-alpha.0;
  - `GameCache.flushNumber` calls `FlushStoredReal`, so it flushes the real `store` wrote with a number, no longer the integer under the key;
  - `Sound.setChannel` calls `SetSoundChannel`, so it sets the channel, no longer the distance cutoff;
  - `unit.removeType` calls `UnitRemoveType`, so it removes the unit type instead of adding it.

### Patch Changes

- [#209](https://github.com/phmilk/reforged-ts/pull/209) [`7aa0ede`](https://github.com/phmilk/reforged-ts/commit/7aa0edeb5ec49bb767985ef5d42abb709281c0ce) Thanks [@phmilk](https://github.com/phmilk)! - The README's "For AI agents" line links the documentation of this version as Markdown for a language model: `llms.txt`, one link per page, and `llms-full.txt`, every page in one file. A prerelease links the working tree's docs, `https://phmilk.github.io/reforged-ts/docs/next/llms.txt`; a stable release links the docs version of its library minor, `/docs/<major.minor>/llms.txt`.
- Updated dependencies [[`7aa0ede`](https://github.com/phmilk/reforged-ts/commit/7aa0edeb5ec49bb767985ef5d42abb709281c0ce), [`f48fefd`](https://github.com/phmilk/reforged-ts/commit/f48fefdad0268131d273c64b5ccf2c07b5d1f56e)]:
  - reforged-types@1.0.0-alpha.1
  - reforged-test@1.0.0-alpha.1

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
