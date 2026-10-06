---
title: Rawcodes
sidebar_position: 14
description: How the Typings and the library type a Rawcode by its Object kind, with Rawcode<K>, what FourCC returns, the as cast for a computed number, widening to number, and the codes that are not Rawcodes.
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
