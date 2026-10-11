# Class: Unit

Defined in: [handles/unit.ts:30](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L30)

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

Defined in: [handles/unit.ts:32](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L32)

The game's `unit` Handle this Wrapper owns.

#### Overrides

[`Widget`](Widget.md).[`handle`](Widget.md#handle)

## Accessors

### acquireRange

#### Get Signature

> **get** **acquireRange**(): `number`

Defined in: [handles/unit.ts:217](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L217)

Gets the range within which the unit picks targets to engage, in world units.

##### Native

[GetUnitAcquireRange](/typings/3.0.0/functions/GetUnitAcquireRange) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetUnitAcquireRange))

##### Returns

`number`

The current acquire range.

#### Set Signature

> **set** **acquireRange**(`value`): `void`

Defined in: [handles/unit.ts:208](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L208)

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

Defined in: [handles/unit.ts:226](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L226)

Gets the hero's agility without the bonuses of items and buffs.

##### Native

[GetHeroAgi](/typings/3.0.0/functions/GetHeroAgi) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetHeroAgi))

##### Returns

`number`

The base agility; 0 for a unit that is not a hero.

#### Set Signature

> **set** **agility**(`value`): `void`

Defined in: [handles/unit.ts:234](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L234)

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

Defined in: [handles/unit.ts:244](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L244)

Gets the unit's armor as it stands, the bonus armor of agility, auras,
buffs and items counted in.

##### Native

[BlzGetUnitArmor](/typings/3.0.0/functions/BlzGetUnitArmor) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzGetUnitArmor))

##### Returns

`number`

The total armor.

#### Set Signature

> **set** **armor**(`armorAmount`): `void`

Defined in: [handles/unit.ts:253](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L253)

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

Defined in: [handles/unit.ts:262](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L262)

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

Defined in: [handles/unit.ts:279](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L279)

Gets whether the unit may sleep at night.

##### Native

[UnitCanSleep](/typings/3.0.0/functions/UnitCanSleep) ([jassbot](https://lep.duckdns.org/jassbot/doc/UnitCanSleep))

##### Returns

`boolean`

True when the unit may sleep.

#### Set Signature

> **set** **canSleep**(`flag`): `void`

Defined in: [handles/unit.ts:270](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L270)

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

Defined in: [handles/unit.ts:289](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L289)

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

Defined in: [handles/unit.ts:298](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L298)

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

Defined in: [handles/unit.ts:307](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L307)

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

Defined in: [handles/unit.ts:316](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L316)

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

Defined in: [handles/unit.ts:325](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L325)

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

Defined in: [handles/unit.ts:334](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L334)

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

Defined in: [handles/unit.ts:345](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L345)

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

Defined in: [handles/unit.ts:355](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L355)

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

Defined in: [handles/unit.ts:364](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L364)

Gets the hero's experience points.

##### Native

[GetHeroXP](/typings/3.0.0/functions/GetHeroXP) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetHeroXP))

##### Returns

`number`

The experience; 0 for a unit that is not a hero.

#### Set Signature

> **set** **experience**(`newXpVal`): `void`

Defined in: [handles/unit.ts:372](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L372)

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

Defined in: [handles/unit.ts:390](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L390)

Gets the direction the unit faces, in degrees.

##### Native

[GetUnitFacing](/typings/3.0.0/functions/GetUnitFacing) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetUnitFacing))

##### Returns

`number`

The facing, in degrees (0 east, 90 north).

#### Set Signature

> **set** **facing**(`value`): `void`

Defined in: [handles/unit.ts:381](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L381)

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

Defined in: [handles/unit.ts:399](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L399)

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

Defined in: [handles/unit.ts:408](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L408)

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

Defined in: [handles/handle.ts:148](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/handle.ts#L148)

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

Defined in: [handles/unit.ts:417](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L417)

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

Defined in: [handles/unit.ts:426](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L426)

Gets the hero's intelligence without the bonuses of items and buffs.

##### Native

[GetHeroInt](/typings/3.0.0/functions/GetHeroInt) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetHeroInt))

##### Returns

`number`

The base intelligence; 0 for a unit that is not a hero.

#### Set Signature

> **set** **intelligence**(`value`): `void`

Defined in: [handles/unit.ts:434](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L434)

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

Defined in: [handles/unit.ts:443](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L443)

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

Defined in: [handles/unit.ts:463](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L463)

Gets whether the unit is invulnerable.

##### Native

[BlzIsUnitInvulnerable](/typings/3.0.0/functions/BlzIsUnitInvulnerable) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzIsUnitInvulnerable))

##### Returns

`boolean`

True when the unit is invulnerable.

#### Set Signature

> **set** **invulnerable**(`flag`): `void`

Defined in: [handles/unit.ts:454](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L454)

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

Defined in: [handles/unit.ts:472](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L472)

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

Defined in: [handles/unit.ts:481](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L481)

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

Defined in: [handles/widget.ts:19](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/widget.ts#L19)

Gets how many hit points the widget has left.

##### Native

[GetWidgetLife](/typings/3.0.0/functions/GetWidgetLife) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetWidgetLife))

##### Returns

`number`

The hit points left, an amount rather than a percentage.

#### Set Signature

> **set** **life**(`value`): `void`

Defined in: [handles/widget.ts:27](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/widget.ts#L27)

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

Defined in: [handles/unit.ts:496](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L496)

**`Async`**

Gets the height of the unit's position, as the local client sees it.

##### Remarks

The value can differ between clients: never let it decide game state. It is
the same value as `z` today.

##### Example

**Placing visuals from local heights**

```ts
// A halo over a flying unit and a shadow on the ground below it, placed from
// heights and positions as each client sees them. The terrain height, a
// unit's height and where an effect is drawn can differ between clients, so
// they place visuals only: game logic reads positions every client shares,
// such as the unit's x and y.
import { Effect, Init, Point, Timer, tsGlobals, Unit } from "reforged-ts";

Init.onGameStart(() => {
  const gryphon = Unit.create(tsGlobals.Players[0], FourCC("hgry"), 0, 0);
  const halo = Effect.create(
    "Abilities\\Spells\\Human\\InnerFire\\InnerFireTarget.mdl",
    0,
    0,
  );
  const shadow = Effect.create(
    "Abilities\\Spells\\Undead\\RegenerationAura\\ObsidianRegenAura.mdl",
    0,
    0,
  );
  const ground = Point.create(0, 0);

  Timer.every(0.03, () => {
    ground.setPosition(gryphon.x, gryphon.y);
    // `localZ` reads the same height as `z` today.
    halo.setPosition(gryphon.x, gryphon.y, gryphon.localZ + 100);
    halo.setAlpha(gryphon.z - ground.z < 50 ? 0 : 255);
    // The shadow lies on the terrain under the halo and shrinks as it rises.
    shadow.setPosition(halo.x, halo.y, ground.z);
    shadow.scale = Math.max(0.2, 1 - (halo.z - ground.z) / 1000);
  });
});
```

##### Native

[BlzGetLocalUnitZ](/typings/3.0.0/functions/BlzGetLocalUnitZ) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzGetLocalUnitZ))

##### Returns

`number`

The height, in world units.

***

### mana

#### Get Signature

> **get** **mana**(): `number`

Defined in: [handles/unit.ts:506](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L506)

Gets the mana the unit has left to cast its abilities with, from 0 up to
`maxMana`.

##### Native

[GetUnitState](/typings/3.0.0/functions/GetUnitState) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetUnitState))

##### Returns

`number`

The current mana; 0 for a unit without mana.

#### Set Signature

> **set** **mana**(`value`): `void`

Defined in: [handles/unit.ts:515](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L515)

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

Defined in: [handles/unit.ts:524](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L524)

Gets the most life the unit can have, the full length of its health bar.

##### Native

[BlzGetUnitMaxHP](/typings/3.0.0/functions/BlzGetUnitMaxHP) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzGetUnitMaxHP))

##### Returns

`number`

The maximum life, a whole number of hit points.

#### Set Signature

> **set** **maxLife**(`value`): `void`

Defined in: [handles/unit.ts:533](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L533)

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

Defined in: [handles/unit.ts:542](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L542)

Gets the most mana the unit can have, the full length of its mana bar.

##### Native

[BlzGetUnitMaxMana](/typings/3.0.0/functions/BlzGetUnitMaxMana) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzGetUnitMaxMana))

##### Returns

`number`

The maximum mana, a whole number; 0 for a unit without mana.

#### Set Signature

> **set** **maxMana**(`value`): `void`

Defined in: [handles/unit.ts:551](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L551)

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

Defined in: [handles/unit.ts:568](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L568)

Gets the unit's movement speed, in world units per second.

##### Native

[GetUnitMoveSpeed](/typings/3.0.0/functions/GetUnitMoveSpeed) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetUnitMoveSpeed))

##### Returns

`number`

The movement speed.

#### Set Signature

> **set** **moveSpeed**(`value`): `void`

Defined in: [handles/unit.ts:559](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L559)

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

Defined in: [handles/unit.ts:582](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L582)

**`Async`**

Gets the unit's name as the local client's language shows it.

##### Remarks

The value can differ between clients: never let it decide game state.

##### Example

**Showing names in the local language**

```ts
// The names and texts of units, items and destructables come in each
// client's own language, so they differ between players: show them, and
// decide by the type's rawcode, which every client shares.
import {
  Destructable,
  Init,
  Item,
  on,
  tsGlobals,
  Unit,
  UnitEvents,
} from "reforged-ts";

Init.onTriggers(() => {
  // A rawcode decides which item counts, here Claws of Attack +15's,
  // `FourCC("ratf")`; the text only describes it.
  on(
    UnitEvents.pickupItem,
    ({ unit, item }) => {
      print(`${unit.name} picked up ${item.name}: ${item.tooltip}`);
      print(
        item.extendedTooltip !== "" ? item.extendedTooltip : item.description,
      );
    },
    ({ item }) => item.typeId === FourCC("ratf"),
  );

  const tree = Destructable.create({ typeId: FourCC("LTlt"), x: 256, y: 0 });
  const footman = Unit.create(tsGlobals.Players[0], FourCC("hfoo"), 0, 0);
  print(`${footman.name} stands next to a ${tree.name ?? "tree"}`);
  Item.create(FourCC("ratf"), 128, 0);
});
```

