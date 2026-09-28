# Class: Frame

Defined in: [handles/frame.ts:42](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/frame.ts#L42)

An element of the game's user interface: a frame created from a definition
of an FDF (Frame Definition File), created by type, or one of the game's
own frames.

## Remarks

Named `Frame` after the Native type `framehandle`, without its suffix.

- A frame whose handle id is 0 is the game's "not found": it is never a
  Frame. The lookups return `undefined` for it and the creation members
  throw.
- Positions and sizes are in frame units: the 4:3 area in the middle of the
  screen spans x from 0 to 0.8 and y from 0 to 0.6, from its bottom-left
  corner, whatever the resolution.
- Each client draws its own interface, so the members marked `@async` read
  the local client's frame, which can differ between clients: never let
  them decide game state.
- Guides to the UI on Hive Workshop: the starting guide
  (https://www.hiveworkshop.com/threads/ui-frames-starting-guide.318603/),
  https://www.hiveworkshop.com/pastebin/913bd439799b3d917e5b522dd9ef458f20598/
  and the UI and FDF tag (https://www.hiveworkshop.com/tags/ui-fdf/).

## Example

**Create a simple button.**

```ts
// A clickable button in the center of the screen: a GLUEBUTTON for the
// click, with a BACKDROP over it for the image.
import { Frame, Init } from "reforged-ts";

Init.onGameStart(() => {
  const gameUi = Frame.fromOrigin(ORIGIN_FRAME_GAME_UI, 0);
  if (gameUi === undefined) {
    return;
  }
  const button = Frame.createType("FaceButton", gameUi, 0, "GLUEBUTTON", "");
  const icon = Frame.createType("FaceButtonIcon", button, 0, "BACKDROP", "");
  // The icon takes the button's size and position.
  icon.setAllPoints(button);
  icon.setTexture(
    "ReplaceableTextures\\CommandButtons\\BTNSelectHeroOn",
    0,
    true,
  );
  button.setAbsPoint(FRAMEPOINT_CENTER, 0.4, 0.3);
  button.setSize(0.05, 0.05);
});
```

## Native

[framehandle](/typings/3.0.0/interfaces/framehandle) ([jassbot](https://lep.duckdns.org/jassbot/doc/framehandle))

## Extends

- [`Handle`](Handle.md)\<`framehandle`\>

## Properties

### handle

> `readonly` **handle**: `framehandle`

Defined in: [handles/handle.ts:132](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/handle.ts#L132)

The Handle this Wrapper owns, to pass to a Native the library does not
wrap.

#### Remarks

Do not keep it after `destroy()`: the game frees the object behind it.

#### Inherited from

[`Handle`](Handle.md).[`handle`](Handle.md#handle)

## Accessors

### alpha

#### Get Signature

> **get** **alpha**(): `number`

Defined in: [handles/frame.ts:162](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/frame.ts#L162)

**`Async`**

Gets the frame's opacity on the local client.

##### Native

[BlzFrameGetAlpha](/typings/3.0.0/functions/BlzFrameGetAlpha) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzFrameGetAlpha))

##### Returns

`number`

The opacity, from 0 (transparent) to 255 (opaque).

#### Set Signature

> **set** **alpha**(`alpha`): `void`

Defined in: [handles/frame.ts:152](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/frame.ts#L152)

The frame's opacity, from 0 (transparent) to 255 (opaque).

##### Native

[BlzFrameSetAlpha](/typings/3.0.0/functions/BlzFrameSetAlpha) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzFrameSetAlpha))

##### Parameters

###### alpha

`number`

##### Returns

`void`

***

### children

#### Get Signature

> **get** **children**(): `Frame`[]

Defined in: [handles/frame.ts:174](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/frame.ts#L174)

**`Async`**

Gets the frame's children on the local client.

##### Native

[BlzFrameGetChildrenCount](/typings/3.0.0/functions/BlzFrameGetChildrenCount) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzFrameGetChildrenCount))

##### Native

[BlzFrameGetChild](/typings/3.0.0/functions/BlzFrameGetChild) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzFrameGetChild))

##### Returns

`Frame`[]

The children, in the game's order; empty when the frame has
none.

***

### childrenCount

#### Get Signature

> **get** **childrenCount**(): `number`

Defined in: [handles/frame.ts:192](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/frame.ts#L192)

**`Async`**

Gets how many children the frame has on the local client.

##### Native

[BlzFrameGetChildrenCount](/typings/3.0.0/functions/BlzFrameGetChildrenCount) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzFrameGetChildrenCount))

##### Returns

`number`

The number of children, 0 or more.

***

### enabled

#### Get Signature

> **get** **enabled**(): `boolean`

Defined in: [handles/frame.ts:211](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/frame.ts#L211)

**`Async`**

Gets whether the frame takes input on the local client.

##### Native

[BlzFrameGetEnable](/typings/3.0.0/functions/BlzFrameGetEnable) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzFrameGetEnable))

##### Returns

`boolean`

`true` when the frame is enabled.

#### Set Signature

> **set** **enabled**(`flag`): `void`

Defined in: [handles/frame.ts:201](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/frame.ts#L201)

Whether the frame takes input: a disabled frame ignores clicks and
typing.

##### Native

[BlzFrameSetEnable](/typings/3.0.0/functions/BlzFrameSetEnable) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzFrameSetEnable))

##### Parameters

###### flag

