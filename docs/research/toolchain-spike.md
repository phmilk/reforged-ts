# Toolchain spike: bundler resolution, Lua 5.3 test harness, ESLint 10 stack

Resolves #27. Verifies the three unverified assumptions of "Toolchain decisions for the library" (#11) on the current sources (master at `44b66c6`), in a throwaway project outside the repo.

Environment: Windows 11, Node v24.14.0, npm 11.9.0. Library sources (`index.ts`, `handles/`, `hooks/`, `system/`, `utils/`, `globals/`; 43 files) copied unchanged to `<spike>/lib/`.

## Verdict

| # | Assumption | Result |
|---|------------|--------|
| 1 | tstl 1.37.1 + TS 6.0.2 compile the library with `moduleResolution: "bundler"`, no `.js` suffixes, no resolver plugin | **Holds.** One TS 6 change: `rootDir` must be explicit (TS5011). 44 `.lua` (incl. `lualib_bundle.lua`) + 43 `.d.ts` emitted, 0 errors, 2 pre-existing TSTL warnings. The `nodenext` + voces plugin fallback was not needed and not exercised. |
| 2 | `lua-wasm-bindings` (Lua 5.3.6) runs the compiled library + `lualib_bundle.lua` through `package.preload`, Natives stubbed in Lua, tstl-compiled TS test returns JSON to Node | **Holds.** All registry-identity checks pass. 8.6 ms per fresh Lua state (average over 20; 18.7 ms for the first), 45 modules preloaded each time. |
| 3 | ESLint 10 flat config + typescript-eslint 8 (`strictTypeChecked` + `stylisticTypeChecked`) + `eslint-plugin-import-x` + `eslint-plugin-prettier/recommended` (Prettier 3) run on the sources | **Holds**, with two packages the #11 list omits (`@eslint/js`, `eslint-import-resolver-typescript`). 359 problems across 27 rules on LF-normalised sources, 2.6 s. 8,386 extra `prettier/prettier` hits on a CRLF checkout. |

Amendments to #11 are listed at the end.

## Experiment 1: module resolution and declaration emit

### Versions

Exact pins in the spike `package.json`: `typescript@6.0.2`, `typescript-to-lua@1.37.1`, `lua-types@2.14.1`, `@typescript-to-lua/language-extensions@1.19.0`, `war3-types-strict@0.1.3`. `typescript-to-lua@1.37.1` declares `peerDependencies: { "typescript": "6.0.2" }` (exact, not a range). Install: 18 packages, no peer warnings.

### Working tsconfig

```jsonc
{
  "compilerOptions": {
    "target": "ESNext",
    "lib": ["ESNext"],
    "moduleResolution": "bundler",
    "rootDir": "./lib",          // required by TS 6, see below
    "outDir": "./dist",
    "declaration": true,
    "strict": true,
    "types": [
      "@typescript-to-lua/language-extensions",
      "lua-types/5.3",
      "war3-types-strict/1.33.0"
    ]
  },
  "include": ["lib"],
  "tstl": {
    "buildMode": "library",
    "luaTarget": "5.3",
    "noImplicitSelf": true,
    "noHeader": true
  }
}
```

`npx tstl -p tsconfig.json`: exit 0 in 1.6 s.

### Diagnostics

Without `rootDir`, TS 6 refuses the project before tstl runs:

```
tsconfig.json(6,5): error TS5011: The common source directory of 'tsconfig.json' is './lib'.
The 'rootDir' setting must be explicitly set to this or another path to adjust your output's file layout.
  Visit https://aka.ms/ts6 for migration information.
```

This applies to the planned `packages/reforged-ts/src/` layout: `rootDir: "src"` must be set.

With `rootDir` set, the only output is two pre-existing TSTL warnings about the library code:

```
lib/handles/camera.ts(344,9): warning TSTL: Only false and nil evaluate to 'false' in Lua, everything else is considered 'true'. Explicitly compare the value with ===.
lib/handles/trigger.ts(100,14): warning TSTL: Only false and nil evaluate to 'false' in Lua, everything else is considered 'true'. Explicitly compare the value with ===.
```

TS 6 itself reports nothing on the library: `npx tsc -p tsconfig.json --emitDeclarationOnly --outDir dist-tsc` exits 0 with no output. The `lua-types/5.3` public root replaces the ten `lua-types/core/*` + `special/5.3` entries of the current repo tsconfig without any new diagnostic. Relative imports without `.js` suffix (`import { Handle } from "./handle"`) resolve; no plugin involved.

