/** @noSelfInFile */

import { Handle } from "./handle";
import { Timer } from "./timer";

export class TimerDialog extends Handle<timerdialog> {
  public static create(t: Timer): TimerDialog {
    return this.expect(CreateTimerDialog(t.handle));
  }

  public get display() {
    return IsTimerDialogDisplayed(this.handle);
  }

  public set display(display: boolean) {
    TimerDialogDisplay(this.handle, display);
  }

  /**
   * Destroys the TimerDialog through its Native.
   * @remarks
   * In Dev mode the destroyed Wrapper becomes a tombstone: any later access,
   * a second `destroy()` included, raises
   * `reforged-ts: used after destroy: <Class>#<id>`, and
   * `Reforged.debug.report()` counts it destroyed.
   */
  public destroy() {
    DestroyTimerDialog(this.handle);
    this.release();
  }

  public setSpeed(speedMultFactor: number) {
    TimerDialogSetSpeed(this.handle, speedMultFactor);
  }

  public setTimeRemaining(value: number) {
    TimerDialogSetRealTimeRemaining(this.handle, value);
  }

  public setTitle(title: string) {
    TimerDialogSetTitle(this.handle, title);
  }

  /**
   * Sets the timer-dialogs color.
   * @param red An integer from 0-255 determining the amount of red color.
   * @param green An integer from 0-255 determining the amount of red color.
   * @param blue An integer from 0-255 determining the amount of red color.
   * @param alpha An integer from 0-255 determining the amount of red color.
   */
  public setTitleColor(
    red: number,
    green: number,
    blue: number,
    alpha: number,
  ) {
    TimerDialogSetTitleColor(this.handle, red, green, blue, alpha);
  }

  /**
   * Sets the timer-dialogs time color.
   * @param red An integer from 0-255 determining the amount of red color.
   * @param green An integer from 0-255 determining the amount of red color.
   * @param blue An integer from 0-255 determining the amount of red color.
   * @param alpha An integer from 0-255 determining the amount of red color.
   */
  public setTimeColor(red: number, green: number, blue: number, alpha: number) {
    TimerDialogSetTimeColor(this.handle, red, green, blue, alpha);
  }
}
