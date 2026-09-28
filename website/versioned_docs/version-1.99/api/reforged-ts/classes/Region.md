# Class: Region

Defined in: [handles/region.ts:18](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/region.ts#L18)

An area of the map made of 32-by-32 cells, of any shape: what the enter
and leave events of `RegionEvents` watch.

## Remarks

A Rectangle is only a shape; to watch units cross one, add it to a Region
with `addRect`.

## Example

**Watching units enter an area**

```ts
// A Region made of a Rectangle: a unit entering it is told so. A Rectangle
// is only a shape; the enter event needs the Region.
import { Init, on, Rectangle, Region, RegionEvents } from "reforged-ts";

Init.onTriggers(() => {
  const gate = Rectangle.create(-256, -256, 256, 256);
  const zone = Region.create();
  zone.addRect(gate);
  gate.destroy();

  on(RegionEvents.enter(zone), ({ unit }) => {
    print(`${unit.name} entered the zone`);
  });
});
```

## Native

[region](/typings/3.0.0/interfaces/region) ([jassbot](https://lep.duckdns.org/jassbot/doc/region))

## Extends

- [`Handle`](Handle.md)\<`region`\>

## Properties

### handle

> `readonly` **handle**: `region`

Defined in: [handles/handle.ts:132](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/handle.ts#L132)

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

[`Handle`](Handle.md).[`id`](Handle.md#id)

## Methods

### addCell()

> **addCell**(`x`, `y`): `void`

Defined in: [handles/region.ts:45](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/region.ts#L45)

Adds the cell holding the given coordinates to the region.

#### Parameters

##### x

`number`

An x-coordinate inside the cell, in world units.

##### y

`number`

A y-coordinate inside the cell, in world units.

#### Returns

`void`

#### Remarks

Cells form a grid of squares 32 world units wide, whose lines lie on
the multiples of 32: the point (70, 10) is in the cell from (64, 0) to
(96, 32).

#### Native

[RegionAddCell](/typings/3.0.0/functions/RegionAddCell) ([jassbot](https://lep.duckdns.org/jassbot/doc/RegionAddCell))

***

### addCellPoint()

> **addCellPoint**(`whichPoint`): `void`

Defined in: [handles/region.ts:58](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/region.ts#L58)

Adds the cell holding a Point to the region.

#### Parameters

##### whichPoint

[`Point`](Point.md)

A point inside the cell.

#### Returns

`void`

#### Remarks

Cells form a grid of squares 32 world units wide, whose lines lie on
the multiples of 32: the point (70, 10) is in the cell from (64, 0) to
(96, 32).

#### Native

[RegionAddCellAtLoc](/typings/3.0.0/functions/RegionAddCellAtLoc) ([jassbot](https://lep.duckdns.org/jassbot/doc/RegionAddCellAtLoc))

***

### addRect()

> **addRect**(`r`): `void`

Defined in: [handles/region.ts:67](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/region.ts#L67)

Adds the cells a Rectangle covers to the region.

#### Parameters

##### r

[`Rectangle`](Rectangle.md)

The rectangle whose cells join the region.

#### Returns

`void`

#### Native

[RegionAddRect](/typings/3.0.0/functions/RegionAddRect) ([jassbot](https://lep.duckdns.org/jassbot/doc/RegionAddRect))

***

### clearCell()

> **clearCell**(`x`, `y`): `void`

Defined in: [handles/region.ts:81](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/region.ts#L81)

Removes the cell holding the given coordinates from the region.

#### Parameters

##### x

`number`

An x-coordinate inside the cell, in world units.

##### y

`number`

A y-coordinate inside the cell, in world units.

#### Returns

`void`

#### Remarks

Cells form a grid of squares 32 world units wide, whose lines lie on
the multiples of 32: the point (70, 10) is in the cell from (64, 0) to
(96, 32).

#### Native

[RegionClearCell](/typings/3.0.0/functions/RegionClearCell) ([jassbot](https://lep.duckdns.org/jassbot/doc/RegionClearCell))

***

### clearCellPoint()

> **clearCellPoint**(`whichPoint`): `void`

Defined in: [handles/region.ts:94](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/region.ts#L94)

Removes the cell holding a Point from the region.

#### Parameters

##### whichPoint

[`Point`](Point.md)

A point inside the cell.

#### Returns

`void`

#### Remarks

Cells form a grid of squares 32 world units wide, whose lines lie on
the multiples of 32: the point (70, 10) is in the cell from (64, 0) to
(96, 32).

#### Native

[RegionClearCellAtLoc](/typings/3.0.0/functions/RegionClearCellAtLoc) ([jassbot](https://lep.duckdns.org/jassbot/doc/RegionClearCellAtLoc))

***

### clearRect()

> **clearRect**(`r`): `void`

Defined in: [handles/region.ts:103](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/region.ts#L103)

Removes the cells a Rectangle covers from the region.

#### Parameters

##### r

[`Rectangle`](Rectangle.md)

The rectangle whose cells leave the region.

#### Returns

`void`

#### Native

[RegionClearRect](/typings/3.0.0/functions/RegionClearRect) ([jassbot](https://lep.duckdns.org/jassbot/doc/RegionClearRect))

***

### containsCoords()

> **containsCoords**(`x`, `y`): `boolean`

Defined in: [handles/region.ts:114](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/region.ts#L114)

Tests whether the cell holding the given coordinates is in the region.

#### Parameters

##### x

`number`

The x-coordinate, in world units.

##### y

`number`

The y-coordinate, in world units.

#### Returns

`boolean`

True when the region holds the cell.

#### Native

[IsPointInRegion](/typings/3.0.0/functions/IsPointInRegion) ([jassbot](https://lep.duckdns.org/jassbot/doc/IsPointInRegion))

***

### containsPoint()

> **containsPoint**(`whichPoint`): `void`

Defined in: [handles/region.ts:127](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/region.ts#L127)

Asks the game whether the cell holding a Point is in the region, and
discards the answer.

#### Parameters

##### whichPoint

[`Point`](Point.md)

The point to test.

#### Returns

`void`

#### Remarks

The method does not return the Native's result: it returns nothing. Use
`containsCoords(whichPoint.x, whichPoint.y)` to get the answer.

#### Native

[IsLocationInRegion](/typings/3.0.0/functions/IsLocationInRegion) ([jassbot](https://lep.duckdns.org/jassbot/doc/IsLocationInRegion))

***

### containsUnit()

> **containsUnit**(`whichUnit`): `boolean`

Defined in: [handles/region.ts:139](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/region.ts#L139)

Tests whether a unit stands in the region.

#### Parameters

##### whichUnit

[`Unit`](Unit.md)

The unit to test.

#### Returns

`boolean`

True when the unit's position is in one of the region's cells.

#### Remarks

Only the unit's origin counts, not its collision size.

#### Native

[IsUnitInRegion](/typings/3.0.0/functions/IsUnitInRegion) ([jassbot](https://lep.duckdns.org/jassbot/doc/IsUnitInRegion))

***

### destroy()

> **destroy**(): `void`

Defined in: [handles/region.ts:154](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/region.ts#L154)

Destroys the Region through its Native.

#### Returns

`void`

#### Remarks

In Dev mode the destroyed Wrapper becomes a tombstone: any later access,
a second `destroy()` included, raises
`reforged-ts: used after destroy: <Class>#<id>`, and
`Reforged.debug.report()` counts it destroyed.

#### Throws

In Dev mode, when called inside `MapPlayer.runLocal`: a Handle
freed on one client desyncs the game.

#### Native

[RemoveRegion](/typings/3.0.0/functions/RemoveRegion) ([jassbot](https://lep.duckdns.org/jassbot/doc/RemoveRegion))

***

### create()

> `static` **create**(): `Region`

Defined in: [handles/region.ts:31](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/region.ts#L31)

Creates a region that holds no cell yet.

#### Returns

`Region`

The new region.

#### Remarks

The error message names the Region. In w3ts 3.x it read
`w3ts failed to create rect handle.`, naming the wrong Handle type.

#### Throws

When the game returns no handle:
`reforged-ts: failed to create Region`, at the calling line. In Dev
mode, also when called before the globals Init stage or inside
`MapPlayer.runLocal`.

#### Native

[CreateRegion](/typings/3.0.0/functions/CreateRegion) ([jassbot](https://lep.duckdns.org/jassbot/doc/CreateRegion))

***

### fromEvent()

> `static` **fromEvent**(): `Region` \| `undefined`

Defined in: [handles/region.ts:165](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/region.ts#L165)

Gets the region of the enter or leave event being handled.

#### Returns

`Region` \| `undefined`

The region the unit crossed, or `undefined` outside a region
event.

#### Native

[GetTriggeringRegion](/typings/3.0.0/functions/GetTriggeringRegion) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetTriggeringRegion))

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

[`Handle`](Handle.md).[`fromHandle`](Handle.md#fromhandle)
