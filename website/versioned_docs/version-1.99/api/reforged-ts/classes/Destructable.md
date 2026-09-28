# Class: Destructable

Defined in: [handles/destructable.ts:46](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/destructable.ts#L46)

A destructable: a tree, a gate, a bridge or another object placed on the
map that has hit points and can die, but is not a unit.

## Example

**A tree that grows back a minute after it falls**

```ts
// A tree that grows back a minute after it falls, with its birth animation
// and at full health.
import { Destructable, Init, Timer, Trigger } from "reforged-ts";

Init.onTriggers(() => {
  const tree = Destructable.create({ typeId: FourCC("LTlt"), x: 512, y: 0 });

  Trigger.create()
    .registerDeathEvent(tree)
    .addAction(() => {
      Timer.after(60, () => {
        tree.heal(tree.maxLife, true);
      });
    });
});
```

## Native

[destructable](/typings/3.0.0/interfaces/destructable) ([jassbot](https://lep.duckdns.org/jassbot/doc/destructable))

## Extends

- [`Widget`](Widget.md)

## Properties

### handle

> `readonly` **handle**: `destructable`

Defined in: [handles/destructable.ts:51](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/destructable.ts#L51)

The Handle this Wrapper owns, to pass to a Native the library does not
wrap.

#### Overrides

[`Widget`](Widget.md).[`handle`](Widget.md#handle)

***

### skin?

> `readonly` `optional` **skin?**: `number`

Defined in: [handles/destructable.ts:54](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/destructable.ts#L54)

The skin the Destructable was created with, when one was given.

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

[`Widget`](Widget.md).[`id`](Widget.md#id)

***

### invulnerable

#### Get Signature

> **get** **invulnerable**(): `boolean`

Defined in: [handles/destructable.ts:495](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/destructable.ts#L495)

Gets whether the destructable ignores damage.

##### Native

[IsDestructableInvulnerable](/typings/3.0.0/functions/IsDestructableInvulnerable) ([jassbot](https://lep.duckdns.org/jassbot/doc/IsDestructableInvulnerable))

##### Returns

`boolean`

True when it is invulnerable.

#### Set Signature

> **set** **invulnerable**(`flag`): `void`

Defined in: [handles/destructable.ts:486](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/destructable.ts#L486)

Whether the destructable ignores damage: true makes it invulnerable.

##### Native

[SetDestructableInvulnerable](/typings/3.0.0/functions/SetDestructableInvulnerable) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetDestructableInvulnerable))

##### Parameters

###### flag

`boolean`

##### Returns

`void`

***

### life

#### Get Signature

> **get** **life**(): `number`

Defined in: [handles/destructable.ts:505](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/destructable.ts#L505)

Gets how many hit points the destructable has left.

##### Native

[GetDestructableLife](/typings/3.0.0/functions/GetDestructableLife) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetDestructableLife))

##### Returns

`number`

The hit points left, an amount rather than a percentage; 0 once
it is dead.

#### Set Signature

> **set** **life**(`value`): `void`

Defined in: [handles/destructable.ts:514](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/destructable.ts#L514)

The destructable's current hit points, an amount rather than a
percentage.

##### Native

[SetDestructableLife](/typings/3.0.0/functions/SetDestructableLife) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetDestructableLife))

##### Parameters

###### value

`number`

##### Returns

`void`

#### Overrides

[`Widget`](Widget.md).[`life`](Widget.md#life)

***

### maxLife

#### Get Signature

> **get** **maxLife**(): `number`

Defined in: [handles/destructable.ts:524](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/destructable.ts#L524)

Gets the most hit points the destructable can have.

##### Native

[GetDestructableMaxLife](/typings/3.0.0/functions/GetDestructableMaxLife) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetDestructableMaxLife))

##### Returns

`number`

The maximum, its type's Hit Points field until the `maxLife`
setter changes it for this destructable.

#### Set Signature

> **set** **maxLife**(`value`): `void`

Defined in: [handles/destructable.ts:533](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/destructable.ts#L533)

The most hit points the destructable can have, for this destructable
only: others of its type keep the maximum their object data gives.

##### Native

[SetDestructableMaxLife](/typings/3.0.0/functions/SetDestructableMaxLife) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetDestructableMaxLife))

##### Parameters

###### value

`number`

##### Returns

`void`

***

### name

#### Get Signature

> **get** **name**(): `string` \| `undefined`

Defined in: [handles/destructable.ts:546](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/destructable.ts#L546)

**`Async`**

Gets the name of the destructable's type, in the local client's
language.

##### Remarks

The value can differ between clients: never let it decide game state.

##### Native

[GetDestructableName](/typings/3.0.0/functions/GetDestructableName) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetDestructableName))

##### Returns

`string` \| `undefined`

The localized name.

***

### occluderHeight

#### Get Signature

> **get** **occluderHeight**(): `number`

Defined in: [handles/destructable.ts:556](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/destructable.ts#L556)

Gets how high the destructable blocks line of sight.

##### Native

[GetDestructableOccluderHeight](/typings/3.0.0/functions/GetDestructableOccluderHeight) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetDestructableOccluderHeight))

##### Returns

`number`

The height, in world units; its type's Occlusion Height field
until the `occluderHeight` setter changes it.

#### Set Signature

> **set** **occluderHeight**(`value`): `void`

Defined in: [handles/destructable.ts:565](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/destructable.ts#L565)

The height, in world units, up to which the destructable blocks line of
sight; 0 blocks none.

##### Native

[SetDestructableOccluderHeight](/typings/3.0.0/functions/SetDestructableOccluderHeight) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetDestructableOccluderHeight))

##### Parameters

###### value

`number`

##### Returns

`void`

***

### typeId

#### Get Signature

> **get** **typeId**(): `number`

Defined in: [handles/destructable.ts:574](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/destructable.ts#L574)

Gets the rawcode of the destructable's type.

##### Native

[GetDestructableTypeId](/typings/3.0.0/functions/GetDestructableTypeId) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetDestructableTypeId))

##### Returns

`number`

The type's rawcode, such as `FourCC("LTlt")`.

***

### x

#### Get Signature

> **get** **x**(): `number`

Defined in: [handles/destructable.ts:583](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/destructable.ts#L583)

Gets the x-coordinate of the destructable's position.

##### Native

[GetDestructableX](/typings/3.0.0/functions/GetDestructableX) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetDestructableX))

##### Returns

`number`

The x-coordinate, in world units.

#### Overrides

[`Widget`](Widget.md).[`x`](Widget.md#x)

***

### y

#### Get Signature

> **get** **y**(): `number`

Defined in: [handles/destructable.ts:592](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/destructable.ts#L592)

Gets the y-coordinate of the destructable's position.

##### Native

[GetDestructableY](/typings/3.0.0/functions/GetDestructableY) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetDestructableY))

##### Returns

`number`

The y-coordinate, in world units.

#### Overrides

[`Widget`](Widget.md).[`y`](Widget.md#y)

## Methods

### addIndicator()

> **addIndicator**(`red`, `green`, `blue`, `alpha`): `void`

Defined in: [handles/widget.ts:57](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/widget.ts#L57)

Adds a colored indicator to the widget, through `AddIndicator`.

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

[AddIndicator](/typings/3.0.0/functions/AddIndicator) ([jassbot](https://lep.duckdns.org/jassbot/doc/AddIndicator))

#### Inherited from

[`Widget`](Widget.md).[`addIndicator`](Widget.md#addindicator)

***

### destroy()

> **destroy**(): `void`

Defined in: [handles/destructable.ts:607](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/destructable.ts#L607)

Destroys the Destructable through its Native.

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

[RemoveDestructable](/typings/3.0.0/functions/RemoveDestructable) ([jassbot](https://lep.duckdns.org/jassbot/doc/RemoveDestructable))

***

### heal()

> **heal**(`life`, `birth`): `void`

Defined in: [handles/destructable.ts:621](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/destructable.ts#L621)

Brings a dead destructable back to life with the given hit points; a live
one is left as it is.

#### Parameters

##### life

`number`

The hit points it comes back with. 0, or more than its
maximum, gives it the maximum its object data sets; less than 0.5 gives
it 0.5.

##### birth

`boolean`

`true` to play its birth animation as it comes back.

#### Returns

`void`

#### Native

[DestructableRestoreLife](/typings/3.0.0/functions/DestructableRestoreLife) ([jassbot](https://lep.duckdns.org/jassbot/doc/DestructableRestoreLife))

***

### kill()

> **kill**(): `void`

Defined in: [handles/destructable.ts:629](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/destructable.ts#L629)

Kills the destructable, which plays its death animation.

#### Returns

`void`

#### Native

[KillDestructable](/typings/3.0.0/functions/KillDestructable) ([jassbot](https://lep.duckdns.org/jassbot/doc/KillDestructable))

***

### queueAnim()

> **queueAnim**(`whichAnimation`): `void`

Defined in: [handles/destructable.ts:638](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/destructable.ts#L638)

Queues an animation to play after the current one.

#### Parameters

##### whichAnimation

`string`

The animation's name, such as `"stand"`.

#### Returns

`void`

#### Native

[QueueDestructableAnimation](/typings/3.0.0/functions/QueueDestructableAnimation) ([jassbot](https://lep.duckdns.org/jassbot/doc/QueueDestructableAnimation))

***

### setAnim()

> **setAnim**(`whichAnimation`): `void`

Defined in: [handles/destructable.ts:647](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/destructable.ts#L647)

Plays an animation at once.

#### Parameters

##### whichAnimation

`string`

The animation's name, such as `"death"`.

#### Returns

`void`

#### Native

[SetDestructableAnimation](/typings/3.0.0/functions/SetDestructableAnimation) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetDestructableAnimation))

***

### setAnimSpeed()

> **setAnimSpeed**(`speedFactor`): `void`

Defined in: [handles/destructable.ts:657](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/destructable.ts#L657)

Sets the speed of the destructable's animations.

#### Parameters

##### speedFactor

`number`

The multiplier of the normal speed: 1 is normal, 2
twice as fast, 0.5 half as fast.

#### Returns

`void`

#### Native

[SetDestructableAnimationSpeed](/typings/3.0.0/functions/SetDestructableAnimationSpeed) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetDestructableAnimationSpeed))

***

### setColor()

> **setColor**(`color`): `void`

Defined in: [handles/destructable.ts:667](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/destructable.ts#L667)

Sets the team colour of the model, through `SetDestructableColor`
(3.0.0).

#### Parameters

##### color

`playercolor`

The player colour to tint it with.

#### Returns

`void`

#### Native

[SetDestructableColor](/typings/3.0.0/functions/SetDestructableColor) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetDestructableColor))

***

### setVertexColor()

> **setVertexColor**(`red`, `green`, `blue`, `alpha`): `void`

Defined in: [handles/destructable.ts:680](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/destructable.ts#L680)

Tints the model, through `SetDestructableVertexColor` (3.0.0). Each
channel is 0 to 255.

#### Parameters

##### red

`number`

The red channel.

##### green

`number`

The green channel.

##### blue

`number`

The blue channel.

##### alpha

`number`

The opacity, 0 transparent and 255 opaque.

#### Returns

`void`

#### Native

[SetDestructableVertexColor](/typings/3.0.0/functions/SetDestructableVertexColor) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetDestructableVertexColor))

***

### show()

> **show**(`flag`): `void`

Defined in: [handles/destructable.ts:694](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/destructable.ts#L694)

Shows or hides the destructable.

#### Parameters

##### flag

`boolean`

True to show it, false to hide it.

#### Returns

`void`

#### Native

[ShowDestructable](/typings/3.0.0/functions/ShowDestructable) ([jassbot](https://lep.duckdns.org/jassbot/doc/ShowDestructable))

***

### create()

> `static` **create**(`options`): `Destructable`

Defined in: [handles/destructable.ts:102](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/destructable.ts#L102)

Creates a destructable. The options name one of the 32 creation Natives,
on five independent axes: `dead` true creates a dead one, `z` places it
at that height, `pitch` or `roll` tilts it (the absent one 0), `skin`
gives it a skin and `color` a team colour.

#### Parameters

##### options

[`DestructableOptions`](../interfaces/DestructableOptions.md)

The rawcode and the position, and the optional axes.

#### Returns

`Destructable`

The new destructable.

#### Example

```ts
// A felled tree, tilted and in the colour of the player who cut it: the
// options name the Native, here BlzCreateDeadDestructablePitchRollWithColor.
import { Destructable, Init } from "reforged-ts";

Init.onTriggers(() => {
  Destructable.create({
    typeId: FourCC("LTlt"),
    x: 512,
    y: -256,
    dead: true,
    pitch: 30,
    color: PLAYER_COLOR_RED,
  });
});
```

#### Throws

When the game returns no handle, for example an unknown rawcode:
`reforged-ts: failed to create Destructable (<rawcode>)`, at the calling line.
In Dev mode, also when called before the globals Init stage or inside
`MapPlayer.runLocal`.

#### Native

[CreateDeadDestructable](/typings/3.0.0/functions/CreateDeadDestructable) ([jassbot](https://lep.duckdns.org/jassbot/doc/CreateDeadDestructable))

#### Native

[CreateDestructable](/typings/3.0.0/functions/CreateDestructable) ([jassbot](https://lep.duckdns.org/jassbot/doc/CreateDestructable))

#### Native

[CreateDeadDestructableZ](/typings/3.0.0/functions/CreateDeadDestructableZ) ([jassbot](https://lep.duckdns.org/jassbot/doc/CreateDeadDestructableZ))

#### Native

[CreateDestructableZ](/typings/3.0.0/functions/CreateDestructableZ) ([jassbot](https://lep.duckdns.org/jassbot/doc/CreateDestructableZ))

#### Native

[BlzCreateDeadDestructablePitchRoll](/typings/3.0.0/functions/BlzCreateDeadDestructablePitchRoll) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzCreateDeadDestructablePitchRoll))

#### Native

[BlzCreateDestructablePitchRoll](/typings/3.0.0/functions/BlzCreateDestructablePitchRoll) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzCreateDestructablePitchRoll))

#### Native

[BlzCreateDeadDestructableZPitchRoll](/typings/3.0.0/functions/BlzCreateDeadDestructableZPitchRoll) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzCreateDeadDestructableZPitchRoll))

#### Native

[BlzCreateDestructableZPitchRoll](/typings/3.0.0/functions/BlzCreateDestructableZPitchRoll) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzCreateDestructableZPitchRoll))

#### Native

[BlzCreateDeadDestructableWithSkin](/typings/3.0.0/functions/BlzCreateDeadDestructableWithSkin) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzCreateDeadDestructableWithSkin))

#### Native

[BlzCreateDestructableWithSkin](/typings/3.0.0/functions/BlzCreateDestructableWithSkin) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzCreateDestructableWithSkin))

#### Native

[BlzCreateDeadDestructableZWithSkin](/typings/3.0.0/functions/BlzCreateDeadDestructableZWithSkin) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzCreateDeadDestructableZWithSkin))

#### Native

[BlzCreateDestructableZWithSkin](/typings/3.0.0/functions/BlzCreateDestructableZWithSkin) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzCreateDestructableZWithSkin))

#### Native

[BlzCreateDeadDestructableWithSkinPitchRoll](/typings/3.0.0/functions/BlzCreateDeadDestructableWithSkinPitchRoll) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzCreateDeadDestructableWithSkinPitchRoll))

#### Native

[BlzCreateDestructableWithSkinPitchRoll](/typings/3.0.0/functions/BlzCreateDestructableWithSkinPitchRoll) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzCreateDestructableWithSkinPitchRoll))

#### Native

[BlzCreateDeadDestructableZWithSkinPitchRoll](/typings/3.0.0/functions/BlzCreateDeadDestructableZWithSkinPitchRoll) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzCreateDeadDestructableZWithSkinPitchRoll))

#### Native

[BlzCreateDestructableZWithSkinPitchRoll](/typings/3.0.0/functions/BlzCreateDestructableZWithSkinPitchRoll) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzCreateDestructableZWithSkinPitchRoll))

#### Native

[BlzCreateDeadDestructableWithColor](/typings/3.0.0/functions/BlzCreateDeadDestructableWithColor) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzCreateDeadDestructableWithColor))

