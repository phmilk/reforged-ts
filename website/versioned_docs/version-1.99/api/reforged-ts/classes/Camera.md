# Class: Camera

Defined in: [handles/camera.ts:16](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/camera.ts#L16)

The game camera and the cinematic filter: a Static namespace, static
members over the camera of the whole game rather than one Handle.

## Remarks

- Each client has its own camera. The getters read the local client's, so their values differ between clients (they are `@async`): never let one decide game state.
- A setter or a method changes the camera of every client that runs it. Call it inside [MapPlayer.runLocal](MapPlayer.md#runlocal) to change one player's camera: a camera change is a visual, safe on one client.
- Angles: [Camera.getField](#getfield) returns radians, while [Camera.setField](#setfield) takes degrees.

## Example

**Panning one player's camera**

```ts
// A short intro for one player: the screen fades in from black while the
// camera pans to a point and closes in. The camera and the cinematic filter
// are visuals, so they change inside runLocal, on that player's client only;
// the Timer that hides the filter afterwards is created on every client.
import { Camera, Init, MapPlayer, Timer } from "reforged-ts";

/** Fades in `player`'s screen and pans their camera to (x, y). */
export function playIntro(player: MapPlayer, x: number, y: number): void {
  MapPlayer.runLocal(player, () => {
    Camera.setCineFilterTexture(
      "ReplaceableTextures\\CameraMasks\\Black_mask.blp",
    );
    Camera.setCineFilterBlendMode(BLEND_MODE_BLEND);
    Camera.setCineFilterStartColor(0, 0, 0, 255);
    Camera.setCineFilterEndColor(0, 0, 0, 0);
    Camera.setCineFilterDuration(2);
    Camera.visible = true;
    Camera.panTimed(x, y, 2, undefined);
    Camera.setField(CAMERA_FIELD_TARGET_DISTANCE, 1200, 2);
  });
  Timer.after(2, () => {
    MapPlayer.runLocal(player, () => {
      Camera.visible = false;
    });
  });
}

Init.onGameStart(() => {
  const first = MapPlayer.fromIndex(0);
  if (first) {
    playIntro(first, 0, 0);
  }
});
```

## Accessors

### boundMaxX

#### Get Signature

> **get** `static` **boundMaxX**(): `number`

Defined in: [handles/camera.ts:74](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/camera.ts#L74)

**`Async`**

Gets the eastern edge of the area the local client's camera target can
move in.

##### Remarks

The value is the local client's own: it can differ between clients.

##### Native

[GetCameraBoundMaxX](/typings/3.0.0/functions/GetCameraBoundMaxX) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetCameraBoundMaxX))

##### Returns

`number`

The largest x-coordinate of the camera bounds, in world units.

***

### boundMaxY

#### Get Signature

> **get** `static` **boundMaxY**(): `number`

Defined in: [handles/camera.ts:87](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/camera.ts#L87)

**`Async`**

Gets the northern edge of the area the local client's camera target can
move in.

##### Remarks

The value is the local client's own: it can differ between clients.

##### Native

[GetCameraBoundMaxY](/typings/3.0.0/functions/GetCameraBoundMaxY) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetCameraBoundMaxY))

##### Returns

`number`

The largest y-coordinate of the camera bounds, in world units.

***

### boundMinX

#### Get Signature

> **get** `static` **boundMinX**(): `number`

Defined in: [handles/camera.ts:48](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/camera.ts#L48)

**`Async`**

Gets the western edge of the area the local client's camera target can
move in.

##### Remarks

The value is the local client's own: it can differ between clients.

##### Native

[GetCameraBoundMinX](/typings/3.0.0/functions/GetCameraBoundMinX) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetCameraBoundMinX))

##### Returns

`number`

The smallest x-coordinate of the camera bounds, in world units.

***

### boundMinY

#### Get Signature

> **get** `static` **boundMinY**(): `number`

Defined in: [handles/camera.ts:61](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/camera.ts#L61)

**`Async`**

Gets the southern edge of the area the local client's camera target can
move in.

##### Remarks

The value is the local client's own: it can differ between clients.

##### Native

[GetCameraBoundMinY](/typings/3.0.0/functions/GetCameraBoundMinY) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetCameraBoundMinY))

