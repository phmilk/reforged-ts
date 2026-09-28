# Class: TextTag

Defined in: [handles/texttag.ts:20](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/texttag.ts#L20)

A floating text drawn in the world, such as the gold a kill earns: a text
at a point, which can drift, fade and expire.

## Remarks

- A text tag ages from 0, in seconds, unless suspended. A temporary one
  starts fading at its fadepoint and is destroyed at the end of its
  lifespan; a permanent one, as a new tag is, stays until destroyed.
- The game holds a limited number of text tags (10,000 in 3.0.0). When all
  exist, [TextTag.create](#create) gets back the one with id 0, with its
  settings, rather than a new one.

## Example

**A text rising above each dying unit**

```ts
// A red "Killed!" rising above each dying unit, fading out after one second
// and gone after two. A temporary text tag destroys itself: nothing keeps it.
import { Init, TextTag, Trigger, Unit } from "reforged-ts";

Init.onTriggers(() => {
  Trigger.create()
    .registerAnyUnitEvent(EVENT_PLAYER_UNIT_DEATH)
    .addAction(() => {
      const dying = Unit.fromDying();
      if (dying === undefined) {
        return;
      }
      const tag = TextTag.create();
      tag.setText("Killed!", 10, true);
      tag.setPosUnit(dying, 0);
      tag.setColor(255, 64, 64, 255);
      tag.setVelocityAngle(64, 90);
      tag.setPermanent(false);
      tag.setFadepoint(1);
      tag.setLifespan(2);
    });
});
```

## Native

[texttag](/typings/3.0.0/interfaces/texttag) ([jassbot](https://lep.duckdns.org/jassbot/doc/texttag))

## Extends

- [`Handle`](Handle.md)\<`texttag`\>

## Properties

### handle

> `readonly` **handle**: `texttag`

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

Defined in: [handles/texttag.ts:41](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/texttag.ts#L41)

Destroys the TextTag through its Native.

#### Returns

`void`

#### Remarks

In Dev mode the destroyed Wrapper becomes a tombstone: any later access,
a second `destroy()` included, raises
`reforged-ts: used after destroy: <Class>#<id>`, and
`Reforged.debug.report()` counts it destroyed.

#### Native

[DestroyTextTag](/typings/3.0.0/functions/DestroyTextTag) ([jassbot](https://lep.duckdns.org/jassbot/doc/DestroyTextTag))

***

### setAge()

> **setAge**(`age`): `void`

Defined in: [handles/texttag.ts:52](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/texttag.ts#L52)

Sets how long the text tag has existed, which places it along its drift,
fading and lifespan.

#### Parameters

##### age

`number`

The age, in seconds; a negative age delays all three.

#### Returns

`void`

#### Native

[SetTextTagAge](/typings/3.0.0/functions/SetTextTagAge) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetTextTagAge))

***

### setColor()

> **setColor**(`red`, `green`, `blue`, `alpha`): `void`

Defined in: [handles/texttag.ts:67](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/texttag.ts#L67)

Sets the colour of the text; it applies even while the tag fades.

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

The opacity, from 0 (transparent) to 255 (opaque).

#### Returns

`void`

#### Remarks

The alpha takes effect only while the tag is suspended
([TextTag.setSuspended](#setsuspended)).

#### Native

[SetTextTagColor](/typings/3.0.0/functions/SetTextTagColor) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetTextTagColor))

***

### setFadepoint()

> **setFadepoint**(`fadepoint`): `void`

Defined in: [handles/texttag.ts:77](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/texttag.ts#L77)

Sets the age at which a temporary text tag starts fading out, reaching
full transparency at the end of its lifespan.

#### Parameters

##### fadepoint

`number`

The age, in seconds.

#### Returns

`void`

#### Native

[SetTextTagFadepoint](/typings/3.0.0/functions/SetTextTagFadepoint) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetTextTagFadepoint))

***

### setLifespan()

> **setLifespan**(`lifespan`): `void`

Defined in: [handles/texttag.ts:87](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/texttag.ts#L87)

Sets the age at which a temporary text tag is destroyed.

#### Parameters

##### lifespan

`number`

The age, in seconds; 100 by default. Shorter than the
fadepoint, the tag disappears without fading.

#### Returns

`void`

#### Native

[SetTextTagLifespan](/typings/3.0.0/functions/SetTextTagLifespan) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetTextTagLifespan))

***

### setPermanent()

> **setPermanent**(`flag`): `void`

Defined in: [handles/texttag.ts:96](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/texttag.ts#L96)

Makes the text tag permanent, or temporary so that it fades and expires.

#### Parameters

##### flag

`boolean`

True for permanent, as a new tag is; false for temporary.

#### Returns

`void`

#### Native

[SetTextTagPermanent](/typings/3.0.0/functions/SetTextTagPermanent) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetTextTagPermanent))

***

### setPos()

> **setPos**(`x`, `y`, `heightOffset`): `void`

Defined in: [handles/texttag.ts:108](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/texttag.ts#L108)

Moves the text tag to a point, above the ground there.

#### Parameters

##### x

`number`

The x-coordinate, in world units.

##### y

`number`

The y-coordinate, in world units.

##### heightOffset

`number`

The height above the ground at the point, in world
units, as the ground is at the time of the call.

#### Returns

`void`

#### Native

[SetTextTagPos](/typings/3.0.0/functions/SetTextTagPos) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetTextTagPos))

***

### setPosUnit()

> **setPosUnit**(`u`, `heightOffset`): `void`

Defined in: [handles/texttag.ts:120](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/texttag.ts#L120)

Moves the text tag above a unit, where the unit stands now: it does not
follow the unit.

#### Parameters

##### u

[`Unit`](Unit.md)

The unit to move it above.

##### heightOffset

`number`

The height above the top of the unit's model, in
world units.

#### Returns

`void`

#### Native

[SetTextTagPosUnit](/typings/3.0.0/functions/SetTextTagPosUnit) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetTextTagPosUnit))

***

### setSuspended()

> **setSuspended**(`flag`): `void`

Defined in: [handles/texttag.ts:130](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/texttag.ts#L130)

Stops or resumes the text tag's ageing, which freezes its drift, fading
and lifespan.

#### Parameters

##### flag

`boolean`

True to stop the ageing, false to resume it.

#### Returns

`void`

#### Native

[SetTextTagSuspended](/typings/3.0.0/functions/SetTextTagSuspended) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetTextTagSuspended))

***

### setText()

> **setText**(`s`, `height`, `adjustHeight?`): `void`

Defined in: [handles/texttag.ts:144](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/texttag.ts#L144)

Sets the text and its size.

#### Parameters

##### s

`string`

The text; `"\n"` starts a new line.

##### height

`number`

The size of the text, relative to the screen: from about
0.02 to 0.1. With `adjustHeight`, a font size as the World Editor's
triggers give it, such as 10.

##### adjustHeight?

`boolean` = `false`

When true, `height` is a World Editor font size,
converted by multiplying it by 0.0023; false by default.

#### Returns

`void`

#### Native

[SetTextTagText](/typings/3.0.0/functions/SetTextTagText) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetTextTagText))

