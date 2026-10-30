# reforged-map

Reads a Warcraft III Reforged map folder at build time and returns the code a [reforged-ts](https://github.com/phmilk/reforged-ts) Map project generates from it: the declarations of its Editor globals, and the `FourCC` overloads and constants of its objects. For a tool that reads the map, such as a lint rule or a hover, it gives a lookup from a Rawcode to its object, and for a tool that edits its Object data, an Object data editor that saves it byte for byte. For a Map project that declares objects in TypeScript, its entry `reforged-map/objects` writes Object definitions, and the build merges them into the map it ships. Its command, `reforged-map textconv`, lets `git diff` show Object data as text. Its TypeScript plugin, `reforged-map/typescript-plugin`, shows that object on the hover of a Rawcode literal and goes to its constant. Node only: nothing of it reaches the map's Lua.

A Map project gets it through the [Template](https://github.com/phmilk/reforged-ts-template), whose build calls it on every install, build and watch. It needs `reforged-types` 1.0.0-alpha.5 or later as a peer, the first that declares the Rawcode types. [`reforged-builtins`](https://github.com/phmilk/reforged-ts/tree/master/packages/reforged-builtins) is an optional peer, resolved from the Map project's own installation: its index names a Custom object after its base and gives the lookup the Built-in objects. Without it, `generateObjects` names such an object `Unnamed`, with a warning, and the lookup is unavailable. `typescript` is an optional peer too, needed only by a Map project with [Object definitions](#object-definitions), which are transpiled with it; such a project needs `reforged-builtins` as well.

**Supported Patch: 3.0.1.24370.** The `reforged.patch` field of `package.json` carries the same Build.

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

The package reads and writes the map folder's Object data, and only reads the rest of the map folder (ADR 0015): only [the Object data editor](#the-object-data-editor) writes, and only the Object data files and `war3map.wts`. The generated files are git-ignored and read-only in a Map project: a global is added or renamed in the World Editor, never in them.

## The map's objects

`generateObjects(mapFolder, { projectRoot, definitionsFolder, generatedFolder, manifest })` reads the map folder's Object data and the Map project's [Object definitions](#object-definitions), and returns eight files, each a bare file name and its text, plus the author-facing warnings. `projectRoot` is the Map project's root, from which `reforged-builtins` and `typescript` are resolved; the map folder when left out. The definitions folder, the generated folder and the Object manifest are found under it, `src/objects`, `src/generated` and `object-manifest.json` when left out.

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
- **Objects defined in code.** The objects are the ones the build ships: the map folder's, minus each object [the Object manifest](#the-object-manifest) owns that no definition defines, plus every definition (see [In the generated code and the lookup](#in-the-generated-code-and-the-lookup)). An object a definition defines gets the overload and the constant of one of the map folder, `CustomUnits.Sergeant_h002`, and its TSDoc adds "Defined in code, by the Object definition in `src/objects/units.ts`."
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

`openRawcodeLookup({ mapFolder, projectRoot })` opens a lookup from a Rawcode to the object or objects it names, for a tool that reads the map (a lint rule, a hover) without parsing it. `projectRoot` is the Map project's root, from which the optional peers `reforged-builtins` and `typescript` are resolved; the package never reads `reforged.config.ts`. `definitionsFolder`, `generatedFolder` and `manifest` are those of `generateObjects`, and the lookup reads the same objects, the [Object definitions](#in-the-generated-code-and-the-lookup) included. `minInterval` (milliseconds, `DEFAULT_MIN_INTERVAL`, one second, when left out) is the minimum interval between two checks of the modification times of the files the lookup reads.

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

| `status`               | When                                                                                                            | What it carries                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ---------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `known`                | the Rawcode names an object                                                                                     | `objects`: one, or two for a Rawcode two kinds share (`B000`), each with its Rawcode, Object kind, name, race, and `origin`: `builtin` (with its Game data sets, each an `id` and the World Editor's name, `label`), `modified` (the game's name `builtinName` and the map's `mapName`, with its Game data sets) or `custom` (its `base`); its `constant`, its object, member and module (a generated module is a bare file name, which the caller finds in its generated folder); and, for a modified or Custom object, `definitionFile`, the absolute path of the Object definition that defines it, undefined for the map folder's |
| `not-in-game-data-set` | it names Built-in objects only, and the map's Game data set holds none of them                                  | `objects`, with the fields of a known one, and `gameDataSet`, the map's, an `id` and a `label`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `unknown`              | it names no Built-in object and no object of the map                                                            | `suggestions`: up to three Rawcodes one character away (a change of case first), each once, with its name and Object kind                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `malformed`            | the literal is not four printable ASCII characters                                                              | the literal; returned whatever the lookup's state                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `unavailable`          | the map folder cannot be read, `reforged-builtins` is not installed, or the Object definitions cannot be loaded | `reason`, a sentence a tool shows once                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |

`gameVersion()` gives the Game version of the `reforged-builtins` index the lookup read, undefined when it is unavailable. `warnings()` gives the warnings of reading the map folder, each one line, empty when it is unavailable. The map's Game data set is read from `war3map.w3i` (formats 18 to 39, as wc3libs reads them; a format before 31, which has no Game Data Version, as The Frozen Throne): its Game Data Set and Game Data Version name one of the index's sets, Default reading Custom, or Melee on a map with the "Melee Map" flag. A missing, truncated or unknown-format `war3map.w3i` gives a warning, and no Rawcode is then returned as `not-in-game-data-set`. Nothing is read until the first lookup, and what it reads is kept, an unavailable result too: the objects and their names are the ones `generateObjects` writes. A later lookup, once `minInterval` has passed since the last check, compares the modification times of the Object data files, their Skin files, `war3map.wts`, `war3map.w3i`, the `reforged-builtins` index, every definition file under the definitions folder and the Object manifest, and reads everything again when one changed, appeared or disappeared, so an object saved in the World Editor is known at the next lookup, without a build. A read that fails makes the lookup unavailable, and each later check reads the files again until one succeeds. A race is the game's, a Custom object's its base's: a race the map sets on an object is not read. The package has no top-level await, so a CommonJS host such as tsserver loads it with `require`.

For a tool that shows every object, such as the Studio, `list()` gives them all at once, synchronous and never throwing: `{ status: "listed", objects, gameDataSet }`, each object as `lookup` returns it, by Object kind then Rawcode in code point order, with the map's Game data set (undefined when `war3map.w3i` does not say it), or the `unavailable` result `lookup` gives. `files()` names the files whose modification times the lookup checks, absolute, listed afresh at each call (a file need not exist), for a tool that watches what the lookup reads.

## The TypeScript plugin

`reforged-map/typescript-plugin` is a TypeScript language service plugin: on a Rawcode literal, the hover shows the object it names and go to definition goes to its constant. A Map project enables it in its tsconfig; the Template does:

```json
{
  "compilerOptions": {
    "plugins": [{ "name": "reforged-map/typescript-plugin" }]
  }
}
```

It reads the literals the lint rule `no-unknown-rawcodes` reads: the single string or template literal (without substitutions) argument of the global `FourCC`, and a number literal, decimal or hex, cast with `as` or an angle-bracket assertion to a Rawcode type of the Typings (`Rawcode<K>`, `Rawcode`, `UnknownRawcode`, told by their brand, not their name). `0` and every other literal are left to TypeScript, and so is the hover of the identifier `FourCC`, which shows the overload's documentation. It asks the [Rawcode lookup](#the-rawcode-lookup), so it agrees with the lint rule and the generated code, and it follows a World Editor save without a build.

- **Hover**, after TypeScript's own quick info when there is one, in the words of the generated TSDoc: the object's name, Rawcode, Object kind and origin, a Custom object's base, a modified Built-in object's two names, the file of the Object definition that defines it ("Defined in code, by the Object definition in `src/objects/units.ts`."), its race, a Built-in object's Game data sets, and its constant with its module. A Rawcode two kinds share (`B000`) shows both objects. A Built-in object outside the map's Game data set, an unknown Rawcode (with up to three Rawcodes one edit away) and a malformed literal show the lint rule's sentence. A cast number shows the Rawcode, or the bytes, it decodes to.
- **Go to definition**, through `definition` and `definitionAndBoundSpan`: the declaration of each object's constant, `Units.Footman_hfoo` in `reforged-builtins` or `CustomUnits.Captain_h000` in the generated module, then TypeScript's own definitions. An object whose constant cannot be found goes to its `FourCC` overload. An object an Object definition defines offers its definition after that: the definition's Rawcode literal in its file (the `rawcode` of its define function, else another literal holding the Rawcode), else the file's start when the Rawcode is computed; an unknown or malformed literal gets TypeScript's own result.

**The map folder.** `mapFolder` in the plugin's entry names it, an absolute path or one relative to the project root: the nearest folder holding a `package.json` above the tsconfig tsserver opened, so a tsconfig in a subfolder that extends the entry reads the same folder. Without it, the map folder is the one folder directly at the project root whose name ends in `.w3x` or `.w3m`, ignoring case, or with none there the one directly under `<project root>/maps/`, until 1.0.0 (ADR 0020): the lint rule's rule. One at the root wins over any under `maps/`; several at the root, or none at the root and several under `maps/`, turn Rawcode details off, as none at either does. `reforged-builtins` is resolved from the project root. The plugin never reads `reforged.config.ts`. A changed option takes effect when tsserver reloads the project, as it does when the tsconfig is saved.

**When the lookup cannot load** (the map folder missing or unreadable, no map folder at the root or under `maps/`, or several, or the Object definitions failing to load: a definition that throws or is invalid, or a missing peer, named after "The Object definitions could not be loaded: "), the hover of a Rawcode literal is one line, "Rawcode details are unavailable: <reason>", go to definition is TypeScript's own, and the hover resumes on its own once the cause is fixed. A definition that throws never makes its objects, or the map folder's, unknown. Without `reforged-builtins` in the project root, the plugin logs it once and stays off until tsserver restarts. Any error of the plugin falls back to TypeScript's own result, so it never breaks a request.

**The log.** The plugin writes to the tsserver log, each line prefixed with `reforged-map/typescript-plugin:`, once per distinct line: that it loaded, with the project root and the map folder it resolved, and each reason Rawcode details are off. In VS Code, "TypeScript: Open TS Server log" opens it, and offers to turn logging on when it is off.

**The editor's TypeScript.** tsserver looks for a project's plugins only beside itself and in the editor's probe locations, so the plugin loads only when the editor runs the Map project's own TypeScript: in VS Code, "TypeScript: Select TypeScript Version" then "Use Workspace Version", which the Template's `.vscode/settings.json` asks for. Under VS Code's TypeScript 7 extension, which runs no tsserver plugin, the plugin does not load; the generated overloads and constants still document each object.

**Requirements.** tsserver loads the plugin's CommonJS entry, `typescript-plugin/package.json`'s `main`, which loads the package's ES modules with `require`: the Node that runs tsserver must `require` an ES module (Node 20.19 or 22.12 and later; VS Code's own Node does). On an older Node, the plugin logs it once, naming the version, and stays off. It adds no dependency, uses only the `typescript` module tsserver hands it, and changes nothing `tsc`, typescript-to-lua or the build sees.

**Cost.** The lookup checks the modification times of the files it reads at most once a second, which costs about a millisecond. A hover that follows a save reads the map folder and the `reforged-builtins` index again, in the request: on a map folder of 500 Custom units, 60 to 160 ms on an 8-core machine under WSL2, once per save.

## The Object data editor

`openObjectData(mapFolder, { projectRoot })` opens a map folder's Object data, for a tool that edits it, such as Object sync or the Studio (ADR 0015). It reads the Object data files of the seven Object kinds, their Skin files and `war3map.wts` with the readers of `generateObjects`, and keeps what they read losslessly. `projectRoot` is a folder of the Map project, from which `reforged-builtins` is resolved, as for `generateObjects`; the map folder when left out.

```ts
import { ObjectDataWriterError, openObjectData } from "reforged-map";

const editor = openObjectData("maps/my-map.w3m", { projectRoot: "." });
for (const unit of editor.objects("unit")) {
  console.log(unit.rawcode, unit.name, unit.modifications.length);
}
const { written } = editor.save();
```

- `warnings` gives the readers' warnings, the ones `generateObjects` gives of the objects ([Errors and warnings](#errors-and-warnings)).
- `objects(kind)` lists the objects of a kind, or of every kind when left out, as the Object Editor shows them: each Custom object and each modified Built-in object, sorted by Rawcode, its base file and Skin file merged, named by its name, else its base's or the game's from `reforged-builtins`. Each modification gives its field id, value type, level and data pointer (abilities, doodads and upgrades only), its value, a `TRIGSTR_nnn` resolved through `war3map.wts`, its value as stored, and the file it is in.
- `save(folder, { worldEditorCheck })` saves to the map folder it opened, or to another folder, created when missing, and returns the files it wrote (`written`) and what the World Editor showed of that folder (`worldEditor`). It encodes every file first. To the map folder, it writes only the files whose bytes change, after comparing the bytes on disk of each with the bytes it read: on any difference, it throws an `ObjectDataWriterError` whose `reason` is `"changed-on-disk"`, and writes nothing. To another folder, it writes each file whose bytes differ from that folder's. Then, before the first write, it runs [the World Editor check](#the-world-editor-check) on the folder it saves to.

- `setField({ kind, rawcode, field, level, dataPointer }, value, { type })` sets a field of a Custom object of the map or of a Built-in object, and `removeField({ kind, rawcode, field, level, dataPointer })` removes it from both files of its kind, so that it goes back to its base's value. `level` and `dataPointer` are the abilities', doodads' and upgrades' only: `level` is required for a field with levels, and `dataPointer` defaults to the field's data column. Each edit is checked at once, throws an `ObjectDataWriterError` and changes nothing when it is refused; nothing is written until `save`.

```ts
editor.setField({ kind: "unit", rawcode: "h000", field: "umvs" }, 320);
editor.setField({ kind: "unit", rawcode: "h000", field: "unam" }, "Captain");
editor.setField(
  { kind: "ability", rawcode: "A000", field: "amcs", level: 2 },
  95,
);
editor.removeField({ kind: "unit", rawcode: "hfoo", field: "uhpm" });
editor.save();
```

- `addObject({ kind, rawcode, base })` adds a Custom object, from its Rawcode and the Rawcode of the Built-in object it derives from, and `removeObject({ kind, rawcode })` removes a Custom object, or resets a Built-in object by removing every modification of it, from both files of its kind. They are checked at once and written on `save`, as the field edits are.

```ts
editor.addObject({ kind: "unit", rawcode: "h002", base: "hfoo" });
editor.setField({ kind: "unit", rawcode: "h002", field: "unam" }, "Sergeant");
editor.removeObject({ kind: "unit", rawcode: "h001" });
editor.removeObject({ kind: "unit", rawcode: "hkni" });
editor.save();
```

**The Editor form.** An edit is written as the 3.0 World Editor saves it, so that its next save leaves it where it is. A field goes into the file the World Editor keeps it in, the base or the Skin file of its kind, as the field table of `reforged-builtins` says (read from the Map project's installation, its newest Game version, as the index). When the object holds the field there, its value is replaced in place: its position, value type, level, data pointer and end marker are kept. Otherwise it is appended to the object's modifications, with the field table's value type and the end marker the editor writes: the object's own Rawcode, a Custom object's included. ([#460](https://github.com/phmilk/reforged-ts/issues/460), section 4, gives four NUL bytes for a Custom object; the 3.0 World Editor's own save in `test/fixtures/editor-objects.w3m` writes its Custom Rawcode, and the editor's behaviour wins.) The field held in the other file (a foreign layout) is removed from there, and the object's other modifications stay as read. The object is added to both files of its kind when either lacks it, with one set of flag 0 (in format versions 1 and 2, without one), and a file the kind did not have is created in format version 3. A value equal to its base's is kept as a modification. An integer must fit in 32 bits, a real is stored as its nearest 32-bit value, and a string, written as literal UTF-8, must hold no NUL byte. A field the field table does not know is set only with its value type given, `{ type }` (Object adoption's raw escape, [#484](https://github.com/phmilk/reforged-ts/issues/484)), in the base file unless only the Skin file holds it. An added Custom object is appended to the Custom table of both files of its kind, with one set of flag 0 and no modification, so that a file that holds none of its fields still lists it, as the World Editor does; its fields then go each into its own file. Its Rawcode must be one no object of its kind holds and no Built-in object of `reforged-builtins`' index has, of any kind, but a Custom object of another kind may hold it: the World Editor makes a Custom buff and a Custom destructable `B000`. Its base must be a Built-in object of its kind in the index. A removed object loses every entry in both files, and a string it referenced goes under the rule of an unreferenced string below; its placements on the terrain stay, which are the caller's ([#482](https://github.com/phmilk/reforged-ts/issues/482)).

**The field table.** Where a field goes, its value type, whether it has levels and a data column, whether it is localizable and the labels of its comment in `war3map.wts` all come from the field table of `reforged-builtins`, `<Game version>/fields.json`, never from a game file at run time. Its generator reads every row of the seven kinds' `*MetaData.slk` in the game's install, labelled through the World Editor's strings: a field goes to the Skin file when its metadata's `netsafe` is not 0, and is localizable when the metadata externalizes its text. Where the 3.0 World Editor's own save puts a field elsewhere, the table carries an override of the generator, naming the fixture that shows it, as for the doodads' `dnam`, which the editor keeps in `war3map.w3d`. The [field table's section](https://github.com/phmilk/reforged-ts/tree/master/packages/reforged-builtins#the-field-table-tool-authors) of the `reforged-builtins` README gives its shape and its provenance.

**Without `reforged-builtins`.** It is an optional peer, resolved from `projectRoot` at its newest Game version, and an edit needs both its index and its field table. Without them (not installed, unreadable, or of a format this package does not read: it reads an index of format 1 and a field table of format 1 or 2, whose facts of format 1 are all the writer needs), the editor still opens the map folder, gives its warnings, lists its objects (an object that sets no name then has no `name` without the index), saves with no edit, which writes no file, and copies the Object data to another folder byte for byte, the World Editor check running as with it. `checkWorldEditor` and `reforged-map textconv` never read it. Each `setField`, `removeField`, `addObject` and `removeObject` throws an `ObjectDataWriterError` whose `reason` is `"builtins-missing"`, its message saying why the peer could not be read.

**Localizable strings.** A localizable string (a name, a tooltip: a text field of the field table, not a path such as `umdl`) is written as the World Editor writes it, a `TRIGSTR_nnn` reference, zero-padded to three digits, and its `STRING n` block in `war3map.wts`. A string held as literal text, or in the other file, is converted and moved when its field is set ([#475](https://github.com/phmilk/reforged-ts/issues/475)).

- **A new string** is numbered one above the highest of every `STRING n` of `war3map.wts` and every `TRIGSTR` the Object data or another file of the map folder references, an orphan and a reference to a missing string included, so that the World Editor and the editor never hand out one number twice: a gap is never filled.
- **A changed string** goes into its own `STRING n` when no other modification of the Object data references its number and no other file of the map folder (`war3map.lua`, `war3map.w3i`, `war3map.wtg`, any file at its top level) holds `TRIGSTR_n`, in any zero padding; into a new one otherwise, so that a rename never changes another object's text ([#484](https://github.com/phmilk/reforged-ts/issues/484)).
- **A string an edit leaves unreferenced**, by a set, a `removeField` or a `removeObject`, is removed under the same condition, and kept otherwise.
- **A new block** is appended, its number being the highest, with the file's own line ends and byte order mark, a blank line after it, and the World Editor's comment line from the field table's labels, `// Units: h000 (Captain), Name (Name)`: the Object kind's label, the Rawcode, the object's name (its `Name` field at level 0 after the edit, a buff's `EditorName`, else the name the index of `reforged-builtins` gives its base or itself in the editor's comments: a buff's editor name, empty when it has none, and an upgrade's names of every level, `R001 (Black Gunpowder,Refined Gunpowder,Imbued Gunpowder)`), the field's metadata name and its enUS label. A levelled field's comment names no level, as the World Editor writes it. The World Editor contract fixture ([#640](https://github.com/phmilk/reforged-ts/issues/640), `test/fixtures/editor-contract.w3m`) holds the editor's save of a script of edits of every kind, and a test asserts that the writer's output of the same edits is byte-identical to it, every Object data file, Skin file and `war3map.wts`. A block rewritten in place gets its comment line again; the rest of `war3map.wts`, every block no edit changes included, stays byte for byte. A map folder without `war3map.wts` gets one, with a byte order mark and CRLF.
- **A localizable value** is a string without a NUL byte or a CR, a line break being an LF alone, and without a line that is `}` alone, which would end its block.

**Translations.** A localizable string's translations, `setField(field, "Captain", { translations: { deDE: "Hauptmann" } })`, go where the 3.0.1 World Editor and the game keep them ([#711](https://github.com/phmilk/reforged-ts/issues/711), [`docs/research/locales.md`](https://github.com/phmilk/reforged-ts/blob/master/docs/research/locales.md)): into a `war3map.wts` per locale, `_Locales/<locale>.w3mod/war3map.wts`, under the string's own `STRING n`, while the field keeps its `TRIGSTR_nnn` and `war3map.wts` holds the default text. A locale is one of the game's twelve, `deDE`, `enUS`, `esES`, `esMX`, `frFR`, `itIT`, `koKR`, `plPL`, `ptBR`, `ruRU`, `zhCN` and `zhTW` (the type `Locale`).

- **A locale's table replaces `war3map.wts` whole** in that locale: a string it lacks shows as `TRIGSTR_nnn` there, not as the default text. So each table is kept a whole copy of `war3map.wts`, every string in its translation or in its default text. A locale given a translation and no table gets one, a copy of `war3map.wts` in its form (its byte order mark, its line ends, its comment lines); each table an edit writes gets the strings of `war3map.wts` it lacks, appended in number order with their default text; a string an edit adds or changes goes into every table, its translation or its default text; and a string an edit removes leaves every table.
- **A locale without a translation has no table**, and reads `war3map.wts`: a table that translates nothing after an edit (each of its strings is the default text) is deleted, as the World Editor leaves that locale's folder empty. A translation equal to the default text is none.
- **`war3map.imp`** lists each table, as the World Editor's save does: one entry per table, flag `0x1d`, path `_Locales/<locale>.w3mod/war3map.wts`, in path order among the tables' entries, every other entry kept where it is. The World Editor lists a table it finds with flag `0x15`, and sets bit `0x08` at its next save: `0x1d` is its fixed point, which the writer writes ([#713](https://github.com/phmilk/reforged-ts/issues/713)). It is edited only when a save adds or deletes a table; a list left empty is deleted, since the editor writes no `war3map.imp` for a map without imports. One that is not an import list of format 1 refuses the save, `"file-not-read"`.
- **Listing.** `objects()` gives each `TRIGSTR` modification's `translations`: the text of each locale whose table holds, under its number, another text than the default.
- **A map folder without translations** has none of this written: its `_Locales/` folders, empty as the World Editor creates them on every save, and its `war3map.imp` are never touched. A save of a map folder with tables and no edit writes no file.

**The round trip.** A save writes each file from what the readers read: in the format version it was read in (1, 2 or 3), with its objects, their modifications, duplicates, set counts and flags, end markers and field ids (a three-character one such as `Crs` included) as read, a string's bytes and a real's 32 bits, and the bytes after its last table. `war3map.wts` is written from its blocks' raw lines, with the bytes between them, its byte order mark and its line ends. So a save with no edit writes no file, and a save to another folder copies every Object data file, Skin file and `war3map.wts` byte for byte. A file the readers left out (truncated, of an unknown format version, an object with more than one set) is never rewritten: a save to another folder copies its bytes.

**Files.** The editor reads and writes through Node's `fs` only, which opens a file with delete sharing on Windows, so a World Editor save while a tool runs never fails on a file it holds ([#475](https://github.com/phmilk/reforged-ts/issues/475)). Each read or write is of one whole file, in one call: no handle is held across calls, and there is no lock and no watcher.

**The writer error.** `ObjectDataWriterError` is the one error the editor throws on a refused edit or save, and the one the World Editor check throws; nothing is written when it is thrown. Its `reason` is one a caller switches on, its `file` the file it is about, and its message says what the author does next:

| `reason`                      | When                                                                                                                | What the author does                                                                                       |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `"changed-on-disk"`           | A file the save would rewrite changed on disk since it was read: a World Editor save, say.                          | Open the map folder again, and make the edits again.                                                       |
| `"modified-in-world-editor"`  | The World Editor shows unsaved edits for the folder the save would write.                                           | Save or discard them in the World Editor, then save again.                                                 |
| `"world-editor-check-failed"` | The World Editor check could not read the windows' titles: it could not run, failed or timed out.                   | Check that `powershell.exe` runs from the shell, or turn the check off for a folder no World Editor opens. |
| `"builtins-missing"`          | An edit, when `reforged-builtins` or its field table could not be read from the Map project.                        | Install `reforged-builtins` in the Map project, or pass its root as `projectRoot`.                         |
| `"file-not-read"`             | An edit of a kind one of whose files the readers left out, named by `file`.                                         | Save the map with the World Editor of 3.0, then open it again.                                             |
| `"unknown-object"`            | An edit of a Rawcode the kind holds no Custom object of, and no Built-in object has.                                | Check the Rawcode and the Object kind.                                                                     |
| `"rawcode-taken"`             | An added Custom object whose Rawcode an object of its kind or a Built-in object of the index has.                   | Choose another Rawcode.                                                                                    |
| `"unknown-base"`              | An added Custom object whose base no Built-in object of its kind in the index has.                                  | Check the base's Rawcode and the Object kind.                                                              |
| `"unknown-field"`             | A field the field table does not know, set without a value type.                                                    | Give its value type, `{ type }`.                                                                           |
| `"field-held-twice"`          | An edit of a field one file, named by `file`, holds twice for the object (at one level and data pointer).           | Save the map with the World Editor, which keeps one, then open it again.                                   |
| `"invalid-value"`             | A value a file cannot hold, a value type other than the field table's, or a missing or wrong level or data pointer. | Give a value of the field's type, and the level of a field with levels.                                    |

### The World Editor check

An edit made in the World Editor and not yet saved shows only in its main window's title, `Warcraft III World Editor - [<path> *]` ([#475](https://github.com/phmilk/reforged-ts/issues/475)). A tool that wrote the map folder then would lose that edit, or have its own lost on the World Editor's next save. So `checkWorldEditor(mapFolder)` tells, from a map folder's path, what the World Editor shows of it:

- `"no-window"`: no World Editor window holds it;
- `"open"`: a window holds it without unsaved edits;
- `"modified"`: a window holds it with unsaved edits, its title ending in ` *]`.

It lists the top-level windows whose title has the form `Warcraft III World Editor - [<path>]`, and keeps those whose path is the map folder's, compared with `/` and `\` alike, ignoring case and a trailing separator. It reads the titles through `EnumWindows` and `GetWindowText` in a short-lived `powershell.exe` (about a second and a half): on Windows, and on WSL, where `powershell.exe` is on the path and the map folder's path is converted with `wslpath -w`. On any other system, and for a folder that does not exist, no World Editor can hold the folder, and the state is `"no-window"` without running anything. A check that cannot run `powershell.exe`, fails or takes longer than its `timeout` (15 seconds by default) throws an `ObjectDataWriterError` whose `reason` is `"world-editor-check-failed"`: it is never `"no-window"`. Its `readWindowTitles` option reads the titles instead of the system, for tests.

A save runs it on the folder it saves to, after comparing the bytes on disk and before its first write:

- `"modified"` refuses the save, with the reason `"modified-in-world-editor"`, when a file would be written; a save that writes nothing returns it;
- `"open"` writes, and the result carries it: the caller then reloads the map in the World Editor with [the World Editor reload](#the-world-editor-reload), which the Object data editor never runs;
- a failed check refuses the save always.

The check is on by default. `save(folder, { worldEditorCheck: false })` turns it off, for a folder no World Editor opens, such as the build's staged copy in `dist/`; the result's `worldEditor` is then `undefined`. `worldEditorCheck` also takes the check's options.

```ts
const { written, worldEditor } = editor.save();
if (worldEditor === "open" && written.length > 0) {
  reloadWorldEditor(mapFolder, worldEditorExecutable);
}
```

### The World Editor reload

A World Editor that holds the map folder without unsaved edits when a tool writes it still has the old objects loaded, and its next save puts them back. `reloadWorldEditor(mapFolder, executable)` reloads the map there: it starts the World Editor's executable with `-launch -loadfile <map folder>` and returns at once, never waiting for the editor. Run it only after [the World Editor check](#the-world-editor-check) said `"open"` and the save wrote a file: on `"modified"` it would ask the World Editor to drop the author's edits.

- The caller finds the executable, `World Editor.exe` beside the game's: the Template from the game discovery of `pnpm test:map`, the Studio from its own. Under WSL it is the WSL path of that file (`/mnt/c/...`).
- The map folder is passed by its Windows path: on Windows its resolved path, under WSL the one `wslpath -w` gives.
- The executable is started detached, with no standard input or output; an error it meets after starting is not reported.
- It throws an `Error`, starting nothing, when the map folder is not a folder, the executable is not a file, the system is neither Windows nor WSL, or `wslpath -w` fails.

Its options replace the system, for tests: `launch(executable, args)` starts the program, `system` is `"windows"` or `"wsl"`, and `windowsPath(folder)` converts a WSL path.

The World Editor of Patch 3.0.1 still loads a map folder given to `-loadfile`, with no dialog: the World Editor contract fixtures were made that way ([#640](https://github.com/phmilk/reforged-ts/issues/640), [#713](https://github.com/phmilk/reforged-ts/issues/713)). The game itself no longer does ([reforged-ts-template#99](https://github.com/phmilk/reforged-ts-template/issues/99)).

## Object definitions

A Map project declares objects in TypeScript as Object definitions (ADR 0015, [#700](https://github.com/phmilk/reforged-ts/issues/700)): one `define<Kind>` call per object, in files under `src/objects/`. The build merges them into the map it ships, and Object sync writes them into the map folder, recording the objects the code owns in the Object manifest. Object adoption hands objects made in the World Editor to the code, and Object release hands them back. They run in Node at build time, never in the map's Lua. The docs site's [Object definitions guide](https://github.com/phmilk/reforged-ts/blob/master/website/docs/guides/object-definitions.md) teaches them to a Map project's author; this section gives every detail. Their fields are typed and checked with the field table of [`reforged-builtins`](https://github.com/phmilk/reforged-ts/tree/master/packages/reforged-builtins#the-field-table-tool-authors) and its [declarations](https://github.com/phmilk/reforged-ts/tree/master/packages/reforged-builtins#the-field-declarations-object-definitions).

```ts
// src/objects/units.ts
import { defineUnit, localized } from "reforged-map/objects";

export const Captain = defineUnit({
  rawcode: "h002",
  base: FourCC("hfoo"),
  fields: {
    unam: localized("Captain", { deDE: "Hauptmann" }),
    uhpm: 640,
    ua1t: "pierce",
    uabi: [FourCC("AHbz")],
  },
});

// A change to a Built-in object: no base.
export const Knight = defineUnit({ rawcode: "hkni", fields: { uhpm: 900 } });
```

### The authoring entry

`reforged-map/objects` exports `defineUnit`, `defineItem`, `defineAbility`, `defineBuff`, `defineDestructable`, `defineDoodad` and `defineUpgrade`, the localized value's constructor `localized`, and their types. Each `define<Kind>` call returns an opaque `ObjectDefinition<kind>` and checks nothing when it runs: the build checks what it holds. A definition holds:

- `rawcode`, the object's Rawcode, four characters, always written out: a Rawcode never depends on the order the files run in.
- `base`, a Custom object's only: the Built-in object of its kind it derives from, `FourCC("hfoo")`, typed `Rawcode<kind>`. A definition without one changes the Built-in object of its Rawcode.
- `fields`, keyed by field id (`umvs`), the id the Object Editor's raw-data view and `git diff` show. Each is typed from the field declarations of `reforged-builtins` (`reforged-builtins/fields`, its README's "The field declarations"), so the hover of a field id gives its enUS label and completion lists a kind's fields. By the field's category, a value is a `number`; a `boolean`, written as 0 or 1; a `string` for a text, or a localized value for a localizable one; one of an enumeration's raw values; a `Rawcode<kind>` for a reference, given with `FourCC`; a readonly array of them for a list, written comma-separated; a readonly array of strings for a list of strings. A Rawcode and an enumeration of strings also take `""`, the empty value the game's data holds where an object has none (the second weapon sound `ucs2` of a unit with one attack). A field with levels (an ability's or an upgrade's per-level data, a doodad's variations) takes a record from level to value, `{ 1: 3, 3: 5 }`, so level 3 is set without restating level 1 or 2. The data pointer comes from the field table, never from the author. A value equal to the base's is kept as a modification: "set to the default" stays apart from "not set".
- `raw`, the raw escape: the fields the field table does not know, each with its field id, value type (`"int"`, `"real"`, `"unreal"` or `"string"`), level and data pointer (abilities, doodads and upgrades only, 0 when left out) and value.

`localized(text, translations)` makes a localized value, a default text and one text per locale of the game (`{ deDE: "Hauptmann" }`, typed by `Locale`). The build's merge and Object sync write the default text into `war3map.wts` and each translation into its locale's table, `_Locales/<locale>.w3mod/war3map.wts`, under the same `STRING n`, as the Object data editor writes [translations](#the-object-data-editor); a locale left out shows the default text, and so does a translation equal to it.

A definition names another object with `FourCC("A000")`, the Typings' global, typed by the generated overloads and those of `reforged-builtins` like any literal.

### Loading definitions

Every `.ts` file under the definitions folder (`src/objects/` under the Map project's root by default), a declarations file (`.d.ts`) excepted, is a definition file. A missing folder, or one without a definition file, means no definitions, with no warning, and needs neither `typescript` nor `reforged-builtins`. Every value a definition file exports that is a definition counts, once: a definition two files export (a re-export) counts once, in the file that made it.

Each file is transpiled to CommonJS with the Map project's own `typescript` (`transpileModule`, with no type check: the Map project's type check does that), resolved from the Map project's root as `reforged-builtins` is, and evaluated in Node, synchronously. Its transpiled text is kept by path and modification time, so a second load transpiles only the files that changed. A definition module gets the game's `FourCC`, which returns the integer the game's does (`FourCC("hfoo")` is `0x68666f6f`), and a `require` that:

- resolves a relative import to another `.ts` file of the definitions folder, with or without extension (`./tiers`, `./tiers.ts`, `./tiers.js`, a folder's `index.ts`), so that files share helpers;
- gives `reforged-map/objects` the loader's own module;
- resolves any other package, and Node's built-in modules, from the Map project's root;
- refuses an import of the generated folder (`src/generated/` by default) and of the kind entries of `reforged-builtins` (`reforged-builtins/units`), whose constants exist only in the map's Lua, and of a file outside the definitions folder, with an error naming the import and the importing file.

### Checking definitions

The **identity** of each definition is checked whenever definitions are loaded: its Rawcode is four printable ASCII characters; a Custom object's base is a Built-in object of its kind in the index of `reforged-builtins`, and its Rawcode is no Built-in object's, of any kind; a definition without a base names a Built-in object of its kind; and no Rawcode is defined twice in one kind. A Custom buff and a Custom destructable may share a Rawcode, as the World Editor makes both `B000`.

Its **fields** are checked before the build edits anything: each is a field of its kind in the field table; its value is of the field's category (an enumeration's value among its raw values, each item of a list of Rawcodes a Rawcode, no item of a list of strings holding a comma); an integer fits 32 bits; a field takes levels only when it has them, and always then; a localized value's locales are the game's and its translations strings; a field specific to some bases (an ability's data fields) is set only on a Custom object of one of those bases, or on one of them; and a raw field is one the field table does not know. Each problem names the definition's file, the Rawcode and the field, and every problem is reported at once. The Object data editor's own checks still apply.

Definitions need `reforged-builtins` with its field table of format 2, which gives each field's category, read from the Map project's installation at its newest Game version, as the Object data editor reads it.

### In the generated code and the lookup

`generateObjects` and the Rawcode lookup see the objects the build ships, one view of the map's objects: the map folder's, minus each object the Object manifest owns that no definition defines, plus every definition, which replaces the map folder's object at its Rawcode (a collision included: the build and Object sync report it). An object a definition defines gets the overload and the constant of one of the map folder, named from the name field the definition sets (its default text for a localized value, its lowest level for an upgrade's), else its base's name; their TSDoc says that it is defined in code and names the definition's file. A dropped owned object is gone, so a Rawcode the build will remove is unknown to the lint rule too. Each modified or Custom object of the lookup's results carries `definitionFile`, the definition's file, and keeps its `origin`, `modified` or `custom`.

Both load the definitions as the build does, but check only their identity: their fields are the build's and Object sync's to check. A definitions error makes `generateObjects` throw the `ObjectDefinitionsError`, and the lookup unavailable, its reason the error's message, which names the definition's file or the missing peer (`typescript`, `reforged-builtins`): never a view without the failing definitions. The lookup loads them again at each later check, so fixing the file, or installing the peer, brings it back. A new, an edited or a deleted definition file, or a change of the manifest, is seen at the next check, without a build.

**Cost.** A reload transpiles only the definition files whose modification time or size changed, and evaluates them all again. `pnpm --filter reforged-map map:measure:definitions` (`test/measure/definitions.ts`, after `pnpm build`) writes a Map project of 500 definition files, each one Custom unit, over the World Editor's fixture, opens a lookup, then edits one file and times the lookup that reloads, 15 times. Measured on 2026-10-23 (TypeScript 6.0.2, Node 24, an 8-thread WSL machine, [#707](https://github.com/phmilk/reforged-ts/issues/707)), over three runs: the first load, which transpiles every file, takes 1.5 to 1.7 s; a reload after editing one file 73 to 76 ms (median), 125 ms at most.

### The build's merge

`mergeObjectDefinitions(stagedFolder, projectRoot, { definitionsFolder, generatedFolder, manifest })` edits the build's staged copy of the map folder to hold every definition: each Custom object added, then its fields set, and each change to a Built-in object made, in the Editor form of [the Object data editor](#the-object-data-editor). The objects go in Object kind then Rawcode order, an object's name field first, then its fields by field id and level, then its raw fields, so that the same definitions write the same bytes. The copy is saved with [the World Editor check](#the-world-editor-check) off; the map folder is never written. It returns the objects defined (`objects`, each with its Object kind, Rawcode, base and file), the files of the copy written (`written`) and the warnings.

```ts
import { mergeObjectDefinitions } from "reforged-map";

const { objects, warnings } = mergeObjectDefinitions("dist/my-map.w3m", ".");
```

The merge reads [the Object manifest](#the-object-manifest) and never writes it. A definition replaces an object the code owns, which then holds exactly the definition's modifications, and an owned object no definition defines any more is removed from the copy (a Custom object entirely, a Built-in object's modifications), with no warning: the copy is not the author's. A definition at a Rawcode the map folder already defines (a Custom object) or changes (a Built-in object), which the code does not own, is a collision, and the merge throws, telling the author to adopt the object into the code (`pnpm objects:adopt <rawcode>`) or to give the definition another Rawcode. The build then fails before anything is written. A removed object a stale World Editor save brought back unchanged is still the code's: a definition takes it again without a collision.

An owned object changed in the map folder outside the code, its state there neither what the last sync wrote nor what the code writes (a field set or removed in the World Editor, the object deleted there), does not fail the build: the merge warns once per object, naming the fields, and the copy holds the code's version. [Object sync](#object-sync) refuses the same change and lists it.

### Object sync

`syncObjectDefinitions(mapFolder, projectRoot, { definitionsFolder, generatedFolder, manifest, force, worldEditorCheck, worldEditorExecutable })` is Object sync, what `pnpm objects:sync` runs: it writes the definitions into the map folder itself, in the Editor form, so that the World Editor and the Studio show them and a World Editor save keeps them byte for byte. In order:

1. It loads and fully checks the definitions, as the merge does, and reads the Object manifest. Any error stops it before anything is written.
2. It opens the map folder's Object data with [the Object data editor](#the-object-data-editor).
3. A definition at a Rawcode the map folder defines or changes in its kind, which the manifest does not own, is a collision: it throws, writing nothing. `force` never overrides a collision.
4. It compares each owned object with the manifest's snapshot of it. It is clean when equal, or when equal to what the code writes: a sync interrupted after writing the map folder and before writing the manifest recovers on the next run. Otherwise it was changed outside the code, in the World Editor, an owned object deleted from the map folder included, and the sync throws an `ObjectDefinitionsError` of the reason `"changed-outside-code"`, writing nothing, with one problem per object and field, the manifest's value and the map folder's:

   ```text
   Objects the code owns were changed in the map folder outside the code since the last Object sync: nothing was written. Copy each change into its definition, or sync with force (pnpm objects:sync --force) to overwrite them with the code's version.
   - The unit h002's uhpm is 420 in the Object manifest and 500 in the map folder.
   - The Custom unit h003 is in the Object manifest and was deleted from the map folder.
   ```

   With `force`, the sync overwrites them with the code's version, with a warning per object. `force` never overrides a collision, an invalid definition or unsaved edits in the World Editor.

5. For each Rawcode the manifest records as removed that the map folder holds again, no definition taking it: an object equal to the removed one is the removed object a stale World Editor save brought back (a World Editor that loaded the map before the sync that removed it, then saved), so it is removed again, with a warning (`removedAgain`); any other object is a new object of the map folder, left alone (`leftAlone`), and the manifest forgets the removed one.
6. It makes each defined object exactly its definition: a Custom object added, the fields the definition sets set, those it no longer sets removed, and a field that already holds its value left as it is. It removes each owned object no definition defines, a Custom object entirely, a Built-in object's modifications. A removed Custom object draws a warning: its placements on the terrain, if any, are dropped by the World Editor's next save and skipped by the game ([#482](https://github.com/phmilk/reforged-ts/issues/482)), and Object release (`pnpm objects:release`) hands an object back to the map folder with them instead. Localizable strings follow the Editor form of the Object data editor: a `STRING n` of `war3map.wts` that another owner references keeps its text, and the edited object gets a new one. A localized value's translations go into the locales' tables under its number, and a field holds its value only when its text and its text per locale are the definition's, so a second sync writes no byte.
7. It saves the map folder with [the World Editor check](#the-world-editor-check) on, `worldEditorCheck` giving its options: a World Editor showing ` *]` for the map refuses the save, with an `ObjectDataWriterError` of the reason `"modified-in-world-editor"` telling the author to save or discard the edits there first; a World Editor holding the map without unsaved edits (`"open"`) lets it write, then is reloaded with [the World Editor reload](#the-world-editor-reload) when `worldEditorExecutable` gives its executable, since its next save would put back what it loaded before the sync. Without the executable, or when the reload throws, the sync warns to reload the map there by hand, naming why. A sync that writes no file, or finds no World Editor holding the map, neither reloads nor warns.
8. It reads the written objects back and writes the manifest: the defined objects' snapshots, and the removed entries.

**The World Editor contract.** `test/fixtures/editor-sync.w3m` is a copy of `editor-objects.w3m` synced from definitions of every kind (a Custom object, a change to a Built-in object, a multi-level ability, localizable strings, a localized value with two translations, and a Custom object synced then removed), then loaded and saved twice with no edit by the 3.0.1 World Editor ([#713](https://github.com/phmilk/reforged-ts/issues/713), its provenance in `editor-sync.md`). A test syncs the same definitions and asserts that every Object data file, Skin file, `war3map.wts`, locale table and `war3map.imp` it writes is byte-identical to the editor's save, and that a sync over the editor's save writes no byte.

It returns a report: the objects defined (`objects`), those it added (`added`: a Custom object, or a Built-in object changed for the first time), changed (`changed`), removed (`removed`) and removed again (`removedAgain`), the new objects at a removed Rawcode it left alone (`leftAlone`), the files of the map folder written (`written`), whether the manifest was written (`manifestWritten`), what the World Editor showed (`worldEditor`), whether it reloaded the World Editor (`worldEditorReloaded`) and the warnings. A sync that changes nothing writes no byte, the manifest included.

```ts
import { syncObjectDefinitions } from "reforged-map";

const report = syncObjectDefinitions("my-map.w3m", ".", {
  worldEditorExecutable:
    "C:/Program Files (x86)/Warcraft III/_retail_/x86_64/World Editor.exe",
});
```

### The Object manifest

The Object manifest records which objects the code owns, and what the last Object sync wrote of each, and which objects a sync removed, with what they last held. It is `object-manifest.json` at the Map project's root by default, outside the map folder so that the World Editor never imports it into the map ([#475](https://github.com/phmilk/reforged-ts/issues/475)), and its path is the `manifest` option of every function. It is committed, so that every clone and CI knows what the code owns. Object sync writes it; the build's merge only reads it; **it is never edited by hand**.

```json
{
  "format": 1,
  "owned": [
    {
      "kind": "unit",
      "rawcode": "h002",
      "base": "hfoo",
      "modifications": [
        {
          "field": "uhpm",
          "type": "int",
          "value": 420
        },
        {
          "field": "unam",
          "type": "string",
          "value": "Sergeant"
        }
      ]
    }
  ],
  "removed": [
    {
      "kind": "unit",
      "rawcode": "h003",
      "base": "hfoo",
      "modifications": [
        {
          "field": "unam",
          "type": "string",
          "value": "Squire"
        }
      ]
    }
  ]
}
```

`format` is 1. `owned` holds one entry per owned object, its snapshot: its Object kind, its Rawcode, a Custom object's base, and its modifications as the Object Editor shows them, base and Skin files merged, each with its field id, its level and data pointer (abilities, doodads and upgrades only), its value type and its value. A `TRIGSTR_nnn` is its text, with `translations`, the text of each locale whose table translates it (`{ "deDE": "Feldwebel" }`, by locale), when one does, and a real the shortest decimal that reads back to its 32 bits, as [`textconv`](#object-data-in-git-diff) shows it (its bits in hex, as a string, when it is not finite). File placement, end markers and sets are the writer's, not the snapshot's.

`removed` holds one entry per object a sync removed because no definition defined it any more, in the same shape: its Object kind, its Rawcode, a Custom object's base and the snapshot of what it last held. It lets a later sync tell the removed object, brought back by a stale World Editor save, from a new object made at its Rawcode since. An entry goes when a definition takes its Rawcode again, or when a new object of the map folder holds it. A Rawcode is never both owned and removed.

It is written byte-stably: the owned entries, then the removed ones, each sorted by Object kind then Rawcode, the modifications by field id then level, two-space indentation, a final newline, and only when its bytes change. Two branches that sync different objects merge without a conflict; a conflict is resolved by keeping each side's entries, then `pnpm objects:sync`. A missing manifest owns no object, and a sync that neither owns nor removed anything does not create one. A manifest that does not parse, or is not one Object sync writes (another format, an unknown key, a missing list, an object owned or removed twice, or both owned and removed), is refused with the error `"manifest-unreadable"` naming the file, and nothing is written.

### Object adoption

`adoptObjects(mapFolder, projectRoot, rawcodes, { definitionsFolder, generatedFolder, manifest, force, worldEditorCheck })` is Object adoption, what `pnpm objects:adopt <rawcode...>` and `pnpm objects:adopt --all` run ([#484](https://github.com/phmilk/reforged-ts/issues/484)): it hands objects of the map folder to the code. Each one gets a definition file and an owned entry in [the Object manifest](#the-object-manifest), and the map folder is left byte for byte as it was, its placements included, so that the World Editor needs no reload.

```ts
import { adoptObjects } from "reforged-map";

const { files } = adoptObjects("my-map.w3m", ".", ["h000", "buff:B000"]);
const all = adoptObjects("my-map.w3m", ".", "all");
```

- **What it adopts.** A Custom object, or a Built-in object the map folder changes, that the code neither owns (the manifest has it) nor defines (a definition names its Rawcode in its kind). A Rawcode adopts the object of the map folder at it; one two kinds share, such as a Custom buff and a Custom destructable at `B000`, names its kind, `buff:B000`. `"all"` adopts every adoptable object, and nothing, writing no byte, when none is.
- **The file.** Each object is written to `src/objects/<kind>/<Name>_<rawcode>.ts` under the definitions folder (`src/objects/unit/Captain_h000.ts`), named by the rule of the generated constants from the name the map folder gives it, so that a renamed Built-in object is named by its new name (`Militia_hfoo.ts`), and it exports one `define<Kind>` call of that name. It holds the explicit Rawcode, a Custom object's base as `FourCC("hfoo")`, and every modification the map folder holds, a value equal to the base's included: the name field first, then the fields by field id, a levelled field as a record from level to value.

  ```ts
  import { defineUnit } from "reforged-map/objects";

  export const Captain_h000 = defineUnit({
    rawcode: "h000",
    base: FourCC("hfoo"),
    fields: {
      unam: "Captain",
      uabi: [FourCC("A000")],
    },
    raw: [
      // Xfoo is not in the field table of reforged-builtins (Game version 3.0.1): adopted through the raw escape.
      { field: "Xfoo", type: "int", value: 7 },
    ],
  });
  ```

- **The values.** A string is its text, a `TRIGSTR` resolved through `war3map.wts`; a flag is a boolean; a reference to an object is `FourCC("A000")`, whoever owns it, since adoption does not follow references (adopting `h000` does not adopt the `A000` it names); a list of references is an array of them. A field the field table of `reforged-builtins` does not know goes through the raw escape with its value type, a comment and a warning. A localizable text a locale's table in `_Locales/` translates is a localized value, `localized("Captain", { deDE: "Hauptmann" })`, holding the text of each locale whose table holds another text than the default under its number, and the file imports `localized`.
- **The manifest.** Each adopted object is recorded with its current snapshot, as Object sync records what it wrote, so that the next sync finds it clean and writes no byte, the manifest included. A removed entry at its Rawcode goes.
- **The files written** come back in `files`, absolute paths, valid TypeScript in a stable layout but not formatted: the caller formats them with the Map project's Prettier. The report also gives the objects adopted (`adopted`, each with its kind, Rawcode, base and file), whether the manifest was written (`manifestWritten`), what the World Editor showed (`worldEditor`) and the warnings.
- **The refusals.** It writes nothing when it refuses. An `ObjectDefinitionsError` of the reason `"not-adoptable"` lists each Rawcode of an object the code owns or defines, of a Built-in object the map folder does not change, of no object of the map folder, or of two kinds without its kind, and each field holding a value no definition can hold (a flag that is not 0 or 1, a value outside its enumeration, a field held twice); one of the reason `"target-exists"` names each file to write that exists, since adoption never overwrites code. A World Editor showing ` *]` for the map refuses with an `ObjectDataWriterError` of the reason `"modified-in-world-editor"`, as Object sync does, unless `force`, which adopts what the map folder holds on disk without the World Editor check.

### Object release

`releaseObjects(mapFolder, projectRoot, rawcodes, { definitionsFolder, generatedFolder, manifest, force, worldEditorCheck, worldEditorExecutable })` is Object release, what `pnpm objects:release <rawcode...>` runs ([#484](https://github.com/phmilk/reforged-ts/issues/484)): it hands objects the code owns back to the map folder. Each object is left in the map folder as the code last defined it, its placements on the terrain kept, and its entry in [the Object manifest](#the-object-manifest) and its definition file go. Releasing is the way to stop defining a Custom object in code without losing its placements, which deleting its definition and syncing drops.

```ts
import { releaseObjects } from "reforged-map";

const { released, deleted } = releaseObjects("my-map.w3m", ".", ["h000"]);
```

- **What it releases.** An object the code both owns (the manifest has it) and defines. A Rawcode two kinds share, such as a buff and a destructable at `B000`, names its kind, `buff:B000`. Its definition must be the only one its file exports, since release deletes that file and never code it does not own.
- **Object sync for those objects only.** The definitions are loaded and fully checked, and the manifest read, as Object sync does; then each released object is made exactly its definition and the map folder is saved with the World Editor check on. The other owned objects, the removed entries and the other definitions are left as they are, even when a sync would change them.
- **The manifest and the files.** The manifest then drops the released objects, with no removed entry, since the map folder owns them now, and their definition files are deleted, in that order: a release interrupted before the manifest write leaves objects the next sync finds clean. The next sync leaves the released objects alone, and adoption can hand them to the code again.
- **The report** gives the objects released (`released`, each with its kind, Rawcode, base and file), the definition files deleted (`deleted`, absolute paths), the files of the map folder written (`written`, empty when it held each object as the code defines it), whether the manifest was written (`manifestWritten`), what the World Editor showed (`worldEditor`), whether it reloaded the World Editor (`worldEditorReloaded`) and the warnings. A World Editor holding the map without unsaved edits when the map folder was written is reloaded with [the World Editor reload](#the-world-editor-reload), as Object sync does, given `worldEditorExecutable`; without it, or when the reload throws, the release warns to reload the map there by hand.
- **The refusals.** It writes and deletes nothing when it refuses. An `ObjectDefinitionsError` of the reason `"not-releasable"` lists each Rawcode of an object the code does not own, of one no definition defines, of one whose file exports other definitions, naming the file, of no object of the code, or of two kinds without its kind. A released object changed in the map folder outside the code refuses with the reason `"changed-outside-code"`, listing each field, as Object sync does, unless `force`, which overwrites it with the code's version, with a warning. A World Editor showing ` *]` for the map refuses with an `ObjectDataWriterError` of the reason `"modified-in-world-editor"`, even when the map folder would not be written, and `force` does not override it: save or discard the edits there first.

### The Object definitions error

`ObjectDefinitionsError` is the error of loading, checking, merging and syncing definitions, and of adopting and releasing objects; nothing is written when it is thrown. Its `reason` is one a caller switches on, its `problems` every problem found, each with its `file` (an absolute path), `rawcode`, `field` and `message`, and its `file`, `rawcode` and `field` are the first problem's. Its message lists every problem, one per line when there are several, under a first line that says what they share for `"changed-outside-code"`:

| `reason`                 | When                                                                                                                                                                                                    | What the author does                                                                                |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `"load-failed"`          | A definition file threw while loading (the message gives the exception's), could not be transpiled, or imported what a definition may not.                                                              | Fix the file, or name the object with `FourCC` instead of a generated or Built-in constant.         |
| `"invalid-definition"`   | A definition's Rawcode, base or fields are not ones the World Editor could make.                                                                                                                        | Fix the definition at the file, Rawcode and field named.                                            |
| `"defined-twice"`        | Two definitions name one Rawcode of one Object kind; the message names both files.                                                                                                                      | Keep one, or give the other another Rawcode.                                                        |
| `"collision"`            | A definition names a Rawcode the map folder defines or changes, which the code does not own.                                                                                                            | Adopt the object into the code (`pnpm objects:adopt`), or choose another Rawcode.                   |
| `"changed-outside-code"` | Object sync found an owned object changed in the map folder outside the code since the last sync; one problem per object and field.                                                                     | Copy each change into its definition, or sync with `force` to overwrite it with the code's version. |
| `"manifest-unreadable"`  | The Object manifest does not parse, or is not one Object sync writes; the message names the file.                                                                                                       | Restore it from git, or resolve its merge conflict, then sync again; never edit it by hand.         |
| `"peer-missing"`         | `typescript` or `reforged-builtins` cannot be read from the Map project, or `reforged-builtins` has a field table of format 1.                                                                          | Install the peer named, or a newer `reforged-builtins`.                                             |
| `"not-adoptable"`        | Object adoption was given an object the code owns or defines, an unchanged Built-in object, no object, a Rawcode two kinds share without its kind, or an object holding a value no definition can hold. | Adopt another object, name the kind (`buff:B000`), or fix the value in the World Editor.            |
| `"target-exists"`        | A definition file Object adoption would write exists.                                                                                                                                                   | Move or rename the file, then adopt again.                                                          |
| `"not-releasable"`       | Object release was given an object the code does not own or define, one whose file exports other definitions, no object, or a Rawcode two kinds share without its kind.                                 | Sync the object first, restore its definition, move it to a file of its own, or name the kind.      |

An edit or a save the Object data editor refuses throws its own `ObjectDataWriterError`, a sync refused for unsaved edits in the World Editor among them, and a missing staged copy or map folder a `MapFolderError`.

## Object data in `git diff`

The Object data files are binary, so `git diff` of a change made in the Object Editor says only "Binary files differ". The package's command, `reforged-map textconv <file>`, is a git `textconv` driver: it prints one Object data file as text, so that `git diff` of the map folder shows which object and which field a commit changed, with the old and the new value:

```diff
@@ -6,5 +6,5 @@ custom h000 from hfoo
   uhpm int = 800
   umpm int = 100
   udef int = 4
-  umvs int = 300
+  umvs int = 320
   usid int = 1200
```

**One line.** The text starts with a header line, the file's name, its format version and the count of each table (`war3map.w3u, format version 3: 1 builtin, 2 custom`). Then come the objects in file order, the Built-in objects first, one line each, `builtin hfoo` or `custom h000 from hfoo`. Under each object, indented, is one line per modification: the field id, the value type (`int`, `real`, `unreal`, `string`), the level and the data pointer for abilities, doodads and upgrades (`amcs int level 2 data 0 = 100`), then `=` and the value. Since an object's line starts with a letter and a modification's with spaces, git's hunk header names the object above the change. More detail:

- An integer is in decimal. A real is the shortest decimal that reads back to its 32 bits, or the bits in hex (`0x7fc00000`) when it is not a finite number.
- A string is JSON-quoted, with a character a reader cannot see escaped (`"\ufeffTip"`). Its bytes are in hex when they are not valid UTF-8.
- A `TRIGSTR_nnn` is shown as stored: git passes the driver one file, and `war3map.wts` is text, so its own diff shows the `STRING n` whose text changed.
- Some things show only where they differ from what the 3.0 World Editor writes: an object's set count and flags (`, 0 sets`, `, 1 set, flag 7`) when it does not hold one set of flag 0, and a Built-in object's Custom slot when it is not four NUL bytes. The same goes for a modification's end marker (`, end "\u0000\u0000\u0000\u0000"`) when it is not the object's own Rawcode, a Custom object's Custom Rawcode included.
- A Rawcode or field id that is not four printable characters is JSON-quoted (`"Crs\u0000"`).
- Bytes after the last table follow as a hex dump.

The Object kind and the Skin flag come from the end of the file's name (`war3mapSkin.w3a`), which git keeps on the temporary files it passes, and the text names the file as the game does. The same bytes give the same text on every machine. A file the driver cannot read (truncated, an unknown format version, more than one set) prints the reason, then a hex dump of the file, and exits 0, since a failing `textconv` aborts `git diff`. The command loads only the reader, never the generators or `reforged-builtins`, so a diff over the fourteen files stays quick. It exits 2 on a wrong use and 1 on a file it cannot open. `objectDataText(bytes, fileName)`, exported from the main entry, gives the same text, for a tool that shows a diff of Object data itself.

**The setup.** A Map project made from the Template has it already: its `.gitattributes` names the driver, and `pnpm install` sets the local git configuration. In another repository, add the attributes, here for map folders anywhere in the repository:

```gitattributes
**/*.w3m/** -text
**/*.w3m/war3map.w3[utahbdq] diff=reforged-object-data
**/*.w3m/war3mapSkin.w3[utahbdq] diff=reforged-object-data
```

`-text` keeps every byte of the map folder as the World Editor wrote it, whatever `core.autocrlf` says. Then set the driver in each clone. git runs it from the work tree's top, so the path below assumes `reforged-map` is installed there; adjust it when the Map project is a subfolder of the repository:

```sh
git config diff.reforged-object-data.textconv "node node_modules/reforged-map/dist/cli.js textconv"
git config diff.reforged-object-data.cachetextconv true
```

The command runs the clone's own installation of `reforged-map` with Node, without a package manager's start-up for each file. `cachetextconv` keeps each blob's text in git's notes, so a file is converted once. The configuration is local to the clone: git never takes a command from a repository's files.

## Errors and warnings

A missing map folder throws a `MapFolderError` whose message says what to do in the World Editor, and so does a map folder without `war3map.lua` (a map saved with JASS as its script language) for `generateEditorGlobals`. Object definitions that cannot be loaded, or whose identity is invalid, make `generateObjects` throw the [`ObjectDefinitionsError`](#the-object-definitions-error). Everything else is a warning, and the build goes on. Of the Editor globals:

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

`test/fixtures/blank-map.w3m` holds the `war3map.lua` and `war3map.wtg` of the Template's blank map, as the 3.0 World Editor saved them (the Template's `tests/pipeline/fixtures/blank-map.w3m`). `test/fixtures/wc3libs` holds fixtures of [wc3libs](https://github.com/inwc3/wc3libs), taken unmodified from its `src/test/resources/wc3data` at commit `0542c4140012dfb872ac01513ff68f5cbef98658`, under the Apache License 2.0 (its `LICENSE` and `NOTICE`): four `war3map.wtg` files, three in the 1.31+ format and one older, a `war3map.wts` (`war3map_v3_filled.wts`), and fourteen Object data files: an abilities file of format version 2 and four of version 3 (`war3map_format3.w3a`, the large `war3map_large_v3.w3a`, `threeLetterId.w3a` with a three-character field id, and the Skin file `war3mapSkin.w3a`), a base and Skin pair of units files of version 3, a third units file of version 3 (`war3mapReforged.w3u`), and an empty file of version 2 for each of the six other Object kinds. The tests copy a fixture into a temporary map folder under the name the game gives it; the Object data editor's tests round-trip each one, and the two World Editor map folders below, byte for byte, and the `textconv` driver's tests print each one as text, then run `git diff` through the driver in a temporary git repository. `test/fixtures/editor-variables.w3m` is the Template's map folder saved by the World Editor of Patch 3.0.0.24268, holding one GUI variable of each Variable Editor type that names an Object kind, plus `integer` and `ordercode`, each as a scalar and as an array, with and without an initial value. Its variables were seeded into `war3map.wtg` by a script, then loaded, checked in the Variable Editor and saved by the World Editor, which wrote both `war3map.wtg` and `war3map.lua`: `test/fixtures/editor-variables.md` gives the Build, the editor and the steps. `test/fixtures/editor-objects.w3m` is the Template's map folder saved by the same World Editor, holding a Custom object of each of the seven Object kinds, a modified Built-in object of each kind, three of them renamed, a Custom object with a non-ASCII name, a three-level ability, and a Custom buff and a Custom destructable both at `B000`. Its objects were seeded into the Object data files by a script, then loaded and saved by the World Editor, which moved their names into the Skin files and `war3map.wts`: `test/fixtures/editor-objects.md` gives the Build, the editor, the steps and what the editor wrote. `test/fixtures/editor-locales.w3m` is a new map saved by the 3.0.1.24371 World Editor with a Custom unit whose name and tooltip have hand-written ptBR and deDE tables under `_Locales/`, then saved again with no edit, which kept the tables and listed them in `war3map.imp`: `test/fixtures/editor-locales.md` gives its provenance, and the tests adopt it and sync the translations against it. `test/fixtures/editor-contract.w3m` and `test/fixtures/editor-sync.w3m` are the World Editor contracts of the Object data editor and of Object sync: `editor-objects.w3m` edited by a script of edits (`test/support/editor-contract.ts`), or synced from Object definitions of every kind (`test/support/editor-sync.ts`), then loaded and saved by the 3.0.1 World Editor, whose save the tests' output matches byte for byte; `editor-contract.md` and `editor-sync.md` give their provenance. Git stores these folders byte for byte. The tests build other `war3map.wtg` files in a temporary folder (`test/support/wtg.ts`), and Object data files and `war3map.wts` in format versions 1, 2 and 3 (`test/support/object-data.ts`, an encoder independent of the package's writer, so that no test makes its input with the code under test), and type-check the generated files in a Map project against the workspace's `reforged-types` and `reforged-ts`, and `reforged-builtins` for the modified Built-in objects. The tests of the TypeScript plugin pack the package with `pnpm pack`, unpack it where tsserver's `--pluginProbeLocations` finds it, and drive the workspace's tsserver over Map projects they build in a temporary folder (`test/support/tsserver.ts`); `test/fixtures/map-folder-discovery.json` is the table of cases of the map folder's discovery, shared with the lint rule's tests. Each `test/fixtures/*map-project` folder holds the generated files the tests expect and the code that uses them, its negative fixtures asserted by error code and line. Run `pnpm build` before running the package's tests on their own.

## License

MIT. The wc3libs fixtures under `test/fixtures/wc3libs`, which the package does not publish, are Apache-2.0.