##### Returns

`number`

The smallest y-coordinate of the camera bounds, in world units.

***

### eyePoint

#### Get Signature

> **get** `static` **eyePoint**(): [`Point`](Point.md)

Defined in: [handles/camera.ts:183](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/camera.ts#L183)

**`Async`**

Gets the local client's camera eye, the point the camera looks from, as
a new Point.

##### Remarks

- The position is the local client's own: it can differ between clients.
- Each read creates a Point: destroy it when done.

##### Throws

When the game returns no location:
`reforged-ts: failed to create Point`, at the calling line. In Dev mode
it also raises before the globals Init stage and inside
[MapPlayer.runLocal](MapPlayer.md#runlocal), as every creation does.

##### Native

[GetCameraEyePositionLoc](/typings/3.0.0/functions/GetCameraEyePositionLoc) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetCameraEyePositionLoc))

##### Returns

[`Point`](Point.md)

A new Point at the camera eye.

***

### eyeX

#### Get Signature

> **get** `static` **eyeX**(): `number`

Defined in: [handles/camera.ts:139](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/camera.ts#L139)

**`Async`**

Gets the x-coordinate of the local client's camera eye, the point the
camera looks from.

##### Remarks

The value is the local client's own: it can differ between clients.

##### Native

[GetCameraEyePositionX](/typings/3.0.0/functions/GetCameraEyePositionX) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetCameraEyePositionX))

##### Returns

`number`

The x-coordinate, in world units.

***

### eyeY

#### Get Signature

> **get** `static` **eyeY**(): `number`

Defined in: [handles/camera.ts:152](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/camera.ts#L152)

**`Async`**

Gets the y-coordinate of the local client's camera eye, the point the
camera looks from.

##### Remarks

The value is the local client's own: it can differ between clients.

##### Native

[GetCameraEyePositionY](/typings/3.0.0/functions/GetCameraEyePositionY) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetCameraEyePositionY))

##### Returns

`number`

The y-coordinate, in world units.

***

### eyeZ

#### Get Signature

> **get** `static` **eyeZ**(): `number`

Defined in: [handles/camera.ts:165](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/camera.ts#L165)

**`Async`**

Gets the height of the local client's camera eye, the point the camera
looks from.

##### Remarks

The value is the local client's own: it can differ between clients.

##### Native

[GetCameraEyePositionZ](/typings/3.0.0/functions/GetCameraEyePositionZ) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetCameraEyePositionZ))

##### Returns

`number`

The z-coordinate, in world units.

***

### targetPoint

#### Get Signature

> **get** `static` **targetPoint**(): [`Point`](Point.md)

Defined in: [handles/camera.ts:201](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/camera.ts#L201)

**`Async`**

Gets the local client's camera target, the point the camera looks at, as
a new Point.

##### Remarks

- The position is the local client's own: it can differ between clients.
- Each read creates a Point: destroy it when done.

##### Throws

When the game returns no location:
`reforged-ts: failed to create Point`, at the calling line. In Dev mode
it also raises before the globals Init stage and inside
[MapPlayer.runLocal](MapPlayer.md#runlocal), as every creation does.

##### Native

[GetCameraTargetPositionLoc](/typings/3.0.0/functions/GetCameraTargetPositionLoc) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetCameraTargetPositionLoc))

##### Returns

[`Point`](Point.md)

A new Point at the camera target.

***

### targetX

#### Get Signature

> **get** `static` **targetX**(): `number`

Defined in: [handles/camera.ts:100](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/camera.ts#L100)

**`Async`**

Gets the x-coordinate of the local client's camera target, the point the
camera looks at.

##### Remarks

The value is the local client's own: it can differ between clients.

##### Native

[GetCameraTargetPositionX](/typings/3.0.0/functions/GetCameraTargetPositionX) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetCameraTargetPositionX))

##### Returns

`number`

The x-coordinate, in world units.

***

### targetY

#### Get Signature

> **get** `static` **targetY**(): `number`

Defined in: [handles/camera.ts:113](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/camera.ts#L113)

**`Async`**

Gets the y-coordinate of the local client's camera target, the point the
camera looks at.

##### Remarks

The value is the local client's own: it can differ between clients.

##### Native

[GetCameraTargetPositionY](/typings/3.0.0/functions/GetCameraTargetPositionY) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetCameraTargetPositionY))

