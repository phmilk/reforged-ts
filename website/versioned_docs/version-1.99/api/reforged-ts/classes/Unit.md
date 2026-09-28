# Class: Unit

Defined in: [handles/unit.ts:30](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L30)

A unit on the map: a soldier, a hero, a structure, a worker or a critter.

## Remarks

A unit is a widget: its `life` comes from `Widget`, and `Unit.fromHandle`
upgrades the Wrapper that a widget lookup made earlier for it. The
hero members (`agility`, `experience`, `setHeroLevel` and the like) act on
heroes only: on another unit they read 0 and change nothing.

## Example

**Creating units, reading an inventory slot and the owner**

```ts
// A footman and a Paladin for the first player. Creating a unit throws on an
// unknown rawcode; reading an inventory slot is a lookup, undefined when the
// slot is empty; the owner is never undefined.
import { Init, tsGlobals, Unit } from "reforged-ts";

Init.onTriggers(() => {
  const owner = tsGlobals.Players[0];
  const footman = Unit.create(owner, FourCC("hfoo"), -128, 0);
  const paladin = Unit.create(owner, FourCC("Hpal"), 128, 0, 90);

  paladin.setHeroLevel(3, false);
  paladin.addItemById(FourCC("rde1"));
  const ring = paladin.getItemInSlot(0);
  const secondSlot = paladin.getItemInSlot(1);
  print(`level ${String(paladin.getHeroLevel())}`);
  print(`ring carried: ${String(ring !== undefined)}`);
  print(`second slot empty: ${String(secondSlot === undefined)}`);
  print(`owned by the first player: ${String(paladin.getOwner() === owner)}`);

  footman.destroy();
});
```

## Native

[unit](/typings/3.0.0/interfaces/unit) ([jassbot](https://lep.duckdns.org/jassbot/doc/unit))

## Extends

- [`Widget`](Widget.md)

## Properties

### handle

> `readonly` **handle**: `unit`

Defined in: [handles/unit.ts:32](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L32)

The game's `unit` Handle this Wrapper owns.

#### Overrides

[`Widget`](Widget.md).[`handle`](Widget.md#handle)

## Accessors

### acquireRange

#### Get Signature

> **get** **acquireRange**(): `number`

Defined in: [handles/unit.ts:213](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L213)

Gets the range within which the unit picks targets to engage, in world units.

##### Native

[GetUnitAcquireRange](/typings/3.0.0/functions/GetUnitAcquireRange) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetUnitAcquireRange))

##### Returns

`number`

The current acquire range.

#### Set Signature

> **set** **acquireRange**(`value`): `void`

Defined in: [handles/unit.ts:204](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L204)

The range within which the unit picks targets to engage, in world units;
it is not the attack range.

##### Remarks

- A unit whose acquire range exceeds its attack range walks up to the
  targets it picks, then attacks them.
- In the object editor, an acquire range below the attack range caps the
  attack range. This setter does not: the attack range, and the value
  the UI shows, stay as they were, whatever is often claimed.

##### Native

[SetUnitAcquireRange](/typings/3.0.0/functions/SetUnitAcquireRange) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetUnitAcquireRange))

##### Parameters

###### value

`number`

##### Returns

`void`

***

### agility

#### Get Signature

> **get** **agility**(): `number`

Defined in: [handles/unit.ts:222](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L222)

Gets the hero's agility without the bonuses of items and buffs.

##### Native

[GetHeroAgi](/typings/3.0.0/functions/GetHeroAgi) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetHeroAgi))

##### Returns

`number`

The base agility; 0 for a unit that is not a hero.

#### Set Signature

> **set** **agility**(`value`): `void`

Defined in: [handles/unit.ts:230](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L230)

The hero's base agility; the change is permanent.

##### Native

[SetHeroAgi](/typings/3.0.0/functions/SetHeroAgi) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetHeroAgi))

##### Parameters

###### value

`number`

##### Returns

`void`

***

### armor

#### Get Signature

> **get** **armor**(): `number`

Defined in: [handles/unit.ts:240](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L240)

Gets the unit's armor as it stands, the bonus armor of agility, auras,
buffs and items counted in.

##### Native

[BlzGetUnitArmor](/typings/3.0.0/functions/BlzGetUnitArmor) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzGetUnitArmor))

##### Returns

`number`

The total armor.

#### Set Signature

> **set** **armor**(`armorAmount`): `void`

Defined in: [handles/unit.ts:249](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L249)

The unit's total armor, which may be negative: the game changes the base armor
so that base and bonus armor add up to the value.

##### Native

[BlzSetUnitArmor](/typings/3.0.0/functions/BlzSetUnitArmor) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzSetUnitArmor))

##### Parameters

###### armorAmount

`number`

##### Returns

`void`

***

### bagSize

#### Get Signature

> **get** **bagSize**(): `number`

Defined in: [handles/unit.ts:258](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L258)

Gets the size of the unit's bag, its extended inventory.

##### Native

[UnitExtendedInventorySize](/typings/3.0.0/functions/UnitExtendedInventorySize) ([jassbot](https://lep.duckdns.org/jassbot/doc/UnitExtendedInventorySize))

##### Returns

`number`

The number of bag slots.

***

### canSleep

#### Get Signature

> **get** **canSleep**(): `boolean`

Defined in: [handles/unit.ts:275](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L275)

Gets whether the unit may sleep at night.

##### Native

[UnitCanSleep](/typings/3.0.0/functions/UnitCanSleep) ([jassbot](https://lep.duckdns.org/jassbot/doc/UnitCanSleep))

##### Returns

`boolean`

True when the unit may sleep.

#### Set Signature

> **set** **canSleep**(`flag`): `void`

Defined in: [handles/unit.ts:266](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L266)

Whether the unit may sleep at night, as creeps do.

##### Native

[UnitAddSleep](/typings/3.0.0/functions/UnitAddSleep) ([jassbot](https://lep.duckdns.org/jassbot/doc/UnitAddSleep))

##### Parameters

###### flag

`boolean`

##### Returns

`void`

***

### collisionSize

#### Get Signature

> **get** **collisionSize**(): `number`

Defined in: [handles/unit.ts:285](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L285)

Gets the radius the unit occupies for collision, in world units: 16 for a
Peasant, 48 for a Mountain Giant.

##### Native

[BlzGetUnitCollisionSize](/typings/3.0.0/functions/BlzGetUnitCollisionSize) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzGetUnitCollisionSize))

##### Returns

`number`

The collision size.

***

### color

#### Set Signature

> **set** **color**(`whichColor`): `void`

Defined in: [handles/unit.ts:294](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L294)

The team colour accent of the unit's model, such as `PLAYER_COLOR_RED`; the
effects attached to the unit take it too.

##### Native

[SetUnitColor](/typings/3.0.0/functions/SetUnitColor) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetUnitColor))

##### Parameters

###### whichColor

`playercolor`

##### Returns

`void`

***

### currentOrder

#### Get Signature

> **get** **currentOrder**(): `number`

Defined in: [handles/unit.ts:303](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L303)

Gets the id of the order the unit is carrying out.

##### Native

[GetUnitCurrentOrder](/typings/3.0.0/functions/GetUnitCurrentOrder) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetUnitCurrentOrder))

##### Returns

`number`

The order id, or 0 when the unit has no order.

***

### defaultAcquireRange

#### Get Signature

> **get** **defaultAcquireRange**(): `number`

Defined in: [handles/unit.ts:312](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L312)

Gets the acquire range the unit type defines, in world units.

##### Native

[GetUnitDefaultAcquireRange](/typings/3.0.0/functions/GetUnitDefaultAcquireRange) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetUnitDefaultAcquireRange))

##### Returns

`number`

The default acquire range.

***

### defaultFlyHeight

#### Get Signature

> **get** **defaultFlyHeight**(): `number`

Defined in: [handles/unit.ts:321](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L321)

Gets the flying height the unit type defines, in world units.

##### Native

[GetUnitDefaultFlyHeight](/typings/3.0.0/functions/GetUnitDefaultFlyHeight) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetUnitDefaultFlyHeight))

##### Returns

`number`

The default flying height.

***

### defaultMoveSpeed

#### Get Signature

> **get** **defaultMoveSpeed**(): `number`

Defined in: [handles/unit.ts:330](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L330)

Gets the movement speed the unit type defines, in world units per second.

##### Native

[GetUnitDefaultMoveSpeed](/typings/3.0.0/functions/GetUnitDefaultMoveSpeed) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetUnitDefaultMoveSpeed))

##### Returns

`number`

The default movement speed.

***

### defaultPropWindow

#### Get Signature

> **get** **defaultPropWindow**(): `number`

Defined in: [handles/unit.ts:341](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L341)

Gets the unit type's default propulsion window, in degrees.

##### Remarks

Unlike the other propulsion window Natives, which take and give
radians, this one gives degrees.

##### Native

[GetUnitDefaultPropWindow](/typings/3.0.0/functions/GetUnitDefaultPropWindow) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetUnitDefaultPropWindow))

##### Returns

`number`

The default propulsion window, in degrees.

***

### defaultTurnSpeed

#### Get Signature

> **get** **defaultTurnSpeed**(): `number`

Defined in: [handles/unit.ts:351](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L351)

Gets the turn rate the unit type defines, its object editor field
Movement - Turn Rate.

##### Native

[GetUnitDefaultTurnSpeed](/typings/3.0.0/functions/GetUnitDefaultTurnSpeed) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetUnitDefaultTurnSpeed))

##### Returns

`number`

The default turn rate, whatever `turnSpeed` was set to since.

***

### experience

#### Get Signature

> **get** **experience**(): `number`

Defined in: [handles/unit.ts:360](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L360)

Gets the hero's experience points.

##### Native

[GetHeroXP](/typings/3.0.0/functions/GetHeroXP) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetHeroXP))

##### Returns

`number`

The experience; 0 for a unit that is not a hero.

#### Set Signature

> **set** **experience**(`newXpVal`): `void`

Defined in: [handles/unit.ts:368](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L368)

The hero's experience points; a level gained this way shows its effects.

##### Native

[SetHeroXP](/typings/3.0.0/functions/SetHeroXP) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetHeroXP))

##### Parameters

###### newXpVal

`number`

##### Returns

`void`

***

### facing

#### Get Signature

> **get** **facing**(): `number`

Defined in: [handles/unit.ts:386](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L386)

Gets the direction the unit faces, in degrees.

##### Native

[GetUnitFacing](/typings/3.0.0/functions/GetUnitFacing) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetUnitFacing))

##### Returns

`number`

The facing, in degrees (0 east, 90 north).

#### Set Signature

> **set** **facing**(`value`): `void`

Defined in: [handles/unit.ts:377](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L377)

The direction the unit turns to face, in degrees (0 east, 90 north); it turns
at its turn rate, and a moving unit ignores the change.

##### Native

[SetUnitFacing](/typings/3.0.0/functions/SetUnitFacing) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetUnitFacing))

##### Parameters

###### value

`number`

##### Returns

`void`

***

### foodMade

#### Get Signature

> **get** **foodMade**(): `number`

Defined in: [handles/unit.ts:395](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L395)

Gets the food the unit provides to its owner, such as a farm's.

##### Native

[GetUnitFoodMade](/typings/3.0.0/functions/GetUnitFoodMade) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetUnitFoodMade))

##### Returns

`number`

The food provided.

***

### foodUsed

#### Get Signature

> **get** **foodUsed**(): `number`

Defined in: [handles/unit.ts:404](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L404)

Gets the food the unit costs its owner.

##### Native

[GetUnitFoodUsed](/typings/3.0.0/functions/GetUnitFoodUsed) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetUnitFoodUsed))

##### Returns

`number`

The food used.

***

### id

#### Get Signature

> **get** **id**(): `number`

Defined in: [handles/handle.ts:148](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/handle.ts#L148)

Gets the game's numeric id of the Handle.

##### Remarks

Ids are not recycled immediately when the object is destroyed (a new
Handle created right after gets the next id), and they are allocated
deterministically from map start. An id is never data: key a collection
on the Handle (or use `HandleMap` and `HandleSet`), never on its id.

##### Native

[GetHandleId](/typings/3.0.0/functions/GetHandleId) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetHandleId))

##### Returns

`number`

The id, unique among the live Handles.

#### Inherited from

[`Widget`](Widget.md).[`id`](Widget.md#id)

***

### ignoreAlarmToggled

#### Get Signature

> **get** **ignoreAlarmToggled**(): `boolean`

Defined in: [handles/unit.ts:413](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L413)

Gets whether the unit raises no alarm, the "under attack" warning, when it is attacked.

##### Native

[UnitIgnoreAlarmToggled](/typings/3.0.0/functions/UnitIgnoreAlarmToggled) ([jassbot](https://lep.duckdns.org/jassbot/doc/UnitIgnoreAlarmToggled))

##### Returns

`boolean`

True when the unit raises no alarm.

***

### intelligence

#### Get Signature

> **get** **intelligence**(): `number`

Defined in: [handles/unit.ts:422](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L422)

Gets the hero's intelligence without the bonuses of items and buffs.

##### Native

[GetHeroInt](/typings/3.0.0/functions/GetHeroInt) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetHeroInt))

##### Returns

`number`

The base intelligence; 0 for a unit that is not a hero.

#### Set Signature

> **set** **intelligence**(`value`): `void`

Defined in: [handles/unit.ts:430](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L430)

The hero's base intelligence; the change is permanent.

##### Native

[SetHeroInt](/typings/3.0.0/functions/SetHeroInt) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetHeroInt))

##### Parameters

###### value

`number`

##### Returns

`void`

***

### inventorySize

#### Get Signature

> **get** **inventorySize**(): `number`

Defined in: [handles/unit.ts:439](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L439)

Gets the number of slots of the unit's inventory.

##### Native

[UnitInventorySize](/typings/3.0.0/functions/UnitInventorySize) ([jassbot](https://lep.duckdns.org/jassbot/doc/UnitInventorySize))

##### Returns

`number`

The slot count, from 0 to 6; 0 for a unit with no inventory.

***

### invulnerable

#### Get Signature

> **get** **invulnerable**(): `boolean`

Defined in: [handles/unit.ts:459](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L459)

Gets whether the unit is invulnerable.

##### Native

[BlzIsUnitInvulnerable](/typings/3.0.0/functions/BlzIsUnitInvulnerable) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzIsUnitInvulnerable))

##### Returns

`boolean`

True when the unit is invulnerable.

#### Set Signature

> **set** **invulnerable**(`flag`): `void`

Defined in: [handles/unit.ts:450](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L450)

Whether the unit is invulnerable; `false` removes only the invulnerability
this setter gave.

##### Remarks

The Native appears to work through the `'Avul'` ability of the
default AbilityData.slk: when a map lacks `'Avul'`, it crashes the game.

##### Native

[SetUnitInvulnerable](/typings/3.0.0/functions/SetUnitInvulnerable) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetUnitInvulnerable))

##### Parameters

###### flag

`boolean`

##### Returns

`void`

***

### isHeroGlowAllowed

#### Get Signature

> **get** **isHeroGlowAllowed**(): `boolean`

Defined in: [handles/unit.ts:468](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L468)

Gets whether the hero glow may show on the unit.

##### Native

[HeroGlowIsAllowedOnUnit](/typings/3.0.0/functions/HeroGlowIsAllowedOnUnit) ([jassbot](https://lep.duckdns.org/jassbot/doc/HeroGlowIsAllowedOnUnit))

##### Returns

`boolean`

True when the hero glow is allowed.

***

### level

#### Get Signature

> **get** **level**(): `number`

Defined in: [handles/unit.ts:477](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L477)

Gets the unit's level: the level its type defines, or a hero's current level.

##### Native

[GetUnitLevel](/typings/3.0.0/functions/GetUnitLevel) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetUnitLevel))

##### Returns

`number`

The level.

***

### life

#### Get Signature

> **get** **life**(): `number`

Defined in: [handles/widget.ts:19](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/widget.ts#L19)

Gets how many hit points the widget has left.

##### Native

[GetWidgetLife](/typings/3.0.0/functions/GetWidgetLife) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetWidgetLife))

##### Returns

`number`

The hit points left, an amount rather than a percentage.

#### Set Signature

> **set** **life**(`value`): `void`

Defined in: [handles/widget.ts:27](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/widget.ts#L27)

The widget's current hit points, an amount rather than a percentage.

##### Native

[SetWidgetLife](/typings/3.0.0/functions/SetWidgetLife) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetWidgetLife))

##### Parameters

###### value

`number`

##### Returns

`void`

#### Inherited from

[`Widget`](Widget.md).[`life`](Widget.md#life)

***

### localZ

#### Get Signature

> **get** **localZ**(): `number`

Defined in: [handles/unit.ts:490](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L490)

**`Async`**

Gets the height of the unit's position, as the local client sees it.

##### Remarks

The value can differ between clients: never let it decide game state. It is
the same value as `z` today.

##### Native

[BlzGetLocalUnitZ](/typings/3.0.0/functions/BlzGetLocalUnitZ) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzGetLocalUnitZ))

##### Returns

`number`

The height, in world units.

***

### mana

#### Get Signature

> **get** **mana**(): `number`

Defined in: [handles/unit.ts:500](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L500)

Gets the mana the unit has left to cast its abilities with, from 0 up to
`maxMana`.

##### Native

[GetUnitState](/typings/3.0.0/functions/GetUnitState) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetUnitState))

##### Returns

`number`

The current mana; 0 for a unit without mana.

#### Set Signature

> **set** **mana**(`value`): `void`

Defined in: [handles/unit.ts:509](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L509)

The mana the unit has left to cast its abilities with; the game keeps
the value between 0 and `maxMana`.

##### Native

[SetUnitState](/typings/3.0.0/functions/SetUnitState) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetUnitState))

##### Parameters

###### value

`number`

##### Returns

`void`

***

### maxLife

#### Get Signature

> **get** **maxLife**(): `number`

Defined in: [handles/unit.ts:518](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L518)

Gets the most life the unit can have, the full length of its health bar.

##### Native

[BlzGetUnitMaxHP](/typings/3.0.0/functions/BlzGetUnitMaxHP) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzGetUnitMaxHP))

##### Returns

`number`

The maximum life, a whole number of hit points.

#### Set Signature

> **set** **maxLife**(`value`): `void`

Defined in: [handles/unit.ts:527](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L527)

The most life the unit can have, the full length of its health bar, as a
whole number of hit points.

##### Native

[BlzSetUnitMaxHP](/typings/3.0.0/functions/BlzSetUnitMaxHP) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzSetUnitMaxHP))

##### Parameters

###### value

`number`

##### Returns

`void`

***

### maxMana

#### Get Signature

> **get** **maxMana**(): `number`

Defined in: [handles/unit.ts:536](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L536)

Gets the most mana the unit can have, the full length of its mana bar.

##### Native

[BlzGetUnitMaxMana](/typings/3.0.0/functions/BlzGetUnitMaxMana) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzGetUnitMaxMana))

##### Returns

`number`

The maximum mana, a whole number; 0 for a unit without mana.

#### Set Signature

> **set** **maxMana**(`value`): `void`

Defined in: [handles/unit.ts:545](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L545)

The most mana the unit can have, the full length of its mana bar, as a
whole number.

##### Native

[BlzSetUnitMaxMana](/typings/3.0.0/functions/BlzSetUnitMaxMana) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzSetUnitMaxMana))

##### Parameters

###### value

`number`

##### Returns

`void`

***

### moveSpeed

#### Get Signature

> **get** **moveSpeed**(): `number`

Defined in: [handles/unit.ts:562](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L562)

Gets the unit's movement speed, in world units per second.

##### Native

[GetUnitMoveSpeed](/typings/3.0.0/functions/GetUnitMoveSpeed) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetUnitMoveSpeed))

##### Returns

`number`

The movement speed.

#### Set Signature

> **set** **moveSpeed**(`value`): `void`

Defined in: [handles/unit.ts:553](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L553)

The unit's movement speed, in world units per second.

##### Native

[SetUnitMoveSpeed](/typings/3.0.0/functions/SetUnitMoveSpeed) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetUnitMoveSpeed))

##### Parameters

###### value

`number`

##### Returns

`void`

***

### name

#### Get Signature

> **get** **name**(): `string`

Defined in: [handles/unit.ts:574](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L574)

**`Async`**

Gets the unit's name as the local client's language shows it.

##### Remarks

The value can differ between clients: never let it decide game state.

##### Native

[GetUnitName](/typings/3.0.0/functions/GetUnitName) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetUnitName))

##### Returns

`string`

The localized name, or an empty string when the game returns none.

#### Set Signature

> **set** **name**(`value`): `void`

Defined in: [handles/unit.ts:583](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L583)

The unit's own name, which replaces its type's name at once.

##### Native

[BlzSetUnitName](/typings/3.0.0/functions/BlzSetUnitName) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzSetUnitName))

##### Bug

Setting an empty name crashes the game.

##### Parameters

###### value

`string`

##### Returns

`void`

***

### nameProper

#### Get Signature

> **get** **nameProper**(): `string`

Defined in: [handles/unit.ts:603](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L603)

Gets the hero's proper name, the name shown above its experience bar.

##### Remarks

The Native gives `null` for a unit that is not a hero, and for an
illusion.

##### Native

[GetHeroProperName](/typings/3.0.0/functions/GetHeroProperName) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetHeroProperName))

##### Returns

`string`

The proper name, or an empty string for a unit that is not a hero or an illusion.

#### Set Signature

> **set** **nameProper**(`value`): `void`

Defined in: [handles/unit.ts:591](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L591)

The hero's proper name, the name shown above its experience bar.

##### Native

[BlzSetHeroProperName](/typings/3.0.0/functions/BlzSetHeroProperName) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzSetHeroProperName))

##### Parameters

###### value

`string`

##### Returns

`void`

***

### orderCount

#### Get Signature

> **get** **orderCount**(): `number`

Defined in: [handles/unit.ts:612](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L612)

Gets the number of orders the unit has, the current one and the queued ones.

##### Native

[BlzGetUnitOrderCount](/typings/3.0.0/functions/BlzGetUnitOrderCount) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzGetUnitOrderCount))

##### Returns

`number`

The order count.

***

### paused

#### Get Signature

> **get** **paused**(): `boolean`

Defined in: [handles/unit.ts:635](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L635)

Gets whether the unit is paused.

##### Native

[IsUnitPaused](/typings/3.0.0/functions/IsUnitPaused) ([jassbot](https://lep.duckdns.org/jassbot/doc/IsUnitPaused))

##### Returns

`boolean`

True when the `paused` setter paused the unit; `pauseEx` leaves it false.

#### Set Signature

> **set** **paused**(`flag`): `void`

Defined in: [handles/unit.ts:626](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L626)

Whether the unit is paused.

##### Remarks

While paused, a unit:
- has its buffs and effects on hold;
- keeps the orders it is given and carries them out once unpaused;
- takes no powerups: `addItem` returns true, yet the item stays where
  it was.

##### Native

[PauseUnit](/typings/3.0.0/functions/PauseUnit) ([jassbot](https://lep.duckdns.org/jassbot/doc/PauseUnit))

##### Parameters

###### flag

`boolean`

##### Returns

`void`

***

### pointValue

#### Get Signature

> **get** **pointValue**(): `number`

Defined in: [handles/unit.ts:644](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L644)

Gets the point value the unit type defines, which the score screen counts.

##### Native

[GetUnitPointValue](/typings/3.0.0/functions/GetUnitPointValue) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetUnitPointValue))

##### Returns

`number`

The point value.

***

### propWindow

#### Get Signature

> **get** **propWindow**(): `number`

Defined in: [handles/unit.ts:668](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L668)

Gets the unit's propulsion window, in radians.

##### Native

[GetUnitPropWindow](/typings/3.0.0/functions/GetUnitPropWindow) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetUnitPropWindow))

