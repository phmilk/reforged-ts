# Class: Point

Defined in: [handles/point.ts:19](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/point.ts#L19)

A point of the map, for the Natives that take or return a location rather
than coordinates.

## Remarks

- Named `Point` because the Native type name, `location`, collides with the
  Native function `Location`.
- Most Natives take raw coordinates, which allocate nothing: use a Point
  only where a Native needs one. Every Point is a Handle the game keeps
  until `destroy()`, including the ones an event lookup such as
  `fromSpellTarget` returns.

## Example

**A spell's target point, read and freed**

```ts
// The target point of every spell cast: the game allocates a new location
// for each read, so the Point is destroyed once used.
import { Init, on, Point, UnitEvents } from "reforged-ts";

Init.onTriggers(() => {
  on(UnitEvents.spellEffect, ({ caster }) => {
    const target = Point.fromSpellTarget();
    if (target === undefined) {
      return;
    }
    print(`${caster.name} targets ${String(target.x)}, ${String(target.y)}`);
    target.destroy();
  });
});
```

## Native

[location](/typings/3.0.0/interfaces/location) ([jassbot](https://lep.duckdns.org/jassbot/doc/location))

## Extends

- [`Handle`](Handle.md)\<`location`\>

## Properties

### handle

> `readonly` **handle**: `location`

Defined in: [handles/handle.ts:132](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/handle.ts#L132)

The Handle this Wrapper owns, to pass to a Native the library does not
wrap.

#### Remarks

Do not keep it after `destroy()`: the game frees the object behind it.

#### Inherited from

[`Handle`](Handle.md).[`handle`](Handle.md#handle)

## Accessors

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

[`Handle`](Handle.md).[`id`](Handle.md#id)

***

### x

#### Get Signature

> **get** **x**(): `number`

Defined in: [handles/point.ts:45](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/point.ts#L45)

Gets the point's x-coordinate.

##### Native

[GetLocationX](/typings/3.0.0/functions/GetLocationX) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetLocationX))

##### Returns

`number`

The x-coordinate, in world units.

#### Set Signature

> **set** **x**(`value`): `void`

Defined in: [handles/point.ts:54](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/point.ts#L54)

The point's x-coordinate, in world units; the y-coordinate stays.

##### Native

[MoveLocation](/typings/3.0.0/functions/MoveLocation) ([jassbot](https://lep.duckdns.org/jassbot/doc/MoveLocation))

##### Native

[GetLocationY](/typings/3.0.0/functions/GetLocationY) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetLocationY))

##### Parameters

###### value

`number`

##### Returns

`void`

***

### y

#### Get Signature

> **get** **y**(): `number`

Defined in: [handles/point.ts:63](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/point.ts#L63)

Gets the point's y-coordinate.

##### Native

[GetLocationY](/typings/3.0.0/functions/GetLocationY) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetLocationY))

##### Returns

`number`

The y-coordinate, in world units.

#### Set Signature

> **set** **y**(`value`): `void`

Defined in: [handles/point.ts:72](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/point.ts#L72)

The point's y-coordinate, in world units; the x-coordinate stays.

##### Native

[MoveLocation](/typings/3.0.0/functions/MoveLocation) ([jassbot](https://lep.duckdns.org/jassbot/doc/MoveLocation))

##### Native

[GetLocationX](/typings/3.0.0/functions/GetLocationX) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetLocationX))

##### Parameters

###### value

`number`

##### Returns

`void`

***

### z

#### Get Signature

> **get** **z**(): `number`

Defined in: [handles/point.ts:89](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/point.ts#L89)

**`Async`**

Gets the height of the terrain at the point.

##### Remarks

The value can differ between clients: never let it decide game state.
Terrain deformed by spells or abilities, the graphics settings, whether
destructables are rendered, and what each client sees can all change the
value.

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

[GetLocationZ](/typings/3.0.0/functions/GetLocationZ) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetLocationZ))

##### Returns

`number`

The terrain height, in world units.

## Methods

### createMinimapIcon()

> **createMinimapIcon**(`red`, `green`, `blue`, `pingPath`, `fogVisibility`): `minimapicon`

Defined in: [handles/point.ts:108](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/point.ts#L108)

Creates a minimap icon at the point.

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

The game's new minimap icon.

#### Remarks

The library does not wrap the `minimapicon` Native type: pass the result
to its Natives, such as `DestroyMinimapIcon`.

#### Throws

When the game returns no handle, for example a missing model:
`reforged-ts: failed to create minimapicon (<pingPath>)`, at the calling line.

#### Native

[CreateMinimapIconAtLoc](/typings/3.0.0/functions/CreateMinimapIconAtLoc) ([jassbot](https://lep.duckdns.org/jassbot/doc/CreateMinimapIconAtLoc))

***

### destroy()

> **destroy**(): `void`

Defined in: [handles/point.ts:142](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/point.ts#L142)

Destroys the Point through its Native.

#### Returns

`void`

#### Remarks

In Dev mode the destroyed Wrapper becomes a tombstone: any later access,
a second `destroy()` included, raises
`reforged-ts: used after destroy: <Class>#<id>`, and
`Reforged.debug.report()` counts it destroyed.

#### Example

**Handles made for one computation**

```ts
// Handles made for one computation. A Point, a Rectangle, a Group and a
// Force each live only as long as the code that reads them: destroy each
// once read, on every client (never inside runLocal), and keep no reference
// to it. In Dev mode any later use of a destroyed Wrapper raises
// `reforged-ts: used after destroy: <Class>#<id>`; without Dev mode it
// reaches a Handle the game has freed.
import {
  Force,
  Group,
  Init,
  MapPlayer,
  Point,
  Rectangle,
  tsGlobals,
  Unit,
} from "reforged-ts";

/** Tells `player`'s allies how many enemies and items are near (x, y). */
export function scoutReport(player: MapPlayer, x: number, y: number): void {
  const spot = Point.create(x, y);
  const enemies = Group.create();
  enemies.enumUnitsInRangeOfPoint(
    spot,
    512,
    () => Unit.fromFilter()?.isEnemy(player) === true,
  );
  spot.destroy();
  const enemyCount = enemies.size;
  enemies.destroy();

  let itemCount = 0;
  const area = Rectangle.create(x - 512, y - 512, x + 512, y + 512);
  area.enumItems(
    () => true,
    () => {
      itemCount++;
    },
  );
  area.destroy();

  const allies = Force.create();
  allies.enumAllies(player, () => true);
  const recipients = allies.getPlayers();
  allies.destroy();
  for (const ally of recipients) {
    ally.displayText(
      0,
      0,
      `${String(enemyCount)} enemies and ${String(itemCount)} items near the scout`,
    );
  }
}

Init.onGameStart(() => {
  scoutReport(tsGlobals.Players[0], 0, 0);
});
```

#### Throws

In Dev mode, when called inside `MapPlayer.runLocal`: a Handle
freed on one client desyncs the game.

#### Native

[RemoveLocation](/typings/3.0.0/functions/RemoveLocation) ([jassbot](https://lep.duckdns.org/jassbot/doc/RemoveLocation))

***

### setPosition()

> **setPosition**(`x`, `y`): `void`

Defined in: [handles/point.ts:153](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/point.ts#L153)

Moves the point to the given coordinates.

#### Parameters

##### x

`number`

The new x-coordinate, in world units.

##### y

`number`

The new y-coordinate, in world units.

#### Returns

`void`

#### Native

[MoveLocation](/typings/3.0.0/functions/MoveLocation) ([jassbot](https://lep.duckdns.org/jassbot/doc/MoveLocation))

***

### create()

> `static` **create**(`x`, `y`): `Point`

Defined in: [handles/point.ts:36](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/point.ts#L36)

Creates a point at the given coordinates.

#### Parameters

##### x

`number`

The x-coordinate, in world units.

##### y

`number`

The y-coordinate, in world units.

#### Returns

`Point`

The new point.

#### Remarks

- Prefer raw coordinates where a Native takes them: a Point is kept until
  `destroy()`.
- The error message names the Point. In w3ts 3.x it read
  `w3ts failed to create player handle.`, naming the wrong Handle type.

#### Throws

When the game returns no handle:
`reforged-ts: failed to create Point`, at the calling line. In Dev mode,
also when called before the globals Init stage or inside
`MapPlayer.runLocal`.

#### Native

[Location](/typings/3.0.0/functions/Location) ([jassbot](https://lep.duckdns.org/jassbot/doc/Location))

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

[`Handle`](Handle.md).[`fromHandle`](Handle.md#fromhandle)

***

### fromMousePosition()

> `static` **fromMousePosition**(): `Point` \| `undefined`

Defined in: [handles/point.ts:173](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/point.ts#L173)

Gets the mouse position of the player mouse event being handled.

#### Returns

`Point` \| `undefined`

A new point at the mouse position, or `undefined` outside a
player mouse event.

#### Remarks

The Native takes no handle and returns a location, so `Point` owns it
through the coverage rule's creation exception, and the game allocates a
new location on each call: each call returns a new Point, and nothing
destroys it for you, so `destroy()` it. Dev mode counts it as created
and, inside `MapPlayer.runLocal`, raises as for any creation. It returns
`undefined` rather than throwing, because outside the event the game has
nothing to give.

#### Throws

In Dev mode, when called inside `MapPlayer.runLocal`, as any
creation does.

#### Native

[BlzGetTriggerPlayerMousePosition](/typings/3.0.0/functions/BlzGetTriggerPlayerMousePosition) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzGetTriggerPlayerMousePosition))

***

### fromOrderPoint()

> `static` **fromOrderPoint**(): `Point` \| `undefined`

Defined in: [handles/point.ts:193](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/point.ts#L193)

Gets the target point of the point order being issued.

#### Returns

`Point` \| `undefined`

A new point at the order's target, or `undefined` outside a
point order.

#### Remarks

The Native takes no handle and returns a location, so `Point` owns it
through the coverage rule's creation exception, and the game allocates a
new location on each call: each call returns a new Point, and nothing
destroys it for you, so `destroy()` it. Dev mode counts it as created
and, inside `MapPlayer.runLocal`, raises as for any creation. It returns
`undefined` rather than throwing, because outside a point order the game
has nothing to give.

#### Throws

In Dev mode, when called inside `MapPlayer.runLocal`, as any
creation does.

#### Native

[GetOrderPointLoc](/typings/3.0.0/functions/GetOrderPointLoc) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetOrderPointLoc))

***

### fromSpellTarget()

> `static` **fromSpellTarget**(): `Point` \| `undefined`

Defined in: [handles/point.ts:213](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/point.ts#L213)

Gets the target point of the spell event being handled.

#### Returns

`Point` \| `undefined`

A new point at the spell's target, or `undefined` outside a
spell event or when the spell targets no point.

#### Remarks

The Native takes no handle and returns a location, so `Point` owns it
through the coverage rule's creation exception, and the game allocates a
new location on each call: each call returns a new Point, and nothing
destroys it for you, so `destroy()` it. Dev mode counts it as created
and, inside `MapPlayer.runLocal`, raises as for any creation. It returns
`undefined` rather than throwing, because a spell without a target point
gives nothing.

#### Throws

In Dev mode, when called inside `MapPlayer.runLocal`, as any
creation does.

#### Native

[GetSpellTargetLoc](/typings/3.0.0/functions/GetSpellTargetLoc) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetSpellTargetLoc))