##### Returns

`number`

The y-coordinate, in world units.

***

### targetZ

#### Get Signature

> **get** `static` **targetZ**(): `number`

Defined in: [handles/camera.ts:126](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/camera.ts#L126)

**`Async`**

Gets the height of the local client's camera target, the point the
camera looks at.

##### Remarks

The value is the local client's own: it can differ between clients.

##### Native

[GetCameraTargetPositionZ](/typings/3.0.0/functions/GetCameraTargetPositionZ) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetCameraTargetPositionZ))

##### Returns

`number`

The z-coordinate, in world units.

***

### type

#### Get Signature

> **get** `static` **type**(): `number`

Defined in: [handles/camera.ts:214](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/camera.ts#L214)

**`Async`**

Gets the type of the game camera, through `BlzCameraGetCameraType`
(3.0.0): an integer the Patch does not name.

##### Remarks

The value is the local player's own.

##### Native

[BlzCameraGetCameraType](/typings/3.0.0/functions/BlzCameraGetCameraType) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzCameraGetCameraType))

##### Returns

`number`

The camera type, as the bare integer the Native gives.

#### Set Signature

> **set** `static` **type**(`cameraType`): `void`

Defined in: [handles/camera.ts:223](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/camera.ts#L223)

Sets the type of the game camera, through `BlzCameraSetCameraType`
(3.0.0): an integer the Patch does not name.

##### Native

[BlzCameraSetCameraType](/typings/3.0.0/functions/BlzCameraSetCameraType) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzCameraSetCameraType))

##### Parameters

###### cameraType

`number`

##### Returns

`void`

***

### visible

#### Get Signature

> **get** `static` **visible**(): `boolean`

