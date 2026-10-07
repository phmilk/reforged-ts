# reforged-builtins

The Built-in objects of each Warcraft III Reforged Patch, reduced to the identifiers code needs to name them: Rawcode, Object kind, race, enUS name and the Game data sets that hold the object ([ADR 0013](https://github.com/phmilk/reforged-ts/blob/master/docs/adr/0013-built-in-objects-ship-as-derived-identifiers-in-their-own-package.md)). It never holds tooltip text, numbers or icons.

**Work in progress, not published yet** ([#509](https://github.com/phmilk/reforged-ts/issues/509)). It holds the JSON index of the units of the Default Game data set of Patch 3.0.0.24268; the other Object kinds, the Game data sets, the `FourCC` overloads and the constants come next.

**Supported Patch: 3.0.0.24268.** The `reforged.patch` field of `package.json` carries the same Build, which a test holds to `reforged-types`'.

## The JSON index

`3.0.0/index.json`, one per Game version, is the model the package's other artefacts come from:

```json
{
  "format": 1,
  "build": "3.0.0.24268",
  "gameVersion": "3.0.0",
  "gameDataSets": [{ "id": "default", "label": "Default" }],
  "objects": {
    "hfoo": {
      "kind": "unit",
      "name": "Footman",
      "race": "human",
      "sets": ["default"],
      "constant": "Footman_hfoo"
    }
  }
}
```

- `format` changes only with an incompatible shape, in a major.
- `objects` is keyed by Rawcode, in code-point order. `name` is the enUS name, colour codes and line breaks removed; it is absent when the game gives none. `race` is lower-case, as the game writes it, and absent for a kind without one. `sets` lists the ids of the Game data sets that hold the object. `constant` is its constant's name: the enUS name in PascalCase, then `_` and the Rawcode (`Unnamed_<rawcode>` without a name).

The file is written one object per line, byte-stably: a regeneration from unchanged inputs writes the same bytes.

## Generating it (maintainers)

`pnpm builtins:generate [--install <folder>] [--out <folder>]`, from the repository root, on a machine with the game. It finds the install as the Probe runner finds the game: `--install` (the install folder, or any file in it), else the folder above the executable `WC3_EXECUTABLE` names, else `Warcraft III` under `Program Files (x86)` then `Program Files` (drive C under WSL). It refuses an install whose Build (its `.build.info`) is not `reforged-types`' `reforged.patch`, naming both.

It reads the install's CASC storage with a small TypeScript reader (`src/casc/`: no native code, no dependency, read-only): the base layer's `Units/UnitData.slk` (Rawcode and race), `Units/UnitMetaData.slk` (which profile field holds the name) and the `Units/*UnitStrings.txt` of `_Locales/enUS.w3mod:` (the names, matched without regard to case; finding none is an error). It writes `<Game version>/index.json` and `<Game version>/provenance.json`, which pins each input by CASC path, content key, sha256 and size. Both are committed; the provenance file is never published, and the raw SLK and `.txt` files never enter git. The generator (`src/`) is not published either: the package ships its output alone.

A unit named twice, in one names file or across them, takes its last name, the files read in the code-point order of their paths (`nameFileOrder` in `src/generate.ts`), with a warning. That rule is assumed, not yet settled by a Probe: in 3.0.0.24268 it decides one name, `Ubtr`'s ("Death Knight", named twice in `CampaignUnitStrings.txt`), and no unit is named differently by two files.

The generator's tests (`pnpm --filter reforged-builtins test`) run it on synthetic CASC storages they write in a temporary folder, with no byte of Blizzard's.

## Notice

This package is not affiliated with or endorsed by Blizzard Entertainment. Warcraft is a trademark of Blizzard Entertainment. The names and Rawcodes are derived from the game's data and are not licensed by this package; its code is MIT ([LICENSE](LICENSE)).
