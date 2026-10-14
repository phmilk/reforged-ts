# reforged-map

Reads a Warcraft III Reforged map folder at build time and returns the code a [reforged-ts](https://github.com/phmilk/reforged-ts) Map project generates from it: the declarations of its Editor globals, and the `FourCC` overloads and constants of its objects. For a tool that reads the map, such as a lint rule or a hover, it gives a lookup from a Rawcode to its object. Node only: nothing of it reaches the map's Lua.

A Map project gets it through the [Template](https://github.com/phmilk/reforged-ts-template), whose build calls it on every install, build and watch. It needs `reforged-types` 1.0.0-alpha.5 or later as a peer, the first that declares the Rawcode types. [`reforged-builtins`](https://github.com/phmilk/reforged-ts/tree/master/packages/reforged-builtins) is an optional peer, resolved from the Map project's own installation: its index names a Custom object after its base and gives the lookup the Built-in objects. Without it, `generateObjects` names such an object `Unnamed`, with a warning, and the lookup is unavailable.

**Supported Patch: 3.0.0.24268.** The `reforged.patch` field of `package.json` carries the same Build.

<!-- The release's version step (release:version) stamps the docs version of each release into these links: docs/release.md. -->

**For AI agents:** the documentation of this version as Markdown: [llms.txt](https://phmilk.github.io/reforged-ts/docs/next/llms.txt) links each page, and [llms-full.txt](https://phmilk.github.io/reforged-ts/docs/next/llms-full.txt) holds them all in one file.

**Build phase.** Until 1.0.0, every version is an alpha (`1.0.0-alpha.N`) published under the `next` dist-tag. Install with `@next`: `pnpm add -D reforged-map@next`. npm gives `latest` to the first alpha, so `latest` stays on `1.0.0-alpha.0` until 1.0.0 is published, and moves to 1.0.0 then.

## The Editor globals

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

## The map's objects

`generateObjects(mapFolder, { projectRoot })` reads the map folder's Object data and returns eight files, each a bare file name and its text, plus the author-facing warnings. `projectRoot` is a folder of the Map project, from which `reforged-builtins` is resolved; the map folder when left out.

```ts
import { generateObjects } from "reforged-map";

const { files, warnings } = generateObjects("maps/my-map.w3m", {
  projectRoot: ".",
});
```

| File                                                                                                                                                                     | What it holds                                                                                                                                                                                                                                                                                         |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `map-objects.d.ts` (`OBJECTS_DECLARATIONS_FILE`)                                                                                                                         | One ambient `FourCC` overload per Custom object and per Built-in object the map modifies, returning a `Rawcode` of its Object kind: `FourCC("h000")` is a `Rawcode<"unit">`.                                                                                                                          |
| `custom-units.ts`, `custom-items.ts`, `custom-abilities.ts`, `custom-buffs.ts`, `custom-destructables.ts`, `custom-doodads.ts`, `custom-upgrades.ts` (`CONSTANTS_FILES`) | One module per Object kind, exporting `CustomUnits`, `CustomItems`, `CustomAbilities`, `CustomBuffs`, `CustomDestructables`, `CustomDoodads` or `CustomUpgrades`: one constant per Custom object of the kind. Each is written even when the map has no object of its kind, so an import never breaks. |

- **What it reads.** `war3map.w3u` (units), `.w3t` (items), `.w3a` (abilities), `.w3h` (buffs), `.w3b` (destructables), `.w3d` (doodads) and `.w3q` (upgrades), each with its `war3mapSkin` counterpart, in format versions 1, 2 and 3, and the strings of `war3map.wts`. It does not read `war3map.lua`. A missing file holds no object, with no warning, so a map folder without Object data gives empty constants modules and no overload. The Object kind of an object is its file's, never its Rawcode's shape: any four-character Custom Rawcode is read.
- **Both layouts.** An object may be in the base file, the Skin file or both, and a string may be a `TRIGSTR_nnn` into `war3map.wts` or literal text. The 3.0 World Editor puts names in the Skin file as `TRIGSTR` references; another tool may write them in the base file as text. The two files' fields merge, the Skin file winning a field both set (ADR 0014).
- **The name** of an object is the field the Object Editor shows as its name: `unam` for a unit or an item, `anam`, a buff's editor name `fnam` else its tooltip `ftip`, `bnam`, `dnam`, `gnam`. Colour codes and line breaks are removed. A Custom object that sets no name has its base's enUS name from the index of `reforged-builtins`, as the Object Editor shows it.
- **The constants** are for Custom objects only, named by the rules of `reforged-builtins` (its README, "Constant names"): the name in PascalCase, then `_` and the Rawcode as cased. Captain (`h000`) is `CustomUnits.Captain_h000`, Chevalier Élu (`h001`) `CustomUnits.ChevalierElu_h001`, an object that sets no name `Footman_h002` when its base is the Footman, or `Unnamed_h002` without `reforged-builtins`. Two objects of one name stay apart by their Rawcodes. Each constant is an integer literal typed `Rawcode<kind>`: the value `FourCC` returns for the Rawcode, so it costs no call at run time. A Built-in object the map modifies has no Custom constant: the constant of `reforged-builtins`, such as `Units.Footman_hfoo`, names it.
- **The TSDoc** of an overload and its constant says what the object is: "Captain (`h000`), a Custom unit of this map, derived from Footman (`hfoo`)", with its constant and the module it comes from. A modified Built-in object's gives the game's name and the map's, "Footman (`hfoo`), a Built-in unit of Patch 3.0.0, named Militia in this map", or says that "this map modifies" it when the name is the game's, and names its constant in `reforged-builtins`.
- **The overloads' precedence.** The declarations file sits under the Map project's `src/`, so its literal overloads come before those `reforged-builtins` declares when a Map project turns them on: the map's TSDoc is the one the hover shows for `FourCC("hfoo")`. The Template holds this order with a type test.
- **A Rawcode two kinds share**, such as a Custom buff and a Custom destructable both at `B000` (the World Editor's defaults), gets no overload and no warning: `FourCC("B000")` stays an `UnknownRawcode`, and the constants `CustomBuffs.…_B000` and `CustomDestructables.…_B000` each keep their exact kind.

The generated files are git-ignored and read-only in a Map project: an object is created and renamed in the World Editor, never in them. A rename renames the object's constant, and the build fails at each use of the old one. The [Rawcodes guide](https://github.com/phmilk/reforged-ts/blob/master/website/docs/guides/rawcodes.md#custom-objects-of-the-map) shows these files in a Map project, and how a Map project generated before them turns them on.

### Check-time cost

The overloads cost type-check time per literal `FourCC` call, and nothing at run time. They are on in every Map project that generates them, since they come from `src/generated/`. `pnpm --filter reforged-map map:measure` (`test/measure`, after `pnpm build`) writes a map folder of 500 Custom units (`h000` to `h0DV`, each a named Footman), generates their overloads into a temporary Map project with the Template's compiler options, and type-checks a file of 100, then 1,000, literal `FourCC` calls cycling through the units, with and without the overloads. Each case is checked once untimed, then the timed runs alternate the two cases, and the median of 7 is kept. Measured on 2026-10-13 (TypeScript 6.0.2, Node 24, an 8-thread WSL machine, [#584](https://github.com/phmilk/reforged-ts/issues/584)), 1,000 calls:

| Machine state                    | Without the overloads | With them | Cost                             |
| -------------------------------- | --------------------- | --------- | -------------------------------- |
| Fast                             | 496 ms                | 1,031 ms  | +535 ms, about 0.5 ms per call   |
| Slow, about 3× slower throughout | 2,258 ms              | 4,407 ms  | +2,149 ms, about 2.1 ms per call |

Over the runs, the cost per call was 0.45 to 0.65 ms in the fast state and 1.98 to 2.32 ms in the slow one. At 100 calls it is inside the noise: the parse of the overloads weighs as much as the calls. In the same two states, the 4,651 overloads of `reforged-builtins` cost 3.27 and 9.55 ms per call: 500 Custom objects cost about a sixth of what every Built-in object does. A map holds tens to hundreds of objects, not thousands.

The cost grows with the number of literal calls. A constant costs no overload resolution: `CustomUnits.Captain_h000` is a property read. A literal of a Built-in object, not measured, passes every overload of the map before the Typings' `FourCC`, and costs at least as much as a Custom one. A Map project that also turns on the overloads of `reforged-builtins` pays both.

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

`gameVersion()` gives the Game version of the `reforged-builtins` index the lookup read, undefined when it is unavailable. `warnings()` gives the warnings of reading the map folder, each one line, empty when it is unavailable. The map's Game data set is read from `war3map.w3i` (formats 18 to 39, as wc3libs reads them; a format before 31, which has no Game Data Version, as The Frozen Throne): its Game Data Set and Game Data Version name one of the index's sets, Default reading Custom, or Melee on a map with the "Melee Map" flag. A missing, truncated or unknown-format `war3map.w3i` gives a warning, and no Rawcode is then returned as `not-in-game-data-set`. Nothing is read until the first lookup, and what it reads is kept, an unavailable result too: the objects and their names are the ones `generateObjects` writes. A later lookup, once `minInterval` has passed since the last check, compares the modification times of the Object data files, their Skin files, `war3map.wts`, `war3map.w3i` and the `reforged-builtins` index, and reads everything again when one changed, appeared or disappeared, so an object saved in the World Editor is known at the next lookup, without a build. A read that fails makes the lookup unavailable, and each later check reads the files again until one succeeds. A race is the game's, a Custom object's its base's: a race the map sets on an object is not read. The package has no top-level await, so a CommonJS host such as tsserver loads it with `require`.

## Errors and warnings

A missing map folder throws a `MapFolderError` whose message says what to do in the World Editor, and so does a map folder without `war3map.lua` (a map saved with JASS as its script language) for `generateEditorGlobals`. Everything else is a warning, and the build goes on. Of the Editor globals:

- an unknown `gg_` prefix: the global is declared `handle`;
- a `udg_` initializer the reader does not recognize: the global is declared `unknown`;
- a missing, truncated or unknown-format `war3map.wtg`, when `war3map.lua` declares a `udg_` variable: the variables whose type names an Object kind keep the type `war3map.lua` gives them, `number` (`Record<number, number>` for an array) for a map the World Editor saved, `unknown` (`Record<number, string>` for an array) for one HiveWE saved;
- a variable whose type names an Object kind and that `war3map.wtg` and `war3map.lua` disagree is an array: it keeps the type `war3map.lua` gives it.

Of the objects, each naming its file or its object:

- an Object data file that is truncated, of a format version other than 1, 2 and 3, holds a field of an unknown value type, or holds an object with more than one set of modifications (a layout the implementations disagree on, [#460](https://github.com/phmilk/reforged-ts/issues/460)): the file is left out with its objects, and the other files are still read;
- a name that is a `TRIGSTR_nnn` `war3map.wts` does not hold: the object is named as if it set no name;
- a Custom object one file defines twice, or a Built-in object one file modifies twice: the first is kept;
- a Custom Rawcode equal to a Built-in object's Rawcode, which the World Editor never makes: it is read as the map's Custom object;
- a Custom Rawcode with a character that cannot end an identifier: the object gets its overload and no constant;
- `reforged-builtins` not installed or not readable, when a Custom object keeps its base's name: the object is named `Unnamed`.

## Fixtures

`test/fixtures/blank-map.w3m` holds the `war3map.lua` and `war3map.wtg` of the Template's blank map, as the 3.0 World Editor saved them (the Template's `tests/pipeline/fixtures/blank-map.w3m`). `test/fixtures/wc3libs` holds fixtures of [wc3libs](https://github.com/inwc3/wc3libs), taken unmodified from its `src/test/resources/wc3data` at commit `0542c4140012dfb872ac01513ff68f5cbef98658`, under the Apache License 2.0 (its `LICENSE` and `NOTICE`): four `war3map.wtg` files, three in the 1.31+ format and one older, and ten Object data files, an abilities file of format version 2 and one of version 3, a base and Skin pair of units files of version 3, and an empty file of version 2 for each of the six other Object kinds. The tests copy an Object data fixture into a temporary map folder under the name the game gives it. `test/fixtures/editor-variables.w3m` is the Template's map folder saved by the World Editor of Patch 3.0.0.24268, holding one GUI variable of each Variable Editor type that names an Object kind, plus `integer` and `ordercode`, each as a scalar and as an array, with and without an initial value. Its variables were seeded into `war3map.wtg` by a script, then loaded, checked in the Variable Editor and saved by the World Editor, which wrote both `war3map.wtg` and `war3map.lua`: `test/fixtures/editor-variables.md` gives the Build, the editor and the steps. `test/fixtures/editor-objects.w3m` is the Template's map folder saved by the same World Editor, holding a Custom object of each of the seven Object kinds, a modified Built-in object of each kind, three of them renamed, a Custom object with a non-ASCII name, a three-level ability, and a Custom buff and a Custom destructable both at `B000`. Its objects were seeded into the Object data files by a script, then loaded and saved by the World Editor, which moved their names into the Skin files and `war3map.wts`: `test/fixtures/editor-objects.md` gives the Build, the editor, the steps and what the editor wrote. Git stores these folders byte for byte. The tests build other `war3map.wtg` files in a temporary folder (`test/support/wtg.ts`), and Object data files and `war3map.wts` in format versions 1, 2 and 3 (`test/support/object-data.ts`), and type-check the generated files in a Map project against the workspace's `reforged-types` and `reforged-ts`, and `reforged-builtins` for the modified Built-in objects. Each `test/fixtures/*map-project` folder holds the generated files the tests expect and the code that uses them, its negative fixtures asserted by error code and line. Run `pnpm build` before running the package's tests on their own.

## License

MIT. The wc3libs fixtures under `test/fixtures/wc3libs`, which the package does not publish, are Apache-2.0.