`boolean`

##### Returns

`void`

***

### height

#### Get Signature

> **get** **height**(): `number`

Defined in: [handles/frame.ts:234](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/frame.ts#L234)

**`Async`**

Gets the frame's height on the local client.

##### Native

[BlzFrameGetHeight](/typings/3.0.0/functions/BlzFrameGetHeight) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzFrameGetHeight))

##### Returns

`number`

The height, in frame units.

#### Set Signature

> **set** **height**(`height`): `void`

Defined in: [handles/frame.ts:224](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/frame.ts#L224)

**`Async`**

The frame's height, in frame units.

##### Remarks

It sets the size, keeping the width the local client reads through the
`width` getter.

##### Native

[BlzFrameSetSize](/typings/3.0.0/functions/BlzFrameSetSize) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzFrameSetSize))

##### Native

[BlzFrameGetWidth](/typings/3.0.0/functions/BlzFrameGetWidth) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzFrameGetWidth))

##### Parameters

###### height

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

### name

#### Get Signature

> **get** **name**(): `string`

Defined in: [handles/frame.ts:244](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/frame.ts#L244)

Gets the name the frame was created under, which
[Frame.fromName](#fromname) finds it by.

##### Native

[BlzFrameGetName](/typings/3.0.0/functions/BlzFrameGetName) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzFrameGetName))

##### Returns

`string`

The name, or `""` when the game gives none.

***

### text

#### Get Signature

> **get** **text**(): `string`

Defined in: [handles/frame.ts:264](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/frame.ts#L264)

**`Async`**

Gets the frame's text on the local client, which includes what the local
player typed in an edit box.

##### Native

[BlzFrameGetText](/typings/3.0.0/functions/BlzFrameGetText) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzFrameGetText))

##### Returns

`string`

The text, or `""` when the frame has none.

#### Set Signature

> **set** **text**(`text`): `void`

Defined in: [handles/frame.ts:253](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/frame.ts#L253)

The text the frame shows, for a frame that holds text, such as a text
frame, an edit box or a text area.

##### Native

[BlzFrameSetText](/typings/3.0.0/functions/BlzFrameSetText) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzFrameSetText))

##### Parameters

###### text

`string`

##### Returns

`void`

***

### textSizeLimit

#### Get Signature

> **get** **textSizeLimit**(): `number`

Defined in: [handles/frame.ts:281](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/frame.ts#L281)

Gets the largest number of characters an edit box accepts.

##### Native

[BlzFrameGetTextSizeLimit](/typings/3.0.0/functions/BlzFrameGetTextSizeLimit) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzFrameGetTextSizeLimit))

##### Returns

`number`

The limit, in characters.

#### Set Signature

> **set** **textSizeLimit**(`size`): `void`

Defined in: [handles/frame.ts:272](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/frame.ts#L272)

The largest number of characters an edit box accepts.

##### Native

[BlzFrameSetTextSizeLimit](/typings/3.0.0/functions/BlzFrameSetTextSizeLimit) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzFrameSetTextSizeLimit))

##### Parameters

###### size

`number`

##### Returns

`void`

***

### value

#### Get Signature

> **get** **value**(): `number`

Defined in: [handles/frame.ts:301](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/frame.ts#L301)

**`Async`**

Gets the value of a slider or a status bar on the local client, which
includes where the local player dragged a slider.

##### Native

[BlzFrameGetValue](/typings/3.0.0/functions/BlzFrameGetValue) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzFrameGetValue))

##### Returns

`number`

The value, within the range [Frame.setMinMaxValue](#setminmaxvalue) sets.

#### Set Signature

> **set** **value**(`value`): `void`

Defined in: [handles/frame.ts:290](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/frame.ts#L290)

The value of a slider or a status bar, within the range
[Frame.setMinMaxValue](#setminmaxvalue) sets.

##### Native

[BlzFrameSetValue](/typings/3.0.0/functions/BlzFrameSetValue) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzFrameSetValue))

##### Parameters

###### value

`number`

##### Returns

`void`

***

### visible

#### Get Signature

> **get** **visible**(): `boolean`

Defined in: [handles/frame.ts:319](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/frame.ts#L319)

**`Async`**

Gets whether the frame is shown on the local client.

##### Native

[BlzFrameIsVisible](/typings/3.0.0/functions/BlzFrameIsVisible) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzFrameIsVisible))

##### Returns

`boolean`

`true` when the frame is shown.

#### Set Signature

> **set** **visible**(`flag`): `void`

Defined in: [handles/frame.ts:309](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/frame.ts#L309)

Whether the frame and its children are shown.

##### Native

[BlzFrameSetVisible](/typings/3.0.0/functions/BlzFrameSetVisible) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzFrameSetVisible))

##### Parameters

###### flag

`boolean`

##### Returns

`void`

***

### width

#### Get Signature

> **get** **width**(): `number`

Defined in: [handles/frame.ts:342](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/frame.ts#L342)

**`Async`**

Gets the frame's width on the local client.

##### Native

[BlzFrameGetWidth](/typings/3.0.0/functions/BlzFrameGetWidth) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzFrameGetWidth))

##### Returns

`number`

The width, in frame units.

#### Set Signature

> **set** **width**(`width`): `void`

