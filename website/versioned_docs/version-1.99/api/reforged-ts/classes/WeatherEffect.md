# Class: WeatherEffect

Defined in: [handles/weathereffect.ts:16](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/weathereffect.ts#L16)

A weather effect: rain, snow, wind or another weather type from the
game's weather table, shown over a rectangle.

## Remarks

A new weather effect is off: `enable(true)` turns it on.

## Example

**Heavy rain over the centre of the map**

```ts
// Ashenvale heavy rain over the centre of the map. A weather effect is
// created off, so it is enabled right after.
import { Init, Rectangle, WeatherEffect } from "reforged-ts";

Init.onGameStart(() => {
  const area = Rectangle.create(-2048, -2048, 2048, 2048);
  const rain = WeatherEffect.create(area, FourCC("RAhr"));
  rain.enable(true);
});
```

## Native

[weathereffect](/typings/3.0.0/interfaces/weathereffect) ([jassbot](https://lep.duckdns.org/jassbot/doc/weathereffect))

## Extends

- [`Handle`](Handle.md)\<`weathereffect`\>

## Properties

### handle

> `readonly` **handle**: `weathereffect`

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

Defined in: [handles/weathereffect.ts:50](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/weathereffect.ts#L50)

Destroys the WeatherEffect through its Native.

#### Returns

`void`

#### Remarks

In Dev mode the destroyed Wrapper becomes a tombstone: any later access,
a second `destroy()` included, raises
`reforged-ts: used after destroy: <Class>#<id>`, and
`Reforged.debug.report()` counts it destroyed.

#### Native

[RemoveWeatherEffect](/typings/3.0.0/functions/RemoveWeatherEffect) ([jassbot](https://lep.duckdns.org/jassbot/doc/RemoveWeatherEffect))

***

### enable()

> **enable**(`flag`): `void`

Defined in: [handles/weathereffect.ts:60](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/weathereffect.ts#L60)

Turns the weather on or off, with a gradual transition.

#### Parameters

##### flag

`boolean`

`true` to turn it on, `false` to turn it off.

#### Returns

`void`

#### Native

[EnableWeatherEffect](/typings/3.0.0/functions/EnableWeatherEffect) ([jassbot](https://lep.duckdns.org/jassbot/doc/EnableWeatherEffect))

***

### create()

> `static` **create**(`where`, `effectID`): `WeatherEffect`

Defined in: [handles/weathereffect.ts:34](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/weathereffect.ts#L34)

Adds a weather effect.

#### Parameters

##### where

[`Rectangle`](Rectangle.md)

The rectangle the weather shows over.

##### effectID

`number`

The weather type's rawcode, such as `FourCC("RAhr")`
for Ashenvale heavy rain.

#### Returns

`WeatherEffect`

The new weather effect, turned off.

#### Remarks

- How weather effects work: Ammorth's article on wc3c, [http://www.wc3c.net/showthread.php?t=91176](https://web.archive.org/web/20180130202056/http://www.wc3c.net/showthread.php?t=91176).
- Making weather effects of your own: CryoniC's article on wc3c, [http://www.wc3c.net/showthread.php?t=67949](https://web.archive.org/web/20180507060112/http://www.wc3c.net/showthread.php?t=67949).
- The error message names the WeatherEffect. In w3ts 3.x it read
  `w3ts failed to create unit handle.`, naming the wrong Handle type.

#### Throws

When the game returns no handle:
`reforged-ts: failed to create WeatherEffect (<effectID>)`, at the calling
line, the id as its rawcode string. In Dev mode, also when called before
the globals Init stage or inside `MapPlayer.runLocal`.

#### Native

[AddWeatherEffect](/typings/3.0.0/functions/AddWeatherEffect) ([jassbot](https://lep.duckdns.org/jassbot/doc/AddWeatherEffect))

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
