# reforged-builtins

The Built-in objects of each Warcraft III Reforged Patch, reduced to the identifiers code needs to name them: Rawcode, Object kind, race, enUS name and the Game data sets that hold the object ([ADR 0013](https://github.com/phmilk/reforged-ts/blob/master/docs/adr/0013-built-in-objects-ship-as-derived-identifiers-in-their-own-package.md)). It never holds tooltip text, numbers or icons.

**Work in progress, not published yet** ([#509](https://github.com/phmilk/reforged-ts/issues/509)). It holds the Built-in objects of Patch 3.0.0.24268, in the seven Object kinds and the three Game data sets: their JSON index, their `FourCC` overloads and their constants.

**Supported Patch: 3.0.0.24268.** The `reforged.patch` field of `package.json` carries the same Build, which a test holds to `reforged-types`'.

## The JSON index

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

- `format` changes only with an incompatible shape, in a major.
- `objects` is keyed by Rawcode, in code-point order. `name` is the enUS name, colour codes and line breaks removed; it is absent when the game gives none. `race` is lower-case, as the game writes it, and absent for a kind without one. `sets` lists the ids of the Game data sets that hold the object; the constants cover their union, and an object's TSDoc names the sets that hold it and those that do not, unless every one does ("In the Default Game data set. Not in the Custom and Melee Game data sets."). `constant` is its constant's name: the enUS name in PascalCase, then `_` and the Rawcode (`Unnamed_<rawcode>` without a name).

The file is written one object per line, byte-stably: a regeneration from unchanged inputs writes the same bytes.

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

Each constant of `Units` is a `Rawcode<"unit">` named by the enUS name in PascalCase, then `_` and the Rawcode. typescript-to-lua resolves the entry point through the package's `exports` (its `tstl` condition) to a Lua module of integers, each the value `FourCC` returns for the Rawcode, so `Units.Footman_hfoo === FourCC("hfoo")` in game. Every kind has its entry point and constants object: `reforged-builtins/units` (`Units`), `/items` (`Items`), `/abilities` (`Abilities`), `/buffs` (`Buffs`), `/destructables` (`Destructables`), `/doodads` (`Doodads`) and `/upgrades` (`Upgrades`), each constant a `Rawcode` of its kind. A bundle carries only the kinds it imports, and no entry point holds every kind.

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

The generator's tests (`pnpm --filter reforged-builtins test`) run it on synthetic CASC storages they write in a temporary folder, with no byte of Blizzard's.

## Notice

This package is not affiliated with or endorsed by Blizzard Entertainment. Warcraft is a trademark of Blizzard Entertainment. The names and Rawcodes are derived from the game's data and are not licensed by this package; its code is MIT ([LICENSE](LICENSE)).
