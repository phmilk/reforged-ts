# Reusing jassdoc for doc comments: structure, licensing, generation

Research notes for ticket [#17](https://github.com/phmilk/reforged-ts/issues/17). Facts only; no decision. Feeds the "TSDoc standard and tooling" ticket.

Vocabulary: **Native** = a function/type/constant the game exposes to Lua map scripts. **Typings** = the `.d.ts` describing the Natives of one Patch. **Wrapper** = a library class owning one Handle. **Patch** = a released game version with build number (e.g. `3.0.0.24268`).

Snapshot dates: jassdoc inspected at commit `8610958b3b77b8213f9db45ab664458650a07294` (2026-09-17, "Merge pull request #239 from Luashine/pr/removed-requestextra"), cloned 2026-09-23. Tool versions read from their `main`/`master` branches on 2026-09-23: `@microsoft/tsdoc` 0.17.0, `eslint-plugin-tsdoc` 0.5.3, TypeDoc 0.28.20, `@microsoft/api-extractor` 7.59.2.

## 1. Facts at a glance

| Question | Finding | Source |
|---|---|---|
| Is jassdoc licensed? | No. No `LICENSE`/`COPYING` file; GitHub reports `license: null`; the repo's own `jassdoc.nix` says `license = "unknown"`. | [§2](#2-licensing) |
| Does anything grant reuse outside GitHub? | Nothing found. GitHub ToS grants view + fork "through the Service" only. | [§2](#2-licensing) |
| Data format | Javadoc-like `/** ... */` blocks with Markdown prose, then `@tag` lines; a Haskell tool compiles them into a SQLite `jass.db` (3 tables + metadata). No JSON export in the repo. | [§3](#3-data-format-and-build) |
| Coverage of 3.0.0 Natives | 136 Natives carry `@patch 3.0.0.24268`; 134 of them have *only* that tag; 2 have prose. | [§4](#4-coverage-and-quality) |
| Coverage overall (common.j) | 1680 Natives, all with a block; 751 have a description, 691 have only `@patch`. | [§4](#4-coverage-and-quality) |
| Existing jassdoc → TSDoc/LuaLS converter | None found. Consumers are search UIs, editor lookups, a C# parser, and WurstScript hover docs (reads `jass.db` at runtime). | [§5](#5-existing-consumers)
| TSDoc constraints | Custom tags must be declared in `tsdoc.json` (`@patch`, `@note`, `@bug`, `@async`, `@pure`, `@event` are valid names; `@source-file`/`@source-code`/`@return-type` are not); `@param` needs a hyphen; `}` and `>` must be escaped; `@event` collides with a TypeDoc modifier tag. | [§6](#6-tsdoc-tooling-and-comment-shape-constraints) |
| This repo today | 266 `/**` blocks in `handles/`, `system/`, `globals/`, `utils/`, `hooks/`; several sentences are verbatim jassdoc text; no `tsdoc.json`, no `eslint-plugin-tsdoc`. | [§7](#7-state-of-this-repository) |

## 2. Licensing

### 2.1 What the jassdoc repository says

- Root listing of the clone at `8610958` contains no `LICENSE`, `COPYING`, or `NOTICE` file (files present: `annotate`, `Blizzard.j`, `builtin-types.j`, `check-revision`, `check-wrong-params`, `common.ai`, `common.j`, `extra-jass/`, `extra-lua/`, `flake.lock`, `flake.nix`, `GNUmakefile`, `jassdoc.cabal`, `jassdoc.nix`, `lint`, `mkmetadata`, `mksrc`, `Readme.md`, `src/`).
- `gh api repos/lep/jassdoc` returns `"license": null` (queried 2026-09-23).
- `jassdoc.nix` line 24: `license = "unknown";` — the maintainer's own packaging metadata declares no license.
- `grep -rniE 'licen[cs]e|copyright|public domain|cc-by|creative commons'` over the non-`.j` files matches only that `jassdoc.nix` line. `git log --all -i --grep='licen'` matches no commit. `gh search issues license --repo lep/jassdoc` returns only #47 ("Addition of WorldEdit help strings"), which is unrelated.
- `jassdoc.cabal` has no `license:` field (fields present: `cabal-version`, `name`, `version`, `author: lep`, `build-type`, `extra-source-files`).
- The Hiveworkshop announcement thread linked from the README ([hiveworkshop.com/threads/jassdoc.275521](https://www.hiveworkshop.com/threads/jassdoc.275521/), opening post 2016-02-09 by LeP) contains no license or permission statement. The closest sentence is that LeP wrote "a programm which creates an sqlite database for all annotated functions so that everybody can use it"; that describes the tool, not a grant over the prose.
- Authorship is spread: 531 commits from 20 authors (`git shortlog -sn HEAD`; top: lep 250, Luashine 167, Water 52, Cokemonkey11 11, theguywhodoesntcare 8, Frotty 7, Tasyen 7, wiselen 6, Tomotz 5, sotzaii_shuen 5, …), first commit 2016-02-08. There is no CLA or DCO file in the repo. Any later licensing would need to cover these contributions.
- The annotated files embed Blizzard's `common.j`, `Blizzard.j` and `common.ai` verbatim (the doc comments are interleaved with Blizzard's declarations). The repo makes no statement about the game files' copyright either. The `common.j` header is only Blizzard's original banner comment ("Native types. All native functions take extended handle types …").

### 2.2 What applies when there is no license

- GitHub Terms of Service, section D.5 "License Grant to Other Users": "By making a repository public, you grant other Users a nonexclusive, worldwide license to use, display, perform and reproduce (by forking) Your Content through the Service as permitted by GitHub's functionality. You may grant additional rights by adopting a license." ([docs.github.com](https://docs.github.com/en/site-policy/github-terms/github-terms-of-service))
- choosealicense.com (GitHub-operated) "No License": "If you find software that doesn't have a license, that generally means you have no permission from the creators of the software to use, modify, or share the software." Its listed options are: ask the maintainers to add a license, don't use it, or negotiate a private license. ([choosealicense.com/no-permission](https://choosealicense.com/no-permission/))

Consequence stated as fact, not as a decision: copying jassdoc prose into an MIT-licensed npm package (which redistributes the text outside GitHub, under MIT terms) is not covered by any grant found. The GitHub ToS grant covers viewing and forking on GitHub only. Whether short factual statements (e.g. "returns null when …") would be treated differently from longer expressive prose is a legal question no source found addresses; it is not assessed here.

### 2.3 Licenses of the surrounding tooling (for orientation)

| Repo | License (GitHub API, 2026-09-23) | Relationship to jassdoc content |
|---|---|---|
| lep/jassdoc | none | the data |
| lep/jassbot | GPL-3.0 | Haskell CLI/search service; parses the `.j` files |
| lep/jassbot-bp | AGPL-3.0 | Flask web UI over `jass.db` |
| lep/jassdoc-browser | GPL-3.0 | older web UI |
| wurstscript/wurst-jassdoc-build | none | nightly `jass.db` build artifacts |
| wurstscript/WurstScript | Apache-2.0 | downloads `jass.db` at runtime; does not embed it |
| Tomotz/wc3-lua-natives | none | vendors jassdoc's `.j` files verbatim under `jassdocs/` |
| Orden4/WCSharp.IO.JassDoc | MIT | C# parser only; no data |
| toeneeoh/jass-api-search | MIT | VS Code lookup extension |
| Leyki/j2nppac | none | Python converter to Notepad++ autocomplete |
| TinkerWorX/war3-types-strict | MIT | Typings generator; contains no jassdoc text (see §5.3) |

## 3. Data format and build

### 3.1 Annotation grammar (as documented)

From `Readme.md` ("How to write annotations", "List of annotations"):

- "The format roughly follows Javadoc's approach: The documentation is written as code comments above a function." Blocks are `/** … */`.
- "The doc generator supports *Markdown* syntax … currently this code library is used" → [python-markdown](https://python-markdown.github.io/).
- "Do note that the parser expects the \@annotations after the general description."
- Tags: free text first (general description), then `@param <name> <text>`, `@bug <text>`, `@note <text>`, `@pure` (no text), `@async` (no text), `@event <EVENT_NAME>`, `@patch <patch version>`.
- "Undocumented: Internal: `@source-file`, `@source-code`, `@return-type`. Proposed: `@nosideeffect`."
- The README's copy-paste template lists exactly: description, `@param`, `@bug`, `@note`, `@async / @event EVENT_NAME / @patch PATCH_VERSION`.

Tags actually present at `8610958` (`grep -oE '^\s*@[a-zA-Z-]+'`):

| Tag | common.j | Blizzard.j |
|---|---|---|
| `@patch` | 3557 | 1578 |
| `@note` | 884 | 58 |
| `@param` | 840 | 27 |
| `@event` | 236 | 0 |
| `@bug` | 231 | 101 |
| `@pure` | 124 | 0 |
| `@async` | 56 | 0 |

No other tag (no `@return`, `@see`, `@deprecated`, `@example`) occurs in the two files. Every `/**` block has exactly one `@patch` (3557 blocks / 3557 `@patch` in common.j; 1578 / 1578 in Blizzard.j; zero blocks with two).

### 3.2 Parser behaviour (as implemented)

`src/Annotation.hs` (`parseDocstring'`):

- Line-based. A line whose first whitespace-separated word starts with `@` opens a new annotation named by that word minus `@`; the rest of the line is the first line of its value.
- Subsequent lines are appended to the *current* annotation until the next `@` line. Text before the first `@` line becomes the `comment` annotation (the description).
- Leading newlines are trimmed from values (`trimWhitespace`), nothing else is normalised. Annotations are kept in file order ("we reverse the annotations to have it inserted in the db in the same order they are written").
- Any `@word` at line start is accepted; there is no tag whitelist.

`src/mkdocs.hs`:

- Handles `Typedef`, `Native`, `Function`, and `Global` (array and scalar/constant) top-level declarations, so types, globals and constants are documented, not only functions.
- `@param` values are split at the first whitespace into `(name, description)` (`extractParam`); jassdoc's `@param` therefore has **no hyphen** between name and text (0 of 867 `@param` lines contain ` - `).
- Adds tool-generated annotations per entity: `return-type` (declared return type), `source-file` (the input file), and per-parameter `params_extra` rows `param_order` (1-based index) and `param_type`.
- Output is SQL text (`db.sql`) — `delete … ; insert …` statements per entity — later loaded with `sqlite3`.
- `Annotations` has an `aeson` `ToJSON` instance, but `main` only writes SQL; there is no JSON emitter in the repo.

`mksrc` (Perl) appends the source text of each `function … endfunction` block (state machine over `function`/`endfunction`) so Blizzard.j/common.ai function bodies are stored as `source-code`. `mkmetadata` inserts the git commit into `metadata`.

### 3.3 SQLite schema

`src/schema.sql`:

```sql
CREATE TABLE IF NOT EXISTS parameters   (fnname text, param text, value text, PRIMARY KEY (fnname, param));
CREATE TABLE IF NOT EXISTS annotations  (fnname text, anname text, value text);
CREATE TABLE IF NOT EXISTS params_extra (fnname text, param text, anname text, value, PRIMARY KEY (fnname, param, anname));
CREATE INDEX IF NOT EXISTS annotation_index ON annotations(fnname);
CREATE TABLE IF NOT EXISTS metadata     (key text PRIMARY KEY, value text);
```

`annotations` has no uniqueness constraint, so one entity may have many `note`/`bug` rows (199 common.j blocks have ≥2 `@note`; 27 have ≥2 `@bug`; Blizzard.j: 6 and 13). Order is by `rowid`.

### 3.4 Build and distribution

- `GNUmakefile`: `SRC := common.j Blizzard.j common.ai builtin-types.j`; `jass.db` ← `sqlite3 jass.db < db.sql`; `db.sql` ← `cabal run mkdocs -- <files> --output db.sql` + `perl mksrc` + `sh mkmetadata`. `make check` runs `lint` (top-level definitions missing from the DB), `check-wrong-params` (`@param` names not matching the signature), `check-revision`.
- Toolchain: "a somewhat recent GHC, cabal, gnu make and the sqlite3 cli binary"; a Nix flake (`nix build github:lep/jassdoc`); a Docker recipe (Ubuntu 24.04 + ghc + cabal-install + sqlite3) in the README.
- Prebuilt `jass.db`: [wurstscript/wurst-jassdoc-build](https://github.com/wurstscript/wurst-jassdoc-build) checks upstream nightly and maintains one release tagged `latest` with assets `jass.db` and `jass.commit.txt`. The `latest` release was published 2026-07-27T08:04:23Z, i.e. **before** PR #236 (3.0.0) was merged on 2026-09-13; the prebuilt DB lags upstream at the time of writing.
- Helper `annotate`: "annotates a clean jass-file with annotations from jass.db … The workflow in case of a new common.j or Blizzard.j would be to build the jass.db with the old version and then running `annotate new-common.j new-Blizzard.j`." This is the maintainers' patch-upgrade path (PR #236's author describes trying a three-way `git merge-file` instead and concluding "Your way of regenerating the scripts from base+DB is the smarter approach").
- Extra inputs: `extra-jass/` (`reforged-hidden.j` "functions that technically exist, but were not published", `reforged-dzapi.j` placeholders, `removed.j` removed/changed signatures), `extra-lua/` (`luahelper.lua`, `builtin.lua`, extraction tooling). `common.ai` and `builtin-types.j` are in `SRC`; `extra-jass/*` are not (they are documented but not built into the DB by the Makefile).

### 3.5 jassbot (search engine) and its endpoints

- [lep.duckdns.org/jassbot](https://lep.duckdns.org/jassbot/) (also linked as lep.nrw/jassbot in the README): "JASS2 API search engine" by name or type signature, "heavily inspired by the great Hoogle". The landing page offers no database download.
- `lep/jassbot-bp` (Flask blueprint, AGPL-3.0) needs a `jass.db` (`FLASK_JASSBOT__DB`) and proxies search to the Haskell `jassbot` service (`FLASK_JASSBOT__API`). Routes in `jassbot/controller.py`: `/search/api/<query>` (JSON passthrough from the search service), `/doc/<entity>` (HTML), `/doc/api/<entity>` (JSON per entity, including the DB `commit`), `/syntax.js`. It renders Markdown with python-markdown extensions `tables`, `fenced_code`, `attr_list`, and expands `async`/`pure`/`return-type` rows into fixed sentences (e.g. "This function is asynchronous. The values it returns are not guaranteed to be the same for each player…").
- `lep/jassbot` (Haskell, GPL-3.0) is initialised with `j init common.j Blizzard.j` and answers `j search "takes handle returns integer"` / `j type <name>`.

### 3.6 Markdown constructs used in the prose

Counts over the `/** … */` bodies of `common.j` (21 016 lines) unless stated:

- Fenced code: 162 fence lines, including python-markdown attribute-list info strings such as ```` ```{.lua} ```` and ```` ```{.j} ```` (CreateUnit, GetLocalPlayer).
- Indented code blocks (4 spaces/tab): 267 lines.
- Markdown tables: 135 `|` rows (e.g. `TimerStart` tick-rate table; the map-speed table near line 192).
- Autolinks `<https://…>`: 57 lines (e.g. `GetUnitAbilityLevel`: `See: <https://github.com/lep/jassdoc/issues/152>`).
- Markdown links `[text](url)`: 105 lines contain `http`.
- Inline code with backticks: 1 031 lines; cross-references to other Natives are written as plain backticked names (`` `SetUnitX` ``), not links.
- Literal `}`: 97 lines (rawcode sets like `{'ANbu','AHbu',…}`, Lua tables). Literal `>` not at line start: 125 lines (autolinks, `->`).
- `@` mid-line (not a tag): 4 lines, all `@"` inside strings.
- Blizzard.j bodies: no tables, no fences, 6 indented-code lines, 2 autolinks.

## 4. Coverage and quality

### 4.1 common.j Natives (per-Native scan of `common.j` at `8610958`)

Scan rule: a Native's block is the `/** … */` immediately preceding its `native` line; "description" = non-empty text before the first `@` line.

| Measure | Count |
|---|---|
| Natives (`native` declarations) | 1 680 |
| Natives with a doc block | 1 680 (0 without) |
| … with a description | 751 |
| … with ≥1 `@note` | 469 |
| … with ≥1 `@bug` | 179 |
| … with ≥1 `@param` | 386 |
| … with **only** `@patch` | 691 |

Natives by `@patch` value: `1.00`=790, `1.01`=1, `1.07`=174, `1.13`=27, `1.15`=3, `1.17a`=28, `1.18a`=34, `1.24a`=103, `1.29.0.8803`=9, `1.29.2.9231`=90, `1.30.0.9655`=11, `1.31.0.11889`=193, `1.31.1.12173`=3, `1.32.0.13369`=51, `1.32.0.14411`=2, `1.32.0.14481`=3, `1.32.1.14604`=1, `1.32.10.18820`=7, `1.32.10.19202`=14, `2.0.3.22904`=1, `3.0.0.24268`=136. Patch strings mix formats (`1.00`, `1.17a`, `1.29.0.8803`).

### 4.2 Blizzard.j functions

1 056 `function` declarations; all have a block; **136** have any line beyond `@patch`; 920 are `@patch`-only. Tag totals: `@bug` 101, `@note` 58, `@param` 27.

### 4.3 The 3.0.0 Natives (PR #236)

[lep/jassdoc#236](https://github.com/lep/jassdoc/pull/236) "Update to Reforged v3.0.0" by Luashine, merged 2026-09-13T15:50:18Z, touches `Blizzard.j` and `common.j`. The PR body states the `@patch 3.0.0.24268` blocks were inserted with a small Lua script (`prepend-patches.lua`) that prepends `/**\n@patch 3.0.0.24268\n*/` to each added declaration, notes "There's a LOT of duplication for Destructable natives, we absolutely need a macro preprocessor for docs this time", and adds the type `equipmentType` ("CAPITAL T!").

At `8610958`, 136 Natives carry `@patch 3.0.0.24268`. **134 have nothing but that tag.** The two with prose:

- `SetPlayerRaceSkin` — description ("Set player's HUD skin. Specialty: allows usage of `RACE_PREF_FORSAKEN` …"), one `@param`, two `@note`.
- `SetHDWaterParamsEx` — one `@note` ("This function is used within the scope of function `main` in war3map.j. It is generated based on set map water settings.").

Ten sampled 3.0.0 Natives and their block content:

| Native | Block content |
|---|---|
| `ConvertFogStyle` | `@patch` only |
| `ConvertEquipmentType` | `@patch` only |
| `ConvertItemTag` | `@patch` only |
| `ConvertLoadoutSlot` | `@patch` only |
| `SetPlayerRaceSkin` | description + `@param` + 2 `@note` + `@patch` |
| `SetHDWaterParamsEx` | `@note` + `@patch` |
| `UnitEquipItem` | `@patch` only |
| `BlzIsKeyPressed` | `@patch` only |
| `BlzGetDoodadX` | `@patch` only |
| `BlzCreateDestructableWithSkinPitchRollColor` | `@patch` only |

(Full list of the 136 names is reproducible with the scan; it includes 32 `BlzCreate[Dead]Destructable…` variants, 11 `BlzSetHDWater…`, 12 `BlzSetTerrainFog…`, 14 `BlzGetDoodad…`.)

### 4.4 Ten long-standing Natives (quality sample)

| Native | `@patch` | Block content |
|---|---|---|
| `CreateUnit` | 1.00 | Description; a Jass and a Lua example (```` ```{.lua} ````); 5 `@param` (one with a bullet list); 2 `@note` (one with a 20-line Jass snippet and a Hiveworkshop link); 1 `@bug` with a ```` ```{.j} ```` snippet, a Blizzard-forum link and a test-map link |
| `KillUnit` | 1.00 | `@patch` only |
| `GetTriggerUnit` | 1.00 | Description + 1 `@note` |
| `TimerStart` | 1.00 | Description; 4 `@param`; 2 `@note`, one being a 9-row Markdown table |
| `DisplayTextToPlayer` | 1.00 | Description; 4 `@param`; 1 `@bug` with link; 3 `@note` |
| `SetUnitPosition` | 1.00 | Description + 2 `@note` (cross-refs as backticked names) |
| `GetLocalPlayer` | 1.00 | ~40-line description with Lua fenced code and indented Jass code; `@async` |
| `Player` | 1.00 | Description; 2 `@note`; 1 `@bug` ("In old versions (which?) crashes the game…"); `@pure` |
| `TriggerRegisterUnitEvent` | 1.00 | `@patch` only |
| `BlzSetUnitMaxHP` | 1.29.2.9231 | One-line description |
| `GetUnitAbilityLevel` | 1.13 | Description; 2 `@param`; 2 `@note` (one contains `{'ANbu','AHbu',…}` braces and an `<https://…>` autolink) |
| `BlzGetUnitAbility` | 1.31.0.11889 | 1 `@note` only |

Observed properties of the prose (facts from the samples above): examples are Jass-first with occasional Lua; rawcodes appear as Jass literals (`'hfoo'`); tone is informal and sometimes hedged ("(which?)", "crashed on Classic"); `@param` names must equal the Jass parameter names (enforced by `check-wrong-params`), which are the names the Typings would also use; cross-references are backticked identifiers without link syntax.

## 5. Existing consumers

### 5.1 Listed in jassdoc's README

- **Tomotz/wc3-lua-natives** (VS Code, no license): vendors the jassdoc repo verbatim in `jassdocs/` and `src/generateMapping.js` regex-scans the `.j`/`.ai` files into `src/data/jassdoc-map.json` (`name → {file, line, type}`) so F12 jumps to the annotated declaration. It does not convert annotations into doc comments.
- **toeneeoh/jass-api-search** (VS Code, MIT): displays doc entries in a popup (README; not inspected further).
- **Leyki/j2nppac** (Python, no license): "converts jassdoc annotations to Notepad++'s auto-completion descriptions"; PR #236 mentions it "has a patch script to append found patches as annotations".
- **WurstScript** (Apache-2.0): `de.peeeq.wurstio.languageserver.JassDocService` downloads `jass.db` from `wurst-jassdoc-build/releases/latest` into `~/.wurst/jassdoc/jass.db` (refreshes after 24 h unless `WURST_JASSDOC_DB_AUTO_UPDATE=false`), verifies the `parameters`/`annotations`/`params_extra` columns, queries by `lower(fnname) = lower(?)`, merges `params_extra` (`param_order`, `param_type`), and `formatDoc(doc, patch)` appends the patch to the hover text. The prose is fetched at runtime, not embedded in the Apache-licensed sources.

### 5.2 Others found via GitHub search (`gh search repos jassdoc`, `gh search code 'lep/jassdoc'`, `gh search code 'jass.db'`)

- **Orden4/WCSharp.IO.JassDoc** (MIT): "Parses the markdown-annotated jass files … using Pidgin"; used by `Orden4/WCSharp` `Tools.JassDoc/JassApiCollection.cs` and `Orden4/Wc3DiscordBots` JassBot.
- **Cokemonkey11/jassbot** (Matrix bot for the jassdoc API), **Cokemonkey11/wc3-ability-doc** (`sources/lep-jassdoc/update.sh`).
- **wenbinio/wc3** `scripts/gen-jass-constants.js` and **w3champions/map-updater-scripts** `items-db.ts` reference `lep/jassdoc` (not inspected).
- **Luashine's own repos** (author of 167 jassdoc commits): `jass-history` (script changes across versions, `lua-dump/`), `wc3-jass-history-scripts` (MIT, diffing historic Jass), `poc-macro-preprocessor` (GPL-3.0, "Tech writer-friendly macro preprocessor for documentation" — the preprocessor PR #236 calls for), `convert-triggerdata` (MIT). None is described as producing TypeScript or Lua doc comments.

### 5.3 Typings generators and LuaLS annotation projects

- **TinkerWorX/war3-types-strict** (MIT; last push 2023-02-05; versions 1.29.2, 1.32.10, 1.33.0) — the Typings this repo depends on (`package.json` `"war3-types-strict": "^0.1.3"`, `tsconfig.json` `"types": [... "war3-types-strict/1.33.0"]`). Its "database" is one JSON file per entity under `<version>/{types,globals,natives,functions}/` (278 native files in 1.32.10, 13 in 1.33.0). `build.ts` declares an optional `description?: string` on every entity and parameter type, but the generated `1.33.0/common.j.d.ts` (4 924 lines) contains a single `/**` (the `@noSelfInFile` header) and a code search for `description` in the repo's JSON returns nothing: descriptions are neither populated nor emitted. No reference to jassdoc in the repo (`gh search code 'jassdoc repo:TinkerWorX/war3-types-strict'` → 0).
- **cipherxof/war3-types** (MIT; last push 2020-10-23): `core/common.d.ts` (3 352 lines) also contains one `/**`.
- **LuaLS/sumneko**: `LuaLS/LLS-Addons` `addons/` has no entry matching `war|wc3|jass`. Repo searches `warcraft lua annotations`, `wc3 lua meta`, `warcraft3 sumneko`, `warcraft3 luals`, `warcraft iii lua types`, `wc3 lua definitions` each returned 0 repositories; code searches `"---@param whichUnit unit"` and `"@patch" "native" language:Lua` returned no Warcraft III hits. No jassdoc → `---@` converter was found by these queries (absence of results, not proof of absence).

## 6. TSDoc tooling and comment-shape constraints

### 6.1 TSDoc specification (`@microsoft/tsdoc` 0.17.0)

- Tag kinds ([tsdoc.org/pages/spec/tag_kinds](https://tsdoc.org/pages/spec/tag_kinds/)): block tags "should always appear as the first element on a line"; modifier tags are "parsed the same as block tags, with the expectation that their tag content is empty"; inline tags "are always surrounded by `{` and `}`". "Any content appearing prior to the first block tag is interpreted as the special 'summary' section." "Tag names start with an at-sign (`@`) followed by ASCII letters using 'camelCase' capitalization."
- Tag-name check ([StringChecks.ts](https://github.com/microsoft/tsdoc/blob/main/tsdoc/src/parser/StringChecks.ts)): `/^@[a-z][a-z0-9]*$/i`; error "A TSDoc tag name must start with a letter and contain only letters and numbers". Hence `@patch`, `@note`, `@bug`, `@async`, `@pure`, `@event` are legal names; `@source-file`, `@source-code`, `@return-type` are not.
- Standard tags ([StandardTags.ts](https://github.com/microsoft/tsdoc/blob/main/tsdoc/src/details/StandardTags.ts)):

  | Group | Tags |
  |---|---|
  | Core | `@deprecated`, `@label` (inline), `@link` (inline, multiple), `@packageDocumentation` (modifier), `@param` (multiple), `@privateRemarks`, `@remarks`, `@returns`, `@typeParam` (multiple) |
  | Extended | `@decorator` (multiple), `@defaultValue`, `@eventProperty` (modifier), `@example` (multiple), `@inheritDoc` (inline), `@override` (modifier), `@readonly` (modifier), `@sealed` (modifier), `@see`, `@throws` (multiple), `@virtual` (modifier), `@jsx*` |
  | Discretionary | `@alpha`, `@beta`, `@experimental`, `@internal`, `@public` (all modifiers) |

  Groups defined at [standardization_groups](https://tsdoc.org/pages/spec/standardization_groups/): Core "every documentation tool is expected to recognize them"; Extended "Documentation tools may or may not support them"; Discretionary "the semantics for these tags are implementation-specific". Tags not marked "multiple" may appear once per comment ("By default, a tag may only appear once", tsdoc.schema.json). There is no standard `@since`, `@note`, `@bug`, `@patch`, `@async`, `@pure` or `@event` tag.
- `@param` ([tags/param](https://tsdoc.org/pages/tags/param/)): "The `@param` tag is followed by a parameter name, followed by a hyphen, followed by a description." Missing hyphen → `tsdoc-param-tag-missing-hyphen`.
- `{@link}` ([tags/link](https://tsdoc.org/pages/tags/link/)): URL form `{@link https://example.com}` or declaration reference `{@link PackageName#Declaration}`, optional `| display text`. Declaration-reference notation "has not been finalized". `@see` ([StandardTags.ts](https://github.com/microsoft/tsdoc/blob/main/tsdoc/src/details/StandardTags.ts)): "TSDoc instead requires an explicit `{@link}` tag to make hyperlinks."
- `@remarks` ([tags/remarks](https://tsdoc.org/pages/tags/remarks/)): "The main documentation for an API item is separated into a brief 'summary' section, optionally followed by a more detailed 'remarks' section." `@example` ([tags/example](https://tsdoc.org/pages/tags/example/)): "Text appearing on the same line as the `@example` tag should be interpreted as a title for the example."
- Parser messages relevant to jassdoc prose ([TSDocMessageId.ts](https://github.com/microsoft/tsdoc/blob/main/tsdoc/src/parser/TSDocMessageId.ts)): `tsdoc-undefined-tag` ("The TSDoc tag ___ is not defined in this configuration"), `tsdoc-unsupported-tag` ("not supported by this tool"), `tsdoc-escape-right-brace` ("The `}` character should be escaped using a backslash"), `tsdoc-escape-greater-than` ("The `>` character should be escaped … to avoid confusion with an HTML tag"), `tsdoc-unsupported-html-name`, `tsdoc-malformed-html-name`, `tsdoc-code-fence-opening-indent` ("The opening backtick for a code fence must appear at the start of the line"), `tsdoc-code-fence-closing-indent`, `tsdoc-inline-tag-missing-braces`, `tsdoc-characters-after-inline-tag`. Applied to §3.6: every jassdoc `@param` (867 lines) lacks the hyphen; 97 common.j lines contain unescaped `}`; 125 contain `>`; 57 autolinks `<https://…>` would be read as HTML tags.
- `tsdoc.json` ([tsdoc.schema.json](https://github.com/microsoft/tsdoc/blob/main/tsdoc/schemas/tsdoc.schema.json), [tsdoc-config](https://tsdoc.org/pages/packages/tsdoc-config/)): `tagDefinitions: [{ tagName, syntaxKind: "inline"|"block"|"modifier", allowMultiple }]`; `supportForTags: { "@tag": boolean }` ("must be defined in this configuration"); `extends: [...]` for sharing; `noStandardTags`; `supportedHtmlElements` + `reportUnsupportedHtmlElements` (defaults to true when `supportedHtmlElements` is present). Loaded by `@microsoft/tsdoc-config` (`TSDocConfigFile.loadForFolder`).
- The spec's Markdown coverage is not documented: [tsdoc.org/pages/spec/overview](https://tsdoc.org/pages/spec/overview/) says "This section is still under development." Whether TSDoc parses Markdown tables was not verified from a primary source.

### 6.2 eslint-plugin-tsdoc 0.5.3

- README ([microsoft/tsdoc/eslint-plugin](https://github.com/microsoft/tsdoc/blob/main/eslint-plugin/README.md)): "provides a rule for validating that TypeScript doc comments conform to the TSDoc specification"; rule `tsdoc/syntax`; enabled via `"plugins": ["eslint-plugin-tsdoc"]`, `"rules": { "tsdoc/syntax": "warn" }`.
- Source ([eslint-plugin/src/index.ts](https://github.com/microsoft/tsdoc/blob/main/eslint-plugin/src/index.ts)): only `Block` comments starting with `/**` are checked; the `tsdoc.json` for the file is loaded through `ConfigCache.getForSourceFile`; a broken config reports "Error loading TSDoc config file: {{details}}"; each parser message is reported at its text range with the parser's `messageId` (the `tsdoc-*` ids above) and text. Custom tags are therefore accepted only if declared in `tsdoc.json`.

### 6.3 TypeDoc 0.28.20

- Defaults ([tsdoc-defaults.ts](https://github.com/TypeStrong/typedoc/blob/master/src/lib/utils/options/tsdoc-defaults.ts)): block tags = TSDoc set + `@author`, `@callback`, `@category`, `@categoryDescription`, `@default`, `@document`, `@extends`, `@augments`, `@yields`, `@group`, `@groupDescription`, `@import`, `@inheritDoc`, `@license`, `@module`, `@mergeModuleWith`, `@prop`, `@property`, `@return`, `@satisfies`, **`@since`**, `@sortStrategy`, `@template`, `@this`, `@type`, `@typedef`, `@summary`, `@preventInline`, `@inlineType`, `@preventExpand`, `@expandType`; inline = `@link`, `@inheritDoc`, `@label`, `@linkcode`, `@linkplain`, `@include`, `@includeCode`; modifier = TSDoc set + `@abstract`, `@class`, `@disableGroups`, `@enum`, **`@event`**, `@expand`, `@hidden`, `@hideCategories`, `@hideconstructor`, `@hideGroups`, `@ignore`, `@inline`, `@interface`, `@namespace`, `@function`, `@overload`, `@private`, `@protected`, `@reexport`, `@showCategories`, `@showGroups`, `@useDeclaredType`, `@primaryExport`. `@event` is a **modifier** (no content) in TypeDoc, whereas jassdoc's `@event EVENT_NAME` carries content.
- Unknown tags ([Tags.html](https://typedoc.org/documents/Tags.html)): "Any tags which are not recognized will result in a warning being emitted." "TypeDoc supports defining what tags are supported through either a `tsdoc.json` file or via the `--blockTags`, `--inlineTags`, and `--modifierTags` options." [Options.Comments](https://typedoc.org/documents/Options.Comments.html): for `blockTags`/`inlineTags`/`modifierTags`, "this option will be set by `tsdoc.json`, if present"; `excludeTags` removes tags when parsing; `notRenderedTags` keeps but does not render; `jsDocCompatibility` covers `@example`/`@default`/`@inheritDoc` differences and unescaped-brace warnings.
- `@since` ([site/tags/since.md](https://github.com/TypeStrong/typedoc/blob/master/site/tags/since.md)): block tag, rendered as a plain paragraph; no version semantics.
- `@remarks` ([site/tags/remarks.md](https://github.com/TypeStrong/typedoc/blob/master/site/tags/remarks.md)): one per comment; default theme renders under a "Remarks" header; persists through `{@inheritDoc}`.
- `@example` ([site/tags/example.md](https://github.com/TypeStrong/typedoc/blob/master/site/tags/example.md)): "If there are no code blocks, TypeDoc assumes the whole tag should be a code block. This is not valid TSDoc, but is recognized by VSCode"; with a fence, text outside it is regular text.
- `{@link}` ([site/tags/link.md](https://github.com/TypeStrong/typedoc/blob/master/site/tags/link.md), [linkResolver.ts](https://github.com/TypeStrong/typedoc/blob/master/src/lib/converter/comments/linkResolver.ts)): forms `{@link Foo.Bar}`, `{@link Foo.Bar | text}`, and non-TSDoc `{@link Foo.Bar text}`; resolution via TypeScript symbols (`--useTsLinkResolution`, default on) then declaration references; targets matching `/^(http|ftp)s?:\/\//` are passed through as external links without validation. `validation.invalidLink` (default `true`) "Produce warnings for `@link` tags which cannot be resolved."

### 6.4 API Extractor 7.59.2

- Supported tags ([apps/api-extractor/extends/tsdoc-base.json](https://github.com/microsoft/rushstack/blob/main/apps/api-extractor/extends/tsdoc-base.json)): custom `@betaDocumentation` (modifier), `@internalRemarks` (block), `@preapproved` (modifier); `supportForTags: true` for `@alpha @beta @defaultValue @decorator @deprecated @eventProperty @example @experimental @inheritDoc @internal @label @link @override @packageDocumentation @param @privateRemarks @public @readonly @remarks @returns @sealed @see @throws @typeParam @virtual` plus the three custom ones. Projects "should use the `extends` field to inherit the definitions from this file." Tags defined but not in `supportForTags` trigger `tsdoc-unsupported-tag`.
- [Doc comment syntax](https://api-extractor.com/pages/tsdoc/doc_comment_syntax/): "The documentation content up until the first block tag is called the 'summary'. The summary section should be brief." "Unlike the summary, the remarks may contain lengthy documentation content." "API Extractor's particular dialect of TSDoc is referred to as 'AEDoc'."
- [api-extractor.json](https://api-extractor.com/pages/configs/api-extractor_json/): `messages.tsdocMessageReporting.default.logLevel` defaults to `"warning"`; "TSDoc message identifiers start with `tsdoc-`".

### 6.5 jassdoc tag → TSDoc status (mechanical mapping of the facts above)

| jassdoc | TSDoc-valid name? | Standard tag? | Needed in `tsdoc.json` | TypeDoc default | Notes |
|---|---|---|---|---|---|
| description | n/a | summary section | — | summary | jassdoc descriptions can be 40+ lines with fences and tables; TSDoc/AE say summary "should be brief" and put long text under `@remarks` (one per comment) |
| `@param name text` | yes | Core, multiple | — | yes | needs ` - ` inserted after name |
| `@note` | yes | no | block, `allowMultiple: true` (199 blocks have ≥2) | warns unless declared | — |
| `@bug` | yes | no | block, `allowMultiple: true` (27 blocks have ≥2) | warns unless declared | — |
| `@patch X` | yes | no | block | warns unless declared | TypeDoc has `@since` (block, plain paragraph) as a default tag |
| `@async` | yes | no | modifier | warns unless declared | — |
| `@pure` | yes | no | modifier | warns unless declared | — |
| `@event NAME` | yes | no | block | **modifier** in TypeDoc defaults | content conflicts with TypeDoc's modifier semantics |
| `@source-file`, `@source-code`, `@return-type` | **no** (hyphen) | — | cannot be declared | — | DB-only rows |
| Markdown tables, `<https://…>`, `{…}`, `->` | — | — | — | — | `}`/`>` escapes, HTML-name errors; table support unverified |

## 7. State of this repository

- `package.json` (unchanged by this research): `dependencies: { "war3-types-strict": "^0.1.3" }`; `tsconfig.json` `types` includes `war3-types-strict/1.33.0`. Those Typings carry no doc comments (§5.3).
- 266 `/**` blocks across `handles/`, `system/`, `globals/`, `utils/`, `hooks/`, `index.ts`. Tags already in use: `@param name text` (no hyphen, e.g. `handles/unit.ts:19`), `@deprecated`, `@note` (`handles/camera.ts:479`, `handles/dialog.ts:145`, `handles/gamecache.ts:29`), `@bug` (`handles/camera.ts:469`, `handles/group.ts:73`, `:106`), `@example <title>` (`handles/dialog.ts:77`, `handles/frame.ts:9`), `@noSelfInFile`.
- Four sentences checked are byte-identical to jassdoc `common.j` text: `handles/gamecache.ts:29` "You cannot create more than 255 gamecaches" (common.j line 19713), `handles/dialog.ts:145` "Dialogs can not be shown at map-init…" (19695), `handles/group.ts:73` "Causes irregular behavior when used with large numbers" (12619), `handles/unit.ts:86` "Sets a unit's acquire range.  This is the value that a unit uses to choose targets…" (16457). The direction of copying and the dates were not established; these lines predate this fork (they come from cipherxof/w3ts).
- `.eslintrc.json` has no `eslint-plugin-tsdoc`; there is no `tsdoc.json`; no TypeDoc or API Extractor configuration is present.

## 8. Not verified / open

- Whether the TSDoc parser accepts Markdown tables and ```` ```{.lua} ```` info strings (spec page "under development"; not tested).
- How TypeDoc renders content following a modifier tag such as `@event NAME` (not tested).
- Contents of `toeneeoh/jass-api-search`, `wenbinio/wc3` and `w3champions/map-updater-scripts` beyond their README/search hits.
- Whether lep or the other 19 contributors would license the prose on request (no ask was made; the ticket is research only).

## Sources

- lep/jassdoc @ `8610958` — `Readme.md`, `jassdoc.nix`, `jassdoc.cabal`, `GNUmakefile`, `mkmetadata`, `check-revision`, `mksrc`, `lint`, `annotate`, `check-wrong-params`, `src/schema.sql`, `src/Annotation.hs`, `src/mkdocs.hs`, `extra-jass/README.md`, `extra-lua/README.md`, `common.j`, `Blizzard.j`: https://github.com/lep/jassdoc
- lep/jassdoc PR #236: https://github.com/lep/jassdoc/pull/236
- GitHub API `repos/lep/jassdoc` (license null), `gh search issues license --repo lep/jassdoc`
- Hiveworkshop jassdoc thread: https://www.hiveworkshop.com/threads/jassdoc.275521/
- GitHub Terms of Service D.5: https://docs.github.com/en/site-policy/github-terms/github-terms-of-service
- choosealicense "No License": https://choosealicense.com/no-permission/
- Jassbot: https://lep.duckdns.org/jassbot/ ; lep/jassbot-bp `Readme.md`, `jassbot/controller.py`: https://github.com/lep/jassbot-bp ; lep/jassbot README: https://github.com/lep/jassbot
- wurstscript/wurst-jassdoc-build README and `releases/latest`: https://github.com/wurstscript/wurst-jassdoc-build
- WurstScript `JassDocService.java`: https://github.com/wurstscript/WurstScript/blob/master/de.peeeq.wurstscript/src/main/java/de/peeeq/wurstio/languageserver/JassDocService.java
- Tomotz/wc3-lua-natives README, `src/generateMapping.js`, tree: https://github.com/Tomotz/wc3-lua-natives
- Orden4/WCSharp.IO.JassDoc README: https://github.com/Orden4/WCSharp.IO.JassDoc
- TinkerWorX/war3-types-strict README, `build.ts`, `package.json`, `1.33.0/common.j.d.ts`, directory listings: https://github.com/TinkerWorX/war3-types-strict
- cipherxof/war3-types tree and `core/common.d.ts`: https://github.com/cipherxof/war3-types
- Luashine repositories list: https://github.com/Luashine?tab=repositories ; LuaLS/LLS-Addons `addons/`: https://github.com/LuaLS/LLS-Addons
- TSDoc: https://tsdoc.org/pages/spec/tag_kinds/ , https://tsdoc.org/pages/spec/standardization_groups/ , https://tsdoc.org/pages/spec/overview/ , https://tsdoc.org/pages/tags/param/ , https://tsdoc.org/pages/tags/link/ , https://tsdoc.org/pages/tags/remarks/ , https://tsdoc.org/pages/tags/example/ , https://tsdoc.org/pages/packages/tsdoc-config/ ; source: `tsdoc/src/details/StandardTags.ts`, `tsdoc/src/parser/StringChecks.ts`, `tsdoc/src/parser/TSDocMessageId.ts`, `tsdoc/schemas/tsdoc.schema.json`, `eslint-plugin/README.md`, `eslint-plugin/src/index.ts` at https://github.com/microsoft/tsdoc
- TypeDoc: https://typedoc.org/documents/Tags.html , https://typedoc.org/documents/Options.Comments.html ; source: `src/lib/utils/options/tsdoc-defaults.ts`, `src/lib/converter/comments/linkResolver.ts`, `site/tags/{since,link,example,remarks}.md`, `site/options/validation.md` at https://github.com/TypeStrong/typedoc
- API Extractor: https://api-extractor.com/pages/tsdoc/doc_comment_syntax/ , https://api-extractor.com/pages/configs/api-extractor_json/ ; `apps/api-extractor/extends/tsdoc-base.json` at https://github.com/microsoft/rushstack
- This repository: `package.json`, `tsconfig.json`, `.eslintrc.json`, `handles/*.ts` (grep on 2026-09-23)
