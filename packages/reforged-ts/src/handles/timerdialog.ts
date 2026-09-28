/** @noSelfInFile */

import { Handle } from "./handle";
import { Timer } from "./timer";

/**
 * A timer window: a countdown in the top-right corner of the screen, a title
 * followed by the time a {@link Timer} has left.
 * @remarks
 * Several shown timer dialogs line up from right to left. One whose Timer was
 * never started shows its title and no time.
 * @example A countdown to the first wave
 * {@includeCode ../../examples/game/timer-dialog-countdown.ts}
 * @native timerdialog
 */
export class TimerDialog extends Handle<timerdialog> {
  /**
   * Creates a hidden timer dialog that counts down with a Timer, titled
   * "Remaining" in the player's language.
   * @param t - The Timer whose remaining time it shows.
   * @returns The new timer dialog.
   * @throws When the game returns no handle: `reforged-ts: failed to create TimerDialog`, at the calling line.
   * In Dev mode, also when called before the globals Init stage or inside `MapPlayer.runLocal`.
   * @native CreateTimerDialog
   */
  public static create(t: Timer): TimerDialog {
    return this.expect(CreateTimerDialog(t.handle));
  }

  /**
   * Whether the timer dialog is shown.
   * @returns True when it is shown, false when it is hidden.
   * @native IsTimerDialogDisplayed
   */
  public get display() {
    return IsTimerDialogDisplayed(this.handle);
  }

  /**
   * Whether the timer dialog is shown, to every player: true shows it, false
   * hides it.
   * @native TimerDialogDisplay
   */
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
   * @native DestroyTimerDialog
   */
  public destroy() {
    DestroyTimerDialog(this.handle);
    this.release();
  }

  /**
   * Scales the time shown, without changing the Timer.
   * @param speedMultFactor - The factor the remaining time is multiplied by
   * before it is shown: 1 by default, 2 shows it twice as large and running
   * twice as fast, 0 always shows zero.
   * @native TimerDialogSetSpeed
   */
  public setSpeed(speedMultFactor: number) {
    TimerDialogSetSpeed(this.handle, speedMultFactor);
  }

  /**
   * Sets the time shown and stops following the Timer: the countdown then
   * runs from this time and stays at zero once it gets there.
   * @param value - The time, in seconds.
   * @native TimerDialogSetRealTimeRemaining
   */
  public setTimeRemaining(value: number) {
    TimerDialogSetRealTimeRemaining(this.handle, value);
  }

  /**
   * Sets the title shown before the time; a long one is cut short with an
   * ellipsis.
   * @param title - The title.
   * @native TimerDialogSetTitle
   */
  public setTitle(title: string) {
    TimerDialogSetTitle(this.handle, title);
  }

  /**
   * Sets the colour of the title.
   * @param red - The red component, from 0 to 255.
   * @param green - The green component, from 0 to 255.
   * @param blue - The blue component, from 0 to 255.
   * @param alpha - The opacity, from 0 to 255; the game ignores it, so pass 255.
   * @native TimerDialogSetTitleColor
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
   * Sets the colour of the time.
   * @param red - The red component, from 0 to 255.
   * @param green - The green component, from 0 to 255.
   * @param blue - The blue component, from 0 to 255.
   * @param alpha - The opacity, from 0 to 255; the game ignores it, so pass 255.
   * @native TimerDialogSetTimeColor
   */
  public setTimeColor(red: number, green: number, blue: number, alpha: number) {
    TimerDialogSetTimeColor(this.handle, red, green, blue, alpha);
  }
}
