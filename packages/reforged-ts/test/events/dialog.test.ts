/** @noSelfInFile */

// DialogEvents through on(): the suites of support/events.ts, iterating the
// namespace's members, which fire the Subscription's Trigger with a stubbed
// context and observe the call log and the Dialog and DialogButton the
// handler received.

import { Dialog, DialogButton, DialogEvents } from "../../src/index";
import { describeNamespace } from "../support/events";
import { handleRef } from "../support/handle-ref";

const dialog = Dialog.create();
const button = DialogButton.create(dialog, "Stay");

/** What firing a click yields, whichever member registered it. */
const click = {
  context: { GetClickedDialog: dialog.handle, GetClickedButton: button.handle },
  payload: { dialog, button },
  required: [
    ["dialog", "GetClickedDialog"],
    ["button", "GetClickedButton"],
  ] as const,
};

describeNamespace("DialogEvents", DialogEvents, {
  click: [
    {
      ...click,
      args: [dialog],
      registers: (trigger) => [
        `TriggerRegisterDialogEvent(${trigger}, ${handleRef("dialog", dialog.handle)})`,
      ],
    },
  ],
  buttonClick: [
    {
      ...click,
      args: [button],
      registers: (trigger) => [
        `TriggerRegisterDialogButtonEvent(${trigger}, ${handleRef("button", button.handle)})`,
      ],
    },
  ],
});
