# Model previews in the Studio: rendering a Patch's models from the developer's install

Research for [#481](https://github.com/phmilk/reforged-ts/issues/481), part of the wayfinder map [#457](https://github.com/phmilk/reforged-ts/issues/457). The question: how can the Studio show a live 3D preview of any model a field names, read from the developer's own install of the Patch, so that the Studio's spec can say what renders it and what it costs. [#476](https://github.com/phmilk/reforged-ts/issues/476) already decided that the first spec has model previews for every model field of every Object kind, both in the picker and next to the field.

Everything here was measured read-only on Patch 3.0.0.24268, on 2026-10-05. The machine was the maintainer's Windows 11 PC: `C:\Program Files (x86)\Warcraft III`, an RTX 4070 Ti SUPER, and Chrome 154 headless on ANGLE/Direct3D 11. Nothing was written to the install or the registry, and neither the game nor the World Editor was started. The prototype stayed in a scratch directory and is not committed:

- a 150-line dependency-free CASC reader in Node;
- `mdx-m3-viewer-th` 5.13.4 with small patches to six files of its parser;
- a local page and server driven by puppeteer.

## Answer

| Bullet            | Answer                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Renderer**      | No published renderer previews a 3.0 model out of the box. **Every** model of 3.0.0.24268 is MDX version **1800**: 14,982 of 14,984, in the SD, HD and DE layers alike (one is 1600, one 1700). `mdx-m3-viewer` and the Template's `mdx-m3-viewer-th` read only up to version 1000, so they throw on every 3.0 model. With small patches to six parser files (under 100 lines, layouts from HiveWE and WhiteoutLib), `mdx-m3-viewer-th` parsed **all 14,984 models** and rendered SD, HD and DE units in Chrome with animation and team colour. It is MIT and needs WebGL 1 only. It is unmaintained, its HD shader is Lambert shading with normal and ORM maps rather than the game's PBR, and it does not draw PopcornFX (`CORN`) particles, which about 30 % of HD and DE models use. Among the alternatives, `war3-model` (MIT, WebGL 2 and WebGPU, PBR) reads up to version 1100. `whiteout-js-viewer` (BSD-3, WebGPU only, behind Hive Workshop's new viewer) gained a 1300–1800 parser in September 2026, but its npm build was not verified. HiveWE (AGPL), Retera's Model Studio (MIT, Java) and the `wc3` crate (Rust) read 1800 but do not run in a browser. |
| **Files**         | Node reads the local CASC storage directly. The root file is plain text (`path\|content key\|locale\|`), so a reader without dependencies opened 174,908 paths in 0.25–0.31 s. A model, its textures, emitter models, splat tables and team-colour textures are all ordinary paths. The page's path solver turns each request into one URL served by the Studio's Node process. That process resolves the path in this order: the map folder, then the chosen art layer (`_HD.w3mod:` or `_DE.w3mod:`), then the base layer, with `.blp` and `.tif` falling back to `.dds`, then `FileAliases.json`. 95–98 % of texture references resolve this way. The rest are dangling in the game's own files, so the renderer must tolerate a missing texture. A map's imported models come first, from the map folder, layered like the game (`_hd.w3mod/<path>`, per HiveWE).                                                                                                                                                                                                                                                                                                   |
| **Object Editor** | The World Editor's own files show a **Previewer** panel in the main window, with controls for Rotate, Distance, **Animation**, Lighting and Variation and an auto-zoom preference. It also has a separate **Model Previewer** module, an "Asset Mode" preference (SD, HD, DE) and Team Color fields on units (`utco`). The model field's dialog offers Preset, Import and Custom paths. **Not verified (needs a human at the screen):** whether the Object Editor's selected object or the model dialog drives a preview, whether that preview animates, and which team colour it uses.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| **Cost**          | Times run from `load()` to the moment every texture is ready and include the CASC read. **SD:** 4–38 ms. **HD and DE units:** median 159 ms (HD) and 115 ms (DE), p90 about 300 ms; each reads 15–27 MB of DDS. **Worst seen:** the Town Hall at 924 ms in HD and 756 ms in DE, with 136 MB of textures. Rendering a frame costs under 0.1 ms, so animating the open preview is free, and PNG-encoding a 512×512 thumbnail adds about 10–30 ms. **One live preview is cheap. A thumbnail per field is not cheap uncached:** the 1,902 distinct models that Built-in objects name would take several minutes in HD. Chrome keeps at most **16** live WebGL contexts per page, so thumbnails must come from one shared renderer, rendered lazily and cached on disk per Build, art layer and path.                                                                                                                                                                                                                                                                                                                                                                        |

## Renderer

### What 3.0 models are

A census of every `.mdx` path in the root file read the `VERS` chunk of each file:

| Layer                    | Models | Version 1800 | Other                                |
| ------------------------ | ------ | ------------ | ------------------------------------ |
| base (`War3.w3mod:`, SD) | 3,464  | 3,462        | one 1600, one 1700                   |
| `_HD.w3mod:`             | 5,034  | 5,034        |                                      |
| `_HD.w3mod:_Teen.w3mod:` | 498    | 498          |                                      |
| `_DE.w3mod:`             | 5,965  | 5,965        |                                      |
| other (`_Teen`, DE teen) | 23     | 23           |                                      |
| **Total**                | 14,984 | 14,982       | 12.6 GB decompressed, read in 42.5 s |

The "SD" models of 3.0 are not version 800 any more either. They are 1800 files whose layers use the SD shader (shader type 0) and one texture each.

The **Footman** shows the three layers:

- **base:** 103 KB, one SD layer per material. Its textures are `Textures\Footman.blp` (stored as `Textures\Footman.dds`, 256×256 DXT5) and `Textures\gutz.blp`, plus replaceable texture 1, the team colour.
- **`_HD`:** 4.3 MB. Every layer uses the HD shader (type 1) with six textures. The 23 textures are named `.tif` and stored as `.dds`: diffuse in DXT1, normal in ATI2 (BC5), ORM in DXT5, an emissive placeholder `Textures/Black32`, team colour, and `ReplaceableTextures/EnvironmentMap`. The largest is 1024×2048, and they add up to 14.9 MB. The model also has chunks `CAMS`, `FAFX` (FaceFX) and `BPOS`, and 27 sequences, the cinematic ones included.
- **`_DE`:** 1.5 MB. Its materials mix the HD shader (six textures) and the SD shader (one texture). The art is the classic Footman redrawn at 1024×1024 with PBR maps, 6.5 MB of textures. In a render it looks like the classic Footman, sharper.

DDS formats over all 55,705 `.dds` files:

- **base:** DXT5 8,074, DXT1 46, ATI2 3.
- **HD:** DXT5 14,491, ATI2 4,995, DXT1 4,914, and 6 with a DX10 header (DXGI 72, BC1 sRGB).
- **DE:** the same mix, also with 6 DXGI 72 files.

No BC7 appears. `mdx-m3-viewer` decodes DXT1, DXT3, DXT5 and BC5, and rejects any other DXGI format ([dds/image.ts L9-L67](https://github.com/flowtsohg/mdx-m3-viewer/blob/2ff0bc00c6363f425016e23d88c0fb2929d3b3cc/src/parsers/dds/image.ts#L9-L67)), so those 12 files would need a small addition. Only 700 `.blp` files remain in the storage. A BLP decoder is still needed for maps' imports.

### What changed in MDX after version 1000

There is no Blizzard documentation. Three independent reverse-engineered sources agree:

- HiveWE's reader, which gained "Add MDX v1800 support" on 2026-09-22 ([a7f7d0d](https://github.com/stijnherfst/HiveWE/commit/a7f7d0d397135c654c867ca9f75ff40907600f1e));
- WhiteoutLib's [format specification](https://github.com/FernandoS27/WhiteoutLib/blob/d27bb3b7a50eeea22d311df18af90acd5896247f/docs/MDX_FILE_FORMAT_SPECIFICATION.md#L129-L145);
- the `wc3` crate's [versions.rs](https://github.com/jonathanvdc/wc3/blob/ef4f337497a7b8f3f61717c5441657c1c26348b4/crates/wc3/src/model/versions.rs).

The bytes of the Footman confirm the material layout.

| Version | Change                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1100    | The material loses its 80-byte shader name. Each layer gains a shader type (`u32`: 0 SD, 1 HD, 2 SD-on-HD, 24 crystal), a texture count, and per texture a `(texture id, slot)` pair with an optional `KMTF` track. Slots: 0 diffuse, 1 normal, 2 ORM, 3 emissive, 4 team colour, 5 environment ([HiveWE `read_MTLS_texs_post_v1100`](https://github.com/stijnherfst/HiveWE/blob/cbfd6b32d4dcaa5583c9f360d59617cb12531d10/src/file_formats/mdx/mdx_reader.cpp#L215-L294)) |
| 1200    | Lights gain a shadow intensity                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 1300    | Lights gain shadow casting, with start and end                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 1400    | `SKIN` holds 16-bit values ([L77-L86](https://github.com/stijnherfst/HiveWE/blob/cbfd6b32d4dcaa5583c9f360d59617cb12531d10/src/file_formats/mdx/mdx_reader.cpp#L77-L86))                                                                                                                                                                                                                                                                                                   |
| 1600    | Lights gain quadratic falloff, linear falloff and damping ([L370-L412](https://github.com/stijnherfst/HiveWE/blob/cbfd6b32d4dcaa5583c9f360d59617cb12531d10/src/file_formats/mdx/mdx_reader.cpp#L370-L412))                                                                                                                                                                                                                                                                |
| 1800    | The top byte of a camera's size is a variant, and variants 1 and 2 add 12 bytes ([L720-L740](https://github.com/stijnherfst/HiveWE/blob/cbfd6b32d4dcaa5583c9f360d59617cb12531d10/src/file_formats/mdx/mdx_reader.cpp#L720-L740)). New camera tracks `IDUF`, `ELAF` and `PTSF`; light tracks `KLSS`, `KLSE`, `KLQF`, `KLLF`, `KLDA`; a `DILG` chunk (9 models)                                                                                                             |

### `mdx-m3-viewer` and `mdx-m3-viewer-th`

- **Upstream** [flowtsohg/mdx-m3-viewer](https://github.com/flowtsohg/mdx-m3-viewer) is MIT. Its last commit is from 2025-08-27, its last npm release (5.12.0) from 2021, and its README says "NO LONGER ACTIVELY MAINTAINED".
- **It reads versions 800, 900 and 1000.** For any version above 800 it reads the shader name in the material ([material.ts L26-L45](https://github.com/flowtsohg/mdx-m3-viewer/blob/2ff0bc00c6363f425016e23d88c0fb2929d3b3cc/src/parsers/mdlx/material.ts#L26-L45)). On a 1800 file that read eats the `LAYS` tag, and the parser throws in `readAnimations`. Every 3.0 model fails this way, the SD ones included.
- **Version 1100 support is pending.** [PR #87](https://github.com/flowtsohg/mdx-m3-viewer/pull/87), "Support MDX version 1100", has been open since 2026-05-18. Other open pull requests: #88 (HD geoset alpha), #89 (HD team-colour blend), #90 (per-instance replaceable textures). Issue #91 (PopcornFX not rendered) is open too.
- **`mdx-m3-viewer-th` 5.13.4** ([cipherxof/mdx-m3-viewer](https://github.com/cipherxof/mdx-m3-viewer), MIT, published 2025-10-13) is upstream plus eight commits ([compare](https://github.com/flowtsohg/mdx-m3-viewer/compare/master...cipherxof:mdx-m3-viewer:updates)). They touch map terrain, `w3i` sizes and packaging, and **nothing in MDX**: its `dist/cjs/parsers/mdlx/material.js` has the same `version > 800` read.
- **The Template uses it for map files only.** `scripts/pack.ts` uses its `w3x` map parser, and its `w3i` parser also fails on the Template's version-39 `war3map.w3i`. The tarball nonetheless ships the full viewer: CJS (`dist/cjs`) and a 955 KB UMD bundle.
- **HD rendering.** A material counts as HD when its shader is `Shader_HD_DefaultUnit`, and its six layers supply the six maps ([batchgroup.ts L91-L128](https://github.com/flowtsohg/mdx-m3-viewer/blob/2ff0bc00c6363f425016e23d88c0fb2929d3b3cc/src/viewer/handlers/mdx/batchgroup.ts#L91-L128)). The HD fragment shader uses Lambert shading with normal map, occlusion, team colour and emissive. Its PBR and environment code is commented out ([hd.frag.ts](https://github.com/flowtsohg/mdx-m3-viewer/blob/2ff0bc00c6363f425016e23d88c0fb2929d3b3cc/src/viewer/handlers/mdx/shaders/hd.frag.ts#L255-L274)), so HD models look flatter than in game.
- **Particles.** SD particle emitters, ribbons and event objects (`SPN`, `SPL`, `UBR`, `SND`) work. `CORN` is parsed but not drawn.

**The prototype patch.** Changes to six files of the CJS parser of `mdx-m3-viewer-th`, under 100 lines:

- `material.js`: read the shader name only for versions 900 to 1099. For version 1100 and later, map an HD layer's six textures to the six layers and `Shader_HD_DefaultUnit` that the viewer already renders.
- `layer.js`: for version 1100 and later, read the shader type, the texture list and the per-texture `KMTF`.
- `geoset.js`: for version 1400 and later, read `SKIN` as 16 bits and narrow it to 8.
- `camera.js`: read the size variant.
- `light.js`: read the 1200, 1300 and 1600 fields.
- `animationmap.js`: add the new track tags.

With these changes the parser loaded all 14,984 models without error, in 102.5 s of parse time in Node (7 ms on average). The page rendered the Footman, Paladin, Grunt, Abomination, Town Hall and a treasure chest in all three layers, animated, with red team colour. The patch is a prototype: narrowing `SKIN` to 8 bits is wrong for models with more than 255 bones (upstream HiveWE fixed that case on 2026-09-22), and SD-on-HD and crystal shaders are drawn as SD.

### Alternatives

| Renderer                                                                                                                                           | Licence                                 | Runtime                                            | Last activity       | 3.0 (v1800)                                                                                                                                                                                        | PBR                          | PopcornFX | In a browser page                                                                                                                                                          |
| -------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- | -------------------------------------------------- | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `mdx-m3-viewer` / `-th`                                                                                                                            | MIT                                     | TypeScript, WebGL 1                                | 2025                | no (up to 1000)                                                                                                                                                                                    | no                           | no        | yes                                                                                                                                                                        |
| [`war3-model`](https://github.com/4eb0da/war3-model) 4.0.1                                                                                         | MIT                                     | TypeScript, WebGL 2 and WebGPU                     | 2026-04-02          | no: 1100 yes; 8-bit `SKIN`, no 1200+ light or camera fields ([parse.ts L457-L462](https://github.com/4eb0da/war3-model/blob/52d7f421a550/mdx/parse.ts#L457-L462)), inferred from the code, not run | yes, image-based lighting    | no        | yes                                                                                                                                                                        |
| [`whiteout-js-viewer`](https://github.com/FernandoS27/WhiteoutFlakes/blob/d2756ce11e0b/packages/whiteout-js-viewer/README.md) 0.11.0 (WhiteoutLib) | BSD-3 plus an "AI-derived works" notice | C++ compiled to wasm, **WebGPU only**, about 12 MB | 2026-09-27          | parser 1300–1800 since 2026-09-14 ([85d4209](https://github.com/FernandoS27/WhiteoutLib/commit/85d4209bc36a)); whether npm 0.11.0 includes it was **not verified**                                 | yes, from the game's shaders | claimed   | WebGPU and a secure context; behind Hive Workshop's [new viewer](https://www.hiveworkshop.com/threads/%E2%9A%99%EF%B8%8F-new-model-viewer-beta.372823/) (beta, 2026-06-17) |
| [HiveWE](https://github.com/stijnherfst/HiveWE)                                                                                                    | AGPL-3.0                                | C++, OpenGL 4.5                                    | 2026-09-22          | yes                                                                                                                                                                                                | no                           | no        | no                                                                                                                                                                         |
| [Retera's Model Studio](https://github.com/Retera/ReterasModelStudio/commit/a05f41504cdaa1a01035d58d2f702644b61e3d38)                              | MIT                                     | Java                                               | 2026-09-19 (branch) | yes, on a branch                                                                                                                                                                                   | HD path                      | no        | no                                                                                                                                                                         |
| [`wc3` / `bevy-wc3`](https://github.com/jonathanvdc/wc3)                                                                                           | MIT or Apache-2.0                       | Rust, Bevy                                         | 2026-10-03          | yes                                                                                                                                                                                                | experimental                 | claimed   | wasm build not verified                                                                                                                                                    |

No VS Code or Open VSX extension previews MDX. The only match, `Jai.vscode-preview-mdl` (2018), reads text MDL only.

**For the Studio's first spec, `mdx-m3-viewer-th` with a 1100–1800 parser patch is the low-risk choice.** It runs on WebGL 1 in any browser and in a VS Code webview, and it is MIT. The Template already depends on its package. The patch either goes upstream, where PR #87 has started on 1100, or ships as a `pnpm patch` or a small fork inside the `reforged-studio` package. This was measured here. **The cost is fidelity:** HD looks flatter than in game, and spell effects that use PopcornFX show nothing. `whiteout-js-viewer` would bring the game's look and its particles, but at WebGPU, a 12 MB wasm module and an unverified build. It is the candidate to re-evaluate once its npm release ships 1800, and once WebGPU in VS Code webviews is confirmed (not checked here). AGPL code (HiveWE) can be read for facts, as here, but cannot be copied into an MIT package.

## Files: from the CASC storage to the page

### Reading the storage from Node

The Studio's server process opens the storage the way #459 described it. It reads `.build.info` for the Build and build config, then the 16 local index files (`Data/data/*.idx`, 80,582 entries). It resolves the encoding file (138,362 content keys) and the root, which is plain text with 174,908 lines. A file is one `fs.read` at an archive offset followed by a BLTE decode, and every file in this storage is either uncompressed or zlib-compressed. The reader written for this research has no dependencies and is about 150 lines. It opened the storage in 0.25–0.31 s, and it read all 14,984 models (12.6 GB) in 42.5 s and all 55,705 DDS in 280 s.

| Way to read CASC from Node                                                                                                                                     | Licence | Cost                                                                                                                                                                                              |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A reader of our own (proven here)                                                                                                                              | ours    | About 150 lines. Local storage only. Breaks if Blizzard changes the root format: PyCASC needed a fix for 3.0's four fields (#459)                                                                 |
| [`@jamiephan/casclib`](https://www.npmjs.com/package/@jamiephan/casclib) 0.3.0 (2026-09-26), bindings to [CascLib](https://github.com/ladislav-zezula/CascLib) | MIT     | A native addon (`node-gyp-build`): pnpm's `allowBuilds` must list it, and a platform without a prebuilt binary needs a compiler. CascLib is maintained (pushed 2026-09-25) and also reads the CDN |
| `casc-cdn`                                                                                                                                                     | MIT     | Unusable (#459)                                                                                                                                                                                   |

### What one preview fetches

`mdx-m3-viewer` asks a host-supplied path solver for every file ([handlerresource.ts](https://github.com/flowtsohg/mdx-m3-viewer/blob/2ff0bc00c6363f425016e23d88c0fb2929d3b3cc/src/viewer/handlerresource.ts#L4-L9), [handler.ts L210-L375](https://github.com/flowtsohg/mdx-m3-viewer/blob/2ff0bc00c6363f425016e23d88c0fb2929d3b3cc/src/viewer/handlers/mdx/handler.ts#L210-L375)):

- **the model**;
- **its textures**, as written in the model;
- **team colour textures**: `ReplaceableTextures\TeamColor\TeamColorNN` and `TeamGlow\TeamGlowNN` for 28 players, as `.dds` because the model is newer than 800. That is 56 files on the first model, then cached;
- **particle emitter models** (`PREM`);
- **event-object tables**: `Splats\SpawnData.slk`, `SplatData.slk`, `UberSplatData.slk` and `UI\SoundInfo\AnimSounds.slk`, plus the `Dialogue*Base.slk` files for sounds;
- **the files those tables name**: spawned models such as the blood a unit spills, splat textures and sounds.

In the prototype the solver turned every path into `/casc?mode=<sd|hd|de>&path=<path>`. A Footman preview made 65 requests in SD, 86 in HD and 71 in DE, the team textures included.

The server resolves one path like this:

1. **The map folder**, for imports. HiveWE's lookup puts map files before the game's and layers them like CASC: `_hd.w3mod:_tilesets/<t>.w3mod/<p>`, `_hd.w3mod:_locales/<l>.w3mod/<p>`, `_hd.w3mod:_teen.w3mod/<p>`, `_hd.w3mod/<p>`, then the same without `_hd`, then `<p>` ([hierarchy.ixx L84-L196](https://github.com/stijnherfst/HiveWE/blob/cbfd6b32d4dcaa5583c9f360d59617cb12531d10/src/base/hierarchy.ixx#L84-L196)). The Template's map folder already has the layered `_Locales/<locale>.w3mod/` directories. The World Editor's import manager tags each import with a mode: `WESTRING_ASSET_MODE_SD`, `_HD` "HD (Reforged)", `_HYBRID` "All Modes" and `_DE`. HiveWE handles `_hd` only, so **the folder a DE-only import is written to was not observed**: it needs a human to import a file as "DE" in the World Editor and look at the map folder.
2. **The chosen art layer**, then the base layer: `War3.w3mod:_HD.w3mod:` or `War3.w3mod:_DE.w3mod:`, then `War3.w3mod:`, each with the enUS locale and the tileset sub-layers before it. HiveWE has the same order for `_hd` and does not read `_de`.
3. **Extensions:** a model may write a texture as `.blp`, `.tif` or `.tga`, and the storage holds a `.dds` (or a `.blp`). HiveWE notes that "the game ignores the extension it is given and instead tries a fixed set of extensions" ([hierarchy.ixx](https://github.com/stijnherfst/HiveWE/blob/cbfd6b32d4dcaa5583c9f360d59617cb12531d10/src/base/hierarchy.ixx#L94-L96)). `.mdl` becomes `.mdx`.
4. **`War3.w3mod:FileAliases.json`**: 331 `{src, dest, assetType}` aliases, 15 of them models, for example `Units/Undead/HeroLichCIN/HeroLichCIN.mdx` → `Units/Undead/HeroLich/HeroLichCIN.mdx`. The HD and DE layers have no alias file.

Resolution measured over every model's texture references (`TEXS`):

| Layer | Models | Texture references | Unresolved    | Models with one unresolved | Found only in the model's own folder |
| ----- | ------ | ------------------ | ------------- | -------------------------- | ------------------------------------ |
| base  | 3,458  | 8,753              | 491 (5.6 %)   | 23                         | 0                                    |
| HD    | 5,532  | 49,723             | 809 (1.6 %)   | 271                        | 43                                   |
| DE    | 5,966  | 43,165             | 1,243 (2.9 %) | 353                        | 21                                   |

The unresolved ones are dangling in Blizzard's files. Some are absolute artist paths (`D:/projects/warcraft3/assets/Art/DE//Units/skeletons/Gore_Diffuse.tif` in a cinematic model), others textures that ship nowhere. The renderer must draw a model with a texture missing; `mdx-m3-viewer` does, and logs an error.

One case looks like a rule. The HD Town Hall names `Textures/Human_BuildUp_Diffuse.tif`, which exists only as `_HD.w3mod:Buildings/Human/TownHall/Human_BuildUp_Diffuse.dds`, next to the model. Whether the game falls back to the model's folder **was not verified**. A resolver can try that folder last at little cost.

### The three art layers

The World Editor calls them the **Asset Mode**: `WESTRING_PREFS_ASSETMODE_SD` "SD", `_HD` "HD", `_DE` "DE" and `_DEFAULT` "Default". The setting lives in `Documents\Warcraft III\WorldEditPreferences.txt` (`[Misc] assetMode=-1`, `hd=1`), and changing it "will take effect the next time you start the editor" (`WESTRING_WARNING_CHANGING_ASSETMODE_REQUIRES_RESTART`). Test Map has its own (`[Test Map] hd=0`). The game keeps `[Misc] hd=2` and `mostRecentlySeenGraphicsMode=2` in `War3Preferences.txt`.

- **The values of `hd` are inferred, not confirmed.** The strings' order suggests 0 = SD, 1 = HD, 2 = DE. A human switching the game's graphics setting and rereading the file would confirm it.
- **On this machine `Documents` is `C:\Users\night\OneDrive\Documentos`.** The Studio must ask Windows for the Documents known folder rather than build the path.
- **A map limits the choice.** It declares its **Supported Modes** in its options (`WESTRING_MAPOPTIONS_MODE`, a field of `war3map.w3i` that `mdx-m3-viewer-th` calls `graphicsMode`), so the Studio's mode switch should offer only what the map supports.
- **New 3.0 content exists only in DE.** Of the 1,902 distinct model paths that Built-in objects name, **170 exist only in `_DE.w3mod:`**, for example `Units/Human/ScarletInvoker/ScarletInvoker.mdx`, `Terenas.mdx` and `HoodedArthas.mdx`. In SD or HD mode the Studio has nothing of its own to show for them. **What the game shows in SD or HD for these units is not verified**: a DE fallback, the model the game falls back on, or nothing. Falling back to `_DE` is the reasonable default until a human checks it in game.

The prototype's chain per mode: SD = base; HD = `_HD`, then base; DE = `_DE`, then base.

### What renders differently by layer

| Layer | PopcornFX `CORN` | `PRE2` | `PREM` | `RIBB` | `LITE` |
| ----- | ---------------- | ------ | ------ | ------ | ------ |
| base  | 65 (2 %)         | 1,129  | 29     | 144    | 207    |
| HD    | 1,632 (30 %)     | 365    | 14     | 93     | 921    |
| DE    | 1,841 (31 %)     | 239    | 10     | 77     | 1,061  |

Each count is the number of models with at least one such chunk. HD and DE spell effects moved from `PRE2` particles to PopcornFX (`.pkb` files, 2,165 of them). `ThunderclapCaster.mdx` in HD has only `CORN`, `EVTS` and `BPOS`, so `mdx-m3-viewer` draws nothing for it, while its SD version draws its particles. For an effect field (the ability fields `CasterArt`, `TargetArt`, `Missileart`, `SpecialArt`, `EffectArt`), the SD layer is the one that shows something with this renderer.

### How many models the fields name

The base layer's `Units/UnitSkin.txt`, `ItemSkin.txt`, `AbilitySkin.txt`, `DestructableSkin.txt` and `Doodads/DoodadSkins.txt` name **1,902 distinct model paths**. The fields are `file` (2,435 values), `targetart` (568), `missileart` (197), `specialart` (174), `casterart` (155), `effectart` (87), `areaeffectart` (10) and `equipmentpreviewcamera` (8). Of them, 1,382 exist in the base layer, 1,434 in HD and 1,610 in DE. The 229 found in none are, in the samples checked, doodad and destructable paths that the game completes with a variation number (`minehole` → `minehole0.mdx`). The Studio must append that number before it resolves the path.

## What the Object Editor does

Neither the World Editor nor the game was started (both write the registry). What follows comes from the editor's string table (`_Locales/enUS.w3mod:UI/WorldEditStrings.txt`), the strings of `World Editor.exe`, and the editor's preference file.

- **A Previewer in the main window.** Menu `WESTRING_MENU_PREVIEWER` "&Previewer", command `WECOMMAND_TOGGLE_PREVIEWDISPLAY` "Window - Toggle Previewer Display". Preferences `Previewer Height=311` and `Previewer Auto Zoom=1` ("Automatically &zoom Previewer to fit new models"). Its controls are `WESTRING_PREVIEWER_ROTATE` "Rotate", `_DISTANCE` "Distance", `_ANIM` "Animation", `_LIGHT` "Lighting" and `_VAR` "Variation", so it plays a chosen animation and a chosen doodad variation. Its class is `CWEPreviewer`.
- **A Model Previewer module.** `WECOMMAND_MODULE_MODEL_PREVIEWER` "Model Previewer", with its own page in Configure Controls (`Scroll Position - Model Previewer`). It is new since the classic editor. Class `CWEModelPreview`, next to a `CWETexturePreview`.
- **The model field's dialog** offers "Preset:", "Import:" and "Custom:" (`WESTRING_OE_DLG_PRESET`, `_IMPORT`, `_CUSTOM`), and "No appropriate imported files exist" when the map has no import of that type. Preset models are grouped by `WESTRING_OE_TYPECAT_*` (Units, Units - Missiles, Units - Special, Spawned Effects, Doodads, …, with suffixes like `<Caster>` and `<Target>`).
- **Team colour is a field of the object**: units `utco` "Team Color" (`WESTRING_UE_TEAMCOLOR_NONE` "Match Owning Player", or a player 0–23) and `utcc` "Allow Custom Team Color", and the same on items (`itco`), destructables and doodads (`btco`, `dtco`). The Asset Manager lists a Mode and a Teen column per file.

**Needs a human at the screen**, because no file says it:

1. Selecting an object in the Object Editor: does the main window's Previewer show its model, or does the Object Editor have no preview of its own?
2. In the Model File dialog (Preset/Import/Custom): is there a 3D preview of the highlighted model?
3. Does that preview animate (which sequence by default), and in which team colour (Player 1 red, or the object's `utco`)?
4. What does the Model Previewer module do: does it open on the selected object's model?

The answers shape only how close the Studio's layout stays to the World Editor's. #476 already put previews in the picker and next to the field.

## Cost

Measured in headless Chrome 154 on the RTX 4070 Ti SUPER (ANGLE, Direct3D 11) with the patched viewer and the Node server above. The server read every file from CASC on demand, without a cache of its own.

**Cold, one model per new viewer** (team-colour textures loaded again each time). `ready` runs from `load()` until every texture is loaded; MB is what the server read from CASC.

| Model                 | SD ready | SD MB | HD ready                          | HD MB                | DE ready    | DE MB |
| --------------------- | -------- | ----- | --------------------------------- | -------------------- | ----------- | ----- |
| Footman               | 38 ms    | 0.7   | 175 ms                            | 25.0                 | 98 ms       | 13.7  |
| Paladin               | 32 ms    | 0.8   | 188 ms                            | 27.2                 | 207 ms      | 27.1  |
| Grunt                 | 27 ms    | 0.7   | 184 ms                            | 22.3                 | 162 ms      | 18.3  |
| Abomination           | 30 ms    | 0.8   | 170 ms                            | 20.0                 | 174 ms      | 24.5  |
| Town Hall             | 32 ms    | 1.2   | 924 ms                            | (4 textures missing) | 756 ms      | 136.1 |
| Treasure chest        | 4 ms     | 0.0   | 54 ms                             | 6.9                  | 51 ms       | 5.5   |
| Thunder Clap (effect) | 30 ms    | 0.2   | 5 ms (`CORN` only: nothing drawn) | 0.1                  | 5 ms (same) | 0.1   |

**Warm, 80 unit models from `UnitSkin.txt` in one shared viewer:**

| Layer | Median | p90    | Max    | Total for 80 | Median MB read | PNG encode (512×512, median) |
| ----- | ------ | ------ | ------ | ------------ | -------------- | ---------------------------- |
| SD    | 6 ms   | 9 ms   | 29 ms  | 0.5 s        | 0.2            | 9 ms                         |
| HD    | 159 ms | 330 ms | 536 ms | 12.8 s       | 21.8           | 13 ms                        |
| DE    | 115 ms | 266 ms | 509 ms | 10.3 s       | 15.4           | 13 ms                        |

The first rendered frame took 0.1–1.7 ms, and an animated frame afterwards 0.01–0.09 ms of CPU time, `gl.finish` included. Animation costs nothing worth counting. About half of an HD preview's time is the server reading and inflating 20–27 MB from CASC: 64–96 ms of `cascMs` out of about 170 ms.

What follows for the spec:

- **One live preview, next to the selected field or the highlighted picker entry, is cheap enough without any cache.** It costs about 0.2 s in HD or DE, under 0.05 s in SD, and up to about 1 s for the heaviest buildings. Show the model when ready and the textures as they arrive.
- **A thumbnail per field, as for icons, is not.** Icons are one small DDS each. The 1,902 models that Built-in objects name would take about 5 minutes in HD (1,902 × ~0.16 s) and read up to about 40 GB from CASC without a file cache (1,902 × ~21 MB, less what models share), and a map adds its Custom objects' and imports' models.
- **Chrome loses the oldest WebGL context beyond 16 live ones per page.** Measured: 40 contexts created, 24 lost, with "Too many active WebGL contexts. Oldest context will be lost." A field table therefore cannot give each row its own canvas.
- **So:**
  - one shared renderer draws thumbnails off screen into PNGs, lazily (rows in view first), and caches them on disk under a key of Build, art layer and model path, plus the file's hash for a map import;
  - the cache is generated on the developer's machine, never shipped, since it is Blizzard art (#459);
  - at 128×128 a PNG should be a few KB (estimated, not measured), so the whole Built-in set stays in the tens of MB per art layer;
  - the server keeps a small LRU of decoded files, because the team-colour, environment-map and blood models repeat across models.

## Left for a human

1. **The World Editor's previews** (the four questions under "What the Object Editor does").
2. **The values of `hd`** in `War3Preferences.txt` and `WorldEditPreferences.txt`: 0, 1, 2 as SD, HD, DE?
3. **The map folder path of an import tagged "DE"** in the World Editor's import manager.
4. **What the game shows in SD or HD for the 170 models that exist only in `_DE`.**
5. **Whether the game resolves a texture missing at its path from the model's own folder** (the HD Town Hall's `Human_BuildUp_*`).
6. **Whether `whiteout-js-viewer`'s npm build reads 1800, and whether WebGPU works in a VS Code webview.** Both matter only if the Studio later wants game-faithful HD rendering and PopcornFX.

## Sources

- **The install, read-only:** `C:\Program Files (x86)\Warcraft III`, Build 3.0.0.24268 (build config `3a9d8f26806936764d2d9ad526a65e04`). Files read from it:
  - `War3.w3mod:FileAliases.json`;
  - `_Locales/enUS.w3mod:UI/WorldEditStrings.txt`;
  - the `*Skin.txt` profiles;
  - every `.mdx` and `.dds`;
  - the strings of `_retail_/x86_64/World Editor.exe`.
- **Preference files:** `Documents\Warcraft III\War3Preferences.txt` and `WorldEditPreferences.txt` (read only).
- **Renderers:**
  - [flowtsohg/mdx-m3-viewer @ 2ff0bc0](https://github.com/flowtsohg/mdx-m3-viewer/tree/2ff0bc00c6363f425016e23d88c0fb2929d3b3cc), [PR #87](https://github.com/flowtsohg/mdx-m3-viewer/pull/87);
  - npm `mdx-m3-viewer-th@5.13.4` ([cipherxof/mdx-m3-viewer](https://github.com/cipherxof/mdx-m3-viewer));
  - [4eb0da/war3-model @ 52d7f42](https://github.com/4eb0da/war3-model/tree/52d7f421a550);
  - [FernandoS27/WhiteoutFlakes](https://github.com/FernandoS27/WhiteoutFlakes) and [WhiteoutLib](https://github.com/FernandoS27/WhiteoutLib);
  - [Retera/ReterasModelStudio](https://github.com/Retera/ReterasModelStudio);
  - [jonathanvdc/wc3](https://github.com/jonathanvdc/wc3).
- **HiveWE** [stijnherfst/HiveWE @ cbfd6b3](https://github.com/stijnherfst/HiveWE/tree/cbfd6b32d4dcaa5583c9f360d59617cb12531d10): `src/file_formats/mdx/mdx_reader.cpp` and `src/base/hierarchy.ixx`. AGPL: read for facts, no code reused.
- **CASC:**
  - [CascLib](https://github.com/ladislav-zezula/CascLib) (MIT);
  - npm [`@jamiephan/casclib`](https://www.npmjs.com/package/@jamiephan/casclib) 0.3.0 (MIT);
  - the earlier research [built-in-objects.md](https://github.com/phmilk/reforged-ts/blob/research/built-in-objects/docs/research/built-in-objects.md) (#459) for the storage layout and licence position.
- **Related findings:**
  - [hivewe-compatibility-and-features.md](https://github.com/phmilk/reforged-ts/blob/research/hivewe-compatibility-and-features/docs/research/hivewe-compatibility-and-features.md) (#471), on HiveWE's model picker with live previews;
  - [world-editor-open-object.md](https://github.com/phmilk/reforged-ts/blob/research/world-editor-open-object/docs/research/world-editor-open-object.md) (#461).
