# Class: Ubersplat

Defined in: [handles/ubersplat.ts:16](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/ubersplat.ts#L16)

An ubersplat: a texture laid on the terrain from the game's ubersplat
table, such as the ground under a building or a scorch mark.

## Remarks

The name given to `create` is the row of `Splats\UberSplatData.slk` that
sets the texture, its size and its lifetime; the map's own ubersplats come
from the same table.

## Example

**A building's ground texture at the centre of the map**

```ts
// The ground texture of a medium human building, laid at the centre of the
// map without a building: forcePaused keeps it from fading away.
import { Init, Ubersplat } from "reforged-ts";

Init.onGameStart(() => {
  const splat = Ubersplat.create(0, 0, "HMED", 255, 255, 255, 255, true, true);
  splat.render(true, true);
  splat.show(true);
});
```

## Native

[ubersplat](/typings/3.0.0/interfaces/ubersplat) ([jassbot](https://lep.duckdns.org/jassbot/doc/ubersplat))

## Extends

- [`Handle`](Handle.md)\<`ubersplat`\>

## Properties

### handle

> `readonly` **handle**: `ubersplat`

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

Defined in: [handles/ubersplat.ts:73](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/ubersplat.ts#L73)

Destroys the Ubersplat through its Native.

#### Returns

`void`

#### Remarks

In Dev mode the destroyed Wrapper becomes a tombstone: any later access,
a second `destroy()` included, raises
`reforged-ts: used after destroy: <Class>#<id>`, and
`Reforged.debug.report()` counts it destroyed.

#### Native

[DestroyUbersplat](/typings/3.0.0/functions/DestroyUbersplat) ([jassbot](https://lep.duckdns.org/jassbot/doc/DestroyUbersplat))

***

### finish()

> **finish**(): `void`

Defined in: [handles/ubersplat.ts:83](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/ubersplat.ts#L83)

Would move the ubersplat to the end of its lifetime.

#### Returns

`void`

#### Native

[FinishUbersplat](/typings/3.0.0/functions/FinishUbersplat) ([jassbot](https://lep.duckdns.org/jassbot/doc/FinishUbersplat))

#### Bug

The Native has no effect.

***

### render()

> **render**(`flag`, `always?`): `void`

Defined in: [handles/ubersplat.ts:96](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/ubersplat.ts#L96)

Sets whether the game draws the ubersplat.

#### Parameters

##### flag

`boolean`

`true` to draw it.

##### always?

`boolean` = `false`

Whether to set the flag that keeps it drawn always,
through `SetUbersplatRenderAlways`, instead of the plain one, through
`SetUbersplatRender`; the plain one when left out.

#### Returns

`void`

#### Native

[SetUbersplatRenderAlways](/typings/3.0.0/functions/SetUbersplatRenderAlways) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetUbersplatRenderAlways))

#### Native

[SetUbersplatRender](/typings/3.0.0/functions/SetUbersplatRender) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetUbersplatRender))

***

### reset()

> **reset**(): `void`

Defined in: [handles/ubersplat.ts:109](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/ubersplat.ts#L109)

Would restart the ubersplat's lifetime from its birth.

#### Returns

`void`

#### Native

[ResetUbersplat](/typings/3.0.0/functions/ResetUbersplat) ([jassbot](https://lep.duckdns.org/jassbot/doc/ResetUbersplat))

#### Bug

The Native has no effect.

***

### show()

> **show**(`flag`): `void`

Defined in: [handles/ubersplat.ts:118](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/ubersplat.ts#L118)

Shows or hides the ubersplat.

#### Parameters

##### flag

`boolean`

`true` to show it, `false` to hide it.

#### Returns

`void`

#### Native

[ShowUbersplat](/typings/3.0.0/functions/ShowUbersplat) ([jassbot](https://lep.duckdns.org/jassbot/doc/ShowUbersplat))

***

### create()

> `static` **create**(`x`, `y`, `name`, `red`, `green`, `blue`, `alpha`, `forcePaused`, `noBirthTime`): `Ubersplat`

Defined in: [handles/ubersplat.ts:37](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/ubersplat.ts#L37)

Creates an ubersplat on the terrain at the given point.

#### Parameters

##### x

`number`

The x-coordinate of its centre, in world units.

##### y

`number`

The y-coordinate of its centre, in world units.

##### name

`string`

The ubersplat type: the name of its row in
`Splats\UberSplatData.slk`.

##### red

`number`

The red channel of its tint, from 0 to 255.

##### green

`number`

The green channel of its tint, from 0 to 255.

##### blue

`number`

The blue channel of its tint, from 0 to 255.

##### alpha

`number`

Its opacity, from 0 (invisible) to 255 (opaque).

##### forcePaused

`boolean`

Whether it stays as it is instead of going through
its lifetime and fading away.

##### noBirthTime

`boolean`

Whether it skips its birth, appearing at once.

#### Returns

`Ubersplat`

The new ubersplat.

#### Throws

When the game returns no handle:
`reforged-ts: failed to create Ubersplat (<name>)`, at the calling line.
In Dev mode, also when called before the globals Init stage or inside
`MapPlayer.runLocal`.

#### Native

[CreateUbersplat](/typings/3.0.0/functions/CreateUbersplat) ([jassbot](https://lep.duckdns.org/jassbot/doc/CreateUbersplat))

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
