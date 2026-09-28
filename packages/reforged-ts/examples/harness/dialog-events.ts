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
