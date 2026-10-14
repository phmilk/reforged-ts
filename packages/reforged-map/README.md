# reforged-map

Reads a Warcraft III Reforged map folder at build time and returns the code a [reforged-ts](https://github.com/phmilk/reforged-ts) Map project generates from it. Node only: nothing of it reaches the map's Lua.

A Map project gets it through the [Template](https://github.com/phmilk/reforged-ts-template), whose build calls it on every install, build and watch. It needs `reforged-types` 1.0.0-alpha.5 or later as a peer, the first that declares the Rawcode types.

**Supported Patch: 3.0.0.24268.** The `reforged.patch` field of `package.json` carries the same Build.

<!-- The release's version step (release:version) stamps the docs version of each release into these links: docs/release.md. -->

**For AI agents:** the documentation of this version as Markdown: [llms.txt](https://phmilk.github.io/reforged-ts/docs/next/llms.txt) links each page, and [llms-full.txt](https://phmilk.github.io/reforged-ts/docs/next/llms-full.txt) holds them all in one file.

**Build phase.** Until 1.0.0, every version is an alpha (`1.0.0-alpha.N`) published under the `next` dist-tag. Install with `@next`: `pnpm add -D reforged-map@next`. npm gives `latest` to the first alpha, so `latest` stays on `1.0.0-alpha.0` until 1.0.0 is published, and moves to 1.0.0 then.

## What it reads and writes

`generateEditorGlobals(mapFolder)` reads the map folder's `war3map.lua` and `war3map.wtg` and returns two files, each a bare file name and its text, plus the author-facing warnings:

| File                                        | What it holds                                                                                                                                                |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `editor-globals.d.ts` (`DECLARATIONS_FILE`) | One `declare let` per Editor global: each `gg_` and `udg_` global the World Editor declares in the header of `war3map.lua`.                                  |
| `editor-globals.lua` (`LUA_STUB_FILE`)      | A Lua stub for the `reforged-test` harness: each global set to `nil` or to its header literal. It calls no Native, and defines `__jarray` when it is absent. |

```ts
import { generateEditorGlobals, MapFolderError } from "reforged-map";

const { files, warnings } = generateEditorGlobals("maps/my-map.w3m");
```

- A `gg_` global is typed by its prefix (`gg_rct_` is a `rect`, `gg_unit_` a `unit`); a `gg_snd_` music entry, a string in the header, is a `string`.
- A `udg_` global is typed by its initializer (`0` is a `number`, `__jarray("")` a `Record<number, string>`), or, for a handle, by the Native `InitGlobals` assigns it (`NonNullable<ReturnType<typeof CreateGroup>>`).
- Only the header (the lines before the first column-0 `function`) and the body of `InitGlobals` are read: the map's custom script and the trigger functions are not.

A `udg_` variable whose Variable Editor type names an Object kind is declared with that Object kind, so `CreateUnit(owner, udg_SpawnType, …)` compiles with no cast and `UnitAddAbility(u, udg_SpawnType)` does not:

| Variable Editor type | Declared                       |
| -------------------- | ------------------------------ |
| `unitcode`           | `Rawcode<"unit">`              |
| `itemcode`           | `Rawcode<"item">`              |
| `abilcode`           | `Rawcode<"ability">`           |
| `buffcode`           | `Rawcode<"buff">`              |
| `destructablecode`   | `Rawcode<"destructable">`      |
| `techcode`           | `Rawcode<"unit" \| "upgrade">` |
| `ordercode`          | `number`                       |

An array is a `Record<number, T>` of the same type. These are every type of the Variable Editor of Patch 3.0 that names an Object kind. The other types it stores as integers (`animtype`, `subanimtype`, `imagetype`, `mousebuttontype`, `terrainshape`, `terraintype`, `equipmenttype`, `itemtag`) are enumerations, not Rawcodes, and stay `number`. The types come from `war3map.wtg` in the 1.31+ format (`WTG!`, format `0x80000004`, sub-version 7), which the 3.0 World Editor and HiveWE write; only its header and its variables block are read, never the triggers, so no `TriggerData.txt` is needed. The list of globals still comes from `war3map.lua`: a variable `war3map.wtg` declares and `war3map.lua` does not is ignored. The wtg type wins over the `war3map.lua` initializer (`0`, `__jarray(0)`, HiveWE's `nil` and `__jarray("")`); every other type keeps the type `war3map.lua` gives it. The Lua stub sets a Rawcode variable to its header literal, as any other. The [Rawcodes guide](https://github.com/phmilk/reforged-ts/blob/master/website/docs/guides/rawcodes.md#gui-variables-of-an-object-type) shows these variables in a Map project, and how a Map project generated before this package switches to it.

The package only reads the map folder (ADR 0006). The generated files are git-ignored and read-only in a Map project: a global is added or renamed in the World Editor, never in them.

## The Rawcode lookup

`openRawcodeLookup({ mapFolder, projectRoot })` opens a lookup from a Rawcode to the object or objects it names, for a tool that reads the map (a lint rule, a hover) without parsing it. `projectRoot` is a folder of the Map project, from which the optional peer `reforged-builtins` is resolved; the package never reads `reforged.config.ts`. `minInterval` (milliseconds, `DEFAULT_MIN_INTERVAL`, one second, when left out) is the minimum interval between two checks of the modification times of the files the lookup reads.

```ts
import { openRawcodeLookup } from "reforged-map";

const rawcodes = openRawcodeLookup({
  mapFolder: "maps/my-map.w3m",
  projectRoot: ".",
});
const result = rawcodes.lookup("h000");
if (result.status === "known") console.log(result.objects[0].name);
console.log(rawcodes.gameVersion()); // "3.0.0"
```

`lookup(rawcode)` is synchronous, never throws, and returns one result, told apart by its `status`:

| `status`               | When                                                                           | What it carries                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ---------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `known`                | the Rawcode names an object                                                    | `objects`: one, or two for a Rawcode two kinds share (`B000`), each with its Rawcode, Object kind, name, race, and `origin`: `builtin` (with its Game data sets, each an `id` and the World Editor's name, `label`), `modified` (the game's name `builtinName` and the map's `mapName`, with its Game data sets) or `custom` (its `base`); and its `constant`, its object, member and module (a generated module is a bare file name, which the caller finds in its generated folder) |
| `not-in-game-data-set` | it names Built-in objects only, and the map's Game data set holds none of them | `objects`, with the fields of a known one, and `gameDataSet`, the map's, an `id` and a `label`                                                                                                                                                                                                                                                                                                                                                                                        |
| `unknown`              | it names no Built-in object and no object of the map                           | `suggestions`: up to three Rawcodes one character away (a change of case first), each once, with its name and Object kind                                                                                                                                                                                                                                                                                                                                                             |
| `malformed`            | the literal is not four printable ASCII characters                             | the literal; returned whatever the lookup's state                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `unavailable`          | the map folder cannot be read, or `reforged-builtins` is not installed         | `reason`, a sentence a tool shows once                                                                                                                                                                                                                                                                                                                                                                                                                                                |

`gameVersion()` gives the Game version of the `reforged-builtins` index the lookup read, undefined when it is unavailable. `warnings()` gives the warnings of reading the map folder, each one line, empty when it is unavailable. The map's Game data set is read from `war3map.w3i` (formats 18 to 39, as wc3libs reads them; a format before 31, which has no Game Data Version, as The Frozen Throne): its Game Data Set and Game Data Version name one of the index's sets, Default reading Custom, or Melee on a map with the "Melee Map" flag. A missing, truncated or unknown-format `war3map.w3i` gives a warning, and no Rawcode is then returned as `not-in-game-data-set`. Nothing is read until the first lookup, and what it reads is kept, an unavailable result too: the objects and their names are the ones `generateObjects` writes. A later lookup, once `minInterval` has passed since the last check, compares the modification times of the Object data files, their Skin files, `war3map.wts`, `war3map.w3i` and the `reforged-builtins` index, and reads everything again when one changed, appeared or disappeared, so an object saved in the World Editor is known at the next lookup, without a build. A read that fails then makes the lookup unavailable until a later check finds the files changed and reads them. A race is the game's, a Custom object's its base's: a race the map sets on an object is not read. The package has no top-level await, so a CommonJS host such as tsserver loads it with `require`.

## Errors and warnings

A missing map folder, or a map folder without `war3map.lua` (a map saved with JASS as its script language), throws a `MapFolderError` whose message says what to do in the World Editor. Everything else is a warning, and the build goes on:

- an unknown `gg_` prefix: the global is declared `handle`;
- a `udg_` initializer the reader does not recognize: the global is declared `unknown`;
- a missing, truncated or unknown-format `war3map.wtg`, when `war3map.lua` declares a `udg_` variable: the variables whose type names an Object kind keep the type `war3map.lua` gives them, `number` (`Record<number, number>` for an array) for a map the World Editor saved, `unknown` (`Record<number, string>` for an array) for one HiveWE saved;
- a variable whose type names an Object kind and that `war3map.wtg` and `war3map.lua` disagree is an array: it keeps the type `war3map.lua` gives it.

## Fixtures

`test/fixtures/blank-map.w3m` holds the `war3map.lua` and `war3map.wtg` of the Template's blank map, as the 3.0 World Editor saved them (the Template's `tests/pipeline/fixtures/blank-map.w3m`). `test/fixtures/wc3libs` holds fixtures of [wc3libs](https://github.com/inwc3/wc3libs), taken unmodified from its `src/test/resources/wc3data` at commit `0542c4140012dfb872ac01513ff68f5cbef98658`, under the Apache License 2.0 (its `LICENSE` and `NOTICE`): four `war3map.wtg` files, three in the 1.31+ format and one older, and ten Object data files, an abilities file of format version 2 and one of version 3, a base and Skin pair of units files of version 3, and an empty file of version 2 for each of the six other Object kinds. The tests copy an Object data fixture into a temporary map folder under the name the game gives it. `test/fixtures/editor-variables.w3m` is the Template's map folder saved by the World Editor of Patch 3.0.0.24268, holding one GUI variable of each Variable Editor type that names an Object kind, plus `integer` and `ordercode`, each as a scalar and as an array, with and without an initial value. Its variables were seeded into `war3map.wtg` by a script, then loaded, checked in the Variable Editor and saved by the World Editor, which wrote both `war3map.wtg` and `war3map.lua`: `test/fixtures/editor-variables.md` gives the Build, the editor and the steps. Git stores these folders byte for byte. The tests build other `war3map.wtg` files in a temporary folder (`test/support/wtg.ts`), and Object data files and `war3map.wts` in format versions 1, 2 and 3 (`test/support/object-data.ts`), and type-check the generated declarations in a Map project against the workspace's `reforged-types` and `reforged-ts` (`test/fixtures/map-project`); run `pnpm build` before running the package's tests on their own.

## License

MIT. The wc3libs fixtures under `test/fixtures/wc3libs`, which the package does not publish, are Apache-2.0.
