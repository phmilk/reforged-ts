/** @noSelfInFile */

// Dialog and DialogButton on the Handle base: creation throws, the event
// accessors return undefined when the game has no clicked dialog or button.

import { describe, expect, it, stubCalls } from "reforged-test/lua";
import { Dialog, DialogButton } from "../src/index";
import { handleRef } from "./support/handle-ref";
import { withNative } from "./support/native-override";
import { raisedIn } from "./support/raised-in";

describe("Dialog", () => {
  it("is the same object for its handle", () => {
    const dialog = Dialog.create();
    expect(Dialog.fromHandle(dialog.handle)).toBe(dialog);
    expect(Dialog.fromHandle(undefined)).toBeUndefined();
  });
});

describe("Dialog.create", () => {
  it("wraps the handle DialogCreate returns, and a lookup finds it", () => {
    const dialog = Dialog.create();
    expect(stubCalls()).toContainCall("DialogCreate()");
    expect(Dialog.fromHandle(dialog.handle)).toBe(dialog);
  });

  it("throws when DialogCreate returns nil", () => {
    const message = withNative(
      "DialogCreate",
      () => undefined,
      () =>
        raisedIn(() => {
          Dialog.create();
        }),
    );
    expect(message).toEqual("reforged-ts: failed to create Dialog");
  });
});

describe("Dialog.fromEvent", () => {
  it("is undefined when GetClickedDialog returns nil", () => {
    const dialog = withNative(
      "GetClickedDialog",
      () => undefined,
      () => Dialog.fromEvent(),
    );
    expect(dialog).toBeUndefined();
  });

  it("wraps the clicked dialog, the same object a lookup finds", () => {
    const handle = DialogCreate();
    const dialog = withNative(
      "GetClickedDialog",
      () => handle,
      () => Dialog.fromEvent(),
    );
    expect(dialog?.handle).toBe(handle);
    expect(Dialog.fromHandle(handle)).toBe(dialog);
  });
});

describe("DialogButton", () => {
  it("is the same object for its handle", () => {
    const button = DialogButton.create(Dialog.create(), "Stay");
    expect(DialogButton.fromHandle(button.handle)).toBe(button);
    expect(DialogButton.fromHandle(undefined)).toBeUndefined();
  });
});

describe("DialogButton.create", () => {
  const dialog = Dialog.create();

  it("wraps the handle DialogAddButton returns, and a lookup finds it", () => {
    const button = DialogButton.create(dialog, "Stay", 83);
    expect(stubCalls()).toContainCall(
      `DialogAddButton(${handleRef("dialog", dialog.handle)}, "Stay", 83)`,
    );
    expect(DialogButton.fromHandle(button.handle)).toBe(button);
  });

  it("wraps the handle DialogAddQuitButton returns for a quit button", () => {
    const button = DialogButton.create(dialog, "Leave", 76, true, true);
    expect(stubCalls()).toContainCall(
      `DialogAddQuitButton(${handleRef("dialog", dialog.handle)}, true, "Leave", 76)`,
    );
    expect(DialogButton.fromHandle(button.handle)).toBe(button);
  });

  it("throws when DialogAddButton returns nil", () => {
    const message = withNative(
      "DialogAddButton",
      () => undefined,
      () =>
        raisedIn(() => {
          DialogButton.create(dialog, "Stay");
        }),
    );
    expect(message).toEqual("reforged-ts: failed to create DialogButton");
  });

  it("throws when DialogAddQuitButton returns nil", () => {
    const message = withNative(
      "DialogAddQuitButton",
      () => undefined,
      () =>
        raisedIn(() => {
          DialogButton.create(dialog, "Leave", 0, true);
        }),
    );
    expect(message).toEqual("reforged-ts: failed to create DialogButton");
  });
});

describe("dialog.addButton", () => {
  const dialog = Dialog.create();

  it("wraps the handle DialogAddButton returns, and a lookup finds it", () => {
    const button = dialog.addButton("Stay", 83);
    expect(stubCalls()).toContainCall(
      `DialogAddButton(${handleRef("dialog", dialog.handle)}, "Stay", 83)`,
    );
    expect(DialogButton.fromHandle(button.handle)).toBe(button);
  });

  it("throws when DialogAddButton returns nil", () => {
    const message = withNative(
      "DialogAddButton",
      () => undefined,
      () =>
        raisedIn(() => {
          dialog.addButton("Stay");
        }),
    );
    expect(message).toEqual("reforged-ts: failed to create DialogButton");
  });
});

describe("DialogButton.fromEvent", () => {
  it("is undefined when GetClickedButton returns nil", () => {
    const button = withNative(
      "GetClickedButton",
      () => undefined,
      () => DialogButton.fromEvent(),
    );
    expect(button).toBeUndefined();
  });

  it("wraps the clicked button, the same object a lookup finds", () => {
    const handle = DialogAddButton(Dialog.create().handle, "Stay", 0);
    const button = withNative(
      "GetClickedButton",
      () => handle,
      () => DialogButton.fromEvent(),
    );
    expect(button?.handle).toBe(handle);
    expect(DialogButton.fromHandle(handle)).toBe(button);
  });
});