Defined in: [handles/camera.ts:35](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/camera.ts#L35)

Tells whether the cinematic filter shows.

##### Native

[IsCineFilterDisplayed](/typings/3.0.0/functions/IsCineFilterDisplayed) ([jassbot](https://lep.duckdns.org/jassbot/doc/IsCineFilterDisplayed))

##### Returns

`boolean`

`true` while the filter is displayed.

#### Set Signature

> **set** `static` **visible**(`flag`): `void`

Defined in: [handles/camera.ts:26](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/camera.ts#L26)

Shows the cinematic filter when `true`, with the texture, colours and
duration the `setCineFilter*` members set, and hides it when `false`.

##### Native

[DisplayCineFilter](/typings/3.0.0/functions/DisplayCineFilter) ([jassbot](https://lep.duckdns.org/jassbot/doc/DisplayCineFilter))

##### Parameters

###### flag

`boolean`

##### Returns

`void`

## Methods

### adjustField()

> `static` **adjustField**(`whichField`, `offset`, `duration`): `void`

Defined in: [handles/camera.ts:235](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/camera.ts#L235)

Adds `offset` to one field of the game camera, gradually over `duration`.

#### Parameters

##### whichField

`camerafield`

The field, such as `CAMERA_FIELD_TARGET_DISTANCE`.

##### offset

`number`

The amount added to the field's current value.

##### duration

`number`

The time the change takes, in seconds; 0 applies it at
once.

#### Returns

`void`

#### Native

[AdjustCameraField](/typings/3.0.0/functions/AdjustCameraField) ([jassbot](https://lep.duckdns.org/jassbot/doc/AdjustCameraField))

***

### endCinematicScene()

> `static` **endCinematicScene**(): `void`

Defined in: [handles/camera.ts:248](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/camera.ts#L248)

Ends the cinematic scene [Camera.SetCinematicScene](#setcinematicscene) started,
before its duration runs out.

#### Returns

`void`

#### Native

[EndCinematicScene](/typings/3.0.0/functions/EndCinematicScene) ([jassbot](https://lep.duckdns.org/jassbot/doc/EndCinematicScene))

***

### forceCinematicSubtitles()

> `static` **forceCinematicSubtitles**(`flag`): `void`

Defined in: [handles/camera.ts:259](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/camera.ts#L259)

Shows the text of cinematic scenes even to a player who turned subtitles
off in the game options.

#### Parameters

##### flag

`boolean`

`true` to force the subtitles, `false` to follow each
player's option again.

#### Returns

`void`

#### Native

[ForceCinematicSubtitles](/typings/3.0.0/functions/ForceCinematicSubtitles) ([jassbot](https://lep.duckdns.org/jassbot/doc/ForceCinematicSubtitles))

***

### getField()

> `static` **getField**(`field`): `number`

Defined in: [handles/camera.ts:273](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/camera.ts#L273)

**`Async`**

Gets the current value of one field of the local client's game camera.

#### Parameters

##### field

`camerafield`

The field, such as `CAMERA_FIELD_ANGLE_OF_ATTACK`.

#### Returns

`number`

The value: radians for an angle, world units for a distance.

#### Remarks

- The value is the local client's own: it can differ between clients.
- An angle comes back in radians, while [Camera.setField](#setfield) and [CameraSetup.getField](CameraSetup.md#getfield) use degrees.

#### Native

[GetCameraField](/typings/3.0.0/functions/GetCameraField) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetCameraField))

***

### getMargin()

> `static` **getMargin**(`whichMargin`): `number`

Defined in: [handles/camera.ts:285](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/camera.ts#L285)

Gets one margin of the map: the strip between the camera bounds and the
edge of the playable area on one side.

#### Parameters

##### whichMargin

`number`

The side: `CAMERA_MARGIN_LEFT`,
`CAMERA_MARGIN_RIGHT`, `CAMERA_MARGIN_TOP` or `CAMERA_MARGIN_BOTTOM`.

#### Returns

`number`

The width of the margin, in world units.

#### Native

[GetCameraMargin](/typings/3.0.0/functions/GetCameraMargin) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetCameraMargin))

***

### isFieldControlledByInput()

> `static` **isFieldControlledByInput**(`field`): `boolean`

Defined in: [handles/camera.ts:299](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/camera.ts#L299)

**`Async`**

Checks whether player input controls one field of the game camera,
through `GetCameraFieldControlledByInput` (3.0.0).

#### Parameters

##### field

`camerafield`

The field, such as `CAMERA_FIELD_ROTATION`.

#### Returns

`boolean`

`true` when player input controls the field.

#### Remarks

The value is the local player's own.

#### Native

[GetCameraFieldControlledByInput](/typings/3.0.0/functions/GetCameraFieldControlledByInput) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetCameraFieldControlledByInput))

***

### pan()

> `static` **pan**(`x`, `y`, `zOffsetDest`): `void`

Defined in: [handles/camera.ts:313](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/camera.ts#L313)

Pans the game camera until its target is at the point.

#### Parameters

##### x

`number`

The x-coordinate to pan to, in world units.

##### y

`number`

The y-coordinate to pan to, in world units.

##### zOffsetDest

`number` \| `undefined`

The z-offset the camera has at the point, in world
units; `undefined` pans without one. The parameter is not optional: pass
`undefined` to leave it out.

#### Returns

`void`

#### Native

[PanCameraTo](/typings/3.0.0/functions/PanCameraTo) ([jassbot](https://lep.duckdns.org/jassbot/doc/PanCameraTo))

#### Native

[PanCameraToWithZ](/typings/3.0.0/functions/PanCameraToWithZ) ([jassbot](https://lep.duckdns.org/jassbot/doc/PanCameraToWithZ))

***

### panTimed()

> `static` **panTimed**(`x`, `y`, `duration`, `zOffsetDest`): `void`

Defined in: [handles/camera.ts:332](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/camera.ts#L332)

Pans the game camera until its target is at the point, over `duration`.

#### Parameters

##### x

`number`

The x-coordinate to pan to, in world units.

##### y

`number`

The y-coordinate to pan to, in world units.

##### duration

`number`

The time the pan takes, in seconds.

##### zOffsetDest

`number` \| `undefined`

The z-offset the camera has at the point, in world
units; `undefined` pans without one. The parameter is not optional: pass
`undefined` to leave it out.

#### Returns

`void`

#### Native

[PanCameraToTimed](/typings/3.0.0/functions/PanCameraToTimed) ([jassbot](https://lep.duckdns.org/jassbot/doc/PanCameraToTimed))

#### Native

[PanCameraToTimedWithZ](/typings/3.0.0/functions/PanCameraToTimedWithZ) ([jassbot](https://lep.duckdns.org/jassbot/doc/PanCameraToTimedWithZ))

***

### reset()

> `static` **reset**(`duration`): `void`

Defined in: [handles/camera.ts:351](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/camera.ts#L351)

Returns the game camera to the fields of the default game camera, over
`duration`.

#### Parameters

##### duration

`number`

The time the change takes, in seconds.

#### Returns

`void`

#### Native

[ResetToGameCamera](/typings/3.0.0/functions/ResetToGameCamera) ([jassbot](https://lep.duckdns.org/jassbot/doc/ResetToGameCamera))

***

### setBounds()

> `static` **setBounds**(`x1`, `y1`, `x2`, `y2`, `x3`, `y3`, `x4`, `y4`): `void`

Defined in: [handles/camera.ts:371](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/camera.ts#L371)

Limits where the game camera's target can move to a quadrilateral given
by its four corners.

#### Parameters

##### x1

`number`

The first corner's x-coordinate, in world units.

##### y1

`number`

The first corner's y-coordinate, in world units.

##### x2

`number`

The second corner's x-coordinate, in world units.

##### y2

`number`

The second corner's y-coordinate, in world units.

##### x3

`number`

The third corner's x-coordinate, in world units.

##### y3

`number`

The third corner's y-coordinate, in world units.

##### x4

`number`

The fourth corner's x-coordinate, in world units.

##### y4

`number`

The fourth corner's y-coordinate, in world units.

#### Returns

`void`

#### Remarks

For a rectangle, give its corners in turn: (minX, minY), (minX, maxY),
(maxX, maxY), (maxX, minY).

#### Native

[SetCameraBounds](/typings/3.0.0/functions/SetCameraBounds) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetCameraBounds))

***

### setCameraOrientController()

> `static` **setCameraOrientController**(`whichUnit`, `xOffset`, `yOffset`): `void`

Defined in: [handles/camera.ts:391](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/camera.ts#L391)

Locks the game camera's orientation to a unit, at an offset from it.

#### Parameters

##### whichUnit

`unit`

The unit's Native handle, `unit.handle`.

##### xOffset

`number`

The offset along the x-axis, in world units.

##### yOffset

`number`

The offset along the y-axis, in world units.

#### Returns

`void`

#### Native

[SetCameraOrientController](/typings/3.0.0/functions/SetCameraOrientController) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetCameraOrientController))

***

### setCineFilterBlendMode()

> `static` **setCineFilterBlendMode**(`whichMode`): `void`

Defined in: [handles/camera.ts:405](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/camera.ts#L405)

Sets how the cinematic filter's texture blends with the scene behind it.

#### Parameters

##### whichMode

`blendmode`

The blend mode, such as `BLEND_MODE_BLEND` or
`BLEND_MODE_ADDITIVE`.

#### Returns

`void`

#### Native

[SetCineFilterBlendMode](/typings/3.0.0/functions/SetCineFilterBlendMode) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetCineFilterBlendMode))

***

### setCineFilterDuration()

> `static` **setCineFilterDuration**(`duration`): `void`

Defined in: [handles/camera.ts:415](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/camera.ts#L415)

Sets the time the cinematic filter takes to go from its start colour and
texture coordinates to its end ones.

#### Parameters

##### duration

`number`

The time, in seconds.

#### Returns

`void`

#### Native

[SetCineFilterDuration](/typings/3.0.0/functions/SetCineFilterDuration) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetCineFilterDuration))

***

### setCineFilterEndColor()

> `static` **setCineFilterEndColor**(`red`, `green`, `blue`, `alpha`): `void`

Defined in: [handles/camera.ts:427](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/camera.ts#L427)

Sets the colour the cinematic filter ends on.

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

The opacity, from 0 (transparent) to 255 (opaque).

#### Returns

`void`

#### Native

[SetCineFilterEndColor](/typings/3.0.0/functions/SetCineFilterEndColor) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetCineFilterEndColor))

***

### setCineFilterEndUV()

> `static` **setCineFilterEndUV**(`minU`, `minV`, `maxU`, `maxV`): `void`

Defined in: [handles/camera.ts:445](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/camera.ts#L445)

Sets the part of the texture the cinematic filter ends on, in texture
coordinates: 0, 0, 1, 1 is the whole texture.

#### Parameters

##### minU

`number`

The smallest U coordinate, from 0 to 1.

##### minV

`number`

The smallest V coordinate, from 0 to 1.

##### maxU

`number`

The largest U coordinate, from 0 to 1.

##### maxV

`number`

The largest V coordinate, from 0 to 1.

#### Returns

`void`

#### Native

[SetCineFilterEndUV](/typings/3.0.0/functions/SetCineFilterEndUV) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetCineFilterEndUV))

***

### setCineFilterStartColor()

> `static` **setCineFilterStartColor**(`red`, `green`, `blue`, `alpha`): `void`

Defined in: [handles/camera.ts:462](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/camera.ts#L462)

Sets the colour the cinematic filter starts from.

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

The opacity, from 0 (transparent) to 255 (opaque).

#### Returns

`void`

#### Native

[SetCineFilterStartColor](/typings/3.0.0/functions/SetCineFilterStartColor) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetCineFilterStartColor))

***

### setCineFilterStartUV()

> `static` **setCineFilterStartUV**(`minU`, `minV`, `maxU`, `maxV`): `void`

Defined in: [handles/camera.ts:480](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/camera.ts#L480)

Sets the part of the texture the cinematic filter starts from, in
texture coordinates: 0, 0, 1, 1 is the whole texture.

#### Parameters

##### minU

`number`

The smallest U coordinate, from 0 to 1.

##### minV

`number`

The smallest V coordinate, from 0 to 1.

##### maxU

`number`

The largest U coordinate, from 0 to 1.

##### maxV

`number`

The largest V coordinate, from 0 to 1.

#### Returns

`void`

#### Native

[SetCineFilterStartUV](/typings/3.0.0/functions/SetCineFilterStartUV) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetCineFilterStartUV))

***

### setCineFilterTexMapFlags()

> `static` **setCineFilterTexMapFlags**(`whichFlags`): `void`

Defined in: [handles/camera.ts:496](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/camera.ts#L496)

Sets whether the cinematic filter's texture repeats along U, along V or
along both.

#### Parameters

##### whichFlags

`texmapflags`

`TEXMAP_FLAG_NONE`, `TEXMAP_FLAG_WRAP_U`,
`TEXMAP_FLAG_WRAP_V` or `TEXMAP_FLAG_WRAP_UV`.

#### Returns

`void`

#### Native

[SetCineFilterTexMapFlags](/typings/3.0.0/functions/SetCineFilterTexMapFlags) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetCineFilterTexMapFlags))

***

### setCineFilterTexture()

> `static` **setCineFilterTexture**(`fileName`): `void`

Defined in: [handles/camera.ts:506](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/camera.ts#L506)

Sets the texture the cinematic filter shows.

#### Parameters

##### fileName

`string`

The texture's path, such as
`"ReplaceableTextures\\CameraMasks\\White_mask.blp"`.

#### Returns

`void`

#### Native

[SetCineFilterTexture](/typings/3.0.0/functions/SetCineFilterTexture) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetCineFilterTexture))

***

### setCinematicAudio()

> `static` **setCinematicAudio**(`cinematicAudio`): `void`

Defined in: [handles/camera.ts:516](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/camera.ts#L516)

Switches the game's sound to the cinematic audio, or back.

#### Parameters

##### cinematicAudio

`boolean`

`true` for the cinematic audio, `false` for the
game's normal audio.

#### Returns

`void`

#### Native

[SetCinematicAudio](/typings/3.0.0/functions/SetCinematicAudio) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetCinematicAudio))

***

### setCinematicCamera()

> `static` **setCinematicCamera**(`cameraModelFile`): `void`

Defined in: [handles/camera.ts:526](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/camera.ts#L526)

Plays the camera animation of a model file on the game camera.

#### Parameters

##### cameraModelFile

`string`

The path of the model holding the camera
animation.

#### Returns

`void`

#### Native

[SetCinematicCamera](/typings/3.0.0/functions/SetCinematicCamera) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetCinematicCamera))

***

### SetCinematicScene()

> `static` **SetCinematicScene**(`portraitUnitId`, `color`, `speakerTitle`, `text`, `sceneDuration`, `voiceoverDuration`): `void`

Defined in: [handles/camera.ts:544](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/camera.ts#L544)

Starts a cinematic scene: a unit type's portrait speaking `text` under
the speaker's name, in the cinematic panel.

#### Parameters

##### portraitUnitId

`number`

The rawcode of the unit type whose portrait
shows, such as `FourCC("Hpal")`.

##### color

`playercolor`

The player colour the speaker's name shows in.

##### speakerTitle

`string`

The speaker's name.

##### text

`string`

The text the speaker says.

##### sceneDuration

`number`

The time the scene shows, in seconds.

##### voiceoverDuration

`number`

The length of the spoken line, in seconds.

#### Returns

`void`

#### Remarks

[Camera.endCinematicScene](#endcinematicscene) ends it early.

#### Native

[SetCinematicScene](/typings/3.0.0/functions/SetCinematicScene) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetCinematicScene))

***

### setDepthOfFieldScale()

> `static` **setDepthOfFieldScale**(`scale`): `void`

Defined in: [handles/camera.ts:571](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/camera.ts#L571)

Sets how strongly the game camera blurs what lies away from its focal
distance.

#### Parameters

##### scale

`number`

The strength of the blur.

#### Returns

`void`

#### Remarks

Only the HD graphics of Reforged show the depth of field. A tutorial:
https://www.hiveworkshop.com/threads/how-to-camera-focal-distance-and-depth-of-field.331038/

#### Native

[CameraSetDepthOfFieldScale](/typings/3.0.0/functions/CameraSetDepthOfFieldScale) ([jassbot](https://lep.duckdns.org/jassbot/doc/CameraSetDepthOfFieldScale))

***

### setField()

> `static` **setField**(`whichField`, `value`, `duration`): `void`

Defined in: [handles/camera.ts:584](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/camera.ts#L584)

Sets one field of the game camera, gradually over `duration`.

#### Parameters

##### whichField

`camerafield`

The field, such as `CAMERA_FIELD_TARGET_DISTANCE`.

##### value

`number`

The new value: degrees for an angle, unlike the radians
of [Camera.getField](#getfield); world units for a distance.

##### duration

`number`

The time the change takes, in seconds; 0 applies it at
once.

#### Returns

`void`

#### Native

[SetCameraField](/typings/3.0.0/functions/SetCameraField) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetCameraField))

***

### setFieldControlledByInput()

> `static` **setFieldControlledByInput**(`field`, `controlled`): `void`

Defined in: [handles/camera.ts:600](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/camera.ts#L600)

Hands the field of the game camera to player input, or takes it back,
through `SetCameraFieldControlledByInput` (3.0.0).

#### Parameters

##### field

`camerafield`

The field, such as `CAMERA_FIELD_ROTATION`.

##### controlled

`boolean`

`true` to let player input control the field,
`false` to take it back.

#### Returns

`void`

#### Native

[SetCameraFieldControlledByInput](/typings/3.0.0/functions/SetCameraFieldControlledByInput) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetCameraFieldControlledByInput))

***

### setFocalDistance()

> `static` **setFocalDistance**(`distance`): `void`

Defined in: [handles/camera.ts:616](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/camera.ts#L616)

Sets the distance from the game camera at which the depth of field is
sharp.

#### Parameters

##### distance

`number`

The focal distance, in world units.

#### Returns

`void`

#### Remarks

Only the HD graphics of Reforged show the depth of field. A tutorial:
https://www.hiveworkshop.com/threads/how-to-camera-focal-distance-and-depth-of-field.331038/

#### Native

[CameraSetFocalDistance](/typings/3.0.0/functions/CameraSetFocalDistance) ([jassbot](https://lep.duckdns.org/jassbot/doc/CameraSetFocalDistance))

***

### setPos()

> `static` **setPos**(`x`, `y`): `void`

Defined in: [handles/camera.ts:626](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/camera.ts#L626)

Moves the game camera's target to the point at once, without a pan.

#### Parameters

##### x

`number`

The x-coordinate, in world units.

##### y

`number`

The y-coordinate, in world units.

#### Returns

`void`

#### Native

[SetCameraPosition](/typings/3.0.0/functions/SetCameraPosition) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetCameraPosition))

***

### setRotateMode()

> `static` **setRotateMode**(`x`, `y`, `radiansToSweep`, `duration`): `void`

Defined in: [handles/camera.ts:638](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/camera.ts#L638)

Turns the game camera around a point, sweeping an angle over `duration`.

#### Parameters

##### x

`number`

The x-coordinate of the point to turn around, in world units.

##### y

`number`

The y-coordinate of the point to turn around, in world units.

##### radiansToSweep

`number`

The angle to sweep, in radians.

##### duration

`number`

The time the sweep takes, in seconds.

#### Returns

`void`

#### Native

[SetCameraRotateMode](/typings/3.0.0/functions/SetCameraRotateMode) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetCameraRotateMode))

***

### setSmoothingFactor()

> `static` **setSmoothingFactor**(`factor`): `void`

Defined in: [handles/camera.ts:654](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/camera.ts#L654)

Sets how gradually the game camera comes to a stop after the player
scrolls it with the mouse or the keyboard.

#### Parameters

##### factor

`number`

0, the default, stops the camera at once; a larger
factor eases it into a stop more gradually.

#### Returns

`void`

#### Native

[CameraSetSmoothingFactor](/typings/3.0.0/functions/CameraSetSmoothingFactor) ([jassbot](https://lep.duckdns.org/jassbot/doc/CameraSetSmoothingFactor))

***

### setSourceNoise()

> `static` **setSourceNoise**(`mag`, `velocity`, `vertOnly?`): `void`

Defined in: [handles/camera.ts:667](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/camera.ts#L667)

Sways the game camera's eye, the point it looks from, without moving its
target; a magnitude and a velocity of 0 stop it.

#### Parameters

##### mag

`number`

How far the eye sways.

##### velocity

`number`

How fast the eye sways.

##### vertOnly?

`boolean` = `false`

`true` to sway only the angle of attack, the distance
and the z-offset, not the rotation; `false` when left out.

#### Returns

`void`

#### Native

[CameraSetSourceNoiseEx](/typings/3.0.0/functions/CameraSetSourceNoiseEx) ([jassbot](https://lep.duckdns.org/jassbot/doc/CameraSetSourceNoiseEx))

***

### setTargetController()

> `static` **setTargetController**(`whichUnit`, `xOffset`, `yOffset`, `inheritOrientation`): `void`

Defined in: [handles/camera.ts:684](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/camera.ts#L684)

Makes the game camera's target follow a unit, at an offset from it.

#### Parameters

##### whichUnit

`unit`

The unit's Native handle, `unit.handle`.

##### xOffset

`number`

The offset along the x-axis, in world units.

##### yOffset

`number`

The offset along the y-axis, in world units.

##### inheritOrientation

`boolean`

`true` to turn the camera with the unit's
facing as well.

#### Returns

`void`

#### Native

[SetCameraTargetController](/typings/3.0.0/functions/SetCameraTargetController) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetCameraTargetController))

***

### setTargetNoise()

> `static` **setTargetNoise**(`mag`, `velocity`, `vertOnly?`): `void`

Defined in: [handles/camera.ts:702](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/camera.ts#L702)

Sways the game camera's target, the point it looks at; a magnitude and a
velocity of 0 stop it.

#### Parameters

##### mag

`number`

How far the target sways.

##### velocity

`number`

How fast the target sways.

##### vertOnly?

`boolean` = `false`

`true` to sway only the distance and the z-offset;
`false` when left out.

#### Returns

`void`

#### Native

[CameraSetTargetNoiseEx](/typings/3.0.0/functions/CameraSetTargetNoiseEx) ([jassbot](https://lep.duckdns.org/jassbot/doc/CameraSetTargetNoiseEx))

***

### stop()

> `static` **stop**(): `void`

Defined in: [handles/camera.ts:714](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/camera.ts#L714)

Stops the game camera where it is, ending a pan in progress.

#### Returns

`void`

#### Native

[StopCamera](/typings/3.0.0/functions/StopCamera) ([jassbot](https://lep.duckdns.org/jassbot/doc/StopCamera))
