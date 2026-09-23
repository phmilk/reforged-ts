# Toolchain landscape: tstl 1.37 / TS 6, lua-types, eslint 9, dual-target and test runners

Research note for ticket #10 (wayfinder:research). Facts only, no decision; feeds the ticket "Toolchain decisions for the library".
Snapshot date: 2026-09-23. Registry versions were read with `npm view` on that date; every other claim cites the primary page it came from.

Vocabulary: **Native** = a function/type/constant the game exposes to Lua map scripts. **Typings** = the `.d.ts` describing the Natives. **Toolchain** = TypeScript + typescript-to-lua + lint + build. **Map project** = a repo consuming the library to produce a map. **Template** = the starter repo a Map project comes from.

## 0. Starting point (this repo, `master` @ 831ab74)

| Piece | Declared in repo | Source |
|---|---|---|
| typescript-to-lua | `^1.15.1` (devDependency) | `package.json` |
| typescript | `^5.0.4` (peerDependency) | `package.json` |
| lua-types | `^2.13.1` (peerDependency) | `package.json` |
| @typescript-to-lua/language-extensions | `^1.0.0` | `package.json` |
| eslint | `^7.32.0`, `.eslintrc.json` extending `plugin:@typescript-eslint/recommended`, `airbnb-base`, `prettier`; `@typescript-eslint/*` `^5.1.0`; `eslint-config-airbnb-base` `^14.2.1`; `eslint-plugin-import` `^2.25.2`; `eslint-plugin-prettier` `^4.0.0`; `eslint-config-prettier` `^8.3.0` | `package.json`, `.eslintrc.json` |
| prettier | `^2.4.1` | `package.json` |
| Typings | `war3-types-strict` `^0.1.3`, `types: ["war3-types-strict/1.33.0"]` | `package.json`, `tsconfig.json` |
| tsconfig | `target: ESNext`, `lib: [ESNext]`, **`moduleResolution: "Classic"`**, `declaration: true`, `strict: true`, `types` lists `@typescript-to-lua/language-extensions`, **`lua-types/core/{coroutine,global,math,metatable,modules,string,table,os}`** and **`lua-types/special/5.3`** individually | `tsconfig.json` |
| tstl block | `buildMode: "library"`, `luaTarget: "5.3"`, `noHeader: true`, `noImplicitSelf: true`, `sourceMapTraceback: false` | `tsconfig.json` |
| Build/publish | `build: tstl -p tsconfig.json`; `prepublish: npm run build && cp package.json ./dist/`; `files: ["./**/*.lua", "./**/*.d.ts"]`; `main: ./index.ts`; `types: ./index.d.ts` | `package.json` |
| Rules using removed APIs | `.eslintrc.json` enables `@typescript-eslint/no-implicit-any-catch` (see §5) | `.eslintrc.json` |

No test runner, no CI workflow, no lockfile in the repo. The `docs/` directory did not exist before this note.

## 1. typescript-to-lua 1.37.x

