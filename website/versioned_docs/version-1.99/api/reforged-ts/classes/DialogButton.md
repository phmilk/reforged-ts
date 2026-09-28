# Class: DialogButton

Defined in: [handles/dialog.ts:14](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/dialog.ts#L14)

A button of a [Dialog](Dialog.md), which a player clicks to answer it.

## Remarks

Named `DialogButton` because the Native type, `button`, is a dialog's button.

## Example

**Keeping a button to compare it with the clicked one**

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

[button](/typings/3.0.0/interfaces/button) ([jassbot](https://lep.duckdns.org/jassbot/doc/button))

## Extends

- [`Handle`](Handle.md)\<`button`\>

## Properties

### handle

> `readonly` **handle**: `button`

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

### create()

> `static` **create**(`whichDialog`, `text`, `hotkey?`, `quit?`, `score?`): `DialogButton`

Defined in: [handles/dialog.ts:35](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/dialog.ts#L35)

Adds a button to the bottom of a dialog.

#### Parameters

##### whichDialog

[`Dialog`](Dialog.md)

The dialog that gets the button.

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

`DialogButton`

The new button.

#### Remarks

Keep the button to compare it with [DialogButton.fromEvent](#fromevent) when the
dialog is clicked. A dialog that is already shown shows the new button once
[Dialog.display](Dialog.md#display) shows it again.

#### Throws

When the game returns no handle: `reforged-ts: failed to create DialogButton`, at the calling line.
In Dev mode, also when called before the globals Init stage or inside `MapPlayer.runLocal`.

#### Native

[DialogAddQuitButton](/typings/3.0.0/functions/DialogAddQuitButton) ([jassbot](https://lep.duckdns.org/jassbot/doc/DialogAddQuitButton))

#### Native

[DialogAddButton](/typings/3.0.0/functions/DialogAddButton) ([jassbot](https://lep.duckdns.org/jassbot/doc/DialogAddButton))

***

### fromEvent()

> `static` **fromEvent**(): `DialogButton` \| `undefined`

Defined in: [handles/dialog.ts:56](https://github.com/phmilk/reforged-ts/blob/2fc5cb556b8e50100ac48bd504d32d2fe8740ba9/packages/reforged-ts/src/handles/dialog.ts#L56)

Gets the button a player clicked, in a dialog button event.

#### Returns

`DialogButton` \| `undefined`

The clicked button, or `undefined` outside a dialog or dialog
button click event.

#### Native

[GetClickedButton](/typings/3.0.0/functions/GetClickedButton) ([jassbot](https://lep.duckdns.org/jassbot/doc/GetClickedButton))

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
