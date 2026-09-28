/** @noSelfInFile */

import { Handle } from "./handle";
import { MapPlayer } from "./player";

/**
 * A button of a {@link Dialog}, which a player clicks to answer it.
 * @remarks
 * Named `DialogButton` because the Native type, `button`, is a dialog's button.
 * @example Keeping a button to compare it with the clicked one
 * {@includeCode ../../examples/harness/dialog-create.ts}
 * @native button
 */
export class DialogButton extends Handle<button> {
  /**
   * Adds a button to the bottom of a dialog.
   * @remarks
   * Keep the button to compare it with {@link DialogButton.fromEvent} when the
   * dialog is clicked. A dialog that is already shown shows the new button once
   * {@link Dialog.display} shows it again.
   * @param whichDialog - The dialog that gets the button.
   * @param text - The label the player reads on the button.
   * @param hotkey - The key that clicks the button: the character code of an
   * upper-case letter, such as `"F".charCodeAt(0)`; 0, the default, for none.
   * @param quit - When true, clicking the button makes the player leave the
   * game; false by default.
   * @param score - With `quit`, whether the leaving player sees the score
   * screen rather than the main menu; false by default.
   * @returns The new button.
   * @throws When the game returns no handle: `reforged-ts: failed to create DialogButton`, at the calling line.
   * In Dev mode, also when called before the globals Init stage or inside `MapPlayer.runLocal`.
   * @native DialogAddQuitButton
   * @native DialogAddButton
   */
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

  /**
   * Gets the button a player clicked, in a dialog button event.
   * @returns The clicked button, or `undefined` outside a dialog or dialog
   * button click event.
   * @native GetClickedButton
   */
  public static fromEvent(): DialogButton | undefined {
    return this.fromHandle(GetClickedButton());
  }
}

/**
 * A menu of buttons shown in the middle of the screen, to the players it is
 * displayed to.
 * @remarks
 * A player who sees a dialog can do nothing else until they click one of its
 * buttons, and the game shows no dialog during map initialization: display it
 * from a Timer once the game runs.
 * @example Create a simple dialog.
 * {@includeCode ../../examples/harness/dialog-create.ts}
 * @native dialog
 */
export class Dialog extends Handle<dialog> {
  /**
   * Creates an empty dialog, hidden from every player.
   * @returns The new dialog.
   * @throws When the game returns no handle: `reforged-ts: failed to create Dialog`, at the calling line.
   * In Dev mode, also when called before the globals Init stage or inside `MapPlayer.runLocal`.
   * @native DialogCreate
   */
  public static create(): Dialog {
    return this.expect(DialogCreate());
  }

  /**
   * Adds a button to the bottom of the dialog, as {@link DialogButton.create}
   * does.
   * @param text - The label the player reads on the button.
   * @param hotkey - The key that clicks the button: the character code of an
   * upper-case letter, such as `"F".charCodeAt(0)`; 0, the default, for none.
   * @param quit - When true, clicking the button makes the player leave the
   * game; false by default.
   * @param score - With `quit`, whether the leaving player sees the score
   * screen rather than the main menu; false by default.
   * @returns The new button.
   * @throws When the game returns no handle: `reforged-ts: failed to create DialogButton`, at the calling line.
   * In Dev mode, also when called before the globals Init stage or inside `MapPlayer.runLocal`.
   * @native DialogAddQuitButton
   * @native DialogAddButton
   */
  public addButton(
    text: string,
    hotkey = 0,
    quit = false,
    score = false,
  ): DialogButton {
    return DialogButton.create(this, text, hotkey, quit, score);
  }

  /**
   * Removes the dialog's message and every button, even while it is shown.
   * @remarks
   * Hide the dialog first: a player who still sees it cleared has no button
   * left to close it with.
   * @native DialogClear
   */
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
   * @native DialogDestroy
   */
  public destroy() {
    DialogDestroy(this.handle);
    this.release();
  }

  /**
   * Shows the dialog to one player, or hides it from them.
   * @remarks A dialog does not appear when shown during map initialisation:
   * show it after a wait, or from a Timer of zero seconds, to have it up
   * as early as the game allows.
   * @param whichPlayer - The player who sees or stops seeing the dialog.
   * @param flag - True to show the dialog, or show it again after adding
   * buttons; false to hide it.
   * @native DialogDisplay
   */
  public display(whichPlayer: MapPlayer, flag: boolean) {
    DialogDisplay(whichPlayer.handle, this.handle, flag);
  }

  /**
   * Sets the message shown above the buttons, even while the dialog is shown.
   * @param whichMessage - The message; an empty string leaves no room for one.
   * @native DialogSetMessage
   */
  public setMessage(whichMessage: string) {
    DialogSetMessage(this.handle, whichMessage);
  }

  /**
   * Gets the dialog a player clicked, in a dialog or dialog button event.
   * @returns The clicked dialog, or `undefined` outside a dialog or dialog
   * button click event.
   * @native GetClickedDialog
   */
  public static fromEvent(): Dialog | undefined {
    return this.fromHandle(GetClickedDialog());
  }
}