##### Native

[GetUnitName](/typings/3.0.0/functions/GetUnitName) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetUnitName))

##### Returns

`string`

The localized name, or an empty string when the game returns none.

#### Set Signature

> **set** **name**(`value`): `void`

Defined in: [handles/unit.ts:591](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L591)

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

Defined in: [handles/unit.ts:611](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L611)

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

Defined in: [handles/unit.ts:599](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L599)

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

Defined in: [handles/unit.ts:620](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L620)

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

Defined in: [handles/unit.ts:643](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L643)

Gets whether the unit is paused.

##### Native

[IsUnitPaused](/typings/3.0.0/functions/IsUnitPaused) ([jassbot](https://lep.duckdns.org/jassbot/doc/IsUnitPaused))

##### Returns

`boolean`

True when the `paused` setter paused the unit; `pauseEx` leaves it false.

#### Set Signature

> **set** **paused**(`flag`): `void`

Defined in: [handles/unit.ts:634](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L634)

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

Defined in: [handles/unit.ts:652](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L652)

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

Defined in: [handles/unit.ts:676](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L676)

Gets the unit's propulsion window, in radians.

##### Native

[GetUnitPropWindow](/typings/3.0.0/functions/GetUnitPropWindow) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetUnitPropWindow))

##### Returns

`number`

The propulsion window, in radians.

#### Set Signature

> **set** **propWindow**(`newPropWindowAngle`): `void`

Defined in: [handles/unit.ts:667](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L667)

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

Defined in: [handles/unit.ts:685](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L685)

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

Defined in: [handles/unit.ts:694](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L694)

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

Defined in: [handles/unit.ts:704](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L704)

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

Defined in: [handles/unit.ts:713](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L713)

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

Defined in: [handles/unit.ts:730](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L730)

Gets the gold left in the gold mine.

##### Native

[GetResourceAmount](/typings/3.0.0/functions/GetResourceAmount) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetResourceAmount))

##### Returns

`number`

The gold amount; 0 for a unit that is not a gold mine.

#### Set Signature

> **set** **resourceAmount**(`amount`): `void`

Defined in: [handles/unit.ts:721](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L721)

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

Defined in: [handles/unit.ts:739](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L739)

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

Defined in: [handles/unit.ts:756](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L756)

Gets the scale of the unit's selection circle.

##### Native

[BlzGetUnitRealField](/typings/3.0.0/functions/BlzGetUnitRealField) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzGetUnitRealField))

##### Returns

`number`

The selection scale, or 0 when the game returns none.

#### Set Signature

> **set** **selectionScale**(`scale`): `void`

Defined in: [handles/unit.ts:747](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L747)

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

Defined in: [handles/unit.ts:775](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L775)

Gets whether the unit is shown.

##### Native

[IsUnitHidden](/typings/3.0.0/functions/IsUnitHidden) ([jassbot](https://lep.duckdns.org/jassbot/doc/IsUnitHidden))

##### Returns

`boolean`

True when the unit is shown, false when it is hidden.

#### Set Signature

> **set** **show**(`flag`): `void`

Defined in: [handles/unit.ts:766](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L766)

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

Defined in: [handles/unit.ts:803](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L803)

Gets the hero's unspent skill points.

##### Native

[GetHeroSkillPoints](/typings/3.0.0/functions/GetHeroSkillPoints) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetHeroSkillPoints))

##### Returns

`number`

The unspent skill points; 0 for a unit that is not a hero.

#### Set Signature

> **set** **skillPoints**(`skillPoints`): `void`

Defined in: [handles/unit.ts:817](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L817)

Sets the hero's unspent skill points, by the difference from the points
it has; nothing for a unit that is not a hero.

##### Remarks

The game never goes below 0, nor above the points the hero has left to
spend on its abilities (9 at most for three abilities of 3 levels each),
so the count read back can be lower than the one set.

##### Native

[GetHeroSkillPoints](/typings/3.0.0/functions/GetHeroSkillPoints) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetHeroSkillPoints))

##### Native

[UnitModifySkillPoints](/typings/3.0.0/functions/UnitModifySkillPoints) ([jassbot](https://lep.duckdns.org/jassbot/doc/UnitModifySkillPoints))

##### Parameters

###### skillPoints

`number`

##### Returns

`void`

***

### skin

#### Get Signature

> **get** **skin**(): `Rawcode`\<`"unit"`\>

Defined in: [handles/unit.ts:784](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L784)

Gets the rawcode of the unit type whose model the unit uses.

##### Native

[BlzGetUnitSkin](/typings/3.0.0/functions/BlzGetUnitSkin) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzGetUnitSkin))

##### Returns

`Rawcode`\<`"unit"`\>

The skin's rawcode, such as the Knight's, `FourCC("hkni")`.

#### Set Signature

> **set** **skin**(`skinId`): `void`

Defined in: [handles/unit.ts:794](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L794)

The rawcode of the unit type whose model, scale and sounds the unit uses,
such as the Knight's, `FourCC("hkni")`; a change removes every effect
attached to the unit.

##### Native

[BlzSetUnitSkin](/typings/3.0.0/functions/BlzSetUnitSkin) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzSetUnitSkin))

##### Parameters

###### skinId

`Rawcode`\<`"unit"`\>

##### Returns

`void`

***

### sleeping

#### Get Signature

> **get** **sleeping**(): `boolean`

Defined in: [handles/unit.ts:829](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L829)

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

Defined in: [handles/unit.ts:838](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L838)

Gets the hero's strength without the bonuses of items and buffs.

##### Native

[GetHeroStr](/typings/3.0.0/functions/GetHeroStr) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetHeroStr))

##### Returns

`number`

The base strength; 0 for a unit that is not a hero.

#### Set Signature

> **set** **strength**(`value`): `void`

Defined in: [handles/unit.ts:847](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L847)

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

Defined in: [handles/unit.ts:867](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L867)

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

Defined in: [handles/unit.ts:856](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L856)

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

> **get** **typeId**(): `Rawcode`\<`"unit"`\>

Defined in: [handles/unit.ts:876](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L876)

Gets the rawcode of the unit's type.

##### Native

[GetUnitTypeId](/typings/3.0.0/functions/GetUnitTypeId) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetUnitTypeId))

##### Returns

`Rawcode`\<`"unit"`\>

The rawcode, such as the Footman's, `FourCC("hfoo")`.

***

### userData

#### Get Signature

> **get** **userData**(): `number`

Defined in: [handles/unit.ts:885](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L885)

Gets the custom integer stored on the unit.

##### Native

[GetUnitUserData](/typings/3.0.0/functions/GetUnitUserData) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetUnitUserData))

##### Returns

`number`

The value, 0 until one is set.

#### Set Signature

> **set** **userData**(`value`): `void`

Defined in: [handles/unit.ts:894](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L894)

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

Defined in: [handles/unit.ts:911](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L911)

Gets whether the unit works as a waygate.

##### Native

[WaygateIsActive](/typings/3.0.0/functions/WaygateIsActive) ([jassbot](https://lep.duckdns.org/jassbot/doc/WaygateIsActive))

##### Returns

`boolean`

True when the unit has the Waygate ability and is activated.

#### Set Signature

> **set** **waygateActive**(`flag`): `void`

Defined in: [handles/unit.ts:902](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L902)

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

Defined in: [handles/unit.ts:922](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L922)

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

Defined in: [handles/unit.ts:934](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L934)

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

Defined in: [handles/unit.ts:945](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L945)

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

Defined in: [handles/unit.ts:957](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L957)

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

Defined in: [handles/unit.ts:972](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L972)

**`Async`**

Gets the height of the unit's position: the ground, water or walkable
destructable below it plus the unit's own height.

##### Remarks

The value can differ between clients: never let it decide game state.

##### Example

**Placing visuals from local heights**

```ts
// A halo over a flying unit and a shadow on the ground below it, placed from
// heights and positions as each client sees them. The terrain height, a
// unit's height and where an effect is drawn can differ between clients, so
// they place visuals only: game logic reads positions every client shares,
// such as the unit's x and y.
import { Effect, Init, Point, Timer, tsGlobals, Unit } from "reforged-ts";

Init.onGameStart(() => {
  const gryphon = Unit.create(tsGlobals.Players[0], FourCC("hgry"), 0, 0);
  const halo = Effect.create(
    "Abilities\\Spells\\Human\\InnerFire\\InnerFireTarget.mdl",
    0,
    0,
  );
  const shadow = Effect.create(
    "Abilities\\Spells\\Undead\\RegenerationAura\\ObsidianRegenAura.mdl",
    0,
    0,
  );
  const ground = Point.create(0, 0);

  Timer.every(0.03, () => {
    ground.setPosition(gryphon.x, gryphon.y);
    // `localZ` reads the same height as `z` today.
    halo.setPosition(gryphon.x, gryphon.y, gryphon.localZ + 100);
    halo.setAlpha(gryphon.z - ground.z < 50 ? 0 : 255);
    // The shadow lies on the terrain under the halo and shrinks as it rises.
    shadow.setPosition(halo.x, halo.y, ground.z);
    shadow.scale = Math.max(0.2, 1 - (halo.z - ground.z) / 1000);
  });
});
```

##### Native

[BlzGetUnitZ](/typings/3.0.0/functions/BlzGetUnitZ) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzGetUnitZ))

##### Returns

