# Variable: buttonClick

> `readonly` **buttonClick**: (...`args`) => [`EventDescriptor`](../../../../interfaces/EventDescriptor.md)\<[`DialogClick`](../../../../interfaces/DialogClick.md)\>

Defined in: [events/dialog.ts:58](https://github.com/phmilk/reforged-ts/blob/8aa80128addfaabe3741579ed8323e6737b0f249/packages/reforged-ts/src/events/dialog.ts#L58)

`button` is clicked; the payload holds it and its dialog.

## Parameters

### args

...\[[`DialogButton`](../../../../classes/DialogButton.md)\]

## Returns

[`EventDescriptor`](../../../../interfaces/EventDescriptor.md)\<[`DialogClick`](../../../../interfaces/DialogClick.md)\>

## Example

**A vote dialog**

```ts
// The DialogEvents descriptors through on(): `click(dialog)` for any button
// of a Dialog, `buttonClick(button)` for one button. The payload always
// holds both the dialog and the button clicked, and on() returns the
// Subscription whose destroy() ends the handler.
import {
  Dialog,
  DialogButton,
  DialogEvents,
  Init,
  on,
  Timer,
  tsGlobals,
} from "reforged-ts";

Init.onTriggers(() => {
  const vote = Dialog.create();

  Timer.after(1, () => {
    vote.setMessage("Play another round?");
    const yes = DialogButton.create(vote, "Yes", 0);
    DialogButton.create(vote, "No", 0);

    // Any button: the payload says which one.
    const anyClick = on(DialogEvents.click(vote), ({ dialog, button }) => {
      dialog.display(tsGlobals.Players[0], false);
      print(button === yes ? "Another round" : "Game over");
      anyClick.destroy();
    });
    // One button: its own Subscription.
    on(DialogEvents.buttonClick(yes), ({ button }) => {
      print(`Clicked button ${String(button.id)}`);
    });

    vote.display(tsGlobals.Players[0], true);
  });
});
```

## Native

[TriggerRegisterDialogButtonEvent](/typings/3.0.0/functions/TriggerRegisterDialogButtonEvent) ([jassbot](https://lep.duckdns.org/jassbot/doc/TriggerRegisterDialogButtonEvent))
