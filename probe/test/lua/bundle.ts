// What the Lua tests of the Probes' bundles share: the globals they read
// or replace, and the timers the bundles started.

/**
 * The globals the tests reach: the editor's entry point, which the runner
 * wraps; Lua's `require`, which loads the modules the global setup wrote
 * next to the tests; the `debug` library, which the game does not have;
 * and `EndGame`, which the shipped stubs do not define.
 * @noSelf
 */
export interface Globals {
  main?: () => void;
  require: (module: string) => unknown;
  debug: unknown;
  EndGame?: (doScoreScreen: boolean) => void;
}

export const globals = _G as unknown as Globals;

/**
 * Loads the bundle of `probe` and runs the editor's `main`, which the
 * runner wrapped: the runner's 0-second timer is then started, not fired.
 */
export function loadBundle(probe: string): void {
  globals.main = () => undefined;
  globals.require(`${probe}_bundle`);
  globals.main();
}

/** The timer the `index`th `TimerStart` started: the runner's first, then the Probe's. */
export function startedTimer(index: number): timer {
  return __stub_args("TimerStart")[index]?.[0] as timer;
}