`number`

The height, in world units.

## Methods

### addAbility()

> **addAbility**(`abilityId`): `boolean`

Defined in: [handles/unit.ts:982](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L982)

Adds an ability to the unit, at level 1 and off cooldown.

#### Parameters

##### abilityId

`Rawcode`\<`"ability"`\>

The ability's rawcode, such as Blizzard's, `FourCC("AHbz")`.

#### Returns

`boolean`

True when the ability was added, false when the unit already has it.

#### Native

[UnitAddAbility](/typings/3.0.0/functions/UnitAddAbility) ([jassbot](https://lep.duckdns.org/jassbot/doc/UnitAddAbility))

***

### addAnimationProps()

> **addAnimationProps**(`animProperties`, `add`): `void`

Defined in: [handles/unit.ts:1019](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L1019)

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

Defined in: [handles/unit.ts:1035](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L1035)

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

Defined in: [handles/unit.ts:1047](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L1047)

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

Defined in: [handles/unit.ts:1063](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L1063)

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

Defined in: [handles/unit.ts:1093](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L1093)

Creates an item of a type at the unit's position and puts it in the
unit's inventory.

#### Parameters

##### itemId

`Rawcode`\<`"item"`\>

The item type's rawcode, such as Ring of Protection +2's,
`FourCC("rde1")`.

#### Returns

[`Item`](Item.md)

The new item.

#### Remarks

- When the inventory is full, the unit cannot carry items or it is dead,
  the item stays on the ground at the unit's position (for a unit loaded
  into a zeppelin, where it boarded, as `x` and `y` read) and is returned
  all the same.
- `hasItem` is false for the returned item in that case, and also when
  the game used it at once (a powerup such as a tome) or merged its
  charges into an item the unit holds: the item is then removed.
- `UnitAddItemById` is not used: it returns nothing for the item it
  drops.

#### Throws

When no item is created, for example for an unknown rawcode or a
removed unit: `reforged-ts: failed to create Item (<rawcode>)`, at the
calling line. In Dev mode, also before the globals Init stage and inside
`MapPlayer.runLocal`.

#### Native

[GetUnitTypeId](/typings/3.0.0/functions/GetUnitTypeId) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetUnitTypeId))

#### Native

[GetUnitX](/typings/3.0.0/functions/GetUnitX) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetUnitX))

#### Native

[GetUnitY](/typings/3.0.0/functions/GetUnitY) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetUnitY))

#### Native

[CreateItem](/typings/3.0.0/functions/CreateItem) ([jassbot](https://lep.duckdns.org/jassbot/doc/CreateItem))

#### Native

[UnitAddItem](/typings/3.0.0/functions/UnitAddItem) ([jassbot](https://lep.duckdns.org/jassbot/doc/UnitAddItem))

***

### addItemToSlotById()

> **addItemToSlotById**(`itemId`, `itemSlot`): `boolean`

Defined in: [handles/unit.ts:1113](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L1113)

Creates an item of a type in one slot of the unit's inventory.

#### Parameters

##### itemId

`Rawcode`\<`"item"`\>

The item type's rawcode, such as Ring of Protection +2's,
`FourCC("rde1")`.

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

Defined in: [handles/unit.ts:1125](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L1125)

Adds an item type to the stock of the shop.

#### Parameters

##### itemId

`Rawcode`\<`"item"`\>

The item type's rawcode, such as Claws of Attack +15's,
`FourCC("ratf")`.

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

Defined in: [handles/unit.ts:1140](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L1140)

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

Defined in: [handles/unit.ts:1149](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L1149)

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

Defined in: [handles/unit.ts:1159](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L1159)

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

Defined in: [handles/unit.ts:1170](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L1170)

Adds a unit type to the stock of the shop.

#### Parameters

##### unitId

`Rawcode`\<`"unit"`\>

The unit type's rawcode, such as the Footman's, `FourCC("hfoo")`.

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

Defined in: [handles/unit.ts:992](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L992)

Adjusts the remaining cooldown of one of the unit's abilities by a share of its full cooldown.

#### Parameters

##### abilId

`Rawcode`\<`"ability"`\>

The ability's rawcode, such as Blizzard's, `FourCC("AHbz")`.

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

Defined in: [handles/unit.ts:1005](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L1005)

Adjusts the remaining cooldown of one of the unit's abilities by a number of seconds.

#### Parameters

##### abilId

`Rawcode`\<`"ability"`\>

The ability's rawcode, such as Blizzard's, `FourCC("AHbz")`.

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

Defined in: [handles/unit.ts:1184](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L1184)

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

Defined in: [handles/unit.ts:1200](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L1200)

Gives the unit a timed life: it dies once the duration has passed, and its
interface shows the time left.

#### Parameters

##### buffId

`Rawcode`\<`"buff"`\>

The timed-life buff's rawcode, such as Timed Life's,
`FourCC("BTLF")`, the generic one; an unknown buff falls back to it.

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

Defined in: [handles/unit.ts:1209](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L1209)

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

Defined in: [handles/unit.ts:1219](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L1219)

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

Defined in: [handles/unit.ts:1227](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L1227)

Removes the unit's timed life, which kills it; does nothing to a unit without one.

#### Returns

`void`

#### Native

[BlzUnitCancelTimedLife](/typings/3.0.0/functions/BlzUnitCancelTimedLife) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzUnitCancelTimedLife))

***

### canEquip()

> **canEquip**(`equipmentType`): `boolean`

Defined in: [handles/unit.ts:1238](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L1238)

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

Defined in: [handles/unit.ts:1250](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L1250)

Checks whether the unit sleeps at all times, by day as well as at night.

#### Returns

`boolean`

True when the unit sleeps at all times.

#### Native

[UnitCanSleepPerm](/typings/3.0.0/functions/UnitCanSleepPerm) ([jassbot](https://lep.duckdns.org/jassbot/doc/UnitCanSleepPerm))

***

### clearOrders()

> **clearOrders**(`onlyQueued`): `void`

Defined in: [handles/unit.ts:3340](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L3340)

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

Defined in: [handles/unit.ts:1271](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L1271)

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

Defined in: [handles/unit.ts:3357](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L3357)

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

Defined in: [handles/unit.ts:1308](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L1308)

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

Defined in: [handles/unit.ts:1365](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L1365)

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

Defined in: [handles/unit.ts:1396](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L1396)

Lowers one of the unit's abilities by one level, down to level 1 at
least.

#### Parameters

##### abilCode

`Rawcode`\<`"ability"`\>

The ability's rawcode, such as Blizzard's, `FourCC("AHbz")`.

#### Returns

`number`

The new ability level.

#### Native

[DecUnitAbilityLevel](/typings/3.0.0/functions/DecUnitAbilityLevel) ([jassbot](https://lep.duckdns.org/jassbot/doc/DecUnitAbilityLevel))

***

### destroy()

> **destroy**(): `void`

Defined in: [handles/unit.ts:1413](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L1413)

Instantly removes the unit from the game.

#### Returns

`void`

#### Remarks

In Dev mode the destroyed Wrapper becomes a tombstone: any later access,
a second `destroy()` included, raises
`reforged-ts: used after destroy: <Class>#<id>`, and
`Reforged.debug.report()` counts it destroyed.

#### Example

**Removing game objects without a death**

```ts
// Removing a unit, an item or a destructable from the game at once with
// destroy(), where kill() would let it die. A destroyed unit fires no death
// event, leaves no corpse and gives no bounty, so call destroy() for what
// must vanish without a trace, such as a dummy unit or a used token.
// Every reference to it is dead afterwards: remove it from the maps and
// groups that hold it, since in Dev mode any use of a destroyed Wrapper
// raises `reforged-ts: used after destroy: <Class>#<id>`.
import {
  Destructable,
  HandleMap,
  Init,
  Item,
  tsGlobals,
  Unit,
} from "reforged-ts";

/** The token each hero carries, while it carries one. */
const tokens = new HandleMap<Unit, Item>();

/** Spends `hero`'s token: the item vanishes and the entry goes with it. */
export function spendToken(hero: Unit): void {
  const token = tokens.get(hero);
  if (token === undefined) {
    return;
  }
  tokens.delete(hero);
  token.destroy();
}

Init.onTriggers(() => {
  const owner = tsGlobals.Players[0];
  const hero = Unit.create(owner, FourCC("Hpal"), 0, 0);
  const token = Item.create(FourCC("ratf"), 64, 0);
  hero.addItem(token);
  tokens.set(hero, token);
  spendToken(hero);

  // A dummy unit, removed once its work is done: no death, no corpse.
  const dummy = Unit.create(owner, FourCC("hfoo"), 128, 0);
  dummy.destroy();

  // A gate removed when opened, rather than left as a broken one.
  const gate = Destructable.create({ typeId: FourCC("LTg1"), x: 256, y: 0 });
  gate.destroy();
});
```

#### Throws

In Dev mode, inside `MapPlayer.runLocal`:
`reforged-ts: destroying Unit#<id> inside MapPlayer.runLocal changes game state for one client, which desyncs the game: only visuals belong inside runLocal`

#### Native

[RemoveUnit](/typings/3.0.0/functions/RemoveUnit) ([jassbot](https://lep.duckdns.org/jassbot/doc/RemoveUnit))

***

### disableAbility()

> **disableAbility**(`abilId`, `flag`, `hideUI`): `void`

Defined in: [handles/unit.ts:1430](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L1430)

Disables or enables one of the unit's abilities, and hides or shows its icon.

#### Parameters

##### abilId

`Rawcode`\<`"ability"`\>

The ability's rawcode, such as Blizzard's, `FourCC("AHbz")`.

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

Defined in: [handles/unit.ts:1448](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L1448)

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

### dropItemTarget()

> **dropItemTarget**(`whichItem`, `target`): `boolean`

Defined in: [handles/unit.ts:1462](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L1462)

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

Defined in: [handles/unit.ts:1475](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L1475)

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

Defined in: [handles/unit.ts:1484](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L1484)

Ends the cooldown of one of the unit's abilities at once.

#### Parameters

##### abilCode

`Rawcode`\<`"ability"`\>

The ability's rawcode, such as Blizzard's, `FourCC("AHbz")`.

#### Returns

`void`

#### Native

[BlzEndUnitAbilityCooldown](/typings/3.0.0/functions/BlzEndUnitAbilityCooldown) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzEndUnitAbilityCooldown))

***

### equip()

> **equip**(`whichItem`): `boolean`

Defined in: [handles/unit.ts:1494](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L1494)

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

Defined in: [handles/unit.ts:1505](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L1505)

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

Defined in: [handles/unit.ts:3383](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L3383)

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

Defined in: [handles/unit.ts:1517](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L1517)

Gets the unit's instance of an ability, for the ability Natives.

#### Parameters

##### abilId

`Rawcode`\<`"ability"`\>

The ability's rawcode, such as Blizzard's, `FourCC("AHbz")`.

#### Returns

`ability` \| `undefined`

The game's `ability` Handle, or `undefined` when the unit lacks the ability.

#### Native

[BlzGetUnitAbility](/typings/3.0.0/functions/BlzGetUnitAbility) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzGetUnitAbility))

***

### getAbilityByIndex()

> **getAbilityByIndex**(`index`): `ability` \| `undefined`

Defined in: [handles/unit.ts:1527](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L1527)

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

Defined in: [handles/unit.ts:1538](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L1538)

Gets the full cooldown of one of the unit's abilities at a level, not the time remaining.

#### Parameters

##### abilId

`Rawcode`\<`"ability"`\>

The ability's rawcode, such as Blizzard's, `FourCC("AHbz")`.

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

Defined in: [handles/unit.ts:1548](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L1548)

Gets the remaining cooldown of one of the unit's abilities as a share of its full cooldown.

#### Parameters

##### abilId

`Rawcode`\<`"ability"`\>

The ability's rawcode, such as Blizzard's, `FourCC("AHbz")`.

#### Returns

`number`

The share of the cooldown left.

#### Native

[BlzGetUnitAbilityCooldownPercent](/typings/3.0.0/functions/BlzGetUnitAbilityCooldownPercent) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzGetUnitAbilityCooldownPercent))

***

### getAbilityCooldownRemaining()

> **getAbilityCooldownRemaining**(`abilId`): `number`

Defined in: [handles/unit.ts:1560](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L1560)

Gets the remaining cooldown of one of the unit's abilities.

#### Parameters

##### abilId

`Rawcode`\<`"ability"`\>

The ability's rawcode, such as Blizzard's, `FourCC("AHbz")`.

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

Defined in: [handles/unit.ts:1571](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L1571)

Gets the level the unit has in one of its abilities.

#### Parameters

##### abilCode

`Rawcode`\<`"ability"`\>

The ability's rawcode, such as Blizzard's, `FourCC("AHbz")`.

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

Defined in: [handles/unit.ts:1582](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L1582)

Gets the mana cost of one of the unit's abilities at a level.

#### Parameters

##### abilId

`Rawcode`\<`"ability"`\>

The ability's rawcode, such as Blizzard's, `FourCC("AHbz")`.

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

Defined in: [handles/unit.ts:1592](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L1592)

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

Defined in: [handles/unit.ts:1603](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L1603)

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

Defined in: [handles/unit.ts:1617](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L1617)

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

Defined in: [handles/unit.ts:1627](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L1627)

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

Defined in: [handles/unit.ts:1637](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L1637)

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

Defined in: [handles/unit.ts:1647](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L1647)

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

Defined in: [handles/unit.ts:1663](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L1663)

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

### getFlyHeight()

> **getFlyHeight**(): `number`

Defined in: [handles/unit.ts:1702](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L1702)

Gets the unit's flying height above the ground.

#### Returns

`number`

The height, in world units.

#### Remarks

In w3ts 3.x it was named `getflyHeight`, with a lowercase `f`.

#### Native

[GetUnitFlyHeight](/typings/3.0.0/functions/GetUnitFlyHeight) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetUnitFlyHeight))

