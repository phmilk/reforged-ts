# Existing object editors and Object data libraries: read, write, round-trip fidelity and licence

Research note for ticket [#460](https://github.com/phmilk/reforged-ts/issues/460), part of the map [#457](https://github.com/phmilk/reforged-ts/issues/457). Facts only, no decision. Written 2026-10-05.

Every claim cites the primary source it was read from: a repository file at a named commit (permalink), an issue tracker, the npm registry, or a round-trip run in a scratch directory (section 4). Vocabulary from `CONTEXT.md`: **Rawcode**, **Object data**, **Built-in object** (a modified one is still a Built-in object: it lives in a file's "original" table), **Custom object** (the "custom" table, a new Rawcode derived from a base Rawcode), **Object Editor** (the World Editor's only; the editors below are "external editors").

## Answer

No existing JavaScript or TypeScript library round-trips 3.0.0 Object data faithfully. Each one fails on at least one of these: format version 3, the `war3mapSkin.*` files, ability levels and data pointers, non-ASCII strings, float precision, the per-modification end marker. The only implementations that cycle 3.0.0 World Editor files byte for byte are Java (wc3libs, Apache-2.0) and, by its own claim, the C# War3Net. HiveWE is a working, maintained external editor, but it is C++/Qt, AGPL-3.0, Windows-first, and it rebuilds every Object data file it saves. Its source says "1.33 fields not yet researched", and it writes all fields into the base file and empty `war3mapSkin.*` files. **Reusable as is: nothing for writing.** For reading, `mdx-m3-viewer-th`'s parser (MIT, already a dependency of `reforged-ts-template`) reads version 1–3 files with one set correctly, UTF-8 included. A correct writer would be new code, and its byte-level contract can be copied from wc3libs' 3.0 notes and fixtures.

| Project                                                             | Language, runtime                                 | Reads / writes                                                                            | 3.0.0 Object data (format v3)                                                                           | Round-trip fidelity (measured or from source)                                                                                                                                                                                                                                                                                                                 | Licence                                     | Maintenance                                                                                  | Reusable by reforged-ts?                                 |
| ------------------------------------------------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `mdx-m3-viewer` / fork `mdx-m3-viewer-th` 5.13.4, `parsers/w3x/w3u` | TS, browser and Node                              | R/W all 7 + `.wts`                                                                        | Reads v3 with set count 1. **Writer corrupts v3**: it writes the modification count before the set flag | v1/v2: byte-identical on every sample. v3: every file with modifications comes out unreadable, so the viewer cannot re-read its own output. `.wts` save drops BOM, comments and surrounding whitespace                                                                                                                                                        | MIT                                         | upstream last commit 2025-08-27; fork 2025-10-13; npm `mdx-m3-viewer` stuck at 5.12.0 (2021) | **Read side yes** (v1–v3, one set). Write side no        |
| `war3-objectdata-th` 0.2.11 (`cipherxof/war3-objectdata`)           | TS, Node (reads its data with `fs`)               | R/W all 7 as typed property bags                                                          | Reads v3 through the viewer. **Always writes v2**                                                       | Not byte-faithful by design: rebuilt as a diff against vendored 2.0.3 Built-in object data. Drops ability levels and data pointers (writes 0/0), and drops modifications equal to the default. Trims strings and turns `_` / `-` into `""`. Throws on unknown fields (`Crs`) and unknown base Rawcodes. Splits fields into `war3mapSkin.*` by `netsafe`       | MIT, but vendors Blizzard SLK/TXT game data | last commit 2025-09-30; levels PR #3 open and unfinished since 2024-01                       | No                                                       |
| `war3-transformer` 3.0.10 (object-data part)                        | TS, Node, TS transformer                          | through `war3-objectdata`                                                                 | as above                                                                                                | as above, plus: never loads or saves `.w3h`/`.w3q`; saves only into `dist/`                                                                                                                                                                                                                                                                                   | MIT                                         | last commit 2025-09-30                                                                       | No (ADR 0006 already dropped it)                         |
| `wc3maptranslator` 5.0.0 npm / 5.0.1 repo                           | TS, Node `Buffer` (also on JSR)                   | R/W all 7 ↔ JSON, `.wts` ↔ JSON                                                           | **v3 only** (throws on v1/v2). Writes set count 1, flag 0                                               | Byte-identical on the 3.0.0 fixtures, but only because they use the end-marker convention it hard-codes. Differs on other v3 files (end marker normalised). **Mojibake on non-ASCII strings** (reads bytes as Latin-1, writes UTF-8). Floats rounded to 3 decimals on read. Splits `war3mapSkin.*` for destructables only. `.wts`: drops BOM, LF becomes CRLF | MIT                                         | active (2026-07-12); its own issues #81, #83, #99, #111 are open                             | No (reference for JSON shape only)                       |
| `war3map` 0.1.2 (`invoker-bot/war3map`)                             | TS, Node                                          | R/W all 7                                                                                 | **Rejects v3** (asserts version 1 or 2)                                                                 | v1/v2: keeps every field, end marker included                                                                                                                                                                                                                                                                                                                 | MIT                                         | last commit 2026-04-28, "not finished"                                                       | No                                                       |
| `w3xdata` 3.1.1 (`voces/w3xdata`)                                   | TS, on `mdx-m3-viewer-th` + `wc3data`             | Read only: units and items to typed specs                                                 | through the viewer                                                                                      | n/a (read only)                                                                                                                                                                                                                                                                                                                                               | MIT (npm)                                   | 2026-05-31                                                                                   | Idea only                                                |
| **HiveWE** 0.10                                                     | C++20 / Qt, Windows (Linux port is an open issue) | Full external editor: R/W all 7 + `war3mapSkin.*` + `.wts`, saves the map folder in place | Reads v1–v3, writes v3. Reads only one set                                                              | Rebuilds each file from its tables: set count 1 / flag 0, end marker 0, floats through `std::to_string` (6 decimals). Unknown field ids are dropped on load. All fields go into the base file, and `war3mapSkin.*` get zero modifications. Saving also regenerates the map script                                                                             | AGPL-3.0                                    | very active (2026-09-22; 3.0 `w3i` v39 on 2026-09-20; object data untouched by it)           | No code reuse (licence, language). Useful as a reference |
| **w3x2lni**                                                         | Lua + C++                                         | Converts obj ↔ lni/slk                                                                    | **Reads v2 only** (returns nothing for v1 and v3); writes v2                                            | Throws away the data pointer on read, inlines `.wts` strings                                                                                                                                                                                                                                                                                                  | GPL-3.0                                     | last commit 2025-12; broken for 1.33+ since 2022 (issue #96, maintainer "doesn't have WC3")  | No                                                       |
| wc3libs (`inwc3/wc3libs`)                                           | Java                                              | R/W all 7 + skin family + `.wts`                                                          | Yes: 3.0.0 World Editor fixtures, writes the version it read (`AS_DEFINED`)                             | Byte-identical cycles asserted on 3.0.0 fixtures, end tokens and v3 header ints kept                                                                                                                                                                                                                                                                          | Apache-2.0                                  | active (3.0 support 2026-09-15)                                                              | Not as code (JVM). **Fixtures and format notes yes**     |
| War3Net (`Drake53/War3Net`)                                         | C#                                                | R/W all 7                                                                                 | Yes (`v3` "introduced in patch 1.33")                                                                   | Keeps v3 header ints and the end marker (`SanityCheck`)                                                                                                                                                                                                                                                                                                       | MIT                                         | active (2026-10-01)                                                                          | Not as code (.NET); a format reference                   |
| wc3-forge                                                           | Go + Svelte/TS (Wails)                            | External editor + MCP server, R/W all 7, saves in place                                   | Reads v1–v3, writes the version read                                                                    | Its own guarantee is Parse→Encode→Parse equal, not byte-identical; drops v3 set fields                                                                                                                                                                                                                                                                        | GPL-3.0                                     | alpha, 2026-09-05                                                                            | No                                                       |
| warcraft-vscode `objediting`                                        | Lua in Rust (mlua)                                | Lua scripts edit Object data at build                                                     | Reads v3 header, writes v2 by default                                                                   | Sorts objects by Rawcode, rebuilds end markers                                                                                                                                                                                                                                                                                                                | MIT                                         | 2026-09-14                                                                                   | No (Lua)                                                 |

What a correct library needs that these lack: see section 5. In short, it needs a lossless format layer (version as read, v3 header kept opaque, end marker, order, duplicates, raw float32, raw UTF-8, unknown fields, 3-character field ids, base file versus `war3mapSkin.*` file kept apart). On top of that it needs a semantic layer driven by the `*MetaData.slk` columns (`repeat` for levels, `data` for the data pointer, `useSpecific`/`notSpecific` for ability-specific fields, `netsafe` for the skin file). It also needs Built-in object defaults per Patch (#459) and `TRIGSTR_nnn` references resolved against a lossless `war3map.wts`. It must be tested byte for byte against files saved by the 3.0.0 World Editor.

---

## 1. Why the upstream template mis-round-tripped (ADR 0006)

ADR 0006 says the upstream template's open issues all trace to compile-time object-data editing through `war3-transformer` and its object-data library. The trackers confirm it.

- [wc3-ts-template#28](https://github.com/cipherxof/wc3-ts-template/issues/28) (2026-05-03): with `war3-transformer` 3.0.10, custom Basic and Extended tooltips set in the Object Editor are not used in game, for both Built-in and Custom objects. Removing `war3-transformer` fixes it. A contributor's diagnosis: "When `war3-objectdata` reads your map modifications ... or when it writes them back, it sometimes does it wrong."
- [wc3-ts-template#27](https://github.com/cipherxof/wc3-ts-template/issues/27) (2026-03-15): Channel's per-level fields (`Ncl1`–`Ncl6`) cannot be set: "the `tsToWar3()` function never sets `levelOrVariation` or `dataPointer` on `Modification` objects." The reporter's workaround monkey-patches `save()`. The owner answered: "This is an issue with war3-objectdata. There was a pull request to support ability levels but it seems unfinished", pointing to [war3-objectdata#3](https://github.com/cipherxof/war3-objectdata/pull/3) (open since 2024-01-02). In that PR a tester reports `Failed to get an Ability prop: ACcs:A07J => Crs` (the 3-character field id), unmodified values missing, and "Found no name for object" for about 100 upgrade Rawcodes.
- [wc3-ts-template#26](https://github.com/cipherxof/wc3-ts-template/issues/26) (2025-10-14): the README's example (Footman `modelFile` set in `compiletime`) has no effect on the starter map. The reporter attributes it to the map having no `war3map.w3u` and cites [war3-transformer `objectdata.ts` L23-26](https://github.com/cipherxof/war3-transformer/blob/0761ad62d89dde2575f95bd872e0f808d28cfc32/src/objectdata.ts#L23-L26) and [war3-objectdata `objectdata.ts` L107-110](https://github.com/cipherxof/war3-objectdata/blob/ff20dc70f735890d6d6be3d64dad0dd9a16cb0d5/src/objectdata.ts#L107-L110). (Those lines write a file whenever any object has a modification, so the root cause is not confirmed by the code cited. Not reproduced here.)
- [wc3-ts-template#17](https://github.com/cipherxof/wc3-ts-template/issues/17) (2023): `compiletime` left unexpanded in the built `war3map.lua`; a transformer failure, not Object data.
- [wc3-ts-template#9](https://github.com/cipherxof/wc3-ts-template/issues/9) (2020, closed): the request that led to `war3-objectdata` ("I already have a compile time object api in the works").

The code shows why, beyond those reports (section 2.2): the library holds each object as a flat bag of named properties with no level or data-pointer dimension, saves a diff against its vendored Built-in object data, and writes format version 2 whatever it read. The parser underneath it cannot write version 3 correctly (section 2.1).

## 2. JavaScript and TypeScript libraries

### 2.1 `mdx-m3-viewer` (flowtsohg) and the fork `mdx-m3-viewer-th` (cipherxof)

- Repos: [flowtsohg/mdx-m3-viewer](https://github.com/flowtsohg/mdx-m3-viewer) (MIT, last commit `2ff0bc0` 2025-08-27) and [cipherxof/mdx-m3-viewer](https://github.com/cipherxof/mdx-m3-viewer), whose `src/parsers/w3x` is identical to upstream (diffed). npm: `mdx-m3-viewer` 5.12.0 (last published 2021/2022), `mdx-m3-viewer-th` 5.13.4 (2025-10-13). `reforged-ts-template` already pins `mdx-m3-viewer-th` 5.13.4 for its MPQ writer.
- Browser-first: parsers take `ArrayBuffer`/`Uint8Array`, so they run in Node and in a browser.
- Object data: `War3MapW3u` (units, items, destructables, buffs) and `War3MapW3d` (doodads, abilities, upgrades: the files with the two extra ints per modification, level/variation and data pointer). The `Modification` class keeps `id`, `variableType`, `levelOrVariation`, `dataPointer`, `value`, and the trailing end marker as `u1`.
- Version 3 read: reads `sets`, then for each set a flag, a count and the modifications. It assigns `this.modifications[i]` per set, so a second set overwrites the first ([modifiedobject.ts L22-L37](https://github.com/flowtsohg/mdx-m3-viewer/blob/2ff0bc00c6363f425016e23d88c0fb2929d3b3cc/src/parsers/w3x/w3u/modifiedobject.ts#L22-L37)).
- **Version 3 write is wrong**: it writes `sets`, then the modification count, then per set the flag and the modifications ([modifiedobject.ts L58-L69](https://github.com/flowtsohg/mdx-m3-viewer/blob/2ff0bc00c6363f425016e23d88c0fb2929d3b3cc/src/parsers/w3x/w3u/modifiedobject.ts#L58-L69)). The file order is set count, flag, count. Measured (section 4): every v3 file with modifications comes out the same length but with flag and count swapped, and reloading the output throws or silently reads zero modifications.
- `War3Map.readModifications()` reads only `war3map.w3*`, never `war3mapSkin.w3*` ([map.ts L323](https://github.com/flowtsohg/mdx-m3-viewer/blob/2ff0bc00c6363f425016e23d88c0fb2929d3b3cc/src/parsers/w3x/map.ts#L323)).
- `war3map.wts`: `load` skips to the first `STRING`, so a BOM is lost. It reads each value up to the next `}` and `trim()`s it, so a value containing `}` or significant leading or trailing whitespace is altered, and comments are not kept. `save` writes `STRING n\r\n{\r\n...\r\n}\r\n\r\n` ([wts/file.ts L34-L56](https://github.com/flowtsohg/mdx-m3-viewer/blob/2ff0bc00c6363f425016e23d88c0fb2929d3b3cc/src/parsers/w3x/wts/file.ts#L34-L56)).
- Tests: the repo has no round-trip tests for these parsers.

### 2.2 `war3-objectdata-th` (cipherxof/war3-objectdata)

- [Repo](https://github.com/cipherxof/war3-objectdata) at `ff20dc7` (2025-09-30, "update package to 0.2.11"), MIT ("Copyright (c) 2021 Chananya Freiman"); `package.json` still points at `flowtsohg/war3-objectdata`. Depends on `mdx-m3-viewer-th` for parsing. 5 stars; merged PRs: "1.33 fixes" (2023), alias inheritance (2024), "update unit wc3 data to 2.0.0.22389", "Update to 2.0.3.23101".
- **Vendors Blizzard game files** under `objectdata/` (`units/*.slk`, `*func.txt`, `*skin.txt`, `_locales/enus.w3mod/...strings.txt`, `doodads/*`) inside an MIT repository. They are Blizzard's, not the author's to license. This is relevant to [#459](https://github.com/phmilk/reforged-ts/issues/459).
- Model: a generator turns the metadata SLKs into typed containers whose properties carry only `{ id, name, type, netsafe }`. There is no `repeat`, `data` or `index` ([generator.ts L69](https://github.com/cipherxof/war3-objectdata/blob/ff20dc70f735890d6d6be3d64dad0dd9a16cb0d5/src/generator/generator.ts#L69)), so a field has one value, not one per level.
- Load: each modification is matched by field id to a property name and assigned. Levels of the same field overwrite each other. An unknown field id throws `Failed to get an Ability prop` ([container.ts L53-L56](https://github.com/cipherxof/war3-objectdata/blob/ff20dc70f735890d6d6be3d64dad0dd9a16cb0d5/src/container.ts#L53-L56)), and an unknown base Rawcode throws `Failed to load an object` ([container.ts L123-L127](https://github.com/cipherxof/war3-objectdata/blob/ff20dc70f735890d6d6be3d64dad0dd9a16cb0d5/src/container.ts#L123-L127)). Strings are `trim()`med, and `_` and `-` become `""` ([utils.ts L15-L33](https://github.com/cipherxof/war3-objectdata/blob/ff20dc70f735890d6d6be3d64dad0dd9a16cb0d5/src/utils.ts#L15-L33)).
- Save: for each object it emits a modification only where the value differs from the vendored Built-in object ([container.ts L64-L106](https://github.com/cipherxof/war3-objectdata/blob/ff20dc70f735890d6d6be3d64dad0dd9a16cb0d5/src/container.ts#L64-L106)). Fields with `netsafe` go to the `Skin` file. `tsToWar3` creates a `Modification` with level, data pointer and end marker all 0 ([utils.ts L112-L165](https://github.com/cipherxof/war3-objectdata/blob/ff20dc70f735890d6d6be3d64dad0dd9a16cb0d5/src/utils.ts#L112-L165)). Every file is written with `file.version = 2` ([utils.ts L181](https://github.com/cipherxof/war3-objectdata/blob/ff20dc70f735890d6d6be3d64dad0dd9a16cb0d5/src/utils.ts#L181)). Writing v2 sidesteps the viewer's broken v3 writer. Whether the 3.0.0 World Editor and game accept v2 files back without converting them was not verified.
- New Custom object Rawcodes are random (`generateId`, capital first letter when the base's is, for heroes).
- Tests: `test/main.ts` loads `test/testmap.w3m`, prints a few objects, edits two and prints `save()`'s result. No assertions, no round-trip check.
- Runtime: the generated containers read their JSON with `readFileSync` ([generator.ts L310](https://github.com/cipherxof/war3-objectdata/blob/ff20dc70f735890d6d6be3d64dad0dd9a16cb0d5/src/generator/generator.ts#L310)), so it needs Node or a bundler shim.

### 2.3 `war3-transformer` (object-data part)

[`src/objectdata.ts` at `0761ad6`](https://github.com/cipherxof/war3-transformer/blob/0761ad62d89dde2575f95bd872e0f808d28cfc32/src/objectdata.ts) (MIT, 2025-09-30). It loads `war3map.w3u/.w3t/.w3b/.w3d/.w3a` and their `war3mapSkin.*` files, but **not `.w3h` or `.w3q`** (L16-L81), and saves the same subset into the output directory (L83-L125). Buff and upgrade edits made in `compiletime` are therefore never written. Everything else is `war3-objectdata`'s behaviour. The Template-level history is in [template-landscape.md](https://github.com/phmilk/reforged-ts/blob/research/template-landscape/docs/research/template-landscape.md) section 1.3.

### 2.4 `wc3maptranslator` (ChiefOfGxBxL/WC3MapTranslator)

- [Repo](https://github.com/ChiefOfGxBxL/WC3MapTranslator) at `7d477eb` ("Create v5.0.1", 2026-07-12), MIT, 121 stars. npm `wc3maptranslator` latest is 5.0.0 (2025-12-21); 5.0.1 is on the repo and JSR (`@chiefofgxbxl/wc3maptranslator`). Node ≥ 24, uses `Buffer`. The 5.0.0 changelog adds a CLI and "another set of round-trip tests".
- Object data: [`ObjectsTranslator.ts`](https://github.com/ChiefOfGxBxL/WC3MapTranslator/blob/7d477ebb5cea445bee7915fe72cd93ee399252b7/src/translators/ObjectsTranslator.ts). Reading accepts **only format 3** (`expectVersion(3, ...)` L314; a v2 file throws "cannot currently parse this version"). Writing emits version 3 (L93-L94) and set count 1 / flag 0 (L163-L165), and **reads and discards the v3 header ints and the end marker**. It writes the end marker back by convention: base Rawcode for Built-in objects, `00000000` for Custom objects (L135-L144). Level and variation share one JSON field. Only destructables get a `war3mapSkin` split, from a hard-coded list of 30 field ids (L69-L78). Its open issue [#111](https://github.com/ChiefOfGxBxL/WC3MapTranslator/issues/111) notes the other six types may have skin files too. Reading the base and skin files merges them into one JSON.
- Strings: `readString` decodes byte by byte with `String.fromCharCode` (Latin-1), while `addString` writes UTF-8 ([W3Buffer.ts L35-L46](https://github.com/ChiefOfGxBxL/WC3MapTranslator/blob/7d477ebb5cea445bee7915fe72cd93ee399252b7/src/W3Buffer.ts#L35-L46)). Every non-ASCII string is corrupted on a round-trip: open issues [#81](https://github.com/ChiefOfGxBxL/WC3MapTranslator/issues/81), [#83](https://github.com/ChiefOfGxBxL/WC3MapTranslator/issues/83), [#99](https://github.com/ChiefOfGxBxL/WC3MapTranslator/issues/99), and reproduced in section 4.
- Floats: `readFloat` returns `roundTo(float, 3)` ([W3Buffer.ts L32](https://github.com/ChiefOfGxBxL/WC3MapTranslator/blob/7d477ebb5cea445bee7915fe72cd93ee399252b7/src/W3Buffer.ts#L32)), so a value such as 0.0625 is written back changed. Open issue #102 is about "float rounding issues".
- Tests: [`TranslatorReversion.test.ts`](https://github.com/ChiefOfGxBxL/WC3MapTranslator/blob/7d477ebb5cea445bee7915fe72cd93ee399252b7/test/TranslatorReversion.test.ts) asserts json→war→json equality and war→json→war byte equality on its own fixtures (`test/data/war3map.w3*`, all v3 with ASCII strings and the end-marker convention above).
- No field metadata: modifications stay raw (`id`, `type`, `value`, `level`, `column`). No `.wts` resolution, no Built-in object defaults.

### 2.5 Others found

- **`war3map`** ([invoker-bot/war3map](https://github.com/invoker-bot/war3map), MIT, npm 0.1.2, 2026-04-28, "Not finished yet, please wait until version >= 1.0.0"). It claims byte-for-byte round trips for many map files, but `ObjectsObject.read` asserts version 1 or 2 ([ObjectsObject.ts L33](https://github.com/invoker-bot/war3map/blob/0b560618b0c8dc493712006be2a97b26b2a5a101/src/ObjectsObject.ts#L33)), so 1.33+ and 3.0.0 Object data is rejected. For v1/v2 it keeps each modification's level, data pointer and end marker.
- **`w3xdata`** ([voces/w3xdata](https://github.com/voces/w3xdata), npm MIT 3.1.1, 2026-05-31). Read only: applies `war3map.w3u`/`.w3t` (via `mdx-m3-viewer-th`) to Built-in object specs from the `wc3data` package, resolves `TRIGSTR` through `.wts`, honours the metadata `useUnit`/`useHero`/`useItem` flags, and warns on unknown fields ([util.ts](https://github.com/voces/w3xdata/blob/3a029cc362fae3bc4b88eb0cc3b69e6b9bf89fbf/src/util.ts)). Units and items only. Its approach (Built-in object specs plus a map's modifications, giving typed objects with names) is the read path #465 needs.
- **`@wesleyel/war3parser`** (Rust to WebAssembly, MIT, 2026-08) parses `w3i`/`wts`/`blp` for a map-archive website. No Object data writer listed in its README. Not examined further.
- **`mopaq`** (MIT, 2026-10-01): an MPQ library for Node and browsers. MPQ only, no Object data.
- Not open source or not examined: "War3 Object Editor 0.7.1" (Hive download, mentioned in WC3MapTranslator #81 as failing to parse a file), and Object Merger.

## 3. External editors

### 3.1 HiveWE

- [stijnherfst/HiveWE](https://github.com/stijnherfst/HiveWE) at `cbfd6b3` (2026-09-22), **AGPL-3.0**, 477 stars, releases 0.7–0.10 (2025-09 to 2026-05). C++20 modules + Qt, built with Visual Studio. A Linux port is an open issue ([#146](https://github.com/stijnherfst/HiveWE/issues/146)). It reads Built-in object data from the installed game, so it has no vendored data.
- It opens a map **folder** and `save()` writes back into that folder, or copies it to a new path first ([map.ixx L622-L690](https://github.com/stijnherfst/HiveWE/blob/cbfd6b32d4dcaa5583c9f360d59617cb12531d10/src/base/map/map.ixx#L622-L690)). Saving rewrites terrain, doodads, units, all 14 Object data files, regions, `w3i`, `.wts`, triggers, gameplay constants and imports, and **regenerates the map script** (L673).
- Object data ([modification_tables.ixx](https://github.com/stijnherfst/HiveWE/blob/cbfd6b32d4dcaa5583c9f360d59617cb12531d10/src/utilities/modification_tables.ixx)):
  - Reads versions 1–3. For v3 it reads one set count and one flag and prints a message if the count is above 1, without reading further sets (L22-L28).
  - Converts modifications into SLK-style columns using the metadata `field`, `repeat` and `data` columns, so levels and data pointers survive. A modification whose id is not in the metadata is dropped ("Unknown mod id", L69-L74).
  - Writes version 3 (L14), set count 1 and flag 0 ("1.33 fields not yet researched", L120-L122), end marker 0 (L195), floats through `std::stof(std::to_string(...))`, which keeps 6 decimals.
  - Skin files: "No changes in skin files and all in main ones is a valid state, but not nice" (L124-L129). Every field goes into `war3map.w3*`, and each `war3mapSkin.w3*` gets the objects with zero modifications.
- Its 3.0 update (`9f04c14`, 2026-09-20, "Update map file parsers") touched `w3i`, doodads, units, regions and cameras, not Object data.
- Issues: [#121](https://github.com/stijnherfst/HiveWE/issues/121) (some abilities missing default fields, fixed 2025-12), [#122](https://github.com/stijnherfst/HiveWE/issues/122) (buff fields cannot be picked yet: "I haven't yet finished all the Object Editor sub menus"), [#125](https://github.com/stijnherfst/HiveWE/issues/125) (open: reset a field or object). The owner in [#111](https://github.com/stijnherfst/HiveWE/issues/111): "missing in some areas like a sound editor or a barebones unit palette but ... better than the standard WE like the object editor".
- Tests: [modification_tables_test.cpp](https://github.com/stijnherfst/HiveWE/blob/cbfd6b32d4dcaa5583c9f360d59617cb12531d10/tests/modification_tables_test.cpp) has two save-then-load checks on synthetic data. No real-file fixtures.

### 3.2 w3x2lni

- [sumneko/w3x2lni](https://github.com/sumneko/w3x2lni) at `8291651` (2025-12-18), **GPL-3.0**, Lua with a C++ host. It converts a map between obj (binary), lni (text) and slk forms. Its bundled game data is `enUS-1.27.1`, `zhCN-1.24.4` and `zhCN-1.32.8`.
- `frontend_obj.lua` returns nothing unless the version is 2 ([L117-L126](https://github.com/sumneko/w3x2lni/blob/82916514a12b7edb15252d42225cd8cc8ce61cfd/script/core/slk/frontend_obj.lua#L117-L126)). It reads the level, throws away the data pointer (L34-L40), and replaces `TRIGSTR` values with `.wts` text (L48-L49). `backend_obj.lua` writes version 2 ([L179](https://github.com/sumneko/w3x2lni/blob/82916514a12b7edb15252d42225cd8cc8ce61cfd/script/core/slk/backend_obj.lua#L179)).
- [#96](https://github.com/sumneko/w3x2lni/issues/96) "Hive ENG build broken for 1.33" (2022, open): "incompatible with the new object data format". The maintainer: "I don't even have a WC3 in my computer now." [#107](https://github.com/sumneko/w3x2lni/issues/107): "Reforged 2.0: UnitSkin.slk missing". [#112](https://github.com/sumneko/w3x2lni/issues/112) (2026-05): crashes in `frontend_w3i.lua`.

### 3.3 Others

- **wc3-forge** ([StephenSHorton/wc3-forge](https://github.com/StephenSHorton/wc3-forge), **GPL-3.0**, alpha, 2026-09-05): Go + Svelte/TypeScript in a Wails binary, with an MCP server built in. "A full Object Editor for all 7 definition kinds ... Maps save in place, including packaged `.w3x`". [`w3objmod.go`](https://github.com/StephenSHorton/wc3-forge/blob/4ce58432ec47d073822222929bdb8603c257c9fb/internal/formats/w3objmod/w3objmod.go) reads versions 1–3 and writes the version read (L90-L93). It drops the v3 set count and flag on read and writes 1/0 (L144-L153, L340-L345). Its promise is "Parse → Encode → Parse produces an equal File" (L260-L262), not byte equality. Its UI is web technology but its file handling is Go.
- **warcraft-vscode** ([warcraft-iii/warcraft-vscode](https://github.com/warcraft-iii/warcraft-vscode), MIT, 2026-09-14): a VS Code extension for Lua maps. Its `objediting/main.lua` scripts edit Object data at build time through a Lua core embedded in Rust. The reader skips the two v3 header ints ([objectreader.lua L45-L48](https://github.com/warcraft-iii/warcraft-vscode/blob/3cebe7d6eb5c6c2136f33d12b1f37bc0ee8d0569/crates/wc3-core/assets/objediting/core/objectreader.lua#L45-L48)). The writer defaults to version 2, sorts objects by Rawcode, and writes end markers by the same convention as WC3MapTranslator ([objectwriter.lua](https://github.com/warcraft-iii/warcraft-vscode/blob/3cebe7d6eb5c6c2136f33d12b1f37bc0ee8d0569/crates/wc3-core/assets/objediting/core/objectwriter.lua#L12-L100)). It is a working "objects in code" path in an editor extension, like WurstScript's (ticket #458).
- **W3ObjectEditor** ([feralshining/W3ObjectEditor](https://github.com/feralshining/W3ObjectEditor)): C# WinForms, no licence file, `.w3u/.w3a/.w3h/.w3t` with CSV import and export. Not examined further.

### 3.4 Non-JS reference implementations

- **wc3libs** ([inwc3/wc3libs](https://github.com/inwc3/wc3libs) at `0542c41`, Apache-2.0, Java, used by WurstScript). PR [#102](https://github.com/inwc3/wc3libs/pull/102) "Support Warcraft III 3.0 map formats" (2026-09-15) added empty and populated 3.0 World Editor fixtures and [docs/warcraft-iii-3.0-map-formats.md](https://github.com/inwc3/wc3libs/blob/0542c4140012dfb872ac01513ff68f5cbef98658/docs/warcraft-iii-3.0-map-formats.md). Its support matrix says `war3map.w3u` and `war3mapSkin.w3u` are "object format 3", that "base and skin unit data cycle exactly", and that the skin name is a `TRIGSTR_003` reference. The same document: "every base and skin object-modification member must retain its parsed binary version ... silently converting an older input to object format 3 is not a no-op transformation." [ObjMod.java](https://github.com/inwc3/wc3libs/blob/0542c4140012dfb872ac01513ff68f5cbef98658/src/main/java/net/moonlightflower/wc3libs/bin/ObjMod.java) keeps each modification's `endToken` and the v3 header as an opaque array (`unknownAmount` ints, then one modification list; L539-L560, L739-L752).
- **War3Net** ([Drake53/War3Net](https://github.com/Drake53/War3Net) at `18e88f0`, MIT, C#). [`ObjectDataFormatVersion`](https://github.com/Drake53/War3Net/blob/18e88f0e1f67e6b16870dcbcd827740275fe2173/src/War3Net.Build.Core/Object/ObjectDataFormatVersion.cs): `v1` (hidden), `v2` "The initial version", `v3` "Introduced in patch 1.33". [SimpleObjectModification](https://github.com/Drake53/War3Net/blob/18e88f0e1f67e6b16870dcbcd827740275fe2173/src/War3Net.Build.Core/Serialization/Binary/Object/SimpleObjectModification.cs) reads the v3 header the same way wc3libs does (a count, that many ints, then one modification list) and keeps the end marker as `SanityCheck`.
- So for a v3 set count above 1, wc3libs and War3Net read N ints and then one list, while `mdx-m3-viewer` reads N (flag, list) pairs. Every observed file has count 1 and flag 0, so the meaning of more than one set is not established.

## 4. Round-trip test (scratch directory, not the repo)

Setup: Node 24.14, npm packages `mdx-m3-viewer-th@5.13.4`, `wc3maptranslator@5.0.0`, `war3-objectdata-th@0.2.11`. Each library loaded a sample and saved it back unchanged; the output was compared byte by byte, and for `war3-objectdata` the decoded modifications were compared as tuples (table, base, new Rawcode, field, level, data pointer, type, value).

Samples:

- **3.0.0 World Editor output** (from wc3libs' 3.0 fixtures at `0542c41`, per its format notes): `war3map_v3_lumber_bounty.w3u` (148 B: `hfoo` with `ulba/ulbd/ulbs` = 1/2/3, and Custom object `h000` with the same) and `war3mapSkin_v3_lumber_bounty.w3u` (76 B: `h000`'s `unam` = `TRIGSTR_003`). Plus `war3map_v3_filled.wts`.
- Other v3 files from wc3libs (1.33–2.x saves, Patch not stated): `war3mapReforged.w3u` (167 KB), `war3map_format3.w3a`, `war3map_large_v3.w3a`, `war3mapSkin.w3a`, `threeLetterId.w3a`.
- v2 files: wc3libs `war3map.w3a`, `war3map_cfde.w3a`, `war3map.w3u` (empty), and `war3map.w3u` from `war3-objectdata`'s own `test/testmap.w3m`.
- WC3MapTranslator's own v3 fixtures `war3map.w3u` and `war3map.w3a`.

What the 3.0.0 bytes show: header `03000000`; every object has set count 1 and flag 0. **Modifications of the Built-in object end with its Rawcode (`hfoo`); those of the Custom object end with `00000000`.** In the older Reforged `war3mapReforged.w3u` the Custom object's modifications end with its own Rawcode (`n000`), so the convention has varied and a writer must keep what it read. The Custom object's name lives in `war3mapSkin.w3u`, not `war3map.w3u`.

Results:

| Sample                                                            | `mdx-m3-viewer-th` load → save                                             | `wc3maptranslator` warToJson → jsonToWar                                    | `war3-objectdata-th` load → save                                                                                                                                                  |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 3.0.0 `war3map_v3_lumber_bounty.w3u`                              | same length, differs at byte 20 (count and flag swapped); reloading throws | byte-identical                                                              | semantically equal (6/6) but written as **v2** (148 B → 132 B)                                                                                                                    |
| 3.0.0 `war3mapSkin_v3_lumber_bounty.w3u`                          | differs at byte 44; reload silently reads **0 of 1** modifications         | byte-identical                                                              | equal, written as v2 `w3uSkin` (48 B)                                                                                                                                             |
| v3 `war3mapReforged.w3u`                                          | differs; reload throws                                                     | differs at byte 44: Custom object end marker `n000` rewritten as `00000000` | throws `Failed to get an Ability prop: ewsp:x090 => wurs`                                                                                                                         |
| v3 `war3map_format3.w3a`                                          | differs; reload throws                                                     | differs at byte 96 (end marker)                                             | 220 modifications in, 176 out: **126 kept their value but lost level and data pointer (written 0/0)**, 44 not written at all (equal to the default, or levels 2+ folded into one) |
| v3 `war3map_large_v3.w3a`, `war3mapSkin.w3a`, `threeLetterId.w3a` | differ; reload throws                                                      | differ (end markers)                                                        | throw (`Failed to load an object: BNht`, `... => Crs `)                                                                                                                           |
| v2 `war3map.w3a`, `war3map_cfde.w3a`, `testmap war3map.w3u`       | **byte-identical**                                                         | throw (v2 not supported)                                                    | throw on the two `.w3a`; `testmap`: equal content, but one input file becomes two (`w3u` 178 B + new `w3uSkin` 119 B)                                                             |
| WC3MapTranslator fixtures (v3)                                    | differ; reload throws                                                      | byte-identical                                                              | `.w3a`: 2 of 2 lost level/data pointer                                                                                                                                            |
| A v3 `.w3u` with the name `Fußsoldat 步兵` (built for the test)   | differs (v3 writer) but the string reads correctly                         | reads `FuÃsoldat æ­¥åµ`; 62 B → 70 B                                        | n/a                                                                                                                                                                               |
| Same name in a v2 file                                            | byte-identical, reads correctly                                            | throws (v2)                                                                 | n/a                                                                                                                                                                               |
| 3.0.0 `war3map_v3_filled.wts` (BOM, LF)                           | not run                                                                    | 331 B → 403 B: BOM dropped, LF → CRLF; text otherwise identical             | n/a                                                                                                                                                                               |

Takeaways: on 3.0.0 files, the viewer's writer corrupts every v3 file, WC3MapTranslator is byte-faithful only on ASCII files that follow the 3.0.0 end-marker convention, and `war3-objectdata` changes the format version, ability levels and data pointers, and the file split.

<details>
<summary>The round-trip script (Node, CommonJS)</summary>

```js
const fs = require("fs");
const path = require("path");
const W3u = require("mdx-m3-viewer-th/dist/cjs/parsers/w3x/w3u/file").default;
const W3d = require("mdx-m3-viewer-th/dist/cjs/parsers/w3x/w3d/file").default;
const { ObjectsTranslator } = require("wc3maptranslator");
const { ObjectData } = require("war3-objectdata-th");

const LEVELED = new Set(["w3a", "w3d", "w3q"]);
const TYPE = {
  w3u: "units",
  w3t: "items",
  w3b: "destructables",
  w3d: "doodads",
  w3a: "abilities",
  w3h: "buffs",
  w3q: "upgrades",
};
const load = (e, b) => {
  const f = LEVELED.has(e) ? new W3d() : new W3u();
  f.load(b);
  return f;
};
const tuples = (f) =>
  [
    ["o", f.originalTable],
    ["c", f.customTable],
  ].flatMap(([t, tb]) =>
    tb.objects.flatMap((o) =>
      o.modifications.map((m) =>
        [
          t,
          o.oldId,
          o.newId,
          m.id,
          m.levelOrVariation,
          m.dataPointer,
          m.variableType,
          typeof m.value === "number" ? Math.fround(m.value) : m.value,
        ].join("|"),
      ),
    ),
  );

for (const name of fs
  .readdirSync("samples")
  .filter((f) => /\.w3[utbdahq]$/.test(f))) {
  const bytes = new Uint8Array(fs.readFileSync(path.join("samples", name)));
  const e = name.split(".").pop();
  const viewerOut = Buffer.from(load(e, bytes).save()); // 1. mdx-m3-viewer-th
  const json = ObjectsTranslator.warToJson(TYPE[e], Buffer.from(bytes)).json;
  const wc3mtOut = ObjectsTranslator.jsonToWar(TYPE[e], json).buffer; // 2. wc3maptranslator
  const od = new ObjectData(); // 3. war3-objectdata-th
  od.load({ [e]: load(e, bytes) });
  const files = od.save();
  const after = [e, `${e}Skin`].flatMap((k) =>
    files[k] ? tuples(files[k]) : [],
  );
  // compare viewerOut / wc3mtOut with bytes; compare tuples(load(e, bytes)) with after
}
```

(The run wrapped each step in try/catch and also reloaded each output; the full script and logs stayed in the scratch directory.)

</details>

## 5. What a correct library needs that these lack

Format layer (lossless, no game data needed):

1. Read versions 1, 2 and 3. Write the version that was read; only a new file gets 3. This is wc3libs' `AS_DEFINED` rule. `war3-objectdata` (always 2) and HiveWE, WC3MapTranslator and wc3-forge's defaults (always 3) break it.
2. Keep the v3 per-object header as opaque ints and fail loudly on a set count above 1, since the implementations disagree on its layout (section 3.4).
3. Keep each modification's end marker as read. The editor's convention differs between Built-in and Custom objects and has changed across Patches (section 4). HiveWE writes 0, `war3-objectdata` writes 0, WC3MapTranslator and warcraft-vscode re-derive it.
4. Keep object order, modification order and duplicates. warcraft-vscode sorts, and `war3-objectdata` rebuilds in property order.
5. Store floats as raw float32 bits. WC3MapTranslator rounds to 3 decimals, HiveWE goes through 6-decimal text.
6. Treat strings as UTF-8 bytes. WC3MapTranslator decodes as Latin-1. Do not trim, and do not map `_` or `-` to empty (`war3-objectdata` does both).
7. Keep modifications whose field id is unknown to the metadata (fields newer than the library), and NUL-padded 3-character ids such as `Crs`. HiveWE drops unknown ids; `war3-objectdata` throws on both.
8. Treat `war3map.w3*` and `war3mapSkin.w3*` as two files, and keep which file each modification came from. On 3.0.0 the Custom object's name is in the skin file. HiveWE moves everything into the base file; WC3MapTranslator splits only destructables; `mdx-m3-viewer`'s `readModifications` ignores skin files.
9. Byte-identical round-trip tests on files saved by the 3.0.0 World Editor (wc3libs' fixtures are Apache-2.0; saving fresh ones from the World Editor is also possible). None of the JS libraries has such tests.

Semantic layer (needs game data per Patch, ticket #459):

10. Field metadata from `UnitMetaData.slk`, `AbilityMetaData.slk`, `AbilityBuffMetaData.slk`, `UpgradeMetaData.slk`, `UpgradeEffectMetaData.slk`, `DestructableMetaData.slk`, `DoodadMetaData.slk`, `MiscMetaData.slk`. Their columns (read from `AbilityMetaData.slk` in war3-objectdata's copy): `ID, field, slk, index, repeat, data, category, displayName, sort, type, changeFlags, importType, stringExt, caseSens, canBeEmpty, minVal, maxVal, forceNonNeg, useUnit, useHero, useItem, useCreep, useSpecific, notSpecific, version, section, netsafe`.
11. Levels: a field with `repeat > 0` has one value per level (the modification's `levelOrVariation`). For doodads the same slot is the variation. `war3-objectdata` has no level dimension at all.
12. Data pointer: ability `Data` fields carry a column (A=1 ... I=9) that, with `field` and the level, names the SLK column (`DataA1`). HiveWE does this correctly (`data` column plus `repeat`); `war3-objectdata` writes 0; w3x2lni discards it on read.
13. Ability-specific fields: `useSpecific` / `notSpecific` list the base abilities a field applies to, so which fields an ability has depends on its base Rawcode (Channel's `Ncl1`–`Ncl6`, wc3-ts-template#27).
14. Custom objects: base Rawcode plus new Rawcode, inheriting the Built-in object's values, so reading a Custom object's effective values needs the Built-in objects of the map's Patch. Generating new Rawcodes needs a collision check and, by convention, an upper-case first letter for heroes (`war3-objectdata`'s `generateId`).
15. String references: string fields often hold `TRIGSTR_nnn`, resolved through `war3map.wts`. The `.wts` handling must itself be lossless: the 3.0.0 fixture has a UTF-8 BOM and LF line endings, and wc3libs tests comments inside values, inline braces and significant whitespace. The viewer's and WC3MapTranslator's `.wts` writers fail these.
16. "Modified to the default value" is not the same as "unmodified". Saved files contain modifications whose value equals the Built-in value: the `war3map_format3.w3a` sample has some, and `war3-objectdata` dropped them because they matched its vendored defaults. A diff-based writer loses them. The Object Editor would then presumably stop showing those fields as changed (not checked in the World Editor).

## 6. Not verified

- Whether the 3.0.0 World Editor and game accept Object data written as version 2 (`war3-objectdata`'s output) unchanged, or convert it on the next save.
- Whether any World Editor writes a v3 set count above 1, and what it means.
- Whether a `war3map.w3*` holding skin (`netsafe`) fields, as HiveWE writes them, behaves in game exactly as the editor's split does. HiveWE's own comment calls it "a valid state".
- The Patch that saved wc3libs' non-3.0 v3 samples.
- The root cause of wc3-ts-template#26.
- WC3MapTranslator's behaviour on files other than those tested, and the `@wesleyel/war3parser` and W3ObjectEditor code.
