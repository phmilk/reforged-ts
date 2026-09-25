/** @noSelfInFile */

import { Dialog, DialogButton } from "../handles/dialog";
import type { Trigger } from "../handles/trigger";
import { required } from "./descriptor";
import { eventRows } from "./rows";

/** The payload of a dialog click: the dialog and the button clicked in it. */
interface DialogClick {
  /** The dialog clicked in. */
  dialog: Dialog;
  /** The button clicked. */
  button: DialogButton;
}

/** Reads the clicked dialog and button, naming `event` when one is missing. */
function readClick(event: string): DialogClick {
  return {
    dialog: required(Dialog.fromEvent(), "dialog", event),
    button: required(DialogButton.fromEvent(), "button", event),
  };
}

/**
 * The dialog Event descriptors: `DialogEvents.click(dialog)` for any button
 * of one Dialog, `DialogEvents.buttonClick(button)` for one DialogButton.
 */
export const DialogEvents = eventRows("DialogEvents", {
  /** A button of `dialog` is clicked. */
  click: {
    register: (trigger: Trigger, dialog: Dialog) => {
      trigger.registerDialogEvent(dialog);
    },
    read: readClick,
  },
  /** `button` is clicked. */
  buttonClick: {
    register: (trigger: Trigger, button: DialogButton) => {
      trigger.registerDialogButtonEvent(button);
    },
    read: readClick,
  },
});