### Emitted files

44 `.lua` and 43 `.d.ts`, mirroring the source tree under `dist/`:

```
dist/index.lua  dist/index.d.ts  dist/lualib_bundle.lua (84,993 bytes)
dist/globals/{index,order}.{lua,d.ts}
dist/handles/{camera,destructable,dialog,effect,fogmodifier,force,frame,gamecache,group,handle,image,index,item,leaderboard,multiboard,player,point,quest,rect,region,sound,texttag,timer,timerdialog,trigger,ubersplat,unit,weathereffect,widget}.{lua,d.ts}
dist/hooks/index.{lua,d.ts}
dist/system/{base64,binaryreader,binarywriter,file,gametime,host,index,sync}.{lua,d.ts}
dist/utils/{color,index}.{lua,d.ts}
```

`lualib_bundle.lua` **is** emitted in `buildMode: "library"` with the default `luaLibImport: "require"`; 37 of the 43 modules start with `local ____lualib = require("lualib_bundle")`. Cross-module requires are rootDir-relative, dot-separated: `require("handles.handle")` (28 occurrences), `require("handles.timer")`, `require("hooks.index")`, and so on.

### `/** @noSelfInFile */` in the `.d.ts`

Two mechanisms, both observed:

- Plain `tsc --emitDeclarationOnly` keeps the top-of-file comment exactly where the source has it: 33 of 43 `.d.ts` carry it, the 10 whose source lacks it (`index.ts`, `handles/index.ts`, `system/binaryreader.ts`, `system/binarywriter.ts`, `system/gametime.ts`, `system/index.ts`, `utils/color.ts`, `utils/index.ts`, `globals/index.ts`, `globals/order.ts`) do not.
- tstl with `noImplicitSelf: true` registers an `afterDeclarations` transformer (`noImplicitSelfTransformer` in `dist/transpilation/transformers.js`) that prepends `/** @noSelfInFile */` to **every** emitted `.d.ts`. Result of the tstl build: 43 of 43 carry it. Files whose source already has it get it twice (`dist/handles/timer.d.ts` lines 1 and 2), files that lack it get it once (`dist/system/gametime.d.ts` line 1).

