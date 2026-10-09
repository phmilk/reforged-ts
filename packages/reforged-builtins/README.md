# reforged-builtins

The Built-in objects of each Warcraft III Reforged Patch, reduced to the identifiers code needs to name them: Rawcode, Object kind, race, enUS name and the Game data sets that hold the object ([ADR 0013](https://github.com/phmilk/reforged-ts/blob/master/docs/adr/0013-built-in-objects-ship-as-derived-identifiers-in-their-own-package.md)). It never holds tooltip text, numbers or icons.

**Work in progress, not published yet** ([#509](https://github.com/phmilk/reforged-ts/issues/509)). It holds the Built-in objects of Patch 3.0.0.24268, in the seven Object kinds and the three Game data sets: their JSON index, their `FourCC` overloads and their constants.

**Supported Patch: 3.0.0.24268.** The `reforged.patch` field of `package.json` carries the same Build, which a test holds to `reforged-types`'.

## In a Map project

Add the overloads' entry of your Game version to `types`, next to the Typings':

```json
{
  "compilerOptions": {
    "types": ["reforged-types/3.0.0", "reforged-builtins/3.0.0"]
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

The constants cover the union of the three Game data sets the World Editor offers in its map options: Default, Custom and Melee. An object's TSDoc names the sets that hold it when not every one does ("In the Default Game data set. Not in the Custom and Melee Game data sets."), and says nothing otherwise. A constant of an object the map's set does not hold still compiles, and the Native it is passed to finds no such object in game: check its hover before using it in a Melee or Custom map.

## What it never holds

- **Custom objects and a map's changes to Built-in ones.** A Custom object's Rawcode (`h000`) is not in the package and stays an `UnknownRawcode`; a Built-in object the map renamed keeps its game name here. A map's own objects come from its map folder, through [`reforged-map`](https://github.com/phmilk/reforged-ts/tree/master/packages/reforged-map).
- **Tooltip text, numbers and icons.** The package holds identifiers only: Rawcode, kind, race, enUS name and Game data sets. Tooltips and icons are the hover tool's.
- **Other locales.** Names and constants are enUS.

## Finding a Rawcode (agents and tools)

To find the Rawcode of an object by its name, search the index of the newest Game version, one object per line: `grep -i '"name":"footman"' packages/reforged-builtins/3.0.0/index.json` (or the installed `node_modules/reforged-builtins/3.0.0/index.json`) gives `"hfoo": {"kind":"unit",…,"constant":"Footman_hfoo"}`. The kind names the entry point to import, one kind at a time: `unit` is `reforged-builtins/units`'s `Units`, `ability` `reforged-builtins/abilities`'s `Abilities`, and so on. Import only the kinds the file uses: each is a module of its own in the bundle.

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
    { "id": "default", "label": "Default" },
    { "id": "custom", "label": "Custom" },
    { "id": "melee", "label": "Melee" }
  ],
  "objects": {
    "hfoo": {
      "kind": "unit",
      "name": "Footman",
      "race": "human",
      "sets": ["default", "custom", "melee"],
      "constant": "Footman_hfoo"
    }
  }
}
```

- `format` is the shape's version, 1 today: a tool reads an index whose `format` it knows, and a new `format` comes only with an incompatible shape, in a major of the package.
- `objects` is keyed by Rawcode, in code-point order. `name` is the enUS name, colour codes and line breaks removed; it is absent when the game gives none. `race` is lower-case, as the game writes it, and absent for a kind without one. `sets` lists the ids of the Game data sets that hold the object; the constants cover their union, and an object's TSDoc names the sets that hold it and those that do not, unless every one does ("In the Default Game data set. Not in the Custom and Melee Game data sets."). `constant` is its constant's name: the enUS name in PascalCase, then `_` and the Rawcode (`Unnamed_<rawcode>` without a name).

The file is written one object per line, byte-stably: a regeneration from unchanged inputs writes the same bytes.

## The artefacts

Each Game version's index is emitted three ways, every file with a banner that says so: `3.0.0.d.ts`, one ambient `FourCC` overload per Rawcode with the object's TSDoc; and per Object kind, such as `3.0.0/units.d.ts`, which exports the constants, and `3.0.0/units.lua`, the module that returns them. The TSDoc gives the name and Rawcode, the Game version (never the Build) and the race, and, on the overload, the constant and its entry point. It never holds tooltip text.

`pnpm builtins:check`, which `pnpm check` runs, needs no game: it emits every artefact from each committed index again and fails on any difference, on a file no index emits, on an index of the wrong shape, on a Game version without its provenance file, and on `exports` that do not point the kind entry points at the newest Game version.

## Generating it (maintainers)

`pnpm builtins:generate [--install <folder>] [--out <folder>]`, from the repository root, on a machine with the game. It finds the install as the Probe runner finds the game: `--install` (the install folder, or any file in it), else the folder above the executable `WC3_EXECUTABLE` names, else `Warcraft III` under `Program Files (x86)` then `Program Files` (drive C under WSL). It refuses an install whose Build is not `reforged-types`' `reforged.patch`, naming both. The Build is the one the build config names (`build-name`), which describes the content: the Battle.net app has been seen to give `.build.info` another Version for the same build config (3.0.0.24248 for the build config of 3.0.0.24268), which is then a warning.

It reads the install's CASC storage with a small TypeScript reader (`src/casc/`: no native code, no dependency, read-only). The Game data sets are the three the World Editor of 3.0 offers in its map options: Default, which reads the base layer `War3.w3mod:`; Custom, which reads `_Balance/Custom_V1.w3mod:`; and Melee, which reads `_Balance/Melee_V0.w3mod:`. Each layer's file of a kind replaces the base layer's whole, and a set whose layer has none reads the base layer's: no layer has destructables or doodads. Which layer a map reads for each of the editor's Game Data Versions (Reign of Chaos, The Frozen Throne, Forsaken Kingdom), the last having no layer of its own, is not yet settled in game ([#564](https://github.com/phmilk/reforged-ts/issues/564)).

No layer holds a names, metadata or locale file: names come from the enUS profile files, where a set's own value is qualified (`Name:custom,V1=`, `Name:melee,V0=`; `Name:hd=` is the HD graphics', never read). An object is named by the first set that holds it, in the order above: its qualified value there, else the unqualified one. In 3.0.0.24268 that names `Asa2`, held by Custom alone, "Pillage".

Per Object kind and Game data set, the data file gives the Rawcodes and, where it has the column, the race (an object's row from the first set that holds it, in the order above): `Units/UnitData.slk`, `Units/ItemData.slk`, `Units/AbilityData.slk`, `Units/AbilityBuffData.slk`, `Units/DestructableData.slk`, `Doodads/Doodads.slk` and `Units/UpgradeData.slk`; heroes are units, and a row with no Rawcode cell is skipped with a warning. The kind's `*MetaData.slk` locates the field the Object Editor shows as the name:

- in the profile files of `_Locales/enUS.w3mod:` (`Units/*UnitStrings.txt`, `Units/ItemStrings.txt`, `Units/*AbilityStrings.txt` for abilities and buffs, `Units/*UpgradeStrings.txt`; finding none is an error), keys matched without regard to case;
- or in the data file itself, as for destructables and doodads, whose names are `WESTRING_` keys of `UI/WorldEditGameStrings.txt` and `UI/WorldEditStrings.txt` (a key neither holds leaves the object unnamed, with a warning).

A buff's name is its editor name, else its tooltip's title (`Bufftip`), as most buffs have no editor name. A field of one value per level (`repeat` above 0 in the metadata, as an upgrade's name) gives its first level's. Colour codes and line breaks are removed; no tooltip, editor suffix or hero proper name is read into the model. An object with no name is a warning, its constant `Unnamed_<rawcode>`; a Rawcode two kinds share, one that is not four `[A-Za-z0-9]` characters and two constants of one kind with one name are errors, and nothing is written. It writes `<Game version>/index.json`, `<Game version>/provenance.json`, which pins each input by CASC path, content key, sha256 and size, and the artefacts emitted from the index. All are committed; the provenance file is never published, and the raw SLK and `.txt` files never enter git. The generator (`src/`) is not published either: the package ships its output alone.

An object named twice, in one names file or across them, takes its last name, the files read in the code-point order of their paths (`nameFileOrder` in `src/generate.ts`), with a warning. That rule is assumed, not yet settled in the World Editor ([#564](https://github.com/phmilk/reforged-ts/issues/564)): in 3.0.0.24268 it decides 14 names, `Ubtr`'s ("Death Knight", named twice in `CampaignUnitStrings.txt`), 12 abilities' and one buff's that `ItemAbilityStrings.txt` names again (`Almf` is "Death Coil" before it, "Item Lesser Mark of the Forsaken" in it).

### Adopting a Build

Each run compares the new model with the committed one of the same Game version, or with the previous Game version's when the Build opens a new one, and prints the record of the Patch, one line per change with its verdict:

- an added object: additive, a minor;
- a removed object, a renamed constant (the same Rawcode, a new name) and an object whose kind changed: breaking, a major;
- a change of the Game data sets that hold an object: additive.

A breaking change also gets a rename entry in `migration/renames.json`, a map with the schema of the library's (`packages/reforged-ts/migration/renames.schema.json`), for the pair from the package's current major to the next. A renamed constant maps the old name to the new one (`Units.Footman_hfoo` to `Units.Militia_hfoo`), a constant moved to another kind's object maps to its new one, and a removed one has no replacement. A run keeps the entries already there: within the pair, the major not yet released, a constant renamed by two Patches chains into one entry from its released name to the newest, one renamed back loses its entry, and the pair's no-renames marker gives way to the entries. Below 1.0.0 no major has been released, so no entry is written. A new Game version gets its folder next to the previous one, and the run moves the kind entry points of `exports` to it and `reforged.patch` to the Build. A major of the package needs its migration page and these entries: the major-changeset gate (`docs/release.md`) checks both, and that each replacement resolves against the constants of the newest Game version.

The generator's tests (`pnpm --filter reforged-builtins test`) run it on synthetic CASC storages they write in a temporary folder, with no byte of Blizzard's.

## Notice

This package is not affiliated with or endorsed by Blizzard Entertainment. Warcraft is a trademark of Blizzard Entertainment. The names and Rawcodes are derived from the game's data and are not licensed by this package; its code is MIT ([LICENSE](LICENSE)).
