---
title: Rawcodes
sidebar_position: 14
description: How the Typings and the library type a Rawcode by its Object kind, with Rawcode<K>, what FourCC returns, the as cast for a computed number, widening to number, GUI variables of an object type, and the codes that are not Rawcodes.
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
