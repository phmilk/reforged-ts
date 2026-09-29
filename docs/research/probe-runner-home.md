# Probe runner home: what the Template's pipeline offers, where the runner can live, and where `CustomMapData` is

Research note for ticket [#297](https://github.com/phmilk/reforged-ts/issues/297) (map [#296](https://github.com/phmilk/reforged-ts/issues/296)). Facts and options only, no decision: the choice belongs to the runner contract ticket ([#299](https://github.com/phmilk/reforged-ts/issues/299)).

Written 2026-09-29. Sources:

- The Template, `phmilk/reforged-ts-template`, at `main` commit [`b7e6469`](https://github.com/phmilk/reforged-ts-template/tree/b7e6469d80938a0986f356a1b5c8cbcce13a95ab) ("chore(deps): reforged-ts 1.0.0-alpha.6", #52). The files cited below were read from a local clone and checked byte for byte (line endings aside) against that commit through the GitHub API.
- This repository at `master` commit [`ad09176`](https://github.com/phmilk/reforged-ts/tree/ad0917614b1dfe9ed26cf6a95689c91075f02131).
- Microsoft Learn, Raymond Chen's blog and the Wine source (GitHub mirror `wine-mirror/wine` at `master` commit `6880117`, 2026-09-28), linked where cited.
- Measurements on the maintainer's machine (Windows 11 Pro 10.0.26200, Node v24.14.0, Warcraft III 3.0 installed through Battle.net), marked **measured**.

Vocabulary as in `CONTEXT.md` and the map: **Probe** = a script that runs in the real game, measures facts and writes a result file; **Probe run** = one execution of a Probe through the runner (build, a human launches the game, the agent reads the result). **Template** = `phmilk/reforged-ts-template`; **Map project** = a repository generated from it.

---

## 1. The Template's pipeline

### 1.1 Commands and runtime

`package.json` ([source](https://github.com/phmilk/reforged-ts-template/blob/b7e6469d80938a0986f356a1b5c8cbcce13a95ab/package.json)): `private: true`, `"type": "module"`, `engines.node >=24`, `packageManager pnpm@12.6.0`. The pipeline scripts are TypeScript files run directly by Node's type stripping (`node scripts/build.ts`), imported with `.ts` extensions; nothing is compiled or exported, and the package is never published.

| script                               | command                     | what it does                                                               |
| ------------------------------------ | --------------------------- | -------------------------------------------------------------------------- |
| `prepare`                            | `node scripts/generate.ts`  | writes `src/generated/` (env file, editor-globals typings) on install      |
| `build`                              | `node scripts/build.ts`     | compile, compose, stage, pack into `dist/`                                 |
| `dev`                                | `node scripts/dev.ts`       | rebuild on every change                                                    |
| `test:map`                           | `node scripts/launch.ts`    | find the game, build, launch the game on the staged folder                 |
| `use:local`                          | `node scripts/use-local.ts` | install the four library packages packed from a local reforged-ts checkout |
| `test`, `lint`, `typecheck`, `check` | vitest, eslint, tsc         | no game needed                                                             |

Pipeline dependencies relevant to a runner: `typescript-to-lua ^1.37.1`, `typescript 6.0.2`, `mdx-m3-viewer-th 5.13.4` (the MPQ writer), and the library packages `reforged-ts`, `reforged-types`, `reforged-test`, `eslint-plugin-reforged` at `^1.0.0-alpha.*` ranges from npm.

### 1.2 Configuration (`reforged.config.ts`, `scripts/config.ts`)

[`reforged.config.ts`](https://github.com/phmilk/reforged-ts-template/blob/b7e6469d80938a0986f356a1b5c8cbcce13a95ab/reforged.config.ts) default-exports a typed `Config` (`satisfies Config`): `mapFolder: "maps/reforged-ts-template.w3m"`, `outputFolder: "dist"`, `mode: "dev"`. It is committed, so it holds nothing machine-specific; a machine's game path goes in `WC3_EXECUTABLE` (and `WINEPREFIX`).

[`scripts/config.ts`](https://github.com/phmilk/reforged-ts-template/blob/b7e6469d80938a0986f356a1b5c8cbcce13a95ab/scripts/config.ts):

- `Config` fields: `mapFolder` (required), `outputFolder` (default `dist`), `archiveName` (default the map folder's name), `mode` (`dev` | `release`), `gameExecutable`, `extraLaunchArgs`, `winePath`, `winePrefix`.
- `loadConfig(path, argv)` imports the file through a `file:` URL, applies `--mode`, resolves every path against the file's folder, and refuses an `outputFolder` that covers the root, `src` or the map folder (it is deleted on every build).
- `loadLaunchConfig` adds `game: GameLaunch` and is kept apart so `pnpm build` never looks for the game.
- **Executable discovery** (`resolveGameLaunch`): `gameExecutable` if set (checked to exist, except through Wine), else the `WC3_EXECUTABLE` environment variable, else the first existing path of `wellKnownExecutables(platform, env)`:
  - Windows: `%ProgramFiles(x86)%\Warcraft III\_retail_\x86_64\Warcraft III.exe`, then `%ProgramFiles%\...` (falling back to the literal `C:\Program Files (x86)` / `C:\Program Files`);
  - macOS: `/Applications/Warcraft III/_retail_/x86_64/Warcraft III.app/Contents/MacOS/Warcraft III`;
  - Linux: none (Wine users set `WC3_EXECUTABLE`).
    The code comment says these locations are "NOT verified against a real 3.0 install". **Measured:** on the maintainer's machine `WC3_EXECUTABLE` is unset and `C:\Program Files (x86)\Warcraft III\_retail_\x86_64\Warcraft III.exe` exists, so the first Windows default finds the game.
- Discovery is injectable (`ExecutableProbe { platform, env, exists }`, `systemProbe` for the real machine), so tests never touch real locations ([`tests/pipeline/config.test.ts`, `launch.test.ts`](https://github.com/phmilk/reforged-ts-template/tree/b7e6469d80938a0986f356a1b5c8cbcce13a95ab/tests/pipeline)).
- Nothing in `config.ts` or anywhere in `scripts/` locates the Documents folder or `CustomMapData`.

### 1.3 Build (`scripts/build.ts` and the modules it calls)

[`build(config)`](https://github.com/phmilk/reforged-ts-template/blob/b7e6469d80938a0986f356a1b5c8cbcce13a95ab/scripts/build.ts) runs, in order:

1. `readEditorScript(mapFolder)` ([`stage.ts`](https://github.com/phmilk/reforged-ts-template/blob/b7e6469d80938a0986f356a1b5c8cbcce13a95ab/scripts/stage.ts)): the map folder must exist and hold `war3map.lua` (saved by the World Editor with Lua as script language), else an `AuthorError` telling the author how to fix it.
2. `luaBundleFile(tsconfig)` ([`compile.ts`](https://github.com/phmilk/reforged-ts-template/blob/b7e6469d80938a0986f356a1b5c8cbcce13a95ab/scripts/compile.ts)): the tsconfig's `tstl.luaBundle` (the Template's is `dist/bundle.lua`, entry `src/main.ts`, [`tsconfig.json`](https://github.com/phmilk/reforged-ts-template/blob/b7e6469d80938a0986f356a1b5c8cbcce13a95ab/tsconfig.json)), which must be a file of its own in the output folder.
3. `cleanOutputFolder`, then `stageMapFolder`: `fs.cpSync` of the map folder to `<output>/staging/<map folder name>`. The map folder is only read.
4. `generate(config)` ([`generate.ts`](https://github.com/phmilk/reforged-ts-template/blob/b7e6469d80938a0986f356a1b5c8cbcce13a95ab/scripts/generate.ts)): writes `src/generated/env.ts` (`devMode`) and the editor-globals typings and stub read from the map.
5. `compileBundle(tsconfig, bundleFile)`: `tstl.transpileProject(tsconfig)`; any error diagnostic is an `AuthorError`. The tsconfig is read, never overridden.
6. `composeMapScript(editorScript, bundle)` ([`compose.ts`](https://github.com/phmilk/reforged-ts-template/blob/b7e6469d80938a0986f356a1b5c8cbcce13a95ab/scripts/compose.ts)): editor script, one `\n`, bundle, byte-exact, written as the staged `war3map.lua`.
7. `packMapFolder(stagingFolder)` ([`pack.ts`](https://github.com/phmilk/reforged-ts-template/blob/b7e6469d80938a0986f356a1b5c8cbcce13a95ab/scripts/pack.ts)) and write `<output>/<archiveName>`.

The **MPQ writer** is `mdx-m3-viewer-th`'s pure-TypeScript `War3Map` (deep CommonJS import of the parser only), subclassed as `OpaqueW3iMap`: its `save()` skips parsing `war3map.w3i` (the upstream parser throws on the 3.0 editor's version 39, proved in [#32](https://github.com/phmilk/reforged-ts/issues/32); see `docs/research/mpq-writer-3.0.md` on `origin/research/mpq-writer-3.0`) and keeps an editor-written `war3map.imp`. Files are added in code-unit order, so the archive does not depend on directory listing order.

The command-line wrappers use `runAsEntry` and `AuthorError` ([`cli.ts`](https://github.com/phmilk/reforged-ts-template/blob/b7e6469d80938a0986f356a1b5c8cbcce13a95ab/scripts/cli.ts), `errors.ts`): an author error prints one line, a bug prints its stack; `build` also writes the GitHub Actions output `archive`.

### 1.4 Launch (`scripts/launch.ts`)

[`launch.ts`](https://github.com/phmilk/reforged-ts-template/blob/b7e6469d80938a0986f356a1b5c8cbcce13a95ab/scripts/launch.ts):

- `LAUNCH_ARGS = ["-launch", "-editor", "-windowmode", "windowed"]`, confirmed in game on 3.0.0.24268 in #32: `-launch` skips the menus, `-editor` reuses the saved login (without it 3.0 asks for one), `-loadfile` accepts an **unpacked map folder**.
- `launchCommand(game, mapFolder)` is pure (returns `{ command, args, env }`): `<exe> -loadfile <folder> <LAUNCH_ARGS> <extra>`; with `winePath`, the executable becomes Wine's first argument, the folder a `Z:` path (`Z:` maps to `/`), and `winePrefix` goes into `WINEPREFIX`.
- `startGame` spawns it detached (`detached: true`, `stdio: "ignore"`, `unref()`); a missing program is an `AuthorError`. It never waits for the game or reads anything back.
- `pnpm test:map` = find the game (fail before building), `build`, launch on `result.stagingFolder` (not the archive).

So a Probe run launched through `-loadfile` needs the staged folder only; the archive (and so the MPQ writer) is needed only when the map is opened another way. The Template's run-in-game skill says the game's map list shows an archive only once it is copied into `Documents\Warcraft III\Maps`, and never shows the staged folder ([`.claude/skills/run-in-game/SKILL.md`](https://github.com/phmilk/reforged-ts-template/blob/b7e6469d80938a0986f356a1b5c8cbcce13a95ab/.claude/skills/run-in-game/SKILL.md), step 5). That route would also need the Documents folder (section 3).

### 1.5 Wine

- Configured by `winePath` (and optionally `winePrefix`, else Wine's own `WINEPREFIX`) in `reforged.config.ts`; `WC3_EXECUTABLE` names the executable as a Windows path inside the prefix; auto-discovery does not run on Linux (run-in-game skill, step 6; `config.ts` doc comments).
- The launch passes the staged folder as `Z:/…` (section 1.4).
- Nothing in the Template maps a Windows-side path back to the host (no `winepath` call, no prefix reading).

### 1.6 What the Template writes about the result files

The run-in-game skill, step 3: "Files the map writes with the library's `File` land in the game's custom map data folder, `Documents\Warcraft III\CustomMapData` in the author's user folder, as preload files: after the run, the text is in their `Preload` calls." The Template reads nothing back from that folder.

### 1.7 Map folder and CI

- The map folder is committed: `maps/reforged-ts-template.w3m/` (17 editor files, including `war3map.lua`, `war3map.w3i`, `war3map.w3e`, `war3mapMap.blp`) ([tree](https://github.com/phmilk/reforged-ts-template/tree/b7e6469d80938a0986f356a1b5c8cbcce13a95ab/maps/reforged-ts-template.w3m)). Files in it change only through the World Editor (Template `AGENTS.md`, Overview; [ADR 0006](../adr/0006-template-owns-code-editor-owns-data.md)).
- The Template's own CI ([`ci.yml`](https://github.com/phmilk/reforged-ts-template/blob/b7e6469d80938a0986f356a1b5c8cbcce13a95ab/.github/workflows/ci.yml)) runs `pnpm build --mode release`, lint, typecheck and test on Ubuntu and Windows and uploads the archive; "`test:map` never runs here".
- A committed absolute path fails `tests/pipeline/absolute-paths.test.ts` ([`docs/agents/release-gate.md`](https://github.com/phmilk/reforged-ts-template/blob/b7e6469d80938a0986f356a1b5c8cbcce13a95ab/docs/agents/release-gate.md)).
- `pnpm use:local <checkout>` ([`use-local.ts`](https://github.com/phmilk/reforged-ts-template/blob/b7e6469d80938a0986f356a1b5c8cbcce13a95ab/scripts/use-local.ts)) builds the four packages of a reforged-ts checkout, packs them into the ignored `.local-packages/`, and installs them through the committed `.pnpmfile.cjs` hook without writing the lockfile; `--reset` goes back to npm. This is how a Template checkout runs unreleased library code.

## 2. This repository: `release/` and the Template gate

- `release/` is the private workspace package `reforged-ts-release` ([`release/package.json`](https://github.com/phmilk/reforged-ts/blob/ad0917614b1dfe9ed26cf6a95689c91075f02131/release/package.json)): "Never published", compiled with `tsc` to `build/`, each command a `release:*` root script (`tsc -p tsconfig.json && node build/cli/<name>.js`). The workspace already holds two more private packages of the same kind, `website` and `wrapper-coverage` ([`pnpm-workspace.yaml`](https://github.com/phmilk/reforged-ts/blob/ad0917614b1dfe9ed26cf6a95689c91075f02131/pnpm-workspace.yaml)). The workspace's `engines.node` is `>=22.13`; `.node-version` is `24` in both repositories.
- `release:template-clone --pack-dir <dir> --into <dir>` ([`release/src/template-clone.ts`](https://github.com/phmilk/reforged-ts/blob/ad0917614b1dfe9ed26cf6a95689c91075f02131/release/src/template-clone.ts)): `git ls-remote` then a shallow `git clone --branch v<major>` of the public Template, no token, `GIT_TERMINAL_PROMPT=0`. It must clone outside the checkout, or the Template "would otherwise be installed as part of this workspace".
- `release:template-gate --template <path> --pack-dir <dir>` ([`release/src/template-gate.ts`](https://github.com/phmilk/reforged-ts/blob/ad0917614b1dfe9ed26cf6a95689c91075f02131/release/src/template-gate.ts)): writes one `overrides` entry per packed package into the clone's `pnpm-workspace.yaml` (`file:<tarball>`), `pnpm install --no-frozen-lockfile`, checks the direct dependencies resolved to the packed versions, then runs the scripts `build --mode release`, `lint`, `test` by name and stops at the first failure. Its contract with the Template is those three script names, `--mode release` and an install with no manual step ([Template `docs/agents/release-gate.md`](https://github.com/phmilk/reforged-ts-template/blob/b7e6469d80938a0986f356a1b5c8cbcce13a95ab/docs/agents/release-gate.md)).
- CI: the `release.yml` jobs `pack` → `template-gate` (clone + gate on Ubuntu) → `publish` → `template-dispatch` ([`release.yml`](https://github.com/phmilk/reforged-ts/blob/ad0917614b1dfe9ed26cf6a95689c91075f02131/.github/workflows/release.yml) L141–213; [`docs/release.md`](../release.md), "The Template gate"). `ci.yml` also packs the publishable packages on every push to `master` and keeps the tarballs a week "for the Template maintainer's dry runs" ([`ci.yml`](https://github.com/phmilk/reforged-ts/blob/ad0917614b1dfe9ed26cf6a95689c91075f02131/.github/workflows/ci.yml) L130–143).
- So a dependency from this repository on the Template already exists, at release time only: the gate clones it by ref and runs three of its scripts. ADR 0006 lists "The library's release pipeline has a hard dependency on the Template repository being buildable" as a consequence.
- Nothing here builds a map, stages a map folder, writes an MPQ or launches the game. The closest pieces are the tstl build of the library (`packages/reforged-ts`, `tstl -p tsconfig.json`) and `examples:build`, which compiles the doc-comment examples; those under `packages/reforged-ts/examples/game/` "need the game and are only compiled" ([`examples/tsconfig.json`](https://github.com/phmilk/reforged-ts/blob/ad0917614b1dfe9ed26cf6a95689c91075f02131/packages/reforged-ts/examples/tsconfig.json)). No package in this workspace depends on `mdx-m3-viewer-th`.
- The current probe ([`docs/research/probe-map.lua`](probe-map.lua), #9) is a Lua file pasted into the World Editor; it writes `CustomMapData/reforged-probe.txt` through `Preload`/`PreloadGenEnd`.

## 3. Locating `Documents\Warcraft III\CustomMapData`

### 3.1 Windows: the Documents known folder

- The Documents folder is the known folder `FOLDERID_Documents` (`{FDD39AD0-238F-46AF-ADB4-6C85480369C7}`), per-user, default path `%USERPROFILE%\Documents`, CSIDL equivalents `CSIDL_MYDOCUMENTS`, `CSIDL_PERSONAL` ([KNOWNFOLDERID](https://learn.microsoft.com/en-us/windows/win32/shell/knownfolderid)). OneDrive has its own `FOLDERID_SkyDriveDocuments`, default `%USERPROFILE%\OneDrive\Documents` (same page). The API that resolves a known folder is `SHGetKnownFolderPath` (or the older `SHGetFolderPath`).
- .NET's `Environment.GetFolderPath(SpecialFolder.MyDocuments)` (= `Personal`, value 5) returns that folder; the docs note "the user can change some of the locations, and the locations are localized" ([Environment.SpecialFolder](https://learn.microsoft.com/en-us/dotnet/api/system.environment.specialfolder)).
- The registry holds the redirected path under `HKCU\Software\Microsoft\Windows\CurrentVersion\Explorer\User Shell Folders`, value `Personal` (`REG_EXPAND_SZ`, may contain `%USERPROFILE%`). The sibling key `Shell Folders` is a compatibility copy; Raymond Chen, "The long and sad story of the Shell Folders key" (2003-11-03), says to call `SHGetFolderPath` rather than read either key ([post](https://devblogs.microsoft.com/oldnewthing/20031103-00/?p=41973)).
- Node has no known-folder API: `os.homedir()` returns the profile folder, never the Documents folder.

**Measured** on the maintainer's machine (script run with Node v24.14.0 from Git Bash):

| lookup                                                                           | result                                             | time    |
| -------------------------------------------------------------------------------- | -------------------------------------------------- | ------- |
| `os.homedir()` / `%USERPROFILE%`                                                 | `C:\Users\night`                                   | 0 ms    |
| `%OneDrive%`                                                                     | `C:\Users\night\OneDrive`                          | 0 ms    |
| `reg query "HKCU\…\User Shell Folders" /v Personal` (`execFileSync`)             | `REG_EXPAND_SZ C:\Users\night\OneDrive\Documentos` | ~9 ms   |
| `reg query "HKCU\…\Shell Folders" /v Personal`                                   | `REG_SZ C:\Users\night\OneDrive\Documentos`        | ~8 ms   |
| `powershell.exe -NoProfile -Command [Environment]::GetFolderPath('MyDocuments')` | `C:\Users\night\OneDrive\Documentos`               | ~200 ms |
| same with `pwsh`                                                                 | `C:\Users\night\OneDrive\Documentos`               | ~275 ms |
| PowerShell `Shell.Application` `NameSpace('shell:Personal')`                     | `C:\Users\night\OneDrive\Documentos`               | ~380 ms |

- The game writes there: `C:\Users\night\OneDrive\Documentos\Warcraft III\CustomMapData` holds `reforged-probe.txt` (2026-09-23 21:20, the #9 probe), `FileTester.pld`, `rts-129-*.txt` and other maps' subfolders. Next to it the game keeps `Maps`, `Logs`, `Errors`, `ScreenShots`, `War3Preferences.txt` and more.
- **The naive guess finds the wrong folder.** `C:\Users\night\Documents\Warcraft III` (that is, `os.homedir()` + `Documents`) exists, but holds only a `Maps` folder and no `CustomMapData`. A runner that checks `path.join(os.homedir(), "Documents", "Warcraft III")` for existence would accept it and wait on a folder the game never writes.
- The folder's localised name (`Documentos`) appears only in the resolved path; none of the lookups above needed it.
- The `REG_EXPAND_SZ` value was already absolute here; on a machine without redirection it is typically `%USERPROFILE%\Documents` and needs expanding (Node does not expand it; `reg query` prints it raw). Not measured on a second machine.
- Whether the game itself offers a setting or launch argument that moves its user-data folder was not researched.

### 3.2 Under Wine

From the Wine source ([`dlls/shell32/shellpath.c`](https://github.com/wine-mirror/wine/blob/6880117619afdf62b4ccc40a8c6268c86613131f/dlls/shell32/shellpath.c)):

- `CSIDL_PERSONAL` / `FOLDERID_Documents` has registry value name `Personal`, parent `FOLDERID_Profile`, relative path `Documents` (L1133–1143): inside the prefix it is `%USERPROFILE%\Documents`, i.e. `C:\users\<user>\Documents`, which on the host is under `$WINEPREFIX/drive_c/users/` (Wine's README uses `~/.wine/drive_c/...` as the default prefix, [README](https://github.com/wine-mirror/wine/blob/6880117619afdf62b4ccc40a8c6268c86613131f/README.md) L137).
- Wine reads and writes the folder paths in `HKCU\Software\Microsoft\Windows\CurrentVersion\Explorer\User Shell Folders`, as Windows does (L2862–2865, L3783).
- When Wine creates the Documents folder it makes it a **symbolic link** to the host's `XDG_DOCUMENTS_DIR` from `~/.config/user-dirs.dirs` (or `$WINE_HOST_XDG_CONFIG_HOME/user-dirs.dirs`), falling back to `$HOME/Documents` (`create_link`, `_SHCreateSymbolicLink`, L2778–2849; `init_xdg_dirs`, L2680–2718). So on a desktop Linux the game's `CustomMapData` usually lands in the host's own Documents folder (itself possibly localised, e.g. `~/Documentos`), reached through the prefix path.
- Ways a host-side Node process can find it (none measured, no Wine install was available): the prefix path `$WINEPREFIX/drive_c/users/<user>/Documents/Warcraft III/CustomMapData` (following the symlink); `wine reg query "HKCU\…\User Shell Folders" /v Personal` plus `winepath -u` to turn the Windows path into a host path (starts the Wine server); or reading `$WINEPREFIX/user.reg` as text. The `<user>` folder name Wine picks was not checked in the source.
- The Template's Wine settings (`winePath`, `winePrefix`/`WINEPREFIX`) already name the prefix a runner would look in (section 1.5).

### 3.3 macOS

Not researched: the Template discovers a macOS executable (section 1.2), but where the macOS client keeps `CustomMapData` was not checked.

## 4. What a Probe run needs, against what exists

| need                                                    | exists in the Template                                       | exists here                                                                 |
| ------------------------------------------------------- | ------------------------------------------------------------ | --------------------------------------------------------------------------- |
| a Lua-script map folder saved by the 3.0 World Editor   | `maps/reforged-ts-template.w3m` (committed binaries)         | no                                                                          |
| compile a Probe (TypeScript) to one Lua bundle          | `compile.ts` over the tsconfig (`luaBundle`)                 | tstl in the catalog; `examples:build` compiles only                         |
| run it after the editor script                          | `compose.ts` (concatenation, 20 lines)                       | no                                                                          |
| a folder the game loads                                 | `stage.ts` + `-loadfile <folder>`                            | no                                                                          |
| an archive (only if not launched with `-loadfile`)      | `pack.ts` + `mdx-m3-viewer-th` with the w3i override         | no                                                                          |
| find the game and build the launch command (incl. Wine) | `config.ts` `resolveGameLaunch`, `launch.ts` `launchCommand` | no                                                                          |
| the human's launch                                      | `pnpm test:map` (builds, then starts the game detached)      | no                                                                          |
| unreleased library code in the map                      | `pnpm use:local <checkout>`                                  | the workspace sources (the examples map `reforged-ts` to `../src/index.ts`) |
| locate `CustomMapData` and read the result              | no                                                           | no                                                                          |

## 5. Options for where the runner lives

Each option lists what it reuses, what it duplicates, and the dependency it adds between `phmilk/reforged-ts` and `phmilk/reforged-ts-template`. No option is preferred here.

### A. A private workspace package in this repository (like `release/`)

A new private package (e.g. `probe/`, "never published"), with root scripts in the `release:*` style, holding its own build: tstl compile against the workspace sources, compose, stage, launch command, `CustomMapData` lookup and result reader. It needs a committed map folder of its own (copied once from the Template's `.w3m`, or a new one saved from the World Editor).

- **Reuses:** the workspace's catalog (tstl, TypeScript, vitest), the private-package pattern and CLI conventions of `release/`, the library sources directly (no pack or install step between a library change and a Probe run).
- **Duplicates:** compile, compose, stage and the launch pieces of the Template (a few hundred lines across `compile.ts`, `compose.ts`, `stage.ts`, `config.ts` discovery, `launch.ts`), plus `pack.ts` and a `mdx-m3-viewer-th` dependency only if an archive is wanted; a second copy of editor map binaries. The copies can drift from the Template (e.g. a launch-flag fix made in one place only).
- **Cross-repo dependency:** none added at run time. A provenance link to the Template files at a commit, if copied.

### B. A command in the Template

A `probe` script (or a `test:map` flag) in the Template, taking a Probe file, building with it as the entry, launching, and reading `CustomMapData` back. Probes stay in this repository and run in a Template checkout with `pnpm use:local <reforged-ts checkout>`.

- **Reuses:** the whole pipeline, discovery, Wine support, the committed map folder, the `AuthorError` style and the pipeline tests' injection pattern (`ExecutableProbe`).
- **Duplicates:** nothing of the pipeline; the `CustomMapData` lookup and the result reader are new wherever they live.
- **Cross-repo dependency:** a Probe run in this repository needs a Template checkout next to it (a local path, as `use:local` takes), the command's name and arguments become a contract like the gate's three scripts, and a change to the runner is a Template pull request. Every Map project generated from the Template inherits the command unless it is listed under the Template's "Template maintenance" section (deleted in a generated project). The gate is unaffected as long as `build`, `lint` and `test` stay green.

### C. Copy the minimal pieces into this repository

Option A cut down to what a `-loadfile` Probe run needs: compose (20 lines), stage (`fs.cpSync`), the tstl compile call, and `launchCommand` + `wellKnownExecutables` for printing the command the human runs. No MPQ writer, no `generate.ts` (its env file and editor-globals typings serve code that imports them), no watch.

- **Reuses:** the Template's proven shapes (flags confirmed in #32, the byte-exact compose, the Wine `Z:` mapping) by copy.
- **Duplicates:** roughly 150 lines and the map folder; smaller drift surface than A.
- **Cross-repo dependency:** none at run time; a note of the Template commit copied from.

### D. Drive a Template clone from this repository

A command here that makes a throwaway Template clone (as `release:template-clone` does, outside the checkout) or uses a given one, installs the library into it (the gate's `overrides` or `use:local`), writes the Probe as its entry, runs its `pnpm build` (or prints `pnpm test:map` for the human), then reads `CustomMapData`.

- **Reuses:** the Template's pipeline unchanged, and this repository's `template-clone` / `template-gate` code for cloning and installing packed packages.
- **Duplicates:** nothing of the pipeline.
- **Cross-repo dependency:** run time, not only release time: a clone (network, or a local path), the Template's layout (`src/main.ts` as entry, `reforged.config.ts`, script names) becomes a contract, and every Probe run pays a build + pack + install of the library packages first. It extends the dependency the gate already has (section 2).

### E. Others

- **Import the Template's scripts from a sibling path** (`../reforged-ts-template/scripts/build.ts`, run by Node's type stripping): reuses the code without copying, but depends on a local folder layout that CI and other contributors do not have, and on the Template's module shapes.
- **Extract the pipeline into a published package** used by both the Template and the runner: no duplication, but a new published package with its own versioning, and the Template's scripts become a dependency the Template gate then tests. ADR 0006 already deferred a scaffolder for being "one more artefact to keep in sync".
- **Keep the pipeline in the Template and put only the reader here**: the human runs `pnpm test:map` in a Template checkout with the Probe as `src/main.ts`; this repository holds the Probes and a small reader for `CustomMapData`. Reuses everything, duplicates nothing, and the cross-repo step is a manual copy of the Probe.

### Common to every option: the `CustomMapData` lookup

None of the pipelines above locates the Documents folder, so every option adds one. The facts in section 3 bound it: on Windows the known folder (through `reg query … User Shell Folders` with `%VAR%` expansion, or a PowerShell call to `GetFolderPath`, ~9 ms against ~200 ms measured) finds the redirected `OneDrive\Documentos`, while `os.homedir()` + `Documents` finds a wrong but existing folder; under Wine the path goes through the prefix (`WINEPREFIX`, which the Template's config already carries) and usually ends in a symlink to the host's XDG Documents folder. An environment-variable override in the style of `WC3_EXECUTABLE` would follow the Template's existing convention for machine-specific paths.
