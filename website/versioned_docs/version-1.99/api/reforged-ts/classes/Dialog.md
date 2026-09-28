# Class: Dialog

Defined in: [handles/dialog.ts:72](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/dialog.ts#L72)

A menu of buttons shown in the middle of the screen, to the players it is
displayed to.

## Remarks

A player who sees a dialog can do nothing else until they click one of its
buttons, and the game shows no dialog during map initialization: display it
from a Timer once the game runs.

## Example

**Create a simple dialog.**

```ts
// A dialog with two buttons for the first player. The game shows no dialog
// during map initialization, so a Timer adds the buttons and shows it a
// second after the game starts.
import {
  Dialog,
  DialogButton,
  Init,
  Timer,
  Trigger,
  tsGlobals,
} from "reforged-ts";

Init.onTriggers(() => {
  const dialog = Dialog.create();
  let stay: DialogButton | undefined;

  Trigger.create()
    .registerDialogEvent(dialog)
    .addAction(() => {
      if (DialogButton.fromEvent() === stay) {
        print("Staying.");
      }
    });

  Timer.create().start(1.0, false, () => {
    stay = DialogButton.create(dialog, "Stay", 0);
    DialogButton.create(dialog, "Leave", 0, true);

    dialog.setMessage("Welcome to TypeScript!");
    dialog.display(tsGlobals.Players[0], true);
  });
});
```

## Native

[dialog](/typings/3.0.0/interfaces/dialog) ([jassbot](https://lep.duckdns.org/jassbot/doc/dialog))

## Extends

- [`Handle`](Handle.md)\<`dialog`\>

## Properties

### handle

> `readonly` **handle**: `dialog`

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

### addButton()

> **addButton**(`text`, `hotkey?`, `quit?`, `score?`): [`DialogButton`](DialogButton.md)

Defined in: [handles/dialog.ts:100](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/dialog.ts#L100)

Adds a button to the bottom of the dialog, as [DialogButton.create](DialogButton.md#create)
does.

#### Parameters

##### text

`string`

The label the player reads on the button.

##### hotkey?

`number` = `0`

The key that clicks the button: the character code of an
upper-case letter, such as `"F".charCodeAt(0)`; 0, the default, for none.

##### quit?

`boolean` = `false`

When true, clicking the button makes the player leave the
game; false by default.

##### score?

`boolean` = `false`

With `quit`, whether the leaving player sees the score
screen rather than the main menu; false by default.

#### Returns

[`DialogButton`](DialogButton.md)

The new button.

#### Throws

When the game returns no handle: `reforged-ts: failed to create DialogButton`, at the calling line.
In Dev mode, also when called before the globals Init stage or inside `MapPlayer.runLocal`.

#### Native

[DialogAddQuitButton](/typings/3.0.0/functions/DialogAddQuitButton) ([jassbot](https://lep.duckdns.org/jassbot/doc/DialogAddQuitButton))

#### Native

[DialogAddButton](/typings/3.0.0/functions/DialogAddButton) ([jassbot](https://lep.duckdns.org/jassbot/doc/DialogAddButton))

***

### clear()

> **clear**(): `void`

Defined in: [handles/dialog.ts:116](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/dialog.ts#L116)

Removes the dialog's message and every button, even while it is shown.

#### Returns

`void`

#### Remarks

Hide the dialog first: a player who still sees it cleared has no button
left to close it with.

#### Native

[DialogClear](/typings/3.0.0/functions/DialogClear) ([jassbot](https://lep.duckdns.org/jassbot/doc/DialogClear))

***

### destroy()

> **destroy**(): `void`

Defined in: [handles/dialog.ts:129](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/dialog.ts#L129)

Destroys the Dialog through its Native.

#### Returns

`void`

#### Remarks

In Dev mode the destroyed Wrapper becomes a tombstone: any later access,
a second `destroy()` included, raises
`reforged-ts: used after destroy: <Class>#<id>`, and
`Reforged.debug.report()` counts it destroyed.

#### Native

[DialogDestroy](/typings/3.0.0/functions/DialogDestroy) ([jassbot](https://lep.duckdns.org/jassbot/doc/DialogDestroy))

***

### display()

> **display**(`whichPlayer`, `flag`): `void`

Defined in: [handles/dialog.ts:144](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/dialog.ts#L144)

Shows the dialog to one player, or hides it from them.

#### Parameters

##### whichPlayer

[`MapPlayer`](MapPlayer.md)

The player who sees or stops seeing the dialog.

##### flag

`boolean`

True to show the dialog, or show it again after adding
buttons; false to hide it.

#### Returns

`void`

#### Remarks

A dialog does not appear when shown during map initialisation:
show it after a wait, or from a Timer of zero seconds, to have it up
as early as the game allows.

#### Native

[DialogDisplay](/typings/3.0.0/functions/DialogDisplay) ([jassbot](https://lep.duckdns.org/jassbot/doc/DialogDisplay))

***

### setMessage()

> **setMessage**(`whichMessage`): `void`

Defined in: [handles/dialog.ts:153](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/dialog.ts#L153)

Sets the message shown above the buttons, even while the dialog is shown.

#### Parameters

##### whichMessage

`string`

The message; an empty string leaves no room for one.

#### Returns

`void`

#### Native

[DialogSetMessage](/typings/3.0.0/functions/DialogSetMessage) ([jassbot](https://lep.duckdns.org/jassbot/doc/DialogSetMessage))

***

### create()

> `static` **create**(): `Dialog`

Defined in: [handles/dialog.ts:80](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/dialog.ts#L80)

Creates an empty dialog, hidden from every player.

#### Returns

`Dialog`

The new dialog.

#### Throws

When the game returns no handle: `reforged-ts: failed to create Dialog`, at the calling line.
In Dev mode, also when called before the globals Init stage or inside `MapPlayer.runLocal`.

#### Native

[DialogCreate](/typings/3.0.0/functions/DialogCreate) ([jassbot](https://lep.duckdns.org/jassbot/doc/DialogCreate))

***

### fromEvent()

> `static` **fromEvent**(): `Dialog` \| `undefined`

Defined in: [handles/dialog.ts:163](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/dialog.ts#L163)

Gets the dialog a player clicked, in a dialog or dialog button event.

#### Returns

`Dialog` \| `undefined`

The clicked dialog, or `undefined` outside a dialog or dialog
button click event.

#### Native

[GetClickedDialog](/typings/3.0.0/functions/GetClickedDialog) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetClickedDialog))

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