***

### setVelocity()

> **setVelocity**(`xvel`, `yvel`): `void`

Defined in: [handles/texttag.ts:158](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/texttag.ts#L158)

Makes the text tag drift as it ages, by an offset that grows with its age.

#### Parameters

##### xvel

`number`

The rightward velocity, relative to the screen rather than
in world units.

##### yvel

`number`

The upward velocity, relative to the screen.

#### Returns

`void`

#### Native

[SetTextTagVelocity](/typings/3.0.0/functions/SetTextTagVelocity) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetTextTagVelocity))

***

### setVelocityAngle()

> **setVelocityAngle**(`speed`, `angle`): `void`

Defined in: [handles/texttag.ts:171](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/texttag.ts#L171)

Makes the text tag drift as it ages, at a speed and in a direction.

#### Parameters

##### speed

`number`

The speed, in the World Editor's text tag units: 64 is a
common rising speed.

##### angle

`number`

The direction, in degrees: 0 to the right, 90 up.

#### Returns

`void`

#### Native

[SetTextTagVelocity](/typings/3.0.0/functions/SetTextTagVelocity) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetTextTagVelocity))

#### Native

[Cos](/typings/3.0.0/functions/Cos) ([jassbot](https://lep.duckdns.org/jassbot/doc/Cos))

#### Native

[Sin](/typings/3.0.0/functions/Sin) ([jassbot](https://lep.duckdns.org/jassbot/doc/Sin))

***

### setVisible()

> **setVisible**(`flag`): `void`

Defined in: [handles/texttag.ts:184](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/texttag.ts#L184)

Shows or hides the text tag, for every player.

#### Parameters

##### flag

`boolean`

True to show it, false to hide it.

#### Returns

`void`

#### Native

[SetTextTagVisibility](/typings/3.0.0/functions/SetTextTagVisibility) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetTextTagVisibility))

***

### create()

> `static` **create**(): `TextTag`

Defined in: [handles/texttag.ts:28](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/texttag.ts#L28)

Creates an empty, permanent text tag at the world's origin.

#### Returns

`TextTag`

The new text tag.

#### Throws

When the game returns no handle: `reforged-ts: failed to create TextTag`, at the calling line.
In Dev mode, also when called before the globals Init stage or inside `MapPlayer.runLocal`.

#### Native

[CreateTextTag](/typings/3.0.0/functions/CreateTextTag) ([jassbot](https://lep.duckdns.org/jassbot/doc/CreateTextTag))

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