##### Returns

`number`

The propulsion window, in radians.

#### Set Signature

> **set** **propWindow**(`newPropWindowAngle`): `void`

Defined in: [handles/unit.ts:659](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L659)

The unit's propulsion window, in radians: how far its facing may be from
the direction of an order's target (move, attack, patrol, smart) for it
to start moving at once; further off, it turns without moving first.

##### Remarks

- At 0 the unit cannot move at all, so it cannot attack either. At the
  full 180 degrees it moves off as soon as it gets an order that needs
  movement.
- Source: http://www.hiveworkshop.com/forums/2391397-post20.html

##### Native

[SetUnitPropWindow](/typings/3.0.0/functions/SetUnitPropWindow) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetUnitPropWindow))

##### Parameters

###### newPropWindowAngle

`number`

##### Returns

`void`

***

### race

#### Get Signature

> **get** **race**(): `race`

Defined in: [handles/unit.ts:677](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L677)

Gets the race of the unit's type.

##### Native

[GetUnitRace](/typings/3.0.0/functions/GetUnitRace) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetUnitRace))

##### Returns

`race`

The race, such as `RACE_HUMAN`.

***

### rallyDestructable

#### Get Signature

> **get** **rallyDestructable**(): [`Destructable`](Destructable.md) \| `undefined`

Defined in: [handles/unit.ts:686](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L686)

Gets the destructable the unit's rally point is set on.

##### Native

[GetUnitRallyDestructable](/typings/3.0.0/functions/GetUnitRallyDestructable) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetUnitRallyDestructable))

##### Returns

[`Destructable`](Destructable.md) \| `undefined`

The destructable, or `undefined` when the rally point is not on a destructable.

***

### rallyPoint

#### Get Signature

> **get** **rallyPoint**(): [`Point`](Point.md) \| `undefined`

Defined in: [handles/unit.ts:696](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L696)

The unit's rally point, or undefined for a unit that has none: a lookup,
although the game allocates a new location each time it returns one.

##### Native

[GetUnitRallyPoint](/typings/3.0.0/functions/GetUnitRallyPoint) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetUnitRallyPoint))

##### Returns

[`Point`](Point.md) \| `undefined`

The rally point, or `undefined` when the unit has none.

***

### rallyUnit

#### Get Signature

> **get** **rallyUnit**(): `Unit` \| `undefined`

Defined in: [handles/unit.ts:705](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L705)

Gets the unit the unit's rally point is set on.

##### Native

[GetUnitRallyUnit](/typings/3.0.0/functions/GetUnitRallyUnit) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetUnitRallyUnit))

##### Returns

`Unit` \| `undefined`

The unit, or `undefined` when the rally point is not on a unit.

***

### resourceAmount

#### Get Signature

> **get** **resourceAmount**(): `number`

Defined in: [handles/unit.ts:722](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L722)

Gets the gold left in the gold mine.

##### Native

[GetResourceAmount](/typings/3.0.0/functions/GetResourceAmount) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetResourceAmount))

##### Returns

`number`

The gold amount; 0 for a unit that is not a gold mine.

#### Set Signature

> **set** **resourceAmount**(`amount`): `void`

Defined in: [handles/unit.ts:713](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L713)

The gold left in the gold mine; a negative amount counts as 0.

##### Native

[SetResourceAmount](/typings/3.0.0/functions/SetResourceAmount) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetResourceAmount))

##### Parameters

###### amount

`number`

##### Returns

`void`

***

### selectable

#### Get Signature

> **get** **selectable**(): `boolean`

Defined in: [handles/unit.ts:731](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L731)

Gets whether a player can select the unit.

##### Native

[BlzIsUnitSelectable](/typings/3.0.0/functions/BlzIsUnitSelectable) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzIsUnitSelectable))

##### Returns

`boolean`

True when the unit is selectable.

***

### selectionScale

#### Get Signature

> **get** **selectionScale**(): `number`

Defined in: [handles/unit.ts:748](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L748)

Gets the scale of the unit's selection circle.

##### Native

[BlzGetUnitRealField](/typings/3.0.0/functions/BlzGetUnitRealField) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzGetUnitRealField))

##### Returns

`number`

The selection scale, or 0 when the game returns none.

#### Set Signature

> **set** **selectionScale**(`scale`): `void`

Defined in: [handles/unit.ts:739](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L739)

The scale of the unit's selection circle, where 1 is its type's size.

##### Native

[BlzSetUnitRealField](/typings/3.0.0/functions/BlzSetUnitRealField) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzSetUnitRealField))

##### Parameters

###### scale

`number`

##### Returns

`void`

***

### show

#### Get Signature

> **get** **show**(): `boolean`

Defined in: [handles/unit.ts:767](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L767)

Gets whether the unit is shown.

##### Native

[IsUnitHidden](/typings/3.0.0/functions/IsUnitHidden) ([jassbot](https://lep.duckdns.org/jassbot/doc/IsUnitHidden))

##### Returns

`boolean`

True when the unit is shown, false when it is hidden.

#### Set Signature

> **set** **show**(`flag`): `void`

Defined in: [handles/unit.ts:758](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L758)

Whether the unit is shown; a hidden unit is not drawn, cannot be selected and
takes no part in the game until it is shown again.

##### Native

[ShowUnit](/typings/3.0.0/functions/ShowUnit) ([jassbot](https://lep.duckdns.org/jassbot/doc/ShowUnit))

##### Parameters

###### flag

`boolean`

##### Returns

`void`

***

### skillPoints

#### Get Signature

> **get** **skillPoints**(): `number`

Defined in: [handles/unit.ts:794](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L794)

Gets the hero's unspent skill points.

##### Native

[GetHeroSkillPoints](/typings/3.0.0/functions/GetHeroSkillPoints) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetHeroSkillPoints))

##### Returns

`number`

The unspent skill points; 0 for a unit that is not a hero.

#### Set Signature

> **set** **skillPoints**(`skillPointDelta`): `void`

Defined in: [handles/unit.ts:808](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L808)

Adds `skillPointDelta` to the hero's unspent skill points; a negative
delta takes that many away.

##### Remarks

- The hero gains no more points than it has left to spend: 9 at most
  for three abilities of 3 levels each.
- The Native reports false when the hero has no unspent point and the
  delta is 0 or less, and true otherwise; the setter drops that result.

##### Native

[UnitModifySkillPoints](/typings/3.0.0/functions/UnitModifySkillPoints) ([jassbot](https://lep.duckdns.org/jassbot/doc/UnitModifySkillPoints))

##### Parameters

###### skillPointDelta

`number`

##### Returns

`void`

***

### skin

#### Get Signature

> **get** **skin**(): `number`

Defined in: [handles/unit.ts:776](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L776)

Gets the rawcode of the unit type whose model the unit uses.

##### Native

[BlzGetUnitSkin](/typings/3.0.0/functions/BlzGetUnitSkin) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzGetUnitSkin))

##### Returns

`number`

The skin's rawcode.

#### Set Signature

> **set** **skin**(`skinId`): `void`

Defined in: [handles/unit.ts:785](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L785)

The rawcode of the unit type whose model, scale and sounds the unit uses; a
change removes every effect attached to the unit.

##### Native

[BlzSetUnitSkin](/typings/3.0.0/functions/BlzSetUnitSkin) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzSetUnitSkin))

##### Parameters

###### skinId

`number`

##### Returns

`void`

***

### sleeping

#### Get Signature

> **get** **sleeping**(): `boolean`

Defined in: [handles/unit.ts:817](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L817)

Gets whether the unit is asleep.

##### Native

[UnitIsSleeping](/typings/3.0.0/functions/UnitIsSleeping) ([jassbot](https://lep.duckdns.org/jassbot/doc/UnitIsSleeping))

##### Returns

`boolean`

True when the unit sleeps.

***

### strength

#### Get Signature

> **get** **strength**(): `number`

Defined in: [handles/unit.ts:826](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L826)

Gets the hero's strength without the bonuses of items and buffs.

##### Native

[GetHeroStr](/typings/3.0.0/functions/GetHeroStr) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetHeroStr))

##### Returns

`number`

The base strength; 0 for a unit that is not a hero.

#### Set Signature

> **set** **strength**(`value`): `void`

Defined in: [handles/unit.ts:835](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L835)

The hero's base strength; the change is permanent, and lowering it lowers the
hero's life.

##### Native

[SetHeroStr](/typings/3.0.0/functions/SetHeroStr) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetHeroStr))

##### Parameters

###### value

`number`

##### Returns

`void`

***

### turnSpeed

#### Get Signature

> **get** **turnSpeed**(): `number`

Defined in: [handles/unit.ts:855](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L855)

Gets how fast the unit turns to a new facing: a higher value turns
faster.

##### Native

[GetUnitTurnSpeed](/typings/3.0.0/functions/GetUnitTurnSpeed) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetUnitTurnSpeed))

##### Returns

`number`

The turn rate, on the scale of the object editor field
Movement - Turn Rate.

#### Set Signature

> **set** **turnSpeed**(`value`): `void`

Defined in: [handles/unit.ts:844](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L844)

How fast the unit turns to a new facing, on the scale of the object
editor field Movement - Turn Rate: a higher value turns faster.

##### Native

[SetUnitTurnSpeed](/typings/3.0.0/functions/SetUnitTurnSpeed) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetUnitTurnSpeed))

##### Parameters

###### value

`number`

##### Returns

`void`

***

### typeId

#### Get Signature

> **get** **typeId**(): `number`

Defined in: [handles/unit.ts:864](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L864)

Gets the rawcode of the unit's type.

##### Native

[GetUnitTypeId](/typings/3.0.0/functions/GetUnitTypeId) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetUnitTypeId))

##### Returns

`number`

The rawcode, such as `FourCC("hfoo")`.

***

### userData

#### Get Signature

> **get** **userData**(): `number`

Defined in: [handles/unit.ts:873](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L873)

Gets the custom integer stored on the unit.

##### Native

[GetUnitUserData](/typings/3.0.0/functions/GetUnitUserData) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetUnitUserData))

##### Returns

`number`

The value, 0 until one is set.

#### Set Signature

> **set** **userData**(`value`): `void`

Defined in: [handles/unit.ts:882](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L882)

A custom integer the unit carries for the map's own use.

##### Remarks

No mechanism of the game reads it.

##### Native

[SetUnitUserData](/typings/3.0.0/functions/SetUnitUserData) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetUnitUserData))

##### Parameters

###### value

`number`

##### Returns

`void`

***

### waygateActive

#### Get Signature

> **get** **waygateActive**(): `boolean`

Defined in: [handles/unit.ts:899](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L899)

Gets whether the unit works as a waygate.

##### Native

[WaygateIsActive](/typings/3.0.0/functions/WaygateIsActive) ([jassbot](https://lep.duckdns.org/jassbot/doc/WaygateIsActive))

##### Returns

`boolean`

True when the unit has the Waygate ability and is activated.

#### Set Signature

> **set** **waygateActive**(`flag`): `void`

Defined in: [handles/unit.ts:890](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L890)

Whether the unit works as a waygate; it needs the Waygate ability (`'Awrp'`).

##### Native

[WaygateActivate](/typings/3.0.0/functions/WaygateActivate) ([jassbot](https://lep.duckdns.org/jassbot/doc/WaygateActivate))

##### Parameters

###### flag

`boolean`

##### Returns

`void`

***

### x

#### Get Signature

> **get** **x**(): `number`

Defined in: [handles/unit.ts:910](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L910)

Gets the unit's x-coordinate, alive or dead.

##### Native

[GetUnitX](/typings/3.0.0/functions/GetUnitX) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetUnitX))

##### Bug

For a unit loaded into a zeppelin, it returns where the unit boarded,
not the zeppelin's position.

##### Returns

`number`

The x-coordinate, in world units.

#### Set Signature

> **set** **x**(`value`): `void`

Defined in: [handles/unit.ts:922](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L922)

The unit's x-coordinate: the unit moves at once, ignoring pathing.

##### Remarks

- A unit with a movement speed of 0 is moved, but its model stays where
  it was.
- The unit keeps its orders; `setPosition` cancels them.

##### Native

[SetUnitX](/typings/3.0.0/functions/SetUnitX) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetUnitX))

##### Parameters

###### value

`number`

##### Returns

`void`

#### Overrides

[`Widget`](Widget.md).[`x`](Widget.md#x)

***

### y

#### Get Signature

> **get** **y**(): `number`

Defined in: [handles/unit.ts:933](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L933)

Gets the unit's y-coordinate, alive or dead.

##### Native

[GetUnitY](/typings/3.0.0/functions/GetUnitY) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetUnitY))

##### Bug

For a unit loaded into a zeppelin, it returns where the unit boarded,
not the zeppelin's position.

##### Returns

`number`

The y-coordinate, in world units.

#### Set Signature

> **set** **y**(`value`): `void`

Defined in: [handles/unit.ts:945](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L945)

The unit's y-coordinate: the unit moves at once, ignoring pathing.

##### Remarks

- A unit with a movement speed of 0 is moved, but its model stays where
  it was.
- The unit keeps its orders; `setPosition` cancels them.

##### Native

[SetUnitY](/typings/3.0.0/functions/SetUnitY) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetUnitY))

##### Parameters

###### value

`number`

##### Returns

`void`

#### Overrides

[`Widget`](Widget.md).[`y`](Widget.md#y)

***

### z

#### Get Signature

> **get** **z**(): `number`

Defined in: [handles/unit.ts:958](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L958)

**`Async`**

Gets the height of the unit's position: the ground, water or walkable
destructable below it plus the unit's own height.

##### Remarks

The value can differ between clients: never let it decide game state.

##### Native

[BlzGetUnitZ](/typings/3.0.0/functions/BlzGetUnitZ) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzGetUnitZ))

##### Returns

`number`

The height, in world units.

## Methods

### addAbility()

> **addAbility**(`abilityId`): `boolean`

Defined in: [handles/unit.ts:968](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L968)

Adds an ability to the unit, at level 1 and off cooldown.

#### Parameters

##### abilityId

`number`

The ability's rawcode, such as `FourCC("AHbz")`.

#### Returns

`boolean`

True when the ability was added, false when the unit already has it.

#### Native

