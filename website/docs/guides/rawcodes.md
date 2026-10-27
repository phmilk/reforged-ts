---
title: Rawcodes
sidebar_position: 14
description: How the Typings and the library type a Rawcode by its Object kind, with Rawcode<K>, what FourCC returns, the as cast for a computed number, widening to number, GUI variables of an object type, the Built-in objects, the Custom objects of the map and those defined in code, hover and go to definition on a Rawcode literal, the lint rule on unknown Rawcodes, and the codes that are not Rawcodes.
---

# Rawcodes

A Rawcode is the four-character id of one type of object, which a map script holds as an integer: the Footman's is `FourCC("hfoo")`, Blizzard's `FourCC("AHbz")`. The Natives take a Rawcode to create a unit, add an ability or count an upgrade, and return one to say which type a unit, an item or a spell is. A Rawcode of the wrong kind does not fail in Lua: the Native returns nothing or does nothing, and the mistake shows only in game, if at all.

The [Typings](typings.md) type each Rawcode by its Object kind, and the library's Wrappers take and return the same types, so a unit type's Rawcode where an ability's is expected, or a plain `number` where any Rawcode is expected, is a compile error. The types exist for the compiler alone: the emitted Lua is the same as for a plain number. [`Rawcode`](/typings/3.0.0/type-aliases/Rawcode), [`ObjectKind`](/typings/3.0.0/type-aliases/ObjectKind) and [`UnknownRawcode`](/typings/3.0.0/type-aliases/UnknownRawcode) are global types, like `FourCC`: they come with the Typings entry the Map project already lists in `types`, without an import.

## `Rawcode<K>` and `ObjectKind`

An Object kind is one of the seven families a type of object belongs to, the `ObjectKind` type:

| Kind             | An object of the kind                                                                      |
| ---------------- | ------------------------------------------------------------------------------------------ |
| `"unit"`         | The Footman's, `FourCC("hfoo")`; a hero is a unit, such as the Paladin's, `FourCC("Hpal")` |
| `"item"`         | Claws of Attack +15's, `FourCC("ratf")`                                                    |
| `"ability"`      | Blizzard's, `FourCC("AHbz")`                                                               |
| `"buff"`         | Timed Life's, `FourCC("BTLF")`                                                             |
| `"destructable"` | The Summer Tree Wall's, `FourCC("LTlt")`                                                   |
| `"doodad"`       | The Brazier's, `FourCC("LObr")`                                                            |
| `"upgrade"`      | Iron Forged Swords', `FourCC("Rhme")`                                                      |

`Rawcode<K>` is a Rawcode of the kind `K`: `CreateUnit` takes a `Rawcode<"unit">`, `UnitAddAbility` a `Rawcode<"ability">`, and `GetUnitTypeId` returns a `Rawcode<"unit">`, so what the game returns goes on to the next call without a cast:

```ts
const owner = Player(0);
if (owner !== undefined) {
  const footman = CreateUnit(owner, FourCC("hfoo"), 0, 0, 270);
  if (footman !== undefined) {
    // A second unit of the same type.
    CreateUnit(owner, GetUnitTypeId(footman), 128, 0, 270);

    // @ts-expect-error: a unit type's Rawcode where an ability's is expected
    UnitAddAbility(footman, GetUnitTypeId(footman));

    const count = 3;
    // @ts-expect-error: a plain number is not a Rawcode
    CreateUnit(owner, count, 0, 0, 270);
  }
}
```

A parameter that takes either of two kinds is typed with their union. A tech requirement is a unit type or an upgrade, so `SetPlayerTechResearched` and `GetPlayerTechCount` take a `Rawcode<"unit" | "upgrade">`: either kind is accepted, an item's is not, and a `Rawcode<"unit" | "upgrade">` is not accepted where a `Rawcode<"unit">` is.

A skin is typed with the kind of the Native that takes it: `BlzCreateUnitWithSkin` takes a unit type's Rawcode as the skin, such as the Knight's, `FourCC("hkni")`, and `BlzCreateItemWithSkin` an item's.

## `Rawcode` alone

`Rawcode`, without a kind, is a Rawcode of any kind: `GetObjectName` takes one, and gives the name of a unit, an item, an ability or any other type of object. It accepts a Rawcode of every kind, but still not a plain `number`:

```ts
import { Init, MapPlayer, Unit } from "reforged-ts";

function describe(rawcode: Rawcode): string {
  return GetObjectName(rawcode) ?? "an unknown object";
}

Init.onGameStart(() => {
  const owner = MapPlayer.fromIndex(0);
  if (owner === undefined) {
    return;
  }
  const footman = Unit.create(owner, FourCC("hfoo"), 0, 0);
  print(describe(footman.typeId));
  print(describe(GetSpellAbilityId()));

  // @ts-expect-error: a plain number is not a Rawcode
  print(describe(footman.id));
});
```

## `FourCC` and `UnknownRawcode`

`FourCC` returns an `UnknownRawcode`: a Rawcode whose kind the compiler does not know, which every Rawcode parameter accepts. A literal goes wherever a Rawcode is expected, so the `FourCC` calls written for w3ts compile unchanged, and so does a comparison with what the game returns:

