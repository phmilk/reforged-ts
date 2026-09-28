# Class: Effect

Defined in: [handles/effect.ts:28](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/effect.ts#L28)

A special effect: a model shown on the map, standing at a point or attached
to a widget.

## Remarks

- Destroying an effect plays its model's death animation, so an effect
  destroyed right after its creation is still seen once:
  `Effect.create(model, x, y).destroy()` is the usual one-shot.
- The position and orientation members act on a free effect only: an effect
  attached to a widget follows the widget's attachment point.
- The `x`, `y` and `z` getters read the local client's value: see `x`.

## Example

**One-shot and attached effects**

```ts
// Two common effects. A one-shot, destroyed at once: the model still plays
// its death animation. And a marker over a unit's head, removed ten seconds
// later.
import { Effect, Init, Timer, Unit, tsGlobals } from "reforged-ts";

Init.onTriggers(() => {
  Effect.create(
    "Abilities\\Spells\\Human\\ThunderClap\\ThunderClapCaster.mdl",
    0,
    0,
  ).destroy();

  const footman = Unit.create(tsGlobals.Players[0], FourCC("hfoo"), 256, 0);
  const marker = Effect.createAttachment(
    "Abilities\\Spells\\Other\\TalkToMe\\TalkToMe.mdl",
    footman,
    "overhead",
  );
  Timer.after(10, () => {
    marker.destroy();
  });
});
```

## Native

[effect](/typings/3.0.0/interfaces/effect) ([jassbot](https://lep.duckdns.org/jassbot/doc/effect))

## Extends

- [`Handle`](Handle.md)\<`effect`\>

## Properties

### attachPointName?

> `readonly` `optional` **attachPointName?**: `string`

Defined in: [handles/effect.ts:33](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/effect.ts#L33)

The attachment point it was attached to, when it was created attached.

***

### attachWidget?

> `readonly` `optional` **attachWidget?**: [`Widget`](Widget.md)

Defined in: [handles/effect.ts:30](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/effect.ts#L30)

The widget the effect was attached to, when it was created attached.

***

### handle

> `readonly` **handle**: `effect`

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

***

### scale

#### Get Signature

> **get** **scale**(): `number`

Defined in: [handles/effect.ts:225](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/effect.ts#L225)

Gets the scale of the whole model, a ratio where 1 is the model's own
size.

##### Native

[BlzGetSpecialEffectScale](/typings/3.0.0/functions/BlzGetSpecialEffectScale) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzGetSpecialEffectScale))

##### Returns

`number`

The scale ratio.

#### Set Signature

> **set** **scale**(`scale`): `void`

Defined in: [handles/effect.ts:235](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/effect.ts#L235)

The scale of the whole model, a ratio where 1 is the model's own size; a
negative scale mirrors the model on every axis. It multiplies the scale
matrix of `setScaleMatrix`.

##### Native

[BlzSetSpecialEffectScale](/typings/3.0.0/functions/BlzSetSpecialEffectScale) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzSetSpecialEffectScale))

##### Parameters

###### scale

`number`

##### Returns

`void`

***

### x

#### Get Signature

> **get** **x**(): `number`

Defined in: [handles/effect.ts:248](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/effect.ts#L248)

**`Async`**

Gets the effect's x-coordinate as the local client sees it.

##### Remarks

The value can differ between clients: never let it decide game state.
An attached effect reports 0.

##### Native

[BlzGetLocalSpecialEffectX](/typings/3.0.0/functions/BlzGetLocalSpecialEffectX) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzGetLocalSpecialEffectX))

##### Returns

`number`

The x-coordinate, in world units.

#### Set Signature

> **set** **x**(`x`): `void`

Defined in: [handles/effect.ts:257](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/effect.ts#L257)

The effect's x-coordinate, in world units, on every client. Setting it
moves a free effect and does nothing to an attached one.

##### Native

[BlzSetSpecialEffectX](/typings/3.0.0/functions/BlzSetSpecialEffectX) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzSetSpecialEffectX))

##### Parameters

###### x

`number`

##### Returns

`void`

***

### y

#### Get Signature

> **get** **y**(): `number`

Defined in: [handles/effect.ts:270](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/effect.ts#L270)

**`Async`**

Gets the effect's y-coordinate as the local client sees it.

##### Remarks

The value can differ between clients: never let it decide game state.
An attached effect reports 0.

##### Native

[BlzGetLocalSpecialEffectY](/typings/3.0.0/functions/BlzGetLocalSpecialEffectY) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzGetLocalSpecialEffectY))

##### Returns

`number`

The y-coordinate, in world units.

#### Set Signature

> **set** **y**(`y`): `void`

Defined in: [handles/effect.ts:279](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/effect.ts#L279)

The effect's y-coordinate, in world units, on every client. Setting it
moves a free effect and does nothing to an attached one.

##### Native

[BlzSetSpecialEffectY](/typings/3.0.0/functions/BlzSetSpecialEffectY) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzSetSpecialEffectY))

##### Parameters

###### y

`number`

##### Returns

`void`

***

### z

#### Get Signature

> **get** **z**(): `number`

Defined in: [handles/effect.ts:293](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/effect.ts#L293)

**`Async`**

Gets the effect's height as the local client sees it.

##### Remarks

The value can differ between clients: never let it decide game state.
An attached effect reports 0.

##### Native

[BlzGetLocalSpecialEffectZ](/typings/3.0.0/functions/BlzGetLocalSpecialEffectZ) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzGetLocalSpecialEffectZ))

##### Returns

`number`

The z-coordinate, in world units above the map's zero level,
not above the ground.

#### Set Signature

> **set** **z**(`z`): `void`

Defined in: [handles/effect.ts:303](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/effect.ts#L303)

The effect's z-coordinate, in world units above the map's zero level, on
every client. Setting it moves a free effect and does nothing to an
attached one.

##### Native

[BlzSetSpecialEffectZ](/typings/3.0.0/functions/BlzSetSpecialEffectZ) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzSetSpecialEffectZ))

##### Parameters

###### z

`number`

##### Returns

`void`

## Methods

### addSubAnimation()

> **addSubAnimation**(`subAnim`): `void`

Defined in: [handles/effect.ts:314](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/effect.ts#L314)

Adds a subanimation tag, such as `SUBANIM_TYPE_SLAM`, to the animations
the effect plays next: with it, `playAnimation(ANIM_TYPE_ATTACK)` plays
the model's "attack slam".

#### Parameters

##### subAnim

`subanimtype`

The subanimation tag to add.

#### Returns

`void`

#### Native

[BlzSpecialEffectAddSubAnimation](/typings/3.0.0/functions/BlzSpecialEffectAddSubAnimation) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzSpecialEffectAddSubAnimation))

***

### clearSubAnimations()

> **clearSubAnimations**(): `void`

Defined in: [handles/effect.ts:323](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/effect.ts#L323)

Removes every subanimation tag that `addSubAnimation` added; the
animation types are left as they are.

#### Returns

`void`

#### Native

[BlzSpecialEffectClearSubAnimations](/typings/3.0.0/functions/BlzSpecialEffectClearSubAnimations) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzSpecialEffectClearSubAnimations))

***

### destroy()

> **destroy**(): `void`