***

### getHeroLevel()

> **getHeroLevel**(): `number`

Defined in: [handles/unit.ts:1711](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L1711)

Gets the hero's level.

#### Returns

`number`

The level; 0 for a unit that is not a hero.

#### Native

[GetHeroLevel](/typings/3.0.0/functions/GetHeroLevel) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetHeroLevel))

***

### getIntelligence()

> **getIntelligence**(`includeBonuses`): `number`

Defined in: [handles/unit.ts:1721](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L1721)

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

Defined in: [handles/unit.ts:1731](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L1731)

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

Defined in: [handles/unit.ts:3017](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L3017)

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

Defined in: [handles/unit.ts:3040](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L3040)

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

Defined in: [handles/unit.ts:1742](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L1742)

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

Defined in: [handles/unit.ts:1752](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L1752)

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

Defined in: [handles/unit.ts:3400](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L3400)

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

Defined in: [handles/unit.ts:1763](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L1763)

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

Defined in: [handles/unit.ts:1773](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L1773)

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

Defined in: [handles/unit.ts:1793](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L1793)

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

Defined in: [handles/unit.ts:1821](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L1821)

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

Defined in: [handles/unit.ts:1832](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L1832)

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

Defined in: [handles/unit.ts:1845](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L1845)

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

Defined in: [handles/unit.ts:1855](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L1855)

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

Defined in: [handles/unit.ts:1867](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L1867)

Hides or shows the icon of one of the unit's abilities.

#### Parameters

##### abilId

`Rawcode`\<`"ability"`\>

The ability's rawcode, such as Blizzard's, `FourCC("AHbz")`.

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

Defined in: [handles/unit.ts:1881](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L1881)

Raises one of the unit's abilities by one level.

#### Parameters

##### abilCode

`Rawcode`\<`"ability"`\>

The ability's rawcode, such as Blizzard's, `FourCC("AHbz")`.

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

Defined in: [handles/unit.ts:1891](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L1891)

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

Defined in: [handles/unit.ts:1901](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L1901)

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

Defined in: [handles/unit.ts:1913](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L1913)

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

Defined in: [handles/unit.ts:1924](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L1924)

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

Defined in: [handles/unit.ts:1935](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L1935)

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

Defined in: [handles/unit.ts:1943](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L1943)

Interrupts the attack the unit is winding up.

#### Returns

`void`

#### Native

[BlzUnitInterruptAttack](/typings/3.0.0/functions/BlzUnitInterruptAttack) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzUnitInterruptAttack))

***

### inTransport()

> **inTransport**(`whichTransport`): `boolean`

Defined in: [handles/unit.ts:1954](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L1954)

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

Defined in: [handles/unit.ts:1963](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L1963)

Checks whether the unit is alive.

#### Returns

`boolean`

True when the unit is alive; false once it died or was removed.

#### Native