```ts
import { Init, MapPlayer, Unit } from "reforged-ts";

Init.onGameStart(() => {
  const owner = MapPlayer.fromIndex(0);
  if (owner === undefined) {
    return;
  }
  const footman = Unit.create(owner, FourCC("hfoo"), 0, 0);
  footman.addAbility(FourCC("AHtc"));
  if (footman.typeId === FourCC("hfoo")) {
    print("A Footman, with Thunder Clap.");
  }
});
```

The other side of it: since the kind of a literal is unknown, a literal of the wrong kind compiles too. `Unit.create(owner, FourCC("AHbz"), 0, 0)` passes Blizzard's Rawcode where a unit type's is expected, and fails only in game, as it did before. A constant that holds a literal is an `UnknownRawcode` as well. Annotate it with its kind, and the compiler checks every use of the constant from there on:

```ts
import { Init, MapPlayer, on, Unit, UnitEvents } from "reforged-ts";

const HOLY_LIGHT: Rawcode<"ability"> = FourCC("AHhb");

Init.onTriggers(() => {
  on(
    UnitEvents.spellEffect,
    ({ caster }) => {
      print(`${caster.getOwner().name} cast Holy Light.`);
    },
    ({ abilityId }) => abilityId === HOLY_LIGHT,
  );
});

function summon(owner: MapPlayer): Unit {
  // @ts-expect-error: an ability's Rawcode where a unit type's is expected
  return Unit.create(owner, HOLY_LIGHT, 0, 0);
}
```

## Widening to `number`

A Rawcode is a `number`, so it goes wherever a `number` does: arithmetic, comparisons, formatting, a Lua table's key. What arithmetic gives back is a plain `number`, not a Rawcode. Arrays of Rawcodes and `Map`s keyed by them keep their kind:

```ts
import { Init, MapPlayer, Unit } from "reforged-ts";

const spawns: Rawcode<"unit">[] = [FourCC("hfoo"), FourCC("hkni")];
const bounties = new Map<Rawcode<"unit">, number>([
  [FourCC("hfoo"), 10],
  [FourCC("hkni"), 25],
]);

Init.onGameStart(() => {
  const owner = MapPlayer.fromIndex(0);
  if (owner === undefined) {
    return;
  }
  for (const unitId of spawns) {
    const unit = Unit.create(owner, unitId, 0, 0);
    const bounty: number = bounties.get(unit.typeId) ?? 0;
    const asNumber: number = unit.typeId;
    print(`${asNumber} is worth ${bounty} gold.`);
  }
});
```

## From a `number`: the `as` cast

