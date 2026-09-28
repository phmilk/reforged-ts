/** @noSelfInFile */

import { Dialog, DialogButton } from "../handles/dialog";
import type { Trigger } from "../handles/trigger";
import { required } from "./descriptor";
import { eventRows } from "./rows";

/**
 * The payload of `DialogEvents.click` and `DialogEvents.buttonClick`: the
 * dialog and the button clicked in it, both always set.
 */
export interface DialogClick {
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
 * Their payload, a {@link DialogClick}, always holds the dialog and the
 * button.
 * @example A vote dialog
 * {@includeCode ../../examples/harness/dialog-events.ts}
 */
export const DialogEvents = eventRows("DialogEvents", {
  /**
   * A button of `dialog` is clicked; the payload holds the dialog and the
   * button.
   * @example A vote dialog
   * {@includeCode ../../examples/harness/dialog-events.ts}
   * @native TriggerRegisterDialogEvent
   */
  click: {
    /** Registers a click on any button of `dialog` on the Trigger. */
    register: (trigger: Trigger, dialog: Dialog) => {
      trigger.registerDialogEvent(dialog);
    },
    /** Reads the clicked dialog and button. */
    read: readClick,
  },
  /**
   * `button` is clicked; the payload holds it and its dialog.
   * @example A vote dialog
   * {@includeCode ../../examples/harness/dialog-events.ts}
   * @native TriggerRegisterDialogButtonEvent
   */
  buttonClick: {
    /** Registers a click on `button` on the Trigger. */
    register: (trigger: Trigger, button: DialogButton) => {
      trigger.registerDialogButtonEvent(button);
    },
    /** Reads the clicked dialog and button. */
    read: readClick,
  },
});
