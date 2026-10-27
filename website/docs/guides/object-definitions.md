---
title: Object definitions
sidebar_position: 15
description: Declare a map's units, items, abilities, buffs, destructables, doodads and upgrades in TypeScript with reforged-map/objects, by field id with levels and localized values, and how the build merges them, Object sync writes them into the map folder, the Object manifest records them, adoption and release move objects between the code and the World Editor, and how to take turns with the World Editor.
---

# Object definitions

A map's types of object (its units, items, abilities, buffs, destructables, doodads and upgrades) live in the map folder's Object data, which the World Editor's Object Editor edits. An **Object definition** declares one of them in TypeScript instead: a new Custom object, or a change to a Built-in object. The code then owns it, and the World Editor still shows it. Definitions suit objects that follow a rule (ten tiers of one tower, an ability per hero), that a review should read as a diff, or that several branches change.

Definitions run in Node at build time, never in the map's Lua: they say what the map's Object data holds, and the game sees only the result. They come with [`reforged-map`](https://github.com/phmilk/reforged-ts/tree/master/packages/reforged-map), whose README gives every detail this page leaves out. The decision behind them is [ADR 0015](https://github.com/phmilk/reforged-ts/blob/master/docs/adr/0015-map-folder-owns-object-data-and-any-faithful-editor-may-edit-it.md): the map folder stays the one source of the map's Object data, and the code writes into it.

:::note[In the Template]
A Map project gets the folder `src/objects/`, the commands `pnpm objects:sync`, `pnpm objects:adopt` and `pnpm objects:release`, the build's merge and the `pnpm dev` option of this page once the Template adopts them ([phmilk/reforged-ts-template#114](https://github.com/phmilk/reforged-ts-template/issues/114)). Until then, a Map project calls the functions of `reforged-map` this page names from a script of its own.
:::

## Declaring an object

Each definition is one call of a `define<Kind>` function of `reforged-map/objects`, exported from a file under `src/objects/`:

| Object kind      | Function             | Name field                        |
| ---------------- | -------------------- | --------------------------------- |
| `"unit"`         | `defineUnit`         | `unam`                            |
| `"item"`         | `defineItem`         | `unam`                            |
| `"ability"`      | `defineAbility`      | `anam`                            |
| `"buff"`         | `defineBuff`         | `fnam` (editor only), else `ftip` |
| `"destructable"` | `defineDestructable` | `bnam`                            |
| `"doodad"`       | `defineDoodad`       | `dnam`                            |
| `"upgrade"`      | `defineUpgrade`      | `gnam`, per level                 |

A **Custom object** gives its Rawcode and its `base`, the Built-in object of its kind it derives from, as the Object Editor's "New Custom Unit" does. A **change to a Built-in object** gives the Built-in object's Rawcode and no base:

```ts objects title="src/objects/units.ts"
import { defineUnit } from "reforged-map/objects";

// A Custom unit, derived from the Footman.
export const Sergeant = defineUnit({
  rawcode: "h002",
  base: FourCC("hfoo"),
  fields: {
    unam: "Sergeant",
    uhpm: 520,
    umvs: 300,
  },
});

// A change to the Knight, a Built-in unit: no base.
export const Knight = defineUnit({ rawcode: "hkni", fields: { uhpm: 900 } });
```

- **The Rawcode is always written out.** A Rawcode never depends on the order the files run in, so it never changes when a file is added. A Custom Rawcode is any four characters no Built-in object has; the World Editor's own start at `h000`, `A000`, `I000` and so on.
- **One owner per object.** A Rawcode the map folder already defines or changes, which the code does not own, is a collision: the build and Object sync refuse it. Hand that object to the code with [adoption](#adoption-moving-an-object-into-code), or choose another Rawcode.
- **Every exported definition counts**, once. A file may export several, and a value that is not a definition is ignored.
- **Another object is named with `FourCC`**, `FourCC("A001")`, the Typings' global, typed by the map's generated overloads like any literal. The generated constants (`CustomUnits.Captain_h000`) and those of `reforged-builtins` (`Units.Footman_hfoo`) exist only in the map's Lua, so a definition cannot import them: the build refuses an import of `src/generated/` or of `reforged-builtins/units`.

A definition is a Node module: it can compute, loop and share helpers through relative imports between the files of `src/objects/`. Ten tiers of one tower are one loop:

```ts objects title="src/objects/tiers.ts"
/** The cost of a tower of a tier, from 1. */
export function towerCost(tier: number): number {
  return 50 + 25 * (tier - 1);
}
```

```ts objects title="src/objects/towers.ts"
import { defineUnit } from "reforged-map/objects";
import { towerCost } from "./tiers";

export const [GuardTower1, GuardTower2, GuardTower3] = [1, 2, 3].map((tier) =>
  defineUnit({
    rawcode: `h1${String(tier).padStart(2, "0")}`,
    base: FourCC("hgtw"),
    fields: { unam: `Guard Tower ${String(tier)}`, ugol: towerCost(tier) },
  }),
);
```

An exported array of definitions does not count: export each definition, as the destructuring above does. A definition file may import any package the Map project installs and Node's own modules, resolved from the Map project's root, but no file outside `src/objects/`.

## Field ids and their hover

A field is keyed by its **field id**, the four characters the Object Editor shows with View > Display Values As Raw Data (Ctrl+D), and the ones `git diff` of the map folder shows: `unam` for a unit's name, `uhpm` for its hit points, `amcs` for an ability's mana cost. Each field is typed from the field declarations of [`reforged-builtins`](https://github.com/phmilk/reforged-ts/tree/master/packages/reforged-builtins#the-field-declarations), so:

- **the hover of a field id** gives its enUS label as the Object Editor shows it ("Hit Points Maximum (Base)"), its metadata name, its value type, whether it has levels, its file and the bases it is specific to;
- **completion** lists the fields of the kind;
- **a field the kind does not have, or a value of the wrong type**, fails the type check where it is written.

A value follows the field's category:

| Category         | Written as                                                                   | Example                                  |
| ---------------- | ---------------------------------------------------------------------------- | ---------------------------------------- |
| Number           | a `number`; an integer must fit 32 bits                                      | `uhpm: 520`, `Hbz2: { 1: 33.5 }`         |
| Flag             | a `boolean`                                                                  | `aher: false`                            |
| Text             | a `string`, or a [localized value](#localized-values) when it is localizable | `unam: "Sergeant"`                       |
| Enumeration      | one of its raw values, as the game's data names them                         | `ua1t: "pierce"`                         |
| Rawcode          | `FourCC` of an object of the field's kind                                    | `uabi: [FourCC("A001")]`                 |
| List of Rawcodes | a readonly array of them, written comma-separated                            | `uabi: [FourCC("AHbz"), FourCC("A001")]` |
| List of strings  | a readonly array of strings, none holding a comma                            | `utyp: ["giant", "mechanical"]`          |

A Rawcode and an enumeration of strings also take `""`, the empty value the game's data holds where an object has none. A value equal to the base's is kept: "set to the default" stays apart from "not set", and a field left out of `fields` keeps its base's value.

```ts objects title="src/objects/golem.ts"
import { defineUnit } from "reforged-map/objects";

export const Golem = defineUnit({
  rawcode: "n000",
  base: FourCC("ngrk"),
  fields: {
    unam: "Mud Golem",
    ua1t: "siege",
    utyp: ["giant", "mechanical"],
    uabi: [FourCC("ACsk")],
  },
});
```

## Levels

A field with levels (an ability's or an upgrade's per-level data, a doodad's variations) takes a record from level to value. Level 3 is set without restating levels 1 and 2, which keep their base's values:

```ts objects title="src/objects/abilities.ts"
import { defineAbility } from "reforged-map/objects";

export const FrostRain = defineAbility({
  rawcode: "A001",
  base: FourCC("AHbz"),
  fields: {
    anam: "Frost Rain",
    amcs: { 1: 77, 2: 99, 3: 121 },
    Hbz1: { 3: 11 },
    atp1: {
      1: "Frost Rain - [Level 1]",
      2: "Frost Rain - [Level 2]",
      3: "Frost Rain - [Level 3]",
    },
  },
});
```

A field without levels takes a plain value, and one with levels always a record: `amcs: 90` fails the type check. A field specific to some bases (Blizzard's `Hbz1`, its number of waves) is set only on an object of one of those bases, as the Object Editor shows it only there. The data pointer of an ability's, a doodad's or an upgrade's field comes from the field table, never from the definition.

## Localized values

A localizable text (a name, a tooltip) can carry a translation per locale of the game with `localized`: a default text, then one text per locale, `deDE`, `enUS`, `esES`, `esMX`, `frFR`, `itIT`, `koKR`, `plPL`, `ptBR`, `ruRU`, `zhCN` or `zhTW`:

```ts objects title="src/objects/captain.ts"
import { defineUnit, localized } from "reforged-map/objects";

export const Captain = defineUnit({
  rawcode: "h003",
  base: FourCC("hfoo"),
  fields: {
    unam: localized("Captain", { deDE: "Hauptmann", ptBR: "Capitão" }),
    utip: localized("Train a Captain", { ptBR: "Treinar um Capitão" }),
  },
});
```

The default text goes into the map folder's `war3map.wts`, and each translation into its locale's table, `_Locales/<locale>.w3mod/war3map.wts`, under the same `STRING n`: where the 3.0.1 World Editor and the game keep them ([the research](https://github.com/phmilk/reforged-ts/blob/master/docs/research/locales.md)). The game shows a locale's text to a player whose game runs in that locale, and the default text to every other. The World Editor has no screen for translations, so a definition is the way to write them. A localized value is only for a localizable field: `ua1t: localized("pierce")` fails the type check.

## The raw escape

A field the field table of `reforged-builtins` does not know (one a later Patch adds, or one another tool writes) goes in `raw`, with its field id, its value type (`"int"`, `"real"`, `"unreal"` or `"string"`), and for an ability, a doodad or an upgrade its level and data pointer (0 when left out):

```ts objects title="src/objects/raw.ts"
import { defineUnit } from "reforged-map/objects";

export const Scout = defineUnit({
  rawcode: "h004",
  base: FourCC("hfoo"),
  fields: { unam: "Scout" },
  raw: [{ field: "Xfoo", type: "int", value: 7 }],
});
```

A raw field the field table knows is refused: use `fields`, which types it.

## The build

The build merges every definition into its staged copy of the map folder, after staging and before packing, with `mergeObjectDefinitions`: the map it ships holds the definitions with no other step, and the map folder and the Object manifest are never written. The generated constants and overloads include the objects defined in code, named like the map folder's from their name field: `CustomUnits.Sergeant_h002`, whose hover says "Defined in code, by the Object definition in `src/objects/units.ts`." The [Rawcodes guide](rawcodes.md#custom-objects-of-the-map) shows them.

Definitions are checked before anything is written, and every problem is reported at once, each naming the file, the Rawcode and the field:

- **When they load**, on every build and every hover: a definition file that throws or imports what it may not, a Rawcode that is not four printable characters, a base that is not a Built-in object of its kind, a Rawcode defined twice in one kind. The hover of a Rawcode literal then says "Rawcode details are unavailable", naming the file, until it is fixed.
- **When the build or a sync uses them**: a field the kind does not have, a value outside its category, an integer beyond 32 bits, levels where the field has none, a field specific to other bases.
- **A collision** with an object the map folder defines or changes fails the build, suggesting adoption or another Rawcode.

An object the code owns that was changed in the map folder outside the code (below) does not fail the build: it warns, naming the fields, and the map ships the code's version.

## Object sync

The build's merge never shows a definition in the World Editor. **Object sync** writes the definitions into the map folder itself, so that the World Editor shows them, the Studio edits around them and `git diff` shows them: `pnpm objects:sync`, which calls `syncObjectDefinitions`. It writes them in the Editor form, as the 3.0 World Editor saves Object data, so that a World Editor save leaves them byte for byte: the package's World Editor contract fixture is a map folder synced from a definition of every kind and saved twice by the 3.0.1 World Editor, and a test asserts that a sync writes every file of it byte for byte.

A sync makes each defined object exactly its definition: a Custom object added, the fields its definition sets set, those it no longer sets removed. An owned object whose definition was deleted is removed: a Custom object entirely, a Built-in object's changes. A second sync with no change writes no byte.

```ts objects title="scripts/sync.ts"
import { syncObjectDefinitions } from "reforged-map";

const report = syncObjectDefinitions("my-map.w3m", ".", {
  worldEditorExecutable:
    "C:/Program Files (x86)/Warcraft III/_retail_/x86_64/World Editor.exe",
});
export const changed = [...report.added, ...report.changed, ...report.removed];
```

Its report lists the objects added, changed and removed, the files written, what the World Editor showed and the warnings. **It refuses**, writing nothing, when:

| Refusal                              | What to do                                                                                                                |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| A definition fails to load or check  | Fix the file, Rawcode and field named.                                                                                    |
| A collision                          | Adopt the object (`pnpm objects:adopt <rawcode>`), or choose another Rawcode.                                             |
| An owned object changed outside code | Copy each change listed into its definition, then sync; or sync with `--force` to overwrite them with the code's version. |
| The World Editor shows unsaved edits | Save or discard them in the World Editor, then sync.                                                                      |
| The Object manifest cannot be read   | Restore it from git, or resolve its merge conflict, then sync; never edit it by hand.                                     |

The change made outside the code is listed field by field, with the value the last sync wrote and the one the map folder holds:

```text
Objects the code owns were changed in the map folder outside the code since the last Object sync: nothing was written. Copy each change into its definition, or sync with force (pnpm objects:sync --force) to overwrite them with the code's version.
- The unit h002's uhpm is 420 in the Object manifest and 500 in the map folder.
```

`--force` overwrites such changes, and only them: it never overrides a collision, an invalid definition or the World Editor's unsaved edits. An agent never forces a sync on the author's behalf: it shows the refusal to the author.

**Removing a Custom object** drops its placements on the terrain at the World Editor's next save, and the game skips them; the sync warns. To stop defining an object in code and keep its placements, [release](#release-handing-an-object-back) it instead of deleting its definition.

## The Object manifest

Object sync records what the code owns in the **Object manifest**, `object-manifest.json` at the Map project's root: each owned object with what the last sync wrote of it, and each object a sync removed with what it last held. That record is how a sync tells a change made in the World Editor from its own work, and how it tells a removed object a stale World Editor save brought back from a new object made at its Rawcode.

- It is **committed**, so every clone and CI knows what the code owns.
- It is **never edited by hand**: Object sync, adoption and release write it, and the build only reads it.
- It is written byte-stably, sorted by Object kind and Rawcode, so two branches that sync different objects merge without a conflict. A conflict is resolved by keeping both sides' entries, then `pnpm objects:sync`.
- It lives outside the map folder, so the World Editor never imports it into the map.

## Adoption: moving an object into code

**Object adoption** hands objects made in the World Editor to the code: `pnpm objects:adopt h000`, several Rawcodes, or `--all`; `adoptObjects` in `reforged-map`. Each object gets a definition file, `src/objects/<kind>/<Name>_<rawcode>.ts`, named like its generated constant, and an entry in the manifest. The map folder is left byte for byte as it was, its placements included, so the World Editor needs no reload, and the next sync writes no byte.

```ts objects title="src/objects/unit/Captain_h000.ts"
import { defineUnit } from "reforged-map/objects";

export const Captain_h000 = defineUnit({
  rawcode: "h000",
  base: FourCC("hfoo"),
  fields: {
    unam: "Captain",
    uabi: [FourCC("A000")],
  },
});
```

The file holds every change the map folder holds, a value equal to the base's included; a translated text as a localized value; a field the field table does not know through the raw escape, with a comment and a warning. A reference stays `FourCC("A000")`: adopting a unit does not adopt the ability it names. A Rawcode two kinds share, such as a Custom buff and a Custom destructable both at `B000`, names its kind: `buff:B000`. Adoption refuses, writing nothing, an object the code already owns or defines, a Built-in object the map folder does not change, a file that exists, and a map the World Editor shows with unsaved edits.

## Release: handing an object back

**Object release** is adoption's reverse: `pnpm objects:release h000`, `releaseObjects` in `reforged-map`. The object is synced one last time, so the map folder holds it as the code last defined it, with its placements; then it leaves the manifest and its definition file is deleted. From then on the World Editor owns it, and the next sync leaves it alone.

A definition file that exports other definitions is refused: release never deletes code it does not own, so move the definition to a file of its own first. Like a sync, release refuses an object changed outside the code (unless `--force`) and a map the World Editor shows with unsaved edits.

## Object sync in `pnpm dev`

`pnpm dev` rebuilds on each change, and the build's merge already puts the definitions in the map it runs. To also see each change in the World Editor, `reforged.config.ts` has an option, off by default, that runs Object sync before each build of `pnpm dev`, watching `src/objects/` and the manifest. A sync it refuses is printed, and the build still runs with the definitions merged: the map folder waits until the author settles the refusal.

## Taking turns with the World Editor

The World Editor keeps the map it loaded in memory, and its next save writes all of it back. So the code and the World Editor take turns on the map folder:

1. **Before a sync, save or discard the World Editor's edits.** An edit not yet saved shows only in its window's title, `Warcraft III World Editor - [<map folder> *]`. Object sync, adoption and release read that title, and refuse while it ends in ` *]`: writing then would lose the edit, or have the sync's work lost at the World Editor's next save.
2. **After a sync, the World Editor reloads the map.** When a World Editor holds the map without unsaved edits, a sync that writes the map folder reloads it there, `World Editor.exe -launch -loadfile <map folder>`, so that its next save keeps what the sync wrote. The Template passes the executable it finds beside the game; without one, the sync warns to reload the map by hand (File > Open, the map folder).
3. **Edit an owned object in code, not in the Object Editor.** An edit of an owned object saved from the World Editor is a change made outside the code: the next sync refuses it and lists it, so that it is copied into the definition, or overwritten with `--force`. Edit the map's other objects in the World Editor as before, and adopt one to move it into code.

A World Editor that missed a reload and saves its stale copy brings back an object a sync removed: the next sync removes it again, with a warning, since the manifest remembers what it last held. Everything else in the map folder (terrain, placed units, triggers, the map's options) changes only through the World Editor.
