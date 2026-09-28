# Class: Image

Defined in: [handles/image.ts:40](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/image.ts#L40)

An image: a texture drawn flat on the ground of the map, such as an
area-of-effect marker.

## Remarks

- `setRender(true)` makes the game draw it; `show` hides and shows it
  after that.
- Its position is the bottom-left corner of the texture, not its centre.

## Example

**An area-of-effect marker around a point**

```ts
// A 256-wide area-of-effect marker centred on a point: the image's position
// is its bottom-left corner, so it is placed half its size away. It is drawn
// once setRender(true) is called.
import { Image, ImageType, Init } from "reforged-ts";

const SIZE = 256;

/** Marks the area around (x, y), tinted red. */
export function markArea(x: number, y: number): Image {
  const marker = Image.create(
    "ReplaceableTextures\\Selection\\SpellAreaOfEffect.blp",
    SIZE,
    SIZE,
    0,
    x - SIZE / 2,
    y - SIZE / 2,
    0,
    0,
    0,
    0,
    ImageType.Indicator,
  );
  marker.setColor(255, 64, 64, 200);
  marker.setRender(true);
  return marker;
}

Init.onGameStart(() => {
  markArea(0, 0);
});
```

## Native

[image](/typings/3.0.0/interfaces/image) ([jassbot](https://lep.duckdns.org/jassbot/doc/image))

## Extends

- [`Handle`](Handle.md)\<`image`\>

## Properties

### handle

> `readonly` **handle**: `image`

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

Defined in: [handles/image.ts:113](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/image.ts#L113)

Destroys the image; images have no reference count, so the game can
reuse its handle id at once.

#### Returns

`void`

#### Remarks

In Dev mode the destroyed Wrapper becomes a tombstone: any later access,
a second `destroy()` included, raises
`reforged-ts: used after destroy: <Class>#<id>`, and
`Reforged.debug.report()` counts it destroyed.

#### Native

[DestroyImage](/typings/3.0.0/functions/DestroyImage) ([jassbot](https://lep.duckdns.org/jassbot/doc/DestroyImage))

#### Bug

Given an invalid image, such as `null` or one from before any image
was created, it can crash the game.

***

### setAboveWater()

> **setAboveWater**(`flag`, `useWaterAlpha`): `void`

Defined in: [handles/image.ts:126](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/image.ts#L126)

Sets whether the image is drawn above water.

#### Parameters

##### flag

`boolean`

`true` to draw the image over the water.

##### useWaterAlpha

`boolean`

Whether the image takes the water's transparency.

#### Returns

`void`

#### Remarks

Only images of the Selection layer appear to show above water.

#### Native

[SetImageAboveWater](/typings/3.0.0/functions/SetImageAboveWater) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetImageAboveWater))

***

### setColor()

> **setColor**(`red`, `green`, `blue`, `alpha`): `void`

Defined in: [handles/image.ts:138](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/image.ts#L138)

Tints the image and sets its transparency.

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

The opacity, from 0 (invisible) to 255 (opaque).

#### Returns

`void`

#### Native

[SetImageColor](/typings/3.0.0/functions/SetImageColor) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetImageColor))

***

### setConstantHeight()

> **setConstantHeight**(`flag`, `height`): `void`

Defined in: [handles/image.ts:151](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/image.ts#L151)

Sets whether the image is drawn at a fixed height instead of on the
ground.

#### Parameters

##### flag

`boolean`

`true` to draw the image at `height`.

##### height

`number`

The height to draw the image at, in world units.

#### Returns

`void`

#### Remarks

No other function changes an image's z-offset.

#### Native

[SetImageConstantHeight](/typings/3.0.0/functions/SetImageConstantHeight) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetImageConstantHeight))

***

### setPosition()

> **setPosition**(`x`, `y`, `z`): `void`

Defined in: [handles/image.ts:164](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/image.ts#L164)

Moves the image so that its bottom-left corner is at the point, less the
`originX`, `originY` and `originZ` offsets it was created with.

#### Parameters

##### x

`number`

The x-coordinate, in world units.

##### y

`number`

The y-coordinate, in world units.

##### z

`number`

The z-coordinate; the height changes through
`setConstantHeight` only.

#### Returns

`void`

#### Native

[SetImagePosition](/typings/3.0.0/functions/SetImagePosition) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetImagePosition))

***

### setRender()

> **setRender**(`flag`): `void`

Defined in: [handles/image.ts:173](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/image.ts#L173)

Enable or disable the rendering of the image.

#### Parameters

##### flag

`boolean`

render if true, don't render if false

#### Returns

`void`

#### Native

[SetImageRenderAlways](/typings/3.0.0/functions/SetImageRenderAlways) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetImageRenderAlways))

***

### setType()

> **setType**(`imageType`): `void`

Defined in: [handles/image.ts:183](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/image.ts#L183)

Moves the image to another layer.

#### Parameters

##### imageType

[`ImageType`](../enumerations/ImageType.md)

The layer, which decides the images it covers and the
images that cover it.

#### Returns

`void`

#### Native

[SetImageType](/typings/3.0.0/functions/SetImageType) ([jassbot](https://lep.duckdns.org/jassbot/doc/SetImageType))

***

### show()

> **show**(`flag`): `void`

Defined in: [handles/image.ts:193](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/image.ts#L193)

Shows or hides the image.

#### Parameters

##### flag

`boolean`

`true` to show the image, `false` to hide it.

#### Returns

`void`

#### Remarks

It appears to do the same as `setRender`.

#### Native

[ShowImage](/typings/3.0.0/functions/ShowImage) ([jassbot](https://lep.duckdns.org/jassbot/doc/ShowImage))

***

### create()

> `static` **create**(`file`, `sizeX`, `sizeY`, `sizeZ`, `posX`, `posY`, `posZ`, `originX`, `originY`, `originZ`, `imageType`): `Image`

Defined in: [handles/image.ts:70](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/image.ts#L70)

Creates an image of a texture at the given point.

#### Parameters

##### file

`string`

The texture's path. Its border should be fully
transparent. An invalid path makes `CreateImage` return the invalid
image, id -1.

##### sizeX

`number`

The image's extent along x, in world units.

##### sizeY

`number`

The image's extent along y, in world units.

##### sizeZ

`number`

The image's extent along z, in world units.

##### posX

`number`

The x-coordinate of the image's bottom-left corner.

##### posY

`number`

The y-coordinate of the image's bottom-left corner.

##### posZ

`number`

The z-coordinate of the image.

##### originX

`number`

How far the bottom-left corner moves from `posX`,
towards negative x.

##### originY

`number`

How far the bottom-left corner moves from `posY`,
towards negative y.

##### originZ

`number`

How far the bottom-left corner moves from `posZ`,
towards negative z.

##### imageType

[`ImageType`](../enumerations/ImageType.md)

The layer the image is drawn in.

#### Returns

`Image`

The new image.

#### Remarks

- Image ids start at 0 and go up by one with each image created.
- Within one layer, images are drawn in the order they were created: a
  newer image covers an older one.

#### Throws

When the game returns no handle:
`reforged-ts: failed to create Image (<file>)`, at the calling line. In
Dev mode, also when called before the globals Init stage or inside
`MapPlayer.runLocal`.

#### Native

[CreateImage](/typings/3.0.0/functions/CreateImage) ([jassbot](https://lep.duckdns.org/jassbot/doc/CreateImage))

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