Defined in: [handles/effect.ts:336](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/effect.ts#L336)

Destroys the effect, which plays its model's death animation first.

#### Returns

`void`

#### Remarks

In Dev mode the destroyed Wrapper becomes a tombstone: any later access,
a second `destroy()` included, raises
`reforged-ts: used after destroy: <Class>#<id>`, and
`Reforged.debug.report()` counts it destroyed.

#### Native

[DestroyEffect](/typings/3.0.0/functions/DestroyEffect) ([jassbot](https://lep.duckdns.org/jassbot/doc/DestroyEffect))

***

### playAnimation()

> **playAnimation**(`animType`): `void`

Defined in: [handles/effect.ts:347](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/effect.ts#L347)

Plays the model's animation of the given type, with the subanimation tags
the effect has, replacing the one it plays.

#### Parameters

##### animType

`animtype`

The animation type, such as `ANIM_TYPE_SPELL`.

#### Returns

`void`

#### Native

[BlzPlaySpecialEffect](/typings/3.0.0/functions/BlzPlaySpecialEffect) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzPlaySpecialEffect))

***

### playWithTimeScale()

> **playWithTimeScale**(`animType`, `timeScale`): `void`

Defined in: [handles/effect.ts:358](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/effect.ts#L358)

Plays the model's animation of the given type at a given speed, replacing
the one it plays.

#### Parameters

##### animType

`animtype`

The animation type, such as `ANIM_TYPE_SPELL`.

##### timeScale

`number`

The speed, where 1 is the animation's own.

#### Returns

`void`

#### Native

[BlzPlaySpecialEffectWithTimeScale](/typings/3.0.0/functions/BlzPlaySpecialEffectWithTimeScale) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzPlaySpecialEffectWithTimeScale))

***

### queueAnimation()

> **queueAnimation**(`name`): `void`

Defined in: [handles/effect.ts:368](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/effect.ts#L368)

Queues the named animation after the current one, through
`BlzQueueSpecialEffectAnimation` (3.0.0).

#### Parameters

##### name

`string`

The animation's name in the model, such as `"stand"`.

#### Returns

`void`

#### Native

[BlzQueueSpecialEffectAnimation](/typings/3.0.0/functions/BlzQueueSpecialEffectAnimation) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzQueueSpecialEffectAnimation))

***

### removeSubAnimation()

> **removeSubAnimation**(`subAnim`): `void`

Defined in: [handles/effect.ts:377](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/effect.ts#L377)

Removes one subanimation tag that `addSubAnimation` added.

#### Parameters

##### subAnim

`subanimtype`

The subanimation tag to remove.

#### Returns

`void`

#### Native

[BlzSpecialEffectRemoveSubAnimation](/typings/3.0.0/functions/BlzSpecialEffectRemoveSubAnimation) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzSpecialEffectRemoveSubAnimation))

***

### resetScaleMatrix()

> **resetScaleMatrix**(): `void`

Defined in: [handles/effect.ts:388](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/effect.ts#L388)

Resets the scale matrix of `setScaleMatrix` to 1 on every axis; the
`scale` is left as it is.

#### Returns

`void`

#### Native

[BlzResetSpecialEffectMatrix](/typings/3.0.0/functions/BlzResetSpecialEffectMatrix) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzResetSpecialEffectMatrix))

#### Bug

Reported on patch 1.36.2 to reset the yaw, pitch and roll too: set
the orientation again after it.

***

### setAlpha()

> **setAlpha**(`alpha`): `void`

Defined in: [handles/effect.ts:399](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/effect.ts#L399)

Sets how opaque the effect's own model is; an attached effect does not
change, and takes the transparency of the unit or effect carrying it.

#### Parameters

##### alpha

`number`

From 0 (invisible) to 255 (opaque); a value outside that
range does nothing.

#### Returns

`void`

#### Native

[BlzSetSpecialEffectAlpha](/typings/3.0.0/functions/BlzSetSpecialEffectAlpha) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzSetSpecialEffectAlpha))

***

### setAnimation()

> **setAnimation**(`name`): `void`

Defined in: [handles/effect.ts:409](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/effect.ts#L409)

Plays the named animation, through `BlzSetSpecialEffectAnimation`
(3.0.0).

#### Parameters

##### name

`string`

The animation's name in the model, such as `"stand"`.

#### Returns

`void`

#### Native

[BlzSetSpecialEffectAnimation](/typings/3.0.0/functions/BlzSetSpecialEffectAnimation) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzSetSpecialEffectAnimation))

