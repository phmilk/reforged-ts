# Class: Input

Defined in: [handles/input.ts:47](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/input.ts#L47)

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
      Camera.pan(0, 0);
    }
  });
});
```

## Accessors

### mouseScreenX

#### Get Signature

> **get** `static` **mouseScreenX**(): `number`

Defined in: [handles/input.ts:104](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/input.ts#L104)

**`Async`**

Gets the horizontal position of the local mouse on the screen, through
`BlzGetMouseScreenPosX` (3.0.0).

##### Example

**A tooltip following the local mouse**

```ts
// A tooltip that follows the mouse and names the unit under it. The cursor,
// the unit it points at and the screen's size in pixels are each client's
// own, so every client moves its own tooltip and nothing here reaches game
// state: a click that must change the game goes through an event, such as a
// selection or an order, which every client receives.
import { Frame, Init, Input, Timer, Unit } from "reforged-ts";

Init.onGameStart(() => {
  const gameUi = Frame.fromOrigin(ORIGIN_FRAME_GAME_UI, 0);
  if (gameUi === undefined) {
    return;
  }
  const tooltip = Frame.createType("CursorTooltip", gameUi, 0, "TEXT", "");

  Timer.every(0.03, () => {
    const unit = Unit.fromMouseFocus();
    tooltip.visible = unit !== undefined;
    if (unit === undefined) {
      return;
    }
    tooltip.text = Input.isMouseButtonPressed(MOUSE_BUTTON_TYPE_LEFT)
      ? `|cffffcc00${unit.name}|r`
      : unit.name;
    // The cursor comes in pixels and the anchor goes in frame units. Past
    // the middle of the screen, 0.4 in frame units, the tooltip flips to the
    // cursor's left side.
    const rightHalf = Input.mouseScreenX > Frame.frameToPixelX(0.4);
    tooltip.clearPoints();
    tooltip.setAbsPoint(
      rightHalf ? FRAMEPOINT_BOTTOMRIGHT : FRAMEPOINT_BOTTOMLEFT,
      Frame.pixelToFrameX(Input.mouseScreenX),
      Frame.pixelToFrameY(Input.mouseScreenY),
    );
  });
});
```

##### Native

[BlzGetMouseScreenPosX](/typings/3.0.0/functions/BlzGetMouseScreenPosX) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzGetMouseScreenPosX))

##### Returns

`number`

The x-coordinate on the screen, in pixels.

***

### mouseScreenY

#### Get Signature

> **get** `static` **mouseScreenY**(): `number`

Defined in: [handles/input.ts:117](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/input.ts#L117)

**`Async`**

Gets the vertical position of the local mouse on the screen, through
`BlzGetMouseScreenPosY` (3.0.0).

##### Example

**A tooltip following the local mouse**

```ts
// A tooltip that follows the mouse and names the unit under it. The cursor,
// the unit it points at and the screen's size in pixels are each client's
// own, so every client moves its own tooltip and nothing here reaches game
// state: a click that must change the game goes through an event, such as a
// selection or an order, which every client receives.
import { Frame, Init, Input, Timer, Unit } from "reforged-ts";

Init.onGameStart(() => {
  const gameUi = Frame.fromOrigin(ORIGIN_FRAME_GAME_UI, 0);
  if (gameUi === undefined) {
    return;
  }
  const tooltip = Frame.createType("CursorTooltip", gameUi, 0, "TEXT", "");

  Timer.every(0.03, () => {
    const unit = Unit.fromMouseFocus();
    tooltip.visible = unit !== undefined;
    if (unit === undefined) {
      return;
    }
    tooltip.text = Input.isMouseButtonPressed(MOUSE_BUTTON_TYPE_LEFT)
      ? `|cffffcc00${unit.name}|r`
      : unit.name;
    // The cursor comes in pixels and the anchor goes in frame units. Past
    // the middle of the screen, 0.4 in frame units, the tooltip flips to the
    // cursor's left side.
    const rightHalf = Input.mouseScreenX > Frame.frameToPixelX(0.4);
    tooltip.clearPoints();
    tooltip.setAbsPoint(
      rightHalf ? FRAMEPOINT_BOTTOMRIGHT : FRAMEPOINT_BOTTOMLEFT,
      Frame.pixelToFrameX(Input.mouseScreenX),
      Frame.pixelToFrameY(Input.mouseScreenY),
    );
  });
});
```

##### Native

[BlzGetMouseScreenPosY](/typings/3.0.0/functions/BlzGetMouseScreenPosY) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzGetMouseScreenPosY))

##### Returns

`number`

The y-coordinate on the screen, in pixels.

## Methods

### isKeyPressed()

> `static` **isKeyPressed**(`key`): `boolean`

Defined in: [handles/input.ts:62](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/input.ts#L62)

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

#### Example

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
      Camera.pan(0, 0);
    }
  });
});
```

#### Native

[BlzIsKeyPressed](/typings/3.0.0/functions/BlzIsKeyPressed) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzIsKeyPressed))

***

### isMetaKeyPressed()

> `static` **isMetaKeyPressed**(`keys`): `boolean`

Defined in: [handles/input.ts:91](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/input.ts#L91)

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

#### Example

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
      Camera.pan(0, 0);
    }
  });
});
```

#### Native

[BlzIsMetaKeyPressed](/typings/3.0.0/functions/BlzIsMetaKeyPressed) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzIsMetaKeyPressed))

***

### isMouseButtonPressed()

> `static` **isMouseButtonPressed**(`button`): `boolean`

Defined in: [handles/input.ts:76](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/input.ts#L76)

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

#### Example

**A tooltip following the local mouse**

```ts
// A tooltip that follows the mouse and names the unit under it. The cursor,
// the unit it points at and the screen's size in pixels are each client's
// own, so every client moves its own tooltip and nothing here reaches game
// state: a click that must change the game goes through an event, such as a
// selection or an order, which every client receives.
import { Frame, Init, Input, Timer, Unit } from "reforged-ts";

Init.onGameStart(() => {
  const gameUi = Frame.fromOrigin(ORIGIN_FRAME_GAME_UI, 0);
  if (gameUi === undefined) {
    return;
  }
  const tooltip = Frame.createType("CursorTooltip", gameUi, 0, "TEXT", "");

  Timer.every(0.03, () => {
    const unit = Unit.fromMouseFocus();
    tooltip.visible = unit !== undefined;
    if (unit === undefined) {
      return;
    }
    tooltip.text = Input.isMouseButtonPressed(MOUSE_BUTTON_TYPE_LEFT)
      ? `|cffffcc00${unit.name}|r`
      : unit.name;
    // The cursor comes in pixels and the anchor goes in frame units. Past
    // the middle of the screen, 0.4 in frame units, the tooltip flips to the
    // cursor's left side.
    const rightHalf = Input.mouseScreenX > Frame.frameToPixelX(0.4);
    tooltip.clearPoints();
    tooltip.setAbsPoint(
      rightHalf ? FRAMEPOINT_BOTTOMRIGHT : FRAMEPOINT_BOTTOMLEFT,
      Frame.pixelToFrameX(Input.mouseScreenX),
      Frame.pixelToFrameY(Input.mouseScreenY),
    );
  });
});
```

#### Native

[BlzIsMouseButtonPressed](/typings/3.0.0/functions/BlzIsMouseButtonPressed) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzIsMouseButtonPressed))
