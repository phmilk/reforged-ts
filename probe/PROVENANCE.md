# Provenance

The Probe runner copies the parts of the Template's pipeline a Probe run needs, and the Template's map folder, instead of depending on the Template ([ADR 0010](../docs/adr/0010-probe-runner-copies-the-template-pipeline.md)). This note lists every copied file, so a drift from the Template can be traced and repaired.

- **Source**: [phmilk/reforged-ts-template](https://github.com/phmilk/reforged-ts-template) at commit [`b7e6469d80938a0986f356a1b5c8cbcce13a95ab`](https://github.com/phmilk/reforged-ts-template/tree/b7e6469d80938a0986f356a1b5c8cbcce13a95ab) (`b7e6469`, the merge of the sync to `reforged-ts@1.0.0-alpha.6`).
- **Copied on**: 2026-09-30, for #329 (the map folder, the compile, compose and stage) and #330 (the game's discovery and launch).

## The map folder

`maps/reforged-ts-template.w3m/` is copied to `probe.w3m/`, byte for byte: each file's git blob hash is the Template's. `.gitattributes` keeps git from changing them (`-text -diff`), as the Template's does.

| Template file                                     | Copy                          |
| ------------------------------------------------- | ----------------------------- |
| `maps/reforged-ts-template.w3m/conversation.json` | `probe.w3m/conversation.json` |
| `maps/reforged-ts-template.w3m/war3map.doo`       | `probe.w3m/war3map.doo`       |
| `maps/reforged-ts-template.w3m/war3map.lua`       | `probe.w3m/war3map.lua`       |
| `maps/reforged-ts-template.w3m/war3map.mmp`       | `probe.w3m/war3map.mmp`       |
| `maps/reforged-ts-template.w3m/war3map.shd`       | `probe.w3m/war3map.shd`       |
| `maps/reforged-ts-template.w3m/war3map.w3c`       | `probe.w3m/war3map.w3c`       |
| `maps/reforged-ts-template.w3m/war3map.w3e`       | `probe.w3m/war3map.w3e`       |
| `maps/reforged-ts-template.w3m/war3map.w3grp`     | `probe.w3m/war3map.w3grp`     |
| `maps/reforged-ts-template.w3m/war3map.w3i`       | `probe.w3m/war3map.w3i`       |
| `maps/reforged-ts-template.w3m/war3map.w3l`       | `probe.w3m/war3map.w3l`       |
| `maps/reforged-ts-template.w3m/war3map.w3r`       | `probe.w3m/war3map.w3r`       |
| `maps/reforged-ts-template.w3m/war3map.wct`       | `probe.w3m/war3map.wct`       |
| `maps/reforged-ts-template.w3m/war3map.wpm`       | `probe.w3m/war3map.wpm`       |
| `maps/reforged-ts-template.w3m/war3map.wtg`       | `probe.w3m/war3map.wtg`       |
| `maps/reforged-ts-template.w3m/war3map.wts`       | `probe.w3m/war3map.wts`       |
| `maps/reforged-ts-template.w3m/war3mapMap.blp`    | `probe.w3m/war3mapMap.blp`    |
| `maps/reforged-ts-template.w3m/war3mapUnits.doo`  | `probe.w3m/war3mapUnits.doo`  |

## The pipeline modules

The Template runs its scripts with Node's type stripping and imports them as `./x.ts`; this package compiles with `tsc` like `release/`, so every copy imports `./x.js`. Other changes are listed per file.

| Template file        | Copy                | Changes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| -------------------- | ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `scripts/compose.ts` | `src/compose.ts`    | None.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `scripts/stage.ts`   | `src/stage.ts`      | The import only.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `scripts/errors.ts`  | `src/errors.ts`     | None.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `scripts/compile.ts` | `src/compile.ts`    | Adapted. `compileBundle` compiles one entry module (`transpileFiles`), not a tsconfig's files: the runner's in-game module, with the Probe mapped in per build through `paths`, `rootDir`, `outDir` and `luaBundle` set by the caller. An error is one line: the first diagnostic and a count of the others. `luaBundleFile` is dropped: the bundle's place is the caller's.                                                                                                                                    |
| `scripts/cli.ts`     | `src/cli/common.ts` | Only `printFailure`, as `failure`: it returns the text for the command's output streams instead of printing it. The commands take their arguments and output as `release/` does, so a test calls them.                                                                                                                                                                                                                                                                                                          |
| `scripts/config.ts`  | `src/machine.ts`    | Only `ExecutableProbe` and `systemProbe`, extended into `Machine` and `systemMachine`: file reads, the registry query, the process list and the detached spawn join the platform, environment and file existence.                                                                                                                                                                                                                                                                                               |
| `scripts/launch.ts`  | `src/machine.ts`    | Only `startGame`, as `spawnDetached` of `systemMachine`: its missing-program message names no configuration file, since the runner has none.                                                                                                                                                                                                                                                                                                                                                                    |
| `scripts/config.ts`  | `src/game.ts`       | Only the game's discovery: `EXECUTABLE_ENV`, `wellKnownExecutables`, `GameLaunch` and `resolveGameLaunch`, which reads `gameExecutable`, `winePath` and `winePrefix` from the command line (`--game-executable`, `--wine-path`, `--wine-prefix`, relative to the workspace) since the runner has no configuration file, and probes the injected `Machine`. Its messages name those options instead of the file's fields. `extraLaunchArgs` is dropped: a Probe run launches with the Template's arguments only. |
| `scripts/launch.ts`  | `src/launch.ts`     | Only `LAUNCH_ARGS` and `launchCommand`, without the extra arguments; it returns the `SpawnCommand` of `src/machine.ts`, the Template's `LaunchCommand`. `launchProbe` replaces the Template's entry: it finds the game before building, as `pnpm test:map` does.                                                                                                                                                                                                                                                |
