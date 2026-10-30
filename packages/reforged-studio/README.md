# reforged-studio

The Studio of reforged-ts: a local app that edits a Map project's Object data through `reforged-map`, taking turns with the World Editor ([#829](https://github.com/phmilk/reforged-ts/issues/829)). It is private and unpublished while its Spec is built; the server, the page and the release come in its later Tickets.

What it holds today is the reader of the developer's own Warcraft III install ([#830](https://github.com/phmilk/reforged-ts/issues/830)), which the Studio reads the game through and which the `reforged-builtins` generator imports as a workspace dev dependency: the workspace's one copy of each reader. Nothing in it writes to disk.

## The reader of the install

- **The CASC reader** (`openStorage`): the local storage of an install, read-only, in TypeScript with no native code and no dependency. It lists the root's paths and reads a file by its path, matched without regard to case, each checked against its content key.
- **The SLK and profile readers** (`parseSlk`, `Profile`): the tables and the `.txt` profile files of the game's object data.
- **The install** (`findInstall`): the folder that holds `.build.info`, found from an argument, else the executable `WC3_EXECUTABLE` names, else the Battle.net app's default folders (drive C under WSL), as the Probe runner finds the game.
- **The layers of a Game data set** (`GAME_DATA_SETS`, `layeredPath`): `_Balance/<Set>_V<version>.w3mod:` where the install has a kind's file, else the base layer `War3.w3mod:`, and no unit, item or ability of a later Game Data Version, as Probe runs measured them ([#575](https://github.com/phmilk/reforged-ts/issues/575), [`docs/research/builtins-layers.md`](../../docs/research/builtins-layers.md)).

## The game data model

`readGameData(storage, { gameDataSet })` gives, for one Game data set:

- each Object kind's label (its tab in the Object Editor) and fields, from its `*MetaData.slk`: where the field is (its table or the profile files, its index, its levels, its data column), its type and category, its enUS label (`UI/WorldEditStrings.txt`, `UI/WorldEditGameStrings.txt`, the second file's value winning), and the raw values and labels of the enumeration it reads (`UI/UnitEditorData.txt`);
- each Built-in object of the set, with its base values as the files hold them (one per level for a field of levels) and its group in the World Editor's tree: race, Melee or Campaign, then Units, Buildings, Heroes or Special for a unit; the class of an item; race, then Units, Heroes or Items for an ability; race, then Buffs or Effects for a buff; the category of a destructable or a doodad; the race of an upgrade;
- `text(value)`: a `WESTRING_` key resolved through the editor strings.

The profile files are every `.txt` file of `Units/` and `Doodads/` in the base layer, each from the set's layer where it has one, then those of the enUS layer, each group in the code-point order of its paths; a key set twice keeps its first value, the rule measured for the names files ([#564](https://github.com/phmilk/reforged-ts/issues/564)) taken for every key. A set's own value (`Name:custom,V1=`) wins over the shared one.

The model shows; it does not decide what is written. `reforged-builtins`' field table stays the source of where a field goes and of its value type, which `reforged-map`'s writer reads.

## Path resolution

`createPathResolver(storage, { artLayer, mapFolder })` resolves an icon's or a model's path as [#481](https://github.com/phmilk/reforged-ts/issues/481) measured it, in this order:

1. the map folder, layered like the game: `_hd.w3mod/<path>` then `<path>` in HD and DE, `<path>` in SD, each part matched without regard to case;
2. the chosen art layer, `War3.w3mod:_HD.w3mod:` or `War3.w3mod:_DE.w3mod:`;
3. the base layer, `War3.w3mod:`;
4. `War3.w3mod:FileAliases.json`, whose destination goes through the three steps again.

In each place a `.blp` or `.tif` path falls back to its `.dds`. A model's `.mdl`, or a path with no extension as the skin files write it, is read as its `.mdx`. A path that resolves nowhere is reported as missing, never thrown.

`readArtLayer({ preferencesFile, supportedModes })` chooses the art layer: the World Editor's Asset Mode preference (`[Misc] assetMode` of `WorldEditPreferences.txt`, its `hd` when the mode is Default), limited by the map's Supported Modes, and HD when the preference cannot be read. The meaning of both values is read from the order of the editor's strings, not checked in the World Editor: that is a human's check of [#842](https://github.com/phmilk/reforged-ts/issues/842).

## What needs the game

Every test runs on synthetic storages the tests write in a temporary folder, with no byte of Blizzard's. On a machine with the game, `pnpm --filter reforged-studio studio:check-install [--install <folder>]` finds the install as `pnpm builtins:generate` does and reads the Footman's base values, its icon and its HD model.
