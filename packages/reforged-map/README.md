# reforged-map

Reads a Warcraft III Reforged map folder at build time and returns the code a [reforged-ts](https://github.com/phmilk/reforged-ts) Map project generates from it: the declarations of its Editor globals, and the `FourCC` overloads and constants of its objects. For a tool that reads the map, such as a lint rule or a hover, it gives a lookup from a Rawcode to its object, and for a tool that edits its Object data, an Object data editor that saves it byte for byte. Its command, `reforged-map textconv`, lets `git diff` show Object data as text. Its TypeScript plugin, `reforged-map/typescript-plugin`, shows that object on the hover of a Rawcode literal and goes to its constant. Node only: nothing of it reaches the map's Lua.

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

The package reads and writes the map folder's Object data, and only reads the rest of the map folder (ADR 0015): only [the Object data editor](#the-object-data-editor) writes, and only the Object data files and `war3map.wts`. The generated files are git-ignored and read-only in a Map project: a global is added or renamed in the World Editor, never in them.

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

- **Hover**, after TypeScript's own quick info when there is one, in the words of the generated TSDoc: the object's name, Rawcode, Object kind and origin, a Custom object's base, a modified Built-in object's two names, its race, a Built-in object's Game data sets, and its constant with its module. A Rawcode two kinds share (`B000`) shows both objects. A Built-in object outside the map's Game data set, an unknown Rawcode (with up to three Rawcodes one edit away) and a malformed literal show the lint rule's sentence. A cast number shows the Rawcode, or the bytes, it decodes to.
- **Go to definition**, through `definition` and `definitionAndBoundSpan`: the declaration of each object's constant, `Units.Footman_hfoo` in `reforged-builtins` or `CustomUnits.Captain_h000` in the generated module, then TypeScript's own definitions. An object whose constant cannot be found goes to its `FourCC` overload; an unknown or malformed literal gets TypeScript's own result.

**The map folder.** `mapFolder` in the plugin's entry names it, an absolute path or one relative to the project root: the nearest folder holding a `package.json` above the tsconfig tsserver opened, so a tsconfig in a subfolder that extends the entry reads the same folder. Without it, the map folder is the one folder directly under `<project root>/maps/` whose name ends in `.w3x` or `.w3m`, ignoring case, the lint rule's rule. None or several turn Rawcode details off. `reforged-builtins` is resolved from the project root. The plugin never reads `reforged.config.ts`. A changed option takes effect when tsserver reloads the project, as it does when the tsconfig is saved.

**When the lookup cannot load** (the map folder missing or unreadable, no map folder or several under `maps/`), the hover of a Rawcode literal is one line, "Rawcode details are unavailable: <reason>", go to definition is TypeScript's own, and the hover resumes on its own once the cause is fixed. Without `reforged-builtins` in the project root, the plugin logs it once and stays off until tsserver restarts. Any error of the plugin falls back to TypeScript's own result, so it never breaks a request.

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

**The Editor form.** An edit is written as the 3.0 World Editor saves it, so that its next save leaves it where it is. A field goes into the file the World Editor keeps it in, the base or the Skin file of its kind, as the field table of `reforged-builtins` says (read from the Map project's installation, its newest Game version, as the index). When the object holds the field there, its value is replaced in place: its position, value type, level, data pointer and end marker are kept. Otherwise it is appended to the object's modifications, with the field table's value type and the end marker the editor writes: the object's own Rawcode, a Custom object's included. ([#460](https://github.com/phmilk/reforged-ts/issues/460), section 4, gives four NUL bytes for a Custom object; the 3.0 World Editor's own save in `test/fixtures/editor-objects.w3m` writes its Custom Rawcode, and the editor's behaviour wins.) The field held in the other file (a foreign layout) is removed from there, and the object's other modifications stay as read. The object is added to both files of its kind when either lacks it, with one set of flag 0 (in format versions 1 and 2, without one), and a file the kind did not have is created in format version 3. A value equal to its base's is kept as a modification. An integer must fit in 32 bits, a real is stored as its nearest 32-bit value, and a string, written as literal UTF-8, must hold no NUL byte. A field the field table does not know is set only with its value type given, `{ type }` (Object adoption's raw escape, [#484](https://github.com/phmilk/reforged-ts/issues/484)), in the base file unless only the Skin file holds it. An added Custom object is appended to the Custom table of both files of its kind, with one set of flag 0 and no modification, so that a file that holds none of its fields still lists it, as the World Editor does; its fields then go each into its own file. Its Rawcode must be one no object of its kind holds and no Built-in object of `reforged-builtins`' index has, of any kind, but a Custom object of another kind may hold it: the World Editor makes a Custom buff and a Custom destructable `B000`. Its base must be a Built-in object of its kind in the index. A removed object loses every entry in both files, and a string it referenced goes under the rule of an unreferenced string below; its placements on the terrain stay, which are the caller's ([#482](https://github.com/phmilk/reforged-ts/issues/482)). Without `reforged-builtins`, opening, listing and a save with no edit still work, and every edit is refused.

**Localizable strings.** A localizable string (a name, a tooltip: a text field of the field table, not a path such as `umdl`) is written as the World Editor writes it, a `TRIGSTR_nnn` reference, zero-padded to three digits, and its `STRING n` block in `war3map.wts`. A string held as literal text, or in the other file, is converted and moved when its field is set ([#475](https://github.com/phmilk/reforged-ts/issues/475)).

- **A new string** is numbered one above the highest of every `STRING n` of `war3map.wts` and every `TRIGSTR` the Object data or another file of the map folder references, an orphan and a reference to a missing string included, so that the World Editor and the editor never hand out one number twice: a gap is never filled.
- **A changed string** goes into its own `STRING n` when no other modification of the Object data references its number and no other file of the map folder (`war3map.lua`, `war3map.w3i`, `war3map.wtg`, any file at its top level) holds `TRIGSTR_n`, in any zero padding; into a new one otherwise, so that a rename never changes another object's text ([#484](https://github.com/phmilk/reforged-ts/issues/484)).
- **A string an edit leaves unreferenced**, by a set, a `removeField` or a `removeObject`, is removed under the same condition, and kept otherwise.
- **A new block** is appended, its number being the highest, with the file's own line ends and byte order mark, a blank line after it, and the World Editor's comment line from the field table's labels, `// Units: h000 (Captain), Name (Name)`: the Object kind's label, the Rawcode, the object's name (its `Name` field after the edit, else its base's or the game's; none for a buff), the field's metadata name and its enUS label. A levelled field's comment names no level, a guess the World Editor contract fixture ([#640](https://github.com/phmilk/reforged-ts/issues/640)) settles. A block rewritten in place gets its comment line again; the rest of `war3map.wts`, every block no edit changes included, stays byte for byte. A map folder without `war3map.wts` gets one, with a byte order mark and CRLF.
- **A localizable value** is a string without a NUL byte or a CR, a line break being an LF alone, and without a line that is `}` alone, which would end its block.

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
- `"open"` writes, and the result carries it: the caller then reloads the map in the World Editor with `-launch -loadfile`, which the Object data editor never sends;
- a failed check refuses the save always.

The check is on by default. `save(folder, { worldEditorCheck: false })` turns it off, for a folder no World Editor opens, such as the build's staged copy in `dist/`; the result's `worldEditor` is then `undefined`. `worldEditorCheck` also takes the check's options.

```ts
const { worldEditor } = editor.save();
if (worldEditor === "open") {
  // Reload the map in the World Editor that holds it: `-launch -loadfile`.
}
```

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

`test/fixtures/blank-map.w3m` holds the `war3map.lua` and `war3map.wtg` of the Template's blank map, as the 3.0 World Editor saved them (the Template's `tests/pipeline/fixtures/blank-map.w3m`). `test/fixtures/wc3libs` holds fixtures of [wc3libs](https://github.com/inwc3/wc3libs), taken unmodified from its `src/test/resources/wc3data` at commit `0542c4140012dfb872ac01513ff68f5cbef98658`, under the Apache License 2.0 (its `LICENSE` and `NOTICE`): four `war3map.wtg` files, three in the 1.31+ format and one older, a `war3map.wts` (`war3map_v3_filled.wts`), and fourteen Object data files: an abilities file of format version 2 and four of version 3 (`war3map_format3.w3a`, the large `war3map_large_v3.w3a`, `threeLetterId.w3a` with a three-character field id, and the Skin file `war3mapSkin.w3a`), a base and Skin pair of units files of version 3, a third units file of version 3 (`war3mapReforged.w3u`), and an empty file of version 2 for each of the six other Object kinds. The tests copy a fixture into a temporary map folder under the name the game gives it; the Object data editor's tests round-trip each one, and the two World Editor map folders below, byte for byte, and the `textconv` driver's tests print each one as text, then run `git diff` through the driver in a temporary git repository. `test/fixtures/editor-variables.w3m` is the Template's map folder saved by the World Editor of Patch 3.0.0.24268, holding one GUI variable of each Variable Editor type that names an Object kind, plus `integer` and `ordercode`, each as a scalar and as an array, with and without an initial value. Its variables were seeded into `war3map.wtg` by a script, then loaded, checked in the Variable Editor and saved by the World Editor, which wrote both `war3map.wtg` and `war3map.lua`: `test/fixtures/editor-variables.md` gives the Build, the editor and the steps. `test/fixtures/editor-objects.w3m` is the Template's map folder saved by the same World Editor, holding a Custom object of each of the seven Object kinds, a modified Built-in object of each kind, three of them renamed, a Custom object with a non-ASCII name, a three-level ability, and a Custom buff and a Custom destructable both at `B000`. Its objects were seeded into the Object data files by a script, then loaded and saved by the World Editor, which moved their names into the Skin files and `war3map.wts`: `test/fixtures/editor-objects.md` gives the Build, the editor, the steps and what the editor wrote. Git stores these folders byte for byte. The tests build other `war3map.wtg` files in a temporary folder (`test/support/wtg.ts`), and Object data files and `war3map.wts` in format versions 1, 2 and 3 (`test/support/object-data.ts`, an encoder independent of the package's writer, so that no test makes its input with the code under test), and type-check the generated files in a Map project against the workspace's `reforged-types` and `reforged-ts`, and `reforged-builtins` for the modified Built-in objects. The tests of the TypeScript plugin pack the package with `pnpm pack`, unpack it where tsserver's `--pluginProbeLocations` finds it, and drive the workspace's tsserver over Map projects they build in a temporary folder (`test/support/tsserver.ts`); `test/fixtures/map-folder-discovery.json` is the table of cases of the map folder's discovery, shared with the lint rule's tests. Each `test/fixtures/*map-project` folder holds the generated files the tests expect and the code that uses them, its negative fixtures asserted by error code and line. Run `pnpm build` before running the package's tests on their own.

## License

MIT. The wc3libs fixtures under `test/fixtures/wc3libs`, which the package does not publish, are Apache-2.0.