Where the compiler cannot know the kind, because the Rawcode was computed or read back as a plain `number` (from a save code, a [sync](systems.md#sync) message, a table of integers), the Map project says it with a cast, naming the kind:

```ts
import { MapPlayer, Unit } from "reforged-ts";

// Recreates a hero from the unit type a save code stored as a number.
function loadHero(owner: MapPlayer, savedTypeId: number): Unit {
  return Unit.create(owner, savedTypeId as Rawcode<"unit">, 0, 0);
}

function loadHeroUnchecked(owner: MapPlayer, savedTypeId: number): Unit {
  // @ts-expect-error: a plain number is not a Rawcode
  return Unit.create(owner, savedTypeId, 0, 0);
}
```

There is no helper function for it, on purpose. A helper would check nothing more than the cast does: nothing tells it whether the object exists, and in Lua it would be one more function call doing what the cast does for free, since the cast emits nothing. The cast keeps the one place where the kind is the Map project's word, not the compiler's, written out and searchable: `as Rawcode`. The library itself contains none: every Rawcode it passes on came from the Map project or from the game.

## In the library

Every API of the library that takes or returns a Rawcode says which kind, as the Natives behind it do, and none keeps an overload that takes a plain `number`:

- `Unit.create` takes a `Rawcode<"unit">`, `unit.addAbility` a `Rawcode<"ability">`, `Item.create` a `Rawcode<"item">`, and `MapPlayer`'s tech members, such as `getTechCount` and `setTechResearched`, a `Rawcode<"unit" | "upgrade">`.
- `unit.typeId`, `item.typeId`, `destructable.typeId` and the `skin` of a unit or an item carry their kind, and so do the payloads of the Event descriptors that read a Rawcode: the `abilityId` of `UnitEvents.spellEffect` is a `Rawcode<"ability">`.
- An API that takes a name or a Rawcode takes `string | Rawcode<…>`: the spell effects of `Effect` take an ability's name or its Rawcode, `unit.issueBuildOrder` a structure's order name or its unit type's Rawcode.
- A creation that fails names the Rawcode in four characters, as before: `reforged-ts: failed to create Unit (hfoi)` when the Footman's Rawcode is misspelt.

## GUI variables of an object type

A map whose triggers are made in the World Editor keeps Rawcodes in GUI variables: a Unit-Type `SpawnType`, an Ability Code `HeroSpell`, an Item-Type array `Rewards`. The World Editor writes each one into `war3map.lua` as a plain integer, and the code sees it as an Editor global, `udg_SpawnType`, declared in `src/generated/editor-globals.d.ts`. That file is written by `reforged-map`, a dev dependency of the Template that reads the map folder at build time. It declares each of these variables with the Object kind its Variable Editor type names:

| Variable Editor type                   | Declared                       |
| -------------------------------------- | ------------------------------ |
| Unit-Type (`unitcode`)                 | `Rawcode<"unit">`              |
| Item-Type (`itemcode`)                 | `Rawcode<"item">`              |
| Ability Code (`abilcode`)              | `Rawcode<"ability">`           |
| Buff (`buffcode`)                      | `Rawcode<"buff">`              |
| Destructible-Type (`destructablecode`) | `Rawcode<"destructable">`      |
| Tech-Type (`techcode`)                 | `Rawcode<"unit" \| "upgrade">` |
| Order (`ordercode`)                    | `number`, an order id          |

An array of one of these types is a `Record<number, T>` of the same type: an Item-Type array is a `Record<number, Rawcode<"item">>`. These are all the types of the Variable Editor of Patch 3.0 that name an Object kind: it has no upgrade-only type and no doodad type. Every other type keeps the type it had. An Integer is a `number`, and so is each type the game stores as an integer that is not a Rawcode, such as Animation Type, Terrain Type, Equipment Type and Tag, whose values are constants of `common.j` or terrain codes.

Such a variable goes where its kind is expected with no cast, and a Rawcode of another kind does not:

```ts
import { Init, MapPlayer, Unit } from "reforged-ts";

// What src/generated/editor-globals.d.ts declares for these GUI variables.
declare let udg_SpawnType: Rawcode<"unit">;
declare let udg_HeroSpell: Rawcode<"ability">;
declare let udg_Rewards: Record<number, Rawcode<"item">>;
declare let udg_Research: Rawcode<"unit" | "upgrade">;
declare let udg_Retreat: number;

Init.onGameStart(() => {
  const owner = MapPlayer.fromIndex(0);
  if (owner === undefined) {
    return;
  }
  const hero = Unit.create(owner, udg_SpawnType, 0, 0);
  hero.addAbility(udg_HeroSpell);
  hero.addItemById(udg_Rewards[1]);
  owner.setTechResearched(udg_Research, 1);
  IssueImmediateOrderById(hero.handle, udg_Retreat);

  // @ts-expect-error: a unit type's Rawcode where an ability's is expected
  hero.addAbility(udg_SpawnType);
  // @ts-expect-error: a tech type may be an upgrade, where a unit type's Rawcode is expected
  Unit.create(owner, udg_Research, 0, 0);
});
```

Code that writes one of these variables, for the GUI triggers to read, writes a Rawcode of its kind: a `FourCC` literal, what the game returns or another variable of the kind. A plain `number`, or a Rawcode of another kind, is a compile error, so a trigger never reads a value of the wrong kind:

```ts
import { Init, on, UnitEvents } from "reforged-ts";

// What src/generated/editor-globals.d.ts declares for these GUI variables.
declare let udg_SpawnType: Rawcode<"unit">;
declare let udg_HeroSpell: Rawcode<"ability">;

Init.onTriggers(() => {
  udg_SpawnType = FourCC("hkni");
  on(UnitEvents.death, ({ unit }) => {
    // The next wave spawns what died last.
    udg_SpawnType = unit.typeId;
  });

  const level = 2;
  // @ts-expect-error: a plain number is not a Rawcode
  udg_SpawnType = level;
  // @ts-expect-error: an ability's Rawcode where a unit type's is expected
  udg_SpawnType = udg_HeroSpell;
});
```

### Where the kind comes from

The kind comes from the type picked in the Variable Editor, which the World Editor stores in the map folder's `war3map.wtg`, and not from the Rawcode the variable holds: a Unit-Type variable is a `Rawcode<"unit">` whatever its initial value, and without one. When a kind is wrong, change the variable's type in the Variable Editor; never cast the variable.

An Order variable holds an order id, such as `OrderId` returns (see [Codes that are not Rawcodes](#codes-that-are-not-rawcodes)). The World Editor of Patch 3.0 cannot save one with an initial value: it writes the order's name into the script as it is, and its script check fails. Set it from code instead, such as `udg_Retreat = OrderId("stop")`.

The declarations are written again on every install, every build and every rebuild of `pnpm dev`, which watches the map folder: a type changed in the Variable Editor reaches the code at the next save. They are generated files: a variable is added, renamed or retyped in the World Editor, never in `src/generated/`.

When `war3map.wtg` is missing, cannot be read or is in a format `reforged-map` does not know, and the map has GUI variables, the build goes on and prints one warning, such as:

```txt
Warning: war3map.wtg not found: Unit-Type, Ability Code, Item-Type... variables keep the type war3map.lua gives them, not their Object kind.
```

Each of these variables then keeps the type `war3map.lua` gives it, which every Rawcode parameter rejects: a `number`, or a `Record<number, number>` for an array, when the World Editor saved the map; when HiveWE saved it, `unknown`, or a `Record<number, string>` for an array, since HiveWE writes `nil` and `__jarray("")` for them. Saving the map with the World Editor of Patch 3.0 writes `war3map.wtg` in the format `reforged-map` reads, that of 1.31 and later, which HiveWE writes as well. A variable that `war3map.wtg` declares an array and `war3map.lua` does not, or the other way round, keeps the type `war3map.lua` gives it, and a warning names it.

### A Map project generated earlier

A Map project generated from the Template before `reforged-map` declares its GUI variables with the copy of `scripts/editor-globals.ts` it was generated with, and that copy declares each of them `number`. To have them declared by kind, switch to the package as the Template does:

1. Add it as a dev dependency: `pnpm add -D reforged-map@next`.
2. In `scripts/generate.ts`, replace the editor globals `Generator` imported from `./editor-globals.ts` with one that calls `reforged-map`, passes on its warnings and turns its `MapFolderError` into the Template's `AuthorError`:

   ```ts fragment
   import { generateEditorGlobals, MapFolderError } from "reforged-map";
   import { AuthorError } from "./errors.ts";

   export const generateEditorGlobalsFiles: Generator = (config, warn) => {
     try {
       const { files, warnings } = generateEditorGlobals(config.mapFolder);
       for (const warning of warnings) warn(warning);
       return files;
     } catch (error) {
       if (error instanceof MapFolderError)
         throw new AuthorError(error.message);
       throw error;
     }
   };
   ```

3. In `tests/harness/compile.ts`, import `LUA_STUB_FILE` from `reforged-map` in place of `scripts/editor-globals.ts`. Then delete `scripts/editor-globals.ts` and its test, `tests/pipeline/editor-globals.test.ts`.
4. Run `pnpm install`: the declarations are written again, and each `as Rawcode<…>` cast written for a `udg_` variable can go.

The generated files keep their names, `editor-globals.d.ts` and `editor-globals.lua`, and the Lua stub the tests load is the same as before.

## The Built-in objects: `reforged-builtins`

`reforged-builtins` holds the Built-in objects of each Patch, the objects the game ships rather than the map: for each one, its Rawcode, its Object kind, its race, its enUS name and the Game data sets that hold it. With it, a `FourCC` literal of a Built-in object has its kind, and each object has a constant named after it. It is optional: a Map project that does not list it keeps every literal an `UnknownRawcode`, as above.

:::note[Install]
`pnpm add -D reforged-builtins@next`. The Template does not install it yet: add it to a Map project yourself.
:::

### The overloads: literals with no edit

Add the package's overloads' entry for the Game version next to the Typings' in `types`. The order does not matter:

```json title="tsconfig.json"
{
  "compilerOptions": {
    "types": ["reforged-types/3.0.0", "reforged-builtins/3.0.0"]
  }
}
```

Every `FourCC` literal of a Built-in object is then a Rawcode of its kind, with no edit to the code: `FourCC("hfoo")` is a `Rawcode<"unit">`, and the Footman's name shows on hover. A literal of the wrong kind becomes a compile error, and a literal the package does not know, such as a Custom object's `FourCC("h000")`, is still an `UnknownRawcode` and compiles everywhere. The emitted Lua does not change:

```ts builtins
import { Init, MapPlayer, Unit } from "reforged-ts";

Init.onGameStart(() => {
  const owner = MapPlayer.fromIndex(0);
  if (owner === undefined) {
    return;
  }
  const footman = Unit.create(owner, FourCC("hfoo"), 0, 0);
  footman.addAbility(FourCC("AHtc"));

  // @ts-expect-error: Blizzard is an ability, where a unit type's Rawcode is expected
  Unit.create(owner, FourCC("AHbz"), 0, 0);

  // A Custom object of the map: still an UnknownRawcode.
  Unit.create(owner, FourCC("h000"), 0, 0);
});
```

A constant that holds a literal takes its kind too, with no annotation:

```ts builtins
const footman = FourCC("hfoo");
const spawns = [FourCC("hfoo"), FourCC("hkni")];

// @ts-expect-error: a unit type's Rawcode is not an ability's
const spell: Rawcode<"ability"> = footman;

const firstSpawn: Rawcode<"unit"> = spawns[0];
```

### The constants

Each Object kind has its entry point and its constants object: `reforged-builtins/units` exports `Units`, `/items` `Items`, `/abilities` `Abilities`, `/buffs` `Buffs`, `/destructables` `Destructables`, `/doodads` `Doodads` and `/upgrades` `Upgrades`. Each constant is a Rawcode of its kind, and in Lua the same integer `FourCC` gives. Import the kinds a file uses, one at a time: a bundle carries only the kinds it imports.

```ts builtins
import { Abilities } from "reforged-builtins/abilities";
import { Units } from "reforged-builtins/units";
import { Init, MapPlayer, Unit } from "reforged-ts";

Init.onGameStart(() => {
  const owner = MapPlayer.fromIndex(0);
  if (owner === undefined) {
    return;
  }
  const paladin = Unit.create(owner, Units.Paladin_Hpal, 0, 0);
  paladin.addAbility(Abilities.Blizzard_AHbz);
  if (paladin.typeId === Units.Paladin_Hpal) {
    print("A Paladin, with Blizzard.");
  }
});
```

A constant is named from the enUS name in PascalCase, then `_` and the Rawcode as cased. Colour codes, accents, apostrophes and punctuation are dropped, and a name that starts with a digit gets a leading `_`. Claws of Attack +15 is `Items.ClawsOfAttack15_ratf`, and Iron Forged Swords `Upgrades.IronForgedSwords_Rhme`. The Rawcode suffix keeps two objects of one name apart: `Units.Footman_hfoo` and `Units.Footman_sfoo`. The [package's README](https://github.com/phmilk/reforged-ts/tree/master/packages/reforged-builtins) gives the rules in full.

Literals and constants are the same integers, and the overloads check both. Keep the literals a map already has: the constants are there for the names, not as a replacement.

### Game data sets

A map's objects follow two of its options in the World Editor: its Game Data Set (Default, Custom or Melee) and its Game Data Version (Reign of Chaos, The Frozen Throne or Forsaken Kingdom). Each pair the game tells apart is a Game data set of the package, so an object of one may be missing from another. A new map is of Forsaken Kingdom, whose sets hold every object; Default reads Custom, or Melee on a melee map. The constants cover all the sets. An object's hover says, by Game Data Version, which sets hold it when not every one does: the Scarlet Crusade's Footman, `Units.Footman_sfoo`, reads "Forsaken Kingdom only."; an object of The Frozen Throne, "Not in Reign of Chaos."; one that a version holds in one of its two sets, "Melee only in The Frozen Throne." Such a constant still compiles in a map of The Frozen Throne, and the Native it is passed to finds nothing in game: read the hover before using an object in a map of an earlier Game Data Version.

### What it does not hold

- **The map's own objects.** Custom objects, and a map's changes to Built-in ones, are in the map folder: [`reforged-map`](https://github.com/phmilk/reforged-ts/tree/master/packages/reforged-map) reads it at build time, as for the [GUI variables](#gui-variables-of-an-object-type), and [names them](#custom-objects-of-the-map).
- **Tooltips, numbers and icons.** The package holds identifiers only. Tooltips and icons are the hover tool's.

### Check-time cost

The overloads cost type-check time for each literal `FourCC` call, and nothing at run time. Measured with `pnpm --filter reforged-builtins builtins:measure` on a Map project with the 4,651 overloads of 3.0.0, the median of 7 runs, 1,000 literal calls took 6,942 ms more to check: about 6.9 ms per call, and between 6.6 and 7.0 ms over three runs on one machine. A Map project of thousands of literal calls pays seconds per check. A constant costs no overload resolution: it is a property read.

### Notice

`reforged-builtins` is not affiliated with or endorsed by Blizzard Entertainment. Warcraft is a trademark of Blizzard Entertainment. The names and Rawcodes are derived from the game's data and are not licensed by the package. Its code is MIT, as the rest of reforged-ts.

## Custom objects of the map

A Custom object is one the map adds in the World Editor's Object Editor: a unit Captain, `h000`, derived from the Footman, or an ability Arctic Blizzard, `A000`, derived from Blizzard. It exists only in the map folder's Object data, so `reforged-builtins` does not know it. `reforged-map` reads that Object data at build time and writes two things into `src/generated/`: a constant per Custom object, and a `FourCC` overload per Custom object and per Built-in object the map modifies.

Objects defined in code, the [Object definitions](object-definitions.md) of `src/objects/`, get constants and overloads like the map folder's, whose TSDoc names the definition's file.

:::note[In the Template]
The Template writes them once its build calls `reforged-map` for the map's objects ([phmilk/reforged-ts-template#87](https://github.com/phmilk/reforged-ts-template/issues/87)). A Map project generated before that turns them on as [Turning them on in a Map project generated earlier](#turning-them-on-in-a-map-project-generated-earlier) says.
:::

### Custom constants

Each Object kind has a generated module of its Custom objects: `custom-units.ts` exports `CustomUnits`, `custom-items.ts` `CustomItems`, and so on for `CustomAbilities`, `CustomBuffs`, `CustomDestructables`, `CustomDoodads` and `CustomUpgrades`. A module is written even when the map has no object of its kind, so an import never breaks when the last one goes. For the map above, two of them read:

```ts title="src/generated/custom-units.ts"
// Generated by reforged-map from the map folder's Object data on every install, build and watch.
// Do not edit: create and rename the objects in the World Editor.
// Each value is the integer FourCC returns for the Rawcode: its four bytes, big-endian.

/**
 * The Custom units of this map, each named by its name and Rawcode.
 */
export const CustomUnits = {
  /**
   * Captain (`h000`), a Custom unit of this map, derived from Footman (`hfoo`).
   */
  Captain_h000: 1747988528 as Rawcode<"unit">,
} as const;
```

```ts title="src/generated/custom-abilities.ts"
// Generated by reforged-map from the map folder's Object data on every install, build and watch.
// Do not edit: create and rename the objects in the World Editor.
// Each value is the integer FourCC returns for the Rawcode: its four bytes, big-endian.

/**
 * The Custom abilities of this map, each named by its name and Rawcode.
 */
export const CustomAbilities = {
  /**
   * Arctic Blizzard (`A000`), a Custom ability of this map, derived from Blizzard (`AHbz`).
   */
  ArcticBlizzard_A000: 1093677104 as Rawcode<"ability">,
} as const;
```

Each constant is a Rawcode of its kind, and in Lua the same integer `FourCC` gives, with no call. The code imports the kinds it uses, as it imports those of `reforged-builtins`:

```ts title="src/main.ts"
import { Init, MapPlayer, Unit } from "reforged-ts";
import { CustomAbilities } from "./generated/custom-abilities";
import { CustomUnits } from "./generated/custom-units";

Init.onGameStart(() => {
  const owner = MapPlayer.fromIndex(0);
  if (owner === undefined) {
    return;
  }
  const captain = Unit.create(owner, CustomUnits.Captain_h000, 0, 0);
  captain.addAbility(CustomAbilities.ArcticBlizzard_A000);
  if (captain.typeId === CustomUnits.Captain_h000) {
    print("The Captain, with Arctic Blizzard.");
  }

  // @ts-expect-error: a unit type's Rawcode where an ability's is expected
  captain.addAbility(CustomUnits.Captain_h000);
});
```

A constant is named as those of `reforged-builtins` are: the name in PascalCase, then `_` and the Rawcode as cased, so a Custom unit Chevalier Élu, `h001`, is `CustomUnits.ChevalierElu_h001`. The name is the one the Object Editor shows. A Custom object whose name was never changed has its base's, so a copy of the Footman left unnamed is `CustomUnits.Footman_h002`. The Rawcode suffix keeps two objects of one name apart. A Rawcode with a character that cannot end an identifier gets no constant, and a warning says so. Only Custom objects have constants here: a Built-in object the map modifies keeps its constant in `reforged-builtins`, such as `Units.Footman_hfoo`.

To find a Custom object's Rawcode by its name, read the generated modules: each constant's name ends with it, and its hover gives the name, the Rawcode and the base.

### The overloads: literals of the map's objects

`src/generated/map-objects.d.ts` declares a `FourCC` overload for each Custom object, so a literal has its kind as the constant does, and its hover gives the object's name and base:

```ts fragment
/**
 * Captain (`h000`), a Custom unit of this map, derived from Footman (`hfoo`).
 *
 * Its constant is `CustomUnits.Captain_h000`, from the generated `custom-units.ts`.
 */
declare function FourCC(id: "h000"): Rawcode<"unit">;
```

The literals written for w3ts, or copied from community code, then carry their kind with no edit, and a literal of the wrong kind is a compile error:

```ts
import { Init, MapPlayer, Unit } from "reforged-ts";

// What src/generated/map-objects.d.ts declares for these objects, next to the Typings' FourCC.
declare function FourCC(id: "h000"): Rawcode<"unit">;
declare function FourCC(id: "A000"): Rawcode<"ability">;
declare function FourCC(id: string): UnknownRawcode;

Init.onGameStart(() => {
  const owner = MapPlayer.fromIndex(0);
  if (owner === undefined) {
    return;
  }
  const captain = Unit.create(owner, FourCC("h000"), 0, 0);
  captain.addAbility(FourCC("A000"));

  // @ts-expect-error: Arctic Blizzard is an ability, where a unit type's Rawcode is expected
  Unit.create(owner, FourCC("A000"), 0, 0);
});
```

A literal the map does not define, such as a typo `FourCC("h00O")`, is still an `UnknownRawcode` and compiles everywhere, as before.

A Built-in object the map modifies gets an overload too, which gives the map's name next to the game's: a Footman renamed Militia reads "Footman (`hfoo`), a Built-in unit of Patch 3.0.0, named Militia in this map", and one changed in another field "which this map modifies". Its overload names the constant of `reforged-builtins`. With the [overloads of `reforged-builtins`](#the-overloads-literals-with-no-edit) turned on, both packages declare `FourCC("hfoo")`. The map's overload comes first, because `map-objects.d.ts` is a file of the Map project's `src/`, so the hover shows the map's name. Both return a `Rawcode<"unit">`: only the hover differs.

### A Rawcode two kinds share

The World Editor numbers Custom destructables from `B000` whatever their base, and Custom buffs from the first letter of theirs, `B` for every Built-in buff. A map with a Custom buff and a Custom destructable has both at `B000`. Such a Rawcode gets no overload and no warning: `FourCC("B000")` stays an `UnknownRawcode`, which every Rawcode parameter accepts. Each constant keeps its exact kind, so the constants are the way to name either object:

```ts
import { Destructable, Init, MapPlayer, Unit } from "reforged-ts";

// What src/generated/custom-buffs.ts and custom-destructables.ts export for B000.
declare const CustomBuffs: { readonly HolyFire_B000: Rawcode<"buff"> };
declare const CustomDestructables: {
  readonly Gate_B000: Rawcode<"destructable">;
};

Init.onGameStart(() => {
  const owner = MapPlayer.fromIndex(0);
  if (owner === undefined) {
    return;
  }
  const footman = Unit.create(owner, FourCC("hfoo"), 0, 0);
  footman.applyTimedLife(CustomBuffs.HolyFire_B000, 60);
  Destructable.create({ typeId: CustomDestructables.Gate_B000, x: 256, y: 0 });

  // @ts-expect-error: the Gate is a destructable, where a buff's Rawcode is expected
  footman.applyTimedLife(CustomDestructables.Gate_B000, 60);
});
```

### Regeneration and renames

The constants and the overloads are written again on every install, every build and every rebuild of `pnpm dev`, which watches the map folder: an object created in the Object Editor reaches the code at the next save. They are generated files: an object is created and renamed in the World Editor, never in `src/generated/`.

A rename in the Object Editor renames the object's constant, and the build fails at each use of the old name until the code follows. That is the point: each place that named the object is found. Follow the rename; never cast. A literal keeps compiling, since the Rawcode did not change. An object deleted in the World Editor loses its constant and its overload: each use of its constant fails to compile, and its literals become `UnknownRawcode`s again.

A file of the map's Object data that `reforged-map` cannot read is left out, and the build goes on with a warning naming it, such as:

```txt
Warning: war3map.w3u not read (unknown format version 4): its objects are left out. Save the map with the World Editor of 3.0.
```

The [package's README](https://github.com/phmilk/reforged-ts/tree/master/packages/reforged-map#the-maps-objects) lists every warning, and what it reads in which format.

### Check-time cost of the map's overloads

The overloads cost type-check time for each literal `FourCC` call, and nothing at run time. Measured with `pnpm --filter reforged-map map:measure` on a Map project of 500 Custom units, 1,000 literal calls cost 0.45 to 2.3 ms each, depending on the machine's load: about a sixth of what the 4,651 overloads of `reforged-builtins` cost on the same machine. A map holds tens to hundreds of objects, so its overloads are on in every Map project that generates them. A constant costs no overload resolution.

### Turning them on in a Map project generated earlier

A Map project generated before the Template wrote the map's objects turns them on in three steps. It needs a release of `reforged-map` that writes them:

1. Add both packages as dev dependencies: `pnpm add -D reforged-map@next reforged-builtins@next`. `reforged-builtins` names a Custom object that keeps its base's name after its base. Its overloads stay off until its entry is in `types`.
2. In `scripts/generate.ts`, add a `Generator` that calls `reforged-map` for the map's objects and passes on its warnings, and run it after the Editor globals' one, which already turns a missing map folder into an `AuthorError`:

   ```ts fragment
   import { generateObjects } from "reforged-map";

   export const generateObjectsFiles: Generator = (config, warn) => {
     const { files, warnings } = generateObjects(config.mapFolder, {
       projectRoot: config.root,
     });
     for (const warning of warnings) warn(warning);
     return files;
   };

   export const GENERATORS: readonly Generator[] = [
     generateEnv,
     generateEditorGlobalsFiles,
     generateObjectsFiles,
   ];
   ```

3. Run `pnpm install`: the constants and the overloads are written into `src/generated/`, which the Template's `.gitignore` already leaves out.

## Hover and go to definition on a Rawcode literal

The overloads document an object on the hover of `FourCC`, the identifier. The literal itself says what it names through the TypeScript plugin of `reforged-map`, `reforged-map/typescript-plugin`: hovering `"h000"` shows the object, and go to definition on it goes to its constant. It reads the map folder through the same lookup as [the lint rule](#unknown-rawcodes-the-lint-rule) and the generated code, so all three agree, and it follows a World Editor save without `pnpm dev` or a build: an object saved in the Object Editor shows on the first hover a second after the save.

:::note[In the Template]
The Template enables it ([phmilk/reforged-ts-template#88](https://github.com/phmilk/reforged-ts-template/issues/88)). A Map project generated earlier adds the one entry below to the `compilerOptions` of its tsconfig, with `reforged-map` and `reforged-builtins` installed as [Turning them on in a Map project generated earlier](#turning-them-on-in-a-map-project-generated-earlier) says:

```json
"plugins": [{ "name": "reforged-map/typescript-plugin" }]
```

:::

### What it reads

The literals the lint rule reads, at the position hovered:

- the single argument of the global `FourCC`, a string or a template literal without substitutions: `FourCC("hfoo")`, ``FourCC(`hfoo`)``;
- a number literal, decimal or hex, cast to a Rawcode type with `as` or an angle-bracket assertion: `1751543663 as Rawcode<"unit">`, `<Rawcode>0x68666f6f`.

A computed argument, `FourCC(name)` or ``FourCC(`h00${i}`)``, a function of the Map project named `FourCC`, a cast to `number` and `0` are left to TypeScript, and so is the hover of `FourCC`, the identifier.

### What the hover shows

| The literal names                           | The hover                                                                                                                                                                              |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| a Built-in object                           | "**Footman** (`hfoo`), a Built-in unit of Patch 3.0.0.", its race, the Game data sets that hold it, and its constant, `Units.Footman_hfoo`, from `reforged-builtins/units`             |
| a Built-in object the map modifies          | the same, with the map's name: "named Militia in this map", or "which this map modifies"                                                                                               |
| a Custom object                             | "**Captain** (`h000`), a Custom unit of this map, derived from Footman (`hfoo`).", its base's race, and its constant, `CustomUnits.Captain_h000`, from the generated `custom-units.ts` |
| two objects, a Rawcode two kinds share      | "`B000` names a Custom buff and a Custom destructable, so `FourCC` gives no single kind.", then both objects                                                                           |
| a Built-in object outside the Game data set | the object, then "`Asa2` (Pillage) is a Built-in ability of Patch 3.0.0 but not of this map's Game data set (Melee (Forsaken Kingdom))."                                               |
| nothing                                     | "`h00A` is neither a Built-in object of Patch 3.0.0 nor an object of this map.", then up to three Rawcodes one edit away, each with its name and kind, a change of case first          |
| nothing, the literal is not four characters | "`hfo` is not a Rawcode: a Rawcode is exactly four ASCII characters."                                                                                                                  |

A cast number first shows the Rawcode it decodes to, "`1751543663` is the Rawcode `hfoo`.", or the bytes that are not one.

Go to definition goes to the declaration of each object's constant: in `reforged-builtins` for a Built-in object, modified or not, in the generated module for a Custom one, both for `B000`. An object whose constant cannot be found goes to its `FourCC` overload. An unknown or malformed literal gets TypeScript's own result.

### The map folder

Without an option, the plugin reads the one map folder at the project's root, a folder whose name ends in `.w3x` or `.w3m`, as the lint rule does: the Template keeps its map there, and the Creation CLI names it after the project (`my-map.w3m`). With none at the root, it falls back to the one under `maps/`, where a Map project made before the move keeps its map, until 1.0.0. One at the root wins over any under `maps/`. A map folder elsewhere is named by `mapFolder` in the plugin's entry, absolute or relative to the project root, the folder of the Map project's `package.json`, so `tests/lua/tsconfig.json`, which extends the same entry, reads the same folder:

```json
"plugins": [{ "name": "reforged-map/typescript-plugin", "mapFolder": "game/my-map.w3x" }]
```

With no map folder, with several at the root, or none there and several under `maps/`, with the map folder missing or unreadable, the hover of a Rawcode literal is one line, "Rawcode details are unavailable:", then the reason. The hover resumes on its own once the cause is fixed, with no restart.

### The editor's TypeScript

The plugin runs inside tsserver, and tsserver loads a project's plugins only when it is the Map project's own TypeScript, from its `node_modules`. Every editor that runs it shows the hover:

- **VS Code**: "TypeScript: Select TypeScript Version", then "Use Workspace Version". The Template's `.vscode/settings.json` asks for it on the first open.
- **Neovim**: `ts_ls` (typescript-language-server) and `vtsls` start the workspace's TypeScript when `node_modules/typescript` exists; for `vtsls`, set `vtsls.autoUseWorkspaceTsdk` to `true`.
- **Zed**: its TypeScript support runs `vtsls`; set `autoUseWorkspaceTsdk` to `true` in the `vtsls` settings of the project's `.zed/settings.json`.
- **WebStorm**: Settings > Languages & Frameworks > TypeScript, with the TypeScript field set to the project's `node_modules/typescript`.

VS Code's TypeScript 7 extension runs no tsserver plugin: under it, the plugin does not load, and the generated overloads and constants still document each object. The plugin writes to the tsserver log, each line starting with `reforged-map/typescript-plugin:`: that it loaded, with the project root and the map folder it read, and each reason Rawcode details are off, once. In VS Code, "TypeScript: Open TS Server log" opens it. Without `reforged-builtins` installed, the log says so and the plugin stays off.

## Unknown Rawcodes: the lint rule

A literal no overload knows still compiles: `FourCC("h00A")` returns an `UnknownRawcode`, and every Rawcode parameter takes it, so a typo, or a Custom object the map does not have, fails only in game, where the creator returns nothing. The lint rule [`no-unknown-rawcodes`](lint-rules/no-unknown-rawcodes.md) of `eslint-plugin-reforged` reports it as a warning, in the editor and in `pnpm lint`:

| The literal                                 | The warning                                                                                                                                         |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| names nothing                               | "`h00A` is neither a Built-in object of Patch 3.0.0 nor an object of this map", with up to three suggestions: "Replace with `h000` (Captain, unit)" |
| a Built-in object outside the Game data set | "`Asa2` (Pillage) is a Built-in ability of Patch 3.0.0 but not of this map's Game data set (Melee (Forsaken Kingdom))"                              |
| is not four characters                      | "`hfo` is not a Rawcode: a Rawcode is exactly four ASCII characters"                                                                                |

It reads the literals the hover reads, through the same lookup, so the rule, the hover and the generated code agree, and its suggestions are the Rawcodes the hover lists one edit away. It follows a World Editor save without a build, and writes nothing. A Rawcode of the wrong Object kind is the type checker's, and a Rawcode two kinds share passes.

:::note[In the Template]
The Template has `reforged-map` and `reforged-builtins` ([phmilk/reforged-ts-template#68](https://github.com/phmilk/reforged-ts-template/issues/68), [phmilk/reforged-ts-template#87](https://github.com/phmilk/reforged-ts-template/issues/87)) and keeps its map folder at its root, where the rule finds it, as it does one under `maps/` until 1.0.0: nothing to set. A Map project generated earlier installs both as [Turning them on in a Map project generated earlier](#turning-them-on-in-a-map-project-generated-earlier) says. A map folder elsewhere is named by `settings.reforged.mapFolder` in `eslint.config.mjs`, absolute or relative to the project root:

```js
{
  settings: {
    reforged: {
      mapFolder: "game/my-map.w3x";
    }
  }
}
```

:::

Without `reforged-map` or `reforged-builtins`, without a map folder it can find, or while the map's objects cannot be read, the rule says why once and keeps only the four-character check. It is a warning, not an error, because it cannot see a campaign's Object data (`war3campaign.w3u`): a line that uses such a Rawcode is silenced with `// eslint-disable-next-line reforged/no-unknown-rawcodes -- <reason>`.

## Codes that are not Rawcodes

Some of the game's four-character codes name something that is not a type of object. They stay `number`:

- **Weather effects.** `AddWeatherEffect` and `WeatherEffect.create` take an effect code, such as Ashenvale Rain (Heavy)'s, `FourCC("RAhr")`: a plain number, not a Rawcode.
- **Terrain types.** `SetTerrainType` takes a terrain type's code, and `GetTerrainType` returns one.
- **Order ids.** `OrderId("move")` returns an order id, and `IssueImmediateOrderById` takes one. A Rawcode widens to `number`, so a unit type's Rawcode is accepted as the id of the order that trains it:

```ts
const owner = Player(0);
if (owner !== undefined) {
  const barracks = CreateUnit(owner, FourCC("hbar"), 0, 0, 270);
  if (barracks !== undefined) {
    // Trains a Footman: a train order's id is the unit type's Rawcode.
    IssueImmediateOrderById(barracks, FourCC("hfoo"));
    IssueImmediateOrderById(barracks, OrderId("stop"));
  }
}
```

`FourCC` returns an `UnknownRawcode` for these too, which widens to `number`, so it still writes them.