[UnitAlive](/typings/3.0.0/functions/UnitAlive) ([jassbot](https://lep.duckdns.org/jassbot/doc/UnitAlive))

***

### isAlly()

> **isAlly**(`whichPlayer`): `boolean`

Defined in: [handles/unit.ts:1973](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L1973)

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

Defined in: [handles/unit.ts:3446](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L3446)

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

Defined in: [handles/unit.ts:1983](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L1983)

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

Defined in: [handles/unit.ts:1992](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L1992)

Checks whether the hero gains no experience, as `suspendExperience` sets.

#### Returns

`boolean`

True when the hero's experience is suspended.

#### Native

[IsSuspendedXP](/typings/3.0.0/functions/IsSuspendedXP) ([jassbot](https://lep.duckdns.org/jassbot/doc/IsSuspendedXP))

***

### isFogged()

> **isFogged**(`whichPlayer`): `boolean`

Defined in: [handles/unit.ts:2002](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L2002)

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

Defined in: [handles/unit.ts:2012](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L2012)

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

Defined in: [handles/unit.ts:2021](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L2021)

Checks whether the unit is an illusion.

#### Returns

`boolean`

True when the unit is an illusion.

#### Native

[IsUnitIllusion](/typings/3.0.0/functions/IsUnitIllusion) ([jassbot](https://lep.duckdns.org/jassbot/doc/IsUnitIllusion))

***

### isInvisible()

> **isInvisible**(`whichPlayer`): `boolean`

Defined in: [handles/unit.ts:3456](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L3456)

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

Defined in: [handles/unit.ts:2030](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L2030)

Checks whether the unit is loaded into a transport.

#### Returns

`boolean`

True when the unit is loaded.

#### Native

[IsUnitLoaded](/typings/3.0.0/functions/IsUnitLoaded) ([jassbot](https://lep.duckdns.org/jassbot/doc/IsUnitLoaded))

***

### isMasked()

> **isMasked**(`whichPlayer`): `boolean`

Defined in: [handles/unit.ts:2041](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L2041)

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

Defined in: [handles/unit.ts:3466](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L3466)

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

Defined in: [handles/unit.ts:3476](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L3476)

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

Defined in: [handles/unit.ts:2051](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L2051)

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

Defined in: [handles/unit.ts:2067](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L2067)

Orders the unit to build a structure at a point.

#### Parameters

##### unit

`string` \| `Rawcode`\<`"unit"`\>

The structure's order name, or its unit type's rawcode, such
as the Barracks', `FourCC("hbar")`.

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

Defined in: [handles/unit.ts:2080](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L2080)

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

Defined in: [handles/unit.ts:2096](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L2096)

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

Defined in: [handles/unit.ts:2128](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L2128)

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

> **issueNeutralImmediateOrder**(`forPlayer`, `bought`): `boolean`

Defined in: [handles/unit.ts:2158](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L2158)

Orders this neutral structure (a shop, a tavern) to sell or train
`bought` for `forPlayer`.

#### Parameters

##### forPlayer

[`MapPlayer`](MapPlayer.md)

The player who buys.

##### bought

`string` \| `Rawcode`\<`ObjectKind`\>

The order name of what is bought, or its rawcode, such as
the Gnoll's, `FourCC("ngno")`, bought from a mercenary camp.

#### Returns

`boolean`

True when the structure took the order.

#### Native

[IssueNeutralImmediateOrder](/typings/3.0.0/functions/IssueNeutralImmediateOrder) ([jassbot](https://lep.duckdns.org/jassbot/doc/IssueNeutralImmediateOrder))

#### Native

[IssueNeutralImmediateOrderById](/typings/3.0.0/functions/IssueNeutralImmediateOrderById) ([jassbot](https://lep.duckdns.org/jassbot/doc/IssueNeutralImmediateOrderById))

***

### issueNeutralPointOrder()

> **issueNeutralPointOrder**(`forPlayer`, `order`, `x`, `y`): `boolean`

Defined in: [handles/unit.ts:2177](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L2177)

Orders this neutral structure to use `order` for `forPlayer` at a point.

#### Parameters

##### forPlayer

[`MapPlayer`](MapPlayer.md)

The player the structure acts for.

##### order

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

> **issueNeutralTargetOrder**(`forPlayer`, `order`, `target`): `boolean`

Defined in: [handles/unit.ts:2197](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L2197)

Orders this neutral structure to use `order` for `forPlayer` on `target`.

#### Parameters

##### forPlayer

[`MapPlayer`](MapPlayer.md)

The player the structure acts for.

##### order

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

Defined in: [handles/unit.ts:2227](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L2227)

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

Defined in: [handles/unit.ts:2242](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L2242)

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

Defined in: [handles/unit.ts:2256](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L2256)

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

Defined in: [handles/unit.ts:2269](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L2269)

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

Defined in: [handles/unit.ts:2285](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L2285)

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

Defined in: [handles/unit.ts:2295](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L2295)

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

Defined in: [handles/unit.ts:2304](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L2304)

Kills the unit with no killer: it plays its death animation and fires the
death events, as a unit killed in combat does.

#### Returns

`void`

#### Native

[KillUnit](/typings/3.0.0/functions/KillUnit) ([jassbot](https://lep.duckdns.org/jassbot/doc/KillUnit))

***

### lookAt()

> **lookAt**(`whichBone`, `lookAtTarget`, `offsetX`, `offsetY`, `offsetZ`): `void`

Defined in: [handles/unit.ts:2334](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L2334)

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

Defined in: [handles/unit.ts:2358](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L2358)

Makes one of the unit's abilities survive a morph, or lets a morph
remove it.

#### Parameters

##### permanent

`boolean`

True to keep the ability through a morph, false to let the morph remove it.

##### abilityId

`Rawcode`\<`"ability"`\>

The ability's rawcode, such as Blizzard's, `FourCC("AHbz")`.

#### Returns

`void`

#### Native

[UnitMakeAbilityPermanent](/typings/3.0.0/functions/UnitMakeAbilityPermanent) ([jassbot](https://lep.duckdns.org/jassbot/doc/UnitMakeAbilityPermanent))

***

### modifySkillPoints()

> **modifySkillPoints**(`skillPointDelta`): `boolean`

Defined in: [handles/unit.ts:2374](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L2374)

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

### moveItemToSlot()

> **moveItemToSlot**(`whichItem`, `slot`): `boolean`

Defined in: [handles/unit.ts:2389](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L2389)

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

#### Remarks

In w3ts 3.x it was named `dropItemFromSlot`, though it drops nothing on the
ground; it takes the same arguments.

#### Native

[UnitDropItemSlot](/typings/3.0.0/functions/UnitDropItemSlot) ([jassbot](https://lep.duckdns.org/jassbot/doc/UnitDropItemSlot))

***

### pauseEx()

> **pauseEx**(`flag`): `void`

Defined in: [handles/unit.ts:2399](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L2399)

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

Defined in: [handles/unit.ts:2408](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L2408)

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

Defined in: [handles/unit.ts:2417](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L2417)

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

Defined in: [handles/unit.ts:3491](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L3491)

Queues an order to build a structure at a point, after the unit's current orders.

#### Parameters

##### unitId

`Rawcode`\<`"unit"`\>

The structure's unit type rawcode, such as the Barracks',
`FourCC("hbar")`.

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

Defined in: [handles/unit.ts:3501](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L3501)

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

Defined in: [handles/unit.ts:3514](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L3514)

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

Defined in: [handles/unit.ts:3538](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L3538)

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

> **queueNeutralImmediateOrder**(`forPlayer`, `bought`): `boolean`

Defined in: [handles/unit.ts:2430](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L2430)

Queues an order on this neutral structure to sell or train `bought` for
`forPlayer`, after its current orders.

#### Parameters

##### forPlayer

[`MapPlayer`](MapPlayer.md)

The player who buys.

##### bought

`Rawcode`

The rawcode of what is bought, such as the Gnoll's,
`FourCC("ngno")`, bought from a mercenary camp.

#### Returns

`boolean`

True when the structure took the order.

#### Native

[BlzQueueNeutralImmediateOrderById](/typings/3.0.0/functions/BlzQueueNeutralImmediateOrderById) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzQueueNeutralImmediateOrderById))

***

### queueNeutralPointOrder()

> **queueNeutralPointOrder**(`forPlayer`, `orderId`, `x`, `y`): `boolean`

Defined in: [handles/unit.ts:2448](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L2448)

Queues an order on this neutral structure to use `orderId` for
`forPlayer` at a point, after its current orders.

#### Parameters

##### forPlayer

[`MapPlayer`](MapPlayer.md)

The player the structure acts for.

##### orderId

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

> **queueNeutralTargetOrder**(`forPlayer`, `orderId`, `target`): `boolean`

Defined in: [handles/unit.ts:2472](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L2472)

Queues an order on this neutral structure to use `orderId` for
`forPlayer` on `target`, after its current orders.

#### Parameters

##### forPlayer

[`MapPlayer`](MapPlayer.md)

The player the structure acts for.

##### orderId

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

Defined in: [handles/unit.ts:3560](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L3560)

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

Defined in: [handles/unit.ts:3571](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L3571)

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

Defined in: [handles/unit.ts:2489](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L2489)

Releases the unit's guard position, the spot the computer player's AI keeps it at, for the AI to reuse.

#### Returns

`void`

#### Native

[RecycleGuardPosition](/typings/3.0.0/functions/RecycleGuardPosition) ([jassbot](https://lep.duckdns.org/jassbot/doc/RecycleGuardPosition))

***

### removeAbility()

> **removeAbility**(`abilityId`): `boolean`

Defined in: [handles/unit.ts:2499](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L2499)

Removes an ability from the unit.

#### Parameters

##### abilityId

`Rawcode`\<`"ability"`\>

The ability's rawcode, such as Blizzard's, `FourCC("AHbz")`.

#### Returns

`boolean`

True when the ability was removed, false when the unit lacks it.

#### Native

[UnitRemoveAbility](/typings/3.0.0/functions/UnitRemoveAbility) ([jassbot](https://lep.duckdns.org/jassbot/doc/UnitRemoveAbility))

***

### removeBuffs()

> **removeBuffs**(`removePositive`, `removeNegative`): `void`

Defined in: [handles/unit.ts:2509](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L2509)

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

Defined in: [handles/unit.ts:2528](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L2528)

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

Defined in: [handles/unit.ts:2553](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L2553)

Makes the computer player's AI ignore the unit's guard position, the spot the unit returns to.

#### Returns

`void`

#### Native

[RemoveGuardPosition](/typings/3.0.0/functions/RemoveGuardPosition) ([jassbot](https://lep.duckdns.org/jassbot/doc/RemoveGuardPosition))

***

### removeItem()

> **removeItem**(`whichItem`): `void`

Defined in: [handles/unit.ts:2562](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L2562)

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

Defined in: [handles/unit.ts:2573](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L2573)

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

Defined in: [handles/unit.ts:2583](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L2583)

Removes an item type from the stock of the shop.

#### Parameters

##### itemId

`Rawcode`\<`"item"`\>

The item type's rawcode, such as Claws of Attack +15's,
`FourCC("ratf")`.

#### Returns

`void`

#### Native

[RemoveItemFromStock](/typings/3.0.0/functions/RemoveItemFromStock) ([jassbot](https://lep.duckdns.org/jassbot/doc/RemoveItemFromStock))

***

### removeType()

> **removeType**(`whichUnitType`): `boolean`

Defined in: [handles/unit.ts:2593](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L2593)

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

> **removeUnitFromStock**(`unitId`): `void`

Defined in: [handles/unit.ts:2603](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L2603)

Removes a unit type from the stock of the shop.

#### Parameters

##### unitId

`Rawcode`\<`"unit"`\>

The rawcode of the unit type to remove, such as the
Footman's, `FourCC("hfoo")`.

#### Returns

`void`

#### Native

[RemoveUnitFromStock](/typings/3.0.0/functions/RemoveUnitFromStock) ([jassbot](https://lep.duckdns.org/jassbot/doc/RemoveUnitFromStock))

***

### resetAttack()

> **resetAttack**(`weaponIndex`): `void`

Defined in: [handles/unit.ts:2612](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L2612)

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

Defined in: [handles/unit.ts:2620](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L2620)

Ends the cooldowns of all of the unit's abilities.

#### Returns

`void`

#### Native

[UnitResetCooldown](/typings/3.0.0/functions/UnitResetCooldown) ([jassbot](https://lep.duckdns.org/jassbot/doc/UnitResetCooldown))

***

### resetLookAt()

> **resetLookAt**(): `void`

Defined in: [handles/unit.ts:2629](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L2629)

Releases the bone that `lookAt` turned, so that the unit's animations
move it again.

#### Returns

`void`

#### Native

[ResetUnitLookAt](/typings/3.0.0/functions/ResetUnitLookAt) ([jassbot](https://lep.duckdns.org/jassbot/doc/ResetUnitLookAt))

***

### revive()

> **revive**(`x`, `y`, `doEyecandy`): `boolean`

Defined in: [handles/unit.ts:2643](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L2643)

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

Defined in: [handles/unit.ts:2656](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L2656)

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

Defined in: [handles/unit.ts:2666](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L2666)

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

Defined in: [handles/unit.ts:2676](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L2676)

Spends one of the hero's skill points to learn or level an ability; does
nothing when the hero has no point or cannot learn it yet.

#### Parameters

##### abilCode

`Rawcode`\<`"ability"`\>

The ability's rawcode, such as Blizzard's, `FourCC("AHbz")`.

#### Returns

`void`

#### Native

[SelectHeroSkill](/typings/3.0.0/functions/SelectHeroSkill) ([jassbot](https://lep.duckdns.org/jassbot/doc/SelectHeroSkill))

***

### setAbilityCooldown()

> **setAbilityCooldown**(`abilId`, `level`, `cooldown`): `void`

Defined in: [handles/unit.ts:2689](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L2689)

Sets the full cooldown of one of the unit's abilities at a level.

#### Parameters

##### abilId

`Rawcode`\<`"ability"`\>

The ability's rawcode, such as Blizzard's, `FourCC("AHbz")`.

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

Defined in: [handles/unit.ts:2703](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L2703)

Sets the remaining cooldown of one of the unit's abilities as a share of its full cooldown.

#### Parameters

##### abilId

`Rawcode`\<`"ability"`\>

The ability's rawcode, such as Blizzard's, `FourCC("AHbz")`.

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

Defined in: [handles/unit.ts:2716](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L2716)

Sets the remaining cooldown of one of the unit's abilities.

#### Parameters

##### abilId

`Rawcode`\<`"ability"`\>

The ability's rawcode, such as Blizzard's, `FourCC("AHbz")`.

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

Defined in: [handles/unit.ts:2732](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L2732)

Sets the level of an ability the unit has, without spending or refunding skill points.

#### Parameters

##### abilCode

`Rawcode`\<`"ability"`\>

The ability's rawcode, such as Blizzard's, `FourCC("AHbz")`.

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

Defined in: [handles/unit.ts:2744](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L2744)

Sets the mana cost of one of the unit's abilities at a level.

#### Parameters

##### abilId

`Rawcode`\<`"ability"`\>

The ability's rawcode, such as Blizzard's, `FourCC("AHbz")`.

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

Defined in: [handles/unit.ts:2759](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L2759)

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

Defined in: [handles/unit.ts:2770](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L2770)

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

Defined in: [handles/unit.ts:2784](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L2784)

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

Defined in: [handles/unit.ts:2796](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L2796)

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

#### Remarks

w3ts 3.x also had `setUnitAttackCooldown`, a duplicate of this member.

#### Native

[BlzSetUnitAttackCooldown](/typings/3.0.0/functions/BlzSetUnitAttackCooldown) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzSetUnitAttackCooldown))

***

### setBaseDamage()

> **setBaseDamage**(`baseDamage`, `weaponIndex`): `void`

Defined in: [handles/unit.ts:2806](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L2806)

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

Defined in: [handles/unit.ts:2815](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L2815)

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

Defined in: [handles/unit.ts:2824](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L2824)

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

Defined in: [handles/unit.ts:2833](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L2833)

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

Defined in: [handles/unit.ts:2844](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L2844)

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

Defined in: [handles/unit.ts:2855](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L2855)

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

Defined in: [handles/unit.ts:2866](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L2866)

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

Defined in: [handles/unit.ts:2875](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L2875)

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

Defined in: [handles/unit.ts:2884](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L2884)

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

Defined in: [handles/unit.ts:3584](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L3584)

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

Defined in: [handles/unit.ts:2901](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L2901)

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

### setFlyHeight()

> **setFlyHeight**(`value`, `rate`): `void`

Defined in: [handles/unit.ts:2945](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L2945)

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

#### Remarks

In w3ts 3.x it was named `setflyHeight`, with a lowercase `f`; it takes the
same arguments.

#### Native

[SetUnitFlyHeight](/typings/3.0.0/functions/SetUnitFlyHeight) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetUnitFlyHeight))

***

### setHeroLevel()

> **setHeroLevel**(`level`, `showEyeCandy`): `void`

Defined in: [handles/unit.ts:2957](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L2957)

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

### setIgnoreAlarm()

> **setIgnoreAlarm**(`flag`): `boolean`

Defined in: [handles/unit.ts:2971](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L2971)

Sets whether the unit raises no alarm, the "under attack" warning, when it is
attacked; `ignoreAlarmToggled` reads the setting.

#### Parameters

##### flag

`boolean`

True for no alarm, false for the usual one.

#### Returns

`boolean`

The boolean the game returns for the call.

#### Remarks

In w3ts 3.x it was named `getIgnoreAlarm`, though it changes the setting and
reads nothing; it takes the same argument.

#### Native

[UnitIgnoreAlarm](/typings/3.0.0/functions/UnitIgnoreAlarm) ([jassbot](https://lep.duckdns.org/jassbot/doc/UnitIgnoreAlarm))

***

### setIntelligence()

> **setIntelligence**(`value`, `permanent`): `void`

Defined in: [handles/unit.ts:2982](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L2982)

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

Defined in: [handles/unit.ts:2991](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L2991)

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

Defined in: [handles/unit.ts:3002](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L3002)

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

Defined in: [handles/unit.ts:3049](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L3049)

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

Defined in: [handles/unit.ts:3026](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L3026)

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

Defined in: [handles/unit.ts:3061](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L3061)

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

Defined in: [handles/unit.ts:3072](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L3072)

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

Defined in: [handles/unit.ts:3081](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L3081)

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

Defined in: [handles/unit.ts:3093](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L3093)

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

Defined in: [handles/unit.ts:3104](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L3104)

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

Defined in: [handles/unit.ts:3115](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L3115)

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

Defined in: [handles/unit.ts:3124](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L3124)

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

### setUnitTypeSlots()

> **setUnitTypeSlots**(`slots`): `void`

Defined in: [handles/unit.ts:3133](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L3133)

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

Defined in: [handles/unit.ts:3142](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L3142)

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

Defined in: [handles/unit.ts:3151](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L3151)

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

Defined in: [handles/unit.ts:3160](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L3160)

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

Defined in: [handles/unit.ts:3172](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L3172)

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

Defined in: [handles/unit.ts:3603](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L3603)

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

Defined in: [handles/unit.ts:3188](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L3188)

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

Defined in: [handles/unit.ts:3197](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L3197)

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

Defined in: [handles/unit.ts:3207](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L3207)

Starts the cooldown of one of the unit's abilities.

#### Parameters

##### abilCode

`Rawcode`\<`"ability"`\>

The ability's rawcode, such as Blizzard's, `FourCC("AHbz")`.

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

Defined in: [handles/unit.ts:3218](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L3218)

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

Defined in: [handles/unit.ts:3227](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L3227)

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

Defined in: [handles/unit.ts:3236](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L3236)

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

Defined in: [handles/unit.ts:3245](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L3245)

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

Defined in: [handles/unit.ts:3256](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L3256)

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

Defined in: [handles/unit.ts:3268](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L3268)

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

Defined in: [handles/unit.ts:3281](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L3281)

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

Defined in: [handles/unit.ts:3292](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L3292)

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

Defined in: [handles/unit.ts:3300](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L3300)

Wakes the unit up.

#### Returns

`void`

#### Native

[UnitWakeUp](/typings/3.0.0/functions/UnitWakeUp) ([jassbot](https://lep.duckdns.org/jassbot/doc/UnitWakeUp))

***

### waygateGetDestinationX()

> **waygateGetDestinationX**(): `number`

Defined in: [handles/unit.ts:3309](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L3309)

Gets the x-coordinate the waygate sends units to.

#### Returns

`number`

The x-coordinate, in world units; 0 for a unit without the Waygate ability.

#### Native

[WaygateGetDestinationX](/typings/3.0.0/functions/WaygateGetDestinationX) ([jassbot](https://lep.duckdns.org/jassbot/doc/WaygateGetDestinationX))

***

### waygateGetDestinationY()

> **waygateGetDestinationY**(): `number`

Defined in: [handles/unit.ts:3318](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L3318)

Gets the y-coordinate the waygate sends units to.

#### Returns

`number`

The y-coordinate, in world units; 0 for a unit without the Waygate ability.

#### Native

[WaygateGetDestinationY](/typings/3.0.0/functions/WaygateGetDestinationY) ([jassbot](https://lep.duckdns.org/jassbot/doc/WaygateGetDestinationY))

***

### waygateSetDestination()

> **waygateSetDestination**(`x`, `y`): `void`

Defined in: [handles/unit.ts:3331](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L3331)

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

Defined in: [handles/unit.ts:51](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L51)

Creates a unit for `owner` at the given point, facing `face`.

#### Parameters

##### owner

[`MapPlayer`](MapPlayer.md)

The player who owns the unit.

##### unitId

`Rawcode`\<`"unit"`\>

The unit type's rawcode, such as the Footman's,
`FourCC("hfoo")`.

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

`Rawcode`\<`"unit"`\>

The skin's rawcode, such as the Knight's, `FourCC("hkni")`;
the unit type's own model when left out.

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

Defined in: [handles/unit.ts:80](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L80)

Creates a unit for `owner` at a point, facing `face`.

#### Parameters

##### owner

[`MapPlayer`](MapPlayer.md)

The player who owns the unit.

##### unitId

`Rawcode`\<`"unit"`\>

The unit type's rawcode, such as the Footman's,
`FourCC("hfoo")`.

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

Defined in: [handles/unit.ts:104](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L104)

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

Defined in: [handles/unit.ts:131](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L131)

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

Defined in: [handles/unit.ts:153](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L153)

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

Defined in: [handles/unit.ts:184](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L184)

Creates the corpse of a unit type for `owner`.

#### Parameters

##### owner

[`MapPlayer`](MapPlayer.md)

The player who owns the corpse.

##### unitId

`Rawcode`\<`"unit"`\>

The unit type's rawcode, such as the Footman's,
`FourCC("hfoo")`.

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

Defined in: [handles/unit.ts:3656](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L3656)

Gets the food a unit type provides to its owner, such as a farm's.

#### Parameters

##### unitId

`Rawcode`\<`"unit"`\>

The unit type's rawcode, such as the Footman's, `FourCC("hfoo")`.

#### Returns

`number`

The food provided.

#### Native

[GetFoodMade](/typings/3.0.0/functions/GetFoodMade) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetFoodMade))

***

### foodUsedByType()

> `static` **foodUsedByType**(`unitId`): `number`

Defined in: [handles/unit.ts:3666](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L3666)

Gets the food a unit type costs its owner.

#### Parameters

##### unitId

`Rawcode`\<`"unit"`\>

The unit type's rawcode, such as the Footman's, `FourCC("hfoo")`.

#### Returns

`number`

The food used.

#### Native

[GetFoodUsed](/typings/3.0.0/functions/GetFoodUsed) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetFoodUsed))

***

### fromAttacker()

> `static` **fromAttacker**(): `Unit` \| `undefined`

Defined in: [handles/unit.ts:3675](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L3675)

Gets the attacking unit of an attacked event.

#### Returns

`Unit` \| `undefined`

The attacker, or `undefined` outside an attacked event.

#### Native

[GetAttacker](/typings/3.0.0/functions/GetAttacker) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetAttacker))

***

### fromBuying()

> `static` **fromBuying**(): `Unit` \| `undefined`

Defined in: [handles/unit.ts:3857](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L3857)

Gets the unit buying from a shop in a sell event.

#### Returns

`Unit` \| `undefined`

The buyer, or `undefined` outside a sell event.

#### Native

[GetBuyingUnit](/typings/3.0.0/functions/GetBuyingUnit) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetBuyingUnit))

***

### fromCancelled()

> `static` **fromCancelled**(): `Unit` \| `undefined`

Defined in: [handles/unit.ts:3866](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L3866)

Gets the structure whose construction is cancelled in a construction cancel event.

#### Returns

`Unit` \| `undefined`

The structure, or `undefined` outside a construction cancel.

#### Native

[GetCancelledStructure](/typings/3.0.0/functions/GetCancelledStructure) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetCancelledStructure))

***

### fromChanging()

> `static` **fromChanging**(): `Unit` \| `undefined`

Defined in: [handles/unit.ts:3684](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L3684)

Gets the unit changing owner in an ownership change event.

#### Returns

`Unit` \| `undefined`

The unit, or `undefined` outside an ownership change.

#### Native

[GetChangingUnit](/typings/3.0.0/functions/GetChangingUnit) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetChangingUnit))

***

### fromConstructed()

> `static` **fromConstructed**(): `Unit` \| `undefined`

Defined in: [handles/unit.ts:3693](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L3693)

Gets the finished structure of a construction finish event.

#### Returns

`Unit` \| `undefined`

The structure, or `undefined` outside a construction finish.

#### Native

[GetConstructedStructure](/typings/3.0.0/functions/GetConstructedStructure) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetConstructedStructure))

***

### fromConstructing()

> `static` **fromConstructing**(): `Unit` \| `undefined`

Defined in: [handles/unit.ts:3875](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L3875)

Gets the structure being built in a construction start event.

#### Returns

`Unit` \| `undefined`

The structure, or `undefined` outside a construction start.

#### Native

[GetConstructingStructure](/typings/3.0.0/functions/GetConstructingStructure) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetConstructingStructure))

***

### fromDamageSource()

> `static` **fromDamageSource**(): `Unit` \| `undefined`

Defined in: [handles/unit.ts:3702](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L3702)

Gets the unit dealing the damage in a damage event.

#### Returns

`Unit` \| `undefined`

The source, or `undefined` outside a damage event or when no unit deals the damage.

#### Native

[GetEventDamageSource](/typings/3.0.0/functions/GetEventDamageSource) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetEventDamageSource))

***

### fromDamageTarget()

> `static` **fromDamageTarget**(): `Unit` \| `undefined`

Defined in: [handles/unit.ts:3711](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L3711)

Gets the unit taking the damage in a damage event.

#### Returns

`Unit` \| `undefined`

The target, or `undefined` outside a damage event.

#### Native

[BlzGetEventDamageTarget](/typings/3.0.0/functions/BlzGetEventDamageTarget) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzGetEventDamageTarget))

***

### fromDecaying()

> `static` **fromDecaying**(): `Unit` \| `undefined`

Defined in: [handles/unit.ts:3884](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L3884)

Gets the decaying unit of a decay event.

#### Returns

`Unit` \| `undefined`

The unit, or `undefined` outside a decay event.

#### Native

[GetDecayingUnit](/typings/3.0.0/functions/GetDecayingUnit) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetDecayingUnit))

***

### fromDetected()

> `static` **fromDetected**(): `Unit` \| `undefined`

Defined in: [handles/unit.ts:3893](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L3893)

Gets the detected unit of a detection event.

#### Returns

`Unit` \| `undefined`

The unit, or `undefined` outside a detection event.

#### Native

[GetDetectedUnit](/typings/3.0.0/functions/GetDetectedUnit) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetDetectedUnit))

***

### fromDying()

> `static` **fromDying**(): `Unit` \| `undefined`

Defined in: [handles/unit.ts:3902](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L3902)

Gets the dying unit of a death event.

#### Returns

`Unit` \| `undefined`

The unit, or `undefined` outside a death event.

#### Native

[GetDyingUnit](/typings/3.0.0/functions/GetDyingUnit) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetDyingUnit))

***

### fromEntering()

> `static` **fromEntering**(): `Unit` \| `undefined`

Defined in: [handles/unit.ts:3720](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L3720)

Gets the unit entering the region in a region event.

#### Returns

`Unit` \| `undefined`

The unit, or `undefined` outside a region event.

#### Native

[GetEnteringUnit](/typings/3.0.0/functions/GetEnteringUnit) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetEnteringUnit))

***

### fromEnum()

> `static` **fromEnum**(): `Unit` \| `undefined`

Defined in: [handles/unit.ts:3729](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L3729)

Gets the unit a group loop is at, inside the callback of `Group.for`.

#### Returns

`Unit` \| `undefined`

The unit, or `undefined` outside a group loop.

#### Native

[GetEnumUnit](/typings/3.0.0/functions/GetEnumUnit) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetEnumUnit))

***

### fromEvent()

> `static` **fromEvent**(): `Unit` \| `undefined`

Defined in: [handles/unit.ts:3738](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L3738)

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

Defined in: [handles/unit.ts:3911](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L3911)

Gets the target unit of a target acquired or target in range event.

#### Returns

`Unit` \| `undefined`

The target, or `undefined` when the event has none.

#### Native

[GetEventTargetUnit](/typings/3.0.0/functions/GetEventTargetUnit) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetEventTargetUnit))

***

### fromFilter()

> `static` **fromFilter**(): `Unit` \| `undefined`

Defined in: [handles/unit.ts:3747](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L3747)

Gets the unit a group enumeration is testing, inside its filter.

#### Returns

`Unit` \| `undefined`

The unit, or `undefined` outside an enumeration filter.

#### Native

[GetFilterUnit](/typings/3.0.0/functions/GetFilterUnit) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetFilterUnit))

***

### fromHandle()

> `static` **fromHandle**\<`C`\>(`this`, `handle`): `C` \| `undefined`

Defined in: [handles/handle.ts:195](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/handle.ts#L195)

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

Defined in: [handles/unit.ts:3756](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L3756)

Gets the unit that killed the dying unit in a death event.

#### Returns

`Unit` \| `undefined`

The killer, or `undefined` outside a death event or when no unit killed it.

#### Native

[GetKillingUnit](/typings/3.0.0/functions/GetKillingUnit) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetKillingUnit))

***

### fromLearning()

> `static` **fromLearning**(): `Unit` \| `undefined`

Defined in: [handles/unit.ts:3920](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L3920)

Gets the hero learning a skill in a skill event.

#### Returns

`Unit` \| `undefined`

The hero, or `undefined` outside a skill event.

#### Native

[GetLearningUnit](/typings/3.0.0/functions/GetLearningUnit) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetLearningUnit))

