# reforged-builtins

The Built-in objects of each Warcraft III Reforged Patch, reduced to the identifiers code needs to name them: Rawcode, Object kind, race, enUS name and the Game data sets that hold the object ([ADR 0013](https://github.com/phmilk/reforged-ts/blob/master/docs/adr/0013-built-in-objects-ship-as-derived-identifiers-in-their-own-package.md)). It never holds tooltip text, numbers or icons.

**Work in progress, not published yet** ([#509](https://github.com/phmilk/reforged-ts/issues/509)). It holds the units of the Default Game data set of Patch 3.0.0.24268: their JSON index, their `FourCC` overloads and their constants. The other Object kinds and the Game data sets come next.

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

## The `FourCC` overloads

List the Game version's entry in `types` next to the Typings', in either order:

```json
{
  "compilerOptions": {
    "types": [
      "reforged-types/3.0.0",
      "reforged-builtins/3.0.0",
      "@typescript-to-lua/language-extensions"
    ]
  }
}
```

`3.0.0.d.ts` declares one `FourCC` overload per Built-in Rawcode, of its literal type and returning its kind's Rawcode: `FourCC("hfoo")` is a `Rawcode<"unit">`, so `UnitAddAbility(hero, FourCC("hfoo"))` no longer compiles. A literal the package does not know (`FourCC("h000")`, a Custom object) still returns `UnknownRawcode` through the Typings' `string` overload, which the package does not redeclare. The overloads emit nothing into the map's Lua.

## The constants

One object per Object kind, from its own entry point, so a bundle carries only the kinds it imports; there is no entry point that holds every kind:

```ts
import { Units } from "reforged-builtins/units";

Unit.create(owner, Units.Footman_hfoo, 0, 0);
```

Each member is `readonly` and typed `Rawcode<kind>`, never a `const enum` member, and is named by its enUS name in PascalCase, then `_` and its Rawcode. Its Lua module (`3.0.0/units.lua`) returns the same object as a table of integer literals, each the big-endian value of the Rawcode's four bytes, which is what `FourCC` returns: `Units.Footman_hfoo === FourCC("hfoo")`. The entry point resolves, through the package's `exports` (the `types` condition for TypeScript, `tstl` for typescript-to-lua), to the newest Game version the package holds.

An object's overload and its constant share one doc comment: its name and Rawcode, "a Built-in unit of Patch 3.0.0" (the Game version, never the Build, so a new Build changes no line), its race, the Game data sets that hold it when not every one does, and, on the overload, its constant and entry point. No tooltip text.

## Generating it (maintainers)

`pnpm builtins:generate [--install <folder>] [--out <folder>]`, from the repository root, on a machine with the game. It finds the install as the Probe runner finds the game: `--install` (the install folder, or any file in it), else the folder above the executable `WC3_EXECUTABLE` names, else `Warcraft III` under `Program Files (x86)` then `Program Files` (drive C under WSL). It refuses an install whose Build (its `.build.info`) is not `reforged-types`' `reforged.patch`, naming both.

It reads the install's CASC storage with a small TypeScript reader (`src/casc/`: no native code, no dependency, read-only): the base layer's `Units/UnitData.slk` (Rawcode and race), `Units/UnitMetaData.slk` (which profile field holds the name) and the `Units/*UnitStrings.txt` of `_Locales/enUS.w3mod:` (the names, matched without regard to case; finding none is an error). It writes `<Game version>/index.json` and `<Game version>/provenance.json`, which pins each input by CASC path, content key, sha256 and size, then the artefacts emitted from the index (`src/emit.ts`): `<Game version>.d.ts`, and `<Game version>/<kind>.d.ts` and `.lua` per Object kind. All are committed; the provenance file is never published, and the raw SLK and `.txt` files never enter git. The generator (`src/`) is not published either: the package ships its output alone. Each generated file opens with a banner: generated by `reforged-builtins` from the Game version's Built-in objects, derived identifiers only, not affiliated with Blizzard, never edited by hand.

`pnpm builtins:check`, which `pnpm check` and CI run, needs no game. It emits every artefact from each committed index again and fails on any difference, on a file no index emits, on an index whose shape is not the one above or that is not written as the generator writes it, on a Game version without its provenance file, and on `exports` that do not name each Game version's entry and send the kind entry points to the newest one. After a change to the emitter, `pnpm builtins:check -- --write` writes the artefacts each committed index emits, then checks.

A unit named twice, in one names file or across them, takes its last name, the files read in the code-point order of their paths (`nameFileOrder` in `src/generate.ts`), with a warning. That rule is assumed, not yet settled by a Probe: in 3.0.0.24268 it decides one name, `Ubtr`'s ("Death Knight", named twice in `CampaignUnitStrings.txt`), and no unit is named differently by two files.

The generator's tests (`pnpm --filter reforged-builtins test`) run it on synthetic CASC storages they write in a temporary folder, with no byte of Blizzard's.

## Notice

This package is not affiliated with or endorsed by Blizzard Entertainment. Warcraft is a trademark of Blizzard Entertainment. The names and Rawcodes are derived from the game's data and are not licensed by this package; its code is MIT ([LICENSE](LICENSE)).
