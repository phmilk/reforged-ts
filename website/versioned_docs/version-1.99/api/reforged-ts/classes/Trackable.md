# Class: Trackable

Defined in: [handles/trackable.ts:13](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/trackable.ts#L13)

An invisible model that reports clicks and mouse-overs, for the trackable
events. The game has no Native that destroys a trackable, so the Wrapper
has no `destroy`.

## Example

**Printing a message when a trackable is clicked**

```ts
// A clickable spot on the map: the trackable shows a model, and the hit
// event reads back the one clicked.
import { Init, on, Trackable, TrackableEvents } from "reforged-ts";

Init.onTriggers(() => {
  const button = Trackable.create(
    "Doodads\\Cinematic\\GlowingRunes\\GlowingRunes0.mdl",
    0,
    0,
    270,
  );
  on(TrackableEvents.hit(button), ({ trackable }) => {
    print(`Trackable ${String(trackable.id)} clicked`);
  });
});
```

## Native

[trackable](/typings/3.0.0/interfaces/trackable) ([jassbot](https://lep.duckdns.org/jassbot/doc/trackable))

## Extends

- [`Handle`](Handle.md)\<`trackable`\>

## Properties

### handle

> `readonly` **handle**: `trackable`

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

### create()

> `static` **create**(`modelPath`, `x`, `y`, `facing`): `Trackable`

Defined in: [handles/trackable.ts:28](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/trackable.ts#L28)

Creates a trackable with the given model at the given point.

#### Parameters

##### modelPath

`string`

The model's path; the model's shape is what reacts to
the mouse.

##### x

`number`

The x-coordinate, in world units.

##### y

`number`

The y-coordinate, in world units.

##### facing

`number`

The facing, in degrees.

#### Returns

`Trackable`

The new trackable.

#### Throws

When the game returns no handle:
`reforged-ts: failed to create Trackable (<modelPath>)`, at the calling line.
In Dev mode, also when called before the globals Init stage or inside
`MapPlayer.runLocal`.

#### Native

[CreateTrackable](/typings/3.0.0/functions/CreateTrackable) ([jassbot](https://lep.duckdns.org/jassbot/doc/CreateTrackable))

***

### fromEvent()

> `static` **fromEvent**(): `Trackable` \| `undefined`

Defined in: [handles/trackable.ts:43](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/trackable.ts#L43)

Gets the trackable of the trackable event being handled.

#### Returns

`Trackable` \| `undefined`

The trackable clicked or moused over, or `undefined` outside a
trackable event.

#### Native

[GetTriggeringTrackable](/typings/3.0.0/functions/GetTriggeringTrackable) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetTriggeringTrackable))

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