Defined in: [handles/frame.ts:332](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/frame.ts#L332)

**`Async`**

The frame's width, in frame units.

##### Remarks

It sets the size, keeping the height the local client reads through the
`height` getter.

##### Native

[BlzFrameSetSize](/typings/3.0.0/functions/BlzFrameSetSize) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzFrameSetSize))

##### Native

[BlzFrameGetHeight](/typings/3.0.0/functions/BlzFrameGetHeight) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzFrameGetHeight))

##### Parameters

###### width

`number`

##### Returns

`void`

## Methods

### addText()

> **addText**(`text`): `Frame`

Defined in: [handles/frame.ts:352](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/frame.ts#L352)

Adds a line of text at the end of a text area.

#### Parameters

##### text

`string`

The line to add.

#### Returns

`Frame`

This Frame, for chaining.

#### Native

[BlzFrameAddText](/typings/3.0.0/functions/BlzFrameAddText) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzFrameAddText))

***

### cageMouse()

> **cageMouse**(`enable`): `Frame`

Defined in: [handles/frame.ts:363](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/frame.ts#L363)

Keeps the mouse cursor inside the frame, or lets it go again.

#### Parameters

##### enable

`boolean`

`true` to keep the cursor inside, `false` to release it.

#### Returns

`Frame`

This Frame, for chaining.

#### Native

[BlzFrameCageMouse](/typings/3.0.0/functions/BlzFrameCageMouse) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzFrameCageMouse))

***

### clearPoints()

> **clearPoints**(): `Frame`

Defined in: [handles/frame.ts:375](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/frame.ts#L375)

Removes every anchor point of the frame, before it is placed again with
[Frame.setPoint](#setpoint), [Frame.setAbsPoint](#setabspoint) or
[Frame.setAllPoints](#setallpoints).

#### Returns

`Frame`

This Frame, for chaining.

#### Native

[BlzFrameClearAllPoints](/typings/3.0.0/functions/BlzFrameClearAllPoints) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzFrameClearAllPoints))

***

### click()

> **click**(): `Frame`

Defined in: [handles/frame.ts:385](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/frame.ts#L385)

Clicks the frame from code, as a mouse click on it would.

#### Returns

`Frame`

This Frame, for chaining.

#### Native

[BlzFrameClick](/typings/3.0.0/functions/BlzFrameClick) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzFrameClick))

***

### destroy()

> **destroy**(): `Frame`

Defined in: [handles/frame.ts:400](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/frame.ts#L400)

Destroys the frame.

#### Returns

`Frame`

This Frame, which must not be used again.

#### Remarks

In Dev mode the destroyed Wrapper becomes a tombstone: any later access,
a second `destroy()` included, raises
`reforged-ts: used after destroy: <Class>#<id>`, and
`Reforged.debug.report()` counts it destroyed.

#### Native

[BlzDestroyFrame](/typings/3.0.0/functions/BlzDestroyFrame) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzDestroyFrame))

***

### getChild()

> **getChild**(`index`): `Frame` \| `undefined`

Defined in: [handles/frame.ts:413](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/frame.ts#L413)

**`Async`**

Gets one of the frame's children on the local client.

#### Parameters

##### index

`number`

The child's index, from 0 to `childrenCount - 1`.

#### Returns

`Frame` \| `undefined`

The child, or `undefined` when the index is past the last child.

#### Native

[BlzFrameGetChild](/typings/3.0.0/functions/BlzFrameGetChild) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzFrameGetChild))

***

### getParent()

> **getParent**(): `Frame` \| `undefined`

Defined in: [handles/frame.ts:563](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/frame.ts#L563)

**`Async`**

Gets the frame's parent on the local client.

#### Returns

`Frame` \| `undefined`

The parent, or `undefined` when the frame has none.

#### Native

[BlzFrameGetParent](/typings/3.0.0/functions/BlzFrameGetParent) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzFrameGetParent))

***

### setAbsPoint()

> **setAbsPoint**(`point`, `x`, `y`): `Frame`

Defined in: [handles/frame.ts:428](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/frame.ts#L428)

Anchors one point of the frame to a position of the screen.

#### Parameters

##### point

`framepointtype`

The point of the frame to anchor, such as
`FRAMEPOINT_CENTER`.

##### x

`number`

The x-coordinate, in frame units, from 0 at the left edge of
the 4:3 area to 0.8 at its right edge.

##### y

`number`

The y-coordinate, in frame units, from 0 at the bottom to 0.6
at the top.

#### Returns

`Frame`

This Frame, for chaining.

#### Native

[BlzFrameSetAbsPoint](/typings/3.0.0/functions/BlzFrameSetAbsPoint) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzFrameSetAbsPoint))

***

### setAllPoints()

> **setAllPoints**(`relative`): `Frame`

Defined in: [handles/frame.ts:440](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/frame.ts#L440)

Places the frame over another one, so that it takes the other's position
and size.

#### Parameters

##### relative

`Frame`

The frame to cover.

#### Returns

`Frame`

This Frame, for chaining.

#### Native

[BlzFrameSetAllPoints](/typings/3.0.0/functions/BlzFrameSetAllPoints) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzFrameSetAllPoints))

***

### setAlpha()

> **setAlpha**(`alpha`): `Frame`

Defined in: [handles/frame.ts:451](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/frame.ts#L451)

Sets the frame's opacity.

#### Parameters

##### alpha

`number`

The opacity, from 0 (transparent) to 255 (opaque).

#### Returns

`Frame`

This Frame, for chaining.

#### Native

[BlzFrameSetAlpha](/typings/3.0.0/functions/BlzFrameSetAlpha) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzFrameSetAlpha))