***

### setAnimationBlendTime()

> **setAnimationBlendTime**(`seconds`): `void`

Defined in: [handles/effect.ts:419](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/effect.ts#L419)

Sets the time in seconds the effect takes to blend into its next
animation, through `BlzSetSpecialEffectAnimationBlendTime` (3.0.0).

#### Parameters

##### seconds

`number`

The blend time, in seconds.

#### Returns

`void`

#### Native

[BlzSetSpecialEffectAnimationBlendTime](/typings/3.0.0/functions/BlzSetSpecialEffectAnimationBlendTime) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzSetSpecialEffectAnimationBlendTime))

***

### setColor()

> **setColor**(`red`, `green`, `blue`): `void`

Defined in: [handles/effect.ts:431](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/effect.ts#L431)

Tints the whole model by scaling its colour channels, as a unit's vertex
colour does; 255 on each keeps the model's own colours.

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

#### Returns

`void`

#### Native

[BlzSetSpecialEffectColor](/typings/3.0.0/functions/BlzSetSpecialEffectColor) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzSetSpecialEffectColor))

***

### setColorByPlayer()

> **setColorByPlayer**(`whichPlayer`): `void`

Defined in: [handles/effect.ts:441](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/effect.ts#L441)

Paints the model's team-colour parts in a player's colour; a model with no
team-colour parts does not change.

#### Parameters

##### whichPlayer

[`MapPlayer`](MapPlayer.md)

The player whose colour to use.

#### Returns

`void`

#### Native

[BlzSetSpecialEffectColorByPlayer](/typings/3.0.0/functions/BlzSetSpecialEffectColorByPlayer) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzSetSpecialEffectColorByPlayer))

***

### setHeight()

> **setHeight**(`height`): `void`

Defined in: [handles/effect.ts:452](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/effect.ts#L452)

Moves a free effect to a height, as the `z` setter does.

#### Parameters

##### height

`number`

The z-coordinate, in world units.

#### Returns

`void`

#### Native

[BlzSetSpecialEffectHeight](/typings/3.0.0/functions/BlzSetSpecialEffectHeight) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzSetSpecialEffectHeight))

#### Bug

Reported on patch 1.36.2 to crash the game on an attached effect:
call it on free effects only.

***

### setOrientation()

> **setOrientation**(`yaw`, `pitch`, `roll`): `void`

Defined in: [handles/effect.ts:464](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/effect.ts#L464)

Rotates a free effect on all three axes at once.

#### Parameters

##### yaw

`number`

The rotation around the z-axis, in radians, as a unit's
facing.

##### pitch

`number`

The rotation around the y-axis, in radians.

##### roll

`number`

The rotation around the x-axis, in radians.

#### Returns

`void`

#### Native

[BlzSetSpecialEffectOrientation](/typings/3.0.0/functions/BlzSetSpecialEffectOrientation) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzSetSpecialEffectOrientation))

***

### setPitch()

> **setPitch**(`pitch`): `void`

Defined in: [handles/effect.ts:473](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/effect.ts#L473)

Rotates a free effect around its y-axis.

#### Parameters

##### pitch

`number`

The rotation, in radians.

#### Returns

`void`

#### Native

[BlzSetSpecialEffectPitch](/typings/3.0.0/functions/BlzSetSpecialEffectPitch) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzSetSpecialEffectPitch))

***

### setPoint()

> **setPoint**(`p`): `void`

Defined in: [handles/effect.ts:482](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/effect.ts#L482)

Moves a free effect to a point's x and y.

#### Parameters

##### p

[`Point`](Point.md)

The point to move to.

#### Returns

`void`

#### Native

[BlzSetSpecialEffectPositionLoc](/typings/3.0.0/functions/BlzSetSpecialEffectPositionLoc) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzSetSpecialEffectPositionLoc))

***

### setPosition()

> **setPosition**(`x`, `y`, `z`): `void`

