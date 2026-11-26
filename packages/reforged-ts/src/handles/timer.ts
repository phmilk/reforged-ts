/** @noSelfInFile */

import { protect } from "../reforged/protect";
import { Handle } from "./handle";

/**
 * What a Timer started through its Wrapper is doing, as the Wrapper tracks
 * it: counting a start, counting what a pause left after `resume`, paused by
 * `pause`, or a one-shot that expired.
 */
type CountdownState = "running" | "resumed" | "paused" | "expired";

/**
 * One start of a Timer, what `resume` and the readings need of it: the game
 * keeps none of it once its `ResumeTimer` is out of the picture (#962).
 * @noSelf
 */
interface Countdown {
  /** The timeout `start` was given, in seconds. */
  readonly timeout: number;
  /** Whether `start` was periodic. */
  readonly periodic: boolean;
  /** The protected handler, the function the game runs at each expiry. */
  readonly run: () => void;
  /** What the Timer is doing. */
  state: CountdownState;
  /** What was left when `pause` stopped it, in seconds. */
  left: number;
}

/**
 * A timer: a countdown in game seconds that runs a handler when it expires,
 * once or periodically.
 * @remarks
 * - Game time follows the game speed, and stands still while the game is
 *   paused.
 * - `Timer.after` and `Timer.every` cover the common cases; `create` then
 *   `start` gives a Timer that can be paused, resumed and started again.
 * - The Wrapper remembers each start, so that `resume` continues a paused
 *   countdown and `elapsed`, `remaining` and `timeout` read it: a timer
 *   started, paused or resumed through its Natives directly
 *   (`TimerStart`, `PauseTimer`, `ResumeTimer`) is outside what they know.
 * @example A countdown and a delayed call
 * {@includeCode ../../examples/harness/timer-every.ts}
 * @native timer
 */
export class Timer extends Handle<timer> {
  /** The last start through this Wrapper; undefined before the first. */
  private countdown?: Countdown;

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
   * Gets the time counted of the current countdown: since the last `start`,
   * or since the last periodic expiry, the time spent paused left out.
   * @remarks
   * - `elapsed + remaining` is `timeout`, on a resumed Timer as on any
   *   other: during the countdown a `resume` continues, `elapsed` goes on
   *   from what it read at the `pause`.
   * - A paused Timer reads `timeout` minus what was left at the `pause`,
   *   which is what it read then.
   * - Paused in a periodic Timer's handler, it reads 0: the next countdown
   *   has not begun.
   * - A one-shot Timer reads `timeout` from its handler on.
   * - A Timer never started reads 0.
   * @returns The elapsed time, in seconds.
   * @native TimerGetElapsed
   * @native TimerGetRemaining
   */
  public get elapsed(): number {
    const countdown = this.storedCountdown();
    if (countdown === undefined) {
      return TimerGetElapsed(this.handle);
    }
    return countdown.timeout - this.remaining;
  }

  /**
   * Gets the time left before the timer next expires.
   * @remarks
   * A paused Timer reads what was left at the `pause`: a full timeout when
   * paused in a periodic Timer's handler, its next countdown not begun. A
   * one-shot Timer reads 0 from its handler on, and a Timer never started
   * reads 0.
   * @returns The remaining time, in seconds.
   * @native TimerGetRemaining
   * @bug The game's own reading is wrong on a one-shot timer started again
   * after a pause, once it expired: it reads what was left at that old pause
   * (#961). The Wrapper answers 0 for a Timer it started.
   */
  public get remaining(): number {
    const countdown = this.countdown;
    if (countdown === undefined) {
      return TimerGetRemaining(this.handle);
    }
    switch (countdown.state) {
      case "paused":
        return countdown.left;
      case "expired":
        return 0;
      default:
        return TimerGetRemaining(this.handle);
    }
  }

  /**
   * Gets the timeout the timer was last started with.
   * @remarks
   * A resumed Timer still reads the timeout `start` was given, not what was
   * left at the `pause`. A Timer never started reads 0.
   * @returns The timeout, in seconds.
   * @native TimerGetTimeout
   */
  public get timeout(): number {
    return this.storedCountdown()?.timeout ?? TimerGetTimeout(this.handle);
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
   * @remarks
   * - On a Timer that is not counting (never started, paused, or a one-shot
   *   that expired) it changes nothing `resume` or the readings see.
   * - In a periodic Timer's handler it stops the Timer before its next
   *   countdown: `resume` then counts a full timeout. Measured on Build
   *   3.0.1.24371, the game runs no expiry of a timer paused in its own
   *   handler (#962).
   * @returns This Timer, for chaining.
   * @native PauseTimer
   * @native TimerGetRemaining
   */
  public pause() {
    const countdown = this.countdown;
    if (countdown?.state === "running" || countdown?.state === "resumed") {
      const left = TimerGetRemaining(this.handle);
      // A periodic Timer reads 0 left in its handler, where its next
      // countdown, a full timeout, has not begun yet.
      countdown.left =
        left <= 0 && countdown.periodic ? countdown.timeout : left;
      countdown.state = "paused";
    }
    PauseTimer(this.handle);
    return this;
  }

  /**
   * Continues the countdown `pause` stopped: the handler runs when what was
   * left at the pause runs out, and a periodic Timer then runs it every
   * timeout, as if it had never been paused.
   * @remarks
   * - It acts only on a Timer `pause` stopped and nothing started since. On
   *   a running Timer, a Timer never started and a one-shot Timer that
   *   expired it does nothing: no expiry, no change of any reading.
   * - A resumed Timer can be paused and resumed again, any number of times;
   *   `start` on it is an ordinary start, which forgets the pause.
   * - The game's `ResumeTimer` is not called: measured on Build
   *   3.0.1.24371, a timer it resumes expires when what was left runs out,
   *   once more a full timeout later, then stops, one-shot or periodic alike
   *   (#947, #962). The Timer starts instead for what was left, and a
   *   periodic one starts again for its timeout at that expiry, just before
   *   its handler runs: in that handler it reads an elapsed of 0 and a
   *   remaining of the timeout, where an ordinary periodic expiry reads the
   *   timeout and 0.
   * - A Dev mode failure of the handler is reported under the member that
   *   registered it, `Timer.start` or `Timer.every`, after a resume too.
   * @returns This Timer, for chaining.
   * @native TimerStart
   */
  public resume() {
    const countdown = this.countdown;
    if (countdown?.state !== "paused") {
      return this;
    }
    countdown.state = "resumed";
    TimerStart(this.handle, countdown.left, false, () => {
      if (countdown.periodic) {
        countdown.state = "running";
        TimerStart(this.handle, countdown.timeout, true, countdown.run);
      }
      countdown.run();
    });
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
   * The countdown `elapsed` and `timeout` answer from, or undefined when they
   * read the Natives: before the first start through this Wrapper, and while
   * an ordinary start runs, where the Natives are right. `remaining` reads
   * the Native while resumed too, since the restart for what was left counts
   * down to the next expiry.
   */
  private storedCountdown(): Countdown | undefined {
    const countdown = this.countdown;
    return countdown?.state === "running" ? undefined : countdown;
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
    const countdown: Countdown = {
      timeout,
      periodic,
      run: protect(this, member, () => {
        if (!countdown.periodic) {
          countdown.state = "expired";
        }
        handler(this);
      }),
      state: "running",
      left: 0,
    };
    this.countdown = countdown;
    TimerStart(this.handle, timeout, periodic, countdown.run);
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