***

### setEnabled()

> **setEnabled**(`flag`): `Frame`

Defined in: [handles/frame.ts:463](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/frame.ts#L463)

Enables or disables the frame: a disabled frame ignores clicks and
typing.

#### Parameters

##### flag

`boolean`

`true` to enable the frame, `false` to disable it.

#### Returns

`Frame`

This Frame, for chaining.

#### Native

[BlzFrameSetEnable](/typings/3.0.0/functions/BlzFrameSetEnable) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzFrameSetEnable))

***

### setFocus()

> **setFocus**(`flag`): `Frame`

Defined in: [handles/frame.ts:475](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/frame.ts#L475)

Gives the keyboard focus to the frame, such as an edit box, or takes it
away.

#### Parameters

##### flag

`boolean`

`true` to give the focus, `false` to take it away.

#### Returns

`Frame`

This Frame, for chaining.

#### Native

[BlzFrameSetFocus](/typings/3.0.0/functions/BlzFrameSetFocus) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzFrameSetFocus))

***

### setFont()

> **setFont**(`filename`, `height`, `flags`): `Frame`

Defined in: [handles/frame.ts:488](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/frame.ts#L488)

Sets the font of the frame's text.

#### Parameters

##### filename

`string`

The path of the font file.

##### height

`number`

The height of the text, in frame units.

##### flags

`number`

The font flags; 0 for none.

#### Returns

`Frame`

This Frame, for chaining.

#### Native

[BlzFrameSetFont](/typings/3.0.0/functions/BlzFrameSetFont) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzFrameSetFont))

***

### setHeight()

> **setHeight**(`height`): `Frame`

Defined in: [handles/frame.ts:502](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/frame.ts#L502)

**`Async`**

Sets the frame's height, keeping the width the local client reads through
the `width` getter.

#### Parameters

##### height

`number`

The height, in frame units.

#### Returns

`Frame`

This Frame, for chaining.

#### Native

[BlzFrameSetSize](/typings/3.0.0/functions/BlzFrameSetSize) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzFrameSetSize))

#### Native

[BlzFrameGetWidth](/typings/3.0.0/functions/BlzFrameGetWidth) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzFrameGetWidth))

***

### setLevel()

> **setLevel**(`level`): `Frame`

Defined in: [handles/frame.ts:515](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/frame.ts#L515)

Sets the frame's drawing level among its siblings: a higher level draws
above a lower one.

#### Parameters

##### level

`number`

The level, compared only with the levels of the frame's
siblings.

#### Returns

`Frame`

This Frame, for chaining.

#### Native

[BlzFrameSetLevel](/typings/3.0.0/functions/BlzFrameSetLevel) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzFrameSetLevel))

***

### setMinMaxValue()

> **setMinMaxValue**(`minValue`, `maxValue`): `Frame`

Defined in: [handles/frame.ts:527](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/frame.ts#L527)

Sets the range of a slider or a status bar.

#### Parameters

##### minValue

`number`

The smallest value.

##### maxValue

`number`

The largest value.

#### Returns

`Frame`

This Frame, for chaining.

#### Native

[BlzFrameSetMinMaxValue](/typings/3.0.0/functions/BlzFrameSetMinMaxValue) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzFrameSetMinMaxValue))

***

### setModel()

> **setModel**(`modelFile`, `cameraIndex`): `Frame`

Defined in: [handles/frame.ts:552](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/frame.ts#L552)

Sets the model a model or sprite frame shows.

#### Parameters

##### modelFile

`string`

The path of the model file.

##### cameraIndex

`number`

The index of the model's camera to show it through;
0 for the first.

#### Returns

`Frame`

This Frame, for chaining.

#### Native

[BlzFrameSetModel](/typings/3.0.0/functions/BlzFrameSetModel) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzFrameSetModel))

***

### setParent()

> **setParent**(`parent`): `Frame`

Defined in: [handles/frame.ts:574](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/frame.ts#L574)

Moves the frame under another parent, with which it is then shown and
hidden.

#### Parameters

##### parent

`Frame`

The new parent.

#### Returns

`Frame`

This Frame, for chaining.

#### Native

[BlzFrameSetParent](/typings/3.0.0/functions/BlzFrameSetParent) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzFrameSetParent))

***

### setPoint()

> **setPoint**(`point`, `relative`, `relativePoint`, `x`, `y`): `Frame`

Defined in: [handles/frame.ts:591](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/frame.ts#L591)

Anchors one point of the frame to a point of another frame, at an offset.

#### Parameters

##### point

`framepointtype`

The point of this frame to anchor, such as
`FRAMEPOINT_TOPLEFT`.

##### relative

`Frame`

The frame to anchor to.

##### relativePoint

`framepointtype`

The point of `relative` to anchor to.

##### x

`number`

The horizontal offset, in frame units; positive is to the
right.

##### y

`number`

The vertical offset, in frame units; positive is up.

#### Returns

`Frame`

This Frame, for chaining.

#### Native

[BlzFrameSetPoint](/typings/3.0.0/functions/BlzFrameSetPoint) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzFrameSetPoint))

***

### setScale()

> **setScale**(`scale`): `Frame`

