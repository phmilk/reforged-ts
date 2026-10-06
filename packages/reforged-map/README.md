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

A `udg_` variable of an object type is declared with the Object kind its Variable Editor type names, so `CreateUnit(owner, udg_SpawnType, …)` compiles with no cast and `UnitAddAbility(u, udg_SpawnType)` does not:

| Variable Editor type | Declared                       |
| -------------------- | ------------------------------ |
| `unitcode`           | `Rawcode<"unit">`              |
| `itemcode`           | `Rawcode<"item">`              |
| `abilcode`           | `Rawcode<"ability">`           |
| `buffcode`           | `Rawcode<"buff">`              |
| `destructablecode`   | `Rawcode<"destructable">`      |
| `techcode`           | `Rawcode<"unit" \| "upgrade">` |
| `ordercode`          | `number`                       |

An array is a `Record<number, T>` of the same type. The types come from `war3map.wtg` in the 1.31+ format (`WTG!`, format `0x80000004`, sub-version 7), which the 3.0 World Editor and HiveWE write; only its header and its variables block are read, never the triggers, so no `TriggerData.txt` is needed. The list of globals still comes from `war3map.lua`: a variable `war3map.wtg` declares and `war3map.lua` does not is ignored. The wtg type wins over the `war3map.lua` initializer (`0`, `__jarray(0)`, HiveWE's `nil` and `__jarray("")`); every other type keeps the type `war3map.lua` gives it. The Lua stub sets a Rawcode variable to its header literal, as any other.

The package only reads the map folder (ADR 0006). The generated files are git-ignored and read-only in a Map project: a global is added or renamed in the World Editor, never in them.

## Errors and warnings

A missing map folder, or a map folder without `war3map.lua` (a map saved with JASS as its script language), throws a `MapFolderError` whose message says what to do in the World Editor. Everything else is a warning, and the build goes on:

- an unknown `gg_` prefix: the global is declared `handle`;
- a `udg_` initializer the reader does not recognize: the global is declared `unknown`;
- a missing, truncated or unknown-format `war3map.wtg`: object-type variables are declared as `war3map.lua` types them;
- a variable `war3map.wtg` and `war3map.lua` disagree is an array: it keeps the type `war3map.lua` gives it.

## Fixtures

`test/fixtures/blank-map.w3m` holds the `war3map.lua` and `war3map.wtg` of the Template's blank map, as the 3.0 World Editor saved them (the Template's `tests/pipeline/fixtures/blank-map.w3m`). `test/fixtures/wc3libs` holds the `war3map.wtg` fixtures of [wc3libs](https://github.com/inwc3/wc3libs), three in the 1.31+ format and one older, under the Apache License 2.0 (its `LICENSE` and `NOTICE`). Git stores both byte for byte. The tests build other `war3map.wtg` files in a temporary folder (`test/support/wtg.ts`), and type-check the generated declarations in a Map project against the workspace's `reforged-types` and `reforged-ts` (`test/fixtures/map-project`); run `pnpm build` before running the package's tests on their own.

## License

MIT. The wc3libs fixtures under `test/fixtures/wc3libs`, which the package does not publish, are Apache-2.0.
