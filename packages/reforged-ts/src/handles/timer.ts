/** @noSelfInFile */

import { protect } from "../reforged/protect";
import { Handle } from "./handle";

/**
 * A timer: a countdown in game seconds that runs a handler when it expires,
 * once or periodically.
 * @remarks
 * - Game time follows the game speed, and stands still while the game is
 *   paused.
 * - `Timer.after` and `Timer.every` cover the common cases; `create` then
 *   `start` gives a Timer that can be paused, resumed and started again.
 * @example A countdown and a delayed call
 * {@includeCode ../../examples/harness/timer-every.ts}
 * @native timer
 */
export class Timer extends Handle<timer> {
  /**
   * Creates a stopped timer; `start` sets it running.
   * @returns The new timer.
   * @throws In Dev mode, when called before the globals Init stage or inside
   * `MapPlayer.runLocal`. The game always returns a timer, so the creation
   * message `reforged-ts: failed to create Timer` is not expected.
   * @native CreateTimer
   */
  public static create(): Timer {
    return this.expect(CreateTimer());
  }

  /**
   * Gets the time since the timer last started.
   * @returns The elapsed time, in seconds.
   * @native TimerGetElapsed
   * @bug After `resume`, it counts only the time since the resume.
   */
  public get elapsed(): number {
    return TimerGetElapsed(this.handle);
  }

  /**
   * Gets the time left before the timer expires.
   * @returns The remaining time, in seconds.
   * @native TimerGetRemaining
   * @bug The value can be wrong for a timer that was paused and later
   * resumed: http://www.wc3c.net/showthread.php?t=95756.
   */
  public get remaining(): number {
    return TimerGetRemaining(this.handle);
  }

  /**
   * Gets the timeout the timer was last started with.
   * @returns The timeout, in seconds.
   * @native TimerGetTimeout
   */
  public get timeout(): number {
    return TimerGetTimeout(this.handle);
  }

  /**
   * Destroys the Timer through its Native.
   * @remarks
   * In Dev mode the destroyed Wrapper becomes a tombstone: any later access,
   * a second `destroy()` included, raises
   * `reforged-ts: used after destroy: <Class>#<id>`, and
   * `Reforged.debug.report()` counts it destroyed.
   * @example The handles a feature owns, destroyed when it ends
   * {@includeCode ../../examples/game/destroy-owned.ts}
   * @native DestroyTimer
   */
  public destroy() {
    DestroyTimer(this.handle);
    this.release();
  }

  /**
   * Stops the countdown where it is; `resume` continues it.
   * @returns This Timer, for chaining.
   * @native PauseTimer
   * @bug The game clears the periodic flag: a periodic Timer paused then
   * resumed runs its remaining time and one more timeout, then stops. Start it
   * again with `start` to keep it periodic.
   */
  public pause() {
    PauseTimer(this.handle);
    return this;
  }

  /**
   * Continues a paused countdown from where `pause` stopped it; a running
   * Timer is left as it is.
   * @returns This Timer, for chaining.
   * @native ResumeTimer
   */
  public resume() {
    ResumeTimer(this.handle);
    return this;
  }

  /**
   * Starts the Timer; each expiry runs `handler` with this Timer.
   * @remarks In Dev mode the handler runs under `pcall`: a failure is shown on
   * screen and printed as
   * `reforged-ts: Timer#<id> Timer.start failed: <error>`, once per distinct
   * message (repeats are counted in `Reforged.debug.report()`), and the game
   * thread survives it. The mode is the one in force when `start` is called.
   * With Dev mode off the handler runs unprotected, as the game runs any
   * function.
   * @param timeout - The time to each expiry, in seconds.
   * @param periodic - Whether the Timer starts again after each expiry;
   * `false` runs the handler once.
   * @param handler - The function run at each expiry, given this Timer.
   * @returns This Timer, for chaining.
   * @native TimerStart
   */
  public start(
    timeout: number,
    periodic: boolean,
    handler: (timer: this) => void,
  ) {
    return this.startFor("Timer.start", timeout, periodic, handler);
  }

  /**
   * Runs `handler` once after `timeout` seconds, on a Timer created for it and
   * destroyed after the handler returns or throws (the error still
   * propagates). Nothing is owned, so nothing is returned: a one-shot that can
   * be cancelled is `Timer.create().start(timeout, false, handler)`.
   * @remarks In Dev mode the handler is protected as `start`'s is, and its
   * failure is reported as `Timer#<id> Timer.after`; the Timer is destroyed
   * first.
   * @param timeout - The delay, in seconds.
   * @param handler - The function to run once the delay is over.
   * @throws In Dev mode, when called before the globals Init stage or inside
   * `MapPlayer.runLocal`, as `create` does.
   * @native CreateTimer
   * @native TimerStart
   * @native DestroyTimer
   */
  public static after(timeout: number, handler: () => void): void {
    const timer = this.create();
    timer.startFor("Timer.after", timeout, false, () => {
      try {
        handler();
      } finally {
        timer.destroy();
      }
    });
  }

  /**
   * Runs `handler` every `interval` seconds with the Timer, which the caller
   * owns: `pause` stops it, `destroy` ends it.
   * @remarks In Dev mode the handler is protected as `start`'s is, and its
   * failure is reported as `Timer#<id> Timer.every`: a handler failing on
   * every tick is reported once and counted after that.
   * @param interval - The time between two runs, in seconds.
   * @param handler - The function run at each expiry, given the Timer.
   * @returns The running Timer.
   * @throws In Dev mode, when called before the globals Init stage or inside
   * `MapPlayer.runLocal`, as `create` does.
   * @native CreateTimer
   * @native TimerStart
   */
  public static every(
    interval: number,
    handler: (timer: Timer) => void,
  ): Timer {
    return this.create().startFor("Timer.every", interval, true, handler);
  }

  /**
   * `start` for the registering `member` a failure report names: the one
   * place a Timer hands a function to `TimerStart`.
   */
  private startFor(
    member: string,
    timeout: number,
    periodic: boolean,
    handler: (timer: this) => void,
  ): this {
    TimerStart(
      this.handle,
      timeout,
      periodic,
      protect(this, member, () => {
        handler(this);
      }),
    );
    return this;
  }

  /**
   * Gets the Timer whose expiry is running.
   * @remarks
   * - A handler receives its Timer; this lookup stays for parity with the
   *   Natives, and the Timer `start` passes its handler is the one to use.
   * - Outside a Timer's expiry, the Nullability sweep measured on
   *   3.0.0.24268 that it crashes the game in a trigger's handler, which
   *   runs in a new thread even when the trigger fires from a timer's
   *   callback, and returns `undefined` in the callback of a destroyed
   *   timer.
   * @returns The expired Timer, or `undefined` in the callback of a
   * destroyed timer.
   * @native GetExpiredTimer
   */
  public static fromExpired(): Timer | undefined {
    return this.fromHandle(GetExpiredTimer());
  }
}
