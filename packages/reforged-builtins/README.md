# reforged-builtins

The Built-in objects of each Warcraft III Reforged Patch, reduced to the identifiers code needs to name them: Rawcode, Object kind, race, enUS name and the Game data sets that hold the object ([ADR 0013](https://github.com/phmilk/reforged-ts/blob/master/docs/adr/0013-built-in-objects-ship-as-derived-identifiers-in-their-own-package.md)). It never holds tooltip text, numbers or icons.

It holds the Built-in objects of Patch 3.0.1.24370, in the seven Object kinds and the six Game data sets: their JSON index, their `FourCC` overloads and their constants; and the field table of their Object data, for tools that write it, with its declarations, which type Object definitions (`reforged-builtins/fields`).

**For AI agents:** the documentation of this version as Markdown: [llms.txt](https://phmilk.github.io/reforged-ts/docs/next/llms.txt) links each page, and [llms-full.txt](https://phmilk.github.io/reforged-ts/docs/next/llms-full.txt) holds them all in one file.

**Build phase.** Until 1.0.0, every version is an alpha (`1.0.0-alpha.N`) published under the `next` dist-tag. Install with `@next`: `pnpm add -D reforged-builtins@next`. npm gives `latest` to the first alpha, so `latest` stays on `1.0.0-alpha.0` until 1.0.0 is published, and moves to 1.0.0 then.

**Supported Patch: 3.0.1.24370.** The `reforged.patch` field of `package.json` carries the same Build, which a test holds to `reforged-types`'.

## In a Map project

Add the overloads' entry of your Game version to `types`, next to the Typings':

```json
{
  "compilerOptions": {
    "types": ["reforged-types/3.0.1", "reforged-builtins/3.0.1"]
  }
}
```

`FourCC("hfoo")` is then a `Rawcode<"unit">`, with the Footman's name on hover, completion of the Built-in Rawcodes inside `FourCC("")`, and no change to the emitted Lua. A literal the package does not know, such as a Custom object's `FourCC("h000")`, stays an `UnknownRawcode` through the Typings' `string` overload and compiles. The order of `types` does not matter.

The constants of a kind come from its entry point, which resolves to the newest Game version the package holds:

```ts
import { Units } from "reforged-builtins/units";

Unit.create(owner, Units.Footman_hfoo, 0, 0);
```

Each constant of `Units` is a `Rawcode<"unit">`. typescript-to-lua resolves the entry point through the package's `exports` (its `tstl` condition) to a Lua module of integers, each the value `FourCC` returns for the Rawcode, so `Units.Footman_hfoo === FourCC("hfoo")` in game. Every kind has its entry point and constants object: `reforged-builtins/units` (`Units`), `/items` (`Items`), `/abilities` (`Abilities`), `/buffs` (`Buffs`), `/destructables` (`Destructables`), `/doodads` (`Doodads`) and `/upgrades` (`Upgrades`), each constant a `Rawcode` of its kind. A bundle carries only the kinds it imports, and no entry point holds every kind.

The overloads are optional: a Map project that keeps `types` as it is keeps every `FourCC` literal an `UnknownRawcode`, and the constants still import. Nothing asks a literal to become a constant: both are the same integer in Lua.

## Constant names

A constant is named from the object's enUS name, by these rules in order:

1. strip colour codes, then fold accents to their base letter (NFKD, combining marks dropped);
2. drop apostrophes (`'` and `’`);
3. split into words on every character that is not an ASCII letter or digit;
4. upper-case the first letter of each word, the rest as written;
5. join; prefix `_` to a result starting with a digit; `Unnamed` when there is no name;
6. append `_` and the Rawcode exactly as cased.

So the Footman is `Units.Footman_hfoo`, the Paladin `Units.Paladin_Hpal`, Claws of Attack +15 `Items.ClawsOfAttack15_ratf`, Inner Fire's buff `Buffs.InnerFire_Binf` and Iron Forged Swords `Upgrades.IronForgedSwords_Rhme`. The Rawcode suffix keeps two objects of one name apart (`Units.Footman_hfoo`, `Units.Footman_sfoo`) and a constant unique.

## Game data sets

A map's objects follow two of its options in the World Editor: its Game Data Set (Default, Custom or Melee) and its Game Data Version (Reign of Chaos, The Frozen Throne or Forsaken Kingdom, which a new map gets). The package has a Game data set per pair the game tells apart, `custom-fk` to `melee-roc`, as Probe runs settled them ([#575](https://github.com/phmilk/reforged-ts/issues/575)): Default reads Custom, or Melee on a melee map, so it has no set of its own, and both sets of Forsaken Kingdom hold every object. The constants cover their union. An object's TSDoc says, by Game Data Version, which sets hold it when not every one does, and says nothing otherwise: "Forsaken Kingdom only." for the Scarlet Crusade's Footman, `Units.Footman_sfoo`; "Not in Reign of Chaos." for an object of The Frozen Throne; "Melee only in The Frozen Throne." for a version that holds it in one of its two sets. The index lists the sets themselves. A constant of an object the map's sets do not hold still compiles, and the Native it is passed to finds no such object in game: check its hover before using it in a map of The Frozen Throne or Reign of Chaos.

## What it never holds

- **Custom objects and a map's changes to Built-in ones.** A Custom object's Rawcode (`h000`) is not in the package and stays an `UnknownRawcode`; a Built-in object the map renamed keeps its game name here. A map's own objects come from its map folder and from its Object definitions, through [`reforged-map`](https://github.com/phmilk/reforged-ts/tree/master/packages/reforged-map), which reads this package's index and field table for them.
- **Tooltip text, numbers and icons.** The package holds identifiers only: Rawcode, kind, race, enUS name and Game data sets, and in the field table and its declarations the fields' identifiers, their metadata types, the raw values of the enumerations (`normal`, `pierce`) and the enUS labels the World Editor writes into `war3map.wts`. No field's value is in it: no Built-in object's stats, tooltip or icon. Tooltips and icons are the hover tool's.
- **Other locales.** Names and constants are enUS.

## Finding a Rawcode (agents and tools)

To find the Rawcode of an object by its name, search the index of the newest Game version, one object per line: `grep -i '"name":"footman"' packages/reforged-builtins/3.0.1/index.json` (or the installed `node_modules/reforged-builtins/3.0.1/index.json`) gives `"hfoo": {"kind":"unit",…,"constant":"Footman_hfoo"}`. The kind names the entry point to import, one kind at a time: `unit` is `reforged-builtins/units`'s `Units`, `ability` `reforged-builtins/abilities`'s `Abilities`, and so on. Import only the kinds the file uses: each is a module of its own in the bundle.

## Check-time cost

The overloads cost type-check time per `FourCC` call, and nothing at run time. `pnpm --filter reforged-builtins builtins:measure` type-checks the fixture Map project (`test/fixtures/map-project`: its compiler options, the Typings and the language extensions) with a file of literal `FourCC` calls, with and without the 4,651 overloads of 3.0.0, the median of 7 runs. Measured on 2026-10-09 (TypeScript 6, Node 24, an 8-thread WSL machine):

| `FourCC` calls | Without the overloads | With them | Cost                             |
| -------------- | --------------------- | --------- | -------------------------------- |
| 100            | 1,242 ms              | 1,927 ms  | +685 ms                          |
| 1,000          | 1,250 ms              | 8,192 ms  | +6,942 ms, about 6.9 ms per call |

The cost per call is the 1,000-call case's: at 100 calls, the parse of the overloads weighs as much as the calls. Over three runs of the script it was 6.6 to 7.0 ms per call, more than three times the 2 ms per call that [#462](https://github.com/phmilk/reforged-ts/issues/462) estimated.

The cost grows with the number of literal calls, not with the size of the map. A constant costs no overload resolution: `Units.Footman_hfoo` is a property read.

## Versioning

The package follows semver on its constants and overloads. Adding objects is a minor. Removing an object, renaming a constant (its enUS name changed) or changing an object's kind breaks code that names it, so it is a major, with its migration page and its rename entries in `migration/renames.json`. A new Game version adds its folder next to the previous one, and the kind entry points move to it.

## The JSON index (tool authors)

`3.0.0/index.json`, one per Game version, is the model the package's other artefacts come from:

```json
{
  "format": 1,
  "build": "3.0.0.24268",
  "gameVersion": "3.0.0",
  "gameDataSets": [
    { "id": "custom-fk", "label": "Custom (Forsaken Kingdom)" },
    { "id": "melee-fk", "label": "Melee (Forsaken Kingdom)" },
    { "id": "custom-tft", "label": "Custom (The Frozen Throne)" },
    { "id": "melee-tft", "label": "Melee (The Frozen Throne)" },
    { "id": "custom-roc", "label": "Custom (Reign of Chaos)" },
    { "id": "melee-roc", "label": "Melee (Reign of Chaos)" }
  ],
  "objects": {
    "hfoo": {
      "kind": "unit",
      "name": "Footman",
      "race": "human",
      "sets": [
        "custom-fk",
        "melee-fk",
        "custom-tft",
        "melee-tft",
        "custom-roc",
        "melee-roc"
      ],
      "constant": "Footman_hfoo"
    }
  }
}
```

- `format` is the shape's version, 1 today: a tool reads an index whose `format` it knows, and a new `format` comes only with an incompatible shape, in a major of the package.
- `objects` is keyed by Rawcode, in code-point order. `name` is the enUS name, colour codes and line breaks removed; it is absent when the game gives none. `commentName`, for a buff or an upgrade, is the name the World Editor's comments in `war3map.wts` give the object where it is not `name`, as the editor writes it ([#654](https://github.com/phmilk/reforged-ts/issues/654)): a buff's editor name, empty when it has none (`Binf`, whose `name` is its tooltip's title), and an upgrade's names of every level as the game lists them (`Black Gunpowder,Refined Gunpowder,Imbued Gunpowder` for `Rhra`). A writer of `war3map.wts` names an object by it, else by `name`. `race` is lower-case, as the game writes it, and absent for a kind without one. `sets` lists the ids of the Game data sets that hold the object; the constants cover their union, and an object's TSDoc names the sets that hold it and those that do not, unless every one does. `constant` is its constant's name: the enUS name in PascalCase, then `_` and the Rawcode (`Unnamed_<rawcode>` without a name).

The file is written one object per line, byte-stably: a regeneration from unchanged inputs writes the same bytes.

## The field table (tool authors)

`3.0.1/fields.json`, one per Game version next to its index, holds what a writer of Object data needs to write an edit as the 3.0 World Editor saves it, with no game file at run time: `reforged-map`'s writer reads it ([#632](https://github.com/phmilk/reforged-ts/issues/632)). Format 2 also gives each field its metadata type and its category, and each enumeration its raw values, from which the [field declarations](#the-field-declarations-object-definitions) type Object definitions ([#702](https://github.com/phmilk/reforged-ts/issues/702)). Abridged, it reads:

```json
{
  "format": 2,
  "build": "3.0.1.24370",
  "gameVersion": "3.0.1",
  "kinds": {
    "unit": "Units",
    "buff": "Buffs/Effects"
  },
  "enumerations": {
    "attackType": [
      "unknown",
      "normal",
      "pierce",
      "siege",
      "spells",
      "chaos",
      "magic",
      "hero"
    ],
    "teamColor": [-1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
  },
  "fields": {
    "unit": {
      "ua1t": {
        "type": "string",
        "metaType": "attackType",
        "category": "enumeration",
        "file": "base",
        "localizable": false,
        "levels": false,
        "field": "atkType1",
        "label": "Attack 1 - Attack Type"
      },
      "uabi": {
        "type": "string",
        "metaType": "abilityList",
        "category": "rawcodeList",
        "of": "ability",
        "file": "base",
        "localizable": false,
        "levels": false,
        "field": "abilList",
        "label": "Normal"
      },
      "unam": {
        "type": "string",
        "metaType": "string",
        "category": "text",
        "file": "skin",
        "localizable": true,
        "levels": false,
        "field": "Name",
        "label": "Name"
      }
    },
    "ability": {
      "Hbz1": {
        "type": "int",
        "metaType": "int",
        "category": "number",
        "file": "base",
        "localizable": false,
        "levels": true,
        "data": 1,
        "field": "Data",
        "label": "Number of Waves",
        "specific": ["AHbz", "ACbz", "ANrf", "ACrf"]
      }
    }
  }
}
```

- `format` is the shape's version. Format 2 adds `enumerations` and each field's `metaType`, `category` and `of` to format 1, which has neither; every fact of format 1 is in format 2 as it was, so a writer that reads format 1's facts reads both. **3.0.1 holds format 2; 3.0.0 keeps format 1**, generated before format 2 from an install no longer at hand: a Game version's table moves to format 2 when `pnpm builtins:generate` runs on an install of it. Format 2 came in a minor during the alphas; from 1.0.0, a new `format` comes only with an incompatible shape, in a major of the package, as the index's.
- `kinds` gives each of the seven Object kinds, in the order above (`unit`, `item`, `ability`, `buff`, `destructable`, `doodad`, `upgrade`), its label in the editor's comments in `war3map.wts`: `// Units: h000 (Captain), Name (Name)`. They are the enUS labels of the Object Editor's tabs (`WESTRING_OBJTAB_UNITS`).
- `fields` holds each kind's fields by id, in code-point order. Units and items share `Units/UnitMetaData.slk`: a field is a unit's when its row's `useUnit`, `useHero` or `useBuilding` is 1, an item's when its `useItem` is, and both kinds list a field both use. Each field gives:
  - `type`, the value type a modification stores: `int` for numbers, booleans and the editor's enumerations of integers (`teamColor`, the `*Flags`), `real`, `unreal`, and `string` for the rest (texts, paths, codes and lists).
  - `file`, `base` or `skin` (`war3mapSkin.w3u`): `skin` when the metadata's `netsafe` is not 0, as for a name or a model, `base` otherwise, and when the metadata has no `netsafe` (every doodad field, three ability fields).
  - `localizable`: whether the editor writes a value as a `TRIGSTR_nnn` into `war3map.wts`: a text (`string`, `stringList` or `char` in the metadata) that the metadata marks as externalized (`stringExt` 1). A name and a tooltip are, a path such as `umdl` is not.
  - `levels`: whether it holds a value per level, or per variation for a doodad (`repeat` above 0). `data`, for the abilities, is the data column a modification's data pointer names (`data` in the metadata, 0 for none).
  - `field` and `label`, the two parts of the editor's comment of a string: the metadata's `field` name (`Bufftip`) and the field's enUS label (`Tooltip`), its `displayName` resolved through the editor strings.
  - `specific`, when the metadata's `useSpecific` names them: the base Rawcodes the field is specific to, each as the metadata writes it (`Blo2` of 3.0.0 names `ACbl.Afzy`, a typo of the game's that a warning reports).
  - In format 2, `metaType`, the metadata's `type` (`attackType`, `abilityList`, `int`), and `category`, what the field holds for Object definitions, which the generator maps from the metadata type through a table of its own (`METADATA_CATEGORIES` in `src/fields.ts`):
    - `number`: `int`, `real` and `unreal`, and the editor's flags of bits (`channelFlags`, `morphFlags`, `pickFlags`, `silenceFlags`, `stackFlags`, `interactionFlags`), whose value is the sum of the bits;
    - `boolean`: `bool`, written as 0 or 1;
    - `text`: texts, paths and other strings (`string`, `char`, `model`, `icon`, `orderString`, `soundLabel`);
    - `enumeration`: one raw value of the enumeration named by the metadata type (`attackType`, `armorType`, `teamColor`, `deathType`);
    - `rawcode`: the Rawcode of an object of the kind `of` names (`unitCode` is a unit's, `abilCode` an ability's, `upgradeCode` an upgrade's);
    - `rawcodeList`: a list of Rawcodes of the kind `of` names, written comma-separated (`abilityList`, `heroAbilityList` and the skins' lists are abilities, `unitList` units, `itemList` items, `upgradeList` upgrades, `buffList` and `effectList` buffs);
    - `stringList`: a list of strings (`stringList`, `modelList`, `intList`, `techList`), of an enumeration's raw values when the enumerations hold its metadata type (`targetList`, `unitClass`, `pathingListPrevent`).

    A metadata type the generator does not map takes its value type's category: `number` for `int`, `real` and `unreal`, `text` for `string`. So a new Patch's type never makes a field unwritable; the generator warns of it, and `pnpm builtins:check` lists it. In 3.0.1, `destructableCategory` (`bcat`) and `doodadCategory` (`dcat`) are not mapped, so they are texts: their values are not in the editor data the enumerations come from.
- `enumerations`, in format 2, gives each enumeration a field reads, by metadata type, its raw values in the World Editor's order: the first item of each value of its section in `UI/UnitEditorData.txt` (`01=normal,WESTRING_UE_ATTACKTYPE_NORMAL` gives `normal`), integers for a field stored as `int` (`teamColor`'s `-1` to `24`). They are what Object data stores, never the editor's display names. A section's alternative spellings (`01_Alt=aliv`) are not read.
- **The editor's own behaviour wins.** When the World Editor's save puts a field elsewhere than its metadata says, the generator records it in a short list of overrides (`FIELD_OVERRIDES` in `src/fields.ts`), each with the fixture that shows it. The doodads' `dnam` is the first: the 3.0 editor keeps it in `war3map.w3d`, as a `TRIGSTR`, where every other kind's name goes to its Skin file (`reforged-map`'s `test/fixtures/editor-objects.w3m`, [#591](https://github.com/phmilk/reforged-ts/issues/591)).

When the 3.0.0 table was generated ([#634](https://github.com/phmilk/reforged-ts/issues/634)), it held every modification of `reforged-map`'s fixtures, the World Editor's save of `editor-objects.w3m` and wc3libs' files: each of their 2,110 modifications is in the file and of the value type the table gives, and each `TRIGSTR` value is in a localizable field. The World Editor fixture of [#640](https://github.com/phmilk/reforged-ts/issues/640), a save by the 3.0.1 editor of an edit of every kind, settled the file of `unsf` and `ushr`, whose `netsafe` is 11 (the Skin file, as the table says), and the comment of a levelled field (it names no level), with no override needed. The World Editor contract of Object sync ([#713](https://github.com/phmilk/reforged-ts/issues/713)), a map folder synced from Object definitions of every kind and saved twice by the same editor, came back byte for byte with no override either. No fixture has shown the type of `damageType` and `proctargetType` yet; a difference a fixture shows becomes an override.

The file is written one kind, enumeration or field per line, byte-stably, as the index is.

## The field declarations (Object definitions)

A field table of format 2 is also emitted as declarations, `3.0.1/fields.d.ts`, and the `reforged-builtins/fields` entry resolves to the newest Game version's, as the kind entry points do. `reforged-map/objects` types Object definitions from it ([#700](https://github.com/phmilk/reforged-ts/issues/700)), and `reforged-map` checks their values and writes them with the field table itself (its README's [Object definitions](https://github.com/phmilk/reforged-ts/tree/master/packages/reforged-map#object-definitions), and the docs site's [guide](https://github.com/phmilk/reforged-ts/blob/master/website/docs/guides/object-definitions.md)); a Game version whose table is of format 1 has none. It exports `Fields`, the interface of each kind's fields by Object kind (`Fields["unit"]` is `UnitFields`), and each kind's interface keys its fields by field id, in code-point order:

```ts
export interface UnitFields {
  /**
   * Attack 1 - Attack Type (`ua1t`), a field of the units of Patch 3.0.1.
   *
   * Metadata name `atkType1`, metadata type `attackType`, value type `string`, in the base file, war3map.w3u, one value.
   */
  readonly ua1t: {
    readonly category: "enumeration";
    readonly value:
      | "unknown"
      | "normal"
      | "pierce"
      | "siege"
      | "spells"
      | "chaos"
      | "magic"
      | "hero";
    readonly levels: false;
    readonly localizable: false;
  };
}
```

- `category` is the field's category in the table, and `value` the type of one value by it: `number`, `boolean`, `string` for a text, the union of the raw values for an enumeration, `Rawcode<kind>` for a Rawcode and a readonly array of them for a list (of `of`'s kind: `uabi`'s is `readonly Rawcode<"ability">[]`), and a readonly array of strings, or of an enumeration's raw values, for a list of strings. `Rawcode` is the Typings'. An enumeration the table does not hold is a `string`.
- `levels` says whether it holds a value per level (a doodad's variation), `localizable` whether the World Editor writes it as a `TRIGSTR`: what a value of a levelled or localizable field may be is `reforged-map`'s.
- The TSDoc gives the enUS label and field id (`` `dvr1`, unlabelled `` without a label), the metadata name and type, the value type, the file (base or Skin, by its name), whether it holds one value or a value per level, whether it is localizable, and the bases it is specific to.

## The artefacts

Each Game version's index is emitted three ways, every file with a banner that says so: `3.0.0.d.ts`, one ambient `FourCC` overload per Rawcode with the object's TSDoc; and per Object kind, such as `3.0.0/units.d.ts`, which exports the constants, and `3.0.0/units.lua`, the module that returns them. The TSDoc gives the name and Rawcode, the Game version (never the Build) and the race, and, on the overload, the constant and its entry point. It never holds tooltip text.

Each field table of format 2 is emitted once more, as its [field declarations](#the-field-declarations-object-definitions).

`pnpm builtins:check`, which `pnpm check` runs, needs no game: it emits every artefact from each committed index, and the field declarations from each committed table of format 2, again and fails on any difference, on a file no index or table emits, on an index or a field table of the wrong shape (a format other than 1 or 2; in format 2, a field without its metadata type, a category other than the one the generator maps its metadata type to, an enumeration a field reads and the table lacks, or one no field reads), on a field table of another Build than its index or not written as the generator writes it, on a Game version without its provenance file, and on `exports` that do not point the kind entry points and `reforged-builtins/fields` at the newest Game version. It lists each metadata type of a table of format 2 the generator does not map to a category, with its fields, and passes. The generator's tests emit format 2 and its declarations from the committed fixture input of `test/fixtures/fields/` and compare them with the `fields.json` and `fields.d.ts` there.

## Generating it (maintainers)

`pnpm builtins:generate [--install <folder>] [--out <folder>] [--client-build <Build>]`, from the repository root, on a machine with the game. It finds the install as the Probe runner finds the game: `--install` (the install folder, or any file in it), else the folder above the executable `WC3_EXECUTABLE` names, else `Warcraft III` under `Program Files (x86)` then `Program Files` (drive C under WSL). It refuses an install whose Build is not `reforged-types`' `reforged.patch`, naming both. `--client-build` accepts, as `probe:run` does, an install on that Build in its place when it is a later Build of the Patch's Game version: a hotfix whose Patch files are the Patch's, as 3.0.1.24371's were 3.0.1.24370's (#642). The Built-in objects are then recorded as the Patch, a warning says so, and the provenance file names the install's Build in `clientBuild`, next to its build config; a `--client-build` that is not a later Build of the Game version is an error. The Build is the one the build config names (`build-name`), which describes the content: the Battle.net app has been seen to give `.build.info` another Version for the same build config (3.0.0.24248 for the build config of 3.0.0.24268), which is then a warning.

It reads the install's CASC storage with a small TypeScript reader (`reforged-studio`'s `src/casc/`, which the generator imports through the workspace root's dev dependency: no native code, no dependency, read-only), with its SLK and profile readers. The Game data sets read the layers the game reads, measured by Probe runs on 3.0.0.24268 under each Game Data Set and Game Data Version ([`docs/research/builtins-layers.md`](../../docs/research/builtins-layers.md), [#575](https://github.com/phmilk/reforged-ts/issues/575)). A set of a Game Data Set and a Game Data Version reads `_Balance/<Set>_V<version>.w3mod:`, where the version is 0 for Reign of Chaos, 1 for The Frozen Throne and 2 for Forsaken Kingdom, and leaves out every unit, item and ability whose `version` cell is greater, an object of a later expansion; a destructable or a buff of a later version is still created or given to a unit, as measured ([#622](https://github.com/phmilk/reforged-ts/issues/622)), so both keep every row. Upgrades keep every row too: no layer has one of a later version than the sets that read it, and the game holds those it lists, as measured. Doodads, which no Native creates, are not measured and keep every row. The install has `Custom_V0`, `Custom_V1` and `Melee_V0` only, and a set whose layer has no file of a kind reads the base layer's, `War3.w3mod:`: Melee of The Frozen Throne reads the base layer without Forsaken Kingdom's objects, and both sets of Forsaken Kingdom read it whole. Each layer's file of a kind replaces the base layer's whole: no layer has destructables or doodads. Default reads Custom, or Melee on a map whose "Melee Map" flag is set, as the runs measured. The runs created units, items, abilities and destructables, gave units buffs and researched upgrades.

No layer holds a names, metadata or locale file: names come from the enUS profile files, where a set's own value is qualified (`Name:custom,V1=`, `Name:melee,V0=`, a set's `<set>,V<version>`; `Name:hd=` is the HD graphics', never read). An object is named by the first set that holds it, in the order above: its qualified value there, else the unqualified one. In 3.0.0.24268 that names `Asa2`, held by Custom of The Frozen Throne alone, "Pillage".

Per Object kind and Game data set, the data file gives the Rawcodes and, where it has the column, the race (an object's row from the first set that holds it, in the order above): `Units/UnitData.slk`, `Units/ItemData.slk`, `Units/AbilityData.slk`, `Units/AbilityBuffData.slk`, `Units/DestructableData.slk`, `Doodads/Doodads.slk` and `Units/UpgradeData.slk`; heroes are units, and a row with no Rawcode cell is skipped with a warning. The kind's `*MetaData.slk` locates the field the Object Editor shows as the name:

- in the profile files of `_Locales/enUS.w3mod:` (`Units/*UnitStrings.txt`, `Units/ItemStrings.txt`, `Units/*AbilityStrings.txt` for abilities and buffs, `Units/*UpgradeStrings.txt`; finding none is an error), keys and sections matched without regard to case, as the game matches them (`[ANsp]` names `Ansp`);
- or in the data file itself, as for destructables and doodads, whose names are `WESTRING_` keys of `UI/WorldEditGameStrings.txt` and `UI/WorldEditStrings.txt` (a key neither holds leaves the object unnamed, with a warning).

A buff's name is its editor name, else its tooltip's title (`Bufftip`), as most buffs have no editor name. A field of one value per level (`repeat` above 0 in the metadata, as an upgrade's name) gives its first level's. A buff's editor name and an upgrade's raw list of names, quotes removed, are its `commentName` where they differ from the name. Colour codes and line breaks are removed; no tooltip, editor suffix or hero proper name is read into the model. An object with no name is a warning, its constant `Unnamed_<rawcode>`; a Rawcode two kinds share, one that is not four `[A-Za-z0-9]` characters and two constants of one kind with one name are errors, and nothing is written. The field table comes from the same run, in format 2: every row of the seven kinds' `*MetaData.slk`, labelled through `UI/WorldEditGameStrings.txt` and `UI/WorldEditStrings.txt`, its enumerations read from the base layer's `UI/UnitEditorData.txt`; a metadata type whose value type the generator does not know (`INT_TYPES` and `STRING_TYPES` in `src/fields.ts`), an enumeration the editor data does not hold, an enumeration stored as `int` whose raw values are not integers, an editor strings file without a kind's label and an override of a field the metadata lacks are errors, and a label the strings do not hold and a metadata type with no category are warnings. It writes `<Game version>/index.json`, `<Game version>/fields.json`, its declarations `<Game version>/fields.d.ts`, `<Game version>/provenance.json`, which pins each input by CASC path, content key, sha256 and size, and the artefacts emitted from the index. All are committed; the provenance file is never published, and the raw SLK and `.txt` files never enter git. The generator (`src/`) is not published either: the package ships its output alone.

An object named twice, in one names file or across them, takes its first name, the files read in the code-point order of their paths (`nameFileOrder` in `src/generate.ts`), with a warning. The game gives the first name, measured by a Probe on 3.0.0.24268 ([`docs/research/builtins-names.md`](../../docs/research/builtins-names.md), [#564](https://github.com/phmilk/reforged-ts/issues/564)): `Ubtr` is "Noble", the first of its two names in `CampaignUnitStrings.txt`, and `Almf` is "Death Coil", from `CampaignAbilityStrings.txt`, not "Item Lesser Mark of the Forsaken", which `ItemAbilityStrings.txt` gives it after. In 3.0.0.24268 the rule decides 14 names, `Ubtr`'s and those of 12 abilities and one buff that `ItemAbilityStrings.txt` names again. The game gives a buff's name to no Native, so the buffs' rule is the abilities', whose files they share. The World Editor's own strings files keep the later value of a key both set, a rule no Probe can settle.

### Adopting a Build

Each run compares the new model with the committed one of the same Game version, or with the previous Game version's when the Build opens a new one, and prints the record of the Patch, one line per change with its verdict:

- an added object: additive, a minor;
- a removed object, a renamed constant (the same Rawcode, a new name) and an object whose kind changed: breaking, a major;
- a change of the Game data sets that hold an object: additive;
- a Game data set the index no longer lists, by its id (`melee-roc`): breaking, a major, since `reforged-map` matches a map's Game data set against the ids; a renamed id is one removed set and one added set;
- a Game data set the index adds, or a new label on a set it keeps: additive.

A breaking change of an object also gets a rename entry in `migration/renames.json`, a map with the schema of the library's (`packages/reforged-ts/migration/renames.schema.json`), for the pair from the package's current major to the next. A renamed constant maps the old name to the new one (`Units.Footman_hfoo` to `Units.Militia_hfoo`), a constant moved to another kind's object maps to its new one, and a removed one has no replacement. A run keeps the entries already there: within the pair, the major not yet released, a constant renamed by two Patches chains into one entry from its released name to the newest, one renamed back loses its entry, and the pair's no-renames marker gives way to the entries. Below 1.0.0 no major has been released, so no entry is written. A removed Game data set has no entry, since no constant names it: its line in the record says so, and the migration page says which set a map of it reads now, the pair's no-renames marker standing in for the entries when no object changes. A new Game version gets its folder next to the previous one, and the run moves the kind entry points and `reforged-builtins/fields` of `exports` to it and `reforged.patch` to the Build. A major of the package needs its migration page and these entries: the major-changeset gate (`docs/release.md`) checks both, and that each replacement resolves against the constants of the newest Game version.

The generator's tests (`pnpm --filter reforged-builtins test`) run it on synthetic CASC storages they write in a temporary folder, with no byte of Blizzard's.

## Notice

This package is not affiliated with or endorsed by Blizzard Entertainment. Warcraft is a trademark of Blizzard Entertainment. The names and Rawcodes are derived from the game's data and are not licensed by this package; its code is MIT ([LICENSE](LICENSE)).
