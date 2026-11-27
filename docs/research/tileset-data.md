# Where a tileset's tiles, cliffs and default palette come from

Which game files define the tilesets, their ground tiles, their cliff types and their water, what the World Editor offers as a new map's initial tile and cliff level, and what the workspace already reads of them, researched for [#1049](https://github.com/phmilk/reforged-ts/issues/1049). This container has no game install, so no file of Patch 3.0.1 was read: the game's data comes from published copies of older Builds and from the code of editors that read it. Each claim is marked **Confirmed** (the cited source shows it), **Inferred** (follows from confirmed facts, not shown by any source) or **Unconfirmed** (one secondary source, or recall, and to be checked on the install or on screen).

## TL;DR

- **Four files define tilesets** (Confirmed, HiveWE and mdx-m3-viewer read exactly these): `UI/WorldEditData.txt`, section `[TileSets]`, lists the tilesets, one key per tileset letter whose value is the `WESTRING_` key of its name and its blight texture; `TerrainArt/Terrain.slk` the ground tiles; `TerrainArt/CliffTypes.slk` the cliff types; `TerrainArt/Water.slk` each tileset's water, in the row `<letter>Sha`. Names resolve through the enUS editor strings, which the workspace already reads.
- **No game file lists a tileset's default palette** (Confirmed for the 1.27 copy of `WorldEditData.txt`: its `[TileSets]` values have two items, name and blight texture, and no other section names tiles). A tileset's tiles are the `Terrain.slk` rows whose tile id starts with its letter, in the file's order; that is HiveWE's rule (Confirmed), and that the World Editor uses the same rule is **Unconfirmed**. In the copy of `Terrain.slk` read, it gives 6 to 9 tiles per tileset and every row of a letter shares one texture folder.
- **A cliff type pairs with a ground tile through `CliffTypes.slk`'s `groundTile`** (Confirmed in HiveWE's reader). A map's cliff list is derived, not chosen: the World Editor adds the cliff type of each tile of the ground list that has one (Confirmed in the HiveWE wiki; HiveWE does the same). In the copy of `Terrain.slk` read, each tileset has exactly two cliff-capable tiles, a dirt one and a second one (grass, snow, square tiles…).
- **Limits**: a `war3map.w3e` of format 11 stores a ground tile in 4 bits, so 16 ground tiles; format 12, which Reforged writes, stores 6 bits, so 64 (Confirmed, HiveWE and w3e-rs). A cliff texture is 4 bits with 15 meaning none, so at most 15 cliff types (Confirmed). Whether the 3.0.1 World Editor still caps the palette at 16 is **Unconfirmed**: a screen check.
- **Initial tile and cliff level**: a new map's points are at layer height 2, the "layer zero" (Confirmed in the HiveWE wiki and HiveWE's blank map), with no cliff texture (15). Which tiles the New Map dialog lists as its initial tile is **Unconfirmed**: it is a screen check for a human (`probe/README.md`, "What stays for a human").
- **The workspace reads none of it yet.** `reforged-studio` has every reader the extraction needs (CASC storage, SLK, profile files, the editor strings, and `UI/WorldEditData.txt` already for categories); `reforged-builtins`' generator reads none of these files, and no package reads `war3map.w3e` or the tileset byte of `war3map.w3i`.
- **What it would add to the committed index**: about 180 tile ids, 18 tileset letters and about 36 cliff type ids with their enUS names, some 20 to 25 KB of JSON next to the 768 KB `3.0.1/index.json`, and four or five more inputs in `provenance.json`. The ids and names fit ADR 0013's "derived identifiers"; the pathing flags, water colours and texture paths are numbers and art paths, which it excludes.

## The game files

### `UI/WorldEditData.txt`: the tilesets

