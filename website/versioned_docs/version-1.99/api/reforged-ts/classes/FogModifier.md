# Class: FogModifier

Defined in: [handles/fogmodifier.ts:18](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/fogmodifier.ts#L18)

A fog modifier: a fog-of-war state forced on an area for one player, such
as a region kept visible or kept black.

## Remarks

A new fog modifier does nothing until `start`; while it runs, it overrides
the player's own fog over its area, and `stop` gives it back.

## Example

**Revealing the centre of the map to a player**

```ts
// The centre of the map kept visible to the first player for thirty seconds:
// a fog modifier does nothing until it is started.
import { FogModifier, Init, Timer, tsGlobals } from "reforged-ts";

Init.onGameStart(() => {
  const reveal = FogModifier.create(
    tsGlobals.Players[0],
    FOG_OF_WAR_VISIBLE,
    0,
    0,
    1024,
    true,
    false,
  );
  reveal.start();
  Timer.after(30, () => {
    reveal.destroy();
  });
});
```

## Native

[fogmodifier](/typings/3.0.0/interfaces/fogmodifier) ([jassbot](https://lep.duckdns.org/jassbot/doc/fogmodifier))

## Extends

- [`Handle`](Handle.md)\<`fogmodifier`\>

## Properties

### handle

> `readonly` **handle**: `fogmodifier`

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

### destroy()

> **destroy**(): `void`

Defined in: [handles/fogmodifier.ts:109](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/fogmodifier.ts#L109)

Destroys the FogModifier through its Native.

#### Returns

`void`

#### Remarks

In Dev mode the destroyed Wrapper becomes a tombstone: any later access,
a second `destroy()` included, raises
`reforged-ts: used after destroy: <Class>#<id>`, and
`Reforged.debug.report()` counts it destroyed.

#### Native

[DestroyFogModifier](/typings/3.0.0/functions/DestroyFogModifier) ([jassbot](https://lep.duckdns.org/jassbot/doc/DestroyFogModifier))

***

### start()

> **start**(): `void`

Defined in: [handles/fogmodifier.ts:119](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/fogmodifier.ts#L119)

Turns the fog modifier on: its state overrides the player's fog over its
area.

#### Returns

`void`

#### Native

[FogModifierStart](/typings/3.0.0/functions/FogModifierStart) ([jassbot](https://lep.duckdns.org/jassbot/doc/FogModifierStart))

***

### stop()

> **stop**(): `void`

Defined in: [handles/fogmodifier.ts:127](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/fogmodifier.ts#L127)

Turns the fog modifier off: the area returns to the player's own fog.

#### Returns

`void`

#### Native

[FogModifierStop](/typings/3.0.0/functions/FogModifierStop) ([jassbot](https://lep.duckdns.org/jassbot/doc/FogModifierStop))

***

### create()

> `static` **create**(`forWhichPlayer`, `whichState`, `centerX`, `centerY`, `radius`, `useSharedVision`, `afterUnits`): `FogModifier`

Defined in: [handles/fogmodifier.ts:39](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/fogmodifier.ts#L39)

Creates a stopped fog modifier over a circle.

#### Parameters

##### forWhichPlayer

[`MapPlayer`](MapPlayer.md)

The player whose fog it changes.

##### whichState

`fogstate`

The fog state forced on the area, such as
`FOG_OF_WAR_VISIBLE`.

##### centerX

`number`

The x-coordinate of the circle's centre, in world units.

##### centerY

`number`

The y-coordinate of the circle's centre, in world units.

##### radius

`number`

The radius of the circle, in world units.

##### useSharedVision

`boolean`

Whether the players sharing vision with
`forWhichPlayer` get the change too.

##### afterUnits

`boolean`

Whether a masking state also hides what the player's
units see in the area, units included; `false` masks only what they do
not see.

#### Returns

`FogModifier`

The new fog modifier.

#### Throws

When the game returns no handle:
`reforged-ts: failed to create FogModifier`, at the calling line. In Dev
mode, also when called before the globals Init stage or inside
`MapPlayer.runLocal`.

#### Native

[CreateFogModifierRadius](/typings/3.0.0/functions/CreateFogModifierRadius) ([jassbot](https://lep.duckdns.org/jassbot/doc/CreateFogModifierRadius))

***

### createAtPoint()

> `static` **createAtPoint**(`forWhichPlayer`, `whichState`, `center`, `radius`, `useSharedVision`, `afterUnits`): `FogModifier`

Defined in: [handles/fogmodifier.ts:80](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/fogmodifier.ts#L80)

Creates a stopped fog modifier over a circle around `center`, through
`CreateFogModifierRadiusLoc`.

#### Parameters

##### forWhichPlayer

[`MapPlayer`](MapPlayer.md)

The player whose fog it changes.

##### whichState

`fogstate`

The fog state forced on the area, such as
`FOG_OF_WAR_VISIBLE`.

##### center

[`Point`](Point.md)

The centre of the circle.

##### radius

`number`

The radius of the circle, in world units.

##### useSharedVision

`boolean`

Whether the players sharing vision with
`forWhichPlayer` get the change too.

##### afterUnits

`boolean`

Whether a masking state also hides what the player's
units see in the area; `false` masks only what they do not see.

#### Returns

`FogModifier`

The new fog modifier.

#### Throws

When the game returns no handle:
`reforged-ts: failed to create FogModifier`, at the calling line. In Dev
mode, also when called before the globals Init stage or inside
`MapPlayer.runLocal`.

#### Native

[CreateFogModifierRadiusLoc](/typings/3.0.0/functions/CreateFogModifierRadiusLoc) ([jassbot](https://lep.duckdns.org/jassbot/doc/CreateFogModifierRadiusLoc))

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

### fromRect()

> `static` **fromRect**(`forWhichPlayer`, `whichState`, `where`, `useSharedVision`, `afterUnits`): `FogModifier`

Defined in: [handles/fogmodifier.ts:150](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/fogmodifier.ts#L150)

Creates a stopped fog modifier over the rectangle `where`.

#### Parameters

##### forWhichPlayer

[`MapPlayer`](MapPlayer.md)

The player whose fog it changes.

##### whichState

`fogstate`

The fog state forced on the area, such as
`FOG_OF_WAR_VISIBLE`.

##### where

[`Rectangle`](Rectangle.md)

The rectangle the fog state is forced on.

##### useSharedVision

`boolean`

Whether the players sharing vision with
`forWhichPlayer` get the change too.

##### afterUnits

`boolean`

Whether a masking state also hides what the player's
units see in the area; `false` masks only what they do not see.

#### Returns

`FogModifier`

The new fog modifier.

#### Remarks

A creation, whatever its name says: each call makes a new fog modifier.

#### Throws

When the game returns no handle:
`reforged-ts: failed to create FogModifier`, at the calling line. In Dev
mode, also when called before the globals Init stage or inside
`MapPlayer.runLocal`.

#### Native

[CreateFogModifierRect](/typings/3.0.0/functions/CreateFogModifierRect) ([jassbot](https://lep.duckdns.org/jassbot/doc/CreateFogModifierRect))