- Latest: **1.37.1**, published 2026-07-09 (1.37.0: 2026-06-06). dist-tags: `latest 1.37.1`, `beta 1.10.0-beta.0`. (`npm view typescript-to-lua`; https://registry.npmjs.org/typescript-to-lua/1.37.1)
- **`peerDependencies.typescript` is the exact string `"6.0.2"`** (a bare version in `peerDependencies`, not a caret range). The package's own `devDependencies.typescript` is `6.0.2` as well. (https://raw.githubusercontent.com/TypeScriptToLua/TypeScriptToLua/master/package.json)
- `engines.node: ">=16.10.0"` (no upper bound). Upstream CI pins `NODE_VERSION: 20.17.0` on ubuntu + windows; Node 22/24 are not exercised in CI. (https://raw.githubusercontent.com/TypeScriptToLua/TypeScriptToLua/master/package.json; https://raw.githubusercontent.com/TypeScriptToLua/TypeScriptToLua/master/.github/workflows/ci.yml)
- Runtime dependency `@typescript-to-lua/language-extensions` is pinned to `1.19.0` inside tstl itself. (same package.json)
- Upstream dev toolchain (for reference): `eslint ^9.39.4`, `typescript-eslint ^8.58.0`, `prettier ^2.8.8`, `jest ^29.7.0` + `ts-jest`, `lua-types ^2.14.1`, `lua-wasm-bindings ^0.5.3`. (same package.json)

### Changelog since 1.15.1 (this repo's floor), relevant entries

Source: https://github.com/TypeScriptToLua/TypeScriptToLua/blob/master/CHANGELOG.md (dates from the npm `time` field).

| Version | Date | Entry |
|---|---|---|
| 1.16.0 | 2023-06-04 | Upgraded TypeScript to 5.1.3; TS 5.0 decorators; class static blocks; fixed `tstl` block not extended when extending a tsconfig from node_modules |
| 1.17.0 | 2023 | Added the **`moduleResolution` plugin hook**; `isEmpty` on `LuaTable`/`LuaMap`/`LuaSet` |
| 1.18.0 | 2023 | TS 5.2.2; `noResolvePaths` accepts globs |
| 1.20.0 | 2023-10-01 | `Number.parseInt/parseFloat`, `Number` constants, `Array.at`; fix for absolute paths returned from a `moduleResolution` plugin |
| 1.22.0 | 2023-11-20 | Added **`afterEmit`** plugin hook |
| 1.23.0 | 2023-12-28 | TS 5.3.3 |
| 1.25.0 | 2024-03-17 | TS 5.4.2; fixed `@customName` + `@noSelf`; fixed extended tsconfig in watch mode |
| 1.26.0 – 1.31.0 | 2024-06 → 2025-03 | TS 5.5.2 (1.26), 5.6.2 (1.27), 5.7.2 (1.28), 5.8.2 (1.31) |
| 1.29.0 | 2024-12-30 | Added `Luau` luaTarget |
| 1.30.0 | 2025-02-02 | In-memory plugins via the tstl API; changed `Error` stacktraces on Lua 5.1/LuaJIT |
| 1.33.0 | 2025-11-09 | TS 5.9.3 |
| 1.34.0 | 2026-03-08 | Added **Lua 5.5 target** ("mostly does the same as the 5.4 target for now"); enum-in-namespace merge fix; sourcemap traceback fixes |
| **1.36.0** | 2026-04-21 | **"[Breaking] Upgraded to TypeScript 6.0"** |
| 1.37.0 | 2026-06-06 | tsconfig `paths` fix; clearer diagnostics (`>>` on 5.3+, async generators); `@noSelf` respected on interfaces with call signatures; `promise.finally` spec fix |

- No changelog entry between 1.16 and 1.37.1 touches `buildMode`, `luaBundle`/`luaBundleEntry`, `noImplicitSelf`, `noHeader`, `sourceMapTraceback`, `tstlVerbose` or `luaLibImport`. (CHANGELOG, same URL)

### Configuration options (current docs)

Source: https://typescripttolua.github.io/docs/configuration

| Option | Values | Default |
|---|---|---|
| `luaTarget` | `"JIT"`, `"5.4"`, `"5.3"`, `"5.2"`, `"5.1"`, `"universal"`, `"5.0"`, `"Luau"` (docs table; `5.5` added in changelog 1.34.0 but NOT VERIFIED as listed on the page) | `"universal"` |
| `buildMode` | `"default"`, `"library"` | `"default"` |
| `luaLibImport` | `"inline"`, `"require"`, `"require-minimal"`, `"none"` | `"require"` |
| `luaBundle` / `luaBundleEntry` | file paths | none |
| `noImplicitGlobalVariables` | bool | `false` |
| `noImplicitSelf` | bool ("as if prefixed with `/** @noSelfInFile **/`") | `false` |
| `noHeader` | bool | `false` |
| `sourceMapTraceback` | bool | `false` |
| `luaPlugins` | array of `{ name, import? }` | none |
| `extension` | emitted file extension | `".lua"` |
| `noResolvePaths` | array (globs since 1.18.0) | none |
| `tstlVerbose` | bool | `false` |
| `lua51AllowTryCatchInAsyncAwait` | bool | `false` |

- The docs state `target` should always be `ESNext` and `module` should be omitted; `outFile`, `importHelpers`, `noEmitHelpers` are ignored; `composite`, `build`, `incremental`, `emitDecoratorMetadata`, `esModuleInterop` are unsupported. (same page)

### Publishing a library (`buildMode: library`)

Source: https://typescripttolua.github.io/docs/publishing-modules

- `tsconfig.json` must set `"buildMode": "library"` under `tstl` and `"declaration": true`.
- `package.json`: `"files": ["dist/**/*.lua", "dist/**/*.d.ts"]`, `"types": "./dist/index.d.ts"`, and for Lua libraries `"main": "./dist/index"` (no extension).
- Documented limits: "tstl cannot import `.ts` and `.tsx` source files from a node_modules library"; Lua libraries cannot be bundled with `luaBundle`.
- The page does not describe require-path generation for consumers, `lualib_bundle.lua` handling, or `luaLibImport: require` vs `require-minimal` for published packages. NOT VERIFIED from a primary page.

### Plugin API

Hooks documented: `visitors`, `printer`, `beforeTransform`, `afterPrint`, `beforeEmit`, `afterEmit`, `moduleResolution`. (https://typescripttolua.github.io/docs/api/plugins; `moduleResolution` added 1.17.0 and `afterEmit` 1.22.0 per CHANGELOG)

## 2. TypeScript 6.0 / 7.0 and this repo's tsconfig

Source: https://devblogs.microsoft.com/typescript/announcing-typescript-6-0/ (quotes verbatim) and `npm view typescript`.

- npm `typescript` dist-tags: `latest 7.0.2` (published 2026-07-08), `beta 6.0.0-beta`, `rc 7.0.1-rc`; `6.0.2` published 2026-03-23, `6.0.3` 2026-04-16. So `npm i -D typescript` without a range installs 7.0.2, which does not satisfy tstl's `6.0.2` peer.
- "TypeScript 6.0 is a unique release in that we intend for it to be the last release based on the current JavaScript codebase … written in Go … That new codebase will be the foundation of TypeScript 7.0 and beyond."
- **"The `moduleResolution: classic` setting has been removed."** This repo's `tsconfig.json` uses `"moduleResolution": "Classic"`; it cannot compile under TS 6.0.2 (and therefore tstl ≥ 1.36.0) unchanged.
- "`--moduleResolution node` (specifically, `--moduleResolution node10`) is deprecated … migrate to `--moduleResolution nodenext` … or `--moduleResolution bundler`."
- "In TypeScript 6.0, `baseUrl` is deprecated"; "`target: es5` option is deprecated" (lowest target ES2015); "`strict` is now `true` by default"; "The new default `module` is `esnext`"; default `target` is a floating latest (`es2025` today); "the default `types` value will be `[]`"; "`esModuleInterop` … the safer interop behavior is always enabled" (cannot be `false`).
- "these deprecations can be ignored by setting `"ignoreDeprecations": "6.0"` in your tsconfig; however, note that TypeScript 7.0 _will not_ support any of these deprecated options." (`classic` is removed, not deprecated, so `ignoreDeprecations` does not apply to it.)

## 3. lua-types 2.14

- Latest **2.14.1**, published 2026-03-03 (2.13.1 was 2022-11-28). (`npm view lua-types`)
- Diff v2.13.1…v2.14.1: "Types for Lua 5.5 (#87)", trusted publishing/CI, version bumps, git URL fix. No change affecting 5.3 consumers was found. (https://api.github.com/repos/TypeScriptToLua/lua-types/compare/v2.13.1...v2.14.1)
- Repo root ships `5.0.d.ts`, `5.1.d.ts`, `5.2.d.ts`, `5.3.d.ts`, `5.4.d.ts`, `5.5.d.ts`, `jit.d.ts` plus `core/` (`coroutine`, `debug`, `global`, `io`, `math`, `metatable`, `modules`, `os`, `string`, `table`, `index`, `index-5.0`, `5.0/`), `special/` (`5.0`, `5.1`, `5.1-only`, `5.1-or-jit`, `5.2`, `5.2-only`, `5.2-or-jit`, `5.2-plus`, `5.2-plus-or-jit`, `5.3`, `5.3-plus`, `5.3-pre`, `5.4`, `5.4-only`, `5.4-pre`, `5.5`, `5.5-plus`, `jit`, `jit-only`) and `version-specific-functions/`. (https://github.com/TypeScriptToLua/lua-types)
- README: consume via `"types": ["lua-types/<version>"]` with `<version>` ∈ `5.1, 5.2, 5.3, 5.4, jit` (README not yet updated for 5.0/5.5). **"All other files in this module shouldn't be considered public. Do not import them manually, as they may change in non-major updates."** This repo's tsconfig imports `lua-types/core/*` and `lua-types/special/5.3` directly (it omits `core/debug` and `core/io`), i.e. it depends on non-public paths. (https://raw.githubusercontent.com/TypeScriptToLua/lua-types/master/README.md)
- README also notes environment type packages usually depend on `lua-types` themselves and reference it with `/// <reference types="lua-types/<version>" />`. (same README)

## 4. `@typescript-to-lua/language-extensions` and compiler annotations

- Latest **1.19.0**, no `peerDependencies`; the registry `modified` stamp is 2023-09-07, and tstl 1.37.1 depends on it at exactly `1.19.0`. (`npm view @typescript-to-lua/language-extensions`; tstl package.json)
- Extensions documented: `LuaMultiReturn`/`$multi`, `$range`, `$vararg`, `LuaIterable`, `LuaPairsIterable`/`LuaPairsKeyIterable`, `LuaTable`/`LuaMap`/`LuaSet` (+ `Readonly` variants; `isEmpty` since tstl 1.17.0), operator types `LuaAddition/Subtraction/Multiplication/Division/Modulo/Power/FloorDivision/Negation`, `LuaBitwiseAnd/Or/ExclusiveOr/LeftShift/RightShift/Not`, `LuaConcat`, `LuaLength` (each with a `…Method` variant), `LuaTableGet/Set/Has/Delete/AddKey` (+ `Method` variants). No `$gmatch` extension exists on the page. (https://typescripttolua.github.io/docs/advanced/language-extensions)
- Annotations currently documented: `@compileMembersOnly`, `@customConstructor`, `@noResolution`, `@customName`, `@noSelf`, `@noSelfInFile`. `@tupleReturn`, `@luaTable`, `@luaIterator`, `@vararg`, `@forRange`, `@extension`, `@metaExtension`, `@pureAbstract`, `@phantom` are absent from the page; exact removal versions NOT VERIFIED. (https://typescripttolua.github.io/docs/advanced/compiler-annotations)

## 5. ESLint 9/10, typescript-eslint 8, airbnb-base, prettier/import plugins

- ESLint latest **10.11.0**; `maintenance` tag 9.39.5. ESLint 10 engines `^20.19.0 || ^22.13.0 || >=24`; ESLint 9.39.5 engines `^18.18.0 || ^20.9.0 || >=21.1.0`. (`npm view eslint`)
- v9: "`eslint.config.js` is the new default configuration format. The previous format, eslintrc, is now deprecated and will not automatically be searched for"; eslintrc still usable via `ESLINT_USE_FLAT_CONFIG=false`; `FlatCompat` from `@eslint/eslintrc` bridges legacy `eslint-config-*` packages. (https://eslint.org/docs/latest/use/migrate-to-9.0.0)
- v10: "Starting with ESLint v10.0.0, the old configuration format is no longer supported" and `ESLINT_USE_FLAT_CONFIG` "no longer functions". (https://eslint.org/docs/latest/use/migrate-to-10.0.0)
- typescript-eslint latest **8.70.1**; peers `eslint ^8.57.0 || ^9.0.0 || ^10.0.0`, **`typescript >=4.8.4 <6.1.0`** (TS 6.0.x supported, TS 7.x not). Flat-config entry point is the `typescript-eslint` meta-package (`tseslint.config()`, `tseslint.configs.recommended`, `recommendedTypeChecked`); `@typescript-eslint/eslint-plugin` and `parser` remain separately installable. (`npm view typescript-eslint`; https://typescript-eslint.io/getting-started; https://typescript-eslint.io/users/dependency-versions)
- `@typescript-eslint/no-implicit-any-catch` (enabled in this repo's `.eslintrc.json`) no longer exists (rule page 404, absent from https://typescript-eslint.io/rules/). `@typescript-eslint/strict-boolean-expressions` still exists and requires type information. (https://typescript-eslint.io/rules/)
- **eslint-config-airbnb-base** latest is still **15.0.0 (2021-11-09)**; peers `eslint ^7.32.0 || ^8.2.0`, `eslint-plugin-import ^2.25.2`. No ESLint 9/10 or flat-config release; airbnb/javascript#2804 ("Support of new eslint flat config") open since 2023-08-06. (`npm view eslint-config-airbnb-base`; https://github.com/airbnb/javascript/issues/2804)
  - Bridges: `@eslint/eslintrc` 3.3.7 (`FlatCompat`; repo describes itself as frozen except critical fixes) and `@eslint/compat` `fixupConfigRules` (https://github.com/eslint/eslintrc); community flat-native rewrite `eslint-config-airbnb-extended` 3.2.0 with peer `eslint ^9.0.0`, which says not to use `FlatCompat` with it (`npm view eslint-config-airbnb-extended`). Behaviour under ESLint 10 NOT VERIFIED (declared peers stop at `^9`).
- `eslint-config-prettier` **10.1.8**, peer `eslint >=7.0.0`, ships a `/flat` export; `eslint-plugin-prettier` **5.5.6**, peers `eslint >=8.0.0`, **`prettier >=3.0.0`**, `eslint-config-prettier >=7.0.0 <10.0.0 || >=10.1.0`, ships `eslint-plugin-prettier/recommended` flat export. (`npm view`; https://github.com/prettier/eslint-config-prettier; https://github.com/prettier/eslint-plugin-prettier)
- `eslint-plugin-import` **2.32.0**, peer `eslint ^2 … || ^8 || ^9` (no `^10`); flat config via `importPlugin.flatConfigs.recommended`; TS resolution needs `eslint-import-resolver-typescript`. `eslint-plugin-import-x` **4.17.1**, peers `eslint ^8.57.0 || ^9.0.0 || ^10.0.0`, `@typescript-eslint/utils ^8.56.0`. (`npm view`; https://github.com/import-js/eslint-plugin-import; https://github.com/un-ts/eslint-plugin-import-x)
- Upstream tstl itself lints with `eslint ^9.39.4` + `typescript-eslint ^8.58.0` (§1).

## 6. Prettier 3

- Latest **3.9.9** (engines `node >=14`); `next` tag `4.0.0-alpha.13`, Prettier 4 not released. 3.x minors: 3.0.0 2023-07-05 → 3.9.0 2026-06-27. (`npm view prettier`)
- 3.0 breaking changes: default `trailingComma` `"es5"` → `"all"`; minimum Node v14; `prettier.format()`/`check()` return Promises (ESM package, async plugin loading via `import()`, `--plugin-search-dir` removed); parser file paths moved to `plugins/*.js`; ESM config files (`prettier.config.mjs`) supported. (https://prettier.io/blog/2023/07/05/3.0.0.html)
- `eslint-plugin-prettier` ≥ 5 requires Prettier ≥ 3 (§5); upstream tstl still pins `prettier ^2.8.8` (§1).

## 7. Package managers: pnpm vs npm, Corepack

- pnpm latest **12.6.0**, engines `node >=18.*`; npm latest **12.1.0**. (`npm view pnpm`, `npm view npm`)
- pnpm's default `node_modules` is symlinked from a content-addressable store; packages only see their declared dependencies, so undeclared ("phantom") dependencies fail. (https://pnpm.io/motivation)
- Escape hatches: `node-linker` (`isolated` default, `hoisted` = flat npm-like layout, `pnp`), `shamefully-hoist` (default `false`), `public-hoist-pattern` (default `[]`); these live in `pnpm-workspace.yaml`/global config, not `.npmrc`. (https://pnpm.io/settings; https://pnpm.io/settings/node-modules)
- Workspaces need a root `pnpm-workspace.yaml`; one `pnpm-lock.yaml` covers the workspace and replaces `package-lock.json`. (https://pnpm.io/workspaces)
- `publishConfig.directory` publishes from a build folder (e.g. `dist`, which must contain its own `package.json`); since pnpm 11 `pnpm publish` is native but still runs `prepublishOnly`/`prepublish`/`prepack`/`prepare`/`postpack`/`publish`/`postpublish`. (https://pnpm.io/package_json; https://pnpm.io/cli/publish)
- `pnpm dlx` (≈ `npx`) runs a package binary without adding it; since v11 it enforces `minimumReleaseAge`/`trustPolicy`. Catalogs (`catalog:`) centralise versions across a workspace. (https://pnpm.io/cli/dlx; https://pnpm.io/catalogs)
- Corepack "is distributed with Node.js from version 14.19.0 up to (but not including) 25.0.0"; nodejs.org's corepack page now redirects to the GitHub README. (https://github.com/nodejs/corepack)
- Whether npm 12 itself honours the `packageManager` field: NOT VERIFIED.
- Local machine used for this note: Node v24.14.0.

## 8. What voces/w3ts does with its dual ESM/Lua target

Source: https://github.com/voces/w3ts (HEAD 219f677), https://raw.githubusercontent.com/voces/w3ts/219f677/package.json, https://raw.githubusercontent.com/voces/w3ts/219f677/tstl-strip-js.cjs, https://github.com/voces/w3ts/commit/5cf8c6d, https://registry.npmjs.org/@voces/w3ts

- Publishes **`@voces/w3ts` 4.0.1** (2026-05-17), MIT, not archived. `package.json`: `type: module`, `main ./dist/index.js`, `types ./dist/index.d.ts`, `exports { ".": { types: ./dist/index.d.ts, tstl: ./dist/index, default: ./dist/index.js }, "./*": "./*" }`; publishes only `dist` and `LICENSE`.
- Two builds into the same `dist/`: `build-lua` = `tstl --project tsconfig.buildLua.json` (`buildMode: library`, `luaTarget: 5.3`, `noImplicitSelf`, `luaPlugins: ./tstl-strip-js.cjs`); `build-js` = `tsc --project tsconfig.build.json` (`module`/`moduleResolution: nodenext`, `target: es2020`, `declaration` + `declarationMap` + `sourceMap`). The dual target is a **build-output split only**.
- `tstl-strip-js.cjs` is a tstl `moduleResolution` plugin that strips a trailing `.js` from relative `require` specifiers so tstl resolves the NodeNext-style `.js` import specifiers the ESM build needs.
- Dependencies: `war3-types-strict ^0.1.3` (Typings still 1.33.0); peers `lua-types ^2.13.1`, `typescript ^5.9 || ^6`; dev `typescript ^5.9.3`, `typescript-to-lua ^1.36.0`, `language-extensions ^1.0.0`, `eslint ^7.32` with legacy `.eslintrc` (airbnb-base, prettier 2). `.npmrc` has `legacy-peer-deps=true`. No `engines`, no `packageManager`, no lockfile, no `.github/workflows`, no bundler config.
- Commit 5cf8c6d "feat!: dual-target ESM/Lua, rebase on cipherxof@8a11908" (2026-05-17, 40 files, +1517/−681) has an **empty body: no stated motivation**. Follow-up 219f677 restored `/** @noSelfInFile */` in all 43 source files (the rewrite had dropped it) and republished as 4.0.1.
- **No tests, no test script, no vitest/jest, no Native stubs, no Lua-in-Node execution** anywhere in the repo or its history. README unchanged from upstream.

## 9. Executing compiled Lua under a host VM for library tests

Goal: run tstl output (Lua 5.3 target + `lualib_bundle.lua`) from Node with the ~2000 Natives replaced by stubs in the Lua global table.

| Option | Lua version | Latest / activity | JS ↔ Lua bridge | Notes | Source |
|---|---|---|---|---|---|
| **`lua-wasm-bindings`** (TypeScriptToLua org) | Genuine upstream Lua built with Emscripten: 5.0.3 / 5.1.5 / 5.2.4 / **5.3.6** / 5.4.7 / 5.5.0 (per `src/glue/glue-lua-*.d.ts`) | 0.5.3, 2026-01-26; last commit 2026-01-26 | C-API-style (`lauxlib.luaL_newstate`, `lualib.luaL_openlibs`, `lauxlib.luaL_dostring`). README: "This currently only includes the bindings used to test TypeScriptToLua"; **no `lua_pushcfunction`/`lua_pushcclosure` binding**, so a JS function cannot be registered as a Lua global | **What tstl's own jest suite uses**: `test/util.ts` `getLuaBindingsForVersion()` requires `lua-wasm-bindings/dist/lua.50` … `lua.54` per `luaTarget`, puts transpiled files + `lualib_bundle.lua` into `package.preload`, runs via `luaL_dostring`, JSON-stringifies the result and compares with the same TS run as JS in Node's `vm` (a Lua-vs-JS equivalence test, not a Native-stub test); LuaJIT throws "Can't use executeLua() … with LuaJIT" | https://raw.githubusercontent.com/TypeScriptToLua/TypeScriptToLua/master/test/util.ts; `npm view lua-wasm-bindings`; https://github.com/TypeScriptToLua/lua-wasm-bindings |
| **`fengari`** (+ `fengari-interop`) | "Lua 5.3 semantics" ("The Lua VM written in JS ES6 for Node and the browser") | fengari 0.1.5 published 2025-12-26 (previous 0.1.4 was 2018-11-18); fengari-interop 0.1.4 2025-12-21; last commits 2025-12-26 / 2025-12-21; `fengari-web` 0.1.4 and `fengari-node-cli` 0.1.0 last published 2022-05-02 | C-API-style (`lauxlib.luaL_newstate`, `luaL_loadstring`, `lua_pcall`), `lua_pushjsfunction` + `lua_setglobal`; `fengari-interop` `push()`/`tojs()` require `lauxlib.luaL_requiref(L, to_luastring("js"), luaopen_js, 1)` first (probe: otherwise throws "js library not loaded into lua_State") | Lua strings are `Uint8Array` (`to_luastring`/`to_jsstring`); README: "floats are doubles, but integers are 32 bits" (reference 5.3 uses 64-bit integers); `package.loadlib` uses `package.jspath`; `require` searchers may yield. Precedent: WoW-addon repos run real addon Lua under fengari with API doubles (`TrueBrujah/RCLootCouncil_dibs`, `Krool/0LoadProfiler`); `flowtsohg/mdx-m3-viewer` depends on fengari | https://github.com/fengari-lua/fengari; https://github.com/fengari-lua/fengari-interop; `npm view fengari fengari-interop fengari-web fengari-node-cli` |
| **`wasmoon`** | Lua 5.4: `lua` submodule pinned to lua/lua commit `be908a7d` (2022-11-08, between tags v5.4.4 and v5.4.5) | 1.16.0 published 2023-12-08 (registry metadata modified 2026-04-25); last default-branch commit 2025-01-18; no GitHub release objects; no `engines` field | `new LuaFactory()`, `await factory.createEngine()`, `lua.global.set('CreateUnit', jsFn)`, `doString`/`doFile` (async) and `doStringSync`/`doFileSync` (`src/engine.ts`), `lua.global.get()`; Lua tables come back as plain JS objects/arrays (`src/type-extensions/table.ts`); `factory.mountFile`/`mountFileSync` write into the Emscripten FS so multi-file `require` resolves (`src/factory.ts`) | Node, Deno, browser. README limitations: `null` is truthy in Lua when `injectObjects` is on; "It's not possible to await in a callback from JS into Lua"; top-level yields hit the C-call boundary. Third-party caveat: `cipherwebllc/openpay` PR #480 reports nondeterministic "memory access out of bounds"/abort with wasmoon 1.16 under vitest, worked around by isolating Lua tests in a separate job with process restarts | https://github.com/ceifa/wasmoon (README, `.gitmodules`, `src/engine.ts`, `src/factory.ts`, `src/type-extensions/table.ts`); https://github.com/lua/lua tags; https://github.com/cipherwebllc/openpay/pull/480; `npm view wasmoon` |
| **Native `lua` 5.3/5.4 binary** via `child_process` | exact | depends on host install | stdin/argv/files only | tstl's CI installs `lua5.3`/`luajit` via `apt-get` only for the benchmark job (spawned as child processes), not for correctness tests | https://raw.githubusercontent.com/TypeScriptToLua/TypeScriptToLua/master/.github/workflows/ci.yml |
| **`lua-json`** / `luaparse` | n/a | lua-json 1.0.1, 2022-09-08 (depends on `luaparse ^0.2.1`); luaparse 0.3.1, 2022-06-19 | — | "Convert Lua tables to and from JSON" / "A Lua parser in JavaScript": serializer and AST parser, **not VMs**; only relevant for fixtures | `npm view lua-json luaparse`; https://github.com/kcwiki/lua-json; https://github.com/fstirlitz/luaparse |

- Version mismatch: the game runs Lua 5.3; `wasmoon` is 5.4.4+, `fengari` is 5.3-in-JS with 32-bit integers, `lua-wasm-bindings` ships a real 5.3.6 but cannot take JS callbacks. Lua 5.4 manual §8 lists the 5.3→5.4 incompatibilities (among them: `__lt` no longer a fallback for `__le`; defined overflow semantics for integer `for` loops; new `<const>`/`<close>` syntax; generational `collectgarbage` options); which of these touch tstl 5.3 output was NOT VERIFIED. (https://www.lua.org/manual/5.4/manual.html#8)
- tstl harness history: `lua.vm.js` → fengari (PR #106, merged 2018-05-12; issue #99: "Fengari mirrors the Lua C API to JS which would give us more control") → `lua-wasm-bindings` (PR #996 "Use WASM version of Lua instead of fengari for testing", merged 2021-03-04). Issue #856 "Add to documentation for writing unit tests" (2020-05-18) is still open: tstl publishes no guidance on unit-testing compiled output. (https://github.com/TypeScriptToLua/TypeScriptToLua/pull/99; /pull/106; /pull/996; /issues/856)
- Community test runners: no `tstl-jest`, `jest-lua`-for-tstl or `@typescript-to-lua/vitest` package exists; `gh search repos "tstl vitest"` and `"typescript-to-lua test"` return nothing; the TypeScriptToLua repo has GitHub Discussions disabled (`hasDiscussionsEnabled: false`); `gh search code "wasmoon" "typescript-to-lua"` finds one unrelated tutorial repo (`crissymoon/lua-example`, pins `wasmoon@^1.16.0` + `typescript-to-lua@^1.24.0`). `cipherxof/wc3-ts-template`'s `test` script (`scripts/test.ts`) compiles the map and launches the game executable via `child_process` (optional Wine): not a unit-test mechanism. voces/w3ts has no test infrastructure (§8). (gh search/GraphQL 2026-09-23; https://github.com/cipherxof/wc3-ts-template)
- Probe (scratch dir outside the repo, Node v24.14.0): wasmoon `global.set('CreateUnit', () => ({id: 1}))` + `doString` returning a table worked with no extra setup (`{"ok":true,"id":1}`); fengari + fengari-interop worked after the `luaL_requiref("js")` step (`fengari result: 1`).
- vitest latest 5.0.1, engines `^22.12.0 || ^24.0.0 || >=26.0.0`. (`npm view vitest`)

## 10. Constraints table

| # | Constraint (fact) | Consequence for this repo | Source |
|---|---|---|---|
| C1 | tstl 1.37.1 peers on **exactly** `typescript@6.0.2` | TypeScript must be pinned to 6.0.2; `npm i typescript` (7.0.2) conflicts; the library's `peerDependencies.typescript ^5.0.4` would need changing for consumers on 1.37 | §1, §2 |
| C2 | TS 6.0 **removed** `moduleResolution: classic` | Current tsconfig fails on TS 6; needs `nodenext`/`bundler`/`node16` (voces uses `nodenext` with a `.js`-stripping tstl plugin) | §2, §8 |
| C3 | TS 6.0 defaults: `types: []`, `strict: true`, `module: esnext`; `esModuleInterop` cannot be `false` | tsconfig already sets `types` and `strict` explicitly; tstl docs say to omit `module` and that `esModuleInterop` is unsupported | §1, §2 |
| C4 | tstl 1.36.0 is the first version requiring TS 6; 1.33.x is the last on TS 5.9.3 | Staying on TS 5.9 caps tstl at 1.33.2 (2025-12-30); voces pins `^1.36.0` with `typescript ^5.9.3` dev and `legacy-peer-deps=true` | §1, §8 |
| C5 | tstl `engines.node >=16.10.0`; CI on Node 20.17.0 only | Node 22/24 untested upstream, but not excluded | §1 |
| C6 | lua-types README: only `lua-types/<version>` roots are public; `core/*` and `special/*` "may change in non-major updates" | Current tsconfig `types` list depends on non-public paths; 2.13.1→2.14.1 changed nothing for 5.3 | §3 |
| C7 | tstl library mode: `declaration: true`, `files` with `.lua` + `.d.ts`, `main` without extension; `luaBundle` not allowed for libraries; tstl cannot import `.ts` from node_modules | Published artefact must be compiled Lua + `.d.ts`; a Map project cannot compile the library from source | §1 |
| C8 | ESLint 10 dropped eslintrc entirely; 9.x still runs it behind `ESLINT_USE_FLAT_CONFIG=false` | `.eslintrc.json` must become `eslint.config.*` to go past 9.x | §5 |
| C9 | `eslint-config-airbnb-base` 15.0.0 (2021) peers on ESLint 7/8 only; no flat release; #2804 open | airbnb-base cannot be used as-is on ESLint 9/10; alternatives are `FlatCompat` (frozen) or `eslint-config-airbnb-extended` (peer `^9`) | §5 |
| C10 | typescript-eslint 8.70.1 supports TS `>=4.8.4 <6.1.0` and ESLint 8.57/9/10 | Compatible with tstl's TS 6.0.2 pin; not with TS 7 | §5 |
| C11 | `@typescript-eslint/no-implicit-any-catch` removed | Rule in `.eslintrc.json` must be dropped | §5 |
| C12 | `eslint-plugin-prettier` 5.x requires `prettier >=3`; Prettier 3 defaults `trailingComma: all` and is async/ESM | Moving the plugin forces Prettier 3; formatting diff unless `trailingComma` is set | §5, §6 |
| C13 | `eslint-plugin-import` 2.32.0 peers stop at ESLint `^9`; `eslint-plugin-import-x` 4.17.1 supports `^10` | Under ESLint 10 only `import-x` declares support | §5 |
| C14 | pnpm strict `node_modules`: undeclared deps fail; `node-linker=hoisted`/`shamefully-hoist` exist as escape hatches; lockfile is `pnpm-lock.yaml` | Library and Template must declare everything they import (e.g. `lua-types`, `war3-types-strict`); Template consumers inherit the lockfile format | §7 |
| C15 | Corepack ships with Node < 25 only | `packageManager` pinning via Corepack works on Node 24, not guaranteed on 25+ | §7 |
| C16 | voces/w3ts dual target = `tsc` (nodenext ESM + d.ts) and `tstl` (library, 5.3) into one `dist`; `exports` has a `tstl` condition; motivation undocumented; no tests | Shows a working NodeNext + tstl layout, but offers no evidence of a testing benefit | §8 |
| C17 | `lua-wasm-bindings` is the only real Lua 5.3 VM from Node and what tstl's own tests use, but it exposes no `lua_pushcfunction`, so JS cannot stub Natives through it; `fengari` is 5.3-in-JS with 32-bit integers and takes JS functions; `wasmoon` is real Lua 5.4.4+ with the simplest JS bridge and `mountFile` for `require` | No option gives both exact 5.3 semantics and JS-side Native stubs; VM choice trades Lua-version fidelity against the JS bridge | §9 |
| C19 | No tstl-specific test runner or documentation exists (issue #856 open since 2020); Discussions disabled; wc3-ts-template's `test` launches the game | Any library test harness must be built in-house | §9 |
| C18 | vitest 5 requires Node ≥ 22.12 | Test-runner choice raises the Node floor above tstl's | §9 |

## 11. Not verified / open

- Whether tstl 1.37.1 actually works with TypeScript 7.x at runtime (only the declared peer was checked).
- Whether the configuration docs table lists `luaTarget: "5.5"`.
- Consumer-side `require`/`lualib_bundle.lua` resolution rules for published libraries (not documented on the publishing page).
- Exact removal versions of the legacy annotations (`@tupleReturn`, `@luaTable`, …).
- `eslint-config-airbnb-extended` / `FlatCompat` behaviour under ESLint 10; the full comment thread of airbnb/javascript#2804.
- npm 12's handling of the `packageManager` field.
- fengari's behaviour on Natives that return 64-bit integers; wasmoon's `os`/`io` availability; the reproducibility of the wasmoon-under-vitest crash reported in openpay PR #480.
- Which Lua 5.3→5.4 differences actually affect tstl 5.3 output when run on wasmoon.

## Sources

- https://registry.npmjs.org/typescript-to-lua/1.37.1 and `npm view` for: typescript-to-lua, typescript, lua-types, @typescript-to-lua/language-extensions, eslint, typescript-eslint, eslint-config-airbnb-base, eslint-config-airbnb-extended, eslint-config-prettier, eslint-plugin-prettier, eslint-plugin-import, eslint-plugin-import-x, prettier, pnpm, npm, fengari, fengari-interop, fengari-node-cli, wasmoon, lua-wasm-bindings, lua-json, vitest (2026-09-23)
- https://github.com/TypeScriptToLua/TypeScriptToLua/blob/master/CHANGELOG.md
- https://raw.githubusercontent.com/TypeScriptToLua/TypeScriptToLua/master/package.json
- https://raw.githubusercontent.com/TypeScriptToLua/TypeScriptToLua/master/.github/workflows/ci.yml
- https://raw.githubusercontent.com/TypeScriptToLua/TypeScriptToLua/master/test/util.ts
- https://typescripttolua.github.io/docs/configuration
- https://typescripttolua.github.io/docs/publishing-modules
- https://typescripttolua.github.io/docs/api/plugins
- https://typescripttolua.github.io/docs/advanced/compiler-annotations
- https://typescripttolua.github.io/docs/advanced/language-extensions
- https://devblogs.microsoft.com/typescript/announcing-typescript-6-0/
- https://github.com/TypeScriptToLua/lua-types ; https://raw.githubusercontent.com/TypeScriptToLua/lua-types/master/README.md ; https://api.github.com/repos/TypeScriptToLua/lua-types/compare/v2.13.1...v2.14.1
- https://eslint.org/docs/latest/use/migrate-to-9.0.0 ; https://eslint.org/docs/latest/use/migrate-to-10.0.0
- https://typescript-eslint.io/getting-started ; https://typescript-eslint.io/users/dependency-versions ; https://typescript-eslint.io/rules/
- https://github.com/airbnb/javascript/issues/2804 ; https://github.com/eslint/eslintrc
- https://github.com/prettier/eslint-config-prettier ; https://github.com/prettier/eslint-plugin-prettier ; https://prettier.io/blog/2023/07/05/3.0.0.html
- https://github.com/import-js/eslint-plugin-import ; https://github.com/un-ts/eslint-plugin-import-x
- https://pnpm.io/motivation ; https://pnpm.io/settings ; https://pnpm.io/settings/node-modules ; https://pnpm.io/workspaces ; https://pnpm.io/package_json ; https://pnpm.io/cli/publish ; https://pnpm.io/cli/dlx ; https://pnpm.io/catalogs ; https://github.com/nodejs/corepack
- https://github.com/voces/w3ts ; https://raw.githubusercontent.com/voces/w3ts/219f677/package.json ; https://raw.githubusercontent.com/voces/w3ts/219f677/tstl-strip-js.cjs ; https://github.com/voces/w3ts/commit/5cf8c6d ; https://registry.npmjs.org/@voces/w3ts
- https://github.com/fengari-lua/fengari ; https://github.com/fengari-lua/fengari-interop ; https://github.com/ceifa/wasmoon ; https://github.com/TypeScriptToLua/lua-wasm-bindings ; https://github.com/kcwiki/lua-json ; https://github.com/fstirlitz/luaparse ; https://www.lua.org/manual/5.4/manual.html#8
- https://github.com/TypeScriptToLua/TypeScriptToLua/pull/99 ; /pull/106 ; /pull/996 ; /issues/856 ; https://github.com/cipherwebllc/openpay/pull/480 ; https://github.com/cipherxof/wc3-ts-template