[UnitAddAbility](/typings/3.0.0/functions/UnitAddAbility) ([jassbot](https://lep.duckdns.org/jassbot/doc/UnitAddAbility))

***

### addAnimationProps()

> **addAnimationProps**(`animProperties`, `add`): `void`

Defined in: [handles/unit.ts:999](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L999)

Adds or removes animation tags, such as `"alternate"` or `"defend"`, that the
game adds to every animation the unit plays.

#### Parameters

##### animProperties

`string`

The tags, separated by spaces.

##### add

`boolean`

True to add the tags, false to remove them.

#### Returns

`void`

#### Native

[AddUnitAnimationProperties](/typings/3.0.0/functions/AddUnitAnimationProperties) ([jassbot](https://lep.duckdns.org/jassbot/doc/AddUnitAnimationProperties))

***

### addExperience()

> **addExperience**(`xpToAdd`, `showEyeCandy`): `void`

Defined in: [handles/unit.ts:1015](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L1015)

Gives the hero experience; beyond what a level needs, the hero gains that
level and the rest carries over to the next one.

#### Parameters

##### xpToAdd

`number`

The experience points to add, a whole number.

##### showEyeCandy

`boolean`

`true` to show the level-up effect when the hero
gains a level.

#### Returns

`void`

#### Native

[AddHeroXP](/typings/3.0.0/functions/AddHeroXP) ([jassbot](https://lep.duckdns.org/jassbot/doc/AddHeroXP))

#### Bug

A negative amount takes that much experience away, but the hero
keeps its level, even with less experience than the level needs.

#### Bug

Experience does not go below zero: a result under zero wraps around
to `4294967296` plus that negative result.

***

### addIndicator()

> **addIndicator**(`red`, `green`, `blue`, `alpha`): `void`

Defined in: [handles/unit.ts:1027](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L1027)

Flashes a coloured indicator on the unit, as the game does on a unit that is attacked.

#### Parameters

##### red

`number`

The red component, from 0 to 255.

##### green

`number`

The green component, from 0 to 255.

##### blue

`number`

The blue component, from 0 to 255.

##### alpha

`number`

The opacity, from 0 (invisible) to 255 (opaque).

#### Returns

`void`

#### Native

[UnitAddIndicator](/typings/3.0.0/functions/UnitAddIndicator) ([jassbot](https://lep.duckdns.org/jassbot/doc/UnitAddIndicator))

#### Overrides

[`Widget`](Widget.md).[`addIndicator`](Widget.md#addindicator)

***

### addItem()

> **addItem**(`whichItem`): `boolean`

Defined in: [handles/unit.ts:1043](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L1043)

Puts an item in the unit's inventory.

#### Parameters

##### whichItem

[`Item`](Item.md)

The item to put in the inventory.

#### Returns

`boolean`

True when the item is now in the inventory, it was already there
included; false when the unit has no inventory or no free slot.

#### Native

[UnitAddItem](/typings/3.0.0/functions/UnitAddItem) ([jassbot](https://lep.duckdns.org/jassbot/doc/UnitAddItem))

***

### addItemById()

> **addItemById**(`itemId`): [`Item`](Item.md)

Defined in: [handles/unit.ts:1061](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L1061)

Creates an item of a type in the unit's inventory.

#### Parameters

##### itemId

`number`

The item type's rawcode, such as `FourCC("rde1")`.

#### Returns

[`Item`](Item.md)

The new item.

#### Remarks

When the inventory is full or the unit cannot carry items, the game drops the
new item at the unit's feet and returns nothing, so this throws although an
item was created.

#### Throws

When the game returns no handle, for example an unknown rawcode or a
full inventory: `reforged-ts: failed to create Item (<rawcode>)`, at the calling
line. In Dev mode, also before the globals Init stage and inside
`MapPlayer.runLocal`.

#### Native

[UnitAddItemById](/typings/3.0.0/functions/UnitAddItemById) ([jassbot](https://lep.duckdns.org/jassbot/doc/UnitAddItemById))

***

### addItemToSlotById()

> **addItemToSlotById**(`itemId`, `itemSlot`): `boolean`

Defined in: [handles/unit.ts:1078](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L1078)

Creates an item of a type in one slot of the unit's inventory.

#### Parameters

##### itemId

`number`

The item type's rawcode, such as `FourCC("rde1")`.

##### itemSlot

`number`

The slot, from 0 to 5.

#### Returns

`boolean`

True when the item landed in the slot.

#### Remarks

When the slot is taken or does not exist, the game drops the new item at the
unit's feet.

#### Native

[UnitAddItemToSlotById](/typings/3.0.0/functions/UnitAddItemToSlotById) ([jassbot](https://lep.duckdns.org/jassbot/doc/UnitAddItemToSlotById))

***

### addItemToStock()

> **addItemToStock**(`itemId`, `currentStock`, `stockMax`): `void`

Defined in: [handles/unit.ts:1089](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L1089)

Adds an item type to the stock of the shop.

#### Parameters

##### itemId

`number`

The item type's rawcode.

##### currentStock

`number`

The number of items in stock now.

##### stockMax

`number`

The most items the stock holds.

#### Returns

`void`

#### Native

[AddItemToStock](/typings/3.0.0/functions/AddItemToStock) ([jassbot](https://lep.duckdns.org/jassbot/doc/AddItemToStock))

***

### addResourceAmount()

> **addResourceAmount**(`amount`): `void`

Defined in: [handles/unit.ts:1104](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L1104)

Adds gold to the gold mine; a negative amount takes gold away.

#### Parameters

##### amount

`number`

The gold to add, a whole number.

#### Returns

`void`

#### Native

[AddResourceAmount](/typings/3.0.0/functions/AddResourceAmount) ([jassbot](https://lep.duckdns.org/jassbot/doc/AddResourceAmount))

#### Bug

A total under zero shows as a negative amount, but a worker who then
gathers from the mine brings back no gold, and the mine is destroyed.

***

### addSleepPerm()

> **addSleepPerm**(`add`): `void`

Defined in: [handles/unit.ts:1113](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L1113)

Sets whether the unit sleeps at all times, by day as well as at night.

#### Parameters

##### add

`boolean`

True to make the unit sleep at all times.

#### Returns

`void`

#### Native

[UnitAddSleepPerm](/typings/3.0.0/functions/UnitAddSleepPerm) ([jassbot](https://lep.duckdns.org/jassbot/doc/UnitAddSleepPerm))

***

### addType()

> **addType**(`whichUnitType`): `boolean`

Defined in: [handles/unit.ts:1123](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L1123)

Adds a classification to the unit, such as `UNIT_TYPE_UNDEAD`.

#### Parameters

##### whichUnitType

`unittype`

The classification to add.

#### Returns

`boolean`

True when the game added it.

#### Native

[UnitAddType](/typings/3.0.0/functions/UnitAddType) ([jassbot](https://lep.duckdns.org/jassbot/doc/UnitAddType))

***

### addUnitToStock()

> **addUnitToStock**(`unitId`, `currentStock`, `stockMax`): `void`

Defined in: [handles/unit.ts:1134](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L1134)

Adds a unit type to the stock of the shop.

#### Parameters

##### unitId

`number`

The unit type's rawcode.

##### currentStock

`number`

The number of units in stock now.

##### stockMax

`number`

The most units the stock holds.

#### Returns

`void`

#### Native

[AddUnitToStock](/typings/3.0.0/functions/AddUnitToStock) ([jassbot](https://lep.duckdns.org/jassbot/doc/AddUnitToStock))

***

### adjustAbilityCooldownPercent()

> **adjustAbilityCooldownPercent**(`abilId`, `delta`): `void`

Defined in: [handles/unit.ts:978](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L978)

Adjusts the remaining cooldown of one of the unit's abilities by a share of its full cooldown.

#### Parameters

##### abilId

`number`

The ability's rawcode.

##### delta

`number`

The share of the full cooldown to add; negative to shorten the cooldown.

#### Returns

`void`

#### Native

[BlzAdjustUnitAbilityCooldownPercent](/typings/3.0.0/functions/BlzAdjustUnitAbilityCooldownPercent) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzAdjustUnitAbilityCooldownPercent))

***

### adjustAbilityCooldownRemaining()

> **adjustAbilityCooldownRemaining**(`abilId`, `delta`): `void`

Defined in: [handles/unit.ts:988](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L988)

Adjusts the remaining cooldown of one of the unit's abilities by a number of seconds.

#### Parameters

##### abilId

`number`

The ability's rawcode.

##### delta

`number`

The seconds to add; negative to shorten the cooldown.

#### Returns

`void`

#### Native

[BlzAdjustUnitAbilityCooldownRemaining](/typings/3.0.0/functions/BlzAdjustUnitAbilityCooldownRemaining) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzAdjustUnitAbilityCooldownRemaining))

***

### allowHeroGlow()

> **allowHeroGlow**(`allow`): `void`

Defined in: [handles/unit.ts:1148](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L1148)

Allows or disallows the hero glow on the unit.

#### Parameters

##### allow

`boolean`

True to allow the glow, false to disallow it.

#### Returns

`void`

#### Native

[AllowHeroGlowOnUnit](/typings/3.0.0/functions/AllowHeroGlowOnUnit) ([jassbot](https://lep.duckdns.org/jassbot/doc/AllowHeroGlowOnUnit))

#### Native

[DisallowHeroGlowOnUnit](/typings/3.0.0/functions/DisallowHeroGlowOnUnit) ([jassbot](https://lep.duckdns.org/jassbot/doc/DisallowHeroGlowOnUnit))

***

### applyTimedLife()

> **applyTimedLife**(`buffId`, `duration`): `void`

Defined in: [handles/unit.ts:1164](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L1164)

Gives the unit a timed life: it dies once the duration has passed, and its
interface shows the time left.

#### Parameters

##### buffId

`number`

The timed-life buff's rawcode, such as `FourCC("BTLF")` (the
generic one); an unknown buff falls back to it.

##### duration

`number`

The time left to live, in seconds.

#### Returns

`void`

#### Native

[UnitApplyTimedLife](/typings/3.0.0/functions/UnitApplyTimedLife) ([jassbot](https://lep.duckdns.org/jassbot/doc/UnitApplyTimedLife))

***

### attachSound()

> **attachSound**(`sound`): `void`

Defined in: [handles/unit.ts:1173](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L1173)

Attaches a 3D sound to the unit, so that it plays from the unit's position.

#### Parameters

##### sound

[`Sound`](Sound.md)

The sound, which must have been created as a 3D sound.

#### Returns

`void`

#### Native

[AttachSoundToUnit](/typings/3.0.0/functions/AttachSoundToUnit) ([jassbot](https://lep.duckdns.org/jassbot/doc/AttachSoundToUnit))

***

### bagItem()

> **bagItem**(`index`): [`Item`](Item.md) \| `undefined`

Defined in: [handles/unit.ts:1183](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L1183)

Gets the item in one slot of the unit's bag, its extended inventory.

#### Parameters

##### index

`number`

The bag slot, from 0.

#### Returns

[`Item`](Item.md) \| `undefined`

The item, or `undefined` when the slot is empty.

#### Native

[UnitItemInBagSlot](/typings/3.0.0/functions/UnitItemInBagSlot) ([jassbot](https://lep.duckdns.org/jassbot/doc/UnitItemInBagSlot))

***

### cancelTimedLife()

> **cancelTimedLife**(): `void`

Defined in: [handles/unit.ts:1191](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L1191)

Removes the unit's timed life, which kills it; does nothing to a unit without one.

#### Returns

`void`

#### Native

[BlzUnitCancelTimedLife](/typings/3.0.0/functions/BlzUnitCancelTimedLife) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzUnitCancelTimedLife))

***

### canEquip()

> **canEquip**(`equipmentType`): `boolean`

Defined in: [handles/unit.ts:1202](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L1202)

Checks whether the unit can equip items of an equipment type.

#### Parameters

##### equipmentType

[`EquipmentType`](../enumerations/EquipmentType.md)

The equipment type.

#### Returns

`boolean`

True when the unit can equip such items.

#### Native

[UnitCanEquipItemOfEquipmentType](/typings/3.0.0/functions/UnitCanEquipItemOfEquipmentType) ([jassbot](https://lep.duckdns.org/jassbot/doc/UnitCanEquipItemOfEquipmentType))

#### Native

[ConvertEquipmentType](/typings/3.0.0/functions/ConvertEquipmentType) ([jassbot](https://lep.duckdns.org/jassbot/doc/ConvertEquipmentType))

***

### canSleepPerm()

> **canSleepPerm**(): `boolean`

Defined in: [handles/unit.ts:1214](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L1214)

Checks whether the unit sleeps at all times, by day as well as at night.

#### Returns

`boolean`

True when the unit sleeps at all times.

#### Native

[UnitCanSleepPerm](/typings/3.0.0/functions/UnitCanSleepPerm) ([jassbot](https://lep.duckdns.org/jassbot/doc/UnitCanSleepPerm))

***

### clearOrders()

> **clearOrders**(`onlyQueued`): `void`

Defined in: [handles/unit.ts:3273](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L3273)

Clears the unit's orders, through `BlzUnitClearOrders`.

#### Parameters

##### onlyQueued

`boolean`

Clears only the queued orders, keeping the current one.

#### Returns

`void`

#### Native

[BlzUnitClearOrders](/typings/3.0.0/functions/BlzUnitClearOrders) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzUnitClearOrders))

***

### countBuffs()

> **countBuffs**(`removePositive`, `removeNegative`, `magic`, `physical`, `timedLife`, `aura`, `autoDispel`): `number`

Defined in: [handles/unit.ts:1235](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L1235)

Counts the buffs on the unit that match the filters.

#### Parameters

##### removePositive

`boolean`

Counts positive buffs; with `removeNegative`, both
false counts positive and negative buffs.

##### removeNegative

`boolean`

Counts negative buffs.

##### magic

`boolean`

Counts only magical buffs, unless `physical` is true too, which
matches none; both false counts magical and physical buffs.

##### physical

`boolean`

Counts only physical buffs, unless `magic` is true too.

##### timedLife

`boolean`

Includes timed-life buffs; false leaves them out.

##### aura

`boolean`

Includes aura buffs; false leaves them out.

##### autoDispel

`boolean`

Counts only the buffs that dispelling removes.

#### Returns

`number`

The number of matching buffs.

#### Remarks

The filters combine differently here than in `removeBuffsEx`: see
[the Native's reference](https://lep.duckdns.org/jassbot/doc/UnitCountBuffsEx).

#### Native

[UnitCountBuffsEx](/typings/3.0.0/functions/UnitCountBuffsEx) ([jassbot](https://lep.duckdns.org/jassbot/doc/UnitCountBuffsEx))

***

### createMinimapIcon()

> **createMinimapIcon**(`red`, `green`, `blue`, `pingPath`, `fogVisibility`): `minimapicon`

Defined in: [handles/unit.ts:3290](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L3290)

Creates a minimap icon at the unit's position, and returns the game's
`minimapicon`, which the library does not wrap.

#### Parameters

##### red

`number`

The red channel, from 0 to 255.

##### green

`number`

The green channel, from 0 to 255.

##### blue

`number`

The blue channel, from 0 to 255.

##### pingPath

`string`

The model of the icon.

##### fogVisibility

`fogstate`

The fog state in which the icon is visible.

#### Returns

`minimapicon`

The new minimap icon.

#### Throws

When the game creates none:
`reforged-ts: failed to create minimapicon (<pingPath>)`, at the calling line.

#### Native

[CreateMinimapIconOnUnit](/typings/3.0.0/functions/CreateMinimapIconOnUnit) ([jassbot](https://lep.duckdns.org/jassbot/doc/CreateMinimapIconOnUnit))

***

### damageAt()

> **damageAt**(`delay`, `radius`, `x`, `y`, `amount`, `attack`, `ranged`, `attackType`, `damageType`, `weaponType`): `boolean`

Defined in: [handles/unit.ts:1272](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L1272)

Deals damage from the unit to everything in a circle, after a delay.

#### Parameters

##### delay

`number`

The delay before the damage, in seconds.

##### radius

`number`

The circle's radius, in world units.

##### x

`number`

The x-coordinate of the circle's centre, in world units.

##### y

`number`

The y-coordinate of the circle's centre, in world units.

##### amount

`number`

The damage dealt to each target.

##### attack

`boolean`

Deals the damage as an attack.

##### ranged

`boolean`

Deals the damage as a ranged one.

##### attackType

`attacktype`

The attack type, such as `ATTACK_TYPE_NORMAL`.

##### damageType

`damagetype`

The damage type, such as `DAMAGE_TYPE_NORMAL`.

##### weaponType

`weapontype`

The weapon type, which picks the impact sound, such as
`WEAPON_TYPE_WHOKNOWS`.

#### Returns

`boolean`

True when the game scheduled the damage.

#### Native

[UnitDamagePoint](/typings/3.0.0/functions/UnitDamagePoint) ([jassbot](https://lep.duckdns.org/jassbot/doc/UnitDamagePoint))

***

### damageTarget()

> **damageTarget**(`target`, `amount`, `attack`, `ranged`, `attackType`, `damageType`, `weaponType`): `boolean`

Defined in: [handles/unit.ts:1329](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L1329)

Makes the unit deal damage to a widget.

#### Parameters

##### target

`widget`

The unit, item or destructable that takes the damage.

##### amount

`number`

The damage to deal, before the target's armor and the
attack and damage types change it.

##### attack

`boolean`

`true` to count the damage as an attack.

##### ranged

`boolean`

`true` to count the damage as coming from range.

##### attackType

`attacktype`

The attack type, such as `ATTACK_TYPE_NORMAL`.

##### damageType

`damagetype`

The damage type, such as `DAMAGE_TYPE_NORMAL`.

##### weaponType

`weapontype`

The weapon type, which picks the impact sound, such as
`WEAPON_TYPE_WHOKNOWS`.

#### Returns

`boolean`

True when the game dealt the damage.

#### Remarks

Dealing damage inside a damage handler fires the damage events again, so
a handler that damages back without a stop loops until the client
crashes. In Dev mode every action and condition of a Trigger carrying a
damage event (an `on()` damage subscription included) runs one level
deeper in a shared damage depth, and this member raises
`reforged-ts: Unit#<id> Unit.damageTarget at damage depth <depth>, past the limit of <limit>: ...`
when the depth exceeds the limit: eight nested dispatches by default,
`Reforged.configure({ damageDepthLimit })` to change it. A single bounce
(reflect damage) passes. With Dev mode off nothing is counted and nothing
raises.

How the attack, damage and weapon types combine is explained in
[this wc3c post](http://www.wc3c.net/showpost.php?p=1030046&postcount=19).

#### Throws

In Dev mode, past the damage depth limit:
`reforged-ts: Unit#<id> Unit.damageTarget at damage depth <depth>, past the limit of <limit>: ...`

#### Native

[UnitDamageTarget](/typings/3.0.0/functions/UnitDamageTarget) ([jassbot](https://lep.duckdns.org/jassbot/doc/UnitDamageTarget))

***

### decAbilityLevel()

> **decAbilityLevel**(`abilCode`): `number`

Defined in: [handles/unit.ts:1360](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L1360)

Lowers one of the unit's abilities by one level, down to level 1 at
least.

#### Parameters

##### abilCode

`number`

The ability's rawcode, such as `FourCC("AHbz")`.

#### Returns

`number`

The new ability level.

#### Native

[DecUnitAbilityLevel](/typings/3.0.0/functions/DecUnitAbilityLevel) ([jassbot](https://lep.duckdns.org/jassbot/doc/DecUnitAbilityLevel))

***

### destroy()

> **destroy**(): `void`

Defined in: [handles/unit.ts:1375](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L1375)

Instantly removes the unit from the game.

#### Returns

`void`

#### Remarks

In Dev mode the destroyed Wrapper becomes a tombstone: any later access,
a second `destroy()` included, raises
`reforged-ts: used after destroy: <Class>#<id>`, and
`Reforged.debug.report()` counts it destroyed.

#### Throws

In Dev mode, inside `MapPlayer.runLocal`:
`reforged-ts: destroying Unit#<id> inside MapPlayer.runLocal changes game state for one client, which desyncs the game: only visuals belong inside runLocal`

#### Native

[RemoveUnit](/typings/3.0.0/functions/RemoveUnit) ([jassbot](https://lep.duckdns.org/jassbot/doc/RemoveUnit))

***

### disableAbility()

> **disableAbility**(`abilId`, `flag`, `hideUI`): `void`

Defined in: [handles/unit.ts:1392](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L1392)

Disables or enables one of the unit's abilities, and hides or shows its icon.

#### Parameters

##### abilId

`number`

The ability's rawcode.

##### flag

`boolean`

True to disable the ability, false to enable it.

##### hideUI

`boolean`

True to hide the ability's icon, false to show it.

#### Returns

`void`

#### Remarks

A disabled ability that stays visible shows its disabled icon.

#### Native

[BlzUnitDisableAbility](/typings/3.0.0/functions/BlzUnitDisableAbility) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzUnitDisableAbility))

#### Bug

The game counts the calls instead of storing the flags: after hiding an
icon several times, as many calls are needed to show it again
([report](https://www.hiveworkshop.com/threads/blzunithideability-and-blzunitdisableability-dont-work.312477/)).

***

### dropItem()

> **dropItem**(`whichItem`, `x`, `y`): `boolean`

Defined in: [handles/unit.ts:1406](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L1406)

Orders the unit to walk to a point and drop one of its items there.

#### Parameters

##### whichItem

[`Item`](Item.md)

The item, in the unit's inventory.

##### x

`number`

The x-coordinate, in world units.

##### y

`number`

The y-coordinate, in world units.

#### Returns

`boolean`

True when the unit carries the item and took the order.

#### Remarks

A unit that cannot reach the point stops as close as it gets and keeps the item.

#### Native

[UnitDropItemPoint](/typings/3.0.0/functions/UnitDropItemPoint) ([jassbot](https://lep.duckdns.org/jassbot/doc/UnitDropItemPoint))

***

### dropItemFromSlot()

> **dropItemFromSlot**(`whichItem`, `slot`): `boolean`

Defined in: [handles/unit.ts:1418](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L1418)

Moves one of the unit's items to another slot of its inventory, swapping it
with the item already there.

#### Parameters

##### whichItem

[`Item`](Item.md)

The item, in the unit's inventory.

##### slot

`number`

The slot to move it to, from 0 to 5.

#### Returns

`boolean`

True when the item was moved, or was already in that slot.

#### Native

[UnitDropItemSlot](/typings/3.0.0/functions/UnitDropItemSlot) ([jassbot](https://lep.duckdns.org/jassbot/doc/UnitDropItemSlot))

***

### dropItemTarget()

> **dropItemTarget**(`whichItem`, `target`): `boolean`

Defined in: [handles/unit.ts:1432](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L1432)

Orders the unit to walk to a target and give it one of its items.

#### Parameters

##### whichItem

[`Item`](Item.md)

The item, in the unit's inventory.

##### target

[`Widget`](Widget.md)

The widget to give the item to, usually a unit.

#### Returns

`boolean`

True when the unit carries the item and took the order.

#### Remarks

A target with no free inventory slot gets the item dropped at its feet. A unit
that cannot reach the target stops as close as it gets and keeps the item.

#### Native

[UnitDropItemTarget](/typings/3.0.0/functions/UnitDropItemTarget) ([jassbot](https://lep.duckdns.org/jassbot/doc/UnitDropItemTarget))

***

### enableAuras()

> **enableAuras**(`enable`, `affectsUI`): `void`

Defined in: [handles/unit.ts:1445](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L1445)

Enables or disables the unit's auras.

#### Parameters

##### enable

`boolean`

True to enable the auras, false to disable them.

##### affectsUI

`boolean`

Whether the change also shows in the unit's interface.

#### Returns

`void`

#### Native

[BlzUnitEnableAuras](/typings/3.0.0/functions/BlzUnitEnableAuras) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzUnitEnableAuras))

***

### endAbilityCooldown()

> **endAbilityCooldown**(`abilCode`): `void`

Defined in: [handles/unit.ts:1454](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L1454)

Ends the cooldown of one of the unit's abilities at once.

#### Parameters

##### abilCode

`number`

The ability's rawcode.

#### Returns

`void`

#### Native

[BlzEndUnitAbilityCooldown](/typings/3.0.0/functions/BlzEndUnitAbilityCooldown) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzEndUnitAbilityCooldown))

***

### equip()

> **equip**(`whichItem`): `boolean`

Defined in: [handles/unit.ts:1464](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L1464)

Equips an item on the unit.

#### Parameters

##### whichItem

[`Item`](Item.md)

The item to equip.

#### Returns

`boolean`

True when the item was equipped.

#### Native

[UnitEquipItem](/typings/3.0.0/functions/UnitEquipItem) ([jassbot](https://lep.duckdns.org/jassbot/doc/UnitEquipItem))

***

### equippedItem()

> **equippedItem**(`slot`): [`Item`](Item.md) \| `undefined`

Defined in: [handles/unit.ts:1475](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L1475)

Gets the item equipped in one of the unit's loadout slots.

#### Parameters

##### slot

[`LoadoutSlot`](../enumerations/LoadoutSlot.md)

The loadout slot.

#### Returns

[`Item`](Item.md) \| `undefined`

The item, or `undefined` when the slot is empty.

#### Native

[UnitItemInEquipmentSlot](/typings/3.0.0/functions/UnitItemInEquipmentSlot) ([jassbot](https://lep.duckdns.org/jassbot/doc/UnitItemInEquipmentSlot))

#### Native

[ConvertLoadoutSlot](/typings/3.0.0/functions/ConvertLoadoutSlot) ([jassbot](https://lep.duckdns.org/jassbot/doc/ConvertLoadoutSlot))

***

### forceStopOrder()

> **forceStopOrder**(`clearQueue`): `void`

Defined in: [handles/unit.ts:3316](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L3316)

Stops the unit's current order, through `BlzUnitForceStopOrder`.

#### Parameters

##### clearQueue

`boolean`

Also clears the queued orders.

#### Returns

`void`

#### Native

[BlzUnitForceStopOrder](/typings/3.0.0/functions/BlzUnitForceStopOrder) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzUnitForceStopOrder))

***

### getAbility()

> **getAbility**(`abilId`): `ability` \| `undefined`

Defined in: [handles/unit.ts:1487](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L1487)

Gets the unit's instance of an ability, for the ability Natives.

#### Parameters

##### abilId

`number`

The ability's rawcode.

#### Returns

`ability` \| `undefined`

The game's `ability` Handle, or `undefined` when the unit lacks the ability.

#### Native

[BlzGetUnitAbility](/typings/3.0.0/functions/BlzGetUnitAbility) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzGetUnitAbility))

***

### getAbilityByIndex()

> **getAbilityByIndex**(`index`): `ability` \| `undefined`

Defined in: [handles/unit.ts:1497](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L1497)

Gets one of the unit's ability instances by its index, buffs included.

#### Parameters

##### index

`number`

The index, from 0: the ability added last is at 0.

#### Returns

`ability` \| `undefined`

The game's `ability` Handle, or `undefined` past the last index.

#### Native

[BlzGetUnitAbilityByIndex](/typings/3.0.0/functions/BlzGetUnitAbilityByIndex) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzGetUnitAbilityByIndex))

***

### getAbilityCooldown()

> **getAbilityCooldown**(`abilId`, `level`): `number`

Defined in: [handles/unit.ts:1508](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L1508)

Gets the full cooldown of one of the unit's abilities at a level, not the time remaining.

#### Parameters

##### abilId

`number`

The ability's rawcode.

##### level

`number`

The ability level, counted from 0 (level 1 is 0).

#### Returns

`number`

The cooldown, in seconds.

#### Native

[BlzGetUnitAbilityCooldown](/typings/3.0.0/functions/BlzGetUnitAbilityCooldown) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzGetUnitAbilityCooldown))

***

### getAbilityCooldownPercent()

> **getAbilityCooldownPercent**(`abilId`): `number`

Defined in: [handles/unit.ts:1518](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L1518)

Gets the remaining cooldown of one of the unit's abilities as a share of its full cooldown.

#### Parameters

##### abilId

`number`

The ability's rawcode.

#### Returns

`number`

The share of the cooldown left.

#### Native

[BlzGetUnitAbilityCooldownPercent](/typings/3.0.0/functions/BlzGetUnitAbilityCooldownPercent) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzGetUnitAbilityCooldownPercent))

***

### getAbilityCooldownRemaining()

> **getAbilityCooldownRemaining**(`abilId`): `number`

Defined in: [handles/unit.ts:1530](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L1530)

Gets the remaining cooldown of one of the unit's abilities.

#### Parameters

##### abilId

`number`

The ability's rawcode.

#### Returns

`number`

The time left, in seconds; 0 when the ability is ready.

#### Native

[BlzGetUnitAbilityCooldownRemaining](/typings/3.0.0/functions/BlzGetUnitAbilityCooldownRemaining) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzGetUnitAbilityCooldownRemaining))

#### Bug

During the cooldown of an ability built on Channel, it sometimes
gives 0.

***

### getAbilityLevel()

> **getAbilityLevel**(`abilCode`): `number`

Defined in: [handles/unit.ts:1541](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L1541)

Gets the level the unit has in one of its abilities.

#### Parameters

##### abilCode

`number`

The ability's rawcode.

#### Returns

`number`

The level, from 1; 0 when the unit lacks the ability.

#### Remarks

Levels count from 1, not from 0.

#### Native

[GetUnitAbilityLevel](/typings/3.0.0/functions/GetUnitAbilityLevel) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetUnitAbilityLevel))

***

### getAbilityManaCost()

> **getAbilityManaCost**(`abilId`, `level`): `number`

Defined in: [handles/unit.ts:1552](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L1552)

Gets the mana cost of one of the unit's abilities at a level.

#### Parameters

##### abilId

`number`

The ability's rawcode.

##### level

`number`

The ability level, counted from 0 (level 1 is 0).

#### Returns

`number`

The mana cost.

#### Native

[BlzGetUnitAbilityManaCost](/typings/3.0.0/functions/BlzGetUnitAbilityManaCost) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzGetUnitAbilityManaCost))

***

### getAgility()

> **getAgility**(`includeBonuses`): `number`

Defined in: [handles/unit.ts:1562](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L1562)

Gets the hero's agility.

#### Parameters

##### includeBonuses

`boolean`

True to add the bonuses of items and buffs.

#### Returns

`number`

The agility; 0 for a unit that is not a hero.

#### Native

[GetHeroAgi](/typings/3.0.0/functions/GetHeroAgi) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetHeroAgi))

***

### getAnimationDuration()

> **getAnimationDuration**(`animation`): `number`

Defined in: [handles/unit.ts:1573](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L1573)

Gets the duration of one of the animations of the unit's model.

#### Parameters

##### animation

`string` \| `number`

The animation's name, or its index in the model.

#### Returns

`number`

The duration, in seconds.

#### Native

[BlzGetUnitAnimationDuration](/typings/3.0.0/functions/BlzGetUnitAnimationDuration) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzGetUnitAnimationDuration))

#### Native

[BlzGetUnitAnimationDurationByIndex](/typings/3.0.0/functions/BlzGetUnitAnimationDurationByIndex) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzGetUnitAnimationDurationByIndex))

***

### getAttackCooldown()

> **getAttackCooldown**(`weaponIndex`): `number`

Defined in: [handles/unit.ts:1587](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L1587)

Gets the base cooldown of one of the unit's attacks, without the bonuses of
items, agility and buffs.

#### Parameters

##### weaponIndex

`number`

The attack, 0 or 1.

#### Returns

`number`

The cooldown, in seconds.

#### Native

[BlzGetUnitAttackCooldown](/typings/3.0.0/functions/BlzGetUnitAttackCooldown) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzGetUnitAttackCooldown))

***

### getBaseDamage()

> **getBaseDamage**(`weaponIndex`): `number`

Defined in: [handles/unit.ts:1597](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L1597)

Gets the base damage of one of the unit's attacks, added to the dice roll.

#### Parameters

##### weaponIndex

`number`

The attack, 0 or 1.

#### Returns

`number`

The base damage.

#### Native

[BlzGetUnitBaseDamage](/typings/3.0.0/functions/BlzGetUnitBaseDamage) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzGetUnitBaseDamage))

***

### getDiceNumber()

> **getDiceNumber**(`weaponIndex`): `number`

Defined in: [handles/unit.ts:1607](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L1607)

Gets the number of dice one of the unit's attacks rolls for its damage.

#### Parameters

##### weaponIndex

`number`

The attack, 0 or 1.

#### Returns

`number`

The number of dice.

#### Native

[BlzGetUnitDiceNumber](/typings/3.0.0/functions/BlzGetUnitDiceNumber) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzGetUnitDiceNumber))

***

### getDiceSides()

> **getDiceSides**(`weaponIndex`): `number`

Defined in: [handles/unit.ts:1617](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L1617)

Gets the number of sides of the dice one of the unit's attacks rolls for its damage.

#### Parameters

##### weaponIndex

`number`

The attack, 0 or 1.

#### Returns

`number`

The number of sides.

#### Native

[BlzGetUnitDiceSides](/typings/3.0.0/functions/BlzGetUnitDiceSides) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzGetUnitDiceSides))

***

### getField()

> **getField**(`field`): `string` \| `number` \| `boolean` \| `undefined`

Defined in: [handles/unit.ts:1633](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L1633)

Reads one of the unit's fields, through the Native of the field's type.

#### Parameters

##### field

`unitbooleanfield` \| `unitintegerfield` \| `unitrealfield` \| `unitstringfield`

A field constant of any of the four types, such as `UNIT_RF_SELECTION_SCALE`.

#### Returns

`string` \| `number` \| `boolean` \| `undefined`

The field's value, as a boolean, a number or a string, or 0 for a
constant of no known field type.

#### Remarks

Many fields do not work: the game ignores them.

#### Native

[BlzGetUnitBooleanField](/typings/3.0.0/functions/BlzGetUnitBooleanField) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzGetUnitBooleanField))

#### Native

[BlzGetUnitIntegerField](/typings/3.0.0/functions/BlzGetUnitIntegerField) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzGetUnitIntegerField))

#### Native

[BlzGetUnitRealField](/typings/3.0.0/functions/BlzGetUnitRealField) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzGetUnitRealField))

#### Native

[BlzGetUnitStringField](/typings/3.0.0/functions/BlzGetUnitStringField) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzGetUnitStringField))

***

### getflyHeight()

> **getflyHeight**(): `number`

Defined in: [handles/unit.ts:1670](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L1670)

Gets the unit's flying height above the ground.

#### Returns

`number`

The height, in world units.

#### Native

[GetUnitFlyHeight](/typings/3.0.0/functions/GetUnitFlyHeight) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetUnitFlyHeight))

***

### getHeroLevel()

> **getHeroLevel**(): `number`

Defined in: [handles/unit.ts:1679](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L1679)

Gets the hero's level.

#### Returns

`number`

The level; 0 for a unit that is not a hero.

#### Native

[GetHeroLevel](/typings/3.0.0/functions/GetHeroLevel) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetHeroLevel))

***

### getIgnoreAlarm()

> **getIgnoreAlarm**(`flag`): `boolean`

Defined in: [handles/unit.ts:1690](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L1690)

Sets whether the unit raises no alarm, the "under attack" warning, when it is
attacked; despite its name it changes the setting, which `ignoreAlarmToggled` reads.

#### Parameters

##### flag

`boolean`

True for no alarm, false for the usual one.

#### Returns

`boolean`

The boolean the game returns for the call.

#### Native

[UnitIgnoreAlarm](/typings/3.0.0/functions/UnitIgnoreAlarm) ([jassbot](https://lep.duckdns.org/jassbot/doc/UnitIgnoreAlarm))

***

### getIntelligence()

> **getIntelligence**(`includeBonuses`): `number`

Defined in: [handles/unit.ts:1700](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L1700)

Gets the hero's intelligence.

#### Parameters

##### includeBonuses

`boolean`

True to add the bonuses of items and buffs.

#### Returns

`number`

The intelligence; 0 for a unit that is not a hero.

#### Native

[GetHeroInt](/typings/3.0.0/functions/GetHeroInt) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetHeroInt))

***

### getItemInSlot()

> **getItemInSlot**(`slot`): [`Item`](Item.md) \| `undefined`

Defined in: [handles/unit.ts:1710](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L1710)

Gets the item in one of the unit's inventory slots.

#### Parameters

##### slot

`number`

The slot, from 0 to 5.

#### Returns

[`Item`](Item.md) \| `undefined`

The item, or `undefined` when the slot is empty or the unit has no such slot.

#### Native

[UnitItemInSlot](/typings/3.0.0/functions/UnitItemInSlot) ([jassbot](https://lep.duckdns.org/jassbot/doc/UnitItemInSlot))

***

### getOwner()

> **getOwner**(): [`MapPlayer`](MapPlayer.md)

Defined in: [handles/unit.ts:2940](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L2940)

Gets the player who owns the unit.

#### Returns

[`MapPlayer`](MapPlayer.md)

The owner, never `undefined`.

#### Remarks

A live unit always has an owner, which the Typings cannot express for the
Wrapper, so this goes through the non-null lookup helper: typed non-null,
and not counted as a creation.

#### Throws

Should the game ever break that invariant:
`reforged-ts: failed to create MapPlayer`, at the calling line.

#### Native

[GetOwningPlayer](/typings/3.0.0/functions/GetOwningPlayer) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetOwningPlayer))

***

### getPoint()

> **getPoint**(): [`Point`](Point.md)

Defined in: [handles/unit.ts:2963](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L2963)

Gets the unit's position as a new point, which the caller destroys.

#### Returns

[`Point`](Point.md)

A new point at the unit's position.

#### Throws

When the game returns no handle: `reforged-ts: failed to create Point`,
at the calling line. In Dev mode, also before the globals Init stage and
inside `MapPlayer.runLocal`.

#### Native

[GetUnitLoc](/typings/3.0.0/functions/GetUnitLoc) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetUnitLoc))

#### Bug

For a unit loaded into a zeppelin, it returns where the unit boarded,
not the zeppelin's position.

***

### getState()

> **getState**(`whichUnitState`): `number`

Defined in: [handles/unit.ts:1721](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L1721)

Gets one of the unit's states, such as its life or mana.

#### Parameters

##### whichUnitState

`unitstate`

The state, such as `UNIT_STATE_LIFE` or `UNIT_STATE_MAX_MANA`.

#### Returns

`number`

The value, in the state's own unit: hit points for
`UNIT_STATE_LIFE`, mana for `UNIT_STATE_MANA`.

#### Native

[GetUnitState](/typings/3.0.0/functions/GetUnitState) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetUnitState))

***

### getStrength()

> **getStrength**(`includeBonuses`): `number`

Defined in: [handles/unit.ts:1731](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L1731)

Gets the hero's strength.

#### Parameters

##### includeBonuses

`boolean`

True to add the bonuses of items and buffs.

#### Returns

`number`

The strength; 0 for a unit that is not a hero.

#### Native

[GetHeroStr](/typings/3.0.0/functions/GetHeroStr) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetHeroStr))

***

### getWeaponField()

> **getWeaponField**(`field`, `index`): `string` \| `number` \| `boolean` \| `undefined`

Defined in: [handles/unit.ts:3333](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L3333)

Reads a field of one of the unit's weapons, through the
`BlzGetUnitWeapon*Field` Native of the field's type.

#### Parameters

##### field

`unitweaponbooleanfield` \| `unitweaponintegerfield` \| `unitweaponrealfield` \| `unitweaponstringfield`

A weapon field constant of any of the four field types.

##### index

`number`

The weapon's index.

#### Returns

`string` \| `number` \| `boolean` \| `undefined`

The field's value, as a boolean, a number or a string, or 0 for a
constant of no known field type.

#### Native

[BlzGetUnitWeaponBooleanField](/typings/3.0.0/functions/BlzGetUnitWeaponBooleanField) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzGetUnitWeaponBooleanField))

#### Native

[BlzGetUnitWeaponIntegerField](/typings/3.0.0/functions/BlzGetUnitWeaponIntegerField) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzGetUnitWeaponIntegerField))

#### Native

[BlzGetUnitWeaponRealField](/typings/3.0.0/functions/BlzGetUnitWeaponRealField) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzGetUnitWeaponRealField))

