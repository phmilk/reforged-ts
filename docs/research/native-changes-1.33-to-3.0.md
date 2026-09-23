# Native API changes 1.33.0 to 3.0.0.24268 and Wrapper coverage gaps

Research ticket: [#5](https://github.com/phmilk/reforged-ts/issues/5). Facts only; the decision belongs to the ticket "Scope of new 3.0.0 systems and coverage gaps for the first release".

Vocabulary: **Native** = function/type/constant the game exposes to Lua map scripts. **Handle** = the game's opaque reference to an engine object. **Typings** = the `.d.ts` describing the Natives of one Patch. **Wrapper** = a library class owning one Handle. **System** = a library utility without a Handle. **Patch** = a released game version with build number.

## Sources

| Id | Source | Used for |
|----|--------|----------|
| S1 | `common.j` of Patch 1.33.0.19378 — [jass-history, tag `Reforged-v3.0.0.24277-w3t-e38e03b`, path `war3extract/Reforged-v1.33.0.19378-w3-e94d62c/scripts/common.j`](https://github.com/Luashine/jass-history/blob/Reforged-v3.0.0.24277-w3t-e38e03b/war3extract/Reforged-v1.33.0.19378-w3-e94d62c/scripts/common.j) | Baseline Natives (4,223 lines) |
| S2 | `common.j` of Patch 3.0.0.24268 — [same tag, path `war3extract/Reforged-v3.0.0.24268-w3-3a9d8f2/scripts/common.j`](https://github.com/Luashine/jass-history/blob/Reforged-v3.0.0.24277-w3t-e38e03b/war3extract/Reforged-v3.0.0.24268-w3-3a9d8f2/scripts/common.j) | Target Natives (4,442 lines) |
| S3 | `common.j` of Patch 3.0.0.24277 (PTR) — [same tag, path `war3extract/Reforged-v3.0.0.24277-w3t-e38e03b/scripts/common.j`](https://github.com/Luashine/jass-history/blob/Reforged-v3.0.0.24277-w3t-e38e03b/war3extract/Reforged-v3.0.0.24277-w3t-e38e03b/scripts/common.j) | Post-target check (4,443 lines) |
| S4 | `blizzard.j` of 1.33.0.19378 and 3.0.0.24268, same tag and folders as S1/S2 (`scripts/blizzard.j`; 10,811 and 11,383 lines) | BJ function changes |
| S5 | Intermediate `common.j`: [1.36.1.20719](https://github.com/Luashine/jass-history/blob/Reforged-v3.0.0.24277-w3t-e38e03b/war3extract/Reforged-v1.36.1.20719-w3-51d40ee/scripts/common.j), [2.0.2.22692](https://github.com/Luashine/jass-history/blob/Reforged-v3.0.0.24277-w3t-e38e03b/war3extract/Reforged-v2.0.2.22692-w3t/scripts/common.j), [2.0.4.23745](https://github.com/Luashine/jass-history/blob/Reforged-v3.0.0.24277-w3t-e38e03b/war3extract/Reforged-v2.0.4.23745-w3-9a94ff7/scripts/common.j) | Attribution of each change to a Patch |
| S6 | [lep/jassdoc PR #236 "Update to Reforged v3.0.0"](https://github.com/lep/jassdoc/pull/236) (merged 2026-09-13), [raw diff](https://patch-diff.githubusercontent.com/raw/lep/jassdoc/pull/236.diff), 2,580 lines | Annotated 3.0.0 diff, `@note` on changed enum values, `framehandle` bug note |
| S7 | [lep/jassdoc PR #239 "extra-jass: add RequestExtra natives removed in 2.0.0/2.0.2"](https://github.com/lep/jassdoc/pull/239) (merged 2026-09-17), [raw diff](https://patch-diff.githubusercontent.com/raw/lep/jassdoc/pull/239.diff) | The 2.0.x removal |
| S8 | [`war3-types-strict` 0.1.3](https://www.npmjs.com/package/war3-types-strict), file `1.33.0/common.j.d.ts` (4,923 lines), source [TinkerWorX/war3-types-strict](https://github.com/TinkerWorX/war3-types-strict); this repo's `package.json` pins `"war3-types-strict": "^0.1.3"` and `tsconfig.json` includes `war3-types-strict/1.33.0` | The Typings the library compiles against |
| S9 | This repo at commit `831ab74`: `handles/*.ts`, `system/*.ts`, `globals/*.ts`, `hooks/*.ts` (8,171 lines) | Which Natives each Wrapper/System calls |

## Method

1. Extracted every `native`, `type … extends …`, `constant <type> <NAME> = …` line from S1, S2, S3, S5 and every `function … takes … returns …` line from S4, normalised whitespace, and compared by name and by full signature (script kept outside the repo).
2. For each file in S9, collected every `Identifier(` call whose identifier is a Native name in S1 or S2, or a Blizzard.j function name in S4, and intersected it with the changed sets.
3. Cross-checked S8 against S1: the Typings declare 1,547 functions; every one exists in S1; the only S1 Native missing from the Typings is `StartSoundEx`; none of the 3.0.0-added Natives is present in the Typings.

## 1. Headline numbers (S1 vs S2)

| What | 1.33.0.19378 | 3.0.0.24268 | Delta |
|------|--------------|-------------|-------|
| Natives | 1,548 | 1,681 | +137 added, −4 removed, **0 signature changes** among the 1,544 shared names |
| Types (`type X extends Y`) | 134 | 139 | +5 added (all `extends handle`), **1 changed**: `framehandle extends handle` → `framehandle extends agent` |
| Constants | 1,686 | 1,738 | +52 added, 0 removed, **2 values changed** (`ITEM_TYPE_UNKNOWN` 7→8, `ITEM_TYPE_ANY` 8→9) |
| Blizzard.j functions (S4) | 985 | 1,056 | +71 added, 0 removed, 0 signature changes, 5 bodies changed |

Patch 3.0.0.24277 (S3) differs from 24268 by exactly one line: `native BlzPlayThematicMusicWithAbsoluteVolume takes string musicFileName, integer absoluteVolume returns nothing` (S3 line 3882). `blizzard.j` is identical between 24268 and 24277.

### 1.1 Attribution to intermediate Patches (S5)

| Range | Native names | Constants | Types |
|-------|--------------|-----------|-------|
| 1.33.0.19378 → 1.36.1.20719 | no change | no change | no change |
| 1.36.1.20719 → 2.0.2.22692 | −4: `RequestExtraBooleanData`, `RequestExtraIntegerData`, `RequestExtraRealData`, `RequestExtraStringData` (S7: "Removed from common.j after Reforged v1.36.1.20719-w3, missing in v2.0.2.22692-w3t") | no change | no change |
| 2.0.2.22692 → 2.0.4.23745 | no change | +1: `constant unitrealfield UNIT_RF_FLY_MAX_HEIGHT = ConvertUnitRealField('ufmh')` | no change |
| 2.0.4.23745 → 3.0.0.24268 | +137 (full list in §4) | +51, 2 values changed | +5, `framehandle` re-parented |

### 1.2 The four removed Natives

`RequestExtra{Integer,Boolean,String,Real}Data takes integer dataType, player whichPlayer, string param1, string param2, boolean param3, integer param4, integer param5, integer param6` (S7). **No file in S9 calls any of them** (method step 2 found no hit).

### 1.3 The two changed constant values (S2 lines 940–942, S6)

```
constant itemtype ITEM_TYPE_EQUIPMENT = ConvertItemType(7)   // new
constant itemtype ITEM_TYPE_UNKNOWN   = ConvertItemType(8)   // was 7
constant itemtype ITEM_TYPE_ANY       = ConvertItemType(9)   // was 8
```

S6 annotates both with `@note Enum changed from 7 to 8 in v3.0.0.24268` / `from 8 to 9`. At runtime the Lua globals `ITEM_TYPE_UNKNOWN`/`ITEM_TYPE_ANY` are defined by the game's own `common.j`, so code that compares against the named constant follows the running Patch; only code that hard-codes `ConvertItemType(7)`/`(8)` or the raw integers breaks. **No file in S9 calls any `Convert*` Native** (grep `Convert[A-Z]\w*\(` over `handles system globals hooks` returns nothing).

### 1.4 The one Handle-hierarchy change (S2 line 102, S6)

`type framehandle extends handle` → `type framehandle extends agent`. S6 changes the jassdoc comment from `@bug wrong type, should be extends agent instead.` to `@bug (Fixed in v3.0.0.24268) …`. The 1.33.0 Typings (S8 line 115) declare `interface framehandle extends handle`, so under the current Typings a `framehandle` is not assignable to `agent`; under 3.0.0 it is. No Native signature changed because of it.

### 1.5 Blizzard.j (S4)

- 5 function bodies changed: `CustomDefeatDialogBJ`, `MeleeStartingHeroLimit`, `SetCampaignAvailableBJ`, `SetCampaignMenuRaceBJ`, `SetCinematicAvailableBJ`. None is called by S9.
- The 3 Blizzard.j functions S9 calls (`GetForceOfPlayer` in `handles/force.ts`, `TriggerRegisterAnyUnitEventBJ` and `TriggerRegisterPlayerMouseEventBJ` in `handles/trigger.ts`) are byte-identical between 1.33.0 and 3.0.0.
- New `bj_` globals relevant to the coverage gaps: `bj_MAX_EXTENDED_INVENTORY = 30`, `bj_MAX_EQUIPMENT_INVENTORY = 9`, `bj_KEYEVENTKEY_A = 4`, `bj_lastEquippedItem`, `bj_lastUnequippedItem`, `bj_HeroGlowAllUnitsFlag`, `bj_enableAurasAllUnits`, `bj_affectsUIAurasAllUnits`, `bj_destroyEffectAsyncEffect`, `bj_destroyEffectAsyncTime`, `bj_wantDestroyGroup` (used by new `SetWantDestroyGroupBJ`/`ClearWantDestroyGroupBJ`/`GetWantDestroyGroupBJ`).

### 1.6 Typings availability (S8)

npm lists exactly two versions of `war3-types-strict`: 0.1.2 and 0.1.3, both published 2023-02-05. The package ships `1.29.2`, `1.32.10`, `1.33.0` folders only. No 3.0.0 Typings exist under this package.

## 2. Per-file breakage table (S9 vs S1/S2)

"Natives used" is the count of distinct Native names each file calls (method step 2). "Change" lists every Native, type or constant the file touches that differs between 1.33.0 and 3.0.0.24268. Files with no row in the "Change" column call only Natives whose signature is identical in S1 and S2.

| File | Natives used | Native / type / constant | What changed (1.33.0 → 3.0.0.24268) | Impact on the Wrapper |
|------|--------------|--------------------------|--------------------------------------|-----------------------|
| `handles/frame.ts` | 51 | `framehandle` type | Re-parented `handle` → `agent` (S2 line 102; S6) | `Frame extends Handle<framehandle>` (line 37). Compiles unchanged; under 1.33.0 Typings `framehandle` stays non-assignable to `agent`. No Native called by the file changed. |
| `handles/item.ts` | 55 | `ITEM_TYPE_UNKNOWN`, `ITEM_TYPE_ANY` | Values 7→8, 8→9; `ITEM_TYPE_EQUIPMENT = 7` inserted (S2 lines 940–942) | `Item.type` (line 151) returns `GetItemType(this.handle)` and does not compare integers; no `Convert*` calls anywhere in S9. Runtime-neutral. `Item.fromEvent` (line 316) reads `GetManipulatedItem()` only; the new `GetEquippedItem`/`GetUnequippedItem` event accessors are not reachable through it. |
| `handles/player.ts` | 59 | `playercolor`, `racepreference` constants | `PLAYER_COLOR_BLACK = ConvertPlayerColor(24)` added (24 → 25 colours); `RACE_PREF_FORSAKEN = ConvertRacePref(128)` added (S2 lines 293, 466) | `color` setter (line 36) and `isRacePrefSet` (line 228) take the opaque Handle types; new constants pass through. No colour-index tables in the file. `SetPlayerRaceSkin` (new) has no method. |
| `handles/camera.ts` | 61 | `camerafield` constants | `CAMERA_FIELD_DEPTH_OF_FIELD_DISTANCE (11)`, `_SCALE (12)`, `CAMERA_FIELD_ZABSOLUTE (13)` added (S2 line 1007 region) | `SetCameraField`/`GetCameraField`/`CameraSetupSetField`/`CameraSetupGetField` are called with a `camerafield` argument, so new fields pass through. 8 camera and 8 cinematic/lighting Natives (§3.6, §3.10) have no method. |
| `handles/trigger.ts` | 50 (+2 BJ) | `METAKEY_*` integer constants; `metakeytype` type | `METAKEY_NONE/SHIFT/CTRL/ALT/WINKEYS = 0/1/2/4/8` added; `type metakeytype extends handle` added but no Native takes it (`BlzIsMetaKeyPressed takes integer metakey`) | `registerPlayerKeyEvent` (line 252) already takes `metaKey: number`; unchanged. `BlzTriggerIsRunning`/`BlzTriggerInterrupt` (§3.11) have no method. |
| `handles/unit.ts` | 236 | `UNIT_RF_FLY_MAX_HEIGHT`, `UNIT_BF_SHOW_AIR_TO_GROUND`, `UNIT_BF_FORCE_DISPLAY_HP` | Field constants added (first at 2.0.4, other two at 3.0.0) | Reachable through the existing generic `BlzGetUnitRealField`/`BlzSetUnitBooleanField` calls. All 236 Natives the file calls are signature-identical. 35 new unit-related Natives (§3.1, §3.2, §3.12) have no method. |
| `handles/destructable.ts` | 24 | — | none of the 24 changed | 24 creation variants + 2 colour setters (§3.5) have no method; `create`/`createZ` (line 51 ff.) choose between `CreateDestructable[Z]` and `BlzCreateDestructable[Z]WithSkin` only. |
| `handles/effect.ts` | 32 | — | none changed | 3 animation Natives (§3.9) have no method. |
| `handles/fogmodifier.ts` | 5 | — | none changed | Wraps vision fog (`fogmodifier`); terrain fog (§3.3) is a different Native family with no Wrapper before or after 3.0.0. |
| `handles/sound.ts` | 28 | — | none changed | `BlzPauseThematicMusicOnFocusLost` (24268) and `BlzPlayThematicMusicWithAbsoluteVolume` (24277 only) have no method. Pre-existing gap: `StartSoundEx` is in S1 but absent from S8. |
| `handles/group.ts` | 33 | — | none changed | Blizzard.j adds `bj_wantDestroyGroup` helpers; not Natives, not called. |
| `handles/rect.ts` | 17 | — | none changed | New `EnableCameraBlocker`/`AddCameraBlocker` take a `rect` (§3.6). |
| `handles/force.ts` | 12 (+1 BJ) | — | none changed; `GetForceOfPlayer` body identical | — |
| `handles/dialog.ts` 9, `gamecache.ts` 27, `image.ts` 10, `leaderboard.ts` 27, `multiboard.ts` 27, `point.ts` 6, `quest.ts` 21, `region.ts` 12, `texttag.ts` 15, `timer.ts` 9, `timerdialog.ts` 9, `ubersplat.ts` 7, `weathereffect.ts` 3, `widget.ts` 5, `handle.ts` 1 (`GetHandleId`) | as listed | — | none changed; no 3.0.0 Native in these domains |
| `system/file.ts` | 7 (`Preload`, `PreloadGenClear/End/Start`, `Preloader`, `BlzGetAbilityIcon`, `BlzSetAbilityIcon`) | — | none changed | — |
| `system/sync.ts` | 3 (`BlzSendSyncData`, `BlzGetTriggerSyncData`, `BlzGetTriggerSyncPrefix`) | — | none changed | — |
| `system/host.ts`, `gametime.ts`, `base64.ts`, `binaryreader.ts`, `binarywriter.ts`, `system/index.ts` | 0 | — | — | no Natives called |
| `globals/index.ts` | 1 (`Player`) | — | none changed | — |
| `globals/order.ts` | 0 | — | — | order-id table only |
| `hooks/index.ts` | 0 | — | — | reassigns Lua `main`/`config`; no Natives |

Summary: **no file in S9 calls a Native whose signature changed, and no file calls a removed Native.** The only compile-relevant differences are type-level (`framehandle` parent, new opaque types and constants absent from the 1.33.0 Typings).

## 3. Coverage-gap table (3.0.0.24268 Natives with no Wrapper), grouped as the ticket asks

Every Native below is absent from S1 and S8 and present in S2, unless marked otherwise. "Existing partial coverage" names the S9 members in the same domain.

### 3.1 Equipment/bag and extended inventory (23 Natives, 3 types, 30 constants, 4 events)

| Kind | Names (S2) |
|------|------------|
| Types | `equipmentType`, `itemTag`, `loadoutslot` (all `extends handle`; note capital T in `equipmentType`, S6 PR body) |
| Converters | `ConvertEquipmentType`, `ConvertItemTag`, `ConvertLoadoutSlot` |
| Event accessors | `GetEquippedItem`, `GetUnequippedItem` (both `takes nothing returns item`) |
| Item queries | `IsItemEquipped`, `IsItemInBag`, `GetItemEquipmentType`, `GetItemTag`, `SetItemColor takes item, playercolor` |
| Unit operations | `UnitEquipItem takes unit, item returns boolean`, `UnitUnequipItem`, `UnitUnequipItemFromSlot takes unit, loadoutslot returns item`, `UnitHasItemBagged`, `UnitExtendedInventorySize`, `UnitItemInBagSlot takes unit, integer`, `UnitItemInEquipmentSlot takes unit, loadoutslot`, `UnitHasItemEquipped`, `UnitHasLoadoutSlotEmpty`, `UnitHasAnyItemEquiped` (sic), `UnitHasItemEquipmentOfType`, `UnitCanEquipItemOfEquipmentType` |
| Random item | `ChooseRandomItemExWithFilter takes itemtype, integer level, equipmentType, itemTag returns integer` |
| Constants | `ITEM_TYPE_EQUIPMENT (7)`; `EQUIPMENT_TYPE_NONE/HEAD/CHEST/GLOVES/BOOTS/RING/PRIMARY/OFFHAND/TRINKET/ANY (0–9)`; `ITEMTAG_TYPE_UNDEFINED/DROPPABLE/QUESTREWARD/BOSSDROP/SECRET/PUZZLE/WORLD/SHOP/ANY (0–8)`; `EQUIPMENT_LOADOUT_SLOT_HEAD/CHEST/GLOVES/BOOTS/RING/RINGALT/PRIMARY/OFFHAND/TRINKET (0–8)` |
| Events | `EVENT_PLAYER_UNIT_EQUIP_ITEM (321)`, `EVENT_PLAYER_UNIT_UNEQUIP_ITEM (323)`, `EVENT_UNIT_EQUIP_ITEM (320)`, `EVENT_UNIT_UNEQUIP_ITEM (322)` |
| Blizzard.j | `bj_MAX_EXTENDED_INVENTORY = 30`, `bj_MAX_EQUIPMENT_INVENTORY = 9`, 21 helpers (`UnitEquipItemSwapped`, `GetLastEquippedItem`, `UnitItemInBagSlotBJ`, `UnitExtendedInventoryCount`, `UnitEquipmentCount`, …) |

Existing partial coverage (S9): `Unit.inventorySize` (`UnitInventorySize`), `Unit.getItemInSlot` (`UnitItemInSlot`), `Unit.addItem/addItemById/addItemToSlotById`, `Unit.dropItem/dropItemFromSlot/dropItemTarget`, `Unit.hasItem`, `Unit.removeItem/removeItemFromSlot`, `Unit.useItem/useItemAt/useItemTarget` (`handles/unit.ts` lines 203, 543–555, 709–717, 823, 856, 1160–1173, 1457–1465); `Item.type`, `Item.typeId`, `Item.fromEvent` (`GetManipulatedItem`); `Trigger.registerAnyUnitEvent/registerPlayerUnitEvent/registerUnitEvent` accept any `playerunitevent`/`unitevent`, so the four new events can already be registered, but no accessor returns the equipped item.

### 3.2 Ability cooldowns (5 Natives)

`BlzGetUnitAbilityCooldownPercent takes unit, integer abilId returns real`, `BlzSetUnitAbilityCooldownRemaining takes unit, integer abilId, real duration`, `BlzSetUnitAbilityCooldownPercent takes unit, integer abilId, real percent`, `BlzAdjustUnitAbilityCooldownRemaining`, `BlzAdjustUnitAbilityCooldownPercent`.

Existing partial coverage: `Unit.getAbilityCooldown` (`BlzGetUnitAbilityCooldown`, line 736), `getAbilityCooldownRemaining` (line 740), `setAbilityCooldown` (line 1212), `startAbilityCooldown` (line 1441), `endAbilityCooldown` (line 724), `resetCooldown` (`UnitResetCooldown`, line 1185), `getAttackCooldown`/`setAttackCooldown`/`setUnitAttackCooldown` (lines 760, 1240, 1397). Related new attack Native without method: `BlzResetUnitAttack takes unit, integer weaponIndex`.

### 3.3 Fog and HD water (13 + 12 Natives, 1 type, 6 constants)

Terrain fog: type `fogstyle`; `ConvertFogStyle`; `FOG_STYLE_LINEAR/EXP/EXP2/HEIGHT/NEW_EXP/NEW_EXP_2 (0–5)`; `SetTerrainFogExV takes integer style, real zstart, real zend, real density, real heightStart, real heightEnd, real linearStart, real linearEnd, real red, real green, real blue`; `BlzSetTerrainFogStyle takes fogstyle`; `BlzSetTerrainFogZStart`, `ZEnd`, `Density`, `HeightStart`, `HeightEnd`, `LinearStart`, `LinearEnd`, `MaxLinearDensity` (each `takes real`); `BlzSetTerrainFogDrawOverSky takes boolean`; `BlzSetTerrainFogColor takes real red, real green, real blue`.

HD water: `SetHDWaterParams takes integer red, integer green, integer blue, boolean useColor, integer vertexDisplacement, integer minOpacity, integer maxOpacity, integer reflectivity, integer emissivity, integer edgeSoftness, integer waveStrength`; `SetHDWaterParamsEx` (same plus `integer envMapStrength`, `boolean override`); `BlzSetHDWaterColor takes integer r, g, b`; `BlzSetHDWaterColorOverride takes boolean`; `BlzSetHDWaterVertexDisplacement`, `MinOpacity`, `MaxOpacity`, `Reflectivity`, `Emissivity`, `EdgeSoftness`, `WaveStrength`, `EnvMapStrength` (each `takes integer`).

Existing partial coverage: none. `FogModifier` (`handles/fogmodifier.ts`) wraps `fogmodifier` vision Handles only. The 1.33.0 terrain-fog Natives `SetTerrainFog`/`SetTerrainFogEx` (S1) also have no Wrapper.

### 3.4 Doodads (17 Natives)

`BlzSetSingleDoodadAnimation takes integer index, string animName, boolean animRandom`; `SetDoodadColor takes real x, real y, real radius, integer doodadID, boolean nearestOnly, playercolor`; `SetDoodadColorRect takes rect, integer doodadID, playercolor`; `BlzSetSingleDoodadColor takes integer index, playercolor`; `BlzGetDoodadX/Y/Z`, `BlzGetDoodadScaleX/Y/Z`, `BlzGetDoodadYaw/Pitch/Roll` (each `takes integer index returns real`); `BlzGetDoodadIsUsingModelAxes takes integer index returns boolean`; `BlzGetDoodadVariation`, `BlzGetDoodadId` (`returns integer`); `BlzGetNumDoodads takes nothing returns integer`.

Existing partial coverage: none. Doodads have no Handle type; the 1.33.0 `SetDoodadAnimation`/`SetDoodadAnimationRect` (S1) also have no Wrapper.

### 3.5 Destructable creation variants (26 Natives)

24 constructors, all `returns destructable`, formed from the base `BlzCreate{,Dead}Destructable{,Z}` with suffixes: `PitchRoll` (adds `real roll, real pitch`), `WithSkinPitchRoll` (adds `integer skinId`), `WithColor` (adds `playercolor color`), `WithSkinColor`, `PitchRollWithColor`, `WithSkinPitchRollColor`. Full names: `BlzCreateDestructablePitchRoll`, `BlzCreateDestructableZPitchRoll`, `BlzCreateDeadDestructablePitchRoll`, `BlzCreateDeadDestructableZPitchRoll`, `BlzCreateDestructableWithSkinPitchRoll`, `BlzCreateDestructableZWithSkinPitchRoll`, `BlzCreateDeadDestructableWithSkinPitchRoll`, `BlzCreateDeadDestructableZWithSkinPitchRoll`, `BlzCreateDestructableWithColor`, `BlzCreateDestructableZWithColor`, `BlzCreateDeadDestructableWithColor`, `BlzCreateDeadDestructableZWithColor`, `BlzCreateDestructableWithSkinColor`, `BlzCreateDestructableZWithSkinColor`, `BlzCreateDeadDestructableWithSkinColor`, `BlzCreateDeadDestructableZWithSkinColor`, `BlzCreateDestructablePitchRollWithColor`, `BlzCreateDestructableZPitchRollWithColor`, `BlzCreateDeadDestructablePitchRollWithColor`, `BlzCreateDeadDestructableZPitchRollWithColor`, `BlzCreateDestructableWithSkinPitchRollColor`, `BlzCreateDestructableZWithSkinPitchRollColor`, `BlzCreateDeadDestructableWithSkinPitchRollColor`, `BlzCreateDeadDestructableZWithSkinPitchRollColor`. Plus `SetDestructableColor takes destructable, playercolor` and `SetDestructableVertexColor takes destructable, integer red, green, blue, alpha`.

Existing partial coverage: `Destructable.create` / `Destructable.createZ` call `CreateDestructable`, `CreateDestructableZ`, `BlzCreateDestructableWithSkin`, `BlzCreateDestructableZWithSkin` (`handles/destructable.ts` lines 51 ff.). The 1.33.0 `CreateDeadDestructable[Z]`/`BlzCreateDeadDestructable[Z]WithSkin` (S1) also have no method.

### 3.6 Camera (8 Natives, 3 constants)

`SetCameraFieldControlledByInput takes camerafield, boolean`, `GetCameraFieldControlledByInput takes camerafield returns boolean`, `BlzCameraSetCameraType takes integer`, `BlzCameraGetCameraType returns integer`, `BlzCameraSetupSetCameraType takes camerasetup, integer`, `BlzCameraSetupGetCameraType takes camerasetup returns integer`, `EnableCameraBlocker takes rect, boolean`, `AddCameraBlocker takes rect`. Constants `CAMERA_FIELD_DEPTH_OF_FIELD_DISTANCE (11)`, `CAMERA_FIELD_DEPTH_OF_FIELD_SCALE (12)`, `CAMERA_FIELD_ZABSOLUTE (13)`. Blizzard.j: `SetCameraFieldControlledByInputForPlayer`, `SetCameraBlockerForPlayerBJ`.

Existing partial coverage: static `Camera` class (61 Natives) and `CameraSetup extends Handle<camerasetup>` (`handles/camera.ts` line 321); the field getters/setters take any `camerafield`.

### 3.7 Raw keyboard/mouse input (5 Natives, 5 constants, 1 type)

`BlzIsMetaKeyPressed takes integer metakey returns boolean`, `BlzIsKeyPressed takes oskeytype returns boolean`, `BlzIsMouseButtonPressed takes mousebuttontype returns boolean`, `BlzGetMouseScreenPosX`/`Y takes nothing returns integer`. Constants `METAKEY_NONE 0`, `METAKEY_SHIFT 1`, `METAKEY_CTRL 2`, `METAKEY_ALT 4`, `METAKEY_WINKEYS 8` (plain integers). Type `metakeytype extends handle` is declared but no Native takes or returns it. Blizzard.j: `IsMouseButtonPressedBJ`, `IsMetaKeyPressedBJ`, `IsKeyPressedBJ`, `bj_KEYEVENTKEY_A = 4`.

Existing partial coverage: event-based only — `Trigger.registerPlayerKeyEvent` (`BlzTriggerRegisterPlayerKeyEvent`, line 252) and `Trigger.registerPlayerMouseEvent` (`TriggerRegisterPlayerMouseEventBJ`, line 268).

### 3.8 Frame additions (5 Natives, 1 type change)

`BlzTextAreaFrameSetAutoScroll takes framehandle, boolean`, `BlzPixelToFrameX/Y takes integer returns real`, `BlzFrameToPixelX/Y takes real returns integer`. Type change `framehandle extends agent` (§1.4).

Existing partial coverage: `Frame` (51 Natives, `handles/frame.ts`).

### 3.9 Special effects (3 Natives)

`BlzSetSpecialEffectAnimationBlendTime takes effect, real blendTime`, `BlzQueueSpecialEffectAnimation takes effect, string whichAnimation`, `BlzSetSpecialEffectAnimation takes effect, string whichAnimation`. Blizzard.j: `DestroyEffectAfterTimeBJ`, `DestroyEffectAsyncBJ`.

Existing partial coverage: `Effect` (32 Natives) — `playAnimation` (`BlzPlaySpecialEffect`, line 233), `playWithTimeScale`, `addSubAnimation`/`removeSubAnimation`/`clearSubAnimations`.

### 3.10 Cinematics and lighting (8 Natives)

`BlzPreloadModelCinematicGame takes string modelName returns boolean`, `BlzGetModelCinematicGameShotCount returns integer`, `BlzGetModelCinematicGameCurrentShot returns integer`, `BlzGetModelCinematicGameRemainingTime returns real`, `BlzPlayModelCinematicGameAtPosition takes string modelName, real posX, real posY, real posZ, real RotZ`, `BlzSetCinematicEnabledDE takes boolean`; `BlzSetMinShadowCastingPointLightCount takes integer`, `BlzGetMinShadowCastingPointLightCount returns integer`.

Existing partial coverage: `Camera.SetCinematicScene` (line 240), `setCinematicAudio` (`SetCinematicAudio`), `setCinematicCamera` (`SetCinematicCamera`), `EndCinematicScene`, `ForceCinematicSubtitles`, cine-filter methods (`DisplayCineFilter`, `SetCineFilter*`).

### 3.11 Trigger introspection (2 Natives)

`BlzTriggerIsRunning takes trigger returns boolean`, `BlzTriggerInterrupt takes trigger`.

Existing partial coverage: `Trigger` calls `GetTriggerEvalCount`, `GetTriggerExecCount`, `IsTriggerEnabled`, `IsTriggerWaitOnSleeps`, `TriggerEvaluate`, `TriggerExecute`, `TriggerExecuteWait`.

### 3.12 Remaining 3.0.0 Natives outside the ticket's groups (10 Natives, 3 constants)

| Domain | Natives | Existing partial coverage |
|--------|---------|---------------------------|
| Unit hero glow | `AllowHeroGlowOnUnit`, `DisallowHeroGlowOnUnit`, `HeroGlowIsAllowedOnUnit` (each `takes unit`) | `Unit.showTeamGlow` (`BlzShowUnitTeamGlow`) |
| Unit animation | `BlzGetUnitAnimationDuration takes unit, string`, `BlzGetUnitAnimationDurationByIndex takes unit, integer` (`returns real`) | `Unit.setAnimation` (string or index, line 1228), `setAnimationWithRarity`, `queueAnimation` |
| Unit auras/attack | `BlzUnitEnableAuras takes unit, boolean enable, boolean affectsUI`; `BlzResetUnitAttack takes unit, integer weaponIndex` | none / attack-cooldown methods (§3.2) |
| Unit fields | `UNIT_RF_FLY_MAX_HEIGHT ('ufmh')` (since 2.0.4), `UNIT_BF_SHOW_AIR_TO_GROUND ('uatg')`, `UNIT_BF_FORCE_DISPLAY_HP ('ufhp')` | `Unit.getField`/`setField` generic accessors |
| Player | `SetPlayerRaceSkin takes player, racepreference`; `PLAYER_COLOR_BLACK (24)`; `RACE_PREF_FORSAKEN (128)` | `MapPlayer.color`, `isRacePrefSet` |
| Terrain | `BlzIsTerrainPathableEx takes real x, real y, pathingtype returns boolean` | none (`IsTerrainPathable` from 1.33.0 also unwrapped) |
| Sound | `BlzPauseThematicMusicOnFocusLost takes boolean`; 24277 only: `BlzPlayThematicMusicWithAbsoluteVolume takes string, integer` | `Sound` (28 Natives); thematic music Natives unwrapped since 1.33.0 |

Count check: 23 + 5 + 13 + 12 + 17 + 26 + 8 + 5 + 5 + 3 + 8 + 2 + 10 = 137, matching §1.

## 4. Full list of the 137 added Natives, in `common.j` order (S2)

```
ConvertFogStyle ConvertEquipmentType ConvertItemTag ConvertLoadoutSlot SetPlayerRaceSkin
GetEquippedItem GetUnequippedItem BlzTriggerIsRunning BlzTriggerInterrupt SetDestructableColor
SetItemColor IsItemEquipped IsItemInBag GetItemEquipmentType GetItemTag
AllowHeroGlowOnUnit DisallowHeroGlowOnUnit HeroGlowIsAllowedOnUnit
BlzGetUnitAnimationDuration BlzGetUnitAnimationDurationByIndex
UnitEquipItem UnitUnequipItem UnitUnequipItemFromSlot UnitHasItemBagged UnitExtendedInventorySize
UnitItemInBagSlot UnitItemInEquipmentSlot UnitHasItemEquipped UnitHasLoadoutSlotEmpty
UnitHasAnyItemEquiped UnitHasItemEquipmentOfType UnitCanEquipItemOfEquipmentType
ChooseRandomItemExWithFilter
SetTerrainFogExV BlzSetTerrainFogStyle BlzSetTerrainFogZStart BlzSetTerrainFogZEnd
BlzSetTerrainFogDensity BlzSetTerrainFogHeightStart BlzSetTerrainFogHeightEnd
BlzSetTerrainFogLinearStart BlzSetTerrainFogLinearEnd BlzSetTerrainFogMaxLinearDensity
BlzSetTerrainFogDrawOverSky BlzSetTerrainFogColor
BlzPreloadModelCinematicGame BlzGetModelCinematicGameShotCount BlzGetModelCinematicGameCurrentShot
BlzGetModelCinematicGameRemainingTime BlzPlayModelCinematicGameAtPosition BlzSetCinematicEnabledDE
BlzSetMinShadowCastingPointLightCount BlzGetMinShadowCastingPointLightCount
SetCameraFieldControlledByInput GetCameraFieldControlledByInput BlzCameraSetCameraType
BlzCameraGetCameraType BlzCameraSetupSetCameraType BlzCameraSetupGetCameraType
EnableCameraBlocker AddCameraBlocker BlzPauseThematicMusicOnFocusLost
SetHDWaterParams SetHDWaterParamsEx BlzSetHDWaterColor BlzSetHDWaterColorOverride
BlzSetHDWaterVertexDisplacement BlzSetHDWaterMinOpacity BlzSetHDWaterMaxOpacity
BlzSetHDWaterReflectivity BlzSetHDWaterEmissivity BlzSetHDWaterEdgeSoftness
BlzSetHDWaterWaveStrength BlzSetHDWaterEnvMapStrength BlzIsTerrainPathableEx
BlzSetSingleDoodadAnimation SetDoodadColor SetDoodadColorRect BlzSetSingleDoodadColor
BlzGetDoodadX BlzGetDoodadY BlzGetDoodadZ BlzGetDoodadScaleX BlzGetDoodadScaleY BlzGetDoodadScaleZ
BlzGetDoodadIsUsingModelAxes BlzGetDoodadYaw BlzGetDoodadPitch BlzGetDoodadRoll
BlzGetDoodadVariation BlzGetDoodadId BlzGetNumDoodads
BlzResetUnitAttack BlzSetSpecialEffectAnimationBlendTime BlzQueueSpecialEffectAnimation
BlzSetSpecialEffectAnimation BlzUnitEnableAuras
BlzGetUnitAbilityCooldownPercent BlzSetUnitAbilityCooldownRemaining BlzSetUnitAbilityCooldownPercent
BlzAdjustUnitAbilityCooldownRemaining BlzAdjustUnitAbilityCooldownPercent
BlzTextAreaFrameSetAutoScroll BlzIsMetaKeyPressed BlzIsKeyPressed BlzIsMouseButtonPressed
BlzGetMouseScreenPosX BlzGetMouseScreenPosY BlzPixelToFrameX BlzPixelToFrameY
BlzFrameToPixelX BlzFrameToPixelY
BlzCreateDestructablePitchRoll BlzCreateDestructableZPitchRoll BlzCreateDeadDestructablePitchRoll
BlzCreateDeadDestructableZPitchRoll BlzCreateDestructableWithSkinPitchRoll
BlzCreateDestructableZWithSkinPitchRoll BlzCreateDeadDestructableWithSkinPitchRoll
BlzCreateDeadDestructableZWithSkinPitchRoll BlzCreateDestructableWithColor
BlzCreateDestructableZWithColor BlzCreateDeadDestructableWithColor BlzCreateDeadDestructableZWithColor
BlzCreateDestructableWithSkinColor BlzCreateDestructableZWithSkinColor
BlzCreateDeadDestructableWithSkinColor BlzCreateDeadDestructableZWithSkinColor
BlzCreateDestructablePitchRollWithColor BlzCreateDestructableZPitchRollWithColor
BlzCreateDeadDestructablePitchRollWithColor BlzCreateDeadDestructableZPitchRollWithColor
BlzCreateDestructableWithSkinPitchRollColor BlzCreateDestructableZWithSkinPitchRollColor
BlzCreateDeadDestructableWithSkinPitchRollColor BlzCreateDeadDestructableZWithSkinPitchRollColor
SetDestructableVertexColor
```

Full signatures are in S2; §3 quotes the ones whose parameter lists are not obvious from the name.

## 5. What was not verified

- Runtime semantics of unchanged Natives (behaviour changes without a signature change) are outside what `common.j` diffs can show; S6 adds no `@note`/`@bug` text to any pre-existing Native other than the `framehandle` bug note and the two `ITEM_TYPE_*` enum notes.
- Patches 1.34.0, 1.35.0, 1.36.0 and 2.0.3 were not downloaded individually; the intermediate attribution in §1.1 brackets changes between the Patches that were (1.33.0.19378, 1.36.1.20719, 2.0.2.22692, 2.0.4.23745, 3.0.0.24268).
- `common.ai` was not compared.