So the published `.d.ts` are protected by `noImplicitSelf` alone; the explicit source directive is preserved but redundant for the artefact. Keeping it in the sources (as #11 decided) costs a duplicated comment line and nothing else.

## Experiment 2: Lua 5.3 test harness

### Setup

`lua-wasm-bindings@0.5.3` installed (3 packages). `require("lua-wasm-bindings/dist/lua.53")` loads Lua 5.3.6 synchronously (emscripten glue, no async init); `_VERSION` inside the state reports `Lua 5.3`.

Test project config, compiled in the same project as the library:

```jsonc
// tsconfig.test.json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "rootDir": ".",             // library and tests both under it
    "outDir": "./dist-test",
    "declaration": false
  },
  "include": ["lib", "spike.test.ts"]
}
```

`npx tstl -p tsconfig.test.json` emits `dist-test/lib/**/*.lua` (module names `lib.index`, `lib.handles.handle`, ...), `dist-test/lualib_bundle.lua` and `dist-test/spike_test.lua` (see gotcha 1 for the underscore).

### Lua stub (`stubs/natives.lua`)

Loaded with `luaL_dostring` before anything is preloaded. Every stubbed Native records a readable line in `__stub_calls`.

```lua
__stub_calls = {}
local nextHandleId = 0x100000
local function fmt(v)
  if type(v) == "table" and v.__handleId ~= nil then return v.__kind .. "#" .. tostring(v.__handleId) end
  if type(v) == "function" then return "<function>" end
  return tostring(v)
end
local function record(name, ...)
  local parts = {}
  for i = 1, select("#", ...) do parts[i] = fmt((select(i, ...))) end
  __stub_calls[#__stub_calls + 1] = name .. "(" .. table.concat(parts, ", ") .. ")"
end
local function newHandle(kind)
  nextHandleId = nextHandleId + 1
  return { __kind = kind, __handleId = nextHandleId }
end

-- globals the library reads at module load time
bj_MAX_PLAYER_SLOTS = 28
bj_MAX_PLAYERS = 24
bj_UNIT_FACING = 270.0
function FourCC(id) return (string.unpack(">I4", id)) end   -- system/file.ts static field

local players = {}
function Player(index)
  record("Player", index)
  if players[index] == nil then local p = newHandle("player"); p.__index = index; players[index] = p end
  return players[index]
end
function GetLocalPlayer() record("GetLocalPlayer"); return Player(0) end
function GetPlayerId(p) return p.__index end
function GetHandleId(h) record("GetHandleId", h); return h.__handleId end
function CreateUnit(owner, unitId, x, y, face)
  record("CreateUnit", owner, unitId, x, y, face)
  local u = newHandle("unit"); u.owner = owner; u.typeId = unitId; return u
end
function GetOwningPlayer(u) record("GetOwningPlayer", u); return u.owner end
function GetUnitTypeId(u) return u.typeId end
function CreateTimer() record("CreateTimer"); return newHandle("timer") end
function TimerStart(t, timeout, periodic, handler)
  record("TimerStart", t, timeout, periodic, handler)
  t.timeout = timeout; t.periodic = periodic; t.handler = handler
end
function TimerGetTimeout(t) return t.timeout end
function DestroyTimer(t) record("DestroyTimer", t) end
function CreateTrigger() record("CreateTrigger"); return newHandle("trigger") end
function __stub_fire_timer(t) if t.handler ~= nil then t.handler() end end
```

### TypeScript test (`spike.test.ts`, compiled by tstl)

```ts
/** @noSelfInFile */
import { MapPlayer, Timer, Unit } from "./lib/index";

declare const __stub_calls: string[];
declare function __stub_fire_timer(t: timer): void;

// tiny JSON encoder: the Lua target has no JSON library
function jsonString(s: string): string {
  let [out] = string.gsub(s, "\\", "\\\\");     // string.gsub returns LuaMultiReturn
  [out] = string.gsub(out, '"', '\\"');
  [out] = string.gsub(out, "\n", "\\n");
  return '"' + out + '"';
}
function toJson(value: unknown): string {
  if (value === undefined || value === null) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return tostring(value);
  if (typeof value === "string") return jsonString(value);
  if (Array.isArray(value)) {
    const parts: string[] = [];
    for (const v of value) parts.push(toJson(v));
    return "[" + parts.join(",") + "]";
  }
  if (typeof value === "object") {
    const keys: string[] = [];
    for (const [k] of pairs(value as Record<string, unknown>)) keys.push(k);
    table.sort(keys);                              // pairs() order is undefined
    const parts: string[] = [];
    for (const k of keys) parts.push(jsonString(k) + ":" + toJson((value as Record<string, unknown>)[k]));
    return "{" + parts.join(",") + "}";
  }
  return jsonString(tostring(value));
}

const results: Record<string, unknown> = {};
const player = MapPlayer.fromIndex(0) as MapPlayer;
results.playerIndex0Id = player.id;
const unit = Unit.create(player, 1751344239, 10, 20, 270) as Unit;
results.unitCreated = unit !== undefined;
results.unitHandleId = unit.id;
results.unitTypeId = unit.typeId;
results.fromHandleIsSameObject = Unit.fromHandle(unit.handle) === unit;
results.ownerIsSameObject = unit.getOwner() === player;
results.playersGlobalIsSameObject = MapPlayer.fromIndex(0) === player;
const timer = Timer.create();
let fired = 0;
timer.start(1.5, false, () => { fired += 1; });
results.timerFromHandleIsSameObject = Timer.fromHandle(timer.handle) === timer;
results.timerTimeout = timer.timeout;
__stub_fire_timer(timer.handle);
results.timerHandlerFired = fired;
timer.destroy();
results.stubCalls = __stub_calls;
results.luaVersion = _VERSION;

export const json = toJson(results);
```

### Node glue that worked (`harness.js`)

```js
const fs = require("node:fs");
const path = require("node:path");
const { performance } = require("node:perf_hooks");
const { lua, lauxlib, lualib } = require("lua-wasm-bindings/dist/lua.53");
const LUA_OK = 0;
const outDir = path.resolve(__dirname, "dist-test");
const stubSource = fs.readFileSync(path.resolve(__dirname, "stubs", "natives.lua"), "utf8");

// module name = path relative to outDir, no extension, separators -> dots (what tstl emits in require())
function collectLuaModules(dir) {
  const modules = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) modules.push(...collectLuaModules(full));
    else if (entry.name.endsWith(".lua")) {
      const rel = path.relative(outDir, full).slice(0, -".lua".length);
      modules.push({ name: rel.split(/[\\/]/).join("."), code: fs.readFileSync(full, "utf8") });
    }
  }
  return modules;
}

function preload(L, name, code) {
  lua.lua_getglobal(L, "package");
  lua.lua_getfield(L, -1, "preload");
  if (lauxlib.luaL_loadstring(L, code) !== LUA_OK)
    throw new Error(`failed to load module '${name}': ${lua.lua_tostring(L, -1)}`);
  lua.lua_setfield(L, -2, name); // package.preload[name] = chunk
  lua.lua_pop(L, 2);             // tstl's util.ts leaks these two slots per file
}

function runTest(modules, testModule) {
  const t0 = performance.now();
  const L = lauxlib.luaL_newstate();
  lualib.luaL_openlibs(L);
  const t1 = performance.now();
  if (lauxlib.luaL_dostring(L, stubSource) !== LUA_OK) throw new Error(`stub failed: ${lua.lua_tostring(L, -1)}`);
  for (const m of modules) preload(L, m.name, m.code);
  const t2 = performance.now();
  const status = lauxlib.luaL_dostring(L, `return require("${testModule}").json`);
  const t3 = performance.now();
  if (status !== LUA_OK) { const msg = lua.lua_tostring(L, -1); lua.lua_close(L); throw new Error(`test '${testModule}' failed: ${msg}`); }
  if (!lua.lua_isstring(L, -1)) { const t = lua.lua_typename(L, lua.lua_type(L, -1)); lua.lua_close(L); throw new Error(`returned ${t}, expected string`); }
  const json = lua.lua_tostring(L, -1);   // cwrap("string"): arrives as a JS string
  lua.lua_close(L);
  return { result: JSON.parse(json), ms: { newState: t1 - t0, preload: t2 - t1, run: t3 - t2, total: performance.now() - t0 } };
}

try {
  const modules = collectLuaModules(outDir);          // 45: 43 library + lualib_bundle + spike_test
  const first = runTest(modules, "spike_test");
  // ... print result and timings, then 20 more states for the average
} catch (err) {
  console.error("HARNESS ERROR:", err.message);       // see gotcha 3
  process.exitCode = 1;
}
```

### Result

```json
{
  "fromHandleIsSameObject": true,
  "ownerIsSameObject": true,
  "playersGlobalIsSameObject": true,
  "timerFromHandleIsSameObject": true,
  "timerHandlerFired": 1,
  "timerTimeout": 1.5,
  "playerIndex0Id": 0,
  "unitCreated": true,
  "unitHandleId": 1048606,
  "unitTypeId": 1751344239,
  "luaVersion": "Lua 5.3",
  "stubCalls": ["Player(0)", "...", "Player(27)", "CreateTrigger()", "Player(0)",
    "CreateUnit(player#1048577, 1751344239, 10, 20, 270)", "GetHandleId(unit#1048606)",
    "GetOwningPlayer(unit#1048606)", "Player(0)", "CreateTimer()",
    "TimerStart(timer#1048607, 1.5, false, <function>)", "DestroyTimer(timer#1048607)"]
}
```

The call trace shows the library's load-time Native traffic: `require("lib.index")` alone calls `Player(0)`..`Player(27)` (from `globals/index.ts`) and `CreateTrigger()` (static field in `system/sync.ts`).

### Timing (`performance.now()`)

| Phase | First state | Average of 20 further states |
|-------|------------:|-----------------------------:|
| `require("lua-wasm-bindings/dist/lua.53")` (once per process) | 430 ms cold, 25 ms with warm OS cache | n/a |
| `luaL_newstate` + `luaL_openlibs` | 2.7 ms | 0.05 ms |
| stub `luaL_dostring` + `luaL_loadstring` of 45 modules into `package.preload` | 11.3 ms | 7.2 ms |
| `require("spike_test")` (loads all 43 library modules + lualib + test) | 3.8 ms | 1.04 ms |
| **Total per fresh state** | **18.7 ms** | **8.6 ms** |

Whole Node process (21 states) : 267 ms wall. One fresh Lua state per test file, as #11 plans, is cheap; preloading (chunk compilation) is the dominant cost and would scale with the number of emitted modules.

### Gotchas

1. **Dots in file names become underscores.** tstl's `getEmitPathRelativeToOutDir` (`dist/transpilation/transpiler.js`) replaces `.` with `_` in every path segment so that Lua's `require` does not read them as separators: `spike.test.ts` is emitted as `spike_test.lua`, module name `spike_test`. A `*.test.ts` convention therefore maps to `*_test` Lua modules; the runner must translate.
2. **Load-time Natives and globals.** Requiring `lib/index` executes module bodies that touch the game environment: `globals/index.ts` (`bj_MAX_PLAYER_SLOTS`, `Player(i)` for every slot), `system/sync.ts` (`Trigger.create()` → `CreateTrigger()`), `system/file.ts` (`FourCC("Amls")` for a static field; not a Native but a Reforged Lua helper), `hooks/index.ts` (reads then reassigns the globals `main` and `config`; `nil` is fine), `handles/unit.ts` (`bj_UNIT_FACING` when `face` is omitted). The first harness run failed with `attempt to call a nil value (global 'FourCC')` from `lib/system/file.lua` until the stub defined it. The stub must be loaded before the first `require`.
3. **Emscripten's uncaught-exception handler.** The glue registers `process.on("uncaughtException")` and rethrows, so an unhandled harness error prints the whole minified glue file as the "source context" (Node exit code 7). Catch errors in the harness and print `err.message`.
4. **Stack hygiene.** tstl's `injectLuaFile` leaves `package` and `package.preload` on the stack after every `lua_setfield`; pop 2 per module or the stack grows by 90 slots per state. Harmless in practice, but `lua_pop(L, 2)` keeps the state clean.
5. **Strings.** `lua_tostring` is `cwrap(..., "string")` and returns a JS string directly; `luaL_loadstring` measures with `lengthBytesUTF8`, so UTF-8 sources load correctly. No `lua_tolstring` length handling needed for JSON-sized results.
6. **JSON on the Lua side.** No JSON library on the target; tstl's own suite injects a Lua `json` module. A hand-rolled encoder in TypeScript is ~40 lines; `string.gsub` returns `LuaMultiReturn`, so destructure `[out] = string.gsub(...)`; `pairs()` order is undefined, sort keys for stable output; `tostring(1.5)` gives `1.5` and `tostring(10)` gives `10` (integers) or `10.0` (floats), both valid JSON numbers.
7. **Require paths** are what the emitted Lua contains: `lualib_bundle` (bare), and rootDir-relative dotted paths (`lib.handles.handle` with `rootDir: "."`; `handles.handle` with `rootDir: "./lib"`). The preload key must match exactly; computing it from the file path relative to `outDir` (as tstl's `util.ts` does) matches in both layouts.

## Experiment 3: lint stack

### Versions installed

`npm install --save-dev eslint@10 typescript-eslint@8 eslint-plugin-import-x@4 eslint-plugin-prettier@5 eslint-config-prettier@10 prettier@3` resolved to:

| Package | Version | Relevant peers |
|---------|---------|----------------|
| eslint | 10.11.0 | `engines: ^20.19.0 \|\| ^22.13.0 \|\| >=24`; peer `jiti: *` (optional) |
| typescript-eslint (+ parser, eslint-plugin) | 8.70.1 | `eslint ^8.57.0 \|\| ^9.0.0 \|\| ^10.0.0`, `typescript >=4.8.4 <6.1.0` |
| eslint-plugin-import-x | 4.17.1 | `eslint ^8.57.0 \|\| ^9.0.0 \|\| ^10.0.0`, `@typescript-eslint/utils ^8.56.0`, `eslint-import-resolver-node *` |
| eslint-plugin-prettier | 5.5.6 | `eslint >=8.0.0`, `eslint-config-prettier >= 7.0.0 <10.0.0 \|\| >=10.1.0`, `prettier >=3.0.0` |
| eslint-config-prettier | 10.1.8 | `eslint >=7.0.0` |
| prettier | 3.9.9 | |

109 packages added, **no peer warnings**, no crash at runtime. Two packages had to be added beyond the #11 list:

- `@eslint/js@10.0.1`: ESLint 10 no longer depends on it (its dependency list has no `@eslint/js`), and `eslint.configs.recommended` comes from it.
- `eslint-import-resolver-typescript@4.4.5`: `importPlugin.flatConfigs.typescript` sets `settings["import-x/resolver"] = { typescript: true }`. Without the package, import-x falls back to loading the `typescript` npm package as the resolver and every import fails with `Resolve error: typescript with invalid interface loaded as resolver` (165 `import-x/no-unresolved`, 33 `import-x/namespace`, 33 `import-x/no-duplicates`, 5 `import-x/export`, all false positives). With it, zero import-x findings from the recommended set.

### Working flat config (`eslint.config.mjs`)

```js
import eslint from "@eslint/js";
import importPlugin from "eslint-plugin-import-x";
import prettierRecommended from "eslint-plugin-prettier/recommended";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    // spike-only ignores: build outputs, harness, the config itself
    ignores: ["dist/**", "dist-tsc/**", "dist-test/**", "**/*.js", "eslint.config.mjs", "spike.test.ts", "tstl-test-util.ts"],
  },
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  importPlugin.flatConfigs.recommended,
  importPlugin.flatConfigs.typescript,
  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
  },
  { rules: { "import-x/no-cycle": "error" } },   // not in recommended; #11 relies on it
  prettierRecommended,                            // must be last
);
```

Config-file naming: the same content as `eslint.config.js` in a package with `"type": "commonjs"` fails before linting (`Warning: Failed to load the ES module ... Make sure to set "type": "module" in the nearest package.json file or use the .mjs extension`, then `SyntaxError: Cannot use import statement outside a module`). ESLint 10 does not apply Node's ESM syntax detection to the config file. `eslint.config.mjs` works; so would `"type": "module"`.

The projectService picks `tsconfig.json` for `lib/**`; files outside any tsconfig (the config itself, the harness) produce `Parsing error: ... was not found by the project service` under the type-checked rules, hence the ignores.

### Runs

| Run | Sources | Resolver | Files | Problems | Time |
|-----|---------|----------|------:|---------:|-----:|
| 1 | as checked out (CRLF) | none | 44 | 8,766 (8,727 errors, 39 warnings; 32 rules) | 13.4 s |
| 2 | LF-normalised | `eslint-import-resolver-typescript` | 43 | 359 (353 errors, 6 warnings; 27 rules; 37 files affected) | 2.6 s |
| 3 | as run 2, plus `import-x/no-cycle: error` | same | 43 | 363 (28 rules) | 2.5 s |

Run 1's count is dominated by line endings: this checkout has CRLF (`core.autocrlf=true` on the machine; the repo's `.gitattributes` says `* text=LF`, which sets `text` but not `eol`, so autocrlf still converts), and Prettier 3's default `endOfLine: "lf"` reports `Delete ␍` on every line: 8,386 of the 8,387 `prettier/prettier` hits. The 13.4 s includes the resolver failures on every import.

### Problems per rule (run 2, top 15 of 27)

| # | Rule | Count |
|---|------|------:|
| 1 | prettier/prettier | 217 |
| 2 | @typescript-eslint/no-unsafe-return | 39 |
| 3 | @typescript-eslint/no-confusing-void-expression | 19 |
| 4 | @typescript-eslint/no-deprecated | 11 |
| 5 | @typescript-eslint/no-unnecessary-condition | 10 |
| 6 | @typescript-eslint/prefer-nullish-coalescing | 10 |
| 7 | @typescript-eslint/no-base-to-string | 8 |
| 8 | (unused `eslint-disable` directives, reported by ESLint itself) | 6 |
| 9 | @typescript-eslint/non-nullable-type-assertion-style | 5 |
| 10 | @typescript-eslint/no-unnecessary-boolean-literal-compare | 3 |
| 11 | @typescript-eslint/no-unnecessary-type-assertion | 3 |
| 12 | no-useless-assignment | 3 |
| 13 | @typescript-eslint/no-unused-vars | 3 |
| 14 | @typescript-eslint/no-duplicate-enum-values | 2 |
| 15 | @typescript-eslint/no-extraneous-class | 2 |

Remaining rules with 1-2 hits: `unified-signatures`, `no-unsafe-assignment`, `prefer-const`, `no-unnecessary-template-expression`, `restrict-template-expressions`, `prefer-optional-chain`, `no-unnecessary-type-arguments`, `consistent-indexed-object-style`, `ban-tslint-comment`, `prefer-return-this-type`, `array-type`, `use-unknown-in-catch-callback-variable`.

Notes on the largest buckets:

- `prettier/prettier` 217: 205 are `Insert ,` (Prettier 3 changed the `trailingComma` default from `es5` to `all`); the rest are `public declare` ordering and union-type line breaks. All are auto-fixable; `trailingComma: "es5"` in `.prettierrc` would remove 205 of them without touching the sources.
- `no-unsafe-return` 39: every `Handle.getObject()` call site returns the `any` stored in the `WeakMap<handle, any>` registry (`handles/handle.ts`).
- `no-deprecated` 11: `String.prototype.substr` in `handles/item.ts` and `handles/unit.ts`.
- `import-x/no-cycle` (run 3) 4: two cycles, `handles/force.ts` ↔ `handles/player.ts` (`Force` imports `MapPlayer`, `MapPlayer` imports `Force`) and `handles/group.ts` ↔ `handles/unit.ts`.
- The old `.eslintrc.json` and `.eslintignore` are ignored by ESLint 10 (eslintrc support removed); their rule overrides (`no-undef: 0`, `camelcase` allow-list for `bj_*`, etc.) no longer apply. `no-undef` did not fire under the flat config because `eslint-recommended` overrides from typescript-eslint disable it for TS files.

## Amendments to #11

1. **`rootDir` is mandatory under TypeScript 6** (TS5011) whenever sources live below the project root. `packages/reforged-ts/tsconfig.json` needs `"rootDir": "src"`.
2. **Node floor `>=22.13`, not `>=22.12`.** ESLint 10.11.0 declares `engines: ^20.19.0 || ^22.13.0 || >=24`. Node 24 as the tested version is unaffected.
3. **Two more lint devDependencies:** `@eslint/js` (no longer a dependency of ESLint 10; provides `eslint.configs.recommended`) and `eslint-import-resolver-typescript` (required by `import-x`'s `flatConfigs.typescript`; without it every import is a false-positive resolve error).
4. **`import-x/no-cycle` must be enabled explicitly**; it is not in `flatConfigs.recommended`. On the current sources it reports two cycles (`force` ↔ `player`, `group` ↔ `unit`), which the migration has to either break or allowlist.
5. **Config file is `eslint.config.mjs`** unless the package sets `"type": "module"`; ESLint 10 does not detect ESM syntax in a `.js` config under a CommonJS package.
6. **Line endings need a decision before the lint stack lands.** The repo's `.gitattributes` (`* text=LF`) does not force LF checkouts; on Windows with `core.autocrlf=true` the sources are CRLF and `eslint --fix` would rewrite every file. Either `* text=auto eol=lf` in `.gitattributes` (Prettier's recommended setup with the default `endOfLine: "lf"`) or `endOfLine: "auto"` in `.prettierrc`. Separately, decide `trailingComma` in `.prettierrc` (Prettier 3 default `all` accounts for 205 of the 217 formatting diffs).
7. **Test-file naming:** tstl emits `foo.test.ts` as `foo_test.lua`; the vitest host must require `foo_test`, or tests should be named `foo_test.ts` / `foo.spec` equivalents that map one-to-one. Not a blocker, but the harness contract must state it.
8. **Stub baseline:** the Lua stub file must define, before the first `require`, the globals the library touches at load time: `bj_MAX_PLAYER_SLOTS`, `bj_MAX_PLAYERS`, `bj_UNIT_FACING`, `Player`, `CreateTrigger`, `FourCC` (a Reforged helper, not a Native). `main`/`config` may stay `nil`.

Confirmed without change: `moduleResolution: "bundler"` (no fallback needed); `lua-types/5.3` public root; `lualib_bundle.lua` emitted in library mode and preloadable; `noImplicitSelf` + explicit `@noSelfInFile` (tstl injects the directive into every `.d.ts`, the explicit one is preserved and harmless); `eslint-plugin-prettier/recommended` last; typescript-eslint 8 accepts TS 6.0.2 (`<6.1.0`).

## Not verified

- The `nodenext` + voces `tstl-strip-js.cjs` fallback (not needed).
- Behaviour of the emitted `require("handles.handle")` paths when the package is consumed from `node_modules` by a Map project's `luaBundle` (Template pipeline, #23).
- vitest itself; the harness ran as a plain Node script. Nothing in the glue depends on the runner.
- pnpm; the spike used npm 11.9.0.
