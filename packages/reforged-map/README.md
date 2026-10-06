# reforged-map

Reads a Warcraft III Reforged map folder at build time and returns the code a [reforged-ts](https://github.com/phmilk/reforged-ts) Map project generates from it. Node only: nothing of it reaches the map's Lua.

A Map project gets it through the [Template](https://github.com/phmilk/reforged-ts-template), whose build calls it on every install, build and watch. The package is private until its first release (#497).

## What it reads and writes

`generateEditorGlobals(mapFolder)` reads the map folder's `war3map.lua` and returns two files, each a bare file name and its text, plus the author-facing warnings:

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

The package only reads the map folder (ADR 0006). The generated files are git-ignored and read-only in a Map project: a global is added or renamed in the World Editor, never in them.

## Errors and warnings

A missing map folder, or a map folder without `war3map.lua` (a map saved with JASS as its script language), throws a `MapFolderError` whose message says what to do in the World Editor. Everything else is a warning, and the build goes on:

- an unknown `gg_` prefix: the global is declared `handle`;
- a `udg_` initializer the reader does not recognize: the global is declared `unknown`.

## Fixtures

`test/fixtures/blank-map.w3m` holds the `war3map.lua` and `war3map.wtg` of the Template's blank map, as the 3.0 World Editor saved them (the Template's `tests/pipeline/fixtures/blank-map.w3m`). Git stores them byte for byte.

## License

MIT.
