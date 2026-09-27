---
title: 3.0.0 systems
sidebar_position: 8
description: The game systems Patch 3.0.0 added and how the library wraps them, tiers 1 and 2 in release 1.0; written with build step 7.
---

# 3.0.0 systems

Patch 3.0.0 added 137 Natives, and release 1.0 wraps tiers 1 and 2 of them as members of the Wrappers that own them ([#8](https://github.com/phmilk/reforged-ts/issues/8), [ADR 0008](../contributing/adr/0008-wrapper-coverage-rule-and-no-bj-mirroring.md)): equipment and the extended inventory on `Unit` and `Item`, with the `EquipmentType`, `ItemTag` and `LoadoutSlot` enums; ability cooldowns as a percentage; `Destructable.create(options)` in place of the 32 destructable creation Natives; special-effect animations by name; `Trigger.interrupt()` and `isRunning()`; raw keyboard and mouse input in a static `Input`, marked as local to each client; pixel to frame unit conversions on `Frame`; the camera additions and camera blockers; thematic music on `Sound`; and pathing checks. Terrain fog, HD water, doodads and cinematics (tier 3) come in release 1.1. This guide is written with build step 7 ([#54](https://github.com/phmilk/reforged-ts/issues/54)), which adds these members; until then, reach a 3.0.0 Native through the [Typings](typings.md), passing a Wrapper's `handle` ([Handles and Wrappers](handles-and-wrappers.md#natives-the-wrapper-does-not-cover)).
