# The files of a new empty map

Which files a map folder holds when the 3.0 World Editor saves a new, empty map, the format and version of each, and what each holds while the map is empty, researched for [#1048](https://github.com/phmilk/reforged-ts/issues/1048) (wayfinder [#1045](https://github.com/phmilk/reforged-ts/issues/1045)) without the game. The New Map dialog's options and the defaults the editor fills into `war3map.w3i` are in the sibling note [`new-map-dialog.md`](new-map-dialog.md) (#1046); this note is about the files' bytes. Each claim is marked:

- **Observed**: read from the bytes of a map folder the World Editor saved (the two maps below), with a throwaway Python reader run outside the repository.
- **HiveWE**, **wc3libs** or **Spec**: what that editor, that library or [WC3MapSpecification](https://github.com/ChiefOfGxBxL/WC3MapSpecification) reads or writes. A fact about their own behaviour, not the World Editor's, unless an Observed mark agrees.
- **Inferred**: follows from the above, not seen.
- **Open**: unsettled here; listed again in [What only the editor or the game can settle](#what-only-the-editor-or-the-game-can-settle).

## TL;DR

- **A new empty map is 17 files and two folders** (Observed): `war3map.w3e`, `war3map.wpm`, `war3map.shd`, `war3mapMap.blp`, `war3map.mmp`, `war3map.w3i`, `war3map.doo`, `war3mapUnits.doo`, `war3map.w3r`, `war3map.w3c`, `war3map.wts`, `war3map.wct`, `war3map.wtg`, the script (`war3map.lua` or `war3map.j`), `war3map.w3l`, `war3map.w3grp` and `conversation.json`, plus the empty `_Locales/<locale>.w3mod/` folders and `war3mapImported/`. No `war3map.w3s`, `war3map.imp`, Object data file or `war3mapMisc.txt` until something needs one.
- **The terrain is one corner repeated, but for its variation** (Observed): `war3map.w3e` format 12, 8 bytes a corner; every corner height 0, water word `0x2000`, ground texture 0 (the tileset's first tile), cliff texture 15 (none) at layer 2. The only free part is each corner's ground variation, which the editor draws at random. The map-edge bit (`0x4000` of the water word) is set on the corners whose tile lies outside the playable area, the last column and row of corners never.
- **`war3map.wpm` and `war3map.shd` follow from it** (Observed): `MP3W`, version 0, 4 × 4 cells a tile; every cell `0x40` in the playable area and `0xCE` in the boundary, by the tile's bottom-left corner. `war3map.shd` is 16 cells a tile of `0x00`, no header.
- **The minimap is a 256 × 256 JPEG BLP1 of the ground and a list of icons** (Observed): `war3mapMap.blp` holds one mip level and no alpha; `war3map.mmp` holds format 0 and one icon, Player 1's start location, placed in a 256 frame over the playable area. Whether the game or the editor needs either file is Open: HiveWE never writes them (HiveWE).
- **The other files of an empty map are short and nearly constant** (Observed): `war3map.doo` 24 bytes (`W3do` 13/11, no doodad), `war3map.w3r` and `war3map.w3c` 8 bytes each (version 7 and 3, no entry), `war3map.wct` 310 bytes (the editor's comment), `war3mapUnits.doo` 131 bytes (one start location), `war3map.w3l` and `war3map.w3grp` 22 and 12 bytes, formats nobody documents.
- **`reforged-map` reads none of the terrain or minimap files** (Observed in `packages/`): it reads `war3map.lua`, `war3map.wtg`, `war3map.w3i` (the Game data set and the Supported Modes) and the string tables, and writes Object data, `war3map.wts` and `war3map.imp`; `reforged-studio` reads the two `.doo` files. Nothing in the repository reads or writes `war3map.w3e`, `war3map.wpm`, `war3map.shd`, `war3mapMap.blp`, `war3map.mmp`, `war3map.w3r`, `war3map.w3c`, `war3map.wct`, `war3map.w3l` or `war3map.w3grp`; the Template's pack copies them byte for byte.

## The maps read

| Map                                                                                            | Editor                    | Size                        | Notes                                                                                                                                                                                            |
| ---------------------------------------------------------------------------------------------- | ------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| The Template's `reforged-ts-template.w3m` ("the Template map")                                 | 3.0.0.24268 (editor 7000) | 64 × 64 tiles, playable 52 × 52 | How it was made is not recorded; its options were changed (Lua, Game Data Set 2, Map Description). `editor-objects.w3m`, `editor-contract.w3m`, `editor-sync.w3m`, `editor-variables.w3m` and `probe/probe.w3m` hold its terrain and minimap files byte for byte (sha256 compared). |
| `packages/reforged-map/test/fixtures/editor-locales.w3m` ("the new map")                       | 3.0.1.24371 (editor 7003) | 32 × 32 tiles, playable 20 × 20 | File > New by a human, one Custom unit added, saved twice ([its provenance](../../packages/reforged-map/test/fixtures/editor-locales.md)). Script JASS. The terrain, `wpm`, `shd`, `mmp` and `blp` carry nothing but the empty map. |

Both maps agree on every format and on every rule below; where their bytes differ, the table of each file says so.

## Terrain

### `war3map.w3e`

The layout, as HiveWE reads and writes it (`src/base/terrain.ixx`, `load`, `save`, `save_blank`) and Spec describes it (`Terrain/12.md`); little-endian throughout:

| Field                           | Type          | Template map                                           | New map                  |
| ------------------------------- | ------------- | ------------------------------------------------------ | ------------------------ |
| Magic                           | `char[4]`     | `W3E!`                                                 | same                     |
| Format                          | `uint32`      | 12                                                     | 12                       |
| Main tileset                    | `char`        | `L` (Lordaeron Summer)                                 | `L`                      |
| Custom tileset                  | `uint32`      | **0**                                                  | **0**                    |
| Ground tiles, then their ids    | `uint32`, `char[4]` each | 6: `Ldrt`, `Ldro`, `Ldrg`, `Lrok`, `Lgrs`, `Lgrd` | same              |
| Cliff tiles, then their ids     | `uint32`, `char[4]` each | 2: `CLdi`, `CLgr`                           | same                     |
| Width, height in corners        | `uint32` × 2  | 65, 65                                                 | 33, 33                   |
| Offset X, Y (the bottom-left corner's world position) | `float32` × 2 | -4096, -4096 (−64 × 128 / 2)          | -2048, -2048             |
| Corners, row by row from the bottom-left | 8 bytes each | 4 225 (69 + 33 800 = 33 869 bytes) | 1 089 (8 781 bytes) |

Each corner (HiveWE; the masks Observed against both maps):

| Bytes | Field                                                                                                       | Empty map value                    |
| ----- | ----------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| 2     | Ground height, `(h − 8192) / 512` in layer units                                                            | `8192` (0)                         |
| 2     | Water height in the low 14 bits, `(w − 8192) / 512`; bit 14 (`0x4000`) the **map edge**; bit 15 not used     | `0x2000`, or `0x6000` on the edge  |
| 2     | Ground texture in the low 6 bits (an index into the ground tile list); flags ramp `0x40`, blight `0x80`, water `0x100`, boundary `0x200` | `0x0000` |
| 1     | Ground variation in the low 5 bits, cliff variation in the high 3                                           | random, 0 to 17 (below)            |
| 1     | Cliff texture in the high nibble (15: none), layer height in the low nibble                                 | `0xF2`: no cliff, layer 2          |

- **The flat default corner** (Observed): height 0, water word `0x2000`, texture word 0, misc `0xF2`, on every corner of both maps. Both start on texture 0, `Ldrt` (Dirt), the tileset's first tile; whether that is the New Map dialog's default or a choice is Open ([`new-map-dialog.md`](new-map-dialog.md)). The water flag is clear, so the water height is stored but not shown (Inferred).
- **Format 11 differs only in the texture byte** (HiveWE, Spec): one byte, texture in the low 4 bits and the four flags in the high 4. The 3.0 editor writes 12 (Observed).
- **Spec's masks are wrong in two places** (Inferred from the bytes): it gives the water height as `short & 0x7fff`, which would put the map-edge bit inside the height, and the ground variation as `byte & 0xf8`; both maps store variations 1, 2 and 3, so the variation is in the low bits, as HiveWE reads it.
- **The ground variation is random** (Observed): 4 225 corners of the Template map spread over 0 to 17, about 600 to 650 each at 0, 4, 8, 12, 16 and 17 and 4 to 90 each at the others; the new map has the same shape. A new map cannot be reproduced byte for byte without the editor's generator; the game draws whatever variation is stored (Inferred). HiveWE draws its own weighted random variation (HiveWE, `random_ground_variation`).
- **The custom tileset field is 0** (Observed). HiveWE writes 1 (HiveWE); what the game does with either is Open.

**The map edge** (Observed, both maps): the corner `(x, y)`, counted from the bottom-left, carries bit `0x4000` when `x < L`, `W − R ≤ x < W`, `y < B` or `H − T ≤ y < H`, where `W × H` is the size in tiles and `L, R, B, T` the camera complements of `war3map.w3i` (6, 6, 4, 8 in both maps). So the bit marks the corners that are the bottom-left of a tile outside the playable area, and the last column (`x = W`) and the last row (`y = H`) of corners never carry it. HiveWE's `save_blank` flags the four outer lines of corners instead, and its `set_unplayable_boundaries` flags the last column and row too (HiveWE): its output differs from the editor's there.

### `war3map.wpm`

| Field              | Type             | Template map           | New map          |
| ------------------ | ---------------- | ---------------------- | ---------------- |
| Magic              | `char[4]`        | `MP3W`                 | same             |
| Version            | `uint32`         | 0                      | 0                |
| Width, height      | `uint32` × 2     | 256, 256               | 128, 128         |
| Cells, row by row from the bottom | `uint8` each | 65 536 (65 552 bytes) | 16 384 (16 400 bytes) |

Four cells a tile on each side (HiveWE, wc3libs `WPM.java`, Observed). The bits, as HiveWE names them (`src/base/pathing_map.ixx`): `0x02` unwalkable, `0x04` unflyable, `0x08` unbuildable, `0x10` harvestable, `0x20` blight, `0x40` water, `0x80` amphibious; `0x01` has no name.

- **An empty map holds two values** (Observed): `0x40` in the playable area (43 264 cells, 208 × 208, in the Template map; 6 400, 80 × 80, in the new map) and `0xCE` (`0x80 | 0x40 | 0x08 | 0x04 | 0x02`) in the boundary (22 272 and 9 984).
- **A cell is boundary when its tile's bottom-left corner carries the map-edge bit** (Observed): the boundary cells are exactly the 4 × 4 blocks of tiles 0 to 5 and 58 to 63 across and 0 to 3 and 56 to 63 up in the Template map (0 to 5, 26 to 31 and 0 to 3, 24 to 31 in the new map). HiveWE computes it by the same rule, a cell's tile by `i / 4`, and adds unwalkable, unflyable and unbuildable there (HiveWE, `get_terrain_pathing`, "if the bottom-left corner is a boundary, then the entire 4x4 cell is considered a boundary").
- **`0x40` on dry land means "not water"** (Inferred): the editor sets it on every cell of a map without water, so the bit HiveWE calls `water` is set where there is none. HiveWE's rule sets it only on water corners: its output would differ from the editor's on every land cell.
- **`0x80` is set on boundary cells only** (Observed); what it means to the game is Open.
- **On a flat map without water, cliffs or blight, the tile's own pathing is the rest** (HiveWE): the ground tile's `buildable`, `walkable` and `flyable` columns of `TerrainArt/Terrain.slk`, taken from the corner nearest the cell, give `0x08`, `0x02` and `0x04` when false; then cliffs add unwalkable and unbuildable, deep water unwalkable and unbuildable, shallow water unbuildable, blight `0x20`. `Ldrt` is walkable, flyable and buildable, so the playable cells hold no bit but `0x40` (Observed, Inferred for the cause).

### `war3map.shd`

No header (HiveWE, wc3libs `SHD.java`): one byte a cell, the same 4 × 4 cells a tile as `war3map.wpm`, `0xFF` for a shadowed cell, `0x00` otherwise. Both maps hold only `0x00`: 65 536 and 16 384 bytes (Observed). HiveWE checks the size against the terrain and starts from zeros when the file is missing or of the wrong size (HiveWE, `ShadowMap::load`, `Map` loading).

## Minimap

### `war3mapMap.blp`

| Field                                  | Type             | Both maps                                     |
| -------------------------------------- | ---------------- | --------------------------------------------- |
| Magic                                  | `char[4]`        | `BLP1`                                        |
| Compression                            | `uint32`         | 0: JPEG                                       |
| Alpha bits                             | `uint32`         | 0                                             |
| Width, height                          | `uint32` × 2     | 256, 256                                      |
| Picture type, has mipmaps              | `uint32` × 2     | 5, 0                                          |
| Mip offsets, mip sizes                 | `uint32[16]` × 2 | one mip: offset 1 180; size 8 083 (Template map), 8 049 (new map) |
| JPEG header size, then the header      | `uint32`, bytes  | 572 bytes at offset 160                       |
| Padding to the mip, then the mip       | bytes            | 448 bytes, then the JPEG body to the file's end (9 263 and 9 229 bytes) |

The layout is HiveWE's BLP1 reader (`src/file_formats/blp.ixx`), which joins the shared header to the mip's bytes before decoding. Decoded, the Template map's image is a 4-component JPEG of one even brown-grey texture over all 256 × 256 pixels, no darker band at its edges and no icon drawn in it (Observed): the ground of the playable area, it seems, the boundary left out (Inferred, consistent with `war3map.mmp` below). How the editor renders it (which tile colour, lighting, scale for a non-square playable area) is Open.

### `war3map.mmp`

Both maps' files are 24 bytes (Observed):

```
00 00 00 00   format 0
01 00 00 00   1 icon
02 00 00 00   icon type 2: a player's start location
49 00 00 00   x 73     (new map: 0x66, 102)
34 00 00 00   y 52     (new map: 0xE7, 231)
03 03 ff ff   colour, blue green red alpha: Player 1's red
```

The layout and the icon types (0 gold mine, 1 neutral building, 2 start location) are wc3libs' (`MMP.java`). The coordinates fit a 256-pixel frame over the playable area, `y` from the top (Inferred, within a pixel in both maps): the Template map's start (-1408, 1728) in the playable area (-3328, -3584) to (3328, 3072) gives (73.8, 51.7), the new map's (-256, -1280) in (-1280, -1536) to (1280, 1024) gives (102.4, 230.4). The rounding rule, and the frame for a non-square playable area, are Open.

### Does a new map need them?

Neither the game's nor the editor's need is settled here (Open). HiveWE writes neither file, on a new map or on any save, and only lists both among the files it never imports (HiveWE, `src/base/imports.ixx`); the World Editor writes both on every save (Observed). Whether the lobby, the loading screen and the in-game minimap work without them, and whether the World Editor opens a folder without them and regenerates them, is a question for a human with the game (the lobby and the minimap are screen checks, [`probe/README.md`](../../probe/README.md#what-stays-for-a-human)).

## The rest of a new map

### `war3map.w3i`

Format 39, the layout HiveWE writes (`src/base/map_info.ixx`, `save_w3i`) and `reforged-map`'s reader skips through (`packages/reforged-map/src/war3map-w3i.ts`); both maps parse to their last byte with it (Observed, 375 and 381 bytes):

1. `int32` format 39, `int32` saves, `int32` editor version (7000, 7003), `int32[4]` game version (3.0.0.24268, 3.0.1.24371).
2. `cstring` name, author, description, recommended players.
3. `float32[8]` camera bounds (left-bottom, right-top, left-top, right-bottom), `int32[4]` their complements (left, right, bottom, top), `int32` playable width and height.
4. `int32` flags, `char` main tileset.
5. `int32` loading screen number, `int32` (format 39; HiveWE "loading screen source", wc3libs a crest race), `cstring` loading screen model, text, title, subtitle; `int32` Game Data Set.
6. `cstring` prologue model, text, title, subtitle; `int32` fog style, `float32` fog start, end, density, `ubyte[4]` fog colour, `char[4]` weather; format 39: `int32`, `float32` × 3, `int32` × 2 of fog.
7. `cstring` sound environment, `char` light tileset, `ubyte[4]` water colour, `int32` script language, `int32` Supported Modes, `int32` Game Data Version.
8. `int32` × 3 camera distances (format 32 and 33), `int32` × 10 water settings (format 39).
9. `int32` players, each: number, type (1 User), race, a format-39 int (32758 in both maps), fixed start, `cstring` name, `float32[2]` start, `int32` × 4 ally and enemy priorities.
10. `int32` forces, each: flags, player mask, `cstring` name; then `int32` counts of upgrade availabilities, tech availabilities, random unit tables and random item tables, 0 each.

The values of a new map, and where the Template map's differ (Game Data Set -1 against 2, JASS against Lua, zoom 0 against 1250, literal against `TRIGSTR` names), are tabled in [`new-map-dialog.md`, "What else the editor fills in"](new-map-dialog.md#what-else-the-editor-fills-in). Two relations bind `war3map.w3i` to the terrain (Observed, both maps; HiveWE's `update_map_bounds_info` computes the same):

- **Playable size** = size in tiles − left − right (and − bottom − top): 64 − 12 = 52.
- **Camera bounds** = the playable area inset by 4 tiles left and right and 2 at the bottom and top: the Template map's left `(6 + 4) × 128 − 4096 = −2816`, bottom `(4 + 2) × 128 − 4096 = −3328`, right `(64 − 6 − 4) × 128 − 4096 = 2816`, top `(64 − 8 − 2) × 128 − 4096 = 2816`. The script's `SetCameraBounds` takes the playable area itself, (-3328, -3584) to (3328, 3072) (Observed, `war3map.lua`).

### `war3map.doo`

24 bytes in both maps (Observed):

```
57 33 64 6f   "W3do"
0d 00 00 00   version 13
0b 00 00 00   sub-version 11
00 00 00 00   0 doodads
00 00 00 00   special doodad version 0
00 00 00 00   0 special doodads
```

Version 13 adds to a doodad record of version 8 a group id after the skin id, an int before the creation number, and a roll, a pitch and a list of lights after it (HiveWE, `src/base/doodads.ixx`; `reforged-studio`'s `placements.ts` reads it so). HiveWE writes version 8 (HiveWE, `save_empty`); Spec documents 8/11 only.

### `war3mapUnits.doo`

131 bytes (Observed): `W3do`, version 13, sub-version **9**, one record, Player 1's start location: id `sloc`, variation 0, position (-1408, 1728, 0) in the Template map ((-256, -1280, 0) in the new map), angle 4.712 (270°, in radians), scale (1, 1, 1), skin `sloc`, group -1, flags 2, player 0, two zero bytes, life and mana as `int32`, no item set, gold 0, acquisition 0, level 0, no item, no ability, random type 0 with the bytes `01 00 00 00`, colour -1, waygate -1, creation number 0, roll 0, pitch 0, no light. The field order is HiveWE's (`src/base/units.ixx`), with no item table pointer and no hero attributes in sub-version 9.

Life and mana are 0 in the Template map and -1 in the new map (Observed); the World Editor rewrites those eight bytes as `FF` on a save ([`editor-variables.md`](../../packages/reforged-map/test/fixtures/editor-variables.md), [`editor-locales.md`](../../packages/reforged-map/test/fixtures/editor-locales.md)), so -1 is its value and the Template map's 0 an older save's (Inferred).

### `war3map.w3r`, `war3map.w3c`, `war3map.w3s`

- **`war3map.w3r`**: `07 00 00 00 00 00 00 00`, version 7, no region (Observed, both). Version 7 adds two ints per region to version 5, "block camera" and "alpha tile minimap colour" (HiveWE, `src/base/regions.ixx`); Spec documents 5.
- **`war3map.w3c`**: `03 00 00 00 00 00 00 00`, version 3, no camera (Observed, both). Version 3 adds a depth of field, a scale, an absolute Z and a free-camera flag per camera (HiveWE, `src/base/game_cameras.ixx`, which reads 0 and 3 and writes nothing); Spec documents 0.
- **`war3map.w3s`**: absent from both maps (Observed): the editor writes it only with a sound (Inferred). HiveWE reads versions 1 to 3 and writes nothing.

### `war3map.wts`

UTF-8 with a byte order mark, CRLF, one block a string (Observed; `reforged-map`'s `war3map-wts.ts` reads and writes this form):

```
STRING 1
{
Player 1
}

```

The Template map holds strings 1 to 6, 180 bytes: `Player 1`, `Force 1`, then the name `reforged-ts-templante` (sic), the recommended players `Any`, the description `Nondescript` and the author `Unknown`. The new map holds `STRING 1` and `2` for the player and the force (and 3 and 4 for its Custom unit's name and tooltip, with a comment line), the map's name and author staying literals in `war3map.w3i` (Observed).

### `war3map.wct`

310 bytes, byte-identical in both maps (Observed): `int32` `0x80000004`, `int32` sub-version 1, the custom script comment as a `cstring` ("Enter map-specific custom script code below.  This text will be included in the map script after variables are declared and before any trigger code except Custom Script Item. …", 293 characters), `int32` 0 (no custom script), then `int32` 0 for the one trigger's custom text. The layout is HiveWE's `load_scripts` and `save_scripts` (`src/base/triggers/triggers.ixx`).

### `war3map.wtg`

`WTG!`, format `0x80000004`, sub-version 7 (Observed), the layout `reforged-map` reads (`packages/reforged-map/src/war3map-wtg.ts`, after HiveWE's `load_version_31`). The Template map's 567 bytes: one map element, no library, one category, one trigger, no comment, script or variable; trigger data version 2; then three elements: the root named `Untitled 853527`, the category `Initialization`, and the trigger `Melee Initialization` ("Default melee game initialization for all players"), its event `MapInitializationEvent` and its eight actions `MeleeStartingVisibility` to `MeleeInitVictoryDefeat`. The new map's (570 bytes) differs in the root's random number (Observed).

### `war3map.lua` (or `war3map.j`)

The Template map's `war3map.lua` is 2 251 bytes, UTF-8 without a byte order mark, CRLF (Observed): `gg_trg_Melee_Initialization = nil`, an empty `InitGlobals`, the Melee Initialization trigger's functions, `InitCustomTriggers`, `RunInitializationTriggers`, `InitCustomPlayerSlots` and `InitCustomTeams` for Player 1, `main` (`SetCameraBounds` over the playable area, `SetDayNightModels` of `DNCLordaeron`, `SetHDWaterParamsEx(0, 0, 0, false, 20, 0, 100, 10, 0, 50, 100, 100)`, `NewSoundEnvironment("Default")`, the `LordaeronSummer` ambient sounds, `SetMapMusic("Music", true, 0)`, `InitBlizzard`, `InitGlobals`, `InitCustomTriggers`, `RunInitializationTriggers`) and `config` (`SetMapName("TRIGSTR_003")`, `SetPlayers(1)`, `SetTeams(1)`, `DefineStartLocation(0, -1408.0, 1728.0)`, the player slots). A new map's script is JASS, `war3map.j` (Observed, 5 204 bytes), until Map Options sets Lua ([`new-map-dialog.md`](new-map-dialog.md)). The script repeats what `war3map.w3i`, `war3mapUnits.doo` and the tileset hold: a writer that changes them rewrites it, or the World Editor does at its next save (Inferred).

### The other files and folders

- **`war3map.w3l`**: 22 bytes, `W3L!`, `int32` 3, then 14 zero bytes (Observed, both). Neither HiveWE nor wc3libs nor Spec reads it; its meaning is Open.
- **`war3map.w3grp`**: 12 zero bytes (Observed, both). Not read by HiveWE, wc3libs or Spec; Open. HiveWE leaves both out of its list of files never imported, so it would list them in `war3map.imp` (HiveWE).
- **`conversation.json`**: `{"stringTablePath": "war3map.wts", "conversation": {}}`, pretty-printed (Observed, the Template map; byte-identical in the fixtures whose provenance mentions it).
- **`_Locales/<locale>.w3mod/`**, twelve of them, and **`war3mapImported/`**: created empty on every save ([`locales.md`](locales.md), the fixtures' provenance). Git cannot hold an empty folder, so the Template map has none of them.
- **Absent until needed** (Observed): `war3map.imp` (first written with a locale table, [`locales.md`](locales.md)), the seven Object data files and their Skin files (written with a modification), `war3map.w3s`, and the gameplay constants and interface files.

## What the repository reads and writes today

| File                                                             | Read by                                                                                                    | Written by                                                                                     |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `war3map.lua`                                                    | `reforged-map` (`map-folder.ts`, `war3map-lua.ts`: the Editor globals); the Template's stage and compose    | the Template's build, into the staged copy only; `probe/src/players.ts`, staged copy only       |
| `war3map.wtg`                                                    | `reforged-map` (`war3map-wtg.ts`: header and variables, format `0x80000004`/7 only)                          | nobody                                                                                         |
| `war3map.wts`, `_Locales/*/war3map.wts`                          | `reforged-map` (`war3map-wts.ts`)                                                                          | `reforged-map`'s Object data editor (ADR 0015)                                                 |
| `war3map.w3i`                                                    | `reforged-map` (`war3map-w3i.ts`: the Game data set and the Supported Modes; formats 18 to 39)             | `probe/src/game-data.ts` and `probe/src/players.ts`, in a staged copy only, format 39 only     |
| `war3map.imp`                                                    | `reforged-map` (`war3map-imp.ts`, format 1); the Template's `pack.ts` keeps it                              | `reforged-map`, for the locale tables                                                          |
| Object data and Skin files                                       | `reforged-map` (`object-data.ts`)                                                                          | `reforged-map` (`object-data-writer.ts`, `object-data-editor.ts`)                              |
| `war3map.doo`, `war3mapUnits.doo`                                | `reforged-studio` (`placements.ts`: versions 7, 8 and 13, counts by Rawcode)                                | nobody                                                                                         |
| `war3map.w3e`, `.wpm`, `.shd`, `war3mapMap.blp`, `.mmp`, `.w3r`, `.w3c`, `.w3s`, `.wct`, `.w3l`, `.w3grp`, `conversation.json` | nobody | nobody; the Template's stage and pack copy them byte for byte (`scripts/pack.ts` stores every editor file as is) |

`create-reforged-map` only moves the Template's map folder and points `mapFolder` at it (`src/map-folder.ts`). Nothing writes a map folder from nothing today (Observed).

## What an empty-map writer needs

From the above (Inferred): every file but `war3map.w3e`'s variations, `war3mapMap.blp` and `war3map.wtg`'s root name is a function of the size, the tileset, the playable margins and the start location; the minimap's JPEG needs an encoder and a rendering rule, unless the game and the editor accept a map without it.

- `war3map.w3e`: the header, then `(W + 1) × (H + 1)` corners of height `0x2000`, water word `0x2000` (`0x6000` on the edge, by the rule above), texture word 0, a variation, and `0xF2`.
- `war3map.wpm`: `MP3W`, 0, `4W`, `4H`, then `0x40` or `0xCE` per cell by the tile's bottom-left corner (for a map without water, cliffs or blight on a tile that is walkable, flyable and buildable).
- `war3map.shd`: `16 × W × H` zero bytes.
- `war3map.w3i`: format 39 with the bounds, complements and playable size derived from the size; values from [`new-map-dialog.md`](new-map-dialog.md).
- `war3map.doo`, `war3map.w3r`, `war3map.w3c`, `war3map.wct`, `war3map.w3l`, `war3map.w3grp`, `conversation.json`: the constant bytes above.
- `war3mapUnits.doo`, `war3map.mmp`: the start location's position.
- `war3map.wts`, `war3map.wtg`, the script: as the editor writes them for the map's players and options.

## What only the editor or the game can settle

1. **The minimap's need** (human with the game and the World Editor): a map without `war3mapMap.blp`, and one without `war3map.mmp`, in the lobby's preview, the loading screen and the in-game minimap; and whether the World Editor opens such a folder and writes both again at its next save.
2. **The minimap's rendering**: how the editor colours the 256 × 256 image (per tile, per variation, lit or not), and the frame and rounding for a non-square playable area: a few saved maps of other sizes and tiles.
3. **What the game reads of the terrain files**: whether it reads the pathing from `war3map.wpm` or recomputes it from the tiles, whether it needs `war3map.shd`, and what it does with the `0x40` and `0x80` bits and the custom tileset field (Probe runs reading `IsTerrainPathable` on a map whose `wpm` disagrees with its tiles).
4. **`war3map.w3l` and `war3map.w3grp`**: what they hold once they are not empty, and whether the editor or the game misses them: a map saved with lights, groups or layers in the World Editor, and one with each file removed.
5. **The ground variations**: whether the editor's random draw is seeded or can be matched, and whether the game cares which variation a corner stores (a screen check).
6. **The defaults the dialog chose**: the initial tile (texture 0, `Ldrt`, in both maps), cliff level (layer 2) and water level (`0x2000`), per [`new-map-dialog.md`](new-map-dialog.md), items 5 and 6 of its list.
7. **The last row and column of corners**: whether the World Editor ever sets the map-edge bit there, for example after Scenario > Map Size and Camera Bounds changes the margins.

## Sources

- **HiveWE**: [stijnherfst/HiveWE](https://github.com/stijnherfst/HiveWE), branch `main` as fetched on 2026-11-27 through `raw.githubusercontent.com` (the commit could not be pinned from this session; [`new-map-dialog.md`](new-map-dialog.md) read `8c3d323f`), AGPL-3.0, facts only: `src/base/terrain.ixx`, `src/base/pathing_map.ixx`, `src/base/shadow_map.ixx`, `src/base/map_info.ixx`, `src/base/doodads.ixx`, `src/base/units.ixx`, `src/base/regions.ixx`, `src/base/game_cameras.ixx`, `src/base/sounds.ixx`, `src/base/imports.ixx`, `src/base/trigger_strings.ixx`, `src/base/triggers/triggers.ixx`, `src/base/tilesets.ixx`, `src/base/map/map.ixx`, `src/file_formats/blp.ixx`, `src/main_window/hivewe.cpp` (`new_map`, which writes `war3map.w3i`, `war3map.wts`, `war3map.w3e` and `war3map.doo` before loading the map).
- **wc3libs**: [inwc3/wc3libs](https://github.com/inwc3/wc3libs), branch `master` as fetched on 2026-11-27, Apache-2.0: `src/main/java/net/moonlightflower/wc3libs/bin/app/` `MMP.java`, `SHD.java`, `WPM.java`, `W3E.java`, `DOO_UNITS.java`.
- **WC3MapSpecification**: [ChiefOfGxBxL/WC3MapSpecification](https://github.com/ChiefOfGxBxL/WC3MapSpecification), branch `master` as fetched on 2026-11-27: `README.md`, `Terrain/12.md`, `Info/0-33.md`, `Doodads/8_11.md`, `Regions/5.md`, `Cameras/0.md`.
- **The maps**: `reforged-ts-template.w3m` in the Template's working copy, and the fixtures named [above](#the-maps-read).
- Two published format notes, `867380699.github.io` ("W3X Files Format") and `www.xgm.guru` ("warcraft 3 map files format"), were outside this session's network and were not read.
