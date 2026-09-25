/** @noSelfInFile */

// The timers a piece of code started: the call log renders a timer by its id,
// and a test that fires one through `__stub_fire_timer` needs the handle
// itself. `timersStarted` wraps the `TimerStart` stub for the length of one
// callback and hands back what each call was given.

/** One `TimerStart` call: the timer, its timeout and whether it repeats. */
export interface StartedTimer {
  readonly timer: timer;
  readonly timeout: number;
  readonly periodic: boolean;
}

/**
 * Runs `body` and returns the `TimerStart` calls it made, in order. The stub
 * still runs for each, so the call log and `__stub_fire_timer` see them as
 * usual; the stub is back afterwards, also when `body` throws.
 */
export function timersStarted(body: () => void): StartedTimer[] {
  const globals = _G as unknown as Record<string, unknown>;
  const start = TimerStart;
  const started: StartedTimer[] = [];
  globals.TimerStart = (
    whichTimer: timer,
    timeout: number,
    periodic: boolean,
    handler: () => void,
  ) => {
    started.push({ timer: whichTimer, timeout, periodic });
    start(whichTimer, timeout, periodic, handler);
  };
  try {
    body();
  } finally {
    globals.TimerStart = start;
  }
  return started;
}
