/** @noSelfInFile */

// DialogEvents.click(dialog) and DialogEvents.buttonClick(button) through
// on(): the suites of support/events.ts, which fire the Subscription's
// Trigger with a stubbed context and observe the call log and the Dialog and
// DialogButton the handler received.

import { Dialog, DialogButton, DialogEvents } from "../../src/index";
import { describeDescriptor } from "../support/events";
import { handleRef } from "../support/handle-ref";

const dialog = Dialog.create();
const button = DialogButton.create(dialog, "Stay");

describeDescriptor({
  name: "DialogEvents.click",
  descriptor: DialogEvents.click(dialog),
  registers: (trigger) => [
    `TriggerRegisterDialogEvent(${trigger}, ${handleRef("dialog", dialog.handle)})`,
  ],
  context: { GetClickedDialog: dialog.handle, GetClickedButton: button.handle },
  payload: { dialog, button },
  required: [
    ["dialog", "GetClickedDialog"],
    ["button", "GetClickedButton"],
  ],
});

describeDescriptor({
  name: "DialogEvents.buttonClick",
  descriptor: DialogEvents.buttonClick(button),
  registers: (trigger) => [
    `TriggerRegisterDialogButtonEvent(${trigger}, ${handleRef("button", button.handle)})`,
  ],
  context: { GetClickedDialog: dialog.handle, GetClickedButton: button.handle },
  payload: { dialog, button },
  required: [
    ["dialog", "GetClickedDialog"],
    ["button", "GetClickedButton"],
  ],
});
