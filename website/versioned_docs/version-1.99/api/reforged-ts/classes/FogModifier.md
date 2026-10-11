# Class: FogModifier

Defined in: [handles/fogmodifier.ts:18](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/fogmodifier.ts#L18)

A fog modifier: a fog-of-war state forced on an area for one player, such
as a region kept visible or kept black.

## Remarks

A new fog modifier does nothing until `start`; while it runs, it overrides
the player's own fog over its area, and `stop` gives it back.

## Example

**Revealing the centre of the map to a player**

```ts
// The centre of the map kept visible to the first player for thirty seconds:
// a fog modifier does nothing until it is started.
import { FogModifier, Init, Timer, tsGlobals } from "reforged-ts";

Init.onGameStart(() => {
  const reveal = FogModifier.create(
    tsGlobals.Players[0],
    FOG_OF_WAR_VISIBLE,
    0,
    0,
    1024,
    true,
    false,
  );
  reveal.start();
  Timer.after(30, () => {
    reveal.destroy();
  });
});
```

## Native

[fogmodifier](/typings/3.0.0/interfaces/fogmodifier) ([jassbot](https://lep.duckdns.org/jassbot/doc/fogmodifier))

## Extends

- [`Handle`](Handle.md)\<`fogmodifier`\>

## Properties

### handle

> `readonly` **handle**: `fogmodifier`

Defined in: [handles/handle.ts:132](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/handle.ts#L132)

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

Defined in: [handles/handle.ts:148](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/handle.ts#L148)

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

Defined in: [handles/fogmodifier.ts:120](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/fogmodifier.ts#L120)

Destroys the FogModifier through its Native.

#### Returns

`void`

#### Remarks

In Dev mode the destroyed Wrapper becomes a tombstone: any later access,
a second `destroy()` included, raises
`reforged-ts: used after destroy: <Class>#<id>`, and
`Reforged.debug.report()` counts it destroyed.

#### Example

**The handles a feature owns, destroyed when it ends**

```ts
// A shrine that stands for 60 seconds, with everything it shows. Its
// handles belong to it alone: its end destroys each of them once, on every
// client, and drops the object that held them, so no reference survives.
// Any later use of a destroyed Wrapper raises in Dev mode
// (`reforged-ts: used after destroy: <Class>#<id>`); without Dev mode it
// reaches a Handle the game has freed.
import {
  Effect,
  FogModifier,
  Image,
  ImageType,
  Init,
  MapPlayer,
  Rectangle,
  Region,
  TextTag,
  Timer,
  Trigger,
  tsGlobals,
  Ubersplat,
  Unit,
  WeatherEffect,
} from "reforged-ts";

interface Shrine {
  readonly area: Rectangle;
  readonly region: Region;
  readonly trigger: Trigger;
  readonly timer: Timer;
  readonly glow: Effect;
  readonly label: TextTag;
  readonly circle: Image;
  readonly splat: Ubersplat;
  readonly vision: FogModifier;
  readonly rain: WeatherEffect;
}

let shrine: Shrine | undefined;

/** Ends the shrine: every handle it owns is destroyed, then forgotten. */
export function endShrine(): void {
  if (shrine === undefined) {
    return;
  }
  const { area, region, trigger, timer, glow, label } = shrine;
  const { circle, splat, vision, rain } = shrine;
  shrine = undefined;
  trigger.destroy();
  region.destroy();
  rain.destroy();
  area.destroy();
  glow.destroy();
  label.destroy();
  circle.destroy();
  splat.destroy();
  vision.destroy();
  timer.destroy();
}

/** Raises a shrine at (x, y) for `owner`, healing the heroes who enter. */
export function raiseShrine(owner: MapPlayer, x: number, y: number): void {
  endShrine();
  const area = Rectangle.create(x - 256, y - 256, x + 256, y + 256);
  const region = Region.create();
  region.addRect(area);
  const trigger = Trigger.create().registerEnterRegion(region, () => {
    return Unit.fromFilter()?.isHero() === true;
  });
  trigger.addAction(() => {
    const hero = Unit.fromEntering();
    if (hero !== undefined) {
      hero.life = hero.maxLife;
    }
  });
  const rain = WeatherEffect.create(area, FourCC("RAlr"));
  rain.enable(true);
  const label = TextTag.create();
  label.setText("Shrine", 12, true);
  label.setPos(x, y, 128);
  const circle = Image.create(
    "ReplaceableTextures\\Selection\\SpellAreaOfEffect.blp",
    512,
    512,
    0,
    x - 256,
    y - 256,
    0,
    0,
    0,
    0,
    ImageType.Indicator,
  );
  circle.setRender(true);
  const splat = Ubersplat.create(x, y, "HMED", 255, 255, 255, 255, true, true);
  splat.show(true);
  const vision = FogModifier.create(
    owner,
    FOG_OF_WAR_VISIBLE,
    x,
    y,
    512,
    true,
    false,
  );
  vision.start();
  shrine = {
    area,
    region,
    trigger,
    timer: Timer.create().start(60, false, endShrine),
    glow: Effect.create(
      "Abilities\\Spells\\Human\\HolyBolt\\HolyBoltSpecialArt.mdl",
      x,
      y,
    ),
    label,
    circle,
    splat,
    vision,
    rain,
  };
}

Init.onGameStart(() => {
  raiseShrine(tsGlobals.Players[0], 0, 0);
});
```

#### Native

[DestroyFogModifier](/typings/3.0.0/functions/DestroyFogModifier) ([jassbot](https://lep.duckdns.org/jassbot/doc/DestroyFogModifier))

***

### start()

> **start**(): `void`

Defined in: [handles/fogmodifier.ts:130](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/fogmodifier.ts#L130)

Turns the fog modifier on: its state overrides the player's fog over its
area.

#### Returns

`void`

#### Native

[FogModifierStart](/typings/3.0.0/functions/FogModifierStart) ([jassbot](https://lep.duckdns.org/jassbot/doc/FogModifierStart))

***

### stop()

> **stop**(): `void`

Defined in: [handles/fogmodifier.ts:138](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/fogmodifier.ts#L138)

Turns the fog modifier off: the area returns to the player's own fog.

#### Returns

`void`

#### Native

[FogModifierStop](/typings/3.0.0/functions/FogModifierStop) ([jassbot](https://lep.duckdns.org/jassbot/doc/FogModifierStop))

***

### create()

> `static` **create**(`forWhichPlayer`, `whichState`, `centerX`, `centerY`, `radius`, `useSharedVision`, `afterUnits`): `FogModifier`

Defined in: [handles/fogmodifier.ts:43](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/fogmodifier.ts#L43)

Creates a stopped fog modifier over a circle.

#### Parameters

##### forWhichPlayer

[`MapPlayer`](MapPlayer.md)

The player whose fog it changes.

##### whichState

`fogstate`

The fog state forced on the area, such as
`FOG_OF_WAR_VISIBLE`.

##### centerX

`number`

The x-coordinate of the circle's centre, in world units.

##### centerY

`number`

The y-coordinate of the circle's centre, in world units.

##### radius

`number`

The radius of the circle, in world units.

##### useSharedVision

`boolean`

Whether the players sharing vision with
`forWhichPlayer` get the change too.

##### afterUnits

`boolean`

Whether a masking state also hides what the player's
units see in the area, units included; `false` masks only what they do
not see.

#### Returns

`FogModifier`

The new fog modifier.

#### Remarks

`CreateFogModifierRadius` crashed the game with a radius of 2147483647
on 3.0.0.24268; every other radius measured (0, negative, past the edge
of the world) worked. Dev mode does not check the radius.

#### Throws

When the game returns no handle:
`reforged-ts: failed to create FogModifier`, at the calling line. In Dev
mode, also when called before the globals Init stage or inside
`MapPlayer.runLocal`.

#### Native

[CreateFogModifierRadius](/typings/3.0.0/functions/CreateFogModifierRadius) ([jassbot](https://lep.duckdns.org/jassbot/doc/CreateFogModifierRadius))

***

### createAtPoint()

> `static` **createAtPoint**(`forWhichPlayer`, `whichState`, `center`, `radius`, `useSharedVision`, `afterUnits`): `FogModifier`

Defined in: [handles/fogmodifier.ts:89](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/fogmodifier.ts#L89)

Creates a stopped fog modifier over a circle around `center`, through
`CreateFogModifierRadiusLoc`.

#### Parameters

##### forWhichPlayer

[`MapPlayer`](MapPlayer.md)

The player whose fog it changes.

##### whichState

`fogstate`

The fog state forced on the area, such as
`FOG_OF_WAR_VISIBLE`.

##### center

[`Point`](Point.md)

The centre of the circle.

##### radius

`number`

The radius of the circle, in world units.

##### useSharedVision

`boolean`

Whether the players sharing vision with
`forWhichPlayer` get the change too.

##### afterUnits

`boolean`

Whether a masking state also hides what the player's
units see in the area; `false` masks only what they do not see.

#### Returns

`FogModifier`

The new fog modifier.

#### Remarks

`CreateFogModifierRadiusLoc` crashed the game with a radius of
2147483647 on 3.0.0.24268, in 3 of 4 runs; every other radius measured
(0, negative, past the edge of the world) worked. Dev mode does not
check the radius.

#### Throws

When the game returns no handle:
`reforged-ts: failed to create FogModifier`, at the calling line. In Dev
mode, also when called before the globals Init stage or inside
`MapPlayer.runLocal`.

#### Native

[CreateFogModifierRadiusLoc](/typings/3.0.0/functions/CreateFogModifierRadiusLoc) ([jassbot](https://lep.duckdns.org/jassbot/doc/CreateFogModifierRadiusLoc))

***

### fromHandle()

> `static` **fromHandle**\<`C`\>(`this`, `handle`): `C` \| `undefined`

Defined in: [handles/handle.ts:195](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/handle.ts#L195)

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

***

### fromRect()

> `static` **fromRect**(`forWhichPlayer`, `whichState`, `where`, `useSharedVision`, `afterUnits`): `FogModifier`

Defined in: [handles/fogmodifier.ts:161](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/handles/fogmodifier.ts#L161)

Creates a stopped fog modifier over the rectangle `where`.

#### Parameters

##### forWhichPlayer

[`MapPlayer`](MapPlayer.md)

The player whose fog it changes.

##### whichState

`fogstate`

The fog state forced on the area, such as
`FOG_OF_WAR_VISIBLE`.

##### where

[`Rectangle`](Rectangle.md)

The rectangle the fog state is forced on.

##### useSharedVision

`boolean`

Whether the players sharing vision with
`forWhichPlayer` get the change too.

##### afterUnits

`boolean`

Whether a masking state also hides what the player's
units see in the area; `false` masks only what they do not see.

#### Returns

`FogModifier`

The new fog modifier.

#### Remarks

A creation, whatever its name says: each call makes a new fog modifier.

#### Throws

When the game returns no handle:
`reforged-ts: failed to create FogModifier`, at the calling line. In Dev
mode, also when called before the globals Init stage or inside
`MapPlayer.runLocal`.

#### Native

[CreateFogModifierRect](/typings/3.0.0/functions/CreateFogModifierRect) ([jassbot](https://lep.duckdns.org/jassbot/doc/CreateFogModifierRect))
