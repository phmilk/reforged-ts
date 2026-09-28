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