A profile file (`[Section]`, `Key=Value`). The copy read is the 1.27 file of [xxxxue/War3_WorldEditor_1.27_Chinese_Translation](https://raw.githubusercontent.com/xxxxue/War3_WorldEditor_1.27_Chinese_Translation/master/WorldEditData.txt), whose `[TileSets]` section and the sections keyed by tileset letter are untranslated identifiers (Confirmed):

- `[TileSets]`: 18 keys, one per tileset letter, each a `WESTRING_` key and a blight texture path: `L=WESTRING_LOCALE_LORDAERON_SUMMER,TerrainArt\Blight\Lords_Blight`. The letters, in the file's order: `A B K Y X J D C I F L W N O Z G V Q`.
- `[TerrainLights]`, `[UnitLights]`, `[DayAmbience]`, `[NightAmbience]`, `[SoundEnvironment]`: one key per letter, the tileset's day/night models, ambience and sound environment. HiveWE reads these five (Confirmed, `src/base/tilesets.ixx`, `load_tilesets`).
- `[TerrainCellRarity]`: the weight of each ground variation (`00=85`, `01=10`, `02=4`, `03=1`, …, `16=85`, `17=85`), the editor's random variation of a tile.
- `[MapSizes]`, `[CliffBrushes]`, `[MiscBrushes]`, `[Palette]`: the editor's map sizes and brushes; `[Palette]` holds only button sizes.

No section lists a tileset's tiles (Confirmed for this copy). The 3.0.1 copy is read by the Studio already, for `[DestructibleCategories]` and `[DoodadCategories]` (#908, `packages/reforged-studio/src/game-data.ts`), so its sections are one install read away; that 3.0.1 has the same `[TileSets]` shape is **Inferred** (HiveWE, which reads Reforged installs, parses exactly name then blight texture).

The tileset letters and names, as the HiveWE wiki lists them ([war3map.w3e Terrain](https://raw.githubusercontent.com/wiki/stijnherfst/HiveWE/war3map.w3e-Terrain.md), Confirmed for the letters): A Ashenvale, B Barrens, C Felwood, D Dungeon, F Lordaeron Fall, G Underground, L Lordaeron Summer, N Northrend, Q Village Fall, V Village, W Lordaeron Winter, X Dalaran, Y Cityscape, Z Sunken Ruins, I Icecrown, J Dalaran Ruins, O Outland, K Black Citadel. The enUS names themselves are the values of the `WESTRING_LOCALE_*` keys in `UI/WorldEditStrings.txt`, which this research did not read.

### `TerrainArt/Terrain.slk`: the ground tiles

The copy read is the `Terrain.slk` of [sunenilausen/robertsrebellionwc3](https://raw.githubusercontent.com/sunenilausen/robertsrebellionwc3/master/Terrain.slk), a map project's copy of an unknown pre-Reforged Build, perhaps edited by that project (**Unconfirmed** as the game's own). It has 177 rows and 14 columns: `tileID`, `cliffSet`, `dir`, `file`, `comment`, `name`, `buildable`, `footprints`, `walkable`, `flyable`, `blightPri`, `convertTo`, `InBeta`, `version`.

- `tileID`: four characters, the first the tileset letter (`Ldrt`, `Ldro`, `Ldrg`, `Lrok`, `Lgrs`, `Lgrd` for Lordaeron Summer). This is the id `war3map.w3e` stores (Confirmed, HiveWE wiki: "Refer to TerrainArt\Terrain.slk").
- `name`: a `WESTRING_TILE_*` key of the editor strings; `comment`: an English note (`Dirt`). HiveWE substitutes the editor strings into the `name` column (Confirmed, `tilesets.ixx`, `load`).
- `dir` and `file`: the texture, `TerrainArt\LordaeronSummer\Lords_Dirt` (`.dds` on Reforged, Confirmed in mdx-m3-viewer's `map.ts`, which picks `.dds` or `.blp` by mode).
- `buildable`, `walkable`, `flyable`: the base pathing HiveWE derives from the tile (Confirmed).
- `convertTo`: the corresponding tile of each other tileset, used when a tileset is replaced (Inferred from the values: `Ldrt` lists `Fdrt,Wdrt,Bdsr,Adrt,…`).
- `version`: 0 or 1, the Game Data Version the tile came with, like the object data's `version` cell (`docs/research/builtins-layers.md`). Tilesets I, J, K, O and Z are version 1 (The Frozen Throne). Whether a Reign of Chaos map hides them is **Unconfirmed**.
- Per letter: A 8, B 8, C 7, D 8, F 6, G 8, I 9, J 9, K 8, L 6, N 7, O 8, Q 8, V 8, W 6, X 9, Y 9, Z 9 ground tiles, 141 in all; within a letter every row shares one `dir` (Confirmed by counting the copy).
- 36 more rows have ids `c<letter>c1` and `c<letter>c2` and a `cliffSet` of 0, 1 or 2 (every other row has -1): two per tileset, each reusing a ground tile's texture (`cLc2` is `Lords_Dirt`, `cLc1` is `Lords_Grass`). HiveWE offers them as a "Cliff Base Tiles" group in its tile setter (Confirmed, `src/menus/tile_setter.cpp`). Whether 3.0.1's file still has them is **Unconfirmed**.

### `TerrainArt/CliffTypes.slk`: the cliff types

No copy was read. Its columns, from the two programs that read it (Confirmed): an id column (`CLdi`, Lordaeron cliff dirt, the id `war3map.w3e` stores), `name` (a `WESTRING_` key, substituted from the editor strings by HiveWE), `groundTile` (the `Terrain.slk` tile at the cliff's foot), `texDir` and `texFile` (the cliff texture), `cliffModelDir` (`Cliffs` or `CityCliffs`) and `rampModelDir` (`CliffTrans` or `CityCliffTrans`). Community guides add `upperTile`, `cliffClass` and `oldID` (**Unconfirmed**: secondary sources only, the [Chinese SLK guide](https://www.cnblogs.com/zilongblog/articles/5466823.html) and the [XGM cliffs article](https://xgm.guru/p/wc3/Dobavlenie-klifov-v-kartu-Cz8), neither reachable from this container).

### `TerrainArt/Water.slk`: each tileset's water

One row per tileset, keyed `<letter>Sha` (`LSha`), read by HiveWE and mdx-m3-viewer alike (Confirmed): `height` (the water level's offset), `texFile` and `numTex` (the animated textures), `texRate`, and the shallow and deep colour ranges `Smin_R…Smin_A`, `Smax_*`, `Dmin_*`, `Dmax_*`. These are art and numbers; none of it is an identifier.

### Where the files sit in the 3.0.1 storage

HiveWE looks a path up in `war3.w3mod:_tilesets/<letter>.w3mod:<path>`, then the locale layer, then `war3.w3mod:<path>` (Confirmed, `src/base/hierarchy.ixx`), and reads the three `TerrainArt` tables through that lookup. So the tables are in the base layer or in a tileset layer; which, and whether a tileset layer overrides `Terrain.slk`, is **Unconfirmed** until the install's paths are listed (`storage.paths()`). `packages/reforged-studio/src/paths.ts` already notes that it does not read the `_tilesets` sub-layers.

## Limits

From the `war3map.w3e` format (Confirmed in the [HiveWE wiki](https://raw.githubusercontent.com/wiki/stijnherfst/HiveWE/war3map.w3e-Terrain.md), HiveWE's `src/base/terrain.ixx` and [w3e-rs](https://raw.githubusercontent.com/WarRaft/w3e-rs/main/README.md)):

- The header stores the main tileset's letter, a custom-tileset flag (1 when the ground list mixes tilesets), the ground tile ids and the cliff type ids.
- Format 11 gives a point's ground tile 4 bits: 16 usable ground tiles. Format 12, written by Reforged, gives it 6 bits: 64. HiveWE writes format 12 and lets its tile setter hold 64 tiles (`tile_setter.cpp`).
- A point's cliff texture is 4 bits, and 15 means none: at most 15 cliff types. HiveWE caps the cliff list at 15 in its tile setter and keeps at most 14 when it rebuilds the list.
- The 16-tile limit is the World Editor's palette limit in the classic editor; whether the 3.0.1 editor raised it with format 12 is **Unconfirmed** (a screen check).

## Initial tile, cliff level and the cliff pairing

- **The cliff list follows the ground list.** "The cliff tile list is actually ignored, the World Editor will simply add the cliff tiles for each tile in the ground tile list, if a cliff version of this ground tile exists" (Confirmed, HiveWE wiki). HiveWE links a cliff type to the ground tile its `groundTile` names, and rebuilds the cliff list from the ground list's tiles in order (Confirmed, `tilesets.ixx` and `terrain.ixx`, `change_tileset`).
- **The pairing per tileset**: two cliff-capable tiles each (Inferred from the 36 `c…` rows and their textures: Lordaeron Summer's are its dirt `Ldrt` and grass `Lgrs`, matching the cliff ids `CLdi` and `CLgr`). That the 3.0.1 `CliffTypes.slk` pairs exactly these is **Unconfirmed**.
- **Layer height**: a point's layer height is 4 bits, and 2 is "layer zero"; the height the editor shows is `(ground_height - 8192 + (layer - 2) * 512) / 4` (Confirmed, HiveWE wiki). HiveWE's blank map sets every point to layer 2, no cliff texture (15) and ground height 8192, the level 0 (Confirmed, `terrain.ixx`, `save_blank`).
- **HiveWE's blank map is HiveWE's, not the World Editor's**: it writes Lordaeron Summer with the ground list `Ldrt, Ldro, Ldrg, Lrok, Lgrs, Lgrd` (the six `L` rows of `Terrain.slk`, in order), the cliff list `CLdi, CLgr`, and fills it with `Lgrs` (Confirmed). Its "reset to base tileset" fills the ground list with every tile whose id starts with the letter (Confirmed, `tile_setter.cpp`, `reset_to_default`).
- **The World Editor's New Map dialog**: which tiles it lists as the initial tile, whether the list is the tileset's `Terrain.slk` rows (only the ground ones, or also the cliff-capable ones), its default choice, and the initial cliff level it writes are **Unconfirmed**. They are what the editor shows, so a human checks them on screen; a Probe cannot, since no Native reads the editor's dialog. A saved new map's `war3map.w3e` would settle the written part (ground list, cliff list, layer height) without the screen, read with a `w3e` reader the workspace does not have.

## What the workspace already extracts

- **`reforged-studio`** (`packages/reforged-studio/src`):
  - `casc/storage.ts`: opens an install's CASC storage, lists every path of its root (`paths()`) and reads any file by path, checked against its content key. Nothing in it is specific to object data, so `TerrainArt/*.slk` and `UI/WorldEditData.txt` read as any other file.
  - `slk.ts`: `parseSlk`, row 1 as column names and each later row by its first cell: `Terrain.slk`, `CliffTypes.slk` and `Water.slk` parse with it as they are (Inferred: the copy above uses only the `C` records with `X`, `Y` and `K` fields that `parseSlk` reads).
  - `profile.ts`: `Profile`, the profile-file reader with `keys(section)`, `items`, `first`; `game-data.ts` reads `War3.w3mod:UI/WorldEditData.txt` with it already, for its two category sections, and resolves `WESTRING_` keys through `EDITOR_STRINGS` (`layers.ts`), which hold the `WESTRING_TILE_*` and `WESTRING_LOCALE_*` names.
  - `install.ts`: finds the install; `layers.ts`: the base, `_Balance` and enUS layers, no tileset layer.
  - Nothing reads `TerrainArt/`, `[TileSets]` or a `_tilesets` layer (`grep -ri "tileset\|TerrainArt"` over `packages/*/src`).
- **`reforged-builtins`' generator** (`packages/reforged-builtins/src/generate.ts`, `fields.ts`): reads the seven Object kinds' SLK and profile files, `UI/UnitEditorData.txt` and the two editor-strings files, and records each in `3.0.1/provenance.json` (path, content key, sha256, size). It reads no `TerrainArt` file and not `UI/WorldEditData.txt`. Its only tileset trace is the metadata type `tilesetList`, which the field table maps to a string list (`fields.ts`); which fields carry that type was not checked.
- **`reforged-map`**: `war3map-w3i.ts` skips the main tileset byte and the light tileset byte of `war3map.w3i`; no package reads `war3map.w3e`.

## What extracting tilesets would add to the index

ADR 0013 ships, per Game version, the identifiers code needs to name Built-in objects and their enUS names, never "tooltip prose, numbers and icons", and pins every input in `provenance.json`; its amendments added the field table on the same terms. A tileset extraction in the same shape:

- **Content**: the 18 tileset letters with their enUS names (`[TileSets]` and the editor strings); about 180 tile ids (141 ground tiles and the 36 `c…` rows in the copy read), each with its tileset letter, its enUS name, its Game Data Version and, for a cliff-capable tile, its cliff type id; about 36 cliff type ids with their enUS names and `groundTile`. The palette order is `Terrain.slk`'s row order, if the World Editor's rule is confirmed.
- **Out, under ADR 0013**: pathing flags, `blightPri`, water heights and colours, texture and model paths, lights and ambience. They are numbers and art; a Studio that renders terrain reads them from the developer's install at run time, as the hover tool reads icons.
- **Size**: one line per tile in the index's style (`"Ldrt": {"tileset":"L","name":"Dirt","sets":[…]}`) is about 100 bytes; 177 lines measure about 18 KB, and the tilesets and cliff types about 4 KB more: some 22 KB, about 3 % of `3.0.1/index.json` (768,615 bytes). A separate `tilesets.json` beside `index.json` would keep `INDEX_FORMAT` at 1; adding them to `index.json` changes its shape.
- **Provenance**: four or five more inputs, `UI/WorldEditData.txt`, `TerrainArt/Terrain.slk`, `TerrainArt/CliffTypes.slk`, and `TerrainArt/Water.slk` only if a water fact is kept; the editor strings are pinned already. A tileset layer that overrides one of them would add its file too.
- **ADR**: tiles are not Object kinds and have no `FourCC` overload or `Rawcode<kind>`, so shipping them is an amendment of ADR 0013 (a new kind of identifier, as the field table was), not a consequence of it (Inferred).

## Open points

1. The 3.0.1 install's own files: `[TileSets]`, the `Terrain.slk` rows (Forsaken Kingdom may add tiles or tilesets), the `CliffTypes.slk` rows and their `groundTile`, and whether they sit in the base layer or a `_tilesets` layer. One generator run on a maintainer's machine settles all of it.
2. The World Editor's palette rule (letter prefix, or something else) and its limit (16 or 64) in 3.0.1: a screen check.
3. The New Map dialog: its initial tile list and default, and the layer height and cliff list it writes: a screen check, or a saved new map's `war3map.w3e`.
4. Whether a Reign of Chaos map hides the tiles and tilesets of `version` 1.

## Sources

- HiveWE, AGPL-3.0, read for facts only, `main` on 2026-11-27: [`src/base/tilesets.ixx`](https://raw.githubusercontent.com/stijnherfst/HiveWE/main/src/base/tilesets.ixx), [`src/base/terrain.ixx`](https://raw.githubusercontent.com/stijnherfst/HiveWE/main/src/base/terrain.ixx), [`src/menus/tile_setter.cpp`](https://raw.githubusercontent.com/stijnherfst/HiveWE/main/src/menus/tile_setter.cpp), [`src/menus/terrain_palette.cpp`](https://raw.githubusercontent.com/stijnherfst/HiveWE/main/src/menus/terrain_palette.cpp), [`src/base/hierarchy.ixx`](https://raw.githubusercontent.com/stijnherfst/HiveWE/main/src/base/hierarchy.ixx), and its wiki page [war3map.w3e Terrain](https://raw.githubusercontent.com/wiki/stijnherfst/HiveWE/war3map.w3e-Terrain.md).
- mdx-m3-viewer, MIT, `master`: [`src/viewer/handlers/w3x/viewer.ts`](https://raw.githubusercontent.com/flowtsohg/mdx-m3-viewer/master/src/viewer/handlers/w3x/viewer.ts) and [`map.ts`](https://raw.githubusercontent.com/flowtsohg/mdx-m3-viewer/master/src/viewer/handlers/w3x/map.ts).
- w3e-rs: [README](https://raw.githubusercontent.com/WarRaft/w3e-rs/main/README.md), the `war3map.w3e` formats 11 and 12.
- Copies of the game's files, of older Builds: [`WorldEditData.txt`, 1.27](https://raw.githubusercontent.com/xxxxue/War3_WorldEditor_1.27_Chinese_Translation/master/WorldEditData.txt); [`Terrain.slk`, Build unknown](https://raw.githubusercontent.com/sunenilausen/robertsrebellionwc3/master/Terrain.slk).
- The workspace: `packages/reforged-studio/src/{casc/storage.ts,slk.ts,profile.ts,game-data.ts,layers.ts,install.ts,paths.ts}`, `packages/reforged-builtins/src/{generate.ts,fields.ts,model.ts}`, `packages/reforged-builtins/3.0.1/{index.json,provenance.json}`, `packages/reforged-map/src/war3map-w3i.ts`, `docs/adr/0013-built-in-objects-ship-as-derived-identifiers-in-their-own-package.md`.
