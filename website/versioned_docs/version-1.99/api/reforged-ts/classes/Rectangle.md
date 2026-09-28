# Class: Rectangle

Defined in: [handles/rect.ts:17](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/rect.ts#L17)

A rectangular area of the map, aligned with its axes.

## Remarks

Named `Rectangle` because the Native type name, `rect`, collides with the
Native function `Rect`.

## Example

**Enumerating the units and items inside**

```ts
// An area in the middle of the map, checked every 30 seconds: the units
// inside are counted through a Group, the items inside are removed through
// the Rectangle itself.
import { Group, Init, Item, Rectangle, Trigger } from "reforged-ts";

Init.onTriggers(() => {
  const arena = Rectangle.create(-512, -512, 512, 512);
  const units = Group.create();

  Trigger.create()
    .registerTimerEvent(30, true)
    .addAction(() => {
      units.enumUnitsInRect(arena, () => true);
      print(`${String(units.size)} units in the arena`);

      arena.enumItems(
        () => true,
        () => {
          Item.fromEnum()?.destroy();
        },
      );
    });
});
```

## Native

[rect](/typings/3.0.0/interfaces/rect) ([jassbot](https://lep.duckdns.org/jassbot/doc/rect))

## Extends

- [`Handle`](Handle.md)\<`rect`\>

## Properties

### handle

> `readonly` **handle**: `rect`

Defined in: [handles/handle.ts:132](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/handle.ts#L132)

The Handle this Wrapper owns, to pass to a Native the library does not
wrap.

#### Remarks

Do not keep it after `destroy()`: the game frees the object behind it.

#### Inherited from

[`Handle`](Handle.md).[`handle`](Handle.md#handle)

## Accessors

### centerX

#### Get Signature

> **get** **centerX**(): `number`

Defined in: [handles/rect.ts:48](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/rect.ts#L48)

Gets the x-coordinate of the rectangle's center.

##### Native

[GetRectCenterX](/typings/3.0.0/functions/GetRectCenterX) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetRectCenterX))

##### Returns

`number`

The x-coordinate, in world units.

***

### centerY

#### Get Signature

> **get** **centerY**(): `number`

Defined in: [handles/rect.ts:57](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/rect.ts#L57)

Gets the y-coordinate of the rectangle's center.

##### Native

[GetRectCenterY](/typings/3.0.0/functions/GetRectCenterY) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetRectCenterY))

##### Returns

`number`

The y-coordinate, in world units.

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

[`Handle`](Handle.md).[`id`](Handle.md#id)

***

### maxX

#### Get Signature

> **get** **maxX**(): `number`

Defined in: [handles/rect.ts:66](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/rect.ts#L66)

Gets the x-coordinate of the rectangle's right edge.

##### Native

[GetRectMaxX](/typings/3.0.0/functions/GetRectMaxX) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetRectMaxX))

##### Returns

`number`

The x-coordinate, in world units.

***

### maxY

#### Get Signature

> **get** **maxY**(): `number`

Defined in: [handles/rect.ts:75](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/rect.ts#L75)

Gets the y-coordinate of the rectangle's top edge.

##### Native

[GetRectMaxY](/typings/3.0.0/functions/GetRectMaxY) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetRectMaxY))

##### Returns

`number`

The y-coordinate, in world units.

***

### minX

#### Get Signature

> **get** **minX**(): `number`

Defined in: [handles/rect.ts:84](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/rect.ts#L84)

Gets the x-coordinate of the rectangle's left edge.

##### Native

[GetRectMinX](/typings/3.0.0/functions/GetRectMinX) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetRectMinX))

##### Returns

`number`

The x-coordinate, in world units.

***

### minY

#### Get Signature

> **get** **minY**(): `number`

Defined in: [handles/rect.ts:93](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/rect.ts#L93)

Gets the y-coordinate of the rectangle's bottom edge.

##### Native

[GetRectMinY](/typings/3.0.0/functions/GetRectMinY) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetRectMinY))

##### Returns

`number`

The y-coordinate, in world units.

## Methods

### addCameraBlocker()

> **addCameraBlocker**(): `void`