Defined in: [handles/effect.ts:493](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/effect.ts#L493)

Moves a free effect to the given coordinates.

#### Parameters

##### x

`number`

The x-coordinate, in world units.

##### y

`number`

The y-coordinate, in world units.

##### z

`number`

The z-coordinate, in world units above the map's zero level.

#### Returns

`void`

#### Native

[BlzSetSpecialEffectPosition](/typings/3.0.0/functions/BlzSetSpecialEffectPosition) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzSetSpecialEffectPosition))

***

### setRoll()

> **setRoll**(`roll`): `void`

Defined in: [handles/effect.ts:502](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/effect.ts#L502)

Rotates a free effect around its x-axis.

#### Parameters

##### roll

`number`

The rotation, in radians.

#### Returns

`void`

#### Native

[BlzSetSpecialEffectRoll](/typings/3.0.0/functions/BlzSetSpecialEffectRoll) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzSetSpecialEffectRoll))

***

### setScaleMatrix()

> **setScaleMatrix**(`x`, `y`, `z`): `void`

Defined in: [handles/effect.ts:513](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/effect.ts#L513)

Stretches the model on each axis; the result is multiplied by `scale`.

#### Parameters

##### x

`number`

The ratio along the x-axis, where 1 is the model's own size.

##### y

`number`

The ratio along the y-axis.

##### z

`number`

The ratio along the z-axis.

#### Returns

`void`

#### Native

[BlzSetSpecialEffectMatrixScale](/typings/3.0.0/functions/BlzSetSpecialEffectMatrixScale) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzSetSpecialEffectMatrixScale))

***

### setTime()

> **setTime**(`value`): `void`

Defined in: [handles/effect.ts:522](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/effect.ts#L522)

Moves the effect's current animation to a point in its playback.

#### Parameters

##### value

`number`

The time from the animation's start, in seconds.

#### Returns

`void`

#### Native

[BlzSetSpecialEffectTime](/typings/3.0.0/functions/BlzSetSpecialEffectTime) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzSetSpecialEffectTime))

***

### setTimeScale()

> **setTimeScale**(`timeScale`): `void`

Defined in: [handles/effect.ts:532](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/effect.ts#L532)

Sets the speed of the effect's animations.

#### Parameters

##### timeScale

`number`

The speed, where 1 is the animation's own and 0 holds
it still.

#### Returns

`void`

#### Native

[BlzSetSpecialEffectTimeScale](/typings/3.0.0/functions/BlzSetSpecialEffectTimeScale) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzSetSpecialEffectTimeScale))

***

### setYaw()

> **setYaw**(`y`): `void`

Defined in: [handles/effect.ts:541](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/effect.ts#L541)

Rotates a free effect around its z-axis, as a unit turns to face.

#### Parameters

##### y

`number`

The yaw, in radians.

#### Returns

`void`

#### Native

[BlzSetSpecialEffectYaw](/typings/3.0.0/functions/BlzSetSpecialEffectYaw) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzSetSpecialEffectYaw))

***

### create()

> `static` **create**(`modelName`, `x`, `y`): `Effect`

