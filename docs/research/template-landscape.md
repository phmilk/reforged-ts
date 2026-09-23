# Template landscape: wc3-ts-template internals, alternatives, 3.0.0 packaging gotchas

Research note for ticket [#22](https://github.com/phmilk/reforged-ts/issues/22). Facts only, no decision. Feeds the ticket "Template scope and its contract with the library".

Written 2026-09-23. Every claim cites the primary source it was read from (repository file at a named commit, npm registry, Blizzard forum post, Hive thread). Where a source could not be reached or a claim could not be verified, section 4 says so.

Vocabulary: **Native** = a function/type/constant the game exposes to Lua map scripts. **Toolchain** = TypeScript + typescript-to-lua + lint + build. **Map project** = a repo consuming the library to produce a playable map. **Template** = the starter repo a Map project is generated from. **Patch** = a released game version with build number (3.0.0.24268).

---

## 1. `cipherxof/wc3-ts-template` today

State read from the default branch `master` at commit `e3267f0` ("Update dependencies (#25)", 2025-10-14), which is the last push to the repo ([GitHub API `pushed_at` 2025-10-14T01:48:44Z](https://api.github.com/repos/cipherxof/wc3-ts-template)). Earlier commits: `eeca5ee` 2023-12-23 (ts-to-lua peer dependency fix, #22), `61850e0` 2023-07-07 ("temporary fix for broken transformer"), `f76ecf3` 2023-05-13 ("Big upgrades (#15)").

### 1.1 Repo shape

Tracked files (from the git tree): `README.md`, `LICENSE` (MIT), `config.json`, `package.json`, `tsconfig.json`, `scripts/build.ts`, `scripts/dev.ts`, `scripts/test.ts`, `scripts/utils.ts`, `src/main.ts`, `src/war3map.d.ts`, and a checked-in map folder `maps/map.w3x/` (World Editor "save as folder" layout; contains `war3map.lua`, `conversation.json`, plus the binary map files) ([tree](https://github.com/cipherxof/wc3-ts-template/tree/master)).

`package.json` (version 1.1.0) scripts and dependencies ([source](https://github.com/cipherxof/wc3-ts-template/blob/master/package.json)):

| script | command |
|---|---|
| `test` | `ts-node --transpile-only scripts/test.ts` |
| `build` | `ts-node --transpile-only scripts/build.ts` |
| `dev` | `npm-watch` (watches `./maps/*` for `.lua` changes and runs `build:defs`) |
| `build:defs` | `ts-node scripts/dev` |

Runtime dependency: `w3ts ^3.0.2`. Dev dependencies (exact strings): `typescript 5.8.2`, `typescript-to-lua 1.31.0`, `war3-transformer ^3.0.10`, `war3-objectdata-th ^0.2.11`, `mdx-m3-viewer-th ^5.13.3`, `war3-types-strict ^0.1.3`, `war3tstlhelper 1.0.1`, `lua-types ^2.13.1`, `luamin ^1.0.4`, `fs-extra 11.3.0`, `winston ^3.17.0`, `npm-watch 0.13.0`, `ts-node 10.9.2`, `tsconfig-paths 4.2.0`, `tsutils 3.21.0`, `@types/node 22.15.17`, `@types/pako 2.0.3`, `@types/fs-extra 11.0.4`.

`config.json` ([source](https://github.com/cipherxof/wc3-ts-template/blob/master/config.json)):

```json
{ "mapFolder": "map.w3x", "minifyScript": false,
  "gameExecutable": "E:\\Games\\Warcraft III\\_retail_\\x86_64\\Warcraft III.exe",
  "outputFolder": "./dist/bin", "launchArgs": ["-launch", "-windowmode", "windowed"] }
```

`IProjectConfig` in `scripts/utils.ts` additionally accepts optional `winePath` and `winePrefix` ([source](https://github.com/cipherxof/wc3-ts-template/blob/master/scripts/utils.ts)). The published configuration page documents only `mapFolder`, `minifyScript`, `gameExecutable`, `outputFolder`, `launchArgs` ([w3ts docs: configuration](https://cipherxof.github.io/w3ts/docs/configuration)).

### 1.2 How TypeScript becomes Lua (`compileMap` in `scripts/utils.ts`)

Steps, in the order the code runs them ([source](https://github.com/cipherxof/wc3-ts-template/blob/master/scripts/utils.ts)):

1. `fs.removeSync("./dist")`.
2. `fs.copySync("./maps/<mapFolder>", "./dist/<mapFolder>")` — the whole editor map folder is copied.
3. `updateTSConfig(mapFolder)` rewrites `tsconfig.json` on disk: it sets the war3-transformer plugin's `mapDir`, `entryFile`, `outputDir` to absolute paths (`path.resolve('maps', mapFolder)`, `path.resolve(tsconfig.tstl.luaBundleEntry)`, `path.resolve('dist', mapFolder)`) and writes the file back with `JSON.stringify(..., 2)`. This is why the committed `tsconfig.json` contains a developer's absolute paths (`C:/Users/Me/Documents/GitHub/wc3-ts-template/...`) ([tsconfig.json](https://github.com/cipherxof/wc3-ts-template/blob/master/tsconfig.json)); issue #24 item 5 asks for relative paths and the owner replied that relative paths had issues but would be welcome if fixed ([#24](https://github.com/cipherxof/wc3-ts-template/issues/24)).
4. `execSync('tstl -p tsconfig.json')`.
5. Reads `./dist/tstl_output.lua` (the `tstl.luaBundle` output) and `./dist/<mapFolder>/war3map.lua`, and writes `war3map.lua = <editor war3map.lua> + <tstl bundle>` (string concatenation, editor script first).
6. If `minifyScript`, runs `luamin.minify` over the concatenated script.

Relevant `tsconfig.json` settings ([source](https://github.com/cipherxof/wc3-ts-template/blob/master/tsconfig.json)): `strict: true`, `target/lib: ESNext`, `moduleResolution: node`, `paths: { "@objectdata/*": ["./node_modules/war3-objectdata-th/dist/cjs/generated/constants/*"] }`; `types` includes `@typescript-to-lua/language-extensions`, the `lua-types/core/*` and `lua-types/special/5.3` entries, `war3-types-strict/1.33.0`, `war3-transformer/types`, `war3-objectdata-th/dist/cjs/objectdata`; `tstl`: `luaTarget: "5.3"`, `noHeader: true`, `luaLibImport: "require"`, `noImplicitSelf: true`, `luaBundle: "dist/tstl_output.lua"`, `luaBundleEntry: "./src/main.ts"`, `sourceMapTraceback: false`, `noResolvePaths: ["typescript", "typescript-to-lua"]`. Note the Native typings are pinned to `war3-types-strict/1.33.0`, i.e. the 1.33 Native surface.

The starter `src/main.ts` hooks `W3TS_HOOK.MAIN_AFTER` via `addScriptHook` from `w3ts/hooks`, uses `compiletime(...)` to embed build date and TS/TSTL versions, and uses a `compiletime(({ objectData, constants }) => ...)` block that sets the Footman `modelFile` and calls `objectData.save()` ([source](https://github.com/cipherxof/wc3-ts-template/blob/master/src/main.ts)).

### 1.3 What `war3-transformer` does

Repo [cipherxof/war3-transformer](https://github.com/cipherxof/war3-transformer), npm `war3-transformer` 3.0.10 (published 2025-09-30; `peerDependencies: typescript ^5.0.4`; dependencies `mdx-m3-viewer-th ^5.13.0`, `war3-objectdata-th ^0.2.8`, `tsconfig-paths ^3.9.0`, `tsutils ^3.21.0`) ([npm view](https://www.npmjs.com/package/war3-transformer), [package.json](https://github.com/cipherxof/war3-transformer/blob/master/package.json)). README: "Fixes import paths for node_modules in TypeScriptToLua's output. Adds compiletime functionality." ([README](https://github.com/cipherxof/war3-transformer/blob/master/README.md)). Last commits: `0761ad6` 2025-09-30 "update package to 3.0.10", `de8baff` 2025-09-30 "fix: Make it work with consumers that use higher version of typescript (#9)", `8ccf720` 2024-10-15, `07bae71` 2024-01-01 "Support map modified abilities (#7)".

`src/transformer.ts` ([source](https://github.com/cipherxof/war3-transformer/blob/master/src/transformer.ts)):

- It is a TypeScript `program` transformer configured through `compilerOptions.plugins[0]` with `{ mapDir, entryFile, outputDir }`.
- On construction it calls `loadObjectData(options.mapDir)` (reads the map's object-data files through `war3-objectdata-th`).
- For every call expression whose resolved declaration is a `FunctionDeclaration` named `compiletime`, it takes the first argument's source text, `ts.transpile()`s it to JS, `eval`s it with the argument `{ objectData, fourCC: stringToBase256, log: console.log, constants: { abilities, buffs, destructables, doodads, items, units, upgrades } }`, and replaces the call with an AST literal built from the return value (`createExpression`).
- When it finishes the file whose name equals `options.entryFile`, it calls `saveObjectData(objectData, options.outputDir)` — i.e. modified object data is written into `dist/<mapFolder>` (the copy), never into `maps/`.

Two known correctness limits are documented in template issues: object data is only saved if the map already had the corresponding modification file (e.g. `war3map.w3u`) — issue #26 cites [war3-transformer `src/objectdata.ts` L23-26](https://github.com/cipherxof/war3-transformer/blob/0761ad62d89dde2575f95bd872e0f808d28cfc32/src/objectdata.ts#L23-L26) and [war3-objectdata `src/objectdata.ts` L107-110](https://github.com/cipherxof/war3-objectdata/blob/ff20dc70f735890d6d6be3d64dad0dd9a16cb0d5/src/objectdata.ts#L107-L110) ([#26](https://github.com/cipherxof/wc3-ts-template/issues/26)); and ability tooltips / level data round-trip incorrectly (#28, #27, see 1.7).

### 1.4 How the map folder becomes a `.w3x` (MPQ library)

`scripts/build.ts` ([source](https://github.com/cipherxof/wc3-ts-template/blob/master/scripts/build.ts)):

- Imports `War3Map from "mdx-m3-viewer-th/dist/cjs/parsers/w3x/map"`. `mdx-m3-viewer-th` is cipherxof's fork of flowtsohg's `mdx-m3-viewer` (npm 5.13.4, published 2025-10-13, `repository.url = github.com/cipherxof/mdx-m3-viewer`; fork last pushed 2025-10-13) ([npm view](https://www.npmjs.com/package/mdx-m3-viewer-th), [fork](https://github.com/cipherxof/mdx-m3-viewer)). The MPQ implementation is the viewer's own pure-TypeScript `src/parsers/mpq/*` (archive, block/hash tables, crypto, explode, adpcm) ([tree](https://github.com/cipherxof/mdx-m3-viewer/tree/master/src/parsers/mpq)). No StormLib/CascLib native binding is involved.
- `createMapFromDir(output, dir)`: `new War3Map()`, `map.archive.resizeHashtable(files.length)`, then for every file under `dist/<mapFolder>` (recursive), `map.import(relativePath, contents)`; then `map.save()` and `fs.writeFileSync(output, ...)`. Output path is `<outputFolder>/<mapFolder>` (so `./dist/bin/map.w3x`).
- `War3Map.import(name, buffer)` is `archive.set(name, buffer)` plus `imports.set(name)`; the file is stored byte-for-byte. `war3map.w3i` is therefore passed through unchanged; the only w3i parsing in the build happens inside `save()`, which calls `getMapInformation()` and prepends the legacy 512-byte `HM3W` header only if the w3i build version is below 1.31 ([map.ts](https://github.com/cipherxof/mdx-m3-viewer/blob/master/src/parsers/w3x/map.ts)).
- `MpqArchive.save()` deletes `(attributes)` ("The attributes might ... contain CRC checksums ... there is no real reason to keep (and update) any of the file attributes") and regenerates `(listfile)` from the known file names ([archive.ts](https://github.com/cipherxof/mdx-m3-viewer/blob/master/src/parsers/mpq/archive.ts) L116-140).
- Every file added through `import()` is also added to `war3map.imp`; the source comment says "Files added to the archive but not to the imports list will be deleted by the World Editor automatically. This of course doesn't apply to internal map files." ([map.ts](https://github.com/cipherxof/mdx-m3-viewer/blob/master/src/parsers/w3x/map.ts)).

### 1.5 How the game is launched (`scripts/test.ts`)

`npm run test` runs `compileMap(config)` and then launches the game **on the unpacked folder** `dist/<mapFolder>`, not the `.w3x` ([source](https://github.com/cipherxof/wc3-ts-template/blob/master/scripts/test.ts)):

- Windows/macOS: `execFile(config.gameExecutable, ["-loadfile", "<cwd>/dist/<mapFolder>", ...config.launchArgs])`; ENOENT is reported as a misconfigured `gameExecutable`.
- If `winePath` is set: `execSync("<WINEPREFIX=...> <winePath> \"<gameExecutable>\" -loadfile \"Z:<path>\" <launchArgs>")`.
- Default `launchArgs` are `-launch -windowmode windowed`.

The getting-started page lists prerequisites "Node.js" and "Warcraft III 1.31.0 or greater", steps `npm install`, edit `gameExecutable` in `config.json`, then `npm run test` "to transpile TypeScript to Lua, construct the map file, and launch the game" ([w3ts docs: getting started](https://cipherxof.github.io/w3ts/docs/getting-started)). Neither page mentions Reforged 2.x/3.x, login, or online requirements.

### 1.6 `scripts/dev.ts` (editor-globals typings)

Reads `maps/<mapFolder>/war3map.lua`, runs `new War3TSTLHelper(contents).genTSDefinitions()` and writes `src/war3map.d.ts` (typings for editor-generated globals such as regions, cameras, preplaced units) ([source](https://github.com/cipherxof/wc3-ts-template/blob/master/scripts/dev.ts)). `war3tstlhelper` npm 1.0.1 was last published 2022-05-24 ([npm view](https://www.npmjs.com/package/war3tstlhelper)). Issue #24 bug 2 reports `npm run dev` does not work and needs `npm-watch` updated ([#24](https://github.com/cipherxof/wc3-ts-template/issues/24)).

### 1.7 Open issues and PRs (10 open items: 8 issues, 2 PRs)

Read 2026-09-23 with `gh issue list`/`gh pr list`.

| # | opened / last update | title | substance |
|---|---|---|---|
| [#28](https://github.com/cipherxof/wc3-ts-template/issues/28) | 2026-05-03 / 2026-05-08 | Dependency issue: war3-transformer | war3-transformer 3.0.10 "does not respect custom tooltips on abilities for the Basic Tooltip and Extended Tooltip"; 3.0.9 did but is incompatible with the current template's other dependencies; "Removing war3-transformer from the template resolved the issue". Asks: "Thoughts on removing war3-transformer from the template for the time being?" Comment (Psimage): the fault is in `cipherxof/war3-objectdata`, which "sometimes does it wrong" when reading/writing map object modifications. No owner reply. |
| [#27](https://github.com/cipherxof/wc3-ts-template/issues/27) | 2026-03-15 / 2026-03-16 | Bug: Can't Configure Channel Ability | Owner: "This is an issue with war3-objectdata. There was a pull request to support ability levels but it seems unfinished" ([war3-objectdata PR #3](https://github.com/cipherxof/war3-objectdata/pull/3)). |
| [#26](https://github.com/cipherxof/wc3-ts-template/issues/26) | 2025-10-14 / 2026-05-12 | Bug: Example footman does not spawn with Captain model | Root cause per Psimage: the example map has no `war3map.w3u`, and the object-data library does not save modifications when the map had no modifications file. |
| [#24](https://github.com/cipherxof/wc3-ts-template/issues/24) | 2025-10-05 / 2025-10-15 | Feedback & Suggestions | Suggests: drop `undefined` from `create()` return types (owner: keep, "some handle creation natives can fail"); ship TS sources for go-to-implementation (owner: TSTL advises against source dependencies); update deps to allow including `.lua` files; clean `dist` before build (now in code); relative transformer paths; editorconfig. Bugs: Footman model example broken; `npm run dev` broken; `Group.getUnits()` wrong (owner: "Yes I think it's wrong"); `File.writeRaw()` still emits preload boilerplate (owner: "That's just how preload works"). |
| [#21](https://github.com/cipherxof/wc3-ts-template/issues/21) | 2023-11-28 / 2023-12-06 | The game cannot load the generated folder | On 1.36.1 the built `dist/bin/map.w3x` showed "The map is unavailable or corrupted"; the built archive lacked `(listfile)` and `(attributes)`; adding a `listfile.txt` did not fix it. Unresolved. |
| [#20](https://github.com/cipherxof/wc3-ts-template/issues/20) | 2023-10-22 / 2024-01-12 | Peer dependency issue when using latest package version | Led to PR/commit `eeca5ee` (2023-12-23) and removing `package-lock.json` from `.gitignore`. |
| [#19](https://github.com/cipherxof/wc3-ts-template/issues/19) | 2023-08-31 / 2024-01-28 | Consider moving script functionality to w3ts | Owner: "The primary purpose of w3ts is to provide an API so I don't really think it's a good idea to mix project configuration / setup into w3ts." Reporter suggests a separate repo for the build scripts. |
| [#17](https://github.com/cipherxof/wc3-ts-template/issues/17) | 2023-06-22 | compiletime function not defined/expanded | Game log: `attempt to call a nil value (global 'compiletime')` — the transformer did not run, so `compiletime` reached the map script. No comments. |
| [PR #23](https://github.com/cipherxof/wc3-ts-template/pull/23) | 2024-01-07 | WTS File Parser and Enum Generator | Open, unmerged. |
| [PR #18](https://github.com/cipherxof/wc3-ts-template/pull/18) | 2023-08-31 | Remove war3-transformer | Open, unmerged (same author as #19). |

### 1.8 Dependency freshness (npm registry, read 2026-09-23)

| package | template pin | latest on npm | last publish |
|---|---|---|---|
| `w3ts` | `^3.0.2` | 3.0.2 | 2023-05-12 |
| `typescript-to-lua` | `1.31.0` | 1.37.1 | 2026-07-09 |
| `war3-transformer` | `^3.0.10` | 3.0.10 | 2025-09-30 |
| `war3-objectdata-th` | `^0.2.11` | 0.2.11 | 2025-09-30 (repository.url points at `flowtsohg/war3-objectdata`) |
| `mdx-m3-viewer-th` | `^5.13.3` | 5.13.4 | 2025-10-13 |
| `war3-types-strict` | `^0.1.3` | 0.1.3 | 2023-02-05 |
| `war3tstlhelper` | `1.0.1` | 1.0.1 | 2022-05-24 |

Source: `npm view <pkg> version time.modified` for each.

A real-world downstream copy is [w3champions/map-updater-scripts](https://github.com/w3champions/map-updater-scripts) (pushed 2026-09-19): its `package.json` is the template's (`"name": "wc3-ts-template"`, same four scripts) with `typescript 5.9.3`, `typescript-to-lua 1.34.0`, `w3ts ^3.0.2`, `war3-transformer ^3.0.10`, plus `w3gjs`, `@jamiephan/casclib`, `war3-model` ([package.json](https://github.com/w3champions/map-updater-scripts/blob/master/package.json)).

---

## 2. Alternatives

"Last activity" is the repository `pushed_at` or last commit date read from the GitHub API on 2026-09-23 unless stated otherwise.

### 2.1 voces (Sheep Tag maintainer) — Deno + TSTL, own w3ts fork

- [voces/fixus](https://github.com/voces/fixus) (pushed 2026-06-01): "This is a TypeScript map. Object editing, terraining, and other World Editor data still live in the `.w3x`; the custom code is written in TypeScript and transpiled to Lua via typescript-to-lua." Layout: `map.w3x` (editor folder, "no custom code"), `src`, `scripts` ("Deno scripts that drive the build"), `temp` outputs. `deno task build` "Compiles `src/**/*.ts` to a single `temp/out.lua`, concatenates it with `map.w3x/war3map.lua`, and packs the result into `temp/release.w3x`" ([README](https://github.com/voces/fixus/blob/master/README.md)).
  - Packing: `scripts/build.ts` imports `Map from "mdx-m3-viewer-th/w3x/map"`, runs tstl via `deno run -A npm:typescript-to-lua/dist/tstl.js --project tsconfig.build.json`, `map.archive.resizeHashtable(files.length)`, imports files, replaces the script file with `editor script + "\n" + built Lua`, `map.save()` ([build.ts](https://github.com/voces/fixus/blob/master/scripts/build.ts)). Same MPQ writer as the template.
  - Launch: `deno.json` task `launch`: `"/mnt/d/Warcraft\ III/_retail_/x86_64/Warcraft\ III.exe" -loadfile "$(wslpath -w temp/release.w3x)" -launch -windowcode windowed -nowfpause` (sic, `-windowcode`) — launches the packed `.w3x`, from WSL ([deno.json](https://github.com/voces/fixus/blob/master/deno.json)).
  - Reforged lobby gotcha recorded in `scripts/run.ts`: "w3i.flags bit 5: 'Fixed player settings (for custom forces)'. Without it, Reforged's -launch lobby doesn't honor the map's custom force/slot layout, so SetPlayerController calls in the lua get ignored for unseated slots." The script sets `flags |= 0x20` on the parsed w3i and re-saves it ([run.ts](https://github.com/voces/fixus/blob/master/scripts/run.ts)).
  - Testing without the game: `deno task test` = `deno test -A --no-check src/ scripts/`, using [voces/w3api](https://github.com/voces/w3api) ("Attaches Warcraft III natives to the global scope for use in testing"; npm `w3api` 3.2.0, 2026-05-29).
  - Library: `@voces/w3ts` 4.0.1 (npm, 2026-05-17; repository `voces/w3ts`), `w3ts-w3mmd` (repo pushed 2026-05-17), `war3-types ^1.0.4`, `lua-types`.
- [voces/w3xdata](https://github.com/voces/w3xdata) (pushed 2026-09-13; npm 3.1.1, 2026-05-31): "extracting Warcraft 3 map data in a typed, semi-structured way" from `war3map.w3u`/`.wts` etc. ([README](https://github.com/voces/w3xdata/blob/master/README.md)).
- [voces/w3xio](https://github.com/voces/w3xio) (pushed 2026-08-15): no README and no npm package found (`npm view w3xio` → 404).
- [voces/w3ts-jsx](https://github.com/voces/w3ts-jsx) (pushed 2022-10-06): "Add JSX to your WC3 maps!" (frames as JSX) ([README](https://github.com/voces/w3ts-jsx/blob/master/README.md)).
- [voces/stts](https://github.com/voces/stts) (pushed 2026-05-02): Sheep Tag TS source; [voces/wc3data](https://github.com/voces/wc3data) (2026-05-29). npm `@voces/wc3maptranslator` 4.0.3 was last published 2022-04-07.
- No generic "template" repo exists under voces; fixus is the reference project.

### 2.2 Ceres (Lua build toolchain, TypeScript optional) — discontinued

- Current home: [ceres-wc3/ceres](https://github.com/ceres-wc3/ceres) (archived 2020-09-09). `ceres-c/ceres` does not exist (GitHub API 404). README notice: "Ceres is discontinued indefinitely. This is mainly due to my unavailability, and the complete dumpster fire that Reforged turned out to be." ([README](https://github.com/ceres-wc3/ceres/blob/master/README.md)).
- What it was: "a stand-alone scriptable build toolchain for Warcraft III maps" driven by a Lua `build.lua`; bundles Lua by analysing `require`; `compiletime()` macro executed at build time; object-data editing, MPQ reading/writing (its own Rust crates [ceres-mpq](https://github.com/ceres-wc3/ceres-mpq), [ceres-mpqtool](https://github.com/ceres-wc3/ceres-mpqtool)); TypeScript via a patched TSTL ([ceres-tstl](https://github.com/ceres-wc3/ceres-tstl)) and [ceres-ts-template](https://github.com/ceres-wc3/ceres-ts-template) (pushed 2020-02-06); [cerrie](https://github.com/ceres-wc3/cerrie) library (2022-06-22) with Live Reload.
- Launch: `ceres run` with `runconfig.lua`: `ceres.runConfig = { command = "C:/Program Files/Warcraft III/x86_64/Warcraft III.exe", args = {"-windowmode", "windowed"} }`; `ceres build -- --map mpq.w3x --output mpq` writes to `target/` ([ceres-ts-template README](https://github.com/ceres-wc3/ceres-ts-template/blob/master/README.md)).
- Note: the template's `compiletime()` in war3-transformer is the same idea as Ceres' `compiletime()` macro.

### 2.3 w3x2lni-based flows

- [sumneko/w3x2lni](https://github.com/sumneko/w3x2lni) (language Lua; pushed 2025-12-18; 162 stars). English docs: converts maps between "Lni" (VCS-friendly directory with binary files "converted to plain text files"), "Obj" (WE-readable) and "Slk" (game-readable, optimized: objects to SLK, unreferenced objects removed, WE-only files removed, WTS strings inlined, MDX compressed, script comments/whitespace removed, "Obfuscated variable and function name"); Obj↔Lni lossless, →Slk lossy and makes the map uneditable in WE ([docs en-us](https://sumneko.github.io/w3x2lni/#/en-us/)). The docs page read does not state supported game versions; last commits (2025-12-17/18) concern script optimization ("更新脚本优化", "修正优化脚本后自定type丢失的问题").
- A TS template built on it: [eiriksgata/wc3-map-ts-template](https://github.com/eiriksgata/wc3-map-ts-template) (pushed 2026-08-31, 25 stars) targets **Warcraft III 1.27a** with the KKWE editor and w3x2lni ("内置 KKWE + w3x2lni 环境"; `yarn test:map` "必须经 KKWE 启动，原版魔兽打不开本图" = must be launched through KKWE, the vanilla game cannot open the map); companion library [eiriksgata/wc3ts](https://github.com/eiriksgata/wc3ts) (2026-08-21) ([README](https://github.com/eiriksgata/wc3-map-ts-template/blob/main/README.md)). This is a Classic-1.27 pipeline, not a Reforged one.

### 2.4 WC3MapTranslator (a.k.a. "WC3MapTranspiler")

No repository named "WC3MapTranspiler" exists on GitHub (`gh search repos WC3MapTranspiler` returned nothing; a web search for the term returns only WC3MapTranslator). The tool meant is [ChiefOfGxBxL/WC3MapTranslator](https://github.com/ChiefOfGxBxL/WC3MapTranslator) (pushed 2026-07-12; npm `wc3maptranslator` 5.0.0 published 2025-12-21; 5.0.1 changelog dated 2026-07-12): "a TypeScript module and CLI to convert between JSON and WarCraft III (.w3x) `war3map` formats", "Requires Node ≥ 24"; the 5.0.0 release added a CLI that "synergizes well with World Editor's ability to save maps as a directory", and its Info translator "Upgrades to latest version, v33, which supports: game data set, game data version, force camera default/min/max" ([README](https://github.com/ChiefOfGxBxL/WC3MapTranslator/blob/master/README.md), [CHANGELOG](https://github.com/ChiefOfGxBxL/WC3MapTranslator/blob/master/CHANGELOG.md)). It translates individual files; it does not pack MPQs or launch the game. Its `InfoTranslator.ts` always writes file version 33 and defines `enum GameDataVersion { ROC = 0, TFT = 1 }` and `enum GameDataSet { Default = 0, Custom101 = 1, MeleeLatestPath = 2 }` ([InfoTranslator.ts](https://github.com/ChiefOfGxBxL/WC3MapTranslator/blob/master/src/translators/InfoTranslator.ts)). No commits after 3.0.0 shipped.

### 2.5 mdx-m3-viewer tooling

- Upstream [flowtsohg/mdx-m3-viewer](https://github.com/flowtsohg/mdx-m3-viewer) (pushed 2025-08-27). Fork/npm used by the template and by fixus: `mdx-m3-viewer-th` 5.13.4 (2025-10-13). Its `w3i/file.ts` parses fields conditionally on `version > 24 / > 27 / > 30 / > 32` and, for `version > 30`, reads `graphicsMode` then a field it names `unknown1` (this is the slot HiveWE and WC3MapTranslator call game data version, see 3.2); it has no branch for w3i version 39 ([w3i/file.ts](https://github.com/cipherxof/mdx-m3-viewer/blob/master/src/parsers/w3x/w3i/file.ts)). Neither upstream nor fork has commits after 3.0.0 shipped (2026-09-12).

### 2.6 Other pipelines active in 2025–2026

| project | last activity | language / pipeline | how it launches/tests |
|---|---|---|---|
| [wurstscript/WurstScript](https://github.com/wurstscript/WurstScript) | 2026-09-15 | Wurst language → JASS/Lua; MPQ via Java `wc3libs`/JMPQ | `RunMap.java` builds `<exe> [-launch] [-editor] (-window \| -windowmode windowed) -loadfile <map>`; on Linux prefixes `wine`; `-launch` for Reforged, `-editor` "for Reforged 3.0 and newer" ([RunMap.java](https://github.com/wurstscript/WurstScript/blob/master/de.peeeq.wurstscript/src/main/java/de/peeeq/wurstio/languageserver/requests/RunMap.java), [PR #1306](https://github.com/wurstscript/WurstScript/pull/1306)). Wurst shipped 3.0 support within days: bundled `common.j`/`blizzard.j` for 3.0 (#1308), optimizer for 3.0 natives (#1307), wc3libs W3I v39 (#1309), wc3libs 3.0 binary formats (#1310). |
| [Drake53/War3Net](https://github.com/Drake53/War3Net) | 2026-08-01; release v6.0.3 2026-07-04 | .NET toolkit: MPQ, BLP, JASS, map building; C# maps via CSharp.lua ([README](https://github.com/Drake53/War3Net/blob/master/README.md)) | Not stated in README; `War3Map.Example` is deprecated in favour of [War3Map.Template](https://github.com/Drake53/War3Map.Template) (pushed 2021-04-06, no README). CLI "Coming soon". |
| [yatyricky/SharpForge](https://github.com/yatyricky/SharpForge) | 2026-09-14 | C# → Lua; `sf-build` "Lua bundler and map injector"; "World Editor still owns terrain, object data, and placed units" ([README](https://github.com/yatyricky/SharpForge/blob/master/README.md)) | Not stated in README. |
| [StephenSHorton/wc3-forge](https://github.com/StephenSHorton/wc3-forge) | 2026-09-05 | Go + Svelte native map editor with MCP server; trigger editor with "GUI→Lua/JASS codegen", "Convert-Map-to-Lua + Test Map"; saves "packaged `.w3x` / MPQ archives"; uses CascLib ([README](https://github.com/StephenSHorton/wc3-forge/blob/master/README.md)) | In-app "Test Map". |
| [stijnherfst/HiveWE](https://github.com/stijnherfst/HiveWE) | 2026-09-22 | C++ editor; writes w3i version 39 since 2026-09-20 ([commit 9f04c14](https://github.com/stijnherfst/HiveWE/commit/9f04c14)) | Editor, not a build pipeline. |
| [w3champions/map-updater-scripts](https://github.com/w3champions/map-updater-scripts) | 2026-09-19 | Copy of wc3-ts-template with newer TS/TSTL (see 1.8) | Same `npm run test` as the template. |
| [KrayOristine/OzzyProject](https://github.com/KrayOristine/OzzyProject) | 2026-07-06 | "Warcraft III Reforged ... custom map", TypeScript | Not inspected. |

---

## 3. What 3.0.0 changed for map packaging and testing

### 3.1 Patch facts (Blizzard)

"Version 3.0.0 Build 24268 September 12, 2026" ([Forsaken Kingdom patch notes](https://us.forums.blizzard.com/en/warcraft3/t/warcraft-iii-reforged-forsaken-kingdom-patch-notes/38400)). Verbatim lines relevant to Map projects:

- Networking: "Lan mode has been removed (players can still play LAN via the Classic Client)".
- General: "Reforged client now requires players to be online at all times (offline mode still available via the Classic Client)".
- General: "Addon system has been deprecated, players can now choose between Classic, Definitive Edition and Reforged".
- World Editor: "Added new lighting editor", "Added option to convert triggers to Lua", "Added 'Copy As Script' option for triggers", "Added various new ability natives".

The patch notes contain no lines about the map file format, `.w3i`, map protection, or `-loadfile`. The Hive announcement thread repeats the same editor lines and adds nothing on format ([Hive 374111](https://www.hiveworkshop.com/threads/warcraft-3-reforged-forsaken-kingdom-expansion-and-major-updates.374111/), first post 2026-09-12).

PTR "Build 24281 - September 17" ([Blizzard forum 38990](https://us.forums.blizzard.com/en/warcraft3/t/new-300-ptr-build-24281-september-17/38990)): "For map creators, if any of your custom maps are still broken after this patch, please provide us with a link to your map and a detailed description of what's broken compared to 2.0 in the forum and we will also take a look at it."; "Fixed custom textures not loading properly when launched through World Edit test map"; "Fixed a bug with loading custom assets in a map"; "Broken SD / HD doodads due to DE addition are no longer broken".

### 3.2 `.w3i game_data_version` gotcha

- Hive "Warcraft III 3.0 Bugs & issues" (Wareditor, first post 2026-09-13, 3 pages), Major Bugs: "Maps saved before the `.w3i`'s `game_data_version` field existed get treated as a 'Forsaken Kingdom' map (latest version)." Post #29 (NVS): "Maps saved before the .w3i game_data_version field existed get bucketed as 'Forsaken Kingdom' in 3.0", which "default[s] Use Relative Upgrade Costs to False" for maps that "were always built for True, so upgrade costs break again" ([Hive 374131](https://www.hiveworkshop.com/threads/warcraft-iii-3-0-bugs-issues.374131/)). Pages 2–3 of the thread add nothing on this topic.
- Where the field lives (tool sources): HiveWE `map_info.ixx` reads `game_data_version` only `if (version >= 31)`, after the script-language and supported-modes ints, and writes `1` by default ([map_info.ixx](https://github.com/stijnherfst/HiveWE/blob/master/src/base/map_info.ixx)). WC3MapTranslator writes it after `scriptLanguage` and `supportedModes` in v33 (section 2.4). mdx-m3-viewer-th reads the same slot as `unknown1` for `version > 30` (section 2.5). So a w3i with file version ≤ 30 (pre-1.32 editors) has no such field at all; that is the "saved before the field existed" case.
- Values: wc3libs (WurstScript's format library) now defines `enum GameDataVersion { ROC(0), TFT(1), FORSAKEN_KINGDOM(2) }` ([W3I.java](https://github.com/inwc3/wc3libs/blob/master/src/main/java/net/moonlightflower/wc3libs/bin/app/W3I.java) L784-787), i.e. 3.0 introduced value 2 for the Forsaken Kingdom data set; WC3MapTranslator and HiveWE know only 0/1.
- Because the template stores `war3map.w3i` byte-for-byte (1.4), whether a template-built map hits this gotcha depends entirely on the editor version that saved `maps/<mapFolder>`; the template itself neither reads nor sets the field.

### 3.3 `.w3i` file version 39 and other format changes

- wc3libs commit "Support W3I format version 39 (#100)" (2026-09-13) extends the graphics enum to `SD(1), HD(2), SD_AND_HD(3), DE(4), SD_AND_DE(5), HD_AND_DE(6), SD_HD_AND_DE(7)` and adds "Version 39 fields": alpha-tile minimap colour, terrain fog style/over-sky/linear start/end/max opacity/height start/end, sky display, time of day, water min/max opacity, reflectivity, emissivity, edge softness, wave vertex displacement, wave normal-map strength, override colour, env-map reflectivity, plus one unknown ([commit 52924b921f](https://github.com/inwc3/wc3libs/commit/52924b921f)). Follow-ups: "Support Warcraft III 3.0 map formats (#102)", "Preserve v39 HUD skins in config prelude (#103)", "Harden map binary read-write cycles (#104)" (2026-09-15) ([commits](https://github.com/inwc3/wc3libs/commits/master)).
- HiveWE commit "Update map file parsers" (2026-09-20) changes `write_version = 33` → `39`, adds `hud_skin`, `loading_screen_source`, fog and water fields, and names new flag bits: `use_terrain_fog * 0x2000`, `requires_expansion * 0x4000`, `override_hd_water_color * 0x800000`, `alpha_tile_default_minimap_color * 0x1000000`, `dynamic_minimap * 0x2000000`; it also touched doodads, units, regions and cameras parsers ([commit 9f04c14](https://github.com/stijnherfst/HiveWE/commit/9f04c14)).
- Consequence for the template's toolchain: `mdx-m3-viewer-th` 5.13.4 has no v39 branch (2.5) and `war3-objectdata-th` 0.2.11 predates 3.0; the template only parses w3i inside `save()` (1.4). Whether a v39 `war3map.w3i` saved by the 3.0 editor parses without error in `getMapInformation()` was not tested (section 4).
- Protected maps / MPQ container: no source read (patch notes, PTR notes, Hive threads, tool commits) documents a change to the MPQ container or to protected-map handling in 3.0.0. The wc3libs "3.0 map formats" work is about w3i/object-data/import/trigger/WTS round trips ([PR #1310](https://github.com/wurstscript/WurstScript/pull/1310)).

### 3.4 Testing: offline test removed, LAN removed, login

- Reforged 3.0 client is online-only and LAN is removed (3.1). The Hive 3.0 bugs thread, Issues section: "Having to login when testing map from the editor or from the command line is a big pain point. Not being able to test your map while offline is very frustrating. Removal of LAN." ([Hive 374131](https://www.hiveworkshop.com/threads/warcraft-iii-3-0-bugs-issues.374131/)).
- The login prompt on editor "Test Map" is older than 3.0: a Blizzard forum thread "Requiring Login to Test an offline map?" dates from 2023-12-17 ("When I launch the game using the 'Test Map' option in World Editor, an arrogant system asks me to login to BattleNet"), with no Blizzard reply ([forum 31604](https://us.forums.blizzard.com/en/warcraft3/t/requiring-login-to-test-an-offline-map/31604)). What 3.0 removed is the offline mode of the Reforged client itself.
- `-loadfile` still launches a map on 3.0.0.24268, with a login caveat. WurstScript PR #1306 (merged 2026-09-12): "add `-editor` to default Warcraft III launch arguments for Reforged 3.0 and newer"; "manually reproduced the login prompt with the existing Wurst command on Warcraft III 3.0.0.24268"; "manually verified that adding only `-editor` reuses the saved login and starts the map"; the jass-history target is `Reforged-v3.0.0.24268-w3-3a9d8f2` ([PR #1306](https://github.com/wurstscript/WurstScript/pull/1306)). The template's launch args (`-loadfile <folder> -launch -windowmode windowed`) do not include `-editor`.
- Fixus records that Reforged's `-launch` lobby ignores custom force layouts unless w3i flag `0x20` "Fixed player settings" is set (2.1); this is a Reforged-era note, not specific to 3.0.

### 3.5 Editor: "Copy As Script" / "convert triggers to Lua"

Both are listed verbatim in the 3.0.0 World Editor notes (3.1). No primary source read describes their output format or how they interact with `war3map.lua`; wc3-forge independently offers "GUI→Lua/JASS codegen" and "Convert-Map-to-Lua" (2.6).

---

## 4. Not verified / could not be reached

- Whether `mdx-m3-viewer-th`'s `War3MapW3i.load()` throws or silently mis-parses a version-39 `war3map.w3i` (and therefore whether `map.save()` still works on a folder saved by the 3.0 editor). Not executed; inferred only from the absence of a `version > 33` branch.
- Whether the 3.0 editor writes w3i version 39 for every save, or only when new features are used. wc3libs and HiveWE both add v39 in response to 3.0, but neither commit message states the editor's default.
- w3x2lni's supported game versions (docs page read does not state them; project is Chinese-language).
- `wurstlang.org/tooling.html` returned 404; Wurst launch behaviour was read from `RunMap.java` instead.
- War3Net and SharpForge launch mechanisms (READMEs do not state them; not inspected further).
- Whether the "Copy As Script"/"convert triggers to Lua" editor features change `war3map.lua` layout in a way that affects the template's "editor script + tstl bundle" concatenation.
- `voces/w3xio` purpose (no README, no npm package).

## Sources (primary)

- Template: <https://github.com/cipherxof/wc3-ts-template> (package.json, config.json, tsconfig.json, scripts/{build,dev,test,utils}.ts, src/main.ts, README; issues #17 #19 #20 #21 #24 #26 #27 #28; PRs #18 #23)
- Transformer: <https://github.com/cipherxof/war3-transformer> (package.json, README, src/transformer.ts)
- MPQ/w3i writer: <https://github.com/cipherxof/mdx-m3-viewer> (src/parsers/mpq/archive.ts, src/parsers/w3x/map.ts, src/parsers/w3x/w3i/file.ts); npm `mdx-m3-viewer-th`
- Docs: <https://cipherxof.github.io/w3ts/docs/getting-started>, <https://cipherxof.github.io/w3ts/docs/configuration>
- voces: <https://github.com/voces/fixus> (README, deno.json, scripts/build.ts, scripts/run.ts), <https://github.com/voces/w3api>, <https://github.com/voces/w3xdata>, <https://github.com/voces/w3ts-jsx>; npm `@voces/w3ts`, `w3api`, `w3xdata`
- Ceres: <https://github.com/ceres-wc3/ceres>, <https://github.com/ceres-wc3/ceres-ts-template>
- w3x2lni: <https://github.com/sumneko/w3x2lni>, <https://sumneko.github.io/w3x2lni/#/en-us/>; <https://github.com/eiriksgata/wc3-map-ts-template>
- WC3MapTranslator: <https://github.com/ChiefOfGxBxL/WC3MapTranslator> (README, CHANGELOG, src/translators/InfoTranslator.ts)
- Wurst: <https://github.com/wurstscript/WurstScript> (PRs #1306 #1308 #1309 #1310, RunMap.java); wc3libs <https://github.com/inwc3/wc3libs> (commit 52924b921f, W3I.java)
- HiveWE: <https://github.com/stijnherfst/HiveWE> (commit 9f04c14, src/base/map_info.ixx)
- Others: <https://github.com/Drake53/War3Net>, <https://github.com/yatyricky/SharpForge>, <https://github.com/StephenSHorton/wc3-forge>, <https://github.com/w3champions/map-updater-scripts>
- Blizzard: <https://us.forums.blizzard.com/en/warcraft3/t/warcraft-iii-reforged-forsaken-kingdom-patch-notes/38400>, <https://us.forums.blizzard.com/en/warcraft3/t/new-300-ptr-build-24281-september-17/38990>, <https://us.forums.blizzard.com/en/warcraft3/t/requiring-login-to-test-an-offline-map/31604>
- Hive: <https://www.hiveworkshop.com/threads/warcraft-iii-3-0-bugs-issues.374131/>, <https://www.hiveworkshop.com/threads/warcraft-3-reforged-forsaken-kingdom-expansion-and-major-updates.374111/>