Defined in: [handles/frame.ts:608](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/frame.ts#L608)

Scales the frame and its children.

#### Parameters

##### scale

`number`

The scale factor; 1 is the frame's own size.

#### Returns

`Frame`

This Frame, for chaining.

#### Native

[BlzFrameSetScale](/typings/3.0.0/functions/BlzFrameSetScale) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzFrameSetScale))

***

### setSize()

> **setSize**(`width`, `height`): `Frame`

Defined in: [handles/frame.ts:620](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/frame.ts#L620)

Sets the frame's width and height.

#### Parameters

##### width

`number`

The width, in frame units.

##### height

`number`

The height, in frame units.

#### Returns

`Frame`

This Frame, for chaining.

#### Native

[BlzFrameSetSize](/typings/3.0.0/functions/BlzFrameSetSize) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzFrameSetSize))

***

### setSpriteAnimate()

> **setSpriteAnimate**(`primaryProp`, `flags`): `Frame`

Defined in: [handles/frame.ts:633](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/frame.ts#L633)

Plays an animation of the model a sprite frame shows.

#### Parameters

##### primaryProp

`number`

The animation's primary property, as the game
numbers them.

##### flags

`number`

The animation flags; 0 for none.

#### Returns

`Frame`

This Frame, for chaining.

#### Native

[BlzFrameSetSpriteAnimate](/typings/3.0.0/functions/BlzFrameSetSpriteAnimate) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzFrameSetSpriteAnimate))

***

### setStepSize()

> **setStepSize**(`stepSize`): `Frame`

Defined in: [handles/frame.ts:644](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/frame.ts#L644)

Sets the step of a slider: its value moves by multiples of it.

#### Parameters

##### stepSize

`number`

The step, in the slider's units.

#### Returns

`Frame`

This Frame, for chaining.

#### Native

[BlzFrameSetStepSize](/typings/3.0.0/functions/BlzFrameSetStepSize) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzFrameSetStepSize))

***

### setText()

> **setText**(`text`): `Frame`

Defined in: [handles/frame.ts:656](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/frame.ts#L656)

Sets the text the frame shows, for a frame that holds text, such as a
text frame, an edit box or a text area.

#### Parameters

##### text

`string`

The text to show, in place of the current one.

#### Returns

`Frame`

This Frame, for chaining.

#### Native

[BlzFrameSetText](/typings/3.0.0/functions/BlzFrameSetText) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzFrameSetText))

***

### setTextAlignment()

> **setTextAlignment**(`vert`, `horz`): `void`

Defined in: [handles/frame.ts:540](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/frame.ts#L540)

Aligns the frame's text vertically and horizontally.

#### Parameters

##### vert

`textaligntype`

The vertical alignment, such as `TEXT_JUSTIFY_MIDDLE`.

##### horz

`textaligntype`

The horizontal alignment, such as `TEXT_JUSTIFY_CENTER`.

#### Returns

`void`

#### Remarks

Unlike the other setters, it returns nothing, so it ends a chain.

#### Native

[BlzFrameSetTextAlignment](/typings/3.0.0/functions/BlzFrameSetTextAlignment) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzFrameSetTextAlignment))

***

### setTextAreaAutoScroll()

> **setTextAreaAutoScroll**(`value`): `Frame`

Defined in: [handles/frame.ts:667](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/frame.ts#L667)

Sets whether a text area scrolls to its last line as text is added.

#### Parameters

##### value

`boolean`

`true` to scroll to the last line, `false` to stay.

#### Returns

`Frame`

This Frame, for chaining.

#### Native

[BlzTextAreaFrameSetAutoScroll](/typings/3.0.0/functions/BlzTextAreaFrameSetAutoScroll) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzTextAreaFrameSetAutoScroll))

***

### setTextColor()

> **setTextColor**(`color`): `Frame`

Defined in: [handles/frame.ts:679](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/frame.ts#L679)

Sets the color of the frame's text.

#### Parameters

##### color

`number`

The color as one ARGB integer, such as
`BlzConvertColor(255, 255, 204, 0)` returns.

#### Returns

`Frame`

This Frame, for chaining.

#### Native

[BlzFrameSetTextColor](/typings/3.0.0/functions/BlzFrameSetTextColor) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzFrameSetTextColor))

***

### setTextSizeLimit()

> **setTextSizeLimit**(`size`): `Frame`

Defined in: [handles/frame.ts:690](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/frame.ts#L690)

Sets the largest number of characters an edit box accepts.

#### Parameters

##### size

`number`

The limit, in characters.

#### Returns

`Frame`

This Frame, for chaining.

#### Native

[BlzFrameSetTextSizeLimit](/typings/3.0.0/functions/BlzFrameSetTextSizeLimit) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzFrameSetTextSizeLimit))

***

### setTexture()

> **setTexture**(`texFile`, `flag`, `blend`): `Frame`

Defined in: [handles/frame.ts:704](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/frame.ts#L704)

Sets the texture a frame such as a backdrop shows.

#### Parameters

##### texFile

`string`

The path of the texture file.

##### flag

`number`

The texture flag; 0 for the default.

##### blend

`boolean`

Whether the texture's alpha channel blends it with what is
drawn under it.

#### Returns

`Frame`

This Frame, for chaining.

#### Native

[BlzFrameSetTexture](/typings/3.0.0/functions/BlzFrameSetTexture) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzFrameSetTexture))

***

### setTooltip()

