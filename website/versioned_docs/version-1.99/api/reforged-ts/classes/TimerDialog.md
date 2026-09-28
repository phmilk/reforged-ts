# Class: TimerDialog

Defined in: [handles/timerdialog.ts:16](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/timerdialog.ts#L16)

A timer window: a countdown in the top-right corner of the screen, a title
followed by the time a [Timer](Timer.md) has left.

## Remarks

Several shown timer dialogs line up from right to left. One whose Timer was
never started shows its title and no time.

## Example

**A countdown to the first wave**

```ts
// A timer window counting down to the first wave, shown to every player
// once the game starts, and destroyed with its Timer when the wave comes.
import { Init, Timer, TimerDialog } from "reforged-ts";

Init.onGameStart(() => {
  const timer = Timer.create();
  const countdown = TimerDialog.create(timer);
  countdown.setTitle("First wave");
  countdown.setTitleColor(255, 204, 0, 255);
  countdown.display = true;

  timer.start(60, false, () => {
    countdown.destroy();
    timer.destroy();
    print("The first wave comes!");
  });
});
```

## Native

[timerdialog](/typings/3.0.0/interfaces/timerdialog) ([jassbot](https://lep.duckdns.org/jassbot/doc/timerdialog))

## Extends

- [`Handle`](Handle.md)\<`timerdialog`\>

## Properties

### handle

> `readonly` **handle**: `timerdialog`

Defined in: [handles/handle.ts:132](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/handle.ts#L132)

The Handle this Wrapper owns, to pass to a Native the library does not
wrap.

#### Remarks

Do not keep it after `destroy()`: the game frees the object behind it.

#### Inherited from

[`Handle`](Handle.md).[`handle`](Handle.md#handle)

## Accessors

### display

#### Get Signature

> **get** **display**(): `boolean`

Defined in: [handles/timerdialog.ts:39](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/timerdialog.ts#L39)

Whether the timer dialog is on screen, for every player at once.

##### Native

[IsTimerDialogDisplayed](/typings/3.0.0/functions/IsTimerDialogDisplayed) ([jassbot](https://lep.duckdns.org/jassbot/doc/IsTimerDialogDisplayed))

##### Returns

`boolean`

True when it is shown; false when it is hidden, as a new one
is.

#### Set Signature

> **set** **display**(`display`): `void`

Defined in: [handles/timerdialog.ts:48](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/timerdialog.ts#L48)

Whether the timer dialog is shown, to every player: true shows it, false
hides it.

##### Native

[TimerDialogDisplay](/typings/3.0.0/functions/TimerDialogDisplay) ([jassbot](https://lep.duckdns.org/jassbot/doc/TimerDialogDisplay))

##### Parameters

###### display

`boolean`

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

## Methods

### destroy()

> **destroy**(): `void`

Defined in: [handles/timerdialog.ts:61](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/timerdialog.ts#L61)

Destroys the TimerDialog through its Native.

#### Returns

`void`

#### Remarks

In Dev mode the destroyed Wrapper becomes a tombstone: any later access,
a second `destroy()` included, raises
`reforged-ts: used after destroy: <Class>#<id>`, and
`Reforged.debug.report()` counts it destroyed.

#### Native

[DestroyTimerDialog](/typings/3.0.0/functions/DestroyTimerDialog) ([jassbot](https://lep.duckdns.org/jassbot/doc/DestroyTimerDialog))

***

### setSpeed()

> **setSpeed**(`speedMultFactor`): `void`

Defined in: [handles/timerdialog.ts:73](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/timerdialog.ts#L73)

Scales the time shown, without changing the Timer.

#### Parameters

##### speedMultFactor

`number`

The factor the remaining time is multiplied by
before it is shown: 1 by default, 2 shows it twice as large and running
twice as fast, 0 always shows zero.

#### Returns

`void`

#### Native

[TimerDialogSetSpeed](/typings/3.0.0/functions/TimerDialogSetSpeed) ([jassbot](https://lep.duckdns.org/jassbot/doc/TimerDialogSetSpeed))

***

### setTimeColor()

> **setTimeColor**(`red`, `green`, `blue`, `alpha`): `void`

Defined in: [handles/timerdialog.ts:122](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/timerdialog.ts#L122)

Sets the colour of the time.

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

The opacity, from 0 to 255; the game ignores it, so pass 255.

#### Returns

`void`

#### Native

[TimerDialogSetTimeColor](/typings/3.0.0/functions/TimerDialogSetTimeColor) ([jassbot](https://lep.duckdns.org/jassbot/doc/TimerDialogSetTimeColor))

***

### setTimeRemaining()

> **setTimeRemaining**(`value`): `void`

Defined in: [handles/timerdialog.ts:83](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/timerdialog.ts#L83)

Sets the time shown and stops following the Timer: the countdown then
runs from this time and stays at zero once it gets there.

#### Parameters

##### value

`number`

The time, in seconds.

#### Returns

`void`

#### Native

[TimerDialogSetRealTimeRemaining](/typings/3.0.0/functions/TimerDialogSetRealTimeRemaining) ([jassbot](https://lep.duckdns.org/jassbot/doc/TimerDialogSetRealTimeRemaining))

***

### setTitle()

> **setTitle**(`title`): `void`

Defined in: [handles/timerdialog.ts:93](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/timerdialog.ts#L93)

Sets the title shown before the time; a long one is cut short with an
ellipsis.

#### Parameters

##### title

`string`

The text before the time, such as `"Next wave"`.

#### Returns

`void`

#### Native

[TimerDialogSetTitle](/typings/3.0.0/functions/TimerDialogSetTitle) ([jassbot](https://lep.duckdns.org/jassbot/doc/TimerDialogSetTitle))

***

### setTitleColor()

> **setTitleColor**(`red`, `green`, `blue`, `alpha`): `void`

Defined in: [handles/timerdialog.ts:105](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/timerdialog.ts#L105)

Sets the colour of the title.

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

The opacity, from 0 to 255; the game ignores it, so pass 255.

#### Returns

`void`

#### Native

[TimerDialogSetTitleColor](/typings/3.0.0/functions/TimerDialogSetTitleColor) ([jassbot](https://lep.duckdns.org/jassbot/doc/TimerDialogSetTitleColor))

***

### create()

> `static` **create**(`t`): `TimerDialog`

Defined in: [handles/timerdialog.ts:29](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/timerdialog.ts#L29)

Creates a hidden timer dialog that counts down with a Timer, titled
"Remaining" in the player's language.

#### Parameters

##### t

[`Timer`](Timer.md)

The Timer whose remaining time it shows.

#### Returns

`TimerDialog`

The new timer dialog.

#### Remarks

The error message names the TimerDialog. In w3ts 3.x it read
`w3ts failed to create timer handle.`, naming the wrong Handle type.

#### Throws

When the game returns no handle: `reforged-ts: failed to create TimerDialog`, at the calling line.
In Dev mode, also when called before the globals Init stage or inside `MapPlayer.runLocal`.

#### Native

[CreateTimerDialog](/typings/3.0.0/functions/CreateTimerDialog) ([jassbot](https://lep.duckdns.org/jassbot/doc/CreateTimerDialog))

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