#### Native

[BlzCreateDestructableWithColor](/typings/3.0.0/functions/BlzCreateDestructableWithColor) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzCreateDestructableWithColor))

#### Native

[BlzCreateDeadDestructableZWithColor](/typings/3.0.0/functions/BlzCreateDeadDestructableZWithColor) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzCreateDeadDestructableZWithColor))

#### Native

[BlzCreateDestructableZWithColor](/typings/3.0.0/functions/BlzCreateDestructableZWithColor) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzCreateDestructableZWithColor))

#### Native

[BlzCreateDeadDestructablePitchRollWithColor](/typings/3.0.0/functions/BlzCreateDeadDestructablePitchRollWithColor) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzCreateDeadDestructablePitchRollWithColor))

#### Native

[BlzCreateDestructablePitchRollWithColor](/typings/3.0.0/functions/BlzCreateDestructablePitchRollWithColor) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzCreateDestructablePitchRollWithColor))

#### Native

[BlzCreateDeadDestructableZPitchRollWithColor](/typings/3.0.0/functions/BlzCreateDeadDestructableZPitchRollWithColor) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzCreateDeadDestructableZPitchRollWithColor))

#### Native

[BlzCreateDestructableZPitchRollWithColor](/typings/3.0.0/functions/BlzCreateDestructableZPitchRollWithColor) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzCreateDestructableZPitchRollWithColor))

