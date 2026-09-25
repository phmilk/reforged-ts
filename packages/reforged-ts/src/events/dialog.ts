/** @noSelfInFile */

import { Dialog, DialogButton } from "../handles/dialog";
import type { EventDescriptor } from "./descriptor";
import { required } from "./descriptor";

/** The payload of a dialog click: the dialog and the button clicked in it. */
interface DialogClick {
  dialog: Dialog;
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
export const DialogEvents = {
  /** A button of `dialog` is clicked. */
  click: (dialog: Dialog): EventDescriptor<DialogClick> => ({
    register: (trigger) => {
      trigger.registerDialogEvent(dialog);
    },
    read: () => readClick("DialogEvents.click"),
  }),
  /** `button` is clicked. */
  buttonClick: (button: DialogButton): EventDescriptor<DialogClick> => ({
    register: (trigger) => {
      trigger.registerDialogButtonEvent(button);
    },
    read: () => readClick("DialogEvents.buttonClick"),
  }),
};
