/** @noSelfInFile */

// The firing helpers of the reforged-test stubs that the tests call. They are
// Lua globals the shipped stub files define, not Natives, so the Typings do
// not declare them.

/** Runs the handler `TimerStart` stored for this timer, once. */
declare function __stub_fire_timer(whichTimer: timer): void;

/** Appends `Name(arg, arg)` to the stub call log, as every stub does. */
declare function __stub_record(name: string, ...args: unknown[]): void;