#### Native

[BlzCreateDeadDestructableWithSkinColor](/typings/3.0.0/functions/BlzCreateDeadDestructableWithSkinColor) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzCreateDeadDestructableWithSkinColor))

#### Native

[BlzCreateDestructableWithSkinColor](/typings/3.0.0/functions/BlzCreateDestructableWithSkinColor) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzCreateDestructableWithSkinColor))

#### Native

[BlzCreateDeadDestructableZWithSkinColor](/typings/3.0.0/functions/BlzCreateDeadDestructableZWithSkinColor) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzCreateDeadDestructableZWithSkinColor))

#### Native

[BlzCreateDestructableZWithSkinColor](/typings/3.0.0/functions/BlzCreateDestructableZWithSkinColor) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzCreateDestructableZWithSkinColor))

#### Native

[BlzCreateDeadDestructableWithSkinPitchRollColor](/typings/3.0.0/functions/BlzCreateDeadDestructableWithSkinPitchRollColor) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzCreateDeadDestructableWithSkinPitchRollColor))

#### Native

[BlzCreateDestructableWithSkinPitchRollColor](/typings/3.0.0/functions/BlzCreateDestructableWithSkinPitchRollColor) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzCreateDestructableWithSkinPitchRollColor))

#### Native

[BlzCreateDeadDestructableZWithSkinPitchRollColor](/typings/3.0.0/functions/BlzCreateDeadDestructableZWithSkinPitchRollColor) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzCreateDeadDestructableZWithSkinPitchRollColor))

