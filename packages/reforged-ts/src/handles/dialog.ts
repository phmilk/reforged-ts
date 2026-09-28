/** @noSelfInFile */

import { Handle } from "./handle";
import { MapPlayer } from "./player";

export class DialogButton extends Handle<button> {
  public static create(
    whichDialog: Dialog,
    text: string,
    hotkey = 0,
    quit = false,
    score = false,
  ): DialogButton {
    if (quit) {
      return this.expect(
        DialogAddQuitButton(whichDialog.handle, score, text, hotkey),
      );
    }
    return this.expect(DialogAddButton(whichDialog.handle, text, hotkey));
  }

  public static fromEvent(): DialogButton | undefined {
    return this.fromHandle(GetClickedButton());
  }
}

/**
 *
 * @example Create a simple dialog.
 * {@includeCode ../../examples/harness/dialog-create.ts}
 */
export class Dialog extends Handle<dialog> {
  public static create(): Dialog {
    return this.expect(DialogCreate());
  }

  public addButton(
    text: string,
    hotkey = 0,
    quit = false,
    score = false,
  ): DialogButton {
    return DialogButton.create(this, text, hotkey, quit, score);
  }

  public clear() {
    DialogClear(this.handle);
  }

  /**
   * Destroys the Dialog through its Native.
   * @remarks
   * In Dev mode the destroyed Wrapper becomes a tombstone: any later access,
   * a second `destroy()` included, raises
   * `reforged-ts: used after destroy: <Class>#<id>`, and
   * `Reforged.debug.report()` counts it destroyed.
   */
  public destroy() {
    DialogDestroy(this.handle);
    this.release();
  }

  /**
   * @remarks Dialogs can not be shown at map-init. Use a wait or a zero-timer to display as soon as possible.
   */
  public display(whichPlayer: MapPlayer, flag: boolean) {
    DialogDisplay(whichPlayer.handle, this.handle, flag);
  }

  public setMessage(whichMessage: string) {
    DialogSetMessage(this.handle, whichMessage);
  }

  public static fromEvent(): Dialog | undefined {
    return this.fromHandle(GetClickedDialog());
  }
}
