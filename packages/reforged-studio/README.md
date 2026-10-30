# reforged-studio

The Studio of reforged-ts: a local app that edits a Map project's Object data through `reforged-map`, taking turns with the World Editor ([#829](https://github.com/phmilk/reforged-ts/issues/829)). It is private and unpublished while its Spec is built; editing, saving, previews and the release come in its later Tickets.

It holds two parts: the Studio's server and page ([#831](https://github.com/phmilk/reforged-ts/issues/831)), and the reader of the developer's own Warcraft III install ([#830](https://github.com/phmilk/reforged-ts/issues/830)), which the Studio reads the game through and which the `reforged-builtins` generator imports through the workspace root's dev dependency: the workspace's one copy of each reader.

## Starting the Studio

`startStudio({ projectRoot, mapFolder, gameExecutable, worldEditorExecutable, port, open })` starts it and returns `{ url, close }`; `url` is `http://localhost:<port>`, the page `<url>/objects`, an object `<url>/objects/<rawcode>`. It runs in Node from the Map project's own installation: `reforged-map` is its peer, and `reforged-builtins` and `typescript` are resolved from `projectRoot` through it, as the lookup resolves them. It never depends on `reforged-ts`.

- `projectRoot`: the Map project's root, under which its Object definitions (`src/objects`) and Object manifest (`object-manifest.json`) are.
- `mapFolder`: the map folder, saved as a folder by the World Editor.
- `gameExecutable`: the game's executable, or any path inside its install; else the one `WC3_EXECUTABLE` names, else the Battle.net app's default folders. Not found, it throws `InstallNotFoundError`, whose one-line message names the setting to fix.
- `worldEditorExecutable`: the World Editor the reload after a save starts, which comes with the save.
- `port`: the first port tried, 5476 when left out; the next free one above it is taken when it is not free, and 0 takes any.
- `open`: whether to open the page in the system's browser.
- `worldEditorCheck` and `env`, for tests and tools: `reforged-map`'s World Editor check options, and the environment "Open in editor" reads.

The bin is a thin wrapper over it, for a Map project not made from the Template, whose `pnpm studio` is to call `startStudio` itself ([reforged-ts-template#145](https://github.com/phmilk/reforged-ts-template/issues/145)):

```sh
reforged-studio --map maps/my-map.w3m [--project <root>] [--game <executable>] [--world-editor <executable>] [--port <port>] [--no-open]
```

It prints the URL, opens the page unless `--no-open`, and stops on Ctrl+C.

## The server

The server is Node's `http`, no framework. It listens on `127.0.0.1` only. It answers only a request whose `Host` is `localhost:<port>` or `127.0.0.1:<port>`, against DNS rebinding, and accepts a write, any method but `GET`, only with an `Origin` of its own, `http://localhost:<port>` or `http://127.0.0.1:<port>`: anything else is a 403.

It opens the map folder once with `reforged-map`'s `openObjectData(mapFolder, { projectRoot })`, and its Rawcode lookup with `openRawcodeLookup`, so the Studio, the hover and the lint rule agree on what a Rawcode names. The session keeps the saved state (what the map folder held at the last read), the working state (the saved state plus the unsaved edits), the states before and after its last save, and the undo and redo stacks, in the shape of the prototype of [#476](https://github.com/phmilk/reforged-ts/issues/476). An edit is one of the editor's, checked at once; the edits of one request are one undo step, applied all or none.

It polls, once a second with `stat` and holding no file open, the files the lookup reads (the Object data files and their Skin files, `war3map.wts`, `war3map.w3i`, the Object definitions and the Object manifest) and the placement files, `war3map.doo` and `war3mapUnits.doo`. On a change with no unsaved edit it opens the map folder again, replaces the saved state and sends `reloaded`; with unsaved edits it keeps them and sends `changed-on-disk`.

## The API for a host

The page talks to the server only through this JSON API and its one event stream, and uses nothing a VS Code webview lacks: a later host serves the same page over the same API, pointing it at the server through the page's `reforged-studio-api` meta. The bodies' types are exported (`ObjectsAnswer`, `RawcodeAnswer`, `StudioEvents` and the others). A refusal is `{ error: { reason, message } }`.

| Route                                      | Answer                                                                                                                                                                                                                                                                                                                                                                          |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/session`                         | The map folder, the Build, the map's Game data set, what the World Editor shows of the map folder, the warnings and the unsaved edits.                                                                                                                                                                                                                                          |
| `GET /api/objects[?kind=&origin=&all=1]`   | The objects, by Object kind, origin (`custom`, `definition`, `modified`, `builtin`) and Rawcode, each with its name, base, Object definition, its group in the World Editor's tree, its icon's path, whether the map's Game data set holds it and whether another kind shares its Rawcode. The Built-in objects outside the map's Game data set show only with `all=1`, marked. |
| `GET /api/search?q=[&kind=&origin=&all=1]` | The objects of that Rawcode, then those whose name holds the text; for an unknown Rawcode, the lookup's suggestions.                                                                                                                                                                                                                                                            |
| `GET /api/objects/<rawcode>[?kind=]`       | What the lookup says: `known` (or `not-in-game-data-set`) with its objects, and the one selected, with its field table and base values; both objects of a shared Rawcode and none selected without `?kind=`; `unknown` (404) with the suggestions; `malformed` (400).                                                                                                           |
| `POST /api/edits`                          | `{ edits: [...] }`, each a `setField`, `removeField`, `addObject` or `removeObject`: the counts, or the editor's refusal (422) with its reason, or `object-definition` (409) for an object the code owns, naming its file, or `unavailable` (503) while the lookup cannot say which objects the code owns.                                                                      |
| `POST /api/open-in-editor`                 | `{ kind, rawcode }` of an Object definition: runs `code -g <file>:<line>`, else `$VISUAL <file>`, else `$EDITOR <file>`, or answers `no-editor` (404).                                                                                                                                                                                                                          |
| `GET /api/files?path=`                     | The bytes of an icon's or a model's file, as `application/octet-stream`, resolved as [Path resolution](#path-resolution) says, the map folder's imports first, in the HD art layer until [#839](https://github.com/phmilk/reforged-ts/issues/839) reads the World Editor's preference; a 404 for a path found nowhere, which the page shows as a placeholder.                   |
| `GET /api/events`                          | A `text/event-stream`: `session` on connecting, `reloaded`, `changed-on-disk`.                                                                                                                                                                                                                                                                                                  |

An object's field table has a row per field of its kind the install knows, one per level for a field of levels, with its base's value as the game's files hold it under the map's Game data set, and the working state's value and raw value where the object modifies it; then a row per modification of a field the install does not know. Each value comes as the file holds it and as the editor shows it (`display`, `baseDisplay`): an enumeration's label (`Normal` for `normal`), a `WESTRING_` key resolved. An Object definition is read-only, with its file and the line of its Rawcode.

A Built-in object the install holds, modified or not, comes with its group in the World Editor's tree, outermost first: its race through the editor data's `unitRace`, an item's class through its `itemClass`, then Melee or Campaign and Units, Buildings, Heroes or Special for a unit, Units, Heroes or Items for an ability, Buffs or Effects for a buff; a destructable's or a doodad's category as its data writes it. An object's icon is its kind's icon field (`uico`, `iico`, `aart`, `fart`, `gar1`), its own modification over its base's value; destructables and doodads have none.

## The page

The page is built at the package's build into `dist/page/`, static files shipped in the tarball: [React](https://react.dev) is its component framework, bundled with [Vite](https://vite.dev), and nothing is fetched from a CDN at run time (its Content-Security-Policy is `default-src 'self'`).

Its Objects area, read-only ([#832](https://github.com/phmilk/reforged-ts/issues/832)), has the layout of the prototype of [#476](https://github.com/phmilk/reforged-ts/issues/476):

- one tab per Object kind, and the tree of the kind's objects, grouped by origin first (Custom objects, Object definitions, modified Built-in objects, Built-in objects), the Built-in objects by the World Editor's grouping; a group renders its objects only while it is open;
- chips: the origin (an Object definition's with its lock and its file), a warning on a Rawcode another kind shares, and "not in this map's Game data set";
- the global search, Ctrl+K, by name or Rawcode across the seven kinds;
- the map's Game data set named at the top, the objects outside it hidden, and a toggle that shows them;
- one object's header, its "Differs from <base>" section with each modified field's base value, and its field table: each field's label, id, display and raw values, the levels of a field grouped and collapsible, the objects pinned with Compare as extra columns of the same kind, and a toggle that hides the fields at their base's value;
- icons in the tree, the header and every icon field, decoded in the page from the BLP and DDS files `GET /api/files` serves, with the readers of `mdx-m3-viewer-th`, the previews' viewer; a placeholder for one found nowhere;
- the pages of a link that selects nothing: `/objects/B000` with no `?kind=` asks which object, saying `FourCC` has no typed overload for it; an unknown Rawcode is "neither in this map nor Built-in", with the lookup's suggestions, the lint rule's.

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

1. the map folder, layered like the game: `_hd.w3mod/<path>` then `<path>` in HD and DE, `<path>` in SD, each part matched without regard to case (DE reads `_hd.w3mod/` until [#842](https://github.com/phmilk/reforged-ts/issues/842) observes where the World Editor writes a DE-only import);
2. the chosen art layer, `War3.w3mod:_HD.w3mod:` or `War3.w3mod:_DE.w3mod:`;
3. the base layer, `War3.w3mod:`;
4. `War3.w3mod:FileAliases.json`, whose destination goes through the three steps again.

Each layer, of the map folder or the storage, reads its enUS sub-layer (`_Locales/enUS.w3mod`) first, whatever the install's locale: the Studio shows enUS, as the names of `reforged-builtins` are; the tileset and `_teen` sub-layers HiveWE also reads are not: a preview has no tileset, and which art the World Editor shows from `_teen` was not checked. In each place a `.blp` or `.tif` path falls back to its `.dds`. A model's `.mdl`, or a path with no extension as the skin files write it, is read as its `.mdx`. A path that resolves nowhere is reported as missing, never thrown.

`readArtLayer({ preferencesFile, supportedModes })` chooses the art layer: the World Editor's Asset Mode preference (`[Misc] assetMode` of `WorldEditPreferences.txt`, its `hd` when the mode is Default), limited by the map's Supported Modes, and HD when the preference cannot be read. The meaning of both values is read from the order of the editor's strings, not checked in the World Editor: that is a human's check of [#842](https://github.com/phmilk/reforged-ts/issues/842).

## What needs the game

Every test runs on synthetic storages the tests write in a temporary folder, with no byte of Blizzard's. The page's tests (`test/page.test.ts`, seam 2) drive the built page in headless Chromium with [Playwright](https://playwright.dev) over the same server: they need `pnpm build` and the browser, which `pnpm --filter reforged-studio exec playwright install --only-shell chromium` installs once per machine and CI installs in its own step. On a machine with the game, `pnpm --filter reforged-studio studio:check-install [--install <folder>]` finds the install as `pnpm builtins:generate` does and reads the Footman's base values, its icon and its HD model.