Defined in: [handles/rect.ts:101](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/rect.ts#L101)

Makes the rect a camera blocker, through `AddCameraBlocker` (3.0.0).

#### Returns

`void`

#### Native

[AddCameraBlocker](/typings/3.0.0/functions/AddCameraBlocker) ([jassbot](https://lep.duckdns.org/jassbot/doc/AddCameraBlocker))

***

### destroy()

> **destroy**(): `void`

Defined in: [handles/rect.ts:116](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/rect.ts#L116)

Destroys the Rectangle through its Native.

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

[RemoveRect](/typings/3.0.0/functions/RemoveRect) ([jassbot](https://lep.duckdns.org/jassbot/doc/RemoveRect))

***

### enableCameraBlocker()

> **enableCameraBlocker**(`flag`): `void`

Defined in: [handles/rect.ts:127](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/rect.ts#L127)

Turns the rect's camera blocker on or off, through `EnableCameraBlocker`
(3.0.0).

#### Parameters

##### flag

`boolean`

True to turn it on, false to turn it off.

#### Returns

`void`

#### Native

[EnableCameraBlocker](/typings/3.0.0/functions/EnableCameraBlocker) ([jassbot](https://lep.duckdns.org/jassbot/doc/EnableCameraBlocker))

***

### enumDestructables()

> **enumDestructables**(`filter`, `actionFunc`): `void`

Defined in: [handles/rect.ts:145](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/rect.ts#L145)

Runs `actionFunc` once for each destructable inside the rectangle that
`filter` keeps.

#### Parameters

##### filter

`boolexpr` \| (() => `boolean`)

Keeps a destructable when it returns true; inside it,
`Destructable.fromFilter()` gives the destructable. A plain function is
wrapped in a `Filter` for the call.

##### actionFunc

() => `void`

Runs once per destructable kept, before the method
returns; inside it, `Destructable.fromEnum()` gives the destructable.

#### Returns

`void`

#### Remarks

In Dev mode each function runs under `pcall`: a call that throws is
reported and the enumeration continues with the next destructable.

#### Native

[EnumDestructablesInRect](/typings/3.0.0/functions/EnumDestructablesInRect) ([jassbot](https://lep.duckdns.org/jassbot/doc/EnumDestructablesInRect))

#### Native

[Filter](/typings/3.0.0/functions/Filter) ([jassbot](https://lep.duckdns.org/jassbot/doc/Filter))

***

### enumItems()

> **enumItems**(`filter`, `actionFunc`): `void`

Defined in: [handles/rect.ts:170](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/rect.ts#L170)

Runs `actionFunc` once for each item inside the rectangle that `filter`
keeps.

#### Parameters

##### filter

`boolexpr` \| (() => `boolean`)

Keeps an item when it returns true; inside it,
`Item.fromFilter()` gives the item. A plain function is wrapped in a
`Filter` for the call.

##### actionFunc

() => `void`

Runs once per item kept, before the method returns;
inside it, `Item.fromEnum()` gives the item.

#### Returns

`void`

#### Remarks

In Dev mode each function runs under `pcall`: a call that throws is
reported and the enumeration continues with the next item.

#### Native

[EnumItemsInRect](/typings/3.0.0/functions/EnumItemsInRect) ([jassbot](https://lep.duckdns.org/jassbot/doc/EnumItemsInRect))

#### Native

[Filter](/typings/3.0.0/functions/Filter) ([jassbot](https://lep.duckdns.org/jassbot/doc/Filter))

***

### move()

> **move**(`newCenterX`, `newCenterY`): `void`

Defined in: [handles/rect.ts:188](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/rect.ts#L188)

Moves the rectangle, keeping its size, so that it is centered on the
given coordinates.

#### Parameters

##### newCenterX

`number`

The new center's x-coordinate, in world units.

##### newCenterY

`number`

The new center's y-coordinate, in world units.

#### Returns

`void`

#### Remarks

Unlike `setRect`, it does not keep the rectangle inside the map's
bounds.

#### Native

[MoveRectTo](/typings/3.0.0/functions/MoveRectTo) ([jassbot](https://lep.duckdns.org/jassbot/doc/MoveRectTo))

***

### movePoint()

> **movePoint**(`newCenterPoint`): `void`

Defined in: [handles/rect.ts:198](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/rect.ts#L198)

Moves the rectangle, keeping its size, so that it is centered on a
Point.

#### Parameters

##### newCenterPoint

[`Point`](Point.md)

The Point the rectangle's center moves to.

#### Returns

`void`

#### Native

[MoveRectToLoc](/typings/3.0.0/functions/MoveRectToLoc) ([jassbot](https://lep.duckdns.org/jassbot/doc/MoveRectToLoc))

***

### setDoodadAnimation()

> **setDoodadAnimation**(`doodadId`, `animName`, `animRandom`): `void`

Defined in: [handles/rect.ts:210](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/rect.ts#L210)

Sets the animation of every doodad of type `doodadId` in the rect,
through `SetDoodadAnimationRect`.

#### Parameters

##### doodadId

`number`

The doodad type's rawcode, such as `FourCC("LTlt")`.

##### animName

`string`

The animation's name, such as `"death"`.

##### animRandom

`boolean`

Plays a random animation of that name.

#### Returns

`void`

#### Native

[SetDoodadAnimationRect](/typings/3.0.0/functions/SetDoodadAnimationRect) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetDoodadAnimationRect))

***

### setDoodadColor()

> **setDoodadColor**(`doodadId`, `color`): `void`

Defined in: [handles/rect.ts:225](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/rect.ts#L225)

Sets the player color of every doodad of type `doodadId` in the rect,
through `SetDoodadColorRect` (3.0.0).

#### Parameters

##### doodadId

`number`

The doodad type's rawcode, such as `FourCC("LTlt")`.

##### color

`playercolor`

The player colour to tint them with.

#### Returns

`void`

#### Native

[SetDoodadColorRect](/typings/3.0.0/functions/SetDoodadColorRect) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetDoodadColorRect))

***

### setRect()

> **setRect**(`minX`, `minY`, `maxX`, `maxY`): `void`

Defined in: [handles/rect.ts:240](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/rect.ts#L240)

Moves the rectangle's edges to the given coordinates.

#### Parameters

##### minX

`number`

The left edge's x-coordinate, in world units.

##### minY

`number`

The bottom edge's y-coordinate, in world units.

##### maxX

`number`

The right edge's x-coordinate, in world units.

##### maxY

`number`

The top edge's y-coordinate, in world units.

#### Returns

`void`

#### Remarks

The game keeps the bounds inside the map's; a rectangle cannot match the
world bounds exactly, its maximum coordinates staying 32 short of them.

#### Native

[SetRect](/typings/3.0.0/functions/SetRect) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetRect))

***

### setRectFromPoint()

> **setRectFromPoint**(`min`, `max`): `void`

Defined in: [handles/rect.ts:253](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/rect.ts#L253)

Moves the rectangle's corners to two Points.

#### Parameters

##### min

[`Point`](Point.md)

The bottom-left corner.

##### max

[`Point`](Point.md)

The top-right corner.

#### Returns

`void`

#### Remarks

The game keeps the bounds inside the map's; a rectangle cannot match the
world bounds exactly, its maximum coordinates staying 32 short of them.

#### Native

[SetRectFromLoc](/typings/3.0.0/functions/SetRectFromLoc) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetRectFromLoc))

***

### create()

> `static` **create**(`minX`, `minY`, `maxX`, `maxY`): `Rectangle`

Defined in: [handles/rect.ts:34](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/rect.ts#L34)

Creates a rectangle from its minimum and maximum coordinates.

#### Parameters

##### minX

`number`

The left edge's x-coordinate, in world units.

##### minY

`number`

The bottom edge's y-coordinate, in world units.

##### maxX

`number`

The right edge's x-coordinate, in world units.

##### maxY

`number`

The top edge's y-coordinate, in world units.

#### Returns

`Rectangle`

The new rectangle.

#### Remarks

The game keeps the bounds inside the map's; a rectangle cannot match the
world bounds exactly, its maximum coordinates staying 32 short of them.

#### Throws

When the game returns no handle:
`reforged-ts: failed to create Rectangle`, at the calling line. In Dev
mode, also when called before the globals Init stage or inside
`MapPlayer.runLocal`.

#### Native

[Rect](/typings/3.0.0/functions/Rect) ([jassbot](https://lep.duckdns.org/jassbot/doc/Rect))

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

***

### fromPoint()

> `static` **fromPoint**(`min`, `max`): `Rectangle`

Defined in: [handles/rect.ts:271](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/rect.ts#L271)

Creates a rectangle from two Points, its corners.

#### Parameters

##### min

[`Point`](Point.md)

The bottom-left corner.

##### max

[`Point`](Point.md)

The top-right corner.

#### Returns

`Rectangle`

The new rectangle.

#### Remarks

The game keeps the bounds inside the map's; a rectangle cannot match the
world bounds exactly, its maximum coordinates staying 32 short of them.

#### Throws

When the game returns no handle:
`reforged-ts: failed to create Rectangle`, at the calling line. In Dev
mode, also when called before the globals Init stage or inside
`MapPlayer.runLocal`.

#### Native

[RectFromLoc](/typings/3.0.0/functions/RectFromLoc) ([jassbot](https://lep.duckdns.org/jassbot/doc/RectFromLoc))

***

### getWorldBounds()

> `static` **getWorldBounds**(): `Rectangle`

Defined in: [handles/rect.ts:288](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/rect.ts#L288)

Creates a rectangle spanning the whole map, its unplayable borders
included.

#### Returns

`Rectangle`

The new rectangle.

#### Remarks

The game allocates a new rect on each call: `destroy()` the result when
done with it.

#### Throws

When the game returns no handle:
`reforged-ts: failed to create Rectangle`, at the calling line. In Dev
mode, also when called before the globals Init stage or inside
`MapPlayer.runLocal`.

#### Native

[GetWorldBounds](/typings/3.0.0/functions/GetWorldBounds) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetWorldBounds))