#### Native

[BlzGetUnitWeaponStringField](/typings/3.0.0/functions/BlzGetUnitWeaponStringField) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzGetUnitWeaponStringField))

#### Bug

A unit without any attack can make it crash the game.

***

### hasAnyEquipped()

> **hasAnyEquipped**(): `boolean`

Defined in: [handles/unit.ts:1742](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L1742)

Checks whether the unit has any item equipped.

#### Returns

`boolean`

True when an item is equipped.

#### Remarks

The Native's name is misspelt: `UnitHasAnyItemEquiped`.

#### Native

[UnitHasAnyItemEquiped](/typings/3.0.0/functions/UnitHasAnyItemEquiped) ([jassbot](https://lep.duckdns.org/jassbot/doc/UnitHasAnyItemEquiped))

***

### hasBagged()

> **hasBagged**(`whichItem`): `boolean`

Defined in: [handles/unit.ts:1752](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L1752)

Checks whether an item is in the unit's bag.

#### Parameters

##### whichItem

[`Item`](Item.md)

The item to look for in the bag.

#### Returns

`boolean`

True when the item is in the bag.

#### Native

[UnitHasItemBagged](/typings/3.0.0/functions/UnitHasItemBagged) ([jassbot](https://lep.duckdns.org/jassbot/doc/UnitHasItemBagged))

***

### hasBuffs()

> **hasBuffs**(`removePositive`, `removeNegative`, `magic`, `physical`, `timedLife`, `aura`, `autoDispel`): `boolean`

Defined in: [handles/unit.ts:1772](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L1772)

Checks whether the unit has any buff that matches the filters.

#### Parameters

##### removePositive

`boolean`

Matches positive buffs; with `removeNegative`, both
false matches positive and negative buffs.

##### removeNegative

`boolean`

Matches negative buffs.

##### magic

`boolean`

Matches only magical buffs, unless `physical` is true too, which
matches none; both false matches magical and physical buffs.

##### physical

`boolean`

Matches only physical buffs, unless `magic` is true too.

##### timedLife

`boolean`

Includes timed-life buffs; false leaves them out.

##### aura

`boolean`

Includes aura buffs; false leaves them out.

##### autoDispel

`boolean`

Matches only the buffs that dispelling removes.

#### Returns

`boolean`

True when a buff matches.

#### Remarks

The filters combine as in `countBuffs`.

#### Native

[UnitHasBuffsEx](/typings/3.0.0/functions/UnitHasBuffsEx) ([jassbot](https://lep.duckdns.org/jassbot/doc/UnitHasBuffsEx))

***

### hasEmptySlot()

> **hasEmptySlot**(`slot`): `boolean`

Defined in: [handles/unit.ts:1800](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L1800)

Checks whether one of the unit's loadout slots is empty.

#### Parameters

##### slot

[`LoadoutSlot`](../enumerations/LoadoutSlot.md)

The loadout slot.

#### Returns

`boolean`

True when the slot is empty.

#### Native

[UnitHasLoadoutSlotEmpty](/typings/3.0.0/functions/UnitHasLoadoutSlotEmpty) ([jassbot](https://lep.duckdns.org/jassbot/doc/UnitHasLoadoutSlotEmpty))

#### Native

[ConvertLoadoutSlot](/typings/3.0.0/functions/ConvertLoadoutSlot) ([jassbot](https://lep.duckdns.org/jassbot/doc/ConvertLoadoutSlot))

***

### hasEquipmentOfType()

> **hasEquipmentOfType**(`equipmentType`): `boolean`

Defined in: [handles/unit.ts:1811](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L1811)

Checks whether the unit has an item of an equipment type equipped.

#### Parameters

##### equipmentType

[`EquipmentType`](../enumerations/EquipmentType.md)

The equipment type.

#### Returns

`boolean`

True when such an item is equipped.

#### Native

[UnitHasItemEquipmentOfType](/typings/3.0.0/functions/UnitHasItemEquipmentOfType) ([jassbot](https://lep.duckdns.org/jassbot/doc/UnitHasItemEquipmentOfType))

#### Native

[ConvertEquipmentType](/typings/3.0.0/functions/ConvertEquipmentType) ([jassbot](https://lep.duckdns.org/jassbot/doc/ConvertEquipmentType))

***

### hasEquipped()

> **hasEquipped**(`whichItem`): `boolean`

Defined in: [handles/unit.ts:1824](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L1824)

Checks whether the unit has an item equipped.

#### Parameters

##### whichItem

[`Item`](Item.md)

The item to look for among the equipped ones.

#### Returns

`boolean`

True when the item is equipped.

#### Native

[UnitHasItemEquipped](/typings/3.0.0/functions/UnitHasItemEquipped) ([jassbot](https://lep.duckdns.org/jassbot/doc/UnitHasItemEquipped))

***

### hasItem()

> **hasItem**(`whichItem`): `boolean`

Defined in: [handles/unit.ts:1834](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L1834)

Checks whether an item is in the unit's inventory.

#### Parameters

##### whichItem

[`Item`](Item.md)

The item to look for in the inventory's slots.

#### Returns

`boolean`

True when the unit carries the item.

#### Native

[UnitHasItem](/typings/3.0.0/functions/UnitHasItem) ([jassbot](https://lep.duckdns.org/jassbot/doc/UnitHasItem))

***

### hideAbility()

> **hideAbility**(`abilId`, `flag`): `void`

Defined in: [handles/unit.ts:1846](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L1846)

Hides or shows the icon of one of the unit's abilities.

#### Parameters

##### abilId

`number`

The ability's rawcode.

##### flag

`boolean`

True to hide the icon, false to show it.

#### Returns

`void`

#### Native

[BlzUnitHideAbility](/typings/3.0.0/functions/BlzUnitHideAbility) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzUnitHideAbility))

#### Bug

The game counts the calls instead of storing the flag: after hiding an
icon several times, as many calls are needed to show it again.

***

### incAbilityLevel()

> **incAbilityLevel**(`abilCode`): `number`

Defined in: [handles/unit.ts:1860](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L1860)

Raises one of the unit's abilities by one level.

#### Parameters

##### abilCode

`number`

The ability's rawcode, such as `FourCC("AHbz")`.

#### Returns

`number`

The new ability level.

#### Remarks

It can take an ability one level past its maximum, where every
field of the ability is 0. Sources:
http://www.wc3c.net/showthread.php?p=1029039#post1029039 and
http://www.hiveworkshop.com/forums/lab-715/silenceex-everything-you-dont-know-about-silence-274351/.

#### Native

[IncUnitAbilityLevel](/typings/3.0.0/functions/IncUnitAbilityLevel) ([jassbot](https://lep.duckdns.org/jassbot/doc/IncUnitAbilityLevel))

***

### inForce()

> **inForce**(`whichForce`): `boolean`

Defined in: [handles/unit.ts:1870](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L1870)

Checks whether the unit's owner is in a force.

#### Parameters

##### whichForce

[`Force`](Force.md)

The force to look for the unit's owner in.

#### Returns

`boolean`

True when the unit's owner belongs to the force.

#### Native

[IsUnitInForce](/typings/3.0.0/functions/IsUnitInForce) ([jassbot](https://lep.duckdns.org/jassbot/doc/IsUnitInForce))

***

### inGroup()

> **inGroup**(`whichGroup`): `boolean`

Defined in: [handles/unit.ts:1880](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L1880)

Checks whether the unit is in a group.

#### Parameters

##### whichGroup

[`Group`](Group.md)

The group to look for the unit in.

#### Returns

`boolean`

True when the group holds the unit.

#### Native

[IsUnitInGroup](/typings/3.0.0/functions/IsUnitInGroup) ([jassbot](https://lep.duckdns.org/jassbot/doc/IsUnitInGroup))

***

### inRange()

> **inRange**(`x`, `y`, `distance`): `boolean`

Defined in: [handles/unit.ts:1892](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L1892)

Checks whether the unit is within a distance of a point, counting its collision size.

#### Parameters

##### x

`number`

The point's x-coordinate, in world units.

##### y

`number`

The point's y-coordinate, in world units.

##### distance

`number`

The distance, in world units.

#### Returns

`boolean`

True when the unit is in range.

#### Native

[IsUnitInRangeXY](/typings/3.0.0/functions/IsUnitInRangeXY) ([jassbot](https://lep.duckdns.org/jassbot/doc/IsUnitInRangeXY))

***

### inRangeOfPoint()

> **inRangeOfPoint**(`whichPoint`, `distance`): `boolean`

Defined in: [handles/unit.ts:1903](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L1903)

Checks whether the unit is within a distance of a point, counting its collision size.

#### Parameters

##### whichPoint

[`Point`](Point.md)

The point to measure the distance from.

##### distance

`number`

The distance, in world units.

#### Returns

`boolean`

True when the unit is in range.

#### Native

[IsUnitInRangeLoc](/typings/3.0.0/functions/IsUnitInRangeLoc) ([jassbot](https://lep.duckdns.org/jassbot/doc/IsUnitInRangeLoc))

***

### inRangeOfUnit()

> **inRangeOfUnit**(`otherUnit`, `distance`): `boolean`

Defined in: [handles/unit.ts:1914](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L1914)

Checks whether the unit is within a distance of another unit, counting its collision size.

#### Parameters

##### otherUnit

`Unit`

The unit to measure the distance from.

##### distance

`number`

The distance, in world units.

#### Returns

`boolean`

True when the unit is in range.

#### Native

[IsUnitInRange](/typings/3.0.0/functions/IsUnitInRange) ([jassbot](https://lep.duckdns.org/jassbot/doc/IsUnitInRange))

***

### interruptAttack()

> **interruptAttack**(): `void`

Defined in: [handles/unit.ts:1922](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L1922)

Interrupts the attack the unit is winding up.

#### Returns

`void`

#### Native

[BlzUnitInterruptAttack](/typings/3.0.0/functions/BlzUnitInterruptAttack) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzUnitInterruptAttack))

***

### inTransport()

> **inTransport**(`whichTransport`): `boolean`

Defined in: [handles/unit.ts:1933](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L1933)

Checks whether the unit is loaded into a transport.

#### Parameters

##### whichTransport

`Unit`

The transport to look in, such as a Goblin
Zeppelin.

#### Returns

`boolean`

True when the unit is loaded into that transport.

#### Native

[IsUnitInTransport](/typings/3.0.0/functions/IsUnitInTransport) ([jassbot](https://lep.duckdns.org/jassbot/doc/IsUnitInTransport))

***

### isAlive()

> **isAlive**(): `boolean`

Defined in: [handles/unit.ts:1942](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L1942)

Checks whether the unit is alive.

#### Returns

`boolean`

True when the unit is alive; false once it died or was removed.

#### Native

[UnitAlive](/typings/3.0.0/functions/UnitAlive) ([jassbot](https://lep.duckdns.org/jassbot/doc/UnitAlive))

***

### isAlly()

> **isAlly**(`whichPlayer`): `boolean`

Defined in: [handles/unit.ts:1952](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L1952)

Checks whether the unit's owner is an ally of a player.

#### Parameters

##### whichPlayer

[`MapPlayer`](MapPlayer.md)

The player to compare the unit's owner with.

#### Returns

`boolean`

True when the unit is the player's ally.

#### Native

[IsUnitAlly](/typings/3.0.0/functions/IsUnitAlly) ([jassbot](https://lep.duckdns.org/jassbot/doc/IsUnitAlly))

***

### isDetected()

> **isDetected**(`whichPlayer`): `boolean`

Defined in: [handles/unit.ts:3379](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L3379)

Checks whether a player detects the unit, as a detector reveals an invisible unit.

#### Parameters

##### whichPlayer

[`MapPlayer`](MapPlayer.md)

The player whose detection decides.

#### Returns

`boolean`

True when the player detects the unit.

#### Native

[IsUnitDetected](/typings/3.0.0/functions/IsUnitDetected) ([jassbot](https://lep.duckdns.org/jassbot/doc/IsUnitDetected))

***

### isEnemy()

> **isEnemy**(`whichPlayer`): `boolean`

Defined in: [handles/unit.ts:1962](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L1962)

Checks whether the unit's owner is an enemy of a player.

#### Parameters

##### whichPlayer

[`MapPlayer`](MapPlayer.md)

The player to compare the unit's owner with.

#### Returns

`boolean`

True when the unit is the player's enemy.

#### Native

[IsUnitEnemy](/typings/3.0.0/functions/IsUnitEnemy) ([jassbot](https://lep.duckdns.org/jassbot/doc/IsUnitEnemy))

***

### isExperienceSuspended()

> **isExperienceSuspended**(): `boolean`

Defined in: [handles/unit.ts:1971](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L1971)

Checks whether the hero gains no experience, as `suspendExperience` sets.

#### Returns

`boolean`

True when the hero's experience is suspended.

#### Native

[IsSuspendedXP](/typings/3.0.0/functions/IsSuspendedXP) ([jassbot](https://lep.duckdns.org/jassbot/doc/IsSuspendedXP))

***

### isFogged()

> **isFogged**(`whichPlayer`): `boolean`

Defined in: [handles/unit.ts:1981](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L1981)

Checks whether the unit stands in the fog of war for a player.

#### Parameters

##### whichPlayer

[`MapPlayer`](MapPlayer.md)

The player whose view of the map decides.

#### Returns

`boolean`

True when the unit is fogged for the player.

#### Native

[IsUnitFogged](/typings/3.0.0/functions/IsUnitFogged) ([jassbot](https://lep.duckdns.org/jassbot/doc/IsUnitFogged))

***

### isHero()

> **isHero**(): `boolean`

Defined in: [handles/unit.ts:1991](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L1991)

Checks whether the unit's type is a hero type.

#### Returns

`boolean`

True when the unit is a hero.

#### Native

[GetUnitTypeId](/typings/3.0.0/functions/GetUnitTypeId) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetUnitTypeId))

#### Native

[IsHeroUnitId](/typings/3.0.0/functions/IsHeroUnitId) ([jassbot](https://lep.duckdns.org/jassbot/doc/IsHeroUnitId))

***

### isIllusion()

> **isIllusion**(): `boolean`

Defined in: [handles/unit.ts:2000](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L2000)

Checks whether the unit is an illusion.

#### Returns

`boolean`

True when the unit is an illusion.

#### Native

[IsUnitIllusion](/typings/3.0.0/functions/IsUnitIllusion) ([jassbot](https://lep.duckdns.org/jassbot/doc/IsUnitIllusion))

***

### isInvisible()

> **isInvisible**(`whichPlayer`): `boolean`

Defined in: [handles/unit.ts:3389](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L3389)

Checks whether the unit is invisible to a player.

#### Parameters

##### whichPlayer

[`MapPlayer`](MapPlayer.md)

The player whose view of the map decides.

#### Returns

`boolean`

True when the unit is invisible to the player.

#### Native

[IsUnitInvisible](/typings/3.0.0/functions/IsUnitInvisible) ([jassbot](https://lep.duckdns.org/jassbot/doc/IsUnitInvisible))

***

### isLoaded()

> **isLoaded**(): `boolean`

Defined in: [handles/unit.ts:2009](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L2009)

Checks whether the unit is loaded into a transport.

#### Returns

`boolean`

True when the unit is loaded.

#### Native

[IsUnitLoaded](/typings/3.0.0/functions/IsUnitLoaded) ([jassbot](https://lep.duckdns.org/jassbot/doc/IsUnitLoaded))

***

### isMasked()

> **isMasked**(`whichPlayer`): `boolean`

Defined in: [handles/unit.ts:2020](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L2020)

Checks whether the unit stands under the black mask for a player, in the part
of the map that player has never explored.

#### Parameters

##### whichPlayer

[`MapPlayer`](MapPlayer.md)

The player whose view of the map decides.

#### Returns

`boolean`

True when the unit is masked for the player.

#### Native

[IsUnitMasked](/typings/3.0.0/functions/IsUnitMasked) ([jassbot](https://lep.duckdns.org/jassbot/doc/IsUnitMasked))

***

### isOwnedByPlayer()

> **isOwnedByPlayer**(`whichPlayer`): `boolean`

Defined in: [handles/unit.ts:3399](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L3399)

Checks whether a player owns the unit.

#### Parameters

##### whichPlayer

[`MapPlayer`](MapPlayer.md)

The player to compare with the unit's owner.

#### Returns

`boolean`

True when the player owns the unit.

#### Native

[IsUnitOwnedByPlayer](/typings/3.0.0/functions/IsUnitOwnedByPlayer) ([jassbot](https://lep.duckdns.org/jassbot/doc/IsUnitOwnedByPlayer))

***

### isRace()

> **isRace**(`whichRace`): `boolean`

Defined in: [handles/unit.ts:3409](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L3409)

Checks whether the unit's type is of a race.

#### Parameters

##### whichRace

`race`

The race, such as `RACE_HUMAN`.

#### Returns

`boolean`

True when the unit is of the race.

#### Native

[IsUnitRace](/typings/3.0.0/functions/IsUnitRace) ([jassbot](https://lep.duckdns.org/jassbot/doc/IsUnitRace))

***

### isSelected()

> **isSelected**(`whichPlayer`): `boolean`

Defined in: [handles/unit.ts:2030](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L2030)

Checks whether a player has the unit selected.

#### Parameters

##### whichPlayer

[`MapPlayer`](MapPlayer.md)

The player whose selection is read.

#### Returns

`boolean`

True when the unit is in the player's selection.

#### Native

[IsUnitSelected](/typings/3.0.0/functions/IsUnitSelected) ([jassbot](https://lep.duckdns.org/jassbot/doc/IsUnitSelected))

***

### issueBuildOrder()

> **issueBuildOrder**(`unit`, `x`, `y`): `boolean`

Defined in: [handles/unit.ts:2045](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L2045)

Orders the unit to build a structure at a point.

#### Parameters

##### unit

`string` \| `number`

The structure's order name, or its unit type's rawcode.

##### x

`number`

The x-coordinate, in world units.

##### y

`number`

The y-coordinate, in world units.

#### Returns

`boolean`

True when the unit took the order.

#### Native

[IssueBuildOrder](/typings/3.0.0/functions/IssueBuildOrder) ([jassbot](https://lep.duckdns.org/jassbot/doc/IssueBuildOrder))

#### Native

[IssueBuildOrderById](/typings/3.0.0/functions/IssueBuildOrderById) ([jassbot](https://lep.duckdns.org/jassbot/doc/IssueBuildOrderById))

#### Bug

It returns true for a structure the unit can build on a free spot, even
when the player cannot afford it.

***

### issueImmediateOrder()

> **issueImmediateOrder**(`order`): `boolean`

Defined in: [handles/unit.ts:2058](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L2058)

Orders the unit to carry out an order that takes no target, such as `"stop"`.

#### Parameters

##### order

`string` \| [`OrderId`](../reforged-ts/namespaces/tsGlobals/enumerations/OrderId.md)

The order's name, or its id.

#### Returns

`boolean`

True when the unit took the order.

#### Native

[IssueImmediateOrder](/typings/3.0.0/functions/IssueImmediateOrder) ([jassbot](https://lep.duckdns.org/jassbot/doc/IssueImmediateOrder))

#### Native

[IssueImmediateOrderById](/typings/3.0.0/functions/IssueImmediateOrderById) ([jassbot](https://lep.duckdns.org/jassbot/doc/IssueImmediateOrderById))

***

### issueInstantOrderAt()

> **issueInstantOrderAt**(`order`, `x`, `y`, `instantTargetWidget`): `boolean`

Defined in: [handles/unit.ts:2074](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L2074)

Orders the unit to carry out an order at a point, with a widget as its instant target.

#### Parameters

##### order

`string` \| [`OrderId`](../reforged-ts/namespaces/tsGlobals/enumerations/OrderId.md)

The order's name, or its id.

##### x

`number`

The x-coordinate, in world units.

##### y

`number`

The y-coordinate, in world units.

##### instantTargetWidget

[`Widget`](Widget.md)

The instant target.

#### Returns

`boolean`

True when the unit took the order.

#### Native

[IssueInstantPointOrder](/typings/3.0.0/functions/IssueInstantPointOrder) ([jassbot](https://lep.duckdns.org/jassbot/doc/IssueInstantPointOrder))

#### Native

[IssueInstantPointOrderById](/typings/3.0.0/functions/IssueInstantPointOrderById) ([jassbot](https://lep.duckdns.org/jassbot/doc/IssueInstantPointOrderById))

***

### issueInstantTargetOrder()

> **issueInstantTargetOrder**(`order`, `targetWidget`, `instantTargetWidget`): `boolean`

Defined in: [handles/unit.ts:2106](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L2106)

Orders the unit to carry out an order on a target, with another widget as its instant target.

#### Parameters

##### order

`string` \| [`OrderId`](../reforged-ts/namespaces/tsGlobals/enumerations/OrderId.md)

The order's name, or its id.

##### targetWidget

[`Widget`](Widget.md)

The order's target.

##### instantTargetWidget

[`Widget`](Widget.md)

The instant target.

#### Returns

`boolean`

True when the unit took the order.

#### Native

[IssueInstantTargetOrder](/typings/3.0.0/functions/IssueInstantTargetOrder) ([jassbot](https://lep.duckdns.org/jassbot/doc/IssueInstantTargetOrder))

#### Native

[IssueInstantTargetOrderById](/typings/3.0.0/functions/IssueInstantTargetOrderById) ([jassbot](https://lep.duckdns.org/jassbot/doc/IssueInstantTargetOrderById))

***

### issueNeutralImmediateOrder()

> **issueNeutralImmediateOrder**(`forPlayer`, `unit`): `boolean`

Defined in: [handles/unit.ts:2135](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L2135)

Orders this neutral structure (a shop, a tavern) to sell or train `unit` for
`forPlayer`.

#### Parameters

##### forPlayer

[`MapPlayer`](MapPlayer.md)

The player who buys.

##### unit

`string` \| `number`

The order name of what is bought, or its rawcode.

#### Returns

`boolean`

True when the structure took the order.

#### Native

[IssueNeutralImmediateOrder](/typings/3.0.0/functions/IssueNeutralImmediateOrder) ([jassbot](https://lep.duckdns.org/jassbot/doc/IssueNeutralImmediateOrder))

#### Native

[IssueNeutralImmediateOrderById](/typings/3.0.0/functions/IssueNeutralImmediateOrderById) ([jassbot](https://lep.duckdns.org/jassbot/doc/IssueNeutralImmediateOrderById))

***

### issueNeutralPointOrder()

> **issueNeutralPointOrder**(`forPlayer`, `unit`, `x`, `y`): `boolean`

Defined in: [handles/unit.ts:2154](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L2154)

Orders this neutral structure to use `unit` for `forPlayer` at a point.

#### Parameters

##### forPlayer

[`MapPlayer`](MapPlayer.md)

The player the structure acts for.

##### unit

`string` \| `number`

The order's name, or its id.

##### x

`number`

The x-coordinate, in world units.

##### y

`number`

The y-coordinate, in world units.

#### Returns

`boolean`

True when the structure took the order.

#### Native

[IssueNeutralPointOrder](/typings/3.0.0/functions/IssueNeutralPointOrder) ([jassbot](https://lep.duckdns.org/jassbot/doc/IssueNeutralPointOrder))

#### Native

[IssueNeutralPointOrderById](/typings/3.0.0/functions/IssueNeutralPointOrderById) ([jassbot](https://lep.duckdns.org/jassbot/doc/IssueNeutralPointOrderById))

***

### issueNeutralTargetOrder()

> **issueNeutralTargetOrder**(`forPlayer`, `unit`, `target`): `boolean`

Defined in: [handles/unit.ts:2174](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L2174)

Orders this neutral structure to use `unit` for `forPlayer` on `target`.

#### Parameters

##### forPlayer

[`MapPlayer`](MapPlayer.md)

The player the structure acts for.

##### unit

`string` \| `number`

The order's name, or its id.

##### target

[`Widget`](Widget.md)

The order's target.

#### Returns

`boolean`

True when the structure took the order.

#### Native

[IssueNeutralTargetOrder](/typings/3.0.0/functions/IssueNeutralTargetOrder) ([jassbot](https://lep.duckdns.org/jassbot/doc/IssueNeutralTargetOrder))

#### Native

[IssueNeutralTargetOrderById](/typings/3.0.0/functions/IssueNeutralTargetOrderById) ([jassbot](https://lep.duckdns.org/jassbot/doc/IssueNeutralTargetOrderById))

***

### issueOrderAt()

> **issueOrderAt**(`order`, `x`, `y`): `boolean`

Defined in: [handles/unit.ts:2204](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L2204)

Orders the unit to carry out an order at a point, such as `"move"`.

#### Parameters

##### order

`string` \| [`OrderId`](../reforged-ts/namespaces/tsGlobals/enumerations/OrderId.md)

The order's name, or its id.

##### x

`number`

The x-coordinate, in world units.

##### y

`number`

The y-coordinate, in world units.

#### Returns

`boolean`

True when the unit took the order.

#### Native

[IssuePointOrder](/typings/3.0.0/functions/IssuePointOrder) ([jassbot](https://lep.duckdns.org/jassbot/doc/IssuePointOrder))

#### Native

[IssuePointOrderById](/typings/3.0.0/functions/IssuePointOrderById) ([jassbot](https://lep.duckdns.org/jassbot/doc/IssuePointOrderById))

#### Bug

For a build order it returns false, whether or not the unit obeys.

***

### issuePointOrder()

> **issuePointOrder**(`order`, `whichPoint`): `boolean`

Defined in: [handles/unit.ts:2219](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L2219)

Orders the unit to carry out an order at a point, such as `"move"`.

#### Parameters

##### order

`string` \| [`OrderId`](../reforged-ts/namespaces/tsGlobals/enumerations/OrderId.md)

The order's name, or its id.

##### whichPoint

[`Point`](Point.md)

The point the order targets.

#### Returns

`boolean`

True when the unit took the order.

#### Native

[IssuePointOrderLoc](/typings/3.0.0/functions/IssuePointOrderLoc) ([jassbot](https://lep.duckdns.org/jassbot/doc/IssuePointOrderLoc))

#### Native

[IssuePointOrderByIdLoc](/typings/3.0.0/functions/IssuePointOrderByIdLoc) ([jassbot](https://lep.duckdns.org/jassbot/doc/IssuePointOrderByIdLoc))

#### Bug

For a build order it returns false, whether or not the unit obeys.

***

### issueTargetOrder()

> **issueTargetOrder**(`order`, `targetWidget`): `boolean`

Defined in: [handles/unit.ts:2233](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L2233)

Orders the unit to carry out an order on a target, such as `"attack"`.

#### Parameters

##### order

`string` \| [`OrderId`](../reforged-ts/namespaces/tsGlobals/enumerations/OrderId.md)

The order's name, or its id.

##### targetWidget

[`Widget`](Widget.md)

The order's target.

#### Returns

`boolean`

True when the unit took the order.

#### Native

[IssueTargetOrder](/typings/3.0.0/functions/IssueTargetOrder) ([jassbot](https://lep.duckdns.org/jassbot/doc/IssueTargetOrder))

#### Native

[IssueTargetOrderById](/typings/3.0.0/functions/IssueTargetOrderById) ([jassbot](https://lep.duckdns.org/jassbot/doc/IssueTargetOrderById))

***

### isUnit()

> **isUnit**(`whichSpecifiedUnit`): `boolean`

Defined in: [handles/unit.ts:2246](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L2246)

Checks whether another Wrapper wraps the same unit.

#### Parameters

##### whichSpecifiedUnit

`Unit`

The other unit.

#### Returns

`boolean`

True when both are the same unit.

#### Remarks

Useless. Use operator == instead.

#### Native

[IsUnit](/typings/3.0.0/functions/IsUnit) ([jassbot](https://lep.duckdns.org/jassbot/doc/IsUnit))

***

### isUnitType()

> **isUnitType**(`whichUnitType`): `boolean`

Defined in: [handles/unit.ts:2262](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L2262)

Checks whether the unit has a classification, such as `UNIT_TYPE_STRUCTURE`.

#### Parameters

##### whichUnitType

`unittype`

The classification.

#### Returns

`boolean`

True when the unit has it.

#### Remarks

- Read as an integer, the boolean the Native returns can be above 1,
  likely because the game keeps the classifications in a bit set.
- On older patches it misbehaved inside condition functions, which a
  comparison with `true` worked around; the fault does not reproduce on
  patch 1.27.

#### Native

[IsUnitType](/typings/3.0.0/functions/IsUnitType) ([jassbot](https://lep.duckdns.org/jassbot/doc/IsUnitType))

***

### isVisible()

> **isVisible**(`whichPlayer`): `boolean`

Defined in: [handles/unit.ts:2272](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L2272)

Checks whether a player can see the unit.

#### Parameters

##### whichPlayer

[`MapPlayer`](MapPlayer.md)

The player whose view of the map decides.

#### Returns

`boolean`

True when the unit is visible to the player.

#### Native

[IsUnitVisible](/typings/3.0.0/functions/IsUnitVisible) ([jassbot](https://lep.duckdns.org/jassbot/doc/IsUnitVisible))

***

### kill()

> **kill**(): `void`

Defined in: [handles/unit.ts:2281](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L2281)

Kills the unit with no killer: it plays its death animation and fires the
death events, as a unit killed in combat does.

#### Returns

`void`

#### Native

[KillUnit](/typings/3.0.0/functions/KillUnit) ([jassbot](https://lep.duckdns.org/jassbot/doc/KillUnit))

***

### lookAt()

> **lookAt**(`whichBone`, `lookAtTarget`, `offsetX`, `offsetY`, `offsetZ`): `void`

Defined in: [handles/unit.ts:2311](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L2311)

Turns one of the unit's bones to face a point offset from another unit,
until `resetLookAt` releases it.

#### Parameters

##### whichBone

`string`

Which bone turns: a string starting with
`"bone_chest"` picks the chest, any other string that is not null the
head. Leading spaces are skipped, case does not matter, and the string
ends at its first space after them.

##### lookAtTarget

`Unit`

The unit the bone faces.

##### offsetX

`number`

The x-offset of the point faced, from the target's
origin.

##### offsetY

`number`

The y-offset of the point faced, from the target's
origin.

##### offsetZ

`number`

The z-offset of the point faced, from the target's
origin; the terrain's height is already counted in.

#### Returns

`void`

#### Remarks

- One bone at a time faces the target: the head or the chest, never
  both.
- Only the head and chest bones turn; any other choice turns the head.
  The game finds them by the helpers named `"Bone_Head"` and
  `"Bone_Chest"` in the model, so a helper renamed to one of those turns
  its own set of bones instead.
- The animation speed and the blend time affect the turn.
- Setting a unit's facing at once, on wc3c:
  http://www.wc3c.net/showthread.php?t=105830

#### Native

[SetUnitLookAt](/typings/3.0.0/functions/SetUnitLookAt) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetUnitLookAt))

***

### makeAbilityPermanent()

> **makeAbilityPermanent**(`permanent`, `abilityId`): `void`

Defined in: [handles/unit.ts:2335](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L2335)

Makes one of the unit's abilities survive a morph, or lets a morph
remove it.

#### Parameters

##### permanent

`boolean`

True to keep the ability through a morph, false to let the morph remove it.

##### abilityId

`number`

The ability's rawcode.

#### Returns

`void`

#### Native

[UnitMakeAbilityPermanent](/typings/3.0.0/functions/UnitMakeAbilityPermanent) ([jassbot](https://lep.duckdns.org/jassbot/doc/UnitMakeAbilityPermanent))

***

### modifySkillPoints()

> **modifySkillPoints**(`skillPointDelta`): `boolean`

Defined in: [handles/unit.ts:2348](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L2348)

Adds skill points to the hero, or removes them with a negative delta, down to 0.

#### Parameters

##### skillPointDelta

`number`

The points to add; negative to remove.

#### Returns

`boolean`

False when nothing could change: a delta of 0, a unit that is not a
hero, or points to remove from a hero that has none; true otherwise.

#### Remarks

The hero never gets more points than it can still spend on its abilities.

#### Native

[UnitModifySkillPoints](/typings/3.0.0/functions/UnitModifySkillPoints) ([jassbot](https://lep.duckdns.org/jassbot/doc/UnitModifySkillPoints))

***

### pauseEx()

> **pauseEx**(`flag`): `void`

Defined in: [handles/unit.ts:2358](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L2358)

Pauses or unpauses the unit as the `paused` setter does, but keeps its command
card visible and leaves the `paused` getter false.

#### Parameters

##### flag

`boolean`

True to pause the unit, false to unpause it.

#### Returns

`void`

#### Native

[BlzPauseUnitEx](/typings/3.0.0/functions/BlzPauseUnitEx) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzPauseUnitEx))

***

### pauseTimedLife()

> **pauseTimedLife**(`flag`): `void`

Defined in: [handles/unit.ts:2367](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L2367)

Pauses or resumes the countdown of the unit's timed life.

#### Parameters

##### flag

`boolean`

True to pause the countdown, false to resume it.

#### Returns

`void`

#### Native

[UnitPauseTimedLife](/typings/3.0.0/functions/UnitPauseTimedLife) ([jassbot](https://lep.duckdns.org/jassbot/doc/UnitPauseTimedLife))

***

### queueAnimation()

> **queueAnimation**(`whichAnimation`): `void`

Defined in: [handles/unit.ts:2376](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L2376)

Queues an animation to play once the current one ends, for a smooth transition.

#### Parameters

##### whichAnimation

`string`

The animation's name, such as `"stand"`, in any case.

#### Returns

`void`

#### Native

[QueueUnitAnimation](/typings/3.0.0/functions/QueueUnitAnimation) ([jassbot](https://lep.duckdns.org/jassbot/doc/QueueUnitAnimation))

***

### queueBuildOrder()

> **queueBuildOrder**(`unitId`, `x`, `y`): `boolean`

Defined in: [handles/unit.ts:3423](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L3423)

Queues an order to build a structure at a point, after the unit's current orders.

#### Parameters

##### unitId

`number`

The structure's unit type rawcode.

##### x

`number`

The x-coordinate, in world units.

##### y

`number`

The y-coordinate, in world units.

#### Returns

`boolean`

True when the unit took the order.

#### Native

[BlzQueueBuildOrderById](/typings/3.0.0/functions/BlzQueueBuildOrderById) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzQueueBuildOrderById))

#### Bug

It returns true for a structure the unit can build on a free spot, even
when the player cannot afford it.

***

### queueImmediateOrder()

> **queueImmediateOrder**(`order`): `boolean`

Defined in: [handles/unit.ts:3433](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L3433)

Queues an order that takes no target, after the unit's current orders.

#### Parameters

##### order

[`OrderId`](../reforged-ts/namespaces/tsGlobals/enumerations/OrderId.md)

The order's id.

#### Returns

`boolean`

True when the unit took the order.

#### Native

[BlzQueueImmediateOrderById](/typings/3.0.0/functions/BlzQueueImmediateOrderById) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzQueueImmediateOrderById))

***

### queueInstantOrderAt()

> **queueInstantOrderAt**(`order`, `x`, `y`, `instantTargetWidget`): `boolean`

Defined in: [handles/unit.ts:3446](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L3446)

Queues an order at a point, with a widget as its instant target, after the unit's current orders.

#### Parameters

##### order

[`OrderId`](../reforged-ts/namespaces/tsGlobals/enumerations/OrderId.md)

The order's id.

##### x

`number`

The x-coordinate, in world units.

##### y

`number`

The y-coordinate, in world units.

##### instantTargetWidget

[`Widget`](Widget.md)

The instant target.

#### Returns

`boolean`

True when the unit took the order.

#### Native

[BlzQueueInstantPointOrderById](/typings/3.0.0/functions/BlzQueueInstantPointOrderById) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzQueueInstantPointOrderById))

***

### queueInstantTargetOrder()

> **queueInstantTargetOrder**(`order`, `targetWidget`, `instantTargetWidget`): `boolean`

Defined in: [handles/unit.ts:3470](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L3470)

Queues an order on a target, with another widget as its instant target, after
the unit's current orders.

#### Parameters

##### order

[`OrderId`](../reforged-ts/namespaces/tsGlobals/enumerations/OrderId.md)

The order's id.

##### targetWidget

[`Widget`](Widget.md)

The order's target.

##### instantTargetWidget

[`Widget`](Widget.md)

The instant target.

#### Returns

`boolean`

True when the unit took the order.

#### Native

[BlzQueueInstantTargetOrderById](/typings/3.0.0/functions/BlzQueueInstantTargetOrderById) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzQueueInstantTargetOrderById))

***

### queueNeutralImmediateOrder()

> **queueNeutralImmediateOrder**(`forPlayer`, `unitId`): `boolean`

Defined in: [handles/unit.ts:2388](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L2388)

Queues an order on this neutral structure to sell or train `unitId` for
`forPlayer`, after its current orders.

#### Parameters

##### forPlayer

[`MapPlayer`](MapPlayer.md)

The player who buys.

##### unitId

`number`

The rawcode of what is bought.

#### Returns

`boolean`

True when the structure took the order.

#### Native

[BlzQueueNeutralImmediateOrderById](/typings/3.0.0/functions/BlzQueueNeutralImmediateOrderById) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzQueueNeutralImmediateOrderById))

***

### queueNeutralPointOrder()

> **queueNeutralPointOrder**(`forPlayer`, `unitId`, `x`, `y`): `boolean`

Defined in: [handles/unit.ts:2406](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L2406)

Queues an order on this neutral structure to use `unitId` for
`forPlayer` at a point, after its current orders.

#### Parameters

##### forPlayer

[`MapPlayer`](MapPlayer.md)

The player the structure acts for.

##### unitId

`number`

The order's id.

##### x

`number`

The x-coordinate, in world units.

##### y

`number`

The y-coordinate, in world units.

#### Returns

`boolean`

True when the structure took the order.

#### Native

[BlzQueueNeutralPointOrderById](/typings/3.0.0/functions/BlzQueueNeutralPointOrderById) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzQueueNeutralPointOrderById))

***

### queueNeutralTargetOrder()

> **queueNeutralTargetOrder**(`forPlayer`, `unitId`, `target`): `boolean`

Defined in: [handles/unit.ts:2430](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L2430)

Queues an order on this neutral structure to use `unitId` for
`forPlayer` on `target`, after its current orders.

#### Parameters

##### forPlayer

[`MapPlayer`](MapPlayer.md)

The player the structure acts for.

##### unitId

`number`

The order's id.

##### target

[`Widget`](Widget.md)

The order's target.

#### Returns

`boolean`

True when the structure took the order.

#### Native

[BlzQueueNeutralTargetOrderById](/typings/3.0.0/functions/BlzQueueNeutralTargetOrderById) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzQueueNeutralTargetOrderById))

***

### queueOrderAt()

> **queueOrderAt**(`order`, `x`, `y`): `boolean`

Defined in: [handles/unit.ts:3492](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L3492)

Queues an order at a point, after the unit's current orders.

#### Parameters

##### order

[`OrderId`](../reforged-ts/namespaces/tsGlobals/enumerations/OrderId.md)

The order's id.

##### x

`number`

The x-coordinate, in world units.

##### y

`number`

The y-coordinate, in world units.

#### Returns

`boolean`

True when the unit took the order.

#### Native

[BlzQueuePointOrderById](/typings/3.0.0/functions/BlzQueuePointOrderById) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzQueuePointOrderById))

#### Bug

For a build order it returns false, whether or not the unit obeys.

***

### queueTargetOrder()

> **queueTargetOrder**(`order`, `targetWidget`): `boolean`

Defined in: [handles/unit.ts:3503](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L3503)

Queues an order on a target, after the unit's current orders.

#### Parameters

##### order

[`OrderId`](../reforged-ts/namespaces/tsGlobals/enumerations/OrderId.md)

The order's id.

##### targetWidget

[`Widget`](Widget.md)

The order's target.

#### Returns

`boolean`

True when the unit took the order.

#### Native

[BlzQueueTargetOrderById](/typings/3.0.0/functions/BlzQueueTargetOrderById) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzQueueTargetOrderById))

***

### recycleGuardPosition()

> **recycleGuardPosition**(): `void`

Defined in: [handles/unit.ts:2447](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L2447)

Releases the unit's guard position, the spot the computer player's AI keeps it at, for the AI to reuse.

#### Returns

`void`

#### Native

[RecycleGuardPosition](/typings/3.0.0/functions/RecycleGuardPosition) ([jassbot](https://lep.duckdns.org/jassbot/doc/RecycleGuardPosition))

***

### removeAbility()

> **removeAbility**(`abilityId`): `boolean`

Defined in: [handles/unit.ts:2457](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L2457)

Removes an ability from the unit.

#### Parameters

##### abilityId

`number`

The ability's rawcode.

#### Returns

`boolean`

True when the ability was removed, false when the unit lacks it.

#### Native

[UnitRemoveAbility](/typings/3.0.0/functions/UnitRemoveAbility) ([jassbot](https://lep.duckdns.org/jassbot/doc/UnitRemoveAbility))

***

### removeBuffs()

> **removeBuffs**(`removePositive`, `removeNegative`): `void`

Defined in: [handles/unit.ts:2467](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L2467)

Removes the unit's positive buffs, negative buffs or both, timed-life and aura buffs included.

#### Parameters

##### removePositive

`boolean`

Removes the positive buffs.

##### removeNegative

`boolean`

Removes the negative buffs.

#### Returns

`void`

#### Native

[UnitRemoveBuffs](/typings/3.0.0/functions/UnitRemoveBuffs) ([jassbot](https://lep.duckdns.org/jassbot/doc/UnitRemoveBuffs))

***

### removeBuffsEx()

> **removeBuffsEx**(`removePositive`, `removeNegative`, `magic`, `physical`, `timedLife`, `aura`, `autoDispel`): `void`

Defined in: [handles/unit.ts:2486](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L2486)

Removes the buffs on the unit that match the filters.

#### Parameters

##### removePositive

`boolean`

Removes positive buffs.

##### removeNegative

`boolean`

Removes negative buffs.

##### magic

`boolean`

Removes only magical buffs, unless `physical` is true too, which
matches none; both false removes magical, physical and other buffs.

##### physical

`boolean`

Removes only physical buffs, unless `magic` is true too.

##### timedLife

`boolean`

Includes timed-life buffs; false leaves them out.

##### aura

`boolean`

Includes aura buffs; false leaves them out.

##### autoDispel

`boolean`

Removes only the buffs that dispelling removes.

#### Returns

`void`

#### Remarks

The filters combine differently here than in `countBuffs`: see
[the Native's reference](https://lep.duckdns.org/jassbot/doc/UnitRemoveBuffsEx).

#### Native

[UnitRemoveBuffsEx](/typings/3.0.0/functions/UnitRemoveBuffsEx) ([jassbot](https://lep.duckdns.org/jassbot/doc/UnitRemoveBuffsEx))

***

### removeGuardPosition()

> **removeGuardPosition**(): `void`

Defined in: [handles/unit.ts:2511](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L2511)

Makes the computer player's AI ignore the unit's guard position, the spot the unit returns to.

#### Returns

`void`

#### Native

[RemoveGuardPosition](/typings/3.0.0/functions/RemoveGuardPosition) ([jassbot](https://lep.duckdns.org/jassbot/doc/RemoveGuardPosition))

***

### removeItem()

> **removeItem**(`whichItem`): `void`

Defined in: [handles/unit.ts:2520](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L2520)

Drops an item the unit carries onto the ground where the unit stands.

#### Parameters

##### whichItem

[`Item`](Item.md)

The item, in the unit's inventory.

#### Returns

`void`

#### Native

[UnitRemoveItem](/typings/3.0.0/functions/UnitRemoveItem) ([jassbot](https://lep.duckdns.org/jassbot/doc/UnitRemoveItem))

***

### removeItemFromSlot()

> **removeItemFromSlot**(`itemSlot`): [`Item`](Item.md) \| `undefined`

Defined in: [handles/unit.ts:2531](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L2531)

Drops the item in one of the unit's inventory slots onto the ground where
the unit stands.

#### Parameters

##### itemSlot

`number`

The slot, from 0 to 5.

#### Returns

[`Item`](Item.md) \| `undefined`

The dropped item, or `undefined` when the slot is empty or does not exist.

#### Native

[UnitRemoveItemFromSlot](/typings/3.0.0/functions/UnitRemoveItemFromSlot) ([jassbot](https://lep.duckdns.org/jassbot/doc/UnitRemoveItemFromSlot))

***

### removeItemFromStock()

> **removeItemFromStock**(`itemId`): `void`

Defined in: [handles/unit.ts:2540](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L2540)

Removes an item type from the stock of the shop.

#### Parameters

##### itemId

`number`

The item type's rawcode.

#### Returns

`void`

#### Native

[RemoveItemFromStock](/typings/3.0.0/functions/RemoveItemFromStock) ([jassbot](https://lep.duckdns.org/jassbot/doc/RemoveItemFromStock))

***

### removeType()

> **removeType**(`whichUnitType`): `boolean`

Defined in: [handles/unit.ts:2550](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L2550)

Removes a classification from the unit, such as `UNIT_TYPE_UNDEAD`.

#### Parameters

##### whichUnitType

`unittype`

The classification to remove.

#### Returns

`boolean`

True when the game removed it.

#### Native

[UnitRemoveType](/typings/3.0.0/functions/UnitRemoveType) ([jassbot](https://lep.duckdns.org/jassbot/doc/UnitRemoveType))

***

### removeUnitFromStock()

> **removeUnitFromStock**(`itemId`): `void`

Defined in: [handles/unit.ts:2559](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L2559)

Removes a unit type from the stock of the shop.

#### Parameters

##### itemId

`number`

The unit type's rawcode.

#### Returns

`void`

#### Native

[RemoveUnitFromStock](/typings/3.0.0/functions/RemoveUnitFromStock) ([jassbot](https://lep.duckdns.org/jassbot/doc/RemoveUnitFromStock))

***

### resetAttack()

> **resetAttack**(`weaponIndex`): `void`

Defined in: [handles/unit.ts:2568](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L2568)

Resets one of the unit's attacks.

#### Parameters

##### weaponIndex

`number`

The attack, 0 or 1.

#### Returns

`void`

#### Native

[BlzResetUnitAttack](/typings/3.0.0/functions/BlzResetUnitAttack) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzResetUnitAttack))

***

### resetCooldown()

> **resetCooldown**(): `void`

Defined in: [handles/unit.ts:2576](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L2576)

Ends the cooldowns of all of the unit's abilities.

#### Returns

`void`

#### Native

[UnitResetCooldown](/typings/3.0.0/functions/UnitResetCooldown) ([jassbot](https://lep.duckdns.org/jassbot/doc/UnitResetCooldown))

***

### resetLookAt()

> **resetLookAt**(): `void`

Defined in: [handles/unit.ts:2585](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L2585)

Releases the bone that `lookAt` turned, so that the unit's animations
move it again.

#### Returns

`void`

#### Native

[ResetUnitLookAt](/typings/3.0.0/functions/ResetUnitLookAt) ([jassbot](https://lep.duckdns.org/jassbot/doc/ResetUnitLookAt))

***

### revive()

> **revive**(`x`, `y`, `doEyecandy`): `boolean`

Defined in: [handles/unit.ts:2599](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L2599)

Revives the dead hero at a point.

#### Parameters

##### x

`number`

The x-coordinate, in world units.

##### y

`number`

The y-coordinate, in world units.

##### doEyecandy

`boolean`

True to play the revival effect and sound.

#### Returns

`boolean`

True when the hero was dead and revived.

#### Remarks

A hero with a food cost revives only when its owner has the food for it.

#### Native

[ReviveHero](/typings/3.0.0/functions/ReviveHero) ([jassbot](https://lep.duckdns.org/jassbot/doc/ReviveHero))

***

### reviveAtPoint()

> **reviveAtPoint**(`whichPoint`, `doEyecandy`): `boolean`

Defined in: [handles/unit.ts:2612](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L2612)

Revives the dead hero at a point.

#### Parameters

##### whichPoint

[`Point`](Point.md)

Where the hero revives.

##### doEyecandy

`boolean`

True to play the revival effect and sound.

#### Returns

`boolean`

True when the hero was dead and revived.

#### Remarks

A hero with a food cost revives only when its owner has the food for it.

#### Native

[ReviveHeroLoc](/typings/3.0.0/functions/ReviveHeroLoc) ([jassbot](https://lep.duckdns.org/jassbot/doc/ReviveHeroLoc))

***

### select()

> **select**(`flag`): `void`

Defined in: [handles/unit.ts:2622](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L2622)

Adds the unit to the selection, or removes it, on every client: to change one
player's selection, call it for that player's client only.

#### Parameters

##### flag

`boolean`

True to select the unit, false to deselect it.

#### Returns

`void`

#### Native

[SelectUnit](/typings/3.0.0/functions/SelectUnit) ([jassbot](https://lep.duckdns.org/jassbot/doc/SelectUnit))

***

### selectSkill()

> **selectSkill**(`abilCode`): `void`

Defined in: [handles/unit.ts:2632](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L2632)

Spends one of the hero's skill points to learn or level an ability; does
nothing when the hero has no point or cannot learn it yet.

#### Parameters

##### abilCode

`number`

The ability's rawcode.

#### Returns

`void`

#### Native

[SelectHeroSkill](/typings/3.0.0/functions/SelectHeroSkill) ([jassbot](https://lep.duckdns.org/jassbot/doc/SelectHeroSkill))

***

### setAbilityCooldown()

> **setAbilityCooldown**(`abilId`, `level`, `cooldown`): `void`

Defined in: [handles/unit.ts:2645](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L2645)

Sets the full cooldown of one of the unit's abilities at a level.

#### Parameters

##### abilId

`number`

The ability's rawcode.

##### level

`number`

The ability level, counted from 0 (level 1 is 0).

##### cooldown

`number`

The cooldown, in seconds.

#### Returns

`void`

#### Remarks

A cooldown that is running keeps its length: the new one applies from the next use.

#### Native

[BlzSetUnitAbilityCooldown](/typings/3.0.0/functions/BlzSetUnitAbilityCooldown) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzSetUnitAbilityCooldown))

***

### setAbilityCooldownPercent()

> **setAbilityCooldownPercent**(`abilId`, `percent`): `void`

Defined in: [handles/unit.ts:2655](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L2655)

Sets the remaining cooldown of one of the unit's abilities as a share of its full cooldown.

#### Parameters

##### abilId

`number`

The ability's rawcode.

##### percent

`number`

The share of the full cooldown left.

#### Returns

`void`

#### Native

[BlzSetUnitAbilityCooldownPercent](/typings/3.0.0/functions/BlzSetUnitAbilityCooldownPercent) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzSetUnitAbilityCooldownPercent))

***

### setAbilityCooldownRemaining()

> **setAbilityCooldownRemaining**(`abilId`, `seconds`): `void`

Defined in: [handles/unit.ts:2665](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L2665)

Sets the remaining cooldown of one of the unit's abilities.

#### Parameters

##### abilId

`number`

The ability's rawcode.

##### seconds

`number`

The time left, in seconds.

#### Returns

`void`

#### Native

[BlzSetUnitAbilityCooldownRemaining](/typings/3.0.0/functions/BlzSetUnitAbilityCooldownRemaining) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzSetUnitAbilityCooldownRemaining))

***

### setAbilityLevel()

> **setAbilityLevel**(`abilCode`, `level`): `number`

Defined in: [handles/unit.ts:2678](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L2678)

Sets the level of an ability the unit has, without spending or refunding skill points.

#### Parameters

##### abilCode

`number`

The ability's rawcode.

##### level

`number`

The new level, from 1.

#### Returns

`number`

The new level, or 0 when the unit lacks the ability.

#### Remarks

A level below 1 sets level 1, and one above the ability's highest sets the highest.

#### Native

[SetUnitAbilityLevel](/typings/3.0.0/functions/SetUnitAbilityLevel) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetUnitAbilityLevel))

***

### setAbilityManaCost()

> **setAbilityManaCost**(`abilId`, `level`, `manaCost`): `void`

Defined in: [handles/unit.ts:2690](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L2690)

Sets the mana cost of one of the unit's abilities at a level.

#### Parameters

##### abilId

`number`

The ability's rawcode.

##### level

`number`

The ability level, counted from 0 (level 1 is 0).

##### manaCost

`number`

The mana the ability costs to cast at that level, a
whole number.

#### Returns

`void`

#### Native

[BlzSetUnitAbilityManaCost](/typings/3.0.0/functions/BlzSetUnitAbilityManaCost) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzSetUnitAbilityManaCost))

***

### setAgility()

> **setAgility**(`value`, `permanent`): `void`

Defined in: [handles/unit.ts:2701](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L2701)

Sets the hero's base agility.

#### Parameters

##### value

`number`

The new base agility, without the bonuses of items and
buffs.

##### permanent

`boolean`

True for a permanent change, as the `agility` setter makes.

#### Returns

`void`

#### Native

[SetHeroAgi](/typings/3.0.0/functions/SetHeroAgi) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetHeroAgi))

***

### setAnimation()

> **setAnimation**(`whichAnimation`): `void`

Defined in: [handles/unit.ts:2712](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L2712)

Plays one of the animations of the unit's model at once, cutting the current one.

#### Parameters

##### whichAnimation

`string` \| `number`

The animation's name, such as `"attack slam"`, in any
case; or its index in the model.

#### Returns

`void`

#### Native

[SetUnitAnimation](/typings/3.0.0/functions/SetUnitAnimation) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetUnitAnimation))

#### Native

[SetUnitAnimationByIndex](/typings/3.0.0/functions/SetUnitAnimationByIndex) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetUnitAnimationByIndex))

***

### setAnimationWithRarity()

> **setAnimationWithRarity**(`whichAnimation`, `rarity`): `void`

Defined in: [handles/unit.ts:2726](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L2726)

Plays one of the animations of the unit's model, picking among its variations by rarity.

#### Parameters

##### whichAnimation

`string`

The animation's name, in any case.

##### rarity

`raritycontrol`

The variations to pick from, `RARITY_FREQUENT` or `RARITY_RARE`.

#### Returns

`void`

#### Native

[SetUnitAnimationWithRarity](/typings/3.0.0/functions/SetUnitAnimationWithRarity) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetUnitAnimationWithRarity))

***

### setAttackCooldown()

> **setAttackCooldown**(`cooldown`, `weaponIndex`): `void`

Defined in: [handles/unit.ts:2736](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L2736)

Sets the base cooldown of one of the unit's attacks.

#### Parameters

##### cooldown

`number`

The cooldown, in seconds.

##### weaponIndex

`number`

The attack, 0 or 1.

#### Returns

`void`

#### Native

[BlzSetUnitAttackCooldown](/typings/3.0.0/functions/BlzSetUnitAttackCooldown) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzSetUnitAttackCooldown))

***

### setBaseDamage()

> **setBaseDamage**(`baseDamage`, `weaponIndex`): `void`

Defined in: [handles/unit.ts:2746](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L2746)

Sets the base damage of one of the unit's attacks, added to the dice roll.

#### Parameters

##### baseDamage

`number`

The damage added to every roll, a whole number.

##### weaponIndex

`number`

The attack, 0 or 1.

#### Returns

`void`

#### Native

[BlzSetUnitBaseDamage](/typings/3.0.0/functions/BlzSetUnitBaseDamage) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzSetUnitBaseDamage))

***

### setBlendTime()

> **setBlendTime**(`timeScale`): `void`

Defined in: [handles/unit.ts:2755](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L2755)

Sets the time the unit's model takes to blend from one animation into the next.

#### Parameters

##### timeScale

`number`

The blend time, in seconds.

#### Returns

`void`

#### Native

[SetUnitBlendTime](/typings/3.0.0/functions/SetUnitBlendTime) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetUnitBlendTime))

***

### setConstructionProgress()

> **setConstructionProgress**(`constructionPercentage`): `void`

Defined in: [handles/unit.ts:2764](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L2764)

Sets how far the construction of the structure has progressed.

#### Parameters

##### constructionPercentage

`number`

The progress, from 0 to 100.

#### Returns

`void`

#### Native

[UnitSetConstructionProgress](/typings/3.0.0/functions/UnitSetConstructionProgress) ([jassbot](https://lep.duckdns.org/jassbot/doc/UnitSetConstructionProgress))

***

### setCreepGuard()

> **setCreepGuard**(`creepGuard`): `void`

Defined in: [handles/unit.ts:2773](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L2773)

Sets whether the unit keeps to its guard position, as creeps do.

#### Parameters

##### creepGuard

`boolean`

True to keep the unit at its guard position.

#### Returns

`void`

#### Native

[SetUnitCreepGuard](/typings/3.0.0/functions/SetUnitCreepGuard) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetUnitCreepGuard))

***

### setDiceNumber()

> **setDiceNumber**(`diceNumber`, `weaponIndex`): `void`

Defined in: [handles/unit.ts:2784](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L2784)

Sets the number of dice one of the unit's attacks rolls for its damage.

#### Parameters

##### diceNumber

`number`

The number of dice rolled on each hit, a whole
number.

##### weaponIndex

`number`

The attack, 0 or 1.

#### Returns

`void`

#### Native

[BlzSetUnitDiceNumber](/typings/3.0.0/functions/BlzSetUnitDiceNumber) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzSetUnitDiceNumber))

***

### setDiceSides()

> **setDiceSides**(`diceSides`, `weaponIndex`): `void`

Defined in: [handles/unit.ts:2795](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L2795)

Sets the number of sides of the dice one of the unit's attacks rolls for its damage.

#### Parameters

##### diceSides

`number`

The number of sides of each die: a die rolls from 1
to this number.

##### weaponIndex

`number`

The attack, 0 or 1.

#### Returns

`void`

#### Native

[BlzSetUnitDiceSides](/typings/3.0.0/functions/BlzSetUnitDiceSides) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzSetUnitDiceSides))

***

### setExperience()

> **setExperience**(`newXpVal`, `showEyeCandy`): `void`

Defined in: [handles/unit.ts:2806](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L2806)

Sets the hero's experience points; reaching the experience a level needs
gains that level.

#### Parameters

##### newXpVal

`number`

The new experience total, a whole number.

##### showEyeCandy

`boolean`

True to show the effects of a level gained this way.

#### Returns

`void`

#### Native

[SetHeroXP](/typings/3.0.0/functions/SetHeroXP) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetHeroXP))

***

### setExploded()

> **setExploded**(`exploded`): `void`

Defined in: [handles/unit.ts:2815](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L2815)

Sets whether the unit explodes when it dies, leaving no corpse.

#### Parameters

##### exploded

`boolean`

True to make the unit explode on death.

#### Returns

`void`

#### Native

[SetUnitExploded](/typings/3.0.0/functions/SetUnitExploded) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetUnitExploded))

***

### setFacingEx()

> **setFacingEx**(`facingAngle`): `void`

Defined in: [handles/unit.ts:2824](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L2824)

Turns the unit to face an angle at once, where the `facing` setter turns it gradually.

#### Parameters

##### facingAngle

`number`

The facing, in degrees (0 east, 90 north).

#### Returns

`void`

#### Native

[BlzSetUnitFacingEx](/typings/3.0.0/functions/BlzSetUnitFacingEx) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzSetUnitFacingEx))

***

### setFacingTimed()

> **setFacingTimed**(`facingAngle`, `duration`): `void`

Defined in: [handles/unit.ts:3516](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L3516)

Turns the unit to face an angle, at a speed that `duration` can slow down.

#### Parameters

##### facingAngle

`number`

The facing, in degrees (0 east, 90 north).

##### duration

`number`

Below 1, the usual turn speed; from 1, a factor that slows the turn down.

#### Returns

`void`

#### Remarks

The turn ignores the unit's turn rate (`turnSpeed`).

#### Native

[SetUnitFacingTimed](/typings/3.0.0/functions/SetUnitFacingTimed) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetUnitFacingTimed))

#### Bug

With a duration other than 0, the unit ends a few degrees off the angle asked for.

***

### setField()

> **setField**(`field`, `value`): `boolean`

Defined in: [handles/unit.ts:2841](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L2841)

Writes one of the unit's fields, through the Native of the field's type.

#### Parameters

##### field

`unitbooleanfield` \| `unitintegerfield` \| `unitrealfield` \| `unitstringfield`

A field constant of any of the four types, such as `UNIT_RF_SELECTION_SCALE`.

##### value

`string` \| `number` \| `boolean`

The value, of the field's type: a boolean, a number or a string.

#### Returns

`boolean`

True when the game wrote the field; false when the value is not of
the field's type.

#### Remarks

Many fields do not work: the game can report a write that changes nothing.

#### Native

[BlzSetUnitBooleanField](/typings/3.0.0/functions/BlzSetUnitBooleanField) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzSetUnitBooleanField))

#### Native

[BlzSetUnitIntegerField](/typings/3.0.0/functions/BlzSetUnitIntegerField) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzSetUnitIntegerField))

#### Native

[BlzSetUnitRealField](/typings/3.0.0/functions/BlzSetUnitRealField) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzSetUnitRealField))

#### Native

[BlzSetUnitStringField](/typings/3.0.0/functions/BlzSetUnitStringField) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzSetUnitStringField))

***

### setflyHeight()

> **setflyHeight**(`value`, `rate`): `void`

Defined in: [handles/unit.ts:2882](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L2882)

Changes the unit's flying height above the ground.

#### Parameters

##### value

`number`

The height, in world units.

##### rate

`number`

The speed of the change, in world units per second; 0 changes it at once.

#### Returns

`void`

#### Native

[SetUnitFlyHeight](/typings/3.0.0/functions/SetUnitFlyHeight) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetUnitFlyHeight))

***

### setHeroLevel()

> **setHeroLevel**(`level`, `showEyeCandy`): `void`

Defined in: [handles/unit.ts:2894](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L2894)

Raises the hero to a level; a lower level than the current one does nothing.

#### Parameters

##### level

`number`

The level to raise the hero to.

##### showEyeCandy

`boolean`

True to show the level-up text, sound and effect.

#### Returns

`void`

#### Remarks

The level stops at the hero's maximum level.

#### Native

[SetHeroLevel](/typings/3.0.0/functions/SetHeroLevel) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetHeroLevel))

***

### setIntelligence()

> **setIntelligence**(`value`, `permanent`): `void`

Defined in: [handles/unit.ts:2905](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L2905)

Sets the hero's base intelligence.

#### Parameters

##### value

`number`

The new base intelligence, without the bonuses of items
and buffs.

##### permanent

`boolean`

True for a permanent change, as the `intelligence` setter makes.

#### Returns

`void`

#### Native

[SetHeroInt](/typings/3.0.0/functions/SetHeroInt) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetHeroInt))

***

### setItemTypeSlots()

> **setItemTypeSlots**(`slots`): `void`

Defined in: [handles/unit.ts:2914](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L2914)

Sets the number of item types the shop can offer.

#### Parameters

##### slots

`number`

How many different item types the shop lists at once.

#### Returns

`void`

#### Native

[SetItemTypeSlots](/typings/3.0.0/functions/SetItemTypeSlots) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetItemTypeSlots))

***

### setOwner()

> **setOwner**(`whichPlayer`, `changeColor?`): `void`

Defined in: [handles/unit.ts:2925](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L2925)

Gives the unit to another player.

#### Parameters

##### whichPlayer

[`MapPlayer`](MapPlayer.md)

The new owner.

##### changeColor?

`boolean` = `true`

True to give the unit the new owner's colour, when the
owner changes; true when left out.

#### Returns

`void`

#### Native

[SetUnitOwner](/typings/3.0.0/functions/SetUnitOwner) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetUnitOwner))

***

### setPathing()

> **setPathing**(`flag`): `void`

Defined in: [handles/unit.ts:2972](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L2972)

Sets whether the unit follows pathing, or walks through anything.

#### Parameters

##### flag

`boolean`

True to follow pathing, false to ignore it.

#### Returns

`void`

#### Native

[SetUnitPathing](/typings/3.0.0/functions/SetUnitPathing) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetUnitPathing))

***

### setPoint()

> **setPoint**(`point`): `void`

Defined in: [handles/unit.ts:2949](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L2949)

Moves the unit to a point, to the nearest spot its pathing allows, cancelling its orders.

#### Parameters

##### point

[`Point`](Point.md)

The point to move the unit to.

#### Returns

`void`

#### Native

[SetUnitPositionLoc](/typings/3.0.0/functions/SetUnitPositionLoc) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetUnitPositionLoc))

***

### setPosition()

> **setPosition**(`x`, `y`): `void`

Defined in: [handles/unit.ts:2984](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L2984)

Moves the unit to a point, to the nearest spot its pathing allows.

#### Parameters

##### x

`number`

The x-coordinate, in world units.

##### y

`number`

The y-coordinate, in world units.

#### Returns

`void`

#### Remarks

It cancels the unit's orders; setting `x` and `y` moves the unit
and keeps them.

#### Native

[SetUnitPosition](/typings/3.0.0/functions/SetUnitPosition) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetUnitPosition))

***

### setRescuable()

> **setRescuable**(`byWhichPlayer`, `flag`): `void`

Defined in: [handles/unit.ts:2995](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L2995)

Sets whether a player can rescue the unit, taking it over by coming near it.

#### Parameters

##### byWhichPlayer

[`MapPlayer`](MapPlayer.md)

The player who can, or no longer can, rescue the
unit.

##### flag

`boolean`

True to make the unit rescuable by that player.

#### Returns

`void`

#### Native

[SetUnitRescuable](/typings/3.0.0/functions/SetUnitRescuable) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetUnitRescuable))

***

### setRescueRange()

> **setRescueRange**(`range`): `void`

Defined in: [handles/unit.ts:3004](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L3004)

Sets how near a rescuing unit must come to rescue the unit.

#### Parameters

##### range

`number`

The range, in world units.

#### Returns

`void`

#### Native

[SetUnitRescueRange](/typings/3.0.0/functions/SetUnitRescueRange) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetUnitRescueRange))

***

### setScale()

> **setScale**(`scaleX`, `scaleY`, `scaleZ`): `void`

Defined in: [handles/unit.ts:3016](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L3016)

Scales the unit's model.

#### Parameters

##### scaleX

`number`

The scale, which the game applies on all three axes.

##### scaleY

`number`

Ignored.

##### scaleZ

`number`

Ignored.

#### Returns

`void`

#### Native

[SetUnitScale](/typings/3.0.0/functions/SetUnitScale) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetUnitScale))

#### Bug

The game reads `scaleX` alone and scales every axis by it.

***

### setState()

> **setState**(`whichUnitState`, `newVal`): `void`

Defined in: [handles/unit.ts:3027](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L3027)

Sets one of the unit's states, such as its life or mana.

#### Parameters

##### whichUnitState

`unitstate`

The state, such as `UNIT_STATE_LIFE` or `UNIT_STATE_MAX_MANA`.

##### newVal

`number`

The new value, in the state's own unit: hit points for
`UNIT_STATE_LIFE`, mana for `UNIT_STATE_MANA`.

#### Returns

`void`

#### Native

[SetUnitState](/typings/3.0.0/functions/SetUnitState) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetUnitState))

***

### setStrength()

> **setStrength**(`value`, `permanent`): `void`

Defined in: [handles/unit.ts:3038](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L3038)

Sets the hero's base strength; lowering it lowers the hero's life.

#### Parameters

##### value

`number`

The new base strength, without the bonuses of items and
buffs.

##### permanent

`boolean`

True for a permanent change, as the `strength` setter makes.

#### Returns

`void`

#### Native

[SetHeroStr](/typings/3.0.0/functions/SetHeroStr) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetHeroStr))

***

### setTimeScale()

> **setTimeScale**(`timeScale`): `void`

Defined in: [handles/unit.ts:3047](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L3047)

Sets the speed of the unit's animations.

#### Parameters

##### timeScale

`number`

The speed factor: 1 for the normal speed, 2 for twice as fast.

#### Returns

`void`

#### Native

[SetUnitTimeScale](/typings/3.0.0/functions/SetUnitTimeScale) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetUnitTimeScale))

***

### setUnitAttackCooldown()

> **setUnitAttackCooldown**(`cooldown`, `weaponIndex`): `void`

Defined in: [handles/unit.ts:3057](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L3057)

Sets the base cooldown of one of the unit's attacks, as `setAttackCooldown` does.

#### Parameters

##### cooldown

`number`

The cooldown, in seconds.

##### weaponIndex

`number`

The attack, 0 or 1.

#### Returns

`void`

#### Native

[BlzSetUnitAttackCooldown](/typings/3.0.0/functions/BlzSetUnitAttackCooldown) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzSetUnitAttackCooldown))

***

### setUnitTypeSlots()

> **setUnitTypeSlots**(`slots`): `void`

Defined in: [handles/unit.ts:3066](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L3066)

Sets the number of unit types the shop can offer.

#### Parameters

##### slots

`number`

How many different unit types the shop lists at once.

#### Returns

`void`

#### Native

[SetUnitTypeSlots](/typings/3.0.0/functions/SetUnitTypeSlots) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetUnitTypeSlots))

***

### setUpgradeProgress()

> **setUpgradeProgress**(`upgradePercentage`): `void`

Defined in: [handles/unit.ts:3075](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L3075)

Sets how far the upgrade of the structure has progressed.

#### Parameters

##### upgradePercentage

`number`

The progress, from 0 to 100.

#### Returns

`void`

#### Native

[UnitSetUpgradeProgress](/typings/3.0.0/functions/UnitSetUpgradeProgress) ([jassbot](https://lep.duckdns.org/jassbot/doc/UnitSetUpgradeProgress))

***

### setUseAltIcon()

> **setUseAltIcon**(`flag`): `void`

Defined in: [handles/unit.ts:3084](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L3084)

Sets whether the minimap shows the unit with the alternate icon.

#### Parameters

##### flag

`boolean`

True to use the alternate icon.

#### Returns

`void`

#### Native

[UnitSetUsesAltIcon](/typings/3.0.0/functions/UnitSetUsesAltIcon) ([jassbot](https://lep.duckdns.org/jassbot/doc/UnitSetUsesAltIcon))

***

### setUseFood()

> **setUseFood**(`useFood`): `void`

Defined in: [handles/unit.ts:3093](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L3093)

Sets whether the unit counts in its owner's food.

#### Parameters

##### useFood

`boolean`

True to count the unit's food.

#### Returns

`void`

#### Native

[SetUnitUseFood](/typings/3.0.0/functions/SetUnitUseFood) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetUnitUseFood))

***

### setVertexColor()

> **setVertexColor**(`red`, `green`, `blue`, `alpha`): `void`

Defined in: [handles/unit.ts:3105](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L3105)

Tints the unit's model with a colour and sets its transparency.

#### Parameters

##### red

`number`

The red channel, from 0 to 255.

##### green

`number`

The green channel, from 0 to 255.

##### blue

`number`

The blue channel, from 0 to 255.

##### alpha

`number`

The alpha channel, from 0 to 255.

#### Returns

`void`

#### Native

[SetUnitVertexColor](/typings/3.0.0/functions/SetUnitVertexColor) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetUnitVertexColor))

***

### setWeaponField()

> **setWeaponField**(`field`, `index`, `value`): `boolean`

Defined in: [handles/unit.ts:3535](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L3535)

Writes a field of one of the unit's weapons, through the
`BlzSetUnitWeapon*Field` Native of the field's type.

#### Parameters

##### field

`unitweaponbooleanfield` \| `unitweaponintegerfield` \| `unitweaponrealfield` \| `unitweaponstringfield`

A weapon field constant of any of the four field types.

##### index

`number`

The weapon's index.

##### value

`string` \| `number` \| `boolean`

The value, of the field's type: a boolean, a number or a string.

#### Returns

`boolean`

True when the game wrote the field; false when the value is not of
the field's type.

#### Remarks

Some fields do not work: the game can report a write that changes nothing.

#### Native

[BlzSetUnitWeaponBooleanField](/typings/3.0.0/functions/BlzSetUnitWeaponBooleanField) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzSetUnitWeaponBooleanField))

#### Native

[BlzSetUnitWeaponIntegerField](/typings/3.0.0/functions/BlzSetUnitWeaponIntegerField) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzSetUnitWeaponIntegerField))

#### Native

[BlzSetUnitWeaponRealField](/typings/3.0.0/functions/BlzSetUnitWeaponRealField) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzSetUnitWeaponRealField))

#### Native

[BlzSetUnitWeaponStringField](/typings/3.0.0/functions/BlzSetUnitWeaponStringField) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzSetUnitWeaponStringField))

***

### shareVision()

> **shareVision**(`whichPlayer`, `share`): `void`

Defined in: [handles/unit.ts:3121](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L3121)

Shares, or stops sharing, the unit's vision with a player.

#### Parameters

##### whichPlayer

[`MapPlayer`](MapPlayer.md)

The player who sees, or stops seeing, what the unit
sees.

##### share

`boolean`

True to share the vision, false to stop.

#### Returns

`void`

#### Native

[UnitShareVision](/typings/3.0.0/functions/UnitShareVision) ([jassbot](https://lep.duckdns.org/jassbot/doc/UnitShareVision))

***

### showTeamGlow()

> **showTeamGlow**(`show`): `void`

Defined in: [handles/unit.ts:3130](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L3130)

Shows or hides the team-coloured glow of the unit, a hero's glow included.

#### Parameters

##### show

`boolean`

True to show the glow, false to hide it.

#### Returns

`void`

#### Native

[BlzShowUnitTeamGlow](/typings/3.0.0/functions/BlzShowUnitTeamGlow) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzShowUnitTeamGlow))

***

### startAbilityCooldown()

> **startAbilityCooldown**(`abilCode`, `cooldown`): `void`

Defined in: [handles/unit.ts:3140](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L3140)

Starts the cooldown of one of the unit's abilities.

#### Parameters

##### abilCode

`number`

The ability's rawcode.

##### cooldown

`number`

The cooldown, in seconds.

#### Returns

`void`

#### Native

[BlzStartUnitAbilityCooldown](/typings/3.0.0/functions/BlzStartUnitAbilityCooldown) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzStartUnitAbilityCooldown))

***

### stripLevels()

> **stripLevels**(`howManyLevels`): `boolean`

Defined in: [handles/unit.ts:3151](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L3151)

Takes levels away from the hero, down to level 1, with the attributes and
skill points they gave.

#### Parameters

##### howManyLevels

`number`

The number of levels to take away.

#### Returns

`boolean`

True when a level was taken away.

#### Native

[UnitStripHeroLevel](/typings/3.0.0/functions/UnitStripHeroLevel) ([jassbot](https://lep.duckdns.org/jassbot/doc/UnitStripHeroLevel))

***

### suspendDecay()

> **suspendDecay**(`suspend`): `void`

Defined in: [handles/unit.ts:3160](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L3160)

Stops, or resumes, the decay of the unit's corpse.

#### Parameters

##### suspend

`boolean`

True to stop the decay.

#### Returns

`void`

#### Native

[UnitSuspendDecay](/typings/3.0.0/functions/UnitSuspendDecay) ([jassbot](https://lep.duckdns.org/jassbot/doc/UnitSuspendDecay))

***

### suspendExperience()

> **suspendExperience**(`flag`): `void`

Defined in: [handles/unit.ts:3169](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L3169)

Stops, or resumes, the hero's experience gain.

#### Parameters

##### flag

`boolean`

True to stop the gain.

#### Returns

`void`

#### Native

[SuspendHeroXP](/typings/3.0.0/functions/SuspendHeroXP) ([jassbot](https://lep.duckdns.org/jassbot/doc/SuspendHeroXP))

***

### unequip()

> **unequip**(`whichItem`): `void`

Defined in: [handles/unit.ts:3178](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L3178)

Unequips an item from the unit.

#### Parameters

##### whichItem

[`Item`](Item.md)

The item to unequip.

#### Returns

`void`

#### Native

[UnitUnequipItem](/typings/3.0.0/functions/UnitUnequipItem) ([jassbot](https://lep.duckdns.org/jassbot/doc/UnitUnequipItem))

***

### unequipSlot()

> **unequipSlot**(`slot`): [`Item`](Item.md) \| `undefined`

Defined in: [handles/unit.ts:3189](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L3189)

Unequips the item in one of the unit's loadout slots.

#### Parameters

##### slot

[`LoadoutSlot`](../enumerations/LoadoutSlot.md)

The loadout slot.

#### Returns

[`Item`](Item.md) \| `undefined`

The unequipped item, or `undefined` when the slot is empty.

#### Native

[UnitUnequipItemFromSlot](/typings/3.0.0/functions/UnitUnequipItemFromSlot) ([jassbot](https://lep.duckdns.org/jassbot/doc/UnitUnequipItemFromSlot))

#### Native

[ConvertLoadoutSlot](/typings/3.0.0/functions/ConvertLoadoutSlot) ([jassbot](https://lep.duckdns.org/jassbot/doc/ConvertLoadoutSlot))

***

### useItem()

> **useItem**(`whichItem`): `boolean`

Defined in: [handles/unit.ts:3201](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L3201)

Orders the unit to use one of its items, as a click on it in the inventory does.

#### Parameters

##### whichItem

[`Item`](Item.md)

The item, in the unit's inventory.

#### Returns

`boolean`

True when the unit took the order.

#### Native

[UnitUseItem](/typings/3.0.0/functions/UnitUseItem) ([jassbot](https://lep.duckdns.org/jassbot/doc/UnitUseItem))

***

### useItemAt()

> **useItemAt**(`whichItem`, `x`, `y`): `boolean`

Defined in: [handles/unit.ts:3214](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L3214)

Orders the unit to use one of its items at a point.

#### Parameters

##### whichItem

[`Item`](Item.md)

The item, in the unit's inventory.

##### x

`number`

The x-coordinate, in world units.

##### y

`number`

The y-coordinate, in world units.

#### Returns

`boolean`

The boolean the game returns.

#### Native

[UnitUseItemPoint](/typings/3.0.0/functions/UnitUseItemPoint) ([jassbot](https://lep.duckdns.org/jassbot/doc/UnitUseItemPoint))

#### Bug

The game returns false even when the unit uses the item.

***

### useItemTarget()

> **useItemTarget**(`whichItem`, `target`): `boolean`

Defined in: [handles/unit.ts:3225](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L3225)

Orders the unit to use one of its items on a target.

#### Parameters

##### whichItem

[`Item`](Item.md)

The item, in the unit's inventory.

##### target

[`Widget`](Widget.md)

The widget the item is used on.

#### Returns

`boolean`

True when the unit took the order.

#### Native

[UnitUseItemTarget](/typings/3.0.0/functions/UnitUseItemTarget) ([jassbot](https://lep.duckdns.org/jassbot/doc/UnitUseItemTarget))

***

### wakeUp()

> **wakeUp**(): `void`

Defined in: [handles/unit.ts:3233](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L3233)

Wakes the unit up.

#### Returns

`void`

#### Native

[UnitWakeUp](/typings/3.0.0/functions/UnitWakeUp) ([jassbot](https://lep.duckdns.org/jassbot/doc/UnitWakeUp))

***

### waygateGetDestinationX()

> **waygateGetDestinationX**(): `number`

Defined in: [handles/unit.ts:3242](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L3242)

Gets the x-coordinate the waygate sends units to.

#### Returns

`number`

The x-coordinate, in world units; 0 for a unit without the Waygate ability.

#### Native

[WaygateGetDestinationX](/typings/3.0.0/functions/WaygateGetDestinationX) ([jassbot](https://lep.duckdns.org/jassbot/doc/WaygateGetDestinationX))

***

### waygateGetDestinationY()

> **waygateGetDestinationY**(): `number`

Defined in: [handles/unit.ts:3251](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L3251)

Gets the y-coordinate the waygate sends units to.

#### Returns

`number`

The y-coordinate, in world units; 0 for a unit without the Waygate ability.

#### Native

[WaygateGetDestinationY](/typings/3.0.0/functions/WaygateGetDestinationY) ([jassbot](https://lep.duckdns.org/jassbot/doc/WaygateGetDestinationY))

***

### waygateSetDestination()

> **waygateSetDestination**(`x`, `y`): `void`

Defined in: [handles/unit.ts:3264](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L3264)

Sets the point the waygate sends units to; the unit needs the Waygate ability (`'Awrp'`).

#### Parameters

##### x

`number`

The x-coordinate, in world units.

##### y

`number`

The y-coordinate, in world units.

#### Returns

`void`

#### Remarks

The game rounds each coordinate to the grid of 64 offset by 32: 0 becomes 32,
64 becomes 96.

#### Native

[WaygateSetDestination](/typings/3.0.0/functions/WaygateSetDestination) ([jassbot](https://lep.duckdns.org/jassbot/doc/WaygateSetDestination))

***

### create()

> `static` **create**(`owner`, `unitId`, `x`, `y`, `face?`, `skinId?`): `Unit`

Defined in: [handles/unit.ts:49](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L49)

Creates a unit for `owner` at the given point, facing `face`.

#### Parameters

##### owner

[`MapPlayer`](MapPlayer.md)

The player who owns the unit.

##### unitId

`number`

The unit type's rawcode, such as `FourCC("hfoo")`.

##### x

`number`

The x-coordinate, in world units.

##### y

`number`

The y-coordinate, in world units.

##### face?

`number` = `bj_UNIT_FACING`

The facing, in degrees; 270 (`bj_UNIT_FACING`) when left out.

##### skinId?

`number`

The skin's rawcode; the unit type's own model when left out.

#### Returns

`Unit`

The new unit.

#### Throws

When the game returns no handle, for example an unknown rawcode:
`reforged-ts: failed to create Unit (<rawcode>)`, at the calling line. In Dev
mode, also before the globals Init stage and inside `MapPlayer.runLocal`.

#### Native

[CreateUnit](/typings/3.0.0/functions/CreateUnit) ([jassbot](https://lep.duckdns.org/jassbot/doc/CreateUnit))

#### Native

[BlzCreateUnitWithSkin](/typings/3.0.0/functions/BlzCreateUnitWithSkin) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzCreateUnitWithSkin))

***

### createAtPoint()

> `static` **createAtPoint**(`owner`, `unitId`, `where`, `face?`): `Unit`

Defined in: [handles/unit.ts:77](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L77)

Creates a unit for `owner` at a point, facing `face`.

#### Parameters

##### owner

[`MapPlayer`](MapPlayer.md)

The player who owns the unit.

##### unitId

`number`

The unit type's rawcode, such as `FourCC("hfoo")`.

##### where

[`Point`](Point.md)

Where the unit stands.

##### face?

`number` = `bj_UNIT_FACING`

The facing, in degrees; 270 (`bj_UNIT_FACING`) when left out.

#### Returns

`Unit`

The new unit.

#### Throws

When the game returns no handle, for example an unknown rawcode:
`reforged-ts: failed to create Unit (<rawcode>)`, at the calling line. In Dev
mode, also before the globals Init stage and inside `MapPlayer.runLocal`.

#### Native

[CreateUnitAtLoc](/typings/3.0.0/functions/CreateUnitAtLoc) ([jassbot](https://lep.duckdns.org/jassbot/doc/CreateUnitAtLoc))

***

### createAtPointByName()

> `static` **createAtPointByName**(`owner`, `unitName`, `where`, `face?`): `Unit`

Defined in: [handles/unit.ts:101](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L101)

Creates a unit for `owner` at a point from the unit type's order name.

#### Parameters

##### owner

[`MapPlayer`](MapPlayer.md)

The player who owns the unit.

##### unitName

`string`

The unit type's order name, such as `"footman"`.

##### where

[`Point`](Point.md)

Where the unit stands.

##### face?

`number` = `bj_UNIT_FACING`

The facing, in degrees; 270 (`bj_UNIT_FACING`) when left out.

#### Returns

`Unit`

The new unit.

#### Throws

When the game returns no handle, for example an unknown name:
`reforged-ts: failed to create Unit (<unitName>)`, at the calling line. In Dev
mode, also before the globals Init stage and inside `MapPlayer.runLocal`.

#### Native

[CreateUnitAtLocByName](/typings/3.0.0/functions/CreateUnitAtLocByName) ([jassbot](https://lep.duckdns.org/jassbot/doc/CreateUnitAtLocByName))

***

### createBlightedGoldmine()

> `static` **createBlightedGoldmine**(`owner`, `x`, `y`, `face?`): `Unit`

Defined in: [handles/unit.ts:128](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L128)

Creates an undead haunted gold mine, which spreads blight around it.

#### Parameters

##### owner

[`MapPlayer`](MapPlayer.md)

The player who owns the gold mine.

##### x

`number`

The x-coordinate, in world units.

##### y

`number`

The y-coordinate, in world units.

##### face?

`number` = `bj_UNIT_FACING`

The facing, in degrees; 270 (`bj_UNIT_FACING`) when left out.

#### Returns

`Unit`

The new gold mine.

#### Remarks

The mine holds the gold that the Gold Mine ability (`'Agld'`) sets, and it
turns back into a normal gold mine when it is destroyed.

#### Throws

When the game returns no handle: `reforged-ts: failed to create Unit`,
at the calling line. In Dev mode, also before the globals Init stage and
inside `MapPlayer.runLocal`.

#### Native

[CreateBlightedGoldmine](/typings/3.0.0/functions/CreateBlightedGoldmine) ([jassbot](https://lep.duckdns.org/jassbot/doc/CreateBlightedGoldmine))

***

### createByName()

> `static` **createByName**(`owner`, `unitName`, `x`, `y`, `face?`): `Unit`

Defined in: [handles/unit.ts:150](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L150)

Creates a unit for `owner` from the unit type's order name.

#### Parameters

##### owner

[`MapPlayer`](MapPlayer.md)

The player who owns the unit.

##### unitName

`string`

The unit type's order name, such as `"footman"`.

##### x

`number`

The x-coordinate, in world units.

##### y

`number`

The y-coordinate, in world units.

##### face?

`number` = `bj_UNIT_FACING`

The facing, in degrees; 270 (`bj_UNIT_FACING`) when left out.

#### Returns

`Unit`

The new unit.

#### Throws

When the game returns no handle, for example an unknown name:
`reforged-ts: failed to create Unit (<unitName>)`, at the calling line. In Dev
mode, also before the globals Init stage and inside `MapPlayer.runLocal`.

#### Native

[CreateUnitByName](/typings/3.0.0/functions/CreateUnitByName) ([jassbot](https://lep.duckdns.org/jassbot/doc/CreateUnitByName))

***

### createCorpse()

> `static` **createCorpse**(`owner`, `unitId`, `x`, `y`, `face?`): `Unit`

Defined in: [handles/unit.ts:180](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L180)

Creates the corpse of a unit type for `owner`.

#### Parameters

##### owner

[`MapPlayer`](MapPlayer.md)

The player who owns the corpse.

##### unitId

`number`

The unit type's rawcode, such as `FourCC("hfoo")`.

##### x

`number`

The x-coordinate, in world units.

##### y

`number`

The y-coordinate, in world units.

##### face?

`number` = `bj_UNIT_FACING`

The facing, in degrees; 270 (`bj_UNIT_FACING`) when left out.

#### Returns

`Unit`

The new corpse.

#### Remarks

The unit dies as it spawns and plays its decay animation, so it becomes a
corpse only once that animation has run.

#### Throws

When the game returns no handle, for example an unknown rawcode or a
unit type that leaves no corpse: `reforged-ts: failed to create Unit (<rawcode>)`,
at the calling line. In Dev mode, also before the globals Init stage and inside
`MapPlayer.runLocal`.

#### Native

[CreateCorpse](/typings/3.0.0/functions/CreateCorpse) ([jassbot](https://lep.duckdns.org/jassbot/doc/CreateCorpse))

***

### foodMadeByType()

> `static` **foodMadeByType**(`unitId`): `number`

Defined in: [handles/unit.ts:3588](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L3588)

Gets the food a unit type provides to its owner, such as a farm's.

#### Parameters

##### unitId

`number`

The unit type's rawcode.

#### Returns

`number`

The food provided.

#### Native

[GetFoodMade](/typings/3.0.0/functions/GetFoodMade) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetFoodMade))

***

### foodUsedByType()

> `static` **foodUsedByType**(`unitId`): `number`

Defined in: [handles/unit.ts:3598](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L3598)

Gets the food a unit type costs its owner.

#### Parameters

##### unitId

`number`

The unit type's rawcode.

#### Returns

`number`

The food used.

#### Native

[GetFoodUsed](/typings/3.0.0/functions/GetFoodUsed) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetFoodUsed))

***

### fromAttacker()

> `static` **fromAttacker**(): `Unit` \| `undefined`

Defined in: [handles/unit.ts:3607](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L3607)

Gets the attacking unit of an attacked event.

#### Returns

`Unit` \| `undefined`

The attacker, or `undefined` outside an attacked event.

#### Native

[GetAttacker](/typings/3.0.0/functions/GetAttacker) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetAttacker))

***

### fromBuying()

> `static` **fromBuying**(): `Unit` \| `undefined`

Defined in: [handles/unit.ts:3789](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L3789)

Gets the unit buying from a shop in a sell event.

#### Returns

`Unit` \| `undefined`

The buyer, or `undefined` outside a sell event.

#### Native

[GetBuyingUnit](/typings/3.0.0/functions/GetBuyingUnit) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetBuyingUnit))

***

### fromCancelled()

> `static` **fromCancelled**(): `Unit` \| `undefined`

Defined in: [handles/unit.ts:3798](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L3798)

Gets the structure whose construction is cancelled in a construction cancel event.

#### Returns

`Unit` \| `undefined`

The structure, or `undefined` outside a construction cancel.

#### Native

[GetCancelledStructure](/typings/3.0.0/functions/GetCancelledStructure) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetCancelledStructure))

***

### fromChanging()

> `static` **fromChanging**(): `Unit` \| `undefined`

Defined in: [handles/unit.ts:3616](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L3616)

Gets the unit changing owner in an ownership change event.

#### Returns

`Unit` \| `undefined`

The unit, or `undefined` outside an ownership change.

#### Native

[GetChangingUnit](/typings/3.0.0/functions/GetChangingUnit) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetChangingUnit))

***

### fromConstructed()

> `static` **fromConstructed**(): `Unit` \| `undefined`

Defined in: [handles/unit.ts:3625](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L3625)

Gets the finished structure of a construction finish event.

#### Returns

`Unit` \| `undefined`

The structure, or `undefined` outside a construction finish.

#### Native

[GetConstructedStructure](/typings/3.0.0/functions/GetConstructedStructure) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetConstructedStructure))

***

### fromConstructing()

> `static` **fromConstructing**(): `Unit` \| `undefined`

Defined in: [handles/unit.ts:3807](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L3807)

Gets the structure being built in a construction start event.

#### Returns

`Unit` \| `undefined`

The structure, or `undefined` outside a construction start.

#### Native

[GetConstructingStructure](/typings/3.0.0/functions/GetConstructingStructure) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetConstructingStructure))

***

### fromDamageSource()

> `static` **fromDamageSource**(): `Unit` \| `undefined`

Defined in: [handles/unit.ts:3634](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L3634)

Gets the unit dealing the damage in a damage event.

#### Returns

`Unit` \| `undefined`

The source, or `undefined` outside a damage event or when no unit deals the damage.

#### Native

[GetEventDamageSource](/typings/3.0.0/functions/GetEventDamageSource) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetEventDamageSource))

***

### fromDamageTarget()

> `static` **fromDamageTarget**(): `Unit` \| `undefined`

Defined in: [handles/unit.ts:3643](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L3643)

Gets the unit taking the damage in a damage event.

#### Returns

`Unit` \| `undefined`

The target, or `undefined` outside a damage event.

#### Native

[BlzGetEventDamageTarget](/typings/3.0.0/functions/BlzGetEventDamageTarget) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzGetEventDamageTarget))

***

### fromDecaying()

> `static` **fromDecaying**(): `Unit` \| `undefined`

Defined in: [handles/unit.ts:3816](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L3816)

Gets the decaying unit of a decay event.

#### Returns

`Unit` \| `undefined`

The unit, or `undefined` outside a decay event.

#### Native

[GetDecayingUnit](/typings/3.0.0/functions/GetDecayingUnit) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetDecayingUnit))

***

### fromDetected()

> `static` **fromDetected**(): `Unit` \| `undefined`

Defined in: [handles/unit.ts:3825](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L3825)

Gets the detected unit of a detection event.

#### Returns

`Unit` \| `undefined`

The unit, or `undefined` outside a detection event.

#### Native

[GetDetectedUnit](/typings/3.0.0/functions/GetDetectedUnit) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetDetectedUnit))

***

### fromDying()

> `static` **fromDying**(): `Unit` \| `undefined`

Defined in: [handles/unit.ts:3834](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L3834)

Gets the dying unit of a death event.

#### Returns

`Unit` \| `undefined`

The unit, or `undefined` outside a death event.

#### Native

[GetDyingUnit](/typings/3.0.0/functions/GetDyingUnit) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetDyingUnit))

***

### fromEntering()

> `static` **fromEntering**(): `Unit` \| `undefined`

Defined in: [handles/unit.ts:3652](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L3652)

Gets the unit entering the region in a region event.

#### Returns

`Unit` \| `undefined`

The unit, or `undefined` outside a region event.

#### Native

[GetEnteringUnit](/typings/3.0.0/functions/GetEnteringUnit) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetEnteringUnit))

***

### fromEnum()

> `static` **fromEnum**(): `Unit` \| `undefined`

Defined in: [handles/unit.ts:3661](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L3661)

Gets the unit a group loop is at, inside the callback of `Group.for`.

#### Returns

`Unit` \| `undefined`

The unit, or `undefined` outside a group loop.

#### Native

[GetEnumUnit](/typings/3.0.0/functions/GetEnumUnit) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetEnumUnit))

***

### fromEvent()

> `static` **fromEvent**(): `Unit` \| `undefined`

Defined in: [handles/unit.ts:3670](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L3670)

Gets the unit of the unit event that fired the running Trigger.

#### Returns

`Unit` \| `undefined`

The unit, or `undefined` outside a unit event.

#### Native

[GetTriggerUnit](/typings/3.0.0/functions/GetTriggerUnit) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetTriggerUnit))

#### Overrides

[`Widget`](Widget.md).[`fromEvent`](Widget.md#fromevent)

***

### fromEventTarget()

> `static` **fromEventTarget**(): `Unit` \| `undefined`

Defined in: [handles/unit.ts:3843](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L3843)

Gets the target unit of a target acquired or target in range event.

#### Returns

`Unit` \| `undefined`

The target, or `undefined` when the event has none.

#### Native

[GetEventTargetUnit](/typings/3.0.0/functions/GetEventTargetUnit) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetEventTargetUnit))

***

### fromFilter()

> `static` **fromFilter**(): `Unit` \| `undefined`

Defined in: [handles/unit.ts:3679](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L3679)

Gets the unit a group enumeration is testing, inside its filter.

#### Returns

`Unit` \| `undefined`

The unit, or `undefined` outside an enumeration filter.

#### Native

[GetFilterUnit](/typings/3.0.0/functions/GetFilterUnit) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetFilterUnit))

***

### fromHandle()

> `static` **fromHandle**\<`C`\>(`this`, `handle`): `C` \| `undefined`

Defined in: [handles/handle.ts:195](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/handle.ts#L195)

Gets the Wrapper for `handle`, making it on first use. The same Handle
always gives the same object; when the object cached for it is of a less
specific class than the one asked for (a `Timer` cached,
`MyTimer.fromHandle` asked), a new object of the class asked for replaces
it. `Unit.fromHandle(h)` is typed `Unit | undefined`.

#### Type Parameters

##### C

`C` *extends* [`Handle`](Handle.md)\<`handle`\>

The Wrapper of the class it is called on.

#### Parameters

##### this

[`WrapperClass`](../type-aliases/WrapperClass.md)\<`C`\>

##### handle

`C`\[`"handle"`\] \| `undefined`

A Handle of the class's Native type.

#### Returns

`C` \| `undefined`

The Wrapper, or `undefined` when `handle` is undefined.

#### Remarks

It creates no Handle, so none of the creation Guards of Dev mode apply:
wrap a Handle that Native code outside the library returned.

#### Inherited from

[`Widget`](Widget.md).[`fromHandle`](Widget.md#fromhandle)

***

### fromKilling()

> `static` **fromKilling**(): `Unit` \| `undefined`

Defined in: [handles/unit.ts:3688](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L3688)

Gets the unit that killed the dying unit in a death event.

#### Returns

`Unit` \| `undefined`

The killer, or `undefined` outside a death event or when no unit killed it.

#### Native

[GetKillingUnit](/typings/3.0.0/functions/GetKillingUnit) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetKillingUnit))

***

### fromLearning()

> `static` **fromLearning**(): `Unit` \| `undefined`

Defined in: [handles/unit.ts:3852](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L3852)

Gets the hero learning a skill in a skill event.

#### Returns

`Unit` \| `undefined`

The hero, or `undefined` outside a skill event.

#### Native

[GetLearningUnit](/typings/3.0.0/functions/GetLearningUnit) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetLearningUnit))

***

### fromLeaving()

> `static` **fromLeaving**(): `Unit` \| `undefined`

Defined in: [handles/unit.ts:3697](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L3697)

Gets the unit leaving the region in a region event.

#### Returns

`Unit` \| `undefined`

The unit, or `undefined` outside a region event.

#### Native

[GetLeavingUnit](/typings/3.0.0/functions/GetLeavingUnit) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetLeavingUnit))

***

### fromLeveling()

> `static` **fromLeveling**(): `Unit` \| `undefined`

Defined in: [handles/unit.ts:3706](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L3706)

Gets the hero gaining a level in a hero level event.

#### Returns

`Unit` \| `undefined`

The hero, or `undefined` outside a hero level event.

#### Native

[GetLevelingUnit](/typings/3.0.0/functions/GetLevelingUnit) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetLevelingUnit))

***

### fromLoaded()

> `static` **fromLoaded**(): `Unit` \| `undefined`

Defined in: [handles/unit.ts:3715](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L3715)

Gets the unit loaded into a transport in a load event.

#### Returns

`Unit` \| `undefined`

The unit, or `undefined` outside a load event.

#### Native

[GetLoadedUnit](/typings/3.0.0/functions/GetLoadedUnit) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetLoadedUnit))

***

### fromManipulating()

> `static` **fromManipulating**(): `Unit` \| `undefined`

Defined in: [handles/unit.ts:3861](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L3861)

Gets the unit picking up, dropping or using an item in an item event.

#### Returns

`Unit` \| `undefined`

The unit, or `undefined` outside an item event.

#### Native

[GetManipulatingUnit](/typings/3.0.0/functions/GetManipulatingUnit) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetManipulatingUnit))

***

### fromMouseFocus()

> `static` **fromMouseFocus**(): `Unit` \| `undefined`

Defined in: [handles/unit.ts:3873](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L3873)

**`Async`**

Gets the unit under the local player's mouse cursor.

#### Returns

`Unit` \| `undefined`

The unit, or `undefined` when the cursor is over none.

#### Remarks

The value differs between clients: never let it decide game state.

#### Native

[BlzGetMouseFocusUnit](/typings/3.0.0/functions/BlzGetMouseFocusUnit) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzGetMouseFocusUnit))

***

### fromOrdered()

> `static` **fromOrdered**(): `Unit` \| `undefined`

Defined in: [handles/unit.ts:3724](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L3724)

Gets the unit given an order in an order event.

#### Returns

`Unit` \| `undefined`

The unit, or `undefined` outside an order event.

#### Native

[GetOrderedUnit](/typings/3.0.0/functions/GetOrderedUnit) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetOrderedUnit))

***

### fromOrderTarget()

> `static` **fromOrderTarget**(): `Unit` \| `undefined`

Defined in: [handles/unit.ts:3734](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L3734)

Gets the unit a target order targets in an order event.

#### Returns

`Unit` \| `undefined`

The target, or `undefined` outside a target order or when the target
is not a unit.

#### Native

[GetOrderTargetUnit](/typings/3.0.0/functions/GetOrderTargetUnit) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetOrderTargetUnit))

#### Overrides

[`Widget`](Widget.md).[`fromOrderTarget`](Widget.md#fromordertarget)

***

### fromRescuer()

> `static` **fromRescuer**(): `Unit` \| `undefined`

Defined in: [handles/unit.ts:3891](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L3891)

Gets the unit rescuing in a rescue event.

#### Returns

`Unit` \| `undefined`

The rescuer, or `undefined` outside a rescue event.

#### Native

[GetRescuer](/typings/3.0.0/functions/GetRescuer) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetRescuer))

***

### fromResearching()

> `static` **fromResearching**(): `Unit` \| `undefined`

Defined in: [handles/unit.ts:3882](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L3882)

Gets the unit researching in a research event.

#### Returns

`Unit` \| `undefined`

The unit, or `undefined` outside a research event.

#### Native

[GetResearchingUnit](/typings/3.0.0/functions/GetResearchingUnit) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetResearchingUnit))

***

### fromRevivable()

> `static` **fromRevivable**(): `Unit` \| `undefined`

Defined in: [handles/unit.ts:3900](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L3900)

Gets the hero that became revivable in a revivable event.

#### Returns

`Unit` \| `undefined`

The hero, or `undefined` outside a revivable event.

#### Native

[GetRevivableUnit](/typings/3.0.0/functions/GetRevivableUnit) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetRevivableUnit))

***

### fromReviving()

> `static` **fromReviving**(): `Unit` \| `undefined`

Defined in: [handles/unit.ts:3909](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L3909)

Gets the reviving hero of a revive event.

#### Returns

`Unit` \| `undefined`

The hero, or `undefined` outside a revive event.

#### Native

[GetRevivingUnit](/typings/3.0.0/functions/GetRevivingUnit) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetRevivingUnit))

***

### fromSelling()

> `static` **fromSelling**(): `Unit` \| `undefined`

Defined in: [handles/unit.ts:3918](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L3918)

Gets the shop selling in a sell event.

#### Returns

`Unit` \| `undefined`

The shop, or `undefined` outside a sell event.

#### Native

[GetSellingUnit](/typings/3.0.0/functions/GetSellingUnit) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetSellingUnit))

***

### fromSold()

> `static` **fromSold**(): `Unit` \| `undefined`

Defined in: [handles/unit.ts:3927](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L3927)

Gets the unit sold in a unit sell event.

#### Returns

`Unit` \| `undefined`

The unit, or `undefined` outside a unit sell event.

#### Native

[GetSoldUnit](/typings/3.0.0/functions/GetSoldUnit) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetSoldUnit))

***

### fromSpellAbility()

> `static` **fromSpellAbility**(): `Unit` \| `undefined`

Defined in: [handles/unit.ts:3936](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L3936)

Gets the unit casting the spell in a spell event.

#### Returns

`Unit` \| `undefined`

The caster, or `undefined` outside a spell event.

#### Native

[GetSpellAbilityUnit](/typings/3.0.0/functions/GetSpellAbilityUnit) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetSpellAbilityUnit))

***

### fromSpellTarget()

> `static` **fromSpellTarget**(): `Unit` \| `undefined`

Defined in: [handles/unit.ts:3744](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L3744)

Gets the target unit of the spell in a spell event.

#### Returns

`Unit` \| `undefined`

The target, or `undefined` outside a spell event or when the spell
targets no unit.

#### Native

[GetSpellTargetUnit](/typings/3.0.0/functions/GetSpellTargetUnit) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetSpellTargetUnit))

***

### fromSummoned()

> `static` **fromSummoned**(): `Unit` \| `undefined`

Defined in: [handles/unit.ts:3753](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L3753)

Gets the summoned unit of a summon event.

#### Returns

`Unit` \| `undefined`

The summoned unit, or `undefined` outside a summon event.

#### Native

[GetSummonedUnit](/typings/3.0.0/functions/GetSummonedUnit) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetSummonedUnit))

***

### fromSummoning()

> `static` **fromSummoning**(): `Unit` \| `undefined`

Defined in: [handles/unit.ts:3762](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L3762)

Gets the unit that summons in a summon event.

#### Returns

`Unit` \| `undefined`

The summoner, or `undefined` outside a summon event.

#### Native

[GetSummoningUnit](/typings/3.0.0/functions/GetSummoningUnit) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetSummoningUnit))