Defined in: [handles/effect.ts:47](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/effect.ts#L47)

Creates a special effect standing on the ground at the given point.

#### Parameters

##### modelName

`string`

The model file the effect shows.

##### x

`number`

The x-coordinate, in world units.

##### y

`number`

The y-coordinate, in world units.

#### Returns

`Effect`

The new effect.

#### Throws

When the game returns no handle:
`reforged-ts: failed to create Effect (<modelName>)`, at the calling line.
In Dev mode, also when called before the globals Init stage or inside
`MapPlayer.runLocal`.

#### Native

[AddSpecialEffect](/typings/3.0.0/functions/AddSpecialEffect) ([jassbot](https://lep.duckdns.org/jassbot/doc/AddSpecialEffect))

***

### createAtPoint()

> `static` **createAtPoint**(`modelName`, `where`): `Effect`

Defined in: [handles/effect.ts:62](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/effect.ts#L62)

Creates a special effect at `where`, through `AddSpecialEffectLoc`.

#### Parameters

##### modelName

`string`

The model file the effect shows.

##### where

[`Point`](Point.md)

The point to stand the effect on.

#### Returns

`Effect`

The new effect.

#### Throws

When the game returns no handle:
`reforged-ts: failed to create Effect (<modelName>)`, at the calling line.
In Dev mode, also when called before the globals Init stage or inside
`MapPlayer.runLocal`.

#### Native

[AddSpecialEffectLoc](/typings/3.0.0/functions/AddSpecialEffectLoc) ([jassbot](https://lep.duckdns.org/jassbot/doc/AddSpecialEffectLoc))

***

### createAttachment()

> `static` **createAttachment**(`modelName`, `targetWidget`, `attachPointName`): `Effect`

Defined in: [handles/effect.ts:83](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/effect.ts#L83)

Creates a special effect attached to a widget.

#### Parameters

##### modelName

`string`

The model file the effect shows.

##### targetWidget

[`Widget`](Widget.md)

The unit, item or destructable that carries the
effect.

##### attachPointName

`string`

The attachment point of the widget's model: a
named spot of the model that spells and this call attach effects to,
such as `"origin"` or `"overhead"`. A point the model lacks puts the
effect at the model's origin.

#### Returns

`Effect`

The new effect, which keeps `targetWidget` and `attachPointName`
in its `attachWidget` and `attachPointName`.

#### Throws

When the game returns no handle:
`reforged-ts: failed to create Effect (<modelName>)`, at the calling line.
In Dev mode, also when called before the globals Init stage or inside
`MapPlayer.runLocal`.

#### Native

[AddSpecialEffectTarget](/typings/3.0.0/functions/AddSpecialEffectTarget) ([jassbot](https://lep.duckdns.org/jassbot/doc/AddSpecialEffectTarget))

***

### createSpell()

> `static` **createSpell**(`ability`, `effectType`, `x`, `y`): `Effect`

Defined in: [handles/effect.ts:119](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/effect.ts#L119)

Creates a spell visual effect at position, through `AddSpellEffectById`
for an ability id and `AddSpellEffect` for an ability string.

#### Parameters

##### ability

`string` \| `number`

The ability whose art to show: its rawcode, such as
`FourCC("AHtc")`, or an ability string (see the bug below).

##### effectType

`effecttype`

Which of the ability's art fields to use, such as
`EFFECT_TYPE_CASTER` or `EFFECT_TYPE_TARGET`.

##### x

`number`

The x-coordinate, in world units.

##### y

`number`

The y-coordinate, in world units.

#### Returns

`Effect`

The new effect.

#### Example

```ts
// Thunder Clap's caster art at the center of the map: the ability id picks
// the art, the effect type which of its models.
import { Effect, Init } from "reforged-ts";

Init.onTriggers(() => {
  Effect.createSpell(FourCC("AHtc"), EFFECT_TYPE_CASTER, 0, 0);
});
```

#### Throws

When the game returns no handle:
`reforged-ts: failed to create Effect (<ability>)`, at the calling line,
the ability as its rawcode string or as given. In Dev mode, also when
called before the globals Init stage or inside `MapPlayer.runLocal`.

#### Native

[AddSpellEffectById](/typings/3.0.0/functions/AddSpellEffectById) ([jassbot](https://lep.duckdns.org/jassbot/doc/AddSpellEffectById))

#### Native

[AddSpellEffect](/typings/3.0.0/functions/AddSpellEffect) ([jassbot](https://lep.duckdns.org/jassbot/doc/AddSpellEffect))

#### Bug

jassdoc documents `AddSpellEffect` as doing nothing, because no one
knows what its ability string is: pass the ability id.

***

### createSpellAtPoint()

> `static` **createSpellAtPoint**(`ability`, `effectType`, `where`): `Effect`

Defined in: [handles/effect.ts:152](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/effect.ts#L152)

Creates a spell visual effect at `where`, through `AddSpellEffectByIdLoc`
for an ability id and `AddSpellEffectLoc` for an ability string.

#### Parameters

##### ability

`string` \| `number`

The ability whose art to show: its rawcode, such as
`FourCC("AHtc")`, or an ability string (see the bug below).

##### effectType

`effecttype`

Which of the ability's art fields to use, such as
`EFFECT_TYPE_CASTER` or `EFFECT_TYPE_TARGET`.

##### where

[`Point`](Point.md)

The point to stand the effect on.

#### Returns

`Effect`

The new effect.

#### Throws

When the game returns no handle:
`reforged-ts: failed to create Effect (<ability>)`, at the calling line,
the ability as its rawcode string or as given. In Dev mode, also when
called before the globals Init stage or inside `MapPlayer.runLocal`.

#### Native

[AddSpellEffectByIdLoc](/typings/3.0.0/functions/AddSpellEffectByIdLoc) ([jassbot](https://lep.duckdns.org/jassbot/doc/AddSpellEffectByIdLoc))

#### Native

[AddSpellEffectLoc](/typings/3.0.0/functions/AddSpellEffectLoc) ([jassbot](https://lep.duckdns.org/jassbot/doc/AddSpellEffectLoc))

#### Bug

jassdoc documents `AddSpellEffect` as doing nothing, because no one
knows what its ability string is; `AddSpellEffectLoc` takes the same
string. Pass the ability id.

***

### createSpellAttachment()

> `static` **createSpellAttachment**(`ability`, `effectType`, `targetWidget`, `attachPointName`): `Effect`

Defined in: [handles/effect.ts:191](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/effect.ts#L191)

Creates a spell visual effect attached to a widget, through
`AddSpellEffectTargetById` for an ability id and `AddSpellEffectTarget`
for a string.

#### Parameters

##### ability

`string` \| `number`

The ability whose art to show: its rawcode, such as
`FourCC("AHtc")`, or a string (see the remarks).

##### effectType

`effecttype`

Which of the ability's art fields to use, such as
`EFFECT_TYPE_CASTER` or `EFFECT_TYPE_TARGET`.

##### targetWidget

[`Widget`](Widget.md)

The unit, item or destructable that carries the
effect.

##### attachPointName

`string`

The attachment point of the widget's model, such
as `"origin"` or `"overhead"`.

#### Returns

`Effect`

The new effect, which keeps `targetWidget` and `attachPointName`
in its `attachWidget` and `attachPointName`.

#### Remarks

common.j names that string `modelName`, and jassdoc does not say what it
is: pass the ability id.

#### Example

```ts
// Thunder Clap's caster art on a peasant's origin attachment point, destroyed
// at once: destroying plays the model's death animation.
import { Effect, Init, Unit, tsGlobals } from "reforged-ts";

Init.onTriggers(() => {
  const peasant = Unit.create(tsGlobals.Players[0], FourCC("hpea"), 0, 0);
  const clap = Effect.createSpellAttachment(
    FourCC("AHtc"),
    EFFECT_TYPE_CASTER,
    peasant,
    "origin",
  );
  clap.destroy();
});
```

#### Throws

When the game returns no handle:
`reforged-ts: failed to create Effect (<ability>)`, at the calling line,
the ability as its rawcode string or as given. In Dev mode, also when
called before the globals Init stage or inside `MapPlayer.runLocal`.

#### Native

[AddSpellEffectTargetById](/typings/3.0.0/functions/AddSpellEffectTargetById) ([jassbot](https://lep.duckdns.org/jassbot/doc/AddSpellEffectTargetById))

#### Native

[AddSpellEffectTarget](/typings/3.0.0/functions/AddSpellEffectTarget) ([jassbot](https://lep.duckdns.org/jassbot/doc/AddSpellEffectTarget))

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
