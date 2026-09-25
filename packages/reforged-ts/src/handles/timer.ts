/** @noSelfInFile */

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

  /** Starts the Timer; each expiry runs `handler` with this Timer. */
  public start(
    timeout: number,
    periodic: boolean,
    handler: (timer: this) => void,
  ) {
    TimerStart(this.handle, timeout, periodic, () => {
      handler(this);
    });
    return this;
  }

  /**
   * Runs `handler` once after `timeout` seconds, on a Timer created for it and
   * destroyed after the handler returns or throws (the error still
   * propagates). Nothing is owned, so nothing is returned: a one-shot that can
   * be cancelled is `Timer.create().start(timeout, false, handler)`.
   */
  public static after(timeout: number, handler: () => void): void {
    this.create().start(timeout, false, (timer) => {
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
   */
  public static every(
    interval: number,
    handler: (timer: Timer) => void,
  ): Timer {
    return this.create().start(interval, true, handler);
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