***

### fromTrained()

> `static` **fromTrained**(): `Unit` \| `undefined`

Defined in: [handles/unit.ts:3771](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L3771)

Gets the trained unit of a training finish event.

#### Returns

`Unit` \| `undefined`

The unit, or `undefined` outside a training finish.

#### Native

[GetTrainedUnit](/typings/3.0.0/functions/GetTrainedUnit) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetTrainedUnit))

***

### fromTransport()

> `static` **fromTransport**(): `Unit` \| `undefined`

Defined in: [handles/unit.ts:3780](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L3780)

Gets the transport a unit is loaded into in a load event.

#### Returns

`Unit` \| `undefined`

The transport, or `undefined` outside a load event.

#### Native

[GetTransportUnit](/typings/3.0.0/functions/GetTransportUnit) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetTransportUnit))

***

### getPointValueByType()

> `static` **getPointValueByType**(`unitType`): `number`

Defined in: [handles/unit.ts:3946](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L3946)

Gets the point value a unit type defines, which the score screen counts.

#### Parameters

##### unitType

`number`

The unit type's rawcode.

#### Returns

`number`

The point value.

#### Native

[GetUnitPointValueByType](/typings/3.0.0/functions/GetUnitPointValueByType) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetUnitPointValueByType))

***

### isUnitIdHero()

> `static` **isUnitIdHero**(`unitId`): `boolean`

Defined in: [handles/unit.ts:3956](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L3956)

Checks whether a unit type is a hero type.

#### Parameters

##### unitId

`number`

The unit type's rawcode.

#### Returns

`boolean`

True when the type is a hero type.

#### Native

[IsHeroUnitId](/typings/3.0.0/functions/IsHeroUnitId) ([jassbot](https://lep.duckdns.org/jassbot/doc/IsHeroUnitId))

***

### isUnitIdType()

> `static` **isUnitIdType**(`unitId`, `whichUnitType`): `boolean`

Defined in: [handles/unit.ts:3967](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/unit.ts#L3967)

Checks whether a unit type has a classification, such as `UNIT_TYPE_STRUCTURE`.

#### Parameters

##### unitId

`number`

The unit type's rawcode.

##### whichUnitType

`unittype`

The classification.

#### Returns

`boolean`

True when the type has it.

#### Native

[IsUnitIdType](/typings/3.0.0/functions/IsUnitIdType) ([jassbot](https://lep.duckdns.org/jassbot/doc/IsUnitIdType))