#### Native

[BlzCreateDestructableZWithSkinPitchRollColor](/typings/3.0.0/functions/BlzCreateDestructableZWithSkinPitchRollColor) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzCreateDestructableZWithSkinPitchRollColor))

***

### fromEnum()

> `static` **fromEnum**(): `Destructable` \| `undefined`

Defined in: [handles/destructable.ts:705](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/destructable.ts#L705)

Gets the destructable an enumeration's action is running for, such as
`Rectangle.enumDestructables`.

#### Returns

`Destructable` \| `undefined`

The destructable, or `undefined` outside an enumeration's
action.

#### Native

[GetEnumDestructable](/typings/3.0.0/functions/GetEnumDestructable) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetEnumDestructable))

***

### fromEvent()

> `static` **fromEvent**(): `Destructable` \| `undefined`

Defined in: [handles/destructable.ts:715](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/destructable.ts#L715)

Gets the destructable a trigger event is about, such as the one that
died in a death event (`Trigger.registerDeathEvent`).

#### Returns

`Destructable` \| `undefined`

The destructable, or `undefined` outside an event about one.

#### Native

[GetTriggerDestructable](/typings/3.0.0/functions/GetTriggerDestructable) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetTriggerDestructable))

#### Overrides

[`Widget`](Widget.md).[`fromEvent`](Widget.md#fromevent)

***

### fromFilter()

> `static` **fromFilter**(): `Destructable` \| `undefined`

Defined in: [handles/destructable.ts:726](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/destructable.ts#L726)

Gets the destructable an enumeration's filter is testing, such as the
filter of `Rectangle.enumDestructables`.

#### Returns

`Destructable` \| `undefined`

The destructable, or `undefined` outside an enumeration's
filter.

#### Native

[GetFilterDestructable](/typings/3.0.0/functions/GetFilterDestructable) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetFilterDestructable))

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

[`Widget`](Widget.md).[`fromHandle`](Widget.md#fromhandle)

***

### fromOrderTarget()

> `static` **fromOrderTarget**(): `Destructable` \| `undefined`

Defined in: [handles/destructable.ts:736](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/destructable.ts#L736)

Gets the destructable targeted by the order being issued.

#### Returns

`Destructable` \| `undefined`

The destructable, or `undefined` outside a target order or when
the target is not a destructable.

#### Native

[GetOrderTargetDestructable](/typings/3.0.0/functions/GetOrderTargetDestructable) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetOrderTargetDestructable))

#### Overrides

[`Widget`](Widget.md).[`fromOrderTarget`](Widget.md#fromordertarget)

***

### fromSpellTarget()

> `static` **fromSpellTarget**(): `Destructable` \| `undefined`

Defined in: [handles/destructable.ts:746](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/destructable.ts#L746)

Gets the destructable targeted by the spell event being handled.

#### Returns

`Destructable` \| `undefined`

The destructable, or `undefined` outside a spell event or when
the spell targets none.

#### Native

[GetSpellTargetDestructable](/typings/3.0.0/functions/GetSpellTargetDestructable) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetSpellTargetDestructable))