***

### fromLeaving()

> `static` **fromLeaving**(): `Unit` \| `undefined`

Defined in: [handles/unit.ts:3765](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L3765)

Gets the unit leaving the region in a region event.

#### Returns

`Unit` \| `undefined`

The unit, or `undefined` outside a region event.

#### Native

[GetLeavingUnit](/typings/3.0.0/functions/GetLeavingUnit) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetLeavingUnit))

***

### fromLeveling()

> `static` **fromLeveling**(): `Unit` \| `undefined`

Defined in: [handles/unit.ts:3774](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L3774)

Gets the hero gaining a level in a hero level event.

#### Returns

`Unit` \| `undefined`

The hero, or `undefined` outside a hero level event.

#### Native

[GetLevelingUnit](/typings/3.0.0/functions/GetLevelingUnit) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetLevelingUnit))

***

### fromLoaded()

> `static` **fromLoaded**(): `Unit` \| `undefined`

Defined in: [handles/unit.ts:3783](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L3783)

Gets the unit loaded into a transport in a load event.

#### Returns

`Unit` \| `undefined`

The unit, or `undefined` outside a load event.

#### Native

[GetLoadedUnit](/typings/3.0.0/functions/GetLoadedUnit) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetLoadedUnit))

***

### fromManipulating()

