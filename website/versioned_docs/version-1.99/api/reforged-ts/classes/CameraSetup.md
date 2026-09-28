# Class: CameraSetup

Defined in: [handles/camera.ts:727](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/camera.ts#L727)

A camera setup: the fields and the target position of a camera, stored to
be applied to the game camera, like the cameras a map places in the World
Editor.

## Example

**Applying a camera setup for one player**

```ts
// A close-up shot, built once and applied for one player. A CameraSetup is
// a Handle: it is created outside runLocal, on every client; only applying
// it to the camera, a visual, runs on that player's client alone.
import { CameraSetup, Init, MapPlayer } from "reforged-ts";

let closeUp: CameraSetup | undefined;

Init.onGlobals(() => {
  const setup = CameraSetup.create();
  setup.setField(CAMERA_FIELD_TARGET_DISTANCE, 900, 0);
  setup.setField(CAMERA_FIELD_ANGLE_OF_ATTACK, 340, 0);
  setup.setDestPos(512, -256, 0);
  closeUp = setup;
});

/** Moves `player`'s camera to the close-up over one second. */
export function showCloseUp(player: MapPlayer): void {
  const setup = closeUp;
  if (setup === undefined) {
    return;
  }
  MapPlayer.runLocal(player, () => {
    setup.applyForceDuration(true, 1);
  });
}

Init.onGameStart(() => {
  const first = MapPlayer.fromIndex(0);
  if (first) {
    showCloseUp(first);
  }
});
```

## Native

[camerasetup](/typings/3.0.0/interfaces/camerasetup) ([jassbot](https://lep.duckdns.org/jassbot/doc/camerasetup))

## Extends

- [`Handle`](Handle.md)\<`camerasetup`\>

## Properties

### handle

> `readonly` **handle**: `camerasetup`

Defined in: [handles/handle.ts:132](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/handle.ts#L132)

The Handle this Wrapper owns, to pass to a Native the library does not
wrap.

#### Remarks

Do not keep it after `destroy()`: the game frees the object behind it.

#### Inherited from

[`Handle`](Handle.md).[`handle`](Handle.md#handle)

## Accessors

### destPoint

#### Get Signature

> **get** **destPoint**(): [`Point`](Point.md)

Defined in: [handles/camera.ts:755](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/camera.ts#L755)

Gets the position the camera setup moves the camera's target to, as a
new Point.

##### Remarks

Each read creates a Point: destroy it when done.

##### Throws

When the game returns no location:
`reforged-ts: failed to create Point`, at the calling line. In Dev mode
it also raises before the globals Init stage and inside
[MapPlayer.runLocal](MapPlayer.md#runlocal), as every creation does.

##### Native

[CameraSetupGetDestPositionLoc](/typings/3.0.0/functions/CameraSetupGetDestPositionLoc) ([jassbot](https://lep.duckdns.org/jassbot/doc/CameraSetupGetDestPositionLoc))

##### Returns

[`Point`](Point.md)

A new Point at the target position.

***

### destX

#### Get Signature

> **get** **destX**(): `number`

Defined in: [handles/camera.ts:764](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/camera.ts#L764)

Gets the x-coordinate the camera setup moves the camera's target to.

##### Native

[CameraSetupGetDestPositionX](/typings/3.0.0/functions/CameraSetupGetDestPositionX) ([jassbot](https://lep.duckdns.org/jassbot/doc/CameraSetupGetDestPositionX))

##### Returns

`number`

The x-coordinate, in world units.

#### Set Signature

> **set** **destX**(`x`): `void`

Defined in: [handles/camera.ts:776](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/camera.ts#L776)

Moves the camera setup's target position to this x-coordinate, in world
units, keeping its y-coordinate.

##### Remarks

The move has no duration: [CameraSetup.setDestPos](#setdestpos) gives it one.

##### Native

[CameraSetupSetDestPosition](/typings/3.0.0/functions/CameraSetupSetDestPosition) ([jassbot](https://lep.duckdns.org/jassbot/doc/CameraSetupSetDestPosition))

##### Native

[CameraSetupGetDestPositionY](/typings/3.0.0/functions/CameraSetupGetDestPositionY) ([jassbot](https://lep.duckdns.org/jassbot/doc/CameraSetupGetDestPositionY))

##### Parameters

###### x

`number`

##### Returns

`void`

***

### destY

#### Get Signature

> **get** **destY**(): `number`

Defined in: [handles/camera.ts:785](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/camera.ts#L785)

Gets the y-coordinate the camera setup moves the camera's target to.

##### Native

[CameraSetupGetDestPositionY](/typings/3.0.0/functions/CameraSetupGetDestPositionY) ([jassbot](https://lep.duckdns.org/jassbot/doc/CameraSetupGetDestPositionY))

##### Returns

`number`

The y-coordinate, in world units.

#### Set Signature

> **set** **destY**(`y`): `void`

Defined in: [handles/camera.ts:797](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/camera.ts#L797)

Moves the camera setup's target position to this y-coordinate, in world
units, keeping its x-coordinate.

##### Remarks

The move has no duration: [CameraSetup.setDestPos](#setdestpos) gives it one.

##### Native

[CameraSetupSetDestPosition](/typings/3.0.0/functions/CameraSetupSetDestPosition) ([jassbot](https://lep.duckdns.org/jassbot/doc/CameraSetupSetDestPosition))

##### Native

[CameraSetupGetDestPositionX](/typings/3.0.0/functions/CameraSetupGetDestPositionX) ([jassbot](https://lep.duckdns.org/jassbot/doc/CameraSetupGetDestPositionX))

##### Parameters

###### y

`number`

##### Returns

`void`

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

### label

#### Get Signature

> **get** **label**(): `string`

Defined in: [handles/camera.ts:814](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/camera.ts#L814)

Gets the free-text label that names the camera setup.

##### Native

[BlzCameraSetupGetLabel](/typings/3.0.0/functions/BlzCameraSetupGetLabel) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzCameraSetupGetLabel))

##### Returns

`string`

The label, or an empty string when it has none.

#### Set Signature

> **set** **label**(`label`): `void`

Defined in: [handles/camera.ts:805](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/camera.ts#L805)

Names the camera setup with a label of free text.

##### Native

[BlzCameraSetupSetLabel](/typings/3.0.0/functions/BlzCameraSetupSetLabel) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzCameraSetupSetLabel))

##### Parameters

###### label

`string`

##### Returns

`void`

***

### type

#### Get Signature

> **get** **type**(): `number`

Defined in: [handles/camera.ts:824](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/camera.ts#L824)

Gets the camera type of the camera setup, through
`BlzCameraSetupGetCameraType` (3.0.0): an integer the Patch does not name.

##### Native

[BlzCameraSetupGetCameraType](/typings/3.0.0/functions/BlzCameraSetupGetCameraType) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzCameraSetupGetCameraType))

##### Returns

`number`

The camera type, as the bare integer the Native gives.

#### Set Signature

> **set** **type**(`cameraType`): `void`

Defined in: [handles/camera.ts:833](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/camera.ts#L833)

Sets the camera type of the CameraSetup, through
`BlzCameraSetupSetCameraType` (3.0.0): an integer the Patch does not name.

##### Native

[BlzCameraSetupSetCameraType](/typings/3.0.0/functions/BlzCameraSetupSetCameraType) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzCameraSetupSetCameraType))

##### Parameters

###### cameraType

`number`

##### Returns

`void`

## Methods

### apply()

> **apply**(`doPan`, `panTimed`): `void`

Defined in: [handles/camera.ts:845](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/camera.ts#L845)

Applies the camera setup's fields to the game camera.

#### Parameters

##### doPan

`boolean`

`true` to move the camera's target to the setup's target
position as well; `false` to change the other fields only.

##### panTimed

`boolean`

`true` to change each field over the duration
[CameraSetup.setField](#setfield) gave it; `false` to apply them at once.

#### Returns

`void`

#### Native

[CameraSetupApply](/typings/3.0.0/functions/CameraSetupApply) ([jassbot](https://lep.duckdns.org/jassbot/doc/CameraSetupApply))

***

### applyForceDuration()

> **applyForceDuration**(`doPan`, `forceDuration`): `void`

Defined in: [handles/camera.ts:858](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/camera.ts#L858)

Applies the camera setup's fields to the game camera over one duration
for all of them.

#### Parameters

##### doPan

`boolean`

`true` to move the camera's target to the setup's target
position as well; `false` to change the other fields only.

##### forceDuration

`number`

The time every field takes, in seconds, in place
of the durations [CameraSetup.setField](#setfield) gave them.

#### Returns

`void`

#### Native

[CameraSetupApplyForceDuration](/typings/3.0.0/functions/CameraSetupApplyForceDuration) ([jassbot](https://lep.duckdns.org/jassbot/doc/CameraSetupApplyForceDuration))

***

### applyForceDurationSmooth()

> **applyForceDurationSmooth**(`doPan`, `forcedDuration`, `easeInDuration`, `easeOutDuration`, `smoothFactor`): `void`

Defined in: [handles/camera.ts:876](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/camera.ts#L876)

Applies the camera setup's fields to the game camera over one duration,
easing the change in at the start and out at the end.

#### Parameters

##### doPan

`boolean`

`true` to move the camera's target to the setup's target
position as well; `false` to change the other fields only.

##### forcedDuration

`number`

The time every field takes, in seconds, in place
of the durations [CameraSetup.setField](#setfield) gave them.

##### easeInDuration

`number`

The time the change takes to speed up at the
start, in seconds.

##### easeOutDuration

`number`

The time the change takes to slow down at the
end, in seconds.

##### smoothFactor

`number`

The smoothing factor of the easing.

#### Returns

`void`

#### Native

[BlzCameraSetupApplyForceDurationSmooth](/typings/3.0.0/functions/BlzCameraSetupApplyForceDurationSmooth) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzCameraSetupApplyForceDurationSmooth))

***

### applyForceDurationZ()

> **applyForceDurationZ**(`zDestOffset`, `forceDuration`): `void`

Defined in: [handles/camera.ts:902](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/camera.ts#L902)

Applies the camera setup's fields to the game camera over one duration,
with a z-offset of its own in place of the setup's.

#### Parameters

##### zDestOffset

`number`

The z-offset the camera moves to over the duration,
in world units.

##### forceDuration

`number`

The time every field takes, in seconds, in place
of the durations [CameraSetup.setField](#setfield) gave them.

#### Returns

`void`

#### Native

[CameraSetupApplyForceDurationWithZ](/typings/3.0.0/functions/CameraSetupApplyForceDurationWithZ) ([jassbot](https://lep.duckdns.org/jassbot/doc/CameraSetupApplyForceDurationWithZ))

***

### applyZ()

> **applyZ**(`zDestOffset`): `void`

Defined in: [handles/camera.ts:914](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/camera.ts#L914)

Applies the camera setup's fields to the game camera, with a z-offset of
its own in place of the setup's.

#### Parameters

##### zDestOffset

`number`

The z-offset the camera moves to, in world units.

#### Returns

`void`

#### Native

[CameraSetupApplyWithZ](/typings/3.0.0/functions/CameraSetupApplyWithZ) ([jassbot](https://lep.duckdns.org/jassbot/doc/CameraSetupApplyWithZ))

#### Bug

A player who pauses the game after the call gets the setup's own
z-offset on their game camera, in place of `zDestOffset`.

***

### getField()

> **getField**(`whichField`): `number`

Defined in: [handles/camera.ts:927](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/camera.ts#L927)

Gets the value the camera setup holds for one field.

#### Parameters

##### whichField

`camerafield`

The field, such as `CAMERA_FIELD_ANGLE_OF_ATTACK`.

#### Returns

`number`

The value: degrees for an angle, unlike the radians of
[Camera.getField](Camera.md#getfield); world units for a distance.

#### Remarks

The four angle fields (angle of attack, field of view, roll
and rotation) come back in degrees.

#### Native

[CameraSetupGetField](/typings/3.0.0/functions/CameraSetupGetField) ([jassbot](https://lep.duckdns.org/jassbot/doc/CameraSetupGetField))

***

### setDestPos()

> **setDestPos**(`x`, `y`, `duration`): `void`

Defined in: [handles/camera.ts:940](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/camera.ts#L940)

Sets the position the camera setup moves the camera's target to, reached
over `duration` once the setup is applied.

#### Parameters

##### x

`number`

The target x-coordinate, in world units.

##### y

`number`

The target y-coordinate, in world units.

##### duration

`number`

The time the move takes once the setup is applied, in
seconds.

#### Returns

`void`

#### Native

[CameraSetupSetDestPosition](/typings/3.0.0/functions/CameraSetupSetDestPosition) ([jassbot](https://lep.duckdns.org/jassbot/doc/CameraSetupSetDestPosition))

***

### setField()

> **setField**(`whichField`, `value`, `duration`): `void`

Defined in: [handles/camera.ts:954](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/camera.ts#L954)

Sets the value the camera setup holds for one field, reached over
`duration` once the setup is applied.

#### Parameters

##### whichField

`camerafield`

The field, such as `CAMERA_FIELD_TARGET_DISTANCE`.

##### value

`number`

The value: degrees for an angle, world units for a
distance.

##### duration

`number`

The time the change takes once the setup is applied,
in seconds; 0 applies it at once.

#### Returns

`void`

#### Native

[CameraSetupSetField](/typings/3.0.0/functions/CameraSetupSetField) ([jassbot](https://lep.duckdns.org/jassbot/doc/CameraSetupSetField))

***

### create()

> `static` **create**(): `CameraSetup`

Defined in: [handles/camera.ts:739](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/camera.ts#L739)

Creates a camera setup with the game's default fields.

#### Returns

`CameraSetup`

The new camera setup.

#### Remarks

The defaults: the target at (0, 0), a z-offset of 0, a rotation of 90,
an angle of attack of 304, a distance of 1650, a roll of 0, a field of
view of 70 and a far clipping of 5000.

#### Throws

When the game returns no handle:
`reforged-ts: failed to create CameraSetup`, at the calling line.

#### Native

[CreateCameraSetup](/typings/3.0.0/functions/CreateCameraSetup) ([jassbot](https://lep.duckdns.org/jassbot/doc/CreateCameraSetup))

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
