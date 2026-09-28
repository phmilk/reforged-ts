# Class: Input

Defined in: [handles/input.ts:47](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/input.ts#L47)

Raw input of the local player, polled through the input Natives of 3.0.0:
a Static namespace, static members over the keyboard and the mouse of the
whole game rather than one Handle.

## Remarks

Every value is the local client's own, so it differs between clients (the
members are `@async`): use it for visuals, or send it with a
[SyncRequest](SyncRequest.md) before it decides game state.

## Example

**Panning the local camera while a key is held**

```ts
// Holding Shift+Space pans the local camera back to the centre of the map.
// Each client reads its own keys and moves its own camera: both are local
// visuals, so no game state depends on them and nothing needs runLocal.
import { Camera, Init, Input, MetaKey, Timer } from "reforged-ts";

Init.onGameStart(() => {
  Timer.every(0.1, () => {
    if (
      Input.isKeyPressed(OSKEY_SPACE) &&
      Input.isMetaKeyPressed(MetaKey.Shift)
    ) {
      Camera.pan(0, 0, undefined);
    }
  });
});
```

## Accessors

### mouseScreenX

#### Get Signature

> **get** `static` **mouseScreenX**(): `number`

Defined in: [handles/input.ts:96](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/input.ts#L96)

**`Async`**

Gets the horizontal position of the local mouse on the screen, through
`BlzGetMouseScreenPosX` (3.0.0).

##### Native

[BlzGetMouseScreenPosX](/typings/3.0.0/functions/BlzGetMouseScreenPosX) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzGetMouseScreenPosX))

##### Returns

`number`

The x-coordinate on the screen, in pixels.

***

### mouseScreenY

#### Get Signature

> **get** `static` **mouseScreenY**(): `number`

Defined in: [handles/input.ts:107](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/input.ts#L107)

**`Async`**

Gets the vertical position of the local mouse on the screen, through
`BlzGetMouseScreenPosY` (3.0.0).

##### Native

[BlzGetMouseScreenPosY](/typings/3.0.0/functions/BlzGetMouseScreenPosY) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzGetMouseScreenPosY))

##### Returns

`number`

The y-coordinate on the screen, in pixels.

## Methods

### isKeyPressed()

> `static` **isKeyPressed**(`key`): `boolean`

Defined in: [handles/input.ts:60](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/input.ts#L60)

**`Async`**

Checks whether the local player holds the key down, through
`BlzIsKeyPressed` (3.0.0).

#### Parameters

##### key

`oskeytype`

The key, such as `OSKEY_SPACE`.

#### Returns

`boolean`

`true` while the key is down on the local client.

#### Native

[BlzIsKeyPressed](/typings/3.0.0/functions/BlzIsKeyPressed) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzIsKeyPressed))

***

### isMetaKeyPressed()

> `static` **isMetaKeyPressed**(`keys`): `boolean`

Defined in: [handles/input.ts:85](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/input.ts#L85)

**`Async`**

Checks whether the local player holds the meta keys down, through
`BlzIsMetaKeyPressed` (3.0.0).

#### Parameters

##### keys

[`MetaKey`](../enumerations/MetaKey.md)

The meta keys, one [MetaKey](../enumerations/MetaKey.md) or several combined
with `|`.

#### Returns

`boolean`

`true` while the keys are down on the local client.

#### Native

[BlzIsMetaKeyPressed](/typings/3.0.0/functions/BlzIsMetaKeyPressed) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzIsMetaKeyPressed))

***

### isMouseButtonPressed()

> `static` **isMouseButtonPressed**(`button`): `boolean`

Defined in: [handles/input.ts:72](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/input.ts#L72)

**`Async`**

Checks whether the local player holds the mouse button down, through
`BlzIsMouseButtonPressed` (3.0.0).

#### Parameters

##### button

`mousebuttontype`

The button, such as `MOUSE_BUTTON_TYPE_LEFT`.

#### Returns

`boolean`

`true` while the button is down on the local client.

#### Native

[BlzIsMouseButtonPressed](/typings/3.0.0/functions/BlzIsMouseButtonPressed) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzIsMouseButtonPressed))