> `static` **fromManipulating**(): `Unit` \| `undefined`

Defined in: [handles/unit.ts:3929](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L3929)

Gets the unit picking up, dropping or using an item in an item event.

#### Returns

`Unit` \| `undefined`

The unit, or `undefined` outside an item event.

#### Native

[GetManipulatingUnit](/typings/3.0.0/functions/GetManipulatingUnit) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetManipulatingUnit))

***

### fromMouseFocus()

> `static` **fromMouseFocus**(): `Unit` \| `undefined`

Defined in: [handles/unit.ts:3943](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L3943)

**`Async`**

Gets the unit under the local player's mouse cursor.

#### Returns

`Unit` \| `undefined`

The unit, or `undefined` when the cursor is over none.

#### Remarks

The value differs between clients: never let it decide game state.

#### Example

**A tooltip following the local mouse**

```ts
// A tooltip that follows the mouse and names the unit under it. The cursor,
// the unit it points at and the screen's size in pixels are each client's
// own, so every client moves its own tooltip and nothing here reaches game
// state: a click that must change the game goes through an event, such as a
// selection or an order, which every client receives.
import { Frame, Init, Input, Timer, Unit } from "reforged-ts";

Init.onGameStart(() => {
  const gameUi = Frame.fromOrigin(ORIGIN_FRAME_GAME_UI, 0);
  if (gameUi === undefined) {
    return;
  }
  const tooltip = Frame.createType("CursorTooltip", gameUi, 0, "TEXT", "");

  Timer.every(0.03, () => {
    const unit = Unit.fromMouseFocus();
    tooltip.visible = unit !== undefined;
    if (unit === undefined) {
      return;
    }
    tooltip.text = Input.isMouseButtonPressed(MOUSE_BUTTON_TYPE_LEFT)
      ? `|cffffcc00${unit.name}|r`
      : unit.name;
    // The cursor comes in pixels and the anchor goes in frame units. Past
    // the middle of the screen, 0.4 in frame units, the tooltip flips to the
    // cursor's left side.
    const rightHalf = Input.mouseScreenX > Frame.frameToPixelX(0.4);
    tooltip.clearPoints();
    tooltip.setAbsPoint(
      rightHalf ? FRAMEPOINT_BOTTOMRIGHT : FRAMEPOINT_BOTTOMLEFT,
      Frame.pixelToFrameX(Input.mouseScreenX),
      Frame.pixelToFrameY(Input.mouseScreenY),
    );
  });
});
```

