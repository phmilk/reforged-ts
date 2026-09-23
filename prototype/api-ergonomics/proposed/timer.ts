/** @noSelfInFile */
// PROTOTYPE: Timer on the new base. The handler receives the Timer; two conveniences.

import { Handle } from "./handle";

export class Timer extends Handle<timer> {
  /** Creation: non-null; throws in the (theoretical) case the Native returns nothing. */
  public static create(): Timer {
    return this.expect(CreateTimer(), "timer");
  }

  /** Parity with the Native accessor; rarely needed once handlers receive the Timer. */
  public static fromExpired(): Timer | undefined {
    return this.fromHandle(GetExpiredTimer());
  }

  /**
   * Starts the timer. The handler receives this Timer, so `Timer.fromExpired()`
   * is no longer the only way to reach it from inside the callback.
   */
  public start(timeout: number, periodic: boolean, handler: (timer: Timer) => void): this {
    TimerStart(this.handle, timeout, periodic, () => handler(this));
    return this;
  }

  public pause(): this {
    PauseTimer(this.handle);
    return this;
  }

  public resume(): this {
    ResumeTimer(this.handle);
    return this;
  }

  public destroy(): void {
    DestroyTimer(this.handle);
  }

  public get elapsed(): number {
    return TimerGetElapsed(this.handle);
  }

  public get remaining(): number {
    return TimerGetRemaining(this.handle);
  }

  /** One-shot: creates a Timer, fires once, destroys itself. Nothing to own. */
  public static after(timeout: number, handler: () => void): void {
    Timer.create().start(timeout, false, (self) => {
      handler();
      self.destroy();
    });
  }

  /** Periodic: returns the Timer; the caller owns it and destroys it. */
  public static every(interval: number, handler: (timer: Timer) => void): Timer {
    return Timer.create().start(interval, true, handler);
  }
}
