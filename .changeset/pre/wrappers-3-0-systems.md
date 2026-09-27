---
"reforged-ts": major
---

Wrappers for the 3.0.0 systems, and every Wrapper covers the Natives it owns: the Wrapper coverage report of ADR 0008 lists zero missing against Patch 3.0.0.24268, and `pnpm check` fails when a Native goes missing.

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