#### Native

[BlzGetMouseFocusUnit](/typings/3.0.0/functions/BlzGetMouseFocusUnit) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzGetMouseFocusUnit))

***

### fromOrdered()

> `static` **fromOrdered**(): `Unit` \| `undefined`

Defined in: [handles/unit.ts:3792](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L3792)

Gets the unit given an order in an order event.

#### Returns

`Unit` \| `undefined`

The unit, or `undefined` outside an order event.

#### Native

[GetOrderedUnit](/typings/3.0.0/functions/GetOrderedUnit) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetOrderedUnit))

***

### fromOrderTarget()

> `static` **fromOrderTarget**(): `Unit` \| `undefined`

Defined in: [handles/unit.ts:3802](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L3802)

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

Defined in: [handles/unit.ts:3961](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L3961)

Gets the unit rescuing in a rescue event.

#### Returns

`Unit` \| `undefined`

The rescuer, or `undefined` outside a rescue event.

#### Native

[GetRescuer](/typings/3.0.0/functions/GetRescuer) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetRescuer))

***

### fromResearching()

> `static` **fromResearching**(): `Unit` \| `undefined`

Defined in: [handles/unit.ts:3952](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L3952)

Gets the unit researching in a research event.

#### Returns

`Unit` \| `undefined`

The unit, or `undefined` outside a research event.

#### Native

[GetResearchingUnit](/typings/3.0.0/functions/GetResearchingUnit) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetResearchingUnit))

***

### fromRevivable()

> `static` **fromRevivable**(): `Unit` \| `undefined`

Defined in: [handles/unit.ts:3970](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L3970)

Gets the hero that became revivable in a revivable event.

#### Returns

`Unit` \| `undefined`

The hero, or `undefined` outside a revivable event.

#### Native

[GetRevivableUnit](/typings/3.0.0/functions/GetRevivableUnit) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetRevivableUnit))

***

### fromReviving()

> `static` **fromReviving**(): `Unit` \| `undefined`

Defined in: [handles/unit.ts:3979](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L3979)

Gets the reviving hero of a revive event.

#### Returns

`Unit` \| `undefined`

The hero, or `undefined` outside a revive event.

#### Native

[GetRevivingUnit](/typings/3.0.0/functions/GetRevivingUnit) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetRevivingUnit))

***

### fromSelling()

> `static` **fromSelling**(): `Unit` \| `undefined`

Defined in: [handles/unit.ts:3988](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L3988)

Gets the shop selling in a sell event.

#### Returns

`Unit` \| `undefined`

The shop, or `undefined` outside a sell event.

#### Native

[GetSellingUnit](/typings/3.0.0/functions/GetSellingUnit) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetSellingUnit))

***

### fromSold()

> `static` **fromSold**(): `Unit` \| `undefined`

Defined in: [handles/unit.ts:3997](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L3997)

Gets the unit sold in a unit sell event.

#### Returns

`Unit` \| `undefined`

The unit, or `undefined` outside a unit sell event.

#### Native

[GetSoldUnit](/typings/3.0.0/functions/GetSoldUnit) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetSoldUnit))

***

### fromSpellAbility()

> `static` **fromSpellAbility**(): `Unit` \| `undefined`

Defined in: [handles/unit.ts:4006](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L4006)

Gets the unit casting the spell in a spell event.

#### Returns

`Unit` \| `undefined`

The caster, or `undefined` outside a spell event.

#### Native

[GetSpellAbilityUnit](/typings/3.0.0/functions/GetSpellAbilityUnit) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetSpellAbilityUnit))

***

### fromSpellTarget()

> `static` **fromSpellTarget**(): `Unit` \| `undefined`

Defined in: [handles/unit.ts:3812](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L3812)

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

Defined in: [handles/unit.ts:3821](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L3821)

Gets the summoned unit of a summon event.

#### Returns

`Unit` \| `undefined`

The summoned unit, or `undefined` outside a summon event.

#### Native

[GetSummonedUnit](/typings/3.0.0/functions/GetSummonedUnit) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetSummonedUnit))

***

### fromSummoning()

> `static` **fromSummoning**(): `Unit` \| `undefined`

Defined in: [handles/unit.ts:3830](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L3830)

Gets the unit that summons in a summon event.

#### Returns

`Unit` \| `undefined`

The summoner, or `undefined` outside a summon event.

#### Native

[GetSummoningUnit](/typings/3.0.0/functions/GetSummoningUnit) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetSummoningUnit))

***

### fromTrained()

> `static` **fromTrained**(): `Unit` \| `undefined`

Defined in: [handles/unit.ts:3839](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L3839)

Gets the trained unit of a training finish event.

#### Returns

`Unit` \| `undefined`

The unit, or `undefined` outside a training finish.

#### Native

[GetTrainedUnit](/typings/3.0.0/functions/GetTrainedUnit) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetTrainedUnit))

***

### fromTransport()

> `static` **fromTransport**(): `Unit` \| `undefined`

Defined in: [handles/unit.ts:3848](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L3848)

Gets the transport a unit is loaded into in a load event.

#### Returns

`Unit` \| `undefined`

The transport, or `undefined` outside a load event.

#### Native

[GetTransportUnit](/typings/3.0.0/functions/GetTransportUnit) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetTransportUnit))

***

### getPointValueByType()

> `static` **getPointValueByType**(`unitType`): `number`

Defined in: [handles/unit.ts:4016](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L4016)

Gets the point value a unit type defines, which the score screen counts.

#### Parameters

##### unitType

`Rawcode`\<`"unit"`\>

The unit type's rawcode, such as the Footman's, `FourCC("hfoo")`.

#### Returns

`number`

The point value.

#### Native

[GetUnitPointValueByType](/typings/3.0.0/functions/GetUnitPointValueByType) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetUnitPointValueByType))

***

### isUnitIdHero()

> `static` **isUnitIdHero**(`unitId`): `boolean`

Defined in: [handles/unit.ts:4026](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L4026)

Checks whether a unit type is a hero type.

#### Parameters

##### unitId

`Rawcode`\<`"unit"`\>

The unit type's rawcode, such as the Footman's, `FourCC("hfoo")`.

#### Returns

`boolean`

True when the type is a hero type.

#### Native

[IsHeroUnitId](/typings/3.0.0/functions/IsHeroUnitId) ([jassbot](https://lep.duckdns.org/jassbot/doc/IsHeroUnitId))

***

### isUnitIdType()

> `static` **isUnitIdType**(`unitId`, `whichUnitType`): `boolean`

Defined in: [handles/unit.ts:4037](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/unit.ts#L4037)

Checks whether a unit type has a classification, such as `UNIT_TYPE_STRUCTURE`.

#### Parameters

##### unitId

`Rawcode`\<`"unit"`\>

The unit type's rawcode, such as the Footman's, `FourCC("hfoo")`.

##### whichUnitType

`unittype`

The classification.

#### Returns

`boolean`

True when the type has it.

#### Native

[IsUnitIdType](/typings/3.0.0/functions/IsUnitIdType) ([jassbot](https://lep.duckdns.org/jassbot/doc/IsUnitIdType))