> **setTooltip**(`tooltip`): `Frame`

Defined in: [handles/frame.ts:716](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/frame.ts#L716)

Makes another frame this frame's tooltip: the game shows it while the
mouse is over this frame and hides it otherwise.

#### Parameters

##### tooltip

`Frame`

The frame to show as the tooltip.

#### Returns

`Frame`

This Frame, for chaining.

#### Native

[BlzFrameSetTooltip](/typings/3.0.0/functions/BlzFrameSetTooltip) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzFrameSetTooltip))

***

### setValue()

> **setValue**(`value`): `Frame`

Defined in: [handles/frame.ts:728](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/frame.ts#L728)

Sets the value of a slider or a status bar.

#### Parameters

##### value

`number`

The value, within the range [Frame.setMinMaxValue](#setminmaxvalue)
sets.

#### Returns

`Frame`

This Frame, for chaining.

#### Native

[BlzFrameSetValue](/typings/3.0.0/functions/BlzFrameSetValue) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzFrameSetValue))

***

### setVertexColor()

> **setVertexColor**(`color`): `Frame`

Defined in: [handles/frame.ts:740](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/frame.ts#L740)

Tints the frame's texture or model.

#### Parameters

##### color

`number`

The color as one ARGB integer, such as
`BlzConvertColor(255, 255, 0, 0)` returns.

#### Returns

`Frame`

This Frame, for chaining.

#### Native

[BlzFrameSetVertexColor](/typings/3.0.0/functions/BlzFrameSetVertexColor) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzFrameSetVertexColor))

***

### setVisible()

> **setVisible**(`flag`): `Frame`

Defined in: [handles/frame.ts:751](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/frame.ts#L751)

Shows or hides the frame and its children.

#### Parameters

##### flag

`boolean`

`true` to show the frame, `false` to hide it.

#### Returns

`Frame`

This Frame, for chaining.

#### Native

[BlzFrameSetVisible](/typings/3.0.0/functions/BlzFrameSetVisible) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzFrameSetVisible))

***

### setWidth()

> **setWidth**(`width`): `Frame`

Defined in: [handles/frame.ts:765](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/frame.ts#L765)

**`Async`**

Sets the frame's width, keeping the height the local client reads through
the `height` getter.

#### Parameters

##### width

`number`

The width, in frame units.

#### Returns

`Frame`

This Frame, for chaining.

#### Native

[BlzFrameSetSize](/typings/3.0.0/functions/BlzFrameSetSize) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzFrameSetSize))

#### Native

[BlzFrameGetHeight](/typings/3.0.0/functions/BlzFrameGetHeight) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzFrameGetHeight))

***

### autoPosition()

> `static` **autoPosition**(`enable`): `void`

Defined in: [handles/frame.ts:777](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/frame.ts#L777)

Lets the game move its own frames back into place, or keeps them where the
Map project put them.

#### Parameters

##### enable

`boolean`

`true` to let the game position its frames, `false` to
keep the positions the Map project set.

#### Returns

`void`

#### Native

[BlzEnableUIAutoPosition](/typings/3.0.0/functions/BlzEnableUIAutoPosition) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzEnableUIAutoPosition))

***

### create()

> `static` **create**(`name`, `owner`, `priority`, `createContext`): `Frame`

Defined in: [handles/frame.ts:61](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/frame.ts#L61)

Creates a frame from its definition in a loaded FDF file.

#### Parameters

##### name

`string`

The name of the frame definition, which is also the name
[Frame.fromName](#fromname) finds the new frame by.

##### owner

`Frame`

The parent frame.

##### priority

`number`

The frame's priority, 0 or more.

##### createContext

`number`

The number that tells this frame apart from others
created under the same name, for [Frame.fromName](#fromname). It need not be
unique: a later frame with the same name and context takes its place in
the lookup.

#### Returns

`Frame`

The new frame.

#### Throws

When the game returns no frame, for example for a name no loaded
FDF file defines: `reforged-ts: failed to create Frame (<name>)`, at the
calling line. In Dev mode, also when called before the globals Init stage
or inside `MapPlayer.runLocal`.

#### Native

[BlzCreateFrame](/typings/3.0.0/functions/BlzCreateFrame) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzCreateFrame))

#### Native

[GetHandleId](/typings/3.0.0/functions/GetHandleId) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetHandleId))

***

### createSimple()

> `static` **createSimple**(`name`, `owner`, `createContext`): `Frame`

Defined in: [handles/frame.ts:95](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/frame.ts#L95)

Creates a SimpleFrame from its definition in a loaded FDF file.

#### Parameters

##### name

`string`

The name of the SimpleFrame definition, which is also the
name [Frame.fromName](#fromname) finds the new frame by.

##### owner

`Frame`

The parent frame.

##### createContext

`number`

The number that tells this frame apart from others
created under the same name, for [Frame.fromName](#fromname). It need not be
unique: a later frame with the same name and context takes its place in
the lookup.

#### Returns

`Frame`

The new frame.

#### Remarks

SimpleFrames are a separate family of frames, with their own FDF types:
https://www.hiveworkshop.com/threads/ui-simpleframes.320385/

#### Throws

When the game returns no frame, for example for a name no loaded
FDF file defines: `reforged-ts: failed to create Frame (<name>)`, at the
calling line. In Dev mode, also when called before the globals Init stage
or inside `MapPlayer.runLocal`.

#### Native

[BlzCreateSimpleFrame](/typings/3.0.0/functions/BlzCreateSimpleFrame) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzCreateSimpleFrame))

#### Native

[GetHandleId](/typings/3.0.0/functions/GetHandleId) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetHandleId))

