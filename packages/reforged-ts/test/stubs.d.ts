/** @noSelfInFile */

// The firing helpers of the reforged-test stubs that the tests call. They are
// Lua globals the shipped stub files define, not Natives, so the Typings do
// not declare them.

/**
 * A firing context: what each event response Native answers while a trigger
 * fires, keyed by the Native's name (`{ GetTriggerUnit: unit.handle }`). A
 * Native the context leaves out answers nil.
 */
type StubContext = {
  readonly [
    N in keyof typeof globalThis
  ]?: (typeof globalThis)[N] extends () => infer R ? NonNullable<R> : never;
};

/**
 * Fires the trigger as one event would, with `context` as the firing context:
 * every condition runs, in added order, then the actions, in added order, only
 * if every condition returned true. Returns whether the actions ran. A
 * disabled trigger does not fire; firing a destroyed one throws.
 */
declare function __stub_fire_trigger(
  whichTrigger: trigger,
  context?: StubContext,
): boolean;

/**
 * Runs the handler `TimerStart` stored for this timer, once, with the timer as
 * `GetExpiredTimer`'s answer. Throws for a timer never started or destroyed.
 */
declare function __stub_fire_timer(whichTimer: timer): void;

/** Appends `Name(arg, arg)` to the stub call log, as every stub does. */
declare function __stub_record(name: string, ...args: unknown[]): void;
