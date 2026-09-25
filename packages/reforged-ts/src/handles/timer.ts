/** @noSelfInFile */

import { protect } from "../reforged/protect";
import { Handle } from "./handle";

export class Timer extends Handle<timer> {
  public static create(): Timer {
    return this.expect(CreateTimer());
  }

  public get elapsed(): number {
    return TimerGetElapsed(this.handle);
  }

  /**
   * @bug This might not return the correct value if the timer was paused and restarted at one point. See http://www.wc3c.net/showthread.php?t=95756.
   */
  public get remaining(): number {
    return TimerGetRemaining(this.handle);
  }

  public get timeout(): number {
    return TimerGetTimeout(this.handle);
  }

  public destroy() {
    DestroyTimer(this.handle);
    this.release();
  }

  public pause() {
    PauseTimer(this.handle);
    return this;
  }

  public resume() {
    ResumeTimer(this.handle);
    return this;
  }

  /**
   * Starts the Timer; each expiry runs `handler` with this Timer.
   * @remarks In Dev mode the handler runs under `pcall`: a failure is shown on
   * screen and printed as `reforged-ts: Timer#<id> Timer.start failed:
   * <error>`, once per distinct message (repeats are counted in
   * `Reforged.debug.report()`), and the game thread survives it. The mode is
   * the one in force when `start` is called. With Dev mode off the handler
   * runs unprotected, as the game runs any function.
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
   * The Timer whose expiry is running, or undefined when the game has none.
   * A handler receives its Timer; this lookup stays for parity with the
   * Natives.
   */
  public static fromExpired(): Timer | undefined {
    return this.fromHandle(GetExpiredTimer());
  }
}