***

### createType()

> `static` **createType**(`name`, `owner`, `createContext`, `typeName`, `inherits`): `Frame`

Defined in: [handles/frame.ts:127](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/frame.ts#L127)

Creates a frame of a frame type, such as `"BACKDROP"`, `"TEXT"` or
`"GLUEBUTTON"`, optionally from a definition to inherit.

#### Parameters

##### name

`string`

The new frame's name, which [Frame.fromName](#fromname) finds it
by.

##### owner

`Frame`

The parent frame.

##### createContext

`number`

The number that tells this frame apart from others
created under the same name, for [Frame.fromName](#fromname). It need not be
unique: a later frame with the same name and context takes its place in
the lookup.

##### typeName

`string`

The frame type, as an FDF file writes it.

##### inherits

`string`

The name of a loaded frame definition the new frame
copies, or `""` for none.

#### Returns

`Frame`

The new frame.

#### Throws

When the game returns no frame, for example for an unknown frame
type or definition: `reforged-ts: failed to create Frame (<name>)`, at the
calling line. In Dev mode, also when called before the globals Init stage
or inside `MapPlayer.runLocal`.

#### Native

[BlzCreateFrameByType](/typings/3.0.0/functions/BlzCreateFrameByType) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzCreateFrameByType))

#### Native

[GetHandleId](/typings/3.0.0/functions/GetHandleId) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetHandleId))

***

### frameToPixelX()

> `static` **frameToPixelX**(`frameX`): `number`

Defined in: [handles/frame.ts:791](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/frame.ts#L791)

**`Async`**

Converts a horizontal position in frame units to pixels of the local
screen.

#### Parameters

##### frameX

`number`

The x-coordinate, in frame units.

#### Returns

`number`

The x-coordinate, in pixels.

#### Remarks

It depends on the local resolution, so it differs between clients.

#### Native

[BlzFrameToPixelX](/typings/3.0.0/functions/BlzFrameToPixelX) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzFrameToPixelX))

***

### frameToPixelY()

> `static` **frameToPixelY**(`frameY`): `number`

Defined in: [handles/frame.ts:805](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/frame.ts#L805)

**`Async`**

Converts a vertical position in frame units to pixels of the local
screen.

#### Parameters

##### frameY

`number`

The y-coordinate, in frame units.

#### Returns

`number`

The y-coordinate, in pixels.

#### Remarks

It depends on the local resolution, so it differs between clients.

#### Native

[BlzFrameToPixelY](/typings/3.0.0/functions/BlzFrameToPixelY) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzFrameToPixelY))

***

### fromEvent()

> `static` **fromEvent**(): `Frame` \| `undefined`

Defined in: [handles/frame.ts:814](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/frame.ts#L814)

Gets the frame of the frame event being handled.

#### Returns

`Frame` \| `undefined`

The frame, or `undefined` outside a frame event.

#### Native

[BlzGetTriggerFrame](/typings/3.0.0/functions/BlzGetTriggerFrame) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzGetTriggerFrame))

***

### fromHandle()

> `static` **fromHandle**\<`C`\>(`this`, `handle`): `C` \| `undefined`

Defined in: [handles/frame.ts:828](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/frame.ts#L828)

Gets the Wrapper for a Handle, as [Handle.fromHandle](Handle.md#fromhandle) does, except
that the game's "not found" frame (handle id 0) is nothing: `undefined`,
never registered.

#### Type Parameters

##### C

`C` *extends* [`Handle`](Handle.md)\<`handle`\>

The Wrapper class asked for: `Frame` or a subclass of it.

#### Parameters

##### this

[`WrapperClass`](../type-aliases/WrapperClass.md)\<`C`\>

##### handle

`C`\[`"handle"`\] \| `undefined`

The Handle to wrap.

#### Returns

`C` \| `undefined`

The Wrapper, the same object for the same Handle, or `undefined`
when `handle` is `undefined` or the "not found" frame.

#### Native

[GetHandleId](/typings/3.0.0/functions/GetHandleId) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetHandleId))

#### Overrides

[`Handle`](Handle.md).[`fromHandle`](Handle.md#fromhandle)

***

### fromName()

> `static` **fromName**(`name`, `createContext`): `Frame` \| `undefined`

Defined in: [handles/frame.ts:852](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/frame.ts#L852)

Looks up the frame created under a name and a create context.

#### Parameters

##### name

`string`

The name the frame was created under.

##### createContext

`number`

The create context it was created with.

#### Returns

`Frame` \| `undefined`

The frame, or `undefined` when the game finds none.

#### Remarks

The first lookup of a frame the library has no Wrapper for allocates a
Handle id, so look the frame up once, outside `MapPlayer.runLocal`, then
use it inside.

#### Example

```ts
// Finding a frame again by the name and create context it was created
// under, where no reference to it is at hand. A name the game does not know
// gives undefined, never a frame.
import { Frame, Init } from "reforged-ts";

Init.onGameStart(() => {
  const gameUi = Frame.fromOrigin(ORIGIN_FRAME_GAME_UI, 0);
  if (gameUi === undefined) {
    return;
  }
  Frame.create("ScorePanel", gameUi, 0, 0);

  const panel = Frame.fromName("ScorePanel", 0);
  if (panel?.getParent() === gameUi) {
    print("Found the score panel under the game UI.");
  }
  if (Frame.fromName("NoSuchPanel", 0) === undefined) {
    print("No frame is named NoSuchPanel.");
  }
});
```

#### Throws

In Dev mode, when the first lookup of a frame runs inside
`MapPlayer.runLocal`:
`reforged-ts: the first Frame.fromName("<name>") inside MapPlayer.runLocal changes game state for one client, which desyncs the game: only visuals belong inside runLocal`.

#### Native

[BlzGetFrameByName](/typings/3.0.0/functions/BlzGetFrameByName) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzGetFrameByName))

