# Typings generation: sources, generators and feasibility for 3.0.0.24268

Research ticket: [#6](https://github.com/phmilk/reforged-ts/issues/6). Feeds the "Typings strategy" ticket. Facts and tradeoffs only; no decision is made here.

All sources were read on 2026-09-23. Counts below were computed by this research from the cited files (method noted where it matters); they are reproducible with `grep`/`comm` against the same files.

## Vocabulary

- **Native**: a function/type/constant the game exposes to Lua map scripts (declared in `common.j`, `Blizzard.j`, `common.ai`).
- **Typings**: the `.d.ts` describing the Natives of one Patch.
- **Wrapper**: a library class owning one Handle (this repo's `handles/*.ts`).
- **Patch**: a released game version with build number, here **3.0.0.24268**.

## 1. What the target Patch exposes

The raw `common.j` of 3.0.0.24268, as captured by jass-history at tag `Reforged-v3.0.0.24268-w3-3a9d8f2` (commit `a392fc3d5e6c37980accbfc560b28387fc7d01bc`, 2026-09-12) [1]:

- 1681 `native`/`constant native` declarations and 139 `type` declarations (counted with `grep -oE '^\s*(constant\s+)?native\s+\w+'` and `grep -oE '^\s*type\s+\w+'`).
- Line 102: `type framehandle        extends     agent`. In war3-types-strict 1.33.0 the same type is `framehandle extends handle` [7]; this is the only parent change between the two sets for types present in both.
- `blizzard.j` at the same tag has 1056 `function` declarations [2].
- The file carries no copyright or license header (grep for `copyright|licen|blizzard entertainment` returns nothing) [1].
- jass-history's `version-list-sorted.txt` already lists a newer build, `Reforged-v3.0.0.24277-w3t-e38e03b`, and it is tagged too [3]. So "the next Patch" is not hypothetical.

## 2. Sources of truth for signatures

### 2.1 Raw `common.j` / `Blizzard.j` / `common.ai` per Patch: Luashine/jass-history

- Repo: https://github.com/Luashine/jass-history. Description: "Tracks script changes across versions. Quantum-mechanically unstable repo." README: "Only tags are stable references." and "expect commits to be rebased" [3].
- Files live under `timeline/scripts/` (`common.j`, `blizzard.j`, `common.ai`, `cheats.j`, plus `.pld` credit files) at each version tag [1].
- Tags exist for every Reforged build from `Reforged-v1.32.0.13369` through `Reforged-v3.0.0.24277` (`gh api repos/Luashine/jass-history/tags`) [3].
- **License**: the GitHub API reports no license (`license: null`), there is no LICENSE file, and the README makes no license statement [3]. The companion tooling repo https://github.com/Luashine/wc3-jass-history-scripts (extraction scripts, CASC/MPQ macros) is MIT, but it contains no game files [4].
- The scripts themselves are Blizzard's. Blizzard's EULA (last revised 2024-03-21) forbids to "Copy or reproduce (except as provided in Section 1.B.), translate, reverse engineer, derive source code from, modify, disassemble, decompile, or create derivative works based on or related to the Platform" and states that Custom Games "are and shall remain the sole and exclusive property of Blizzard" [5]; the Custom Game Acceptable Use Policy (last updated 2020-01-21) repeats the ownership sentence and says nothing about extracting or redistributing game files [6]. Neither document grants a redistribution license for `common.j`; every community mirror listed here redistributes it without one.

### 2.2 Annotated `common.j` and `jass.db`: lep/jassdoc

- Repo: https://github.com/lep/jassdoc, "Document the WarCraft 3 API", last push 2026-09-17 [8]. Web front-end: https://lep.duckdns.org/jassbot/ ("Its source code and data is free"; links CLI https://github.com/lep/jassbot, data https://github.com/lep/jassdoc, web https://github.com/lep/jassbot-bp) [9].
- **Format**: the repo *is* a `common.j`, `Blizzard.j`, `common.ai` and `builtin-types.j` with Javadoc-style `/** ... */` blocks above each declaration; annotations are `@param`, `@bug`, `@note`, `@pure`, `@async`, `@event`, `@patch`, plus internal `@source-file`, `@source-code`, `@return-type` [8].
- **Coverage of 3.0.0.24268**: jassdoc's `common.j` has 1680 natives; the game file has 1681. The single missing native is `BlzPreloadModelCinematicGame`; jassdoc has no native the game lacks (set difference of the two name lists). It declares `type framehandle extends agent` (line 667) [8]. It carries 192 `@patch 3.0.0.24268` tags; the 3.0.0 work landed via PR #236 from Luashine (merged 2026-09-13) and "add v3.0.0 changes from official changelog" (2026-09-15) [8].
- **No nullability, no deprecation**: the annotation list has no nullable/optional tag, and `grep -c '@removed\|@deprecated' common.j` returns 0 [8]. Removed natives are simply absent.
- **Database**: `make` runs the Haskell `mkdocs` over the sources, appends `perl mksrc` output and `sh mkmetadata`, then `sqlite3 jass.db < db.sql` [8]. Schema (`src/schema.sql`): tables `parameters(fnname,param,value)`, `annotations(fnname,anname,value)`, `params_extra(fnname,param,anname,value)`, `metadata(key,value)` [8]. For every native/function `mkdocs.hs` inserts `params_extra` rows `param_order` and `param_type` per parameter, and `annotations` rows `return-type` and `source-file`; `mksrc` adds `source-code`, `start-line`, `end-line` and `type` (`function`/`native`/`type`/...) including the raw `type X extends Y` line [8]. So the full signature (name, ordered typed params, return type, parent type, source file, `@patch`) is recoverable from `jass.db` without parsing Jass.
- **Prebuilt db**: https://github.com/wurstscript/wurst-jassdoc-build/releases tag `latest` (published 2026-07-27) ships `jass.db` (5,840,896 bytes) and `jass.commit.txt` [10]. Building locally needs GHC, cabal, GNU make and sqlite3; the README also gives a Docker recipe and a nix flake [8].
- **License**: jassdoc has no LICENSE file (GitHub API `license: null`, `contents/LICENSE` returns 404) [8]. The CLI `lep/jassbot` is GPL-3.0 and the web app `lep/jassbot-bp` is AGPL-3.0 per GitHub's license detection [11]. The doc text is community-contributed via PRs [8]. The same Blizzard-ownership caveat as 2.1 applies to the embedded `common.j`.
- Known consumers listed by jassdoc: WurstScript (shows entries for natives), `j2nppac` (annotations to Notepad++ autocompletion), two VS Code extensions. None of them is a `.d.ts` generator [8].

## 3. Existing generators

### 3.1 TinkerWorX/war3-types-strict (JSON db -> `.d.ts`)

- Repo: https://github.com/TinkerWorX/war3-types-strict, MIT, author "Nikolaj 'William' Mariager", npm `war3-types-strict@0.1.3` published 2023-02-05; last repo push the same day [7][12]. This repo depends on it (`package.json` dependency `war3-types-strict: ^0.1.3`, `tsconfig.json` types entry `war3-types-strict/1.33.0`) [13].
- **Input**: a directory per Patch (`1.29.2/`, `1.32.10/`, `1.33.0/`) each holding `types/`, `globals/`, `natives/`, `functions/` with one JSON file per declaration. README: "All contributions ... should be done in the json files, as these serve as the database for the generator" [7]. Record shapes (from `build.ts` type declarations):
  - type: `{name, extends, source, description?}`
  - global: `{name, isConstant, type, isArray, value, isNullable, source, description?}`
  - native/function: `{name, takes: [{name, type, isNullable, description?}], returns, isNullable, source, description?}`
  The `type` fields already hold **TypeScript** names: `CreateUnit.json` has `"type": "number"` for `unitid`/`x`/`y`/`face` and `"returns": "unit", "isNullable": true` [7]. The Jass `integer`/`real` distinction is therefore not in the database.
- **Layering**: `npm run build` = `ts-node build.ts 1.29.2 1.32.10 1.33.0`; each version directory is read in order into shared `Map`s, "overwriting any previous keys if relevant" [7]. `1.33.0/` contains only a `natives/` directory with 13 JSON files (the order-queue natives, `BlzGetAbilityId`, etc.); `1.32.10/natives/` holds 278 files [7]. There is no deletion record: a native removed by a Patch stays declared unless its JSON is deleted from every older layer.
- **Output** (`build.ts`): one `.d.ts` per source (`common.j.d.ts`, `common.ai.d.ts`, `blizzard.j.d.ts`) plus a `<version>.d.ts` of triple-slash references to `compat.d.ts` (`declare interface handle { __handle: never; }`), the three files and `polyfill.d.ts` (`declare function FourCC(str: string): number;`) [7]. Each file starts with `/** @noSelfInFile */`. Types become `declare interface X extends Y { __X: never; }`; globals `declare const|var` (arrays as `Record<number, T>`); natives `declare function` with `| undefined` appended to nullable returns, trailing nullable params turned into optional `?` params, and non-trailing nullable params typed `T | undefined` [7]. Descriptions are never written (no JSDoc emission in `build.ts`; the generated `common.j.d.ts` has one comment line, the header) [7].
- **Strictness observed in `1.33.0/common.j.d.ts`**: 1547 `declare function`, 134 `declare interface`; `CreateUnit(...): unit | undefined`, `GetTriggerUnit(): unit | undefined`, `GetUnitName(whichUnit: unit): string | undefined` (all 57 string-returning natives are `string | undefined`, none plain `string`), `BlzCreateFrame(...): framehandle | undefined`; `code` parameters are `() => void` (`TriggerAddAction`, `TimerStart`, `ForGroup`, and also `Condition`/`Filter`, which in Jass take a boolean-returning `code`) [7]. Nullability is hand-curated per record, not derived from the Jass source.
- **Gap to 3.0.0.24268** (name-set comparison of the 1.33.0 output with the jass-history file): 138 game natives missing (e.g. `AddCameraBlocker`, `AllowHeroGlowOnUnit`, `BlzAdjustUnitAbilityCooldownPercent`, `BlzCameraGetCameraType`), 5 types missing (`equipmentType`, `fogstyle`, `itemTag`, `loadoutslot`, `metakeytype`), 4 declared natives the game no longer has (`RequestExtraBooleanData`, `RequestExtraIntegerData`, `RequestExtraRealData`, `RequestExtraStringData`), 71 `Blizzard.j` functions missing, and the `framehandle` parent difference from section 1 [1][2][7].

### 3.2 cipherxof/war3-types + convertjasstots (raw Jass -> `.d.ts`)

- Repo: https://github.com/cipherxof/war3-types, MIT, npm `war3-types@1.0.4`, authors "TriggerHappy, Promises, and MindWorX", last push 2020-10-23, no README [14].
- **Input**: the raw game files checked in under `scripts/` (`common.j` 355,532 bytes, `blizzard.j` 471,054, `common.ai` 95,876). `build.js` calls `new JassParser().main(['', '', "scripts/common.j", "core/common.d.ts"])` for each [14].
- **Generator**: npm `convertjasstots@1.0.13` (MIT, repo https://github.com/Promises/JassToTs, last push 2020-10-23, README is the single line "# JassToTs"; the GitHub repo has no LICENSE file, the npm package.json says MIT) [15][16]. `src/jassParser.ts` (10 KB) is regex-based (`type\s+(?<name>\w+)\s+extends\s+(?<parent>\w+)` for types). `FixType` maps `real`/`integer` -> `number`, `nothing` -> `void`, `code` -> `() => void`, `boolexpr` parameters -> `boolexpr | (() => boolean) | null`, and special-cases `Filter`/`Condition` to take `() => boolean` [15].
- **Output**: `/** @noSelfInFile **/`, branded `declare interface X extends Y { __X: never; }`, 1534 `declare function` in `core/common.d.ts`; `core/compat.d.ts` declares `handle` as `declare abstract class handle { __handle: never; }` (war3-types-strict uses `declare interface`) [14]. No nullable returns at all: `CreateUnit(...): unit`, `GetTriggerUnit(): unit`, `GetUnitName(whichUnit: unit): string` [14].
- **Gap to 3.0.0.24268**: 151 game natives missing (name-set comparison) [1][14]. Regenerating from a newer `common.j` is a one-command job, but every strictness fact beyond the parent chain would have to come from somewhere else.

### 3.3 A jassdoc-driven generator

No `.d.ts` generator that reads jassdoc or `jass.db` was found among jassdoc's listed consumers [8]. The inputs such a generator would need are all present (section 2.2): typed ordered params, return type, parent type, source file, `@patch`, `@pure`, `@async`, `@bug`, `@note`, descriptions in Markdown. What is absent is nullability of returns/params and any deprecation marker [8].

## 4. What the two sibling libraries ship

### 4.1 voces/w3ts

- Fork of cipherxof/w3ts, MIT, npm `@voces/w3ts@4.0.1`, last push 2026-05-17 ("feat!: dual-target ESM/Lua, rebase on cipherxof@8a11908"; "fix: restore @noSelfInFile directive across sources") [17].
- Ships **no** `.d.ts` of its own (`git/trees/master?recursive=1` filtered on `.d.ts` returns nothing). Depends on `war3-types-strict: ^0.1.3` and its `tsconfig.json` lists `war3-types-strict/1.33.0`, exactly like this repo [17][13].

### 4.2 eiriksgata/wc3ts

- Repo: https://github.com/eiriksgata/wc3ts, MIT, npm `@eiriksgata/wc3ts@3.2.11`, last push 2026-08-21, not a GitHub fork; README (Chinese) says it "only provides interfaces and types, plus object wrappers" and targets the DzAPI/JAPI extension ecosystem [18].
- Ships hand-maintained declaration files under `src/types/`: `base.d.ts` (10 KB), `common.d.ts` (188 KB), `japi.d.ts` (197 KB), plus small `console`, `debug`, `runtime`, `index` files; no generator or script is in the repo (`package.json` scripts are lint/version only) [18].
- `base.d.ts` uses the same branded-interface pattern (`declare interface unit extends widget { __unit: never; }`) with `/** @noSelfInFile **/`, but declares `type framehandle = number;` (line 297) [18].
- `common.d.ts`: 1167 `declare function`, 706 JSDoc blocks whose text is the Chinese World Editor GUI strings (e.g. `Acos`: "反余弦(弧度)[R]"), no `| undefined` or `| null` returns, no `@deprecated`/`@patch`, and none of `BlzCreateFrame`, `BlzTriggerIsRunning`, `GetEquippedItem` (no Reforged-era Natives) [18].

## 5. How strictness is expressed, side by side

| Concern | war3-types-strict 1.33.0 [7] | cipherxof/war3-types [14] | eiriksgata/wc3ts [18] | jassdoc / raw common.j [8][1] |
|---|---|---|---|---|
| Nullable returns | `T \| undefined`, hand-curated `isNullable` per record (all 57 string natives, `CreateUnit`, `GetTriggerUnit`, `BlzCreateFrame`) | none | none | not expressed |
| Nullable params | trailing -> optional `?`, else `T \| undefined` | `boolexpr` params accept `null` | none | not expressed |
| Handle hierarchy | branded `declare interface X extends Y { __X: never }`; `handle` is an interface | same pattern; `handle` is `declare abstract class` | same pattern for handles; `framehandle` is `number` | `type X extends Y` lines; parent of every type |
| `framehandle` parent | `handle` | `handle` | n/a (`number`) | `agent` |
| `@noSelf` | `/** @noSelfInFile */` per file | same | same | n/a |
| integer vs number | both `number`; the JSON db stores `number` | both `number` (`FixType`) | `number` | `integer`/`real` preserved |
| `code` callbacks | `() => void` everywhere, incl. `Condition`/`Filter` | `() => void`; `Filter`/`Condition` take `() => boolean` | n/a | `code` |
| `@deprecated` | none | none | none | none (no removed/deprecated tag) |
| `@patch` | none | none | none | `@patch <build>` on natives (192 for 3.0.0.24268) |
| Descriptions | none emitted | none | Chinese GUI strings | Markdown descriptions, `@note`, `@bug`, `@pure`, `@async`, `@event` |
| Removed Natives | stay declared (no deletion layer) | dropped on regeneration | manual | absent from file |

## 6. TypeScriptToLua declaration constraints

From https://typescripttolua.github.io/docs/advanced/writing-declarations [19]:

- Three ways to say a function has no contextual `self`: `this: void` as first parameter; `@noSelf` "in the comments of the declaration's owner (the namespace, module, object, etc)"; `@noSelfInFile` "at the beginning of the file in a comment to make sure every function defined in this file does not use a 'contextual parameter.'" "By doing this, the transpiler also figures out if it needs to use `:` or `.` when invoking a function / method." All three surveyed Typings use `@noSelfInFile`; voces/w3ts's latest commit had to restore it across sources [17].
- Globals are `declare const`, `declare function`, `declare namespace`; declaration files are `.d.ts`, installed via npm and listed in the tsconfig `types` field.
- "usually you shouldn't use `declare class` for values coming from Lua" because for tstl a `class` "implies a very specific structure". cipherxof/war3-types's `declare abstract class handle` is the one place the surveyed Typings do this [14].
- Operator overloading cannot be expressed; the page gives no guidance on nullable types, integer vs number, or branded types.
- Multiple returns: "Prefer LuaMultiReturn over the similar @tupleReturn annotation" (https://typescripttolua.github.io/docs/advanced/language-extensions, enabled via `"types": ["@typescript-to-lua/language-extensions"]`) [20]. No Native in `common.j` returns multiple values, so this matters only for helper declarations.
- tstl has no integer type; whatever `integer` means in the Typings must be a documentation convention or a branded alias, not a compiler check.

## 7. Options

Each option lists inputs, effort (as counted facts), license, strictness ceiling, and next-Patch behaviour. They are not exclusive.

### A. Extend the war3-types-strict JSON database (fork or upstream)

- **Inputs**: a new `3.0.0.24268/` layer of JSON records; the layering rule means only additions/changes need records [7]. Source of the deltas: the jass-history file [1] or jassdoc [8].
- **Effort**: author 138 native records, 5 type records, 71 `Blizzard.j` function records, one changed `framehandle` record, and delete the 4 `RequestExtra*Data` records from the 1.32.10 layer (there is no "remove" record type) [7][1][2]. Every new record needs a hand-decided `isNullable` for the return and each parameter, since neither the game file nor jassdoc carries that fact. Globals in `Blizzard.j` were not diffed here.
- **License**: MIT [7]. Upstream is inactive since 2023-02-05 [7][12]; both this repo and voces/w3ts already consume it [13][17].
- **Strictness ceiling**: nullable returns/params, branded hierarchy, `@noSelfInFile`. No descriptions, no `@patch`/`@deprecated`, no integer/real distinction (lost at the db level) unless `build.ts` and the record schema are extended.
- **Next Patch**: add another layer directory and one more argument to `ts-node build.ts`; someone must still diff the new `common.j` by hand or with a script and decide nullability for each addition. Removals require editing older layers.

### B. Regenerate from the raw `common.j` with a Jass parser (convertjasstots or a rewrite)

- **Inputs**: `common.j`, `Blizzard.j`, `common.ai` for the Patch (jass-history tag [1][2]); `convertjasstots@1.0.13` [15] or a new parser (the Jass declaration grammar handled today is three regexes [15]).
- **Effort**: one `node build.js` run per Patch once the files are in place [14]. Producing strictness beyond the parent chain means adding an overlay (e.g. a nullability list keyed by native name) and merging it in the generator; the existing tool has no such hook [15].
- **License**: MIT for war3-types and for the npm package; the JassToTs GitHub repo has no LICENSE file [14][15][16].
- **Strictness ceiling** as shipped: branded hierarchy and `@noSelfInFile` only; no nullability, integer collapsed to `number`, `code` typed as `() => void` [14][15]. Anything else is overlay work.
- **Next Patch**: fully mechanical for signatures, including removals and parent changes (they come from the file). Overlay entries for new natives are the only manual step.

### C. Generate from jassdoc (`jass.db` or the annotated `common.j`)

- **Inputs**: `jass.db` (prebuilt from wurst-jassdoc-build [10], or built with GHC/cabal/make/sqlite3, Docker or nix [8]) or the annotated source files parsed directly. Everything needed for a signature is in `params_extra.param_type`/`param_order`, `annotations.return-type`, `annotations.source-file`, and `source-code` for the `type X extends Y` line [8].
- **Effort**: a new generator (none exists [8]). Coverage is 1680 of 1681 natives for 3.0.0.24268 [8][1]. Nullability still needs an overlay (jassdoc has no such annotation [8]).
- **License**: jassdoc data has no license file; the site says "source code and data is free" [8][9]; the tools around it are GPL-3.0/AGPL-3.0 [11], which matters only if their code (not the data) is reused.
- **Strictness ceiling**: everything Option B gives, plus real JSDoc (descriptions, `@note`, `@bug`, `@pure`, `@async`, `@event`) and `@patch` tags usable to emit per-Patch availability or `@since`. `integer`/`real` are preserved in `param_type`/`return-type`, so an `integer` alias could be emitted. Nullability and `@deprecated` remain overlay work.
- **Next Patch**: depends on jassdoc's update cadence; for 3.0.0 the annotations landed within days of the build (tag 2026-09-12, PR merged 2026-09-13, changelog pass 2026-09-15) [1][8]. Until jassdoc catches up, a new native is simply absent (see `BlzPreloadModelCinematicGame`).

### D. Hand-maintained `.d.ts` (eiriksgata style)

- **Inputs**: a person and a diff of `common.j` per Patch.
- **Effort**: eiriksgata/wc3ts maintains 1167 functions this way and has no Reforged natives at all [18]; the 3.0.0.24268 surface is 1681 natives + 139 types + 1056 BJ functions [1][2].
- **License**: whatever the repo chooses.
- **Strictness ceiling**: unbounded in principle; in practice eiriksgata ships no nullability and `framehandle = number` [18].
- **Next Patch**: entirely manual, including removals.

### Cross-cutting facts

- Every option that distributes Typings distributes a derivative of Blizzard-owned `common.j`; no surveyed source has a grant for that (section 2.1) [5][6]. The npm packages `war3-types-strict`, `war3-types` and `@eiriksgata/wc3ts` all do it today under MIT [7][14][18].
- Nullability is the one strictness fact no source-of-truth carries; it exists only as war3-types-strict's hand-curated `isNullable` flags [7][8][1]. Any option other than A must recreate or import that curation (the 1.33.0 JSON records are MIT and could seed an overlay for the ~1547 natives they cover).
- This repo's Wrappers already consume nullable returns (`GetUnitName(this.handle) ?? ""`, `Unit | undefined` factories, `framehandle | undefined` in `Frame`) [13], so a Typings set without `| undefined` would loosen, not break, the current code, whereas a stricter set (e.g. `framehandle extends agent`) changes what `Handle<T extends handle>` accepts only if `handle` itself changes shape.

## 8. Could not verify

- Whether jassdoc's `@patch` values are complete for every 3.0.0 native (192 tags were counted; the total number of natives new in 3.0.0 was not derived independently).
- The runtime behaviour behind any `isNullable` flag in war3-types-strict (they are contributor judgement; no test corpus exists in the repo).
- Whether Blizzard has ever objected to `common.j` mirrors; only the EULA/AUP text was read, no enforcement record.
- `Blizzard.j` globals and `common.ai` were not diffed against the Patch; only native/type/BJ-function names were.

## Sources

1. jass-history `timeline/scripts/common.j` at tag `Reforged-v3.0.0.24268-w3-3a9d8f2` (commit `a392fc3d5e6c37980accbfc560b28387fc7d01bc`): https://github.com/Luashine/jass-history/blob/a392fc3d5e6c37980accbfc560b28387fc7d01bc/timeline/scripts/common.j
2. jass-history `timeline/scripts/blizzard.j` at the same tag: https://github.com/Luashine/jass-history/blob/a392fc3d5e6c37980accbfc560b28387fc7d01bc/timeline/scripts/blizzard.j
3. jass-history README, tags and `version-list-sorted.txt`: https://github.com/Luashine/jass-history
4. jass-history tooling (MIT): https://github.com/Luashine/wc3-jass-history-scripts
5. Blizzard End User License Agreement (last revised 2024-03-21): https://www.blizzard.com/en-us/legal/fba4d00f-c7e4-4883-b8b9-1b4500a402ea/blizzard-end-user-license-agreement
6. Blizzard Custom Game Acceptable Use Policy (last updated 2020-01-21): https://www.blizzard.com/en-us/legal/2749df07-2b53-4990-b75e-a7cb3610318b/custom-game-acceptable-use-policy
7. TinkerWorX/war3-types-strict: README, `build.ts`, `package.json`, `compat.d.ts`, `polyfill.d.ts`, `1.29.2/natives/CreateUnit.json`, `1.29.2/types/unit.json`, `1.32.10/types/framehandle.json`, `1.29.2/globals/bj_lastCreatedUnit.json`, `1.33.0/common.j.d.ts`, `1.33.0/blizzard.j.d.ts`: https://github.com/TinkerWorX/war3-types-strict
8. lep/jassdoc: `Readme.md`, `GNUmakefile`, `src/schema.sql`, `src/mkdocs.hs`, `mksrc`, `mkmetadata`, `builtin-types.j`, `common.j`, `extra-lua/README.md`, commit list for `common.j`: https://github.com/lep/jassdoc
9. Jassbot web front-end: https://lep.duckdns.org/jassbot/
10. Prebuilt `jass.db`: https://github.com/wurstscript/wurst-jassdoc-build/releases
11. lep/jassbot (GPL-3.0): https://github.com/lep/jassbot ; lep/jassbot-bp (AGPL-3.0): https://github.com/lep/jassbot-bp
12. npm registry metadata for `war3-types-strict` (`npm view war3-types-strict`): https://www.npmjs.com/package/war3-types-strict
13. This repository: `package.json`, `tsconfig.json`, `handles/handle.ts`, `handles/unit.ts`, `handles/frame.ts` at `master` (`831ab74`).
14. cipherxof/war3-types: `package.json`, `build.js`, `core/common.d.ts`, `core/compat.d.ts`, `scripts/`: https://github.com/cipherxof/war3-types
15. Promises/JassToTs `src/jassParser.ts`, `package.json`: https://github.com/Promises/JassToTs
16. npm registry metadata for `convertjasstots` (`npm view convertjasstots`): https://www.npmjs.com/package/convertjasstots
17. voces/w3ts: `package.json`, `tsconfig.json`, commit list, tree listing: https://github.com/voces/w3ts
18. eiriksgata/wc3ts: `README.md`, `package.json`, `src/types/base.d.ts`, `src/types/common.d.ts`, `src/types/japi.d.ts`: https://github.com/eiriksgata/wc3ts
19. TypeScriptToLua, Writing Declarations: https://typescripttolua.github.io/docs/advanced/writing-declarations
20. TypeScriptToLua, Language Extensions: https://typescripttolua.github.io/docs/advanced/language-extensions
