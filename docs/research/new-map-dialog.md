# The World Editor's New Map dialog

What the 3.0 World Editor's File > New Map dialog offers, option by option, what it starts at, and what else the editor writes into a new map, researched for [#1046](https://github.com/phmilk/reforged-ts/issues/1046) without the game. Each claim is marked:

- **Read**: read in a data file the editor ships (`UI/WorldEditData.txt`, `UI/WorldEditStrings.txt`, `UI/WorldEditGameStrings.txt`, `TerrainArt/Terrain.slk`), from the published dumps under [Sources](#sources).
- **Observed**: read back from a map folder the World Editor saved, among the repository's fixtures.
- **HiveWE** or **wc3libs**: what that third-party editor or library does. A fact about their own behaviour, not the World Editor's, unless another mark agrees.
- **Inferred**: follows from the above, not seen.
- **Open**: unsettled here; listed again in [What only the editor or the game can settle](#what-only-the-editor-or-the-game-can-settle).

No screen of the dialog was seen: what it lays out, and in which control, is not known beyond its strings.

## TL;DR

- **The dialog's controls, by their strings** (Read): "Create New Map" with Map Size (Width, Height), Playable Area (Width, Height, read-only by its strings' lack of `&`), Size Description, Initial Tile, Initial Cliff Level and Initial Water Level, plus the tileset list. "Random height field" exists, but outside the `WESTRING_NEWMAP_*` block: whether it is in this dialog or only in Advanced > Reset Height Field is Open.
- **Map size: 32 to 480 per side, 64 × 64 by default** (Read, `[WorldEditMisc]` `MinimumMapSize=32`, `MaximumMapSize=480`, `DefaultMapSize=64,64`; the pre-1.29 file says 256). The step is Open: an error string says "The full map size must be a multiple of %d", without the number.
- **The tileset defaults to Lordaeron Summer** (Read, `DefaultTileset=L`), from the 23 tilesets of `[TileSets]` (22 plus Misc).
- **The playable area is the full size minus 6 tiles left and right, 4 at the bottom and 8 at the top** (Observed in a 32 × 32 and a 64 × 64 map: 20 × 20 and 52 × 52), so it follows the size; HiveWE's "reset camera bounds" uses the same 6, 6, 4, 8. The camera bounds sit 4 tiles inside it left and right and 2 at the bottom and top (Observed).
- **The size description is derived, not chosen** (Read): nine bands in `[MapSizes]`, by area, Tiny ≤ 6600, Extra Small 12800, Small 21000, Medium 31000, Large 43500, Extra Large 74000, Huge 135000, Epic 215000, Legendary above. Whether the area is the full or the playable one, and whether a bound is inclusive, is Open; HiveWE uses the full area with its own, slightly smaller, squares and no Legendary.
- **A new map's ground** (Observed, two maps): every corner the tileset's first tile (`Ldrt`, Dirt), ground height 0 at cliff layer 2, no water, no cliff, random tile variations; the tile list is the tileset's six Terrain.slk tiles and its two cliffs. That these are the dialog's defaults, and not choices, is Inferred.
- **What else a new map gets** (Observed in a map made with File > New on 3.0.1): name "Just another Warcraft III map", author "Unknown", description "Nondescript", players "Any" (the `WESTRING_DEFAULT_*` strings, as literals in `war3map.w3i`); one player, Player 1, User, Human; one force, Force 1, every player in it; a start location; the trigger "Melee Initialization"; JASS; Supported Modes 3; Game Data Version 2; flags `0x9c10`; and Game Data Set **-1**, which `reforged-map`'s `war3map.w3i` reader does not accept (Inferred from its code, [below](#game-data-set--1)).

## Sources and the maps read

The data files come from two 3.0-era dumps that agree on every line quoted here, and one pre-1.29 dump for comparison; see [Sources](#sources). The maps:

| Map                                                                       | Editor                     | How it was made                                                                                                                                                                         |
| ------------------------------------------------------------------------- | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/reforged-map/test/fixtures/editor-locales.w3m` ("the new map")  | 3.0.1.24371 (editor 7003)  | File > New by a human, a Custom unit added, saved twice ([its provenance](../../packages/reforged-map/test/fixtures/editor-locales.md)). The dialog's choices were not recorded.        |
| The Template's `reforged-ts-template.w3m` ("the Template map")            | 3.0.0.24268 (editor 7000)  | Not recorded: the repository's history starts with it. Its script is Lua, so its options were changed after it was made. `editor-objects.w3m`, `editor-variables.w3m` and `probe.w3m` are copies of it. |

The two maps were parsed with a throwaway reader of `war3map.w3i` (format 39, wc3libs' `read_0x27` order) and `war3map.w3e` (format 12, 8 bytes per corner); its fields line up to the end of both files.

## The options

### Map size

- **Range 32 to 480 tiles per side, default 64 × 64** (Read, 3.0 `[WorldEditMisc]`). The pre-1.29 file has `MaximumMapSize=256` (Read), the old limit.
- **The step is Open.** `WESTRING_ERROR_MAPSIZENOTMULTIPLE` reads "The full map size must be a multiple of %d in both dimensions." and `WESTRING_ERROR_MAPSIZETOOMANYCELLS` "The full map area (%d cells) exceeds the limit of %d cells." (Read): the numbers are in the executable. `WESTRING_WARNING_INVALIDMAPSIZE` reads "Map size must be between %d and %d" (Read), which 32 and 480 would fill (Inferred). HiveWE's Map Size dialog changes a side 4 tiles a click, "Vanilla editor behaviour", and keeps each extent within ±252 tiles of the origin (HiveWE): that is the Scenario > Map Size and Camera Bounds dialog, not New Map. Both observed maps are a multiple of 32 (32 and 64).
- **Presets**: the data files hold none beyond `DefaultMapSize` (Read). Whether the dialog offers a list (the pre-1.29 dialog's sizes were said to be multiples of 32) or free entry is Open.
- **What the size writes** (Observed): `war3map.w3e` holds W + 1 by H + 1 corners (33 × 33, 65 × 65), centred on the origin (offset `-W × 64`, -2048 and -4096).
- `WESTRING_EXPFEATURE_LARGERMAPSIZE`: "Map size is greater than 192 x 192 (or equivalent)" is one of the reasons a map requires the expansion (Read).

### Playable area

The dialog shows it as Width and Height under "Playable Area" (Read, `WESTRING_NEWMAP_PLAYSIZE*`); no string offers to edit it there.

- **It is the size minus fixed margins** (Observed): `war3map.w3i`'s four camera complements are 6 left, 6 right, 4 bottom, 8 top in both maps, so 32 × 32 gives 20 × 20 and 64 × 64 gives 52 × 52, the playable width and height the file stores. HiveWE's "reset camera bounds" puts the same margins back (HiveWE). That the margins stay 6, 6, 4, 8 at every size is Inferred from two sizes.
- **The boundary tiles** (Observed): `war3map.w3e` sets the boundary bit (`0x4000` of the water word) on each tile corner outside the playable area, the last row and column of corners excepted.
- **The camera bounds** (Observed): `war3map.w3i`'s eight camera floats are the playable area inset by 4 tiles left and right and 2 at the bottom and top: -768, -1280 to 768, 768 in the 32 × 32 map. The script's `SetCameraBounds` passes the playable edges (-1280, -1536 to 1280, 1024) plus `GetCameraMargin`, so the 512 and 256 are the game's camera margins (Inferred). HiveWE computes the same bounds (HiveWE).

### Size description

Shown in the dialog (`WESTRING_NEWMAP_SIZEDESC`) and in Map Options (`WESTRING_OM_MSROW_MAPSIZEDESC` "Map Size Description", beside "Playable Map Size") (Read). No field of `war3map.w3i` holds it (wc3libs, and the parse above), so it is derived from the size (Inferred).

`[MapSizes]` of 3.0 (Read), with the names of `WorldEditGameStrings.txt` (Read):

| Band | Upper bound (area) | ≈ side of a square | Description | HiveWE's bound      |
| ---- | ------------------ | ------------------ | ----------- | ------------------- |
| 00   | 6600               | 81.2               | Tiny        | 80² = 6400          |
| 01   | 12800              | 113.1              | Extra Small | 112² = 12544        |
| 02   | 21000              | 144.9              | Small       | 144² = 20736        |
| 03   | 31000              | 176.1              | Medium      | 176² = 30976        |
| 04   | 43500              | 208.6              | Large       | 208² = 43264        |
| 05   | 74000              | 272.0              | Extra Large | 272² = 73984        |
| 06   | 135000             | 367.4              | Huge        | 364² = 132496       |
| 07   | 215000             | 463.7              | Epic        | above 132496: Epic  |
| 08   | 999999             |                    | Legendary   | none                |

- The pre-1.29 file has six bands (Read): Tiny 7500, Small 13500, Medium 22000, Large 32500, Huge 45000, Epic 99999. Extra Small, Extra Large and Legendary came with the larger maps.
- HiveWE derives the description from the full width × height with `<=` (HiveWE), in its Map Size dialog. Its bounds are near the editor's but not equal, and it has no Legendary: a 112 × 114 map (12768) is Small in HiveWE and Extra Small by `[MapSizes]` if the full area is meant.
- **Open**: whether the editor measures the full or the playable area, whether a bound is inclusive, and whether the lobby shows the same description. Both observed maps are Tiny either way (4096 or 2704 at most).

### Tileset

- **Default Lordaeron Summer** (Read, `DefaultTileset=L`); both maps are `L` (Observed).
- **The list** (Read, 3.0 `[TileSets]`, with `WorldEditGameStrings.txt`'s names): Ashenvale `A`, Barrens `B`, Black Citadel `K`, Cityscape `Y`, Cityscape Ruins `P`, Dalaran `X`, Dalaran Ruins `J`, Dungeon `D`, Felwood `C`, Icecrown Glacier `I`, Lordaeron Capital `e`, Lordaeron Capital Ruins `R`, Lordaeron Fall `F`, Lordaeron Summer `L`, Lordaeron Winter `W`, Northrend `N`, Outland `O`, Sunken Ruins `Z`, Underground `G`, Village `V`, Village Fall `Q`, Undercity `u`, and Misc `M` (`WESTRING_MISCSET`). Whether the dialog lists Misc is Open.
- **Custom tilesets** are not a New Map option by the strings: Advanced > Modify Tileset carries "Base Tileset" and "Use custom tileset" (Read, `WESTRING_MODTEX_*`), and `war3map.w3e` stores a custom-tileset flag, 0 in both maps (Observed).
- **The tiles a tileset gives** (Observed for `L`): `war3map.w3e` lists `Ldrt`, `Ldro`, `Ldrg`, `Lrok`, `Lgrs`, `Lgrd` and the cliffs `CLdi`, `CLgr`. These are the `L` rows of `TerrainArt/Terrain.slk` in its order (Read, a Reforged dump): Dirt, Rough Dirt, Grassy Dirt, Rock, Grass, Dark Grass. That every tileset gets its Terrain.slk rows in order is Inferred; the dump read has no rows for `e`, `R`, `u`, `P`, so it predates them.

### Initial tile

`WESTRING_NEWMAP_DEFTILE` "Initial Tile" (Read). Every corner of both maps is texture 0, `Ldrt`, Dirt (Observed): the tileset's first tile. That the dialog starts on the first tile is Inferred; HiveWE's own new map uses Grass (`Lgrs`) instead (HiveWE), a choice of its own.

The tile variations are random (Observed: the 1,089 corners of the new map use variations 0 to 17, most often 0, 4, 8, 12, 16 and 17), in line with `[TerrainCellRarity]` of `WorldEditData.txt` (Read: 85 for 0, 4, 8, 12, 16, 17; 10, 4 and 1 for the others). HiveWE draws them with the same weights (HiveWE).

### Initial cliff level and initial water level

`WESTRING_NEWMAP_DEFCLIFF` "Initial Cliff Level", `WESTRING_NEWMAP_DEFWATER` "Initial Water Level" (Read).

- **What both maps hold** (Observed): every corner at cliff layer 2, ground height word 8192 (0), water height word 8192, cliff texture 15 (none), no ramp, blight or water flag. So the defaults were the layer the editor calls ground level 2 and no water (Inferred, as for the tile).
- **The choices are Open.** The strings that sit next to "Random height field" are "Deep Water", "Shallow Water", "Low Ground", "Middle Ground", "High Ground", "Mountain Peak" and "No Cliff" (Read, `WESTRING_DEEPWATER` to `WESTRING_NOCLIFF`), which reads as the lists of these two controls and of the height field (Inferred). Community tutorials describe the water choice as none, shallow water or deep water, and the cliff level as the floor and ceiling left for raising and lowering (Hive Workshop, by the search engine's summary: the site was out of this session's network).

### Random height field

`WESTRING_RANDOMHEIGHT` "Random height field" (Read), next to the progress strings "Resetting height field", "Randomizing height field" and "Smoothing height field" (Read), and to Advanced > Reset Height Field (`WESTRING_RESETHEIGHT`, `WESTRING_MENU_RESETHEIGHT`, Read). The editor randomises then smooths, by those strings (Inferred). No data file tunes or seeds it: neither `WorldEditData.txt` nor the strings carry a section for it (Read); the Noise height brush and the smoothing weights `SmoothBrushWeightsNormal=0.80,0.20` belong to the brushes (Read). HiveWE has no such option (HiveWE). Where it appears, what it generates, and whether a seed exists are Open.

## What else the editor fills in

From the new map (Observed, `war3map.w3i`, `war3map.wts`, `war3map.j`, `war3map.wtg`, `war3mapUnits.doo`), with the Template map where it differs:

| Item                         | New map (3.0.1)                                                                                                 | Template map (3.0.0, options changed)  |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| Name, author, description, players | "Just another Warcraft III map", "Unknown", "Nondescript", "Any", as literals (`WESTRING_DEFAULT_*`, Read)  | `TRIGSTR_003` to `006`                 |
| Players                      | 1: Player(0), controller 1 (User), race 1 (Human), not fixed, name `TRIGSTR_001` "Player 1", priorities 0; a 4th int 32758 that wc3libs calls the HUD skin | same, start elsewhere |
| Start location               | one `sloc` in `war3mapUnits.doo`, at (-256, -1280); whether the editor or the human placed it is Open           | (-1408, 1728)                          |
| Forces                       | 1: flags 0, all players (`0xffffffff`), `TRIGSTR_002` "Force 1"                                                 | same                                   |
| Flags                        | `0x9c10`: masked areas partially visible, the 0x0400 bit HiveWE notes as unknown, cliff and rolling shore waves, item classification (bit names from HiveWE) | same                                   |
| Loading screen               | number -1, no model, text, title or subtitle; the int after it (wc3libs: crest race) 64                         | 128                                    |
| Game Data Set                | **-1**                                                                                                          | 2                                      |
| Prologue                     | empty                                                                                                           | empty                                  |
| Fog                          | type 0, z 3000 to 5000, density 0.5, colour 0, 0, 0, 255; style 0, over sky 0, linear 10000 to 10000, opacity 1.0, height 0.0 | same                                   |
| Weather, sound, light        | none, empty (the script calls `NewSoundEnvironment("Default")`), the tileset's own                              | same                                   |
| Water colour                 | 255, 255, 255, 255                                                                                              | same                                   |
| Script language              | 0, JASS                                                                                                         | 1, Lua                                 |
| Supported Modes              | 3, SD and HD ([`world-editor-asset-mode.md`](world-editor-asset-mode.md))                                       | 3                                      |
| Game Data Version            | 2                                                                                                               | 2                                      |
| Camera zoom (default, max, min) | 0, 0, 0                                                                                                      | 1250, 1250, 1250                       |
| Water settings (10 ints)     | 0, 100, 10, 0, 50, 20, 100, 0, 100, -1 (the same as HiveWE's defaults, by its names: min and max opacity, reflectivity, emissivity, edge softness, wave displacement, normal map strength, tint colour, environment map reflectivity, unknown) | same                                   |
| Upgrade, tech, unit and item tables | none                                                                                                     | none                                   |
| Triggers                     | category "Initialization" with "Melee Initialization" (Map Initialization, the eight `Melee*` actions); the root named `Untitled <number>` | the map's own                          |
| Custom script                | the comment "Enter map-specific custom script code below…"                                                      |                                        |
| Day and night, ambience, music | `DNCLordaeron` models, `LordaeronSummerDay` and `Night`, `SetMapMusic("Music", true, 0)`, from the tileset (Inferred) |                                     |

### Game Data Set -1

The new map stores -1 in its Game Data Set (Observed), where wc3libs names -1 `MAX` and 0 to 2 Default, Custom and Melee (wc3libs). `reforged-map`'s reader (`packages/reforged-map/src/war3map-w3i.ts`) maps an index to `default`, `custom` or `melee` with `byIndex`, which throws on -1: such a map gets the warning "the map's Game data set is unknown", and `readSupportedModes` returns undefined for it, since it reads the Game Data Set first (Inferred from the code, not run). What -1 means to the editor (the Map Options' choice before any is made, read as Default?) and to the game is Open, and worth its own issue.

### Literal or `TRIGSTR`

The new map holds its name, author, description and recommended players as literals, and its player and force names as `TRIGSTR_001` and `002` (Observed); the Template map holds all of them as `TRIGSTR` (Observed). That editing them in Scenario > Map Description moves them into `war3map.wts` is Inferred.

## What only the editor or the game can settle

For the reference-maps task: each needs a person at the World Editor (or the game), and a map saved for each case.

1. **The dialog itself**: a screenshot of File > New Map, its controls and their defaults: is the size a list or free entry, is the playable area editable, is "Random height field" there, is Misc in the tileset list.
2. **The size step and limits**: the multiple of `WESTRING_ERROR_MAPSIZENOTMULTIPLE`, the cell limit of `…TOOMANYCELLS`, and whether 32 × 480 (non-square) is accepted.
3. **The size description rule**: the description shown for sizes on both sides of a band, chosen so the full and the playable area fall in different bands (for example 128 × 112: full 14336, Small; playable 116 × 100 = 11600, Extra Small), with and without a changed playable area; and the size the game's lobby shows for the same maps.
4. **The playable margins at every size**: maps at 32, 96, 256 and 480, and a non-square one, to confirm 6, 6, 4, 8.
5. **The cliff and water choices**: one map per Initial Cliff Level and per Initial Water Level, read back from `war3map.w3e` (layer, water word, water flag).
6. **The initial tile default per tileset**: one new map per tileset with the dialog untouched, giving each tileset's tile list, cliffs and the tile it starts on.
7. **The random height field**: two maps from the same choices, to see whether it is seeded and what height range it spans.
8. **The start location and the Game Data Set**: a new map saved with no edit at all, to see whether the editor places Player 1's start location and stores Game Data Set -1, then the same map after opening Map Options and choosing each Game Data Set; and what the game does with -1 (a Probe run reading the game data in force).
9. **The zoom and loading-screen int**: whether 0 zoom and 64 are what a 3.0.1 new map always writes, against the Template map's 1250 and 128.

## Sources

- **3.0-era data files**: [hachamacha106/w3x2lni-reforged](https://github.com/hachamacha106/w3x2lni-reforged) at `ad81c078`, `data/warcraft-current/mpq/ui/` (`worldeditdata.txt`, `worldeditstrings.txt`, `worldeditgamestrings.txt`). Its manifest leaves the build unverified; its docs name editor 7003 and `war3map.w3i` format 39, as Patch 3.0.1 writes. [GodMephisto/wc3-mcp](https://github.com/GodMephisto/wc3-mcp) at `17366552`, `dataset/wc3/wc3-editor-data/WorldEditData.txt`, has the same `[MapSizes]` and `[WorldEditMisc]` lines.
- **Pre-1.29 data files**: [WarRaft/War3.mpq](https://github.com/WarRaft/War3.mpq) at `842b1f15`, `extract/UI/WorldEditData.txt`; [sumneko/w3x2lni](https://github.com/sumneko/w3x2lni) at `82916514`, `data/enUS-1.27.1/mpq/UI/WorldEditGameStrings.txt`.
- **Terrain.slk**: [tdauth/wowr](https://github.com/tdauth/wowr) at `05538f1f`, `wc3/reforged/Units/Terrain.slk`.
- **HiveWE**: [stijnherfst/HiveWE](https://github.com/stijnherfst/HiveWE) at `8c3d323f` (2026-11-17), AGPL-3.0, facts only: `src/main_window/hivewe.cpp` (`new_map`), `src/base/map_info.ixx` (`load_defaults`, `update_map_bounds_info`, the flag bits), `src/base/terrain.ixx` (`save_blank`, the variation weights), `src/menus/map_info_editor/map_size.cpp` (the size description, the limits, the margins).
- **wc3libs**: [inwc3/wc3libs](https://github.com/inwc3/wc3libs) at `da8be9e7`, `src/main/java/net/moonlightflower/wc3libs/bin/app/W3I.java` (`read_0x27`, the player, Game Data Set and race values).
- **Hive Workshop**: only through a search engine's summary of its tutorials (for example ["A beginner's guide to map making"](https://www.hiveworkshop.com/threads/a-beginners-guide-to-map-making.8204/)); `www.hiveworkshop.com` and `classic.battle.net` were outside this session's network.
- **The maps**: the fixtures named [above](#sources-and-the-maps-read).
