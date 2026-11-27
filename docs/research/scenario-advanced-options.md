# The Scenario and Advanced menus: the file and the field of each option

Where each option of the World Editor's Scenario and Advanced menus is stored in a map folder, gathered for [#1047](https://github.com/phmilk/reforged-ts/issues/1047) before `reforged-map` reads or writes more of these files. Nothing here was checked at the screen: this container has no game. Each claim is marked **Observed** (read from a file the World Editor saved, by a script of this research), **Source** (stated by a parser named in [Sources](#sources), not checked against a save), or **Inferred** (follows from the above, not observed). A field that the parsers name differently is listed under each name.

## TL;DR

- **Almost every Scenario option is a field of `war3map.w3i`** (Source, all three parsers): Map Description, Map Options, the camera bounds, the loading and prologue screens, the players, the forces, the tech tree, ability and upgrade availability, the random groups and the item tables. The World Editor turns most of them into the `config` and `main` it generates in `war3map.lua` or `war3map.j` (Observed for the calls below).
- **The Advanced menu's two editors have a text file each** (Source and Observed): Gameplay Constants is `war3mapMisc.txt`, `[Misc]`; Game Interface is `war3mapSkin.txt`, `[CustomSkin]`, `[Errors]` and `[FrameDef]`. A third, `war3mapExtra.txt`, `[MapExtraInfo]`, holds the fixed time of day, the sky and the JassHelper switches. None of the eight map folders in this repository has any of the three (Observed): the editor writes them only when an option leaves its default (Inferred).
- **The 3.0 World Editor writes format 39** (Observed: every fixture, both editor builds 7000 and 7003). It adds, against 33: the loading screen's crest race, a race preference per player, six fog fields, and ten HD water fields at the header's end.
- **In format 39 the global weather follows the six new fog fields** (Observed in wc3libs' 3.0 save, `VWbr` at the seventh dword after the fog colour). wc3libs and War3Net read it there; HiveWE reads it before them, a misreading of every format-39 map with a global weather.
- **Shared vision of a force is bit `0x08`** (Observed: a 2.0 save whose force flags are `0x0b` generates `SetPlayerAllianceStateVisionBJ`). War3Net reads it so; wc3libs reads bit `0x04`; HiveWE reads `0x08` and writes `0x04`.
- **The texts the author types go through `war3map.wts`** (Observed): the map's name, author, description and suggested players, each player's and force's name, the loading screen's text, title and subtitle, and in `war3mapSkin.txt` the `[Errors]` and `[FrameDef]` texts are `TRIGSTR_nnn`. A new map that never had them edited keeps the literal text in `war3map.w3i` (Observed, `editor-locales.w3m`).
- **A new 3.0.1 map stores the Game Data Set as -1** (Observed, `editor-locales.w3m`): War3Net names it Unset. `reforged-map` knows only 0 to 2, so it reports that map's Game data set as unknown.
- **`reforged-map` today reads, of all this, the Game Data Set, the melee flag, the Game Data Version and the Supported Modes of `war3map.w3i`**, keeps `war3map.wts` losslessly and writes it for Object data, and rewrites the locale tables' entries of `war3map.imp`. It reads no `war3mapMisc.txt`, `war3mapSkin.txt`, `war3mapExtra.txt` or `war3map.wct`.

## Sources

- **HiveWE** (AGPL-3.0, read for facts only), `main` at `8c3d323f3b54b36b32b0289d4a7641daed68e01a` (2026-11-17): `src/base/map_info.ixx` (reads formats 15 to 39, writes 39), `src/base/gameplay_constants.ixx`, `src/base/imports.ixx`, `src/base/triggers/triggers.ixx`, `src/menus/map_info_editor/map_info_editor.ui`.
- **wc3libs** (`inwc3/wc3libs`), `master` at `da8be9e7ece80fdefa565b0020026f7f3047729a` (2026-11-17): `bin/app/W3I.java` (formats 18 to 39), `bin/app/MapFlag.java`, `bin/app/IMP.java`, `bin/app/W3GRP.java`, `txt/app/ExtraTXT.java`, `txt/app/SkinTXT.java`; its test `W3ITest.testVersion39W3I` and the two 3.0 saves it reads, `src/test/resources/wc3data/W3I/war3map_v3.w3i` and `war3map_v3_filled.w3i` (format 39, editor 7000, every option filled; provenance as wc3libs states it).
- **War3Net** (`Drake53/War3Net`), `master` at `5f6f7bac26ed7ce7d0db83ceb4fb9ce59f918ff8` (2026-10-17): `War3Net.Build.Core/Serialization/Binary/Info/*.cs`, `War3Net.Build.Core/Info/*.cs` (the enums and flags), `War3Net.Build/MapScriptBuilder/Info/*.cs` (the script it generates from the file).
- **This repository's map folders**, each saved by the World Editor: `packages/reforged-map/test/fixtures/editor-{contract,locales,objects,sync,variables}.w3m` (provenance in the `.md` beside each), `probe/probe.w3m`, and the Template's `reforged-ts-template.w3m`.
- **Two published map folders**, read at their default branch on 2026-11-27, provenance unverified: `voces/fixus`, `map.w3x/` (`war3map.w3i` format 33, editor 6117, with `war3map.lua`, `war3mapMisc.txt`, `war3mapSkin.txt`, `war3mapExtra.txt`, `war3map.imp`), and `tdauth/wowr`, `wowr.w3x/` (format 39, editor 7003, Patch 3.0.1.24371, with `war3mapMisc.txt`, `war3mapSkin.txt`, `war3mapExtra.txt`).
- **The Typings**: `packages/reforged-types/vendor/3.0.1.24370/common.j` for the race preferences and `SetHDWaterParamsEx`.
- **Not found**: a published dump of the 3.0 `WorldEditStrings.txt` or of the editor's dialogs. A GitHub code search for the file and for its `WESTRING_MENU_` keys found none. So the menu and dialog names below are the issue's and HiveWE's, not the editor's own strings.

## `war3map.w3i`, field by field

Little-endian; `cstring` is UTF-8, NUL-terminated (Source, all three). The formats: 18 Reign of Chaos, 25 The Frozen Throne, 28 Patch 1.31, 31 Patch 1.32, 32 Patch 2.0.3 PTR, 33 Patch 2.0.3, 39 Patch 3.0.0 (Source, War3Net's `MapInfoFormatVersion`). Format 18 lays the loading and prologue screens out differently (Source, all three); the table follows 25 and later. "wts" says whether the World Editor writes the field as a `TRIGSTR_nnn` reference to `war3map.wts`.

| #   | Field                                                         | Type               | Formats  | wts                  | Dialog                     |
| --- | ------------------------------------------------------------- | ------------------ | -------- | -------------------- | -------------------------- |
| 1   | Format                                                        | int32              | all      | no                   | none: 39 on every 3.0 save |
| 2   | Saves (HiveWE: map version)                                   | int32              | all      | no                   | Map Description, read-only |
| 3   | Editor version (7000 for 3.0.0, 7003 for 3.0.1)               | int32              | all      | no                   | Map Description, read-only |
| 4   | Game version, major, minor, patch, build                      | int32 × 4          | 28+ (1)  | no                   | none                       |
| 5   | Name, author, description, suggested players                  | cstring × 4        | all      | yes, once edited (2) | Map Description            |
| 6   | Camera bounds: left-bottom, right-top, left-top, right-bottom | float32 × 8        | all      | no                   | Map Size and Camera Bounds |
| 7   | Camera bounds complements: left, right, bottom, top           | int32 × 4          | all      | no                   | Map Size and Camera Bounds |
| 8   | Playable width, height                                        | int32 × 2          | all      | no                   | Map Size and Camera Bounds |
| 9   | Flags                                                         | int32              | all      | no                   | [below](#the-flags)        |
| 10  | Main tileset                                                  | char               | all      | no                   | none (the terrain's)       |
| 11  | Loading screen number (-1 default, else a campaign screen)    | int32              | 25+      | no                   | Map Loading Screen         |
| 12  | Loading screen crest race (3)                                 | int32              | 39       | no                   | Map Loading Screen         |
| 13  | Loading screen model (an imported file's path)                | cstring            | 25+      | not seen filled      | Map Loading Screen         |
| 14  | Loading screen text, title, subtitle                          | cstring × 3        | all      | yes (4)              | Map Loading Screen         |
| 15  | Game Data Set: -1 unset, 0 Default, 1 Custom, 2 Melee (5)     | int32              | 25+      | no                   | Map Options                |
| 16  | Prologue screen model, text, title, subtitle                  | cstring × 4        | 25+      | not seen filled      | Prologue Screen            |
| 17  | Terrain fog type, z start, z end, density                     | int32, float32 × 3 | 25+      | no                   | Map Options                |
| 18  | Terrain fog colour                                            | ubyte × 4 (6)      | 25+      | no                   | Map Options                |
| 19  | Six fog fields (7)                                            | 4 bytes × 6        | 39       | no                   | Map Options (Inferred)     |
| 20  | Global weather, a weather id or 0                             | char[4]            | 25+      | no                   | Map Options                |
| 21  | Custom sound environment (empty: none)                        | cstring            | 25+      | no                   | Map Options                |
| 22  | Custom light environment, a tileset (0: the main tileset's)   | char               | 25+      | no                   | Map Options                |
| 23  | Water tinting colour                                          | ubyte × 4 (6)      | 25+      | no                   | Map Options                |
| 24  | Script language: 0 JASS, 1 Lua                                | int32              | 28+      | no                   | Map Options (8)            |
| 25  | Supported Modes, a mask: 1 SD, 2 HD, 4 DE                     | int32              | 31+      | no                   | Map Options                |
| 26  | Game Data Version: 0 RoC, 1 TFT, 2 Forsaken Kingdom (9)       | int32              | 31+      | no                   | Map Options                |
| 27  | Forced camera distance: default, max                          | int32 × 2          | 32+      | no                   | Map Options (8)            |
| 28  | Forced camera distance: min                                   | int32              | 33+      | no                   | Map Options (8)            |
| 29  | HD water (10)                                                 | int32 × 9          | 39       | no                   | Map Options (8)            |
| 30  | After the HD water (11)                                       | int32              | 39       | no                   | unknown                    |
| 31  | Players, count then each [below](#player-properties)          | int32, records     | all      | the name             | Player Properties          |
| 32  | Forces, count then each [below](#force-properties)            | int32, records     | all      | the name             | Force Properties           |
| 33  | Upgrade availability, count then each                         | int32, records     | all      | no                   | Upgrades                   |
| 34  | Tech availability, count then each                            | int32, records     | all      | no                   | Tech Tree, Abilities       |
| 35  | Random unit tables, count then each                           | int32, records     | all (12) | not seen filled      | Random Groups              |
| 36  | Random item tables, count then each                           | int32, records     | 25+ (12) | not seen filled      | Item Tables                |

1. War3Net reads it from format 27; HiveWE and wc3libs from 28 (Source).
2. Observed: `TRIGSTR_003`, `_006`, `_005`, `_004` in the Template's map and four fixtures, while `editor-locales.w3m`, a new map whose Map Description was never edited, holds the literal defaults `Just another Warcraft III map`, `Unknown`, `Nondescript`, `Any`, and its generated `config` passes them literally to `SetMapName`. The editor moves them to `war3map.wts` when the dialog is used (Inferred).
3. A race preference of `common.j`, 1 human to 128 Forsaken (Inferred from the values: 128 in the 3.0 fixtures and HiveWE's default, 64 in `editor-locales.w3m` and wowr, 8 in wc3libs' save). War3Net names it `RaceHud`, wc3libs `loadingScreenCrestRace`, HiveWE `loading_screen_source`.
4. Observed in wowr and in wc3libs' 3.0 save (`TRIGSTR_009`, `_007`, `_008`).
5. Observed: -1 in `editor-locales.w3m`, 2 in the other 3.0 fixtures, 0 in fixus. War3Net names -1 `Unset`, wc3libs `MAX`. Default reads Custom, or Melee with the melee flag (`docs/research/builtins-layers.md`, measured).
6. The byte order is unsettled: War3Net reads blue, green, red, alpha; wc3libs reads red, green, blue, alpha (Source). Every save seen holds black `000000ff` (fog) and `ffffffff` (water), which settles nothing.
7. Observed values in every save, the filled one included: `0, 0, 10000.0, 10000.0, 1.0, 0`. War3Net: height start, height end (float32), linear start, linear end, max opacity (float32), draw fog over sky (int32). wc3libs: fog style (int32), draw over sky (int32), linear start, linear end, max opacity, fog height (float32). The 3.0 Native `SetTerrainFogExV(style, zstart, zend, density, heightStart, heightEnd, linearStart, linearEnd, r, g, b)` has War3Net's two height fields (Inferred support for War3Net's names). HiveWE reads the weather first, then these six as `unknown_fog1`, linear start, linear end, max opacity, `unknown_fog2`, `unknown_fog3`: wc3libs' filled save holds `VWbr` in the seventh dword, so HiveWE's order is wrong (Observed).
8. The field exists in that format (Source); the dialog that sets it is not confirmed by any source here.
9. Measured in this repository (`docs/research/builtins-layers.md`). War3Net still names 2 `Unset` (Source, out of date).
10. In order: min opacity, max opacity, reflectivity, emissivity, edge softness, waves vertex displacement, waves normal map strength, override colour, env map reflectivity (Source, all three agree). Observed: the generated `main` of the 3.0 fixtures calls `SetHDWaterParamsEx(0, 0, 0, false, 20, 0, 100, 10, 0, 50, 100, 100)` from the file's `0, 100, 10, 0, 50, 20, 100, 0, 100`, the override flag (`0x800000`) giving `false`. wc3libs notes that the 3.0 editor shows emissivity 10 where it stores 0.
11. -1 in every save seen. War3Net: the alpha tile minimap colour (ubyte × 4), which flag `0x1000000` switches (Inferred); wc3libs and HiveWE: unknown.
12. A single byte `0xFF` after the forces ends the file early (Source, wc3libs and War3Net), as some protected maps have it; every save seen ends with the four counts at 0.

The format-39 layout from field 11 to 30 is `reforged-map`'s too (`packages/reforged-map/src/war3map-w3i.ts`), which skips fields 19 and 20 as a block: its comment names field 19 as wc3libs does.

### The flags

Field 9, by bit (Source: the three agree on every bit; names from War3Net). The dialog column is the option's likely home, unconfirmed by the editor's strings.

| Bit         | Meaning                                                | Dialog (unconfirmed)     |
| ----------- | ------------------------------------------------------ | ------------------------ |
| `0x0001`    | Hide minimap in preview screens                        | Map Options              |
| `0x0002`    | Modify ally priorities                                 | Player Properties        |
| `0x0004`    | Melee map                                              | Map Options              |
| `0x0008`    | Playable map size was large (never set by an option)   | none                     |
| `0x0010`    | Masked areas are partially visible                     | Map Options              |
| `0x0020`    | Fixed player settings for custom forces                | Force Properties         |
| `0x0040`    | Use custom forces                                      | Force Properties         |
| `0x0080`    | Use custom tech tree                                   | Tech Tree                |
| `0x0100`    | Use custom abilities                                   | Abilities                |
| `0x0200`    | Use custom upgrades                                    | Upgrades                 |
| `0x0400`    | The map properties dialog has been opened              | none                     |
| `0x0800`    | Show water waves on cliff shores                       | Map Options              |
| `0x1000`    | Show water waves on rolling shores                     | Map Options              |
| `0x2000`    | Use terrain fog                                        | Map Options              |
| `0x4000`    | Requires expansion                                     | none seen                |
| `0x8000`    | Use item classification system                         | Map Options              |
| `0x10000`   | Use water tinting colour                               | Map Options              |
| `0x20000`   | Use accurate probability for calculations              | Map Options              |
| `0x40000`   | Use custom ability skins                               | Abilities or Map Options |
| `0x80000`   | Disable deny icon                                      | Map Options              |
| `0x100000`  | Force default camera zoom (field 27)                   | Map Options              |
| `0x200000`  | Force max camera zoom (field 27)                       | Map Options              |
| `0x400000`  | Force min camera zoom (field 28)                       | Map Options              |
| `0x800000`  | Override the HD water colour (field 29)                | Map Options              |
| `0x1000000` | Alpha tile default minimap colour (field 30, Inferred) | Map Options              |
| `0x2000000` | Dynamic minimap                                        | Map Options              |

Observed: `0x9c10` in the Template's map, `probe.w3m`, `editor-variables.w3m` and `editor-locales.w3m`; `0xdc10` (the same with `0x4000`) in `editor-contract`, `editor-objects` and `editor-sync`; `0x3fefc70` in wc3libs' filled save.

## Scenario

### Map Description

Fields 5 (Observed TRIGSTR, note 2), with 2 and 3 shown. Generated (Observed): `config` calls `SetMapName` and `SetMapDescription` with the field's value, `TRIGSTR_nnn` or literal. Author and suggested players reach no generated call (Observed: none in the fixtures' scripts).

### Map Options

Fields 9 (the bits marked Map Options), 15, 17 to 29, and `war3mapExtra.txt` below. HiveWE's dialog groups them as: the option boxes, Use Terrain Fog (style Linear, Exponential 1, Exponential 2; z start, z end, density, colour), Use Global Weather, Custom Sound Environment, Custom Light Environment, Use Water Tinting Color, Game Data Set (Source, `map_info_editor.ui`). Supported Modes are three boxes of this dialog (Observed at the screen, `docs/research/world-editor-asset-mode.md`).

Generated in `main` (Observed in every fixture): `SetDayNightModels` with the light environment's terrain and unit models (`DNCLordaeron` for the main tileset `L` and field 22 at 0), `SetHDWaterParamsEx` (note 10), `NewSoundEnvironment("Default")` for an empty field 21, `SetAmbientDaySound` and `SetAmbientNightSound` (`LordaeronSummerDay`, `LordaeronSummerNight`), `SetMapMusic`. What a terrain fog, a global weather or a water tint generates was not seen: no save with a script had them set.

The fog type's values disagree (Source): War3Net 0 linear, 1 and 2 exponential, 3 height, 4 and 5 new exponential, -1 unspecified; wc3libs 0 none, 1 linear, 2 and 3 exponential; HiveWE's dialog Linear, Exponential 1, Exponential 2. Every save seen holds 0.

### Map Size and Camera Bounds (camera bounds only)

Fields 6 to 8. HiveWE computes them from the terrain (Source, `update_map_bounds_info`): the complements are the unplayable margins in tiles, the playable size is the terrain's vertex count minus one minus the complements, and the camera bounds are 128 world units a tile inside the playable area, 4 tiles from the left and right edges and 2 from the bottom and top. Observed: the fixtures' 52 × 52 playable area with complements 6, 6, 4, 8 and camera bounds -2816, -3328 to 2816, 2816. A change of the camera bounds alone changes fields 6 and nothing else of the file (Inferred).

Generated (Observed in two fixtures): `main` calls `SetCameraBounds` with field 6 widened by 512 on the left and right and 256 on the bottom and top, each plus or minus `GetCameraMargin`: field 6's -2816 becomes `-3328.0 + GetCameraMargin(CAMERA_MARGIN_LEFT)`.

### Map Loading Screen

Fields 11 to 14. HiveWE's dialog offers Use Default Screen, Use Campaign Screen, Use Imported File, and the title, subtitle and text (Source). The game reads the screen from the file: no generated call names it (Observed: none in the fixtures' scripts).

### Prologue Screen

Field 16 (Source). No save seen had it filled, so neither its `war3map.wts` use nor any generated call is observed.

### Player Properties

Field 31, each record (Source, the three agree but on names):

| Field                                                              | Type        | Formats |
| ------------------------------------------------------------------ | ----------- | ------- |
| Player number                                                      | int32       | all     |
| Controller: 1 user, 2 computer, 3 neutral, 4 rescuable             | int32       | all     |
| Race: 0 selectable, 1 human, 2 orc, 3 undead, 4 night elf          | int32       | all     |
| Race preference of the HUD, a `common.j` race preference           | int32       | 39      |
| Flags: `0x1` fixed start position, `0x2` race selectable (War3Net) | int32       | all     |
| Name                                                               | cstring     | all     |
| Start position x, y                                                | float32 × 2 | all     |
| Ally priorities, low and high, a player mask each                  | int32 × 2   | all     |
| Enemy priorities, low and high, a player mask each                 | int32 × 2   | 31+     |

Observed: the name is a `TRIGSTR_nnn` in every save; the start position equals the generated `DefineStartLocation(0, -1408.0, 1728.0)`; the generated `InitCustomPlayerSlots` calls `SetPlayerStartLocation`, `SetPlayerColor`, `SetPlayerRacePreference`, `SetPlayerRaceSkin`, `SetPlayerRaceSelectable` and `SetPlayerController`. The HUD field holds 2, 8 and 64 in wc3libs' save, whose generated `SetPlayerRaceSkin` takes the same value (Source, its test); it holds 32758 (`0x7FF6`, no race preference) in every 3.0 fixture of this repository, whose `SetPlayerRaceSkin` is `RACE_PREF_RANDOM` (Observed). The priority masks of computer, neutral and rescuable players hold bits beyond the player count in wowr and wc3libs' save (Observed), which looks like memory the editor never cleared (Inferred).

### Force Properties

Field 32, each record: flags (int32), the players (a player mask, int32), the name (cstring, `TRIGSTR_nnn`, Observed). With bits `0x20` and `0x40` of field 9.

| Force flag | War3Net                      | wc3libs                      | HiveWE (read / write)  |
| ---------- | ---------------------------- | ---------------------------- | ---------------------- |
| `0x01`     | allied                       | allied                       | allied                 |
| `0x02`     | allied victory               | allied victory               | allied victory         |
| `0x04`     | unknown                      | shared vision                | (none) / shared vision |
| `0x08`     | shared vision                | (none)                       | shared vision / (none) |
| `0x10`     | shared unit control          | shared unit control          | shared unit control    |
| `0x20`     | shared advanced unit control | shared advanced unit control | same                   |

Observed: fixus' forces hold `0x0b`, and its generated `InitCustomTeams` calls `SetPlayerState(..., PLAYER_STATE_ALLIED_VICTORY, 1)`, `SetPlayerAllianceStateAllyBJ` and `SetPlayerAllianceStateVisionBJ`: shared vision is `0x08`, as War3Net reads it.

### Tech Tree, Abilities, Upgrades

Fields 33 and 34, with bits `0x80`, `0x100` and `0x200` of field 9 (Source):

- **Upgrade availability**, each: the players (mask, int32), the upgrade's Rawcode (char[4]), the level (int32, from 0), the availability (int32: 0 unavailable, 1 available, 2 researched).
- **Tech availability**, each: the players (mask, int32) and a Rawcode (char[4]), an object made unavailable. War3Net generates `SetPlayerAbilityAvailable(p, id, false)` for an id starting with `A` and `SetPlayerTechMaxAllowed(p, id, 0)` for any other, and from the upgrades `SetPlayerTechMaxAllowed` at an unavailable level and `SetPlayerTechResearched` at level + 1 (Source, `MapScriptBuilder/Info/InitTechTreeForPlayer.cs`, `InitUpgradesForPlayer.cs`). That the World Editor generates the same is not observed: no save seen had either list filled.

### Random Groups and Item Tables

Fields 35 and 36 (Source):

- **Random unit table**: its number (int32), name (cstring), the column count (int32) and each column's type (int32: 0 unit, 1 building, 2 item), the row count (int32), each row a chance (int32) and a Rawcode (char[4]) per column.
- **Random item table**: its number (int32), name (cstring), the set count (int32), each set an item count (int32) and per item a chance (int32) and a Rawcode (char[4]).

No save seen had either filled, so whether the names go through `war3map.wts` is unconfirmed. War3Net generates `InitRandomGroups` and an item-table function per table from them (Source); not observed from the World Editor.

## Advanced

### Gameplay Constants: `war3mapMisc.txt`

An INI file, one section `[Misc]`, one `Key=value` line per constant the map changes, sorted by key; a list value is comma-separated (Observed in fixus and wowr: `DamageBonusMagic=1.25,0.75,2.00,...`, fixus' `UpkeepUsage=10000,` with a trailing comma). wowr's 3.0.1 save lists 58 of the 235 constants HiveWE's `Units/MiscMetaData.slk` names (Observed), so the editor writes only the changed ones (Inferred). The keys and their defaults are the game's `Units/MiscData.txt` and `Units/MiscGame.txt`, `[Misc]` (Source, HiveWE `gameplay_constants.ixx`). No value goes through `war3map.wts` (Observed in both). The file is absent from every map folder of this repository (Observed).

### Game Interface: `war3mapSkin.txt`

An INI file (Observed in fixus and wowr; Source, wc3libs `SkinTXT.java`):

- `[CustomSkin]`: textures, icons, models and sounds by the game's skin key (`IdlePeon=ReplaceableTextures\CommandButtons\BTNSheep.blp`).
- `[Errors]` and `[FrameDef]`: the game's texts by key, each a `TRIGSTR_nnn` (Observed in fixus: `Nofood=TRIGSTR_5138`, `IDLE_PEON=TRIGSTR_5139`).

Only changed keys appear (Inferred: two to fifteen keys per file). Absent from every map folder of this repository (Observed). `reforged-map` already counts the `TRIGSTR` numbers it holds when it picks a new number (`foreignReferences` in `packages/reforged-map/src/object-data-strings.ts` scans every top-level file).

### `war3mapExtra.txt`

One section, `[MapExtraInfo]` (Source, wc3libs `ExtraTXT.java`; Observed in fixus, wowr and `actboy168/MoeHero`):

| Key                         | Value                                                            | Seen         |
| --------------------------- | ---------------------------------------------------------------- | ------------ |
| `TimeOfDay`                 | 0 unfixed, 1 dawn, 2 noon, 3 dusk, 4 midnight (wc3libs)          | 2 (fixus), 4 |
| `SkyModel`                  | an index into the sky models, 0 Blizzard to 13 Outland (wc3libs) | not seen     |
| `ExternalCustomData`        | a string (wc3libs)                                               | not seen     |
| `EnableJassHelper`          | `true`                                                           | wowr (3.0.1) |
| `EnableJassHelperOptimizer` | `true`                                                           | wowr (3.0.1) |

wc3libs labels the first two with `WESTRING_MAPPREFS_TIMEOFDAY_*` and `WESTRING_SKYMODEL_*`, which suggests the Map Options dialog (Inferred); the JassHelper keys come from the Trigger Editor's JassHelper menu (Inferred). No value goes through `war3map.wts`.

### Sound Environment, Weather, lighting

- **Sound environment**: field 21 of `war3map.w3i` (Source), `NewSoundEnvironment` in `main` (Observed for the empty field: `"Default"`). The ambient day and night sounds follow the tileset (Inferred from `LordaeronSummerDay` with tileset `L`); HiveWE stores its own custom ambience in a HiveWE-only file, not a World Editor one (Source, `map_info.ixx`, `save_hive`).
- **Weather**: the global weather is field 20 of `war3map.w3i` (Source; `VWbr` Observed in wc3libs' save). A region's weather is in `war3map.w3r` (Region Editor), not in these menus.
- **Lighting**: the light environment is field 22 of `war3map.w3i`, from which the editor generates `SetDayNightModels(terrain DNC, unit DNC)` (Observed). No source here names another file or field for a terrain or unit light model or a day/night model chosen apart from the tileset.

### Custom Script: `war3map.wct`

The map's custom script is the header of `war3map.wct`: a comment (cstring) and the code, length-prefixed, followed by each trigger's custom text (Source, HiveWE `triggers.ixx`). The World Editor copies it into the `war3map.lua` or `war3map.j` it generates (Inferred). Its menu is the Trigger Editor's map entry in every editor this research knows of; an Advanced entry is not confirmed.

### Import Manager: `war3map.imp`

Format 1: the format (uint32, 1), the count (uint32), then per file a flag byte and its path (cstring) (Source; already read by `packages/reforged-map/src/war3map-imp.ts`). The files are in the map folder at those paths. Flags seen: `0x15` after the 3.0.1 editor first lists a file, `0x1d` from its next save (Observed, `docs/research/locales.md`), `0x1d` in fixus (Observed); HiveWE writes `0x0d` (Source). wc3libs reads `0x0`, `0x5`, `0x8` as a standard path and `0xA`, `0xD` as a custom one; War3Net names the five bits unknown. The editor writes no file for a map without imports (Observed, `war3map-imp.ts`'s fixtures).

### Other files of a 3.0 map folder

- `war3map.w3grp`: new in the 3.0 editor; wc3libs keeps it opaque, three zero dwords in an empty map (Source, `W3GRP.java`). Its menu is unknown.
- `conversation.json`: rewritten by the editor on a save (Observed, `docs/research/world-editor-reload.md`). Its menu is unknown.

## What the World Editor rewrites on a save

- **`war3map.w3i`, whole, as format 39** (Observed: every 3.0 save is 39, whatever the map was made with; HiveWE and wc3libs write the file whole). A save without an edit changes the saves count (`editor-locales.md`: offset 4, 1 to 2, the only byte that changed). The editor and game versions become the saving editor's (Observed: 7000 and `3.0.0.24268` in maps last saved by 3.0.0, 7003 and `3.0.1.24371` by 3.0.1).
- **`config` and `main` of `war3map.lua` or `war3map.j`**, from `war3map.w3i` (Observed: every call named above).
- **`war3map.wts`**: byte-identical after a save without an edit (Observed, `editor-locales.md`).
- **`war3map.imp`**: each new entry's flag from `0x15` to `0x1d` (Observed, `docs/research/locales.md`).
- **`war3mapMisc.txt`, `war3mapSkin.txt`, `war3mapExtra.txt`**: not observed across an editor save. That a save keeps a hand-edited file, or rewrites it sorted, is not settled.

## What `reforged-map` reads and writes today

- `packages/reforged-map/src/war3map-w3i.ts`, read-only: the header up to field 26, in formats 18, 25, 28, 31, 32, 33 and 39. It returns the Game data set (field 15, Default resolved by bit `0x0004`, with field 26) as the id of `reforged-builtins`' index, and the Supported Modes (field 25, `readSupportedModes`, exported for the Studio). It treats a Game Data Set outside 0 to 2 as unknown, with a warning: `editor-locales.w3m`'s -1 (Observed above) falls there.
- `packages/reforged-map/src/war3map-imp.ts`: reads format 1 and rewrites the list for the locale tables only (`importListWith`), keeping every other entry and any trailing byte; no other import is added or removed.
- `packages/reforged-map/src/war3map-wts.ts`: reads `war3map.wts` and the locale tables losslessly; `object-data-strings.ts` and the Object data writer add and remove strings for Object data, and count the `TRIGSTR` numbers of every other top-level file, `war3map.w3i` and `war3mapSkin.txt` included.
- `packages/reforged-map/src/war3map-wtg.ts` reads the Variable Editor's variables of `war3map.wtg`. Nothing reads `war3mapMisc.txt`, `war3mapSkin.txt`, `war3mapExtra.txt`, `war3map.wct`, `war3map.w3r` or `war3map.w3grp`. The `war3mapSkin.*` files it reads are the Object data's Skin files (`war3mapSkin.w3u` and the others), not `war3mapSkin.txt`.

## Not settled here

- The dialog of each field marked unconfirmed: no dump of the 3.0 editor's strings was reachable. A screen check, for a human, would settle the Advanced menu's entries, including whether it has Custom Script, Import Manager, Weather or a lighting entry, which the issue names.
- The names of field 19's first, second and sixth values, and the byte order of the colours (notes 6 and 7): a save with a height fog and a non-grey colour set, read back, would settle them.
- Field 30 and the HUD value 32758 of the fixtures.
- Which strings of the prologue screen, the random groups and the item tables go through `war3map.wts`: no save had them filled.
- The calls the editor generates for a terrain fog, a global weather, a water tint, the tech tree, the upgrades, the random groups and the item tables.
- Whether the editor keeps a hand-edited `war3mapMisc.txt`, `war3mapSkin.txt` or `war3mapExtra.txt` byte for byte on a save, and what it does with a key it does not know.
- What the game reads for a Game Data Set of -1 (a Probe would answer it; `reforged-map` reports it as unknown until then).
- The meaning of `war3map.w3grp`.