#### Native

[GetHandleId](/typings/3.0.0/functions/GetHandleId) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetHandleId))

***

### fromOrigin()

> `static` **fromOrigin**(`frameType`, `index`): `Frame` \| `undefined`

Defined in: [handles/frame.ts:877](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/frame.ts#L877)

Gets one of the game's own frames, such as the game UI or a command
button.

#### Parameters

##### frameType

`originframetype`

The kind of frame, such as `ORIGIN_FRAME_GAME_UI`.

##### index

`number`

Which frame of that kind, from 0, for a kind that has
several (the command buttons, the hero buttons); 0 otherwise.

#### Returns

`Frame` \| `undefined`

The frame, or `undefined` when the game has none of that kind at
that index.

#### Native

[BlzGetOriginFrame](/typings/3.0.0/functions/BlzGetOriginFrame) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzGetOriginFrame))

***

### getEventHandle()

> `static` **getEventHandle**(): `frameeventtype` \| `undefined`

Defined in: [handles/frame.ts:890](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/frame.ts#L890)

Gets the kind of the frame event being handled, such as
`FRAMEEVENT_CONTROL_CLICK`.

#### Returns

`frameeventtype` \| `undefined`

The event type, or `undefined` outside a frame event.

#### Native

[BlzGetTriggerFrameEvent](/typings/3.0.0/functions/BlzGetTriggerFrameEvent) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzGetTriggerFrameEvent))

***

### getEventText()

> `static` **getEventText**(): `string` \| `undefined`

Defined in: [handles/frame.ts:900](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/frame.ts#L900)

Gets the text of the frame event being handled, such as what a player
entered in an edit box.

#### Returns

`string` \| `undefined`

The text, or `undefined` outside a frame event.

#### Native

[BlzGetTriggerFrameText](/typings/3.0.0/functions/BlzGetTriggerFrameText) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzGetTriggerFrameText))

***

### getEventValue()

> `static` **getEventValue**(): `number`

Defined in: [handles/frame.ts:910](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/frame.ts#L910)

Gets the value of the frame event being handled, such as the new value of
a slider.

#### Returns

`number`

The value; it means nothing outside a frame event.

#### Native

[BlzGetTriggerFrameValue](/typings/3.0.0/functions/BlzGetTriggerFrameValue) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzGetTriggerFrameValue))

***

### hideOrigin()

> `static` **hideOrigin**(`enable`): `void`

Defined in: [handles/frame.ts:919](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/frame.ts#L919)

Hides the game's own interface, the origin frames, or shows it again.

#### Parameters

##### enable

`boolean`

`true` to hide the game's interface, `false` to show it.

#### Returns

`void`

#### Native

[BlzHideOriginFrames](/typings/3.0.0/functions/BlzHideOriginFrames) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzHideOriginFrames))

***

### loadTOC()

> `static` **loadTOC**(`filename`): `boolean`

Defined in: [handles/frame.ts:931](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/frame.ts#L931)

Loads a TOC file, the list of FDF files whose frame definitions
[Frame.create](#create) and [Frame.createSimple](#createsimple) can then use.

#### Parameters

##### filename

`string`

The path of the TOC file, in the map or the game's
files.

#### Returns

`boolean`

`true` when the game loaded the file.

#### Native

[BlzLoadTOCFile](/typings/3.0.0/functions/BlzLoadTOCFile) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzLoadTOCFile))

***

### pixelToFrameX()

> `static` **pixelToFrameX**(`pixelX`): `number`

Defined in: [handles/frame.ts:945](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/frame.ts#L945)

**`Async`**

Converts a horizontal position in pixels of the local screen to frame
units.

#### Parameters

##### pixelX

`number`

The x-coordinate, in pixels.

#### Returns

`number`

The x-coordinate, in frame units.

#### Remarks

It depends on the local resolution, so it differs between clients.

#### Native

[BlzPixelToFrameX](/typings/3.0.0/functions/BlzPixelToFrameX) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzPixelToFrameX))

***

### pixelToFrameY()

> `static` **pixelToFrameY**(`pixelY`): `number`

Defined in: [handles/frame.ts:959](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/frame.ts#L959)

**`Async`**

Converts a vertical position in pixels of the local screen to frame
units.

#### Parameters

##### pixelY

`number`

The y-coordinate, in pixels.

#### Returns

`number`

The y-coordinate, in frame units.

#### Remarks

It depends on the local resolution, so it differs between clients.

#### Native

[BlzPixelToFrameY](/typings/3.0.0/functions/BlzPixelToFrameY) ([jassbot](https://lep.duckdns.org/jassbot/doc/BlzPixelToFrameY))
